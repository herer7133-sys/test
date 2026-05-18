import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Document } from './document.entity';
import { User } from '../auth/user.entity';

@Entity('document_versions')
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  version: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'text', nullable: true })
  changeDescription: string | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @Column({ name: 'uploaded_by_id' })
  uploadedById: string;

  @ManyToOne(() => Document, (document) => document.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ name: 'document_id' })
  documentId: string;

  @CreateDateColumn()
  createdAt: Date;
}
