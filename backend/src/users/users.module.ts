import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserBackupCode } from './user.entity';
import { Role } from './role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserBackupCode, Role])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
