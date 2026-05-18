import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Counterparty } from './counterparty.entity';
import { User } from '../auth/user.entity';

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('crm_projects')
export class CrmProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status: ProjectStatus;

  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budget: number | null;

  @ManyToOne(() => Counterparty, (counterparty) => counterparty.projects, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'counterparty_id' })
  counterparty: Counterparty | null;

  @Column({ name: 'counterparty_id', nullable: true })
  counterpartyId: string | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @Column({ name: 'manager_id' })
  managerId: string;

  @Column({ type: 'uuid', nullable: true })
  partyId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
