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
    queryKey: [...ADMIN_KEY, status, page, perPage],
    queryFn: () => apiClient.get('/api/admin/feedback', { params: { status, page, perPage } }),
  });
}

export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiClient.patch(`/api/admin/feedback/${id}/status`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
}
