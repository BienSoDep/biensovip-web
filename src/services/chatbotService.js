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

// Kill-switch dev — ẩn hẳn widget/FAB khi feature_flags["ai_chatbot_enabled"] tắt.
export function useChatbotWidgetEnabled() {
  return useQuery({
    queryKey: ['chatbot', 'widget-enabled'],
    queryFn: () => apiClient.get('/api/chatbot/widget-enabled'),
    staleTime: 60_000,
  });
}
