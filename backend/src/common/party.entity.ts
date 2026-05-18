import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Station } from './station.entity';

@Entity('parties')
export class Party {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20, nullable: true })
  inn?: string;

  @Column({ length: 20, nullable: true })
  kpp?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => User, (user) => user.party)
  users: User[];

  @OneToMany(() => Station, (station) => station.party)
  stations: Station[];
}
