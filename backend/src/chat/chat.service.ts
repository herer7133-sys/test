import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatGroup } from './entities/chat-group.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateChatGroupDto, SendMessageDto } from './dto/chat.dto';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatGroup)
    private readonly chatGroupRepo: Repository<ChatGroup>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    private readonly minioService: MinioService,
  ) {}

  async createGroup(dto: CreateChatGroupDto, userId: string): Promise<ChatGroup> {
    const group = this.chatGroupRepo.create({
      ...dto,
      createdById: userId,
    });
    return this.chatGroupRepo.save(group);
  }

  async getUserGroups(userId: string): Promise<ChatGroup[]> {
    // In a real app, you'd query the many-to-many relation
    return this.chatGroupRepo.find({
      where: {}, // Add proper filtering based on membership
      relations: ['members'],
    });
  }

  async getGroupMessages(groupId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    return this.chatMessageRepo.find({
      where: { groupId, isDeleted: false },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async sendMessage(dto: SendMessageDto & { senderId: string; groupId: string }): Promise<ChatMessage> {
    const message = this.chatMessageRepo.create({
      content: dto.content,
      senderId: dto.senderId,
      groupId: dto.groupId,
      mentionedUserIds: dto.mentionedUserIds || [],
      replyToMessageId: dto.replyToMessageId,
    });
    return this.chatMessageRepo.save(message);
  }

  async uploadAttachment(
    groupId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ id: string; url: string }> {
    // Upload to MinIO
    const fileName = `${groupId}/${Date.now()}-${file.originalname}`;
    await this.minioService.uploadFile('chat-attachments', fileName, file.buffer, file.mimetype);

    // Generate presigned URL (expires in 7 days)
    const url = await this.minioService.getPresignedUrl('chat-attachments', fileName, 7 * 24 * 60 * 60);

    return {
      id: fileName, // Using fileName as ID for simplicity
      url,
    };
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.chatMessageRepo.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }
    message.isDeleted = true;
    message.content = '[Сообщение удалено]';
    await this.chatMessageRepo.save(message);
  }

  async searchMessages(groupId: string, query: string): Promise<ChatMessage[]> {
    return this.chatMessageRepo
      .createQueryBuilder('message')
      .where('message.groupId = :groupId', { groupId })
      .andWhere('message.content ILIKE :query', { query: `%${query}%` })
      .andWhere('message.isDeleted = false')
      .orderBy('message.createdAt', 'DESC')
      .getMany();
  }
}
