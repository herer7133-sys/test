import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ChatWindowProps {
  groupId: string;
  groupName: string;
}

export function ChatWindow({ groupId, groupName }: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { messages, sendMessage, isSending, sendTypingStatus } = useChat(groupId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) return;

    sendMessage(messageText.trim());
    setMessageText('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    // Send typing indicator
    sendTypingStatus(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement file upload logic
      console.log('File selected:', file);
      setShowFileUpload(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-gray-900">{groupName}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.senderId === 'me'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-2 space-y-1">
                  {message.attachments.map((attachment, idx) => (
                    <a
                      key={idx}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center text-sm ${
                        message.senderId === 'me' ? 'text-blue-100' : 'text-blue-600'
                      } hover:underline`}
                    >
                      <PaperClipIcon className="w-4 h-4 mr-1" />
                      {attachment.fileName}
                    </a>
                  ))}
                </div>
              )}
              
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              <div className={`text-xs mt-1 ${message.senderId === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatTime(message.createdAt)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setShowFileUpload(!showFileUpload);
              if (!showFileUpload) {
                fileInputRef.current?.click();
              }
            }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          <input
            type="text"
            value={messageText}
            onChange={handleTyping}
            placeholder="Введите сообщение..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />

          <button
            type="submit"
            disabled={!messageText.trim() || isSending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>

        {showFileUpload && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Максимальный размер файла: 500 МБ
          </div>
        )}
      </form>
    </div>
  );
}
