import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Task } from './task.entity';

@Entity('task_checklist')
export class TaskChecklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  text: string;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => Task, (task) => task.checklist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'task_id' })
  taskId: string;

  @CreateDateColumn()
  createdAt: Date;
}
