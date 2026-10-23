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

// ---------------- LIVE CHAT HYBRID HOOKS ----------------
const LIVE_SESSIONS_KEY = ['admin', 'live-chat', 'sessions'];
const CANNED_KEY = ['admin', 'live-chat', 'canned'];

export function useLiveChatSessions({ tab = 'all', q = '', page = 1, pageSize = 20 } = {}) {
  return useQuery({
    queryKey: [...LIVE_SESSIONS_KEY, tab, q, page, pageSize],
    queryFn: () => apiClient.get('/api/admin/live-chat/sessions', { params: { tab, q, page, pageSize } }),
    refetchInterval: 8000, // Tự động refetch định kỳ dự phòng ngoài SignalR
  });
}

export function useLiveChatSessionDetail(id) {
  return useQuery({
    queryKey: [...LIVE_SESSIONS_KEY, 'detail', id],
    queryFn: () => apiClient.get(`/api/admin/live-chat/sessions/${id}`),
    enabled: !!id,
  });
}

export function useSendStaffLiveMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content }) => apiClient.post(`/api/admin/live-chat/sessions/${sessionId}/messages`, { content }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [...LIVE_SESSIONS_KEY, 'detail', vars.sessionId] });
      qc.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY });
    },
  });
}

export function useTakeoverLiveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) => apiClient.post(`/api/admin/live-chat/sessions/${sessionId}/takeover`),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: [...LIVE_SESSIONS_KEY, 'detail', sessionId] });
      qc.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY });
    },
  });
}

export function useReturnToBotLiveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) => apiClient.post(`/api/admin/live-chat/sessions/${sessionId}/return-to-bot`),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: [...LIVE_SESSIONS_KEY, 'detail', sessionId] });
      qc.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY });
    },
  });
}

export function useResolveLiveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) => apiClient.post(`/api/admin/live-chat/sessions/${sessionId}/resolve`),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: [...LIVE_SESSIONS_KEY, 'detail', sessionId] });
      qc.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY });
    },
  });
}

export function useConvertLiveSessionToContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) => apiClient.post(`/api/admin/live-chat/sessions/${sessionId}/convert-to-contact`),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: [...LIVE_SESSIONS_KEY, 'detail', sessionId] });
      qc.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY });
    },
  });
}

export function useCannedResponses(category) {
  return useQuery({
    queryKey: [...CANNED_KEY, category],
    queryFn: () => apiClient.get('/api/admin/live-chat/canned', { params: { category } }),
  });
}

export function useSaveCannedResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/live-chat/canned', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CANNED_KEY }),
  });
}

export function useDeleteCannedResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/live-chat/canned/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: CANNED_KEY }),
  });
}
