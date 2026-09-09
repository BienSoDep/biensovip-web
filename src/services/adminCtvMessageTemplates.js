import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const KEY = ['admin-ctv-message-templates'];

export function useAdminCtvMessageTemplates() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiClient.get('/api/admin/ctv-message-templates'),
  });
}

export function useCreateCtvMessageTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/ctv-message-templates', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCtvMessageTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiClient.put(`/api/admin/ctv-message-templates/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCtvMessageTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/ctv-message-templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
