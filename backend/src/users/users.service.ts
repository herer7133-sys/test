import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(page = 1, limit = 20, filters?: { role?: string; partyId?: number }): Promise<{ users: User[]; total: number }> {
    const query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.party', 'party');

    if (filters?.role) {
      query.andWhere('role.name = :role', { role: filters.role });
    }

    if (filters?.partyId) {
      query.andWhere('user.partyId = :partyId', { partyId: filters.partyId });
    }

    query.skip((page - 1) * limit).take(limit);

    const [users, total] = await query.getManyAndCount();

    return { users, total };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'party'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateRole(userId: number, roleName: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    user.role = role;
    return this.userRepository.save(user);
  }

  async deactivate(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    return this.userRepository.save(user);
  }

  async activate(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    return this.userRepository.save(user);
  }
}
