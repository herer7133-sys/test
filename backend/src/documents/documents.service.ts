import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentFolder } from '../entities/document.entity';
import { DocumentVersion } from '../entities/document-version.entity';
import { CreateDocumentDto, UpdateDocumentDto, CreateFolderDto } from '../dto/document.dto';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(DocumentFolder)
    private readonly folderRepo: Repository<DocumentFolder>,
    @InjectRepository(DocumentVersion)
    private readonly versionRepo: Repository<DocumentVersion>,
    private readonly minioService: MinioService,
  ) {}

  async createFolder(dto: CreateFolderDto, userId: string): Promise<DocumentFolder> {
    if (dto.parentId) {
      const parent = await this.folderRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    const folder = this.folderRepo.create({
      ...dto,
      createdById: userId,
    });
    return this.folderRepo.save(folder);
  }

  async getFolders(partyId?: string, stationId?: string): Promise<DocumentFolder[]> {
    const query = this.folderRepo.createQueryBuilder('folder');
    if (partyId) query.andWhere('folder.partyId = :partyId', { partyId });
    if (stationId) query.andWhere('folder.stationId = :stationId', { stationId });
    query.leftJoinAndSelect('folder.parent', 'parent');
    query.orderBy('folder.createdAt', 'ASC');
    return query.getMany();
  }

  async uploadDocument(
    dto: CreateDocumentDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Document> {
    if (dto.folderId) {
      const folder = await this.folderRepo.findOne({ where: { id: dto.folderId } });
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
    }

    const fileName = `${crypto.randomUUID()}-${file.originalname}`;
    const bucket = process.env.MINIO_BUCKET || 'documents';
    
    await this.minioService.uploadFile(bucket, fileName, file.buffer, file.mimetype);

    const filePath = `/${bucket}/${fileName}`;
    const version = '1.0';

    const document = this.documentRepo.create({
      ...dto,
      filePath,
      fileType: file.mimetype,
      fileSize: file.size,
      currentVersion: version,
      uploadedById: userId,
    });

    const savedDoc = await this.documentRepo.save(document);

    const docVersion = this.versionRepo.create({
      version,
      filePath,
      fileSize: file.size,
      uploadedById: userId,
      documentId: savedDoc.id,
    });
    await this.versionRepo.save(docVersion);

    return this.documentRepo.findOne({
      where: { id: savedDoc.id },
      relations: ['uploadedBy', 'folder'],
    });
  }

  async findAll(filters: {
    folderId?: string;
    partyId?: string;
    stationId?: string;
    tags?: string[];
  }): Promise<Document[]> {
    const query = this.documentRepo.createQueryBuilder('doc');

    if (filters.folderId) {
      query.andWhere('doc.folderId = :folderId', { folderId: filters.folderId });
    }
    if (filters.partyId) {
      query.andWhere('doc.partyId = :partyId', { partyId: filters.partyId });
    }
    if (filters.stationId) {
      query.andWhere('doc.stationId = :stationId', { stationId: filters.stationId });
    }
    if (filters.tags && filters.tags.length > 0) {
      query.andWhere('doc.tags && :tags', { tags: filters.tags });
    }

    query.leftJoinAndSelect('doc.uploadedBy', 'uploader');
    query.leftJoinAndSelect('doc.folder', 'folder');
    query.orderBy('doc.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Document> {
    const doc = await this.documentRepo.findOne({
      where: { id },
      relations: ['uploadedBy', 'folder', 'versions'],
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto, userId: string): Promise<Document> {
    const doc = await this.findOne(id);

    if (doc.uploadedById !== userId) {
      throw new ForbiddenException('You do not have permission to update this document');
    }

    Object.assign(doc, dto);
    return this.documentRepo.save(doc);
  }

  async createVersion(
    id: string,
    file: Express.Multer.File,
    userId: string,
    changeDescription?: string,
  ): Promise<Document> {
    const doc = await this.findOne(id);

    if (doc.uploadedById !== userId) {
      throw new ForbiddenException('You do not have permission to upload a new version');
    }

    const fileName = `${crypto.randomUUID()}-${file.originalname}`;
    const bucket = process.env.MINIO_BUCKET || 'documents';
    
    await this.minioService.uploadFile(bucket, fileName, file.buffer, file.mimetype);

    const filePath = `/${bucket}/${fileName}`;
    const versions = await this.versionRepo.find({
      where: { documentId: id },
      order: { createdAt: 'DESC' },
    });
    const lastVersionNum = parseInt(versions[0]?.version.split('.')[0] || '0');
    const newVersion = `${lastVersionNum + 1}.0`;

    const docVersion = this.versionRepo.create({
      version: newVersion,
      filePath,
      fileSize: file.size,
      changeDescription,
      uploadedById: userId,
      documentId: id,
    });
    await this.versionRepo.save(docVersion);

    doc.filePath = filePath;
    doc.fileType = file.mimetype;
    doc.fileSize = file.size;
    doc.currentVersion = newVersion;
    await this.documentRepo.save(doc);

    return this.documentRepo.findOne({
      where: { id },
      relations: ['versions'],
    });
  }

  async getDownloadUrl(id: string, userId: string): Promise<{ url: string; expires: number }> {
    const doc = await this.findOne(id);
    
    // Log download for audit (simplified)
    console.log(`User ${userId} downloading document ${id}`);

    const bucket = process.env.MINIO_BUCKET || 'documents';
    const key = doc.filePath.replace(`/${bucket}/`, '');
    
    const url = await this.minioService.getPresignedUrl(bucket, key, 3600); // 1 hour expiry
    return { url, expires: 3600 };
  }

  async delete(id: string, userId: string): Promise<void> {
    const doc = await this.findOne(id);

    if (doc.uploadedById !== userId) {
      throw new ForbiddenException('You can only delete documents you uploaded');
    }

    // Delete from MinIO
    const bucket = process.env.MINIO_BUCKET || 'documents';
    const key = doc.filePath.replace(`/${bucket}/`, '');
    await this.minioService.deleteFile(bucket, key);

    await this.documentRepo.remove(doc);
  }

  async search(query: string, partyId?: string): Promise<Document[]> {
    const qb = this.documentRepo
      .createQueryBuilder('doc')
      .where('doc.title ILIKE :query', { query: `%${query}%` })
      .orWhere('doc.description ILIKE :query', { query: `%${query}%` });

    if (partyId) {
      qb.andWhere('doc.partyId = :partyId', { partyId });
    }

    qb.leftJoinAndSelect('doc.uploadedBy', 'uploader');
    qb.orderBy('doc.createdAt', 'DESC');

    return qb.getMany();
  }
}
