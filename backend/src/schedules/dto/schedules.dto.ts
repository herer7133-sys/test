import { IsEnum, IsDateString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ScheduleType } from '../entities/work-schedule.entity';

export class CreateWorkScheduleDto {
  @IsOptional()
  @IsEnum(ScheduleType)
  type?: ScheduleType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  hoursPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @IsOptional()
  comment?: string;
}

export class CreateUserWorkRecordDto {
  @IsDateString()
  workDate: string;

  @IsNumber()
  @Min(0)
  @Max(24)
  hoursWorked: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nightHours?: number;

  @IsOptional()
  comment?: string;
}
