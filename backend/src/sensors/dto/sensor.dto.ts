import { IsString, IsOptional, IsNumber, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SensorStatus } from './sensor.entity';

export class CreateSensorDto {
  @ApiProperty({ example: 'SN-12345678' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  serialNumber: string;

  @ApiProperty({ example: 'GeoSense Pro X1' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  model: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Calibration due date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  calibrationDue?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSensorDto {
  @ApiPropertyOptional({ example: 'GeoSense Pro X1' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsString()
  calibrationDue?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class MoveSensorDto {
  @ApiProperty({ description: 'Destination station ID' })
  @IsNumber()
  toLocationId: number;

  @ApiPropertyOptional({ description: 'Reason for movement' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SensorStatusDto {
  @ApiProperty({ enum: ['warehouse', 'in_transit', 'installed', 'maintenance', 'calibration', 'writeoff'] })
  @IsEnum(['warehouse', 'in_transit', 'installed', 'maintenance', 'calibration', 'writeoff'])
  status: SensorStatus;
}
