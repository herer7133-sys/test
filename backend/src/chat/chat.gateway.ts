import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const user = client.data.user;
    if (!user) {
      client.disconnect();
      return;
    }

    // Join user's personal room for direct messages
    client.join(`user:${user.id}`);
    
    // Join all groups the user is a member of
    const groups = await this.chatService.getUserGroups(user.id);
    groups.forEach((group) => {
      client.join(`group:${group.id}`);
    });

    console.log(`User ${user.email} connected to chat`);
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      console.log(`User ${user.email} disconnected from chat`);
    }
  }

  @SubscribeMessage('join_group')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { groupId: string },
  ) {
    const user = client.data.user;
    client.join(`group:${payload.groupId}`);
    return { event: 'joined_group', data: { groupId: payload.groupId } };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const user = client.data.user;
    
    try {
      const message = await this.chatService.sendMessage({
        ...payload,
        senderId: user.id,
        groupId: payload.groupId, // Assuming groupId is passed in payload
      });

      // Broadcast to group room
      this.server.to(`group:${message.groupId}`).emit('new_message', message);

      return { event: 'message_sent', data: message };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { groupId: string; isTyping: boolean },
  ) {
    const user = client.data.user;
    client.to(`group:${payload.groupId}`).emit('user_typing', {
      userId: user.id,
      userName: user.name,
      isTyping: payload.isTyping,
      groupId: payload.groupId,
    });
  }
}
