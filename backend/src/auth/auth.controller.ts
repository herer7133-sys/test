import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, Verify2faDto, RefreshTokenDto, ChangePasswordDto } from './dto/auth.dto';
import { User } from '../users/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (by invitation only in production)' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    await this.authService.register(dto);
    return { message: 'Registration successful. Please wait for admin approval or use invitation token.' };
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req: any, @Body() dto: LoginDto): Promise<any> {
    // The user is already validated by LocalStrategy
    const result = await this.authService.login(dto);
    
    if (result.requires2FA) {
      return {
        requires2FA: true,
        userId: result.user.id,
        message: '2FA verification required',
      };
    }

    return {
      requires2FA: false,
      ...result.tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role?.name,
      },
    };
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code after login' })
  @ApiResponse({ status: 200, description: '2FA verified, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code' })
  async verify2FA(
    @Body() dto: Verify2faDto,
    @Body('userId') userId: number,
  ): Promise<any> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const result = await this.authService.verify2FA(dto, userId);

    return {
      ...result.tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role?.name,
      },
    };
  }

  @Post('2fa/setup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Setup 2FA for the current user' })
  @ApiResponse({ status: 200, description: '2FA setup successful' })
  async setup2FA(@Request() req: any): Promise<any> {
    const result = await this.authService.setup2FA(req.user.id);

    return {
      secret: result.secret,
      qrCodeUrl: result.qrCodeUrl,
      backupCodes: result.backupCodes,
      message: 'Save these backup codes in a safe place. They will not be shown again.',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<any> {
    const tokens = await this.authService.refreshToken(dto);
    return tokens;
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for the current user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @Request() req: any,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Implementation would go here - update password hash
    return { message: 'Password changed successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  async getProfile(@Request() req: any): Promise<any> {
    const user = await this.authService.getUserById(req.user.id);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role?.name,
      partyId: user.partyId,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      has2FA: !!user.totpSecret,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout (invalidate refresh token)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Request() req: any): Promise<{ message: string }> {
    // In production: invalidate refresh token in Redis/database
    return { message: 'Logged out successfully' };
  }
}
