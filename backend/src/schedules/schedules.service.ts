import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WorkSchedule, ScheduleType } from './entities/work-schedule.entity';
import { UserWorkRecord } from './entities/user-work-record.entity';
import { CreateWorkScheduleDto, CreateUserWorkRecordDto } from './dto/schedules.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(WorkSchedule)
    private scheduleRepo: Repository<WorkSchedule>,
    @InjectRepository(UserWorkRecord)
    private recordRepo: Repository<UserWorkRecord>,
  ) {}

  // Сchedules
  async createSchedule(userId: string, dto: CreateWorkScheduleDto): Promise<WorkSchedule> {
    const schedule = this.scheduleRepo.create({
      ...dto,
      userId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
    return this.scheduleRepo.save(schedule);
  }

  async getUserSchedules(userId: string, startDate?: Date, endDate?: Date): Promise<WorkSchedule[]> {
    const where: any = { userId };
    
    if (startDate && endDate) {
      where.startDate = Between(startDate, endDate);
    }
    
    return this.scheduleRepo.find({
      where,
      order: { startDate: 'DESC' },
    });
  }

  async removeSchedule(id: string): Promise<void> {
    const schedule = await this.scheduleRepo.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('Запись графика не найдена');
    }
    await this.scheduleRepo.remove(schedule);
  }

  // Work records
  async createRecord(userId: string, dto: CreateUserWorkRecordDto): Promise<UserWorkRecord> {
    const record = this.recordRepo.create({
      ...dto,
      userId,
      workDate: new Date(dto.workDate),
    });
    return this.recordRepo.save(record);
  }

  async getUserRecords(userId: string, startDate?: Date, endDate?: Date): Promise<UserWorkRecord[]> {
    const where: any = { userId };
    
    if (startDate && endDate) {
      where.workDate = Between(startDate, endDate);
    }
    
    return this.recordRepo.find({
      where,
      order: { workDate: 'DESC' },
    });
  }

  async getOvertimeSummary(userId: string, month: number, year: number): Promise<{ totalOvertime: number; totalNightHours: number }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.recordRepo.find({
      where: {
        userId,
        workDate: Between(startDate, endDate),
      },
    });

    const totalOvertime = records.reduce((sum, r) => sum + r.overtimeHours, 0);
    const totalNightHours = records.reduce((sum, r) => sum + r.nightHours, 0);

    return { totalOvertime, totalNightHours };
  }

  async removeRecord(id: string): Promise<void> {
    const record = await this.recordRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('Запись о работе не найдена');
    }
    await this.recordRepo.remove(record);
  }
}
