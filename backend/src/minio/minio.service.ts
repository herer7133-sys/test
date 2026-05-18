import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get('MINIO_PORT', '9000')),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'geocontrol_access'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'geocontrol_secret_change_me'),
    });

    // Create buckets if they don't exist
    const buckets = ['chat-attachments', 'sensor-documents', 'training-materials', 'documents'];
    for (const bucket of buckets) {
      const exists = await this.minioClient.bucketExists(bucket);
      if (!exists) {
        await this.minioClient.makeBucket(bucket, 'us-east-1');
        console.log(`Created bucket: ${bucket}`);
      }
    }
  }

  async uploadFile(bucket: string, fileName: string, buffer: Buffer, mimeType: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.minioClient.putObject(bucket, fileName, buffer, buffer.length, { 'Content-Type': mimeType }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getPresignedUrl(bucket: string, fileName: string, expirySeconds: number = 3600): Promise<string> {
    return this.minioClient.presignedGetObject(bucket, fileName, expirySeconds);
  }

  async deleteFile(bucket: string, fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.minioClient.removeObject(bucket, fileName, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getFile(bucket: string, fileName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.minioClient.getObject(bucket, fileName, (err, stream) => {
        if (err) return reject(err);
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    });
  }
}
