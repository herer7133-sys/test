import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatGroupDto, SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('groups')
  @ApiOperation({ summary: 'Создать чат-группу' })
  async createGroup(@Body() dto: CreateChatGroupDto, @Request() req) {
    return this.chatService.createGroup(dto, req.user.id);
  }

  @Get('groups/me')
  @ApiOperation({ summary: 'Получить мои группы' })
  async getMyGroups(@Request() req) {
    return this.chatService.getUserGroups(req.user.id);
  }

  @Get('groups/:id/messages')
  @ApiOperation({ summary: 'Получить сообщения группы' })
  async getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.chatService.getGroupMessages(id, +limit, +offset);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Отправить сообщение' })
  async sendMessage(@Body() dto: SendMessageDto & { groupId: string }, @Request() req) {
    return this.chatService.sendMessage({ ...dto, senderId: req.user.id });
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Удалить сообщение' })
  async deleteMessage(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.chatService.deleteMessage(id, req.user.id);
  }

  @Get('groups/:id/search')
  @ApiOperation({ summary: 'Поиск сообщений в группе' })
  async searchMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('q') query: string,
  ) {
    return this.chatService.searchMessages(id, query);
  }
}
