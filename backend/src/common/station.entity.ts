import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Party } from './party.entity';
import { Sensor } from '../sensors/sensor.entity';

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  coordinates?: { lat: number; lng: number };

  @Column({ type: 'text', nullable: true })
  address?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Party, (party) => party.stations, { onDelete: 'CASCADE' })
  party: Party;

  @Column({ nullable: true })
  partyId: number;

  @OneToMany(() => Sensor, (sensor) => sensor.currentLocation)
  currentLocationSensors: Sensor[];

  @OneToMany(() => Sensor, (sensor) => sensor.assignedStation)
  assignedSensors: Sensor[];
}
