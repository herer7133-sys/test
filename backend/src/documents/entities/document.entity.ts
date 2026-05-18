import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../auth/user.entity';
import { DocumentVersion } from './document-version.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fileType: string | null;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number | null;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  currentVersion: string | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @Column({ name: 'uploaded_by_id' })
  uploadedById: string;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'folder_id' })
  folder: DocumentFolder | null;

  @Column({ name: 'folder_id', nullable: true })
  folderId: string | null;

  @Column({ type: 'uuid', nullable: true })
  partyId: string | null;

  @Column({ type: 'uuid', nullable: true })
  stationId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @OneToMany(() => DocumentVersion, (version) => version.document, { cascade: true })
  versions: DocumentVersion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('document_folders')
export class DocumentFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => DocumentFolder, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: DocumentFolder | null;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  partyId: string | null;

  @Column({ type: 'uuid', nullable: true })
  stationId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
