import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Counterparty } from './counterparty.entity';
import { User } from '../auth/user.entity';

export enum ActivityType {
  CALL = 'call',
  MEETING = 'meeting',
  EMAIL = 'email',
  TASK = 'task',
  NOTE = 'note',
  OTHER = 'other',
}

@Entity('crm_activities')
export class CrmActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
    default: ActivityType.OTHER,
  })
  type: ActivityType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => Counterparty, (counterparty) => counterparty.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'counterparty_id' })
  counterparty: Counterparty;

  @Column({ name: 'counterparty_id' })
  counterpartyId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
