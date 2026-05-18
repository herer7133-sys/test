import { IsString, IsOptional, IsNumber, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsString()
  partyId?: string;

  @IsOptional()
  @IsString()
  stationId?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateFolderDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  partyId?: string;

  @IsOptional()
  @IsString()
  stationId?: string;
}

export class MoveDocumentDto {
  @IsOptional()
  @IsString()
  folderId?: string;
}

export class DocumentVersionDto {
  @IsString()
  version: string;

  @IsOptional()
  @IsString()
  changeDescription?: string;
}
