import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TrainingMaterial } from './training-material.entity';
import { User } from '../../users/entities/user.entity';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TrainingMaterial, (material) => material.userProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material: TrainingMaterial;

  @Column()
  materialId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @Column({ default: 0 })
  progressPercent: number; // 0-100

  @Column({ default: false })
  completed: boolean;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
