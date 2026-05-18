import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TrainingMaterial } from './training-material.entity';

@Entity('material_resources')
export class MaterialResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  fileType: string; // pdf, docx, xlsx, etc.

  @Column()
  filePath: string; // Ссылка на файл в MinIO

  @ManyToOne(() => TrainingMaterial, (material) => material.resources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material: TrainingMaterial;

  @Column()
  materialId: string;
}
