import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

import { User, UserBackupCode } from '../users/user.entity';
import { Role } from '../users/role.entity';
import { RegisterDto, LoginDto, Verify2faDto, RefreshTokenDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  partyId?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserBackupCode)
    private readonly backupCodeRepository: Repository<UserBackupCode>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, invitationToken?: string): Promise<User> {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Get default role (user) or by invitation
    let role = await this.roleRepository.findOne({ where: { name: 'user' } });
    if (!role) {
      throw new BadRequestException('Default role not found');
    }

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Create user
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role,
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  async login(dto: LoginDto): Promise<{ user: User; requires2FA: boolean; tokens?: AuthTokens }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: ['role'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.totpSecret) {
      return { user, requires2FA: true };
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return { user, requires2FA: false, tokens };
  }

  async verify2FA(dto: Verify2faDto, userId: number): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'backupCodes'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.totpSecret) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Check if it's a backup code
    if (dto.isBackupCode) {
      const backupCode = user.backupCodes?.find(
        (code) => !code.used && await argon2.verify(code.codeHash, dto.token),
      );

      if (!backupCode) {
        throw new UnauthorizedException('Invalid backup code');
      }

      backupCode.used = true;
      backupCode.usedAt = new Date();
      await this.backupCodeRepository.save(backupCode);
    } else {
      // Verify TOTP
      const secret = user.totpSecret.toString('utf-8');
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: dto.token,
        window: 1, // Allow 1 step drift
      });

      if (!verified) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return { user, tokens };
  }

  async setup2FA(userId: number): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.totpSecret) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `GeoControl (${user.email})`,
      length: 32,
    });

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () => 
      randomBytes(5).toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-')
    );

    // Hash and save backup codes
    const hashedCodes = await Promise.all(
      backupCodes.map((code) => argon2.hash(code)),
    );

    for (const codeHash of hashedCodes) {
      const backupCode = this.backupCodeRepository.create({
        userId,
        codeHash,
        used: false,
      });
      await this.backupCodeRepository.save(backupCode);
    }

    // Save encrypted secret (in production, encrypt with AES-256 before saving)
    user.totpSecret = Buffer.from(secret.base32);
    await this.userRepository.save(user);

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    const payload = await this.jwtService.verifyAsync<{ sub: number; refreshTokenId: string }>(
      dto.refreshToken,
      { secret: this.configService.get('JWT_SECRET') },
    );

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['role'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // In production, validate refreshTokenId against stored valid refresh tokens
    // For now, just generate new tokens
    return this.generateTokens(user);
  }

  async generateTokens(user: User): Promise<AuthTokens> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      partyId: user.partyId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, { expiresIn: '15m' }),
      this.jwtService.signAsync(
        { ...jwtPayload, refreshTokenId: randomBytes(16).toString('hex') },
        { expiresIn: '7d' },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['role', 'party'],
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
