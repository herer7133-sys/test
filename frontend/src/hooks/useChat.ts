import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender?: { name: string; email: string };
  createdAt: string;
  attachments?: Array<{ fileName: string; url: string }>;
}

interface ChatGroup {
  id: string;
  name: string;
  type: 'private' | 'group' | 'project';
}

export function useChat(groupId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  // Connect to WebSocket
  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      path: '/chat',
      withCredentials: true,
      auth: {
        token: localStorage.getItem('access_token'),
      },
    });

    socketInstance.on('connect', () => {
      console.log('Connected to chat');
      socketInstance.emit('join_group', { groupId });
    });

    socketInstance.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', groupId] });
    });

    socketInstance.on('user_typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      // Handle typing indicators
      console.log(`${data.userName} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [groupId]);

  // Fetch messages
  const { data: fetchedMessages } = useQuery({
    queryKey: ['chat-messages', groupId],
    queryFn: () => api.get(`/chat/groups/${groupId}/messages`).then((res) => res.data),
  });

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages.reverse()); // API returns DESC, we need ASC for chat
    }
  }, [fetchedMessages]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      api.post('/chat/messages', { content, groupId }),
    onSuccess: (data) => {
      if (socket) {
        socket.emit('send_message', { content: data.data.content, groupId });
      }
      queryClient.invalidateQueries({ queryKey: ['chat-messages', groupId] });
    },
  });

  // Typing indicator
  const sendTypingStatus = (typing: boolean) => {
    if (socket) {
      socket.emit('typing', { groupId, isTyping: typing });
    }
  };

  return {
    messages,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
    sendTypingStatus,
  };
}
