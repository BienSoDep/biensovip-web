import { useMutation } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useSendChatbotMessage() {
  return useMutation({
    mutationFn: ({ sessionId, message }) => apiClient.post('/api/chatbot/message', { sessionId, message }),
  });
}
