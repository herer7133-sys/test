import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { Station } from '../common/station.entity';
import { User } from '../users/user.entity';

export type SensorStatus = 'warehouse' | 'in_transit' | 'installed' | 'maintenance' | 'calibration' | 'writeoff';

@Entity('sensors')
@Unique(['serialNumber', 'model'])
export class Sensor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true })
  token: string;

  @Column({ length: 100 })
  serialNumber: string;

  @Column({ length: 100 })
  model: string;

  @Column({ length: 50, default: 'warehouse' })
  status: SensorStatus;

  @Column({ type: 'date', nullable: true })
  calibrationDue?: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  aiRiskScore: number;

  @ManyToOne(() => Station, (station) => station.currentLocationSensors, { nullable: true })
  currentLocation?: Station;

  @Column({ nullable: true })
  currentLocationId?: number;

  @ManyToOne(() => Station, (station) => station.assignedSensors, { nullable: true })
  assignedStation?: Station;

  @Column({ nullable: true })
  assignedStationId?: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => SensorDocument, (doc) => doc.sensor)
  documents: SensorDocument[];

  @OneToMany(() => MovementRequest, (req) => req.sensor)
  movementRequests: MovementRequest[];
}

@Entity('sensor_documents')
export class SensorDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sensor, (sensor) => sensor.documents, { onDelete: 'CASCADE' })
  sensor: Sensor;

  @Column()
  sensorId: number;

  @Column({ length: 500 })
  filePath: string;

  @Column({ length: 50 })
  docType: string; // passport|certificate|manual

  @ManyToOne(() => User, { nullable: true })
  uploadedBy?: User;

  @Column({ nullable: true })
  uploadedById?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

@Entity('movement_requests')
export class MovementRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Sensor, (sensor) => sensor.movementRequests, { onDelete: 'CASCADE' })
  sensor: Sensor;

  @Column()
  sensorId: number;

  @ManyToOne(() => Station, { nullable: true })
  fromLocation?: Station;

  @Column({ nullable: true })
  fromLocationId?: number;

  @ManyToOne(() => Station)
  toLocation: Station;

  @Column()
  toLocationId: number;

  @Column({ length: 50, default: 'pending' })
  status: string; // pending|approved|rejected|completed

  @ManyToOne(() => User, { nullable: true })
  requestedBy?: User;

  @Column({ nullable: true })
  requestedById?: number;

  @ManyToOne(() => User, { nullable: true })
  approvedBy?: User;

  @Column({ nullable: true })
  approvedById?: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
