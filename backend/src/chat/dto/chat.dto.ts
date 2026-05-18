import { IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ChatGroupType {
  PRIVATE = 'private',
  GROUP = 'group',
  PROJECT = 'project',
}

export class CreateChatGroupDto {
  @IsString()
  name: string;

  @IsEnum(ChatGroupType)
  type: ChatGroupType;

  @IsOptional()
  @IsString()
  partyId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @IsOptional()
  settings?: Record<string, any>;
}

export class SendMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionedUserIds?: string[];

  @IsOptional()
  @IsString()
  replyToMessageId?: string;
}

export class UploadAttachmentDto {
  @IsString()
  groupId: string;

  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsOptional()
  @IsString()
  description?: string;
}
