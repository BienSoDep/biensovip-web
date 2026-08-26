import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useSendChatbotMessage() {
  return useMutation({
    mutationFn: ({ sessionId, message }) => apiClient.post('/api/chatbot/message', { sessionId, message }),
  });
}

export function useChatbotHistory(sessionId) {
  return useQuery({
    queryKey: ['chatbot', 'history', sessionId],
    queryFn: () => apiClient.get(`/api/chatbot/history/${sessionId}`),
    enabled: !!sessionId,
    retry: false,
  });
}
