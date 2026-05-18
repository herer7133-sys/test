import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ScheduleType {
  SHIFT = 'shift',
  VACATION = 'vacation',
  SICK_LEAVE = 'sick_leave',
  BUSINESS_TRIP = 'business_trip',
}

@Entity('work_schedules')
export class WorkSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: ScheduleType,
    default: ScheduleType.SHIFT,
  })
  type: ScheduleType;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ nullable: true })
  hoursPerDay: number; // Для смен - количество часов в день

  @Column({ default: 0 })
  overtimeHours: number; // Переработки

  @Column('text', { nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
