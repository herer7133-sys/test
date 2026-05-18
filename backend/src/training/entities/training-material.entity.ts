import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MaterialStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('training_materials')
export class TrainingMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: MaterialStatus,
    default: MaterialStatus.DRAFT,
  })
  status: MaterialStatus;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ default: 0 })
  durationSeconds: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
