import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { TrainingMaterial } from './entities/training-material.entity';
import { MaterialResource } from './entities/material-resource.entity';
import { UserProgress } from './entities/user-progress.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingMaterial, MaterialResource, UserProgress]),
    UsersModule,
  ],
  controllers: [TrainingController],
  providers: [TrainingService],
  exports: [TrainingService],
})
export class TrainingModule {}
