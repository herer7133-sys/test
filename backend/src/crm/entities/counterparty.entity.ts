import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { CrmActivity } from './crm-activity.entity';
import { CrmProject } from './crm-project.entity';

@Entity('counterparties')
export class Counterparty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  inn: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  kpp: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactPerson: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User | null;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId: string | null;

  @Column({ type: 'uuid', nullable: true })
  partyId: string | null;

  @OneToMany(() => CrmActivity, (activity) => activity.counterparty, { cascade: true })
  activities: CrmActivity[];

  @OneToMany(() => CrmProject, (project) => project.counterparty, { cascade: true })
  projects: CrmProject[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
