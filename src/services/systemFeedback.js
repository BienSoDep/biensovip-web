import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const ADMIN_KEY = ['admin', 'feedback'];

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/feedback', body),
  });
}

export function useAdminFeedback(status, page = 1, perPage = 20) {
  return useQuery({
    queryKey: [...ADMIN_KEY, status || 'all', page, perPage],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (status && status !== 'all') qs.set('status', status);
      qs.set('page', String(page));
      qs.set('perPage', String(perPage));
      return apiClient.get(`/api/admin/feedback?${qs.toString()}`);
    },
  });
}

export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiClient.patch(`/api/admin/feedback/${id}/status`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
      qc.invalidateQueries({ queryKey: ['admin-notification-counts'] });
      qc.invalidateQueries({ queryKey: ['admin-notification-feed'] });
    },
  });
}
