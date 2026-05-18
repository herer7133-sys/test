import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_work_records')
export class UserWorkRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @Column()
  workDate: Date;

  @Column({ default: 0 })
  hoursWorked: number; // Фактически отработано часов

  @Column({ default: 0 })
  overtimeHours: number; // Переработка за день

  @Column({ default: 0 })
  nightHours: number; // Ночные часы

  @Column('text', { nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
