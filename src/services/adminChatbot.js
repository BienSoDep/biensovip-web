import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const SESSIONS_KEY = ['admin', 'chatbot', 'sessions'];
const SETTINGS_KEY = ['admin', 'chatbot', 'settings'];

export function useAdminChatSessions(page = 1, limit = 20, keyword) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, page, limit, keyword],
    queryFn: () => apiClient.get('/api/admin/chatbot/sessions', { params: { page, limit, keyword } }),
    placeholderData: (prev) => prev,
  });
}

export function useAdminChatSessionDetail(id) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, id],
    queryFn: () => apiClient.get(`/api/admin/chatbot/sessions/${id}`),
    enabled: !!id,
  });
}

export function useDeleteChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/chatbot/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

export function useChatbotSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => apiClient.get('/api/admin/chatbot/settings'),
  });
}

export function useUpdateChatbotSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.put('/api/admin/chatbot/settings', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}

export function useChatbotStats(days = 7) {
  return useQuery({
    queryKey: ['admin', 'chatbot', 'stats', days],
    queryFn: () => apiClient.get('/api/admin/chatbot/stats', { params: { days } }),
  });
}
