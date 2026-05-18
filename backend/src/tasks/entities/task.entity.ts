import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Sensor } from '../sensors/entities/sensor.entity';
import { TaskStatus, TaskPriority } from '../dto/task.dto';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => Sensor, { nullable: true })
  @JoinColumn({ name: 'sensor_id' })
  sensor: Sensor;

  @Column({ name: 'sensor_id', nullable: true })
  sensorId: string;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'jsonb', default: [] })
  checklist: Array<{
    id: string;
    text: string;
    isCompleted: boolean;
    completedAt?: Date;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isOverdue: boolean;
}
