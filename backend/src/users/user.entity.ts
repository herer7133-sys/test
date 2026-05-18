import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Role } from './role.entity';
import { Party } from '../common/party.entity';

export type UserRole = 'guest' | 'user' | 'engineer' | 'supervisor' | 'admin' | 'superadmin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ type: 'bytea', nullable: true })
  totpSecret?: Buffer;

  @Column({ length: 100, nullable: true })
  firstName?: string;

  @Column({ length: 100, nullable: true })
  lastName?: string;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @Column({ nullable: true })
  roleId: number;

  @ManyToOne(() => Party, (party) => party.users, { nullable: true })
  party: Party;

  @Column({ nullable: true })
  partyId?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => UserBackupCode, (code) => code.user)
  backupCodes: UserBackupCode[];

  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
}

@Entity('user_backup_codes')
export class UserBackupCode {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.backupCodes, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @Column({ length: 255 })
  codeHash: string;

  @Column({ default: false })
  used: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
