import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { MaterialStatus } from '../entities/training-material.entity';

export class CreateTrainingMaterialDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;
}

export class UpdateTrainingMaterialDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;
}

export class UpdateUserProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent: number;

  @IsOptional()
  completed?: boolean;
}
