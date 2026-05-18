import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document, DocumentFolder } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { MinioModule } from '../minio/minio.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentFolder, DocumentVersion]),
    MinioModule,
    AuthModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
