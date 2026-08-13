import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// --- MeaningTemplate (mẫu chung) ---

export function useMeaningTemplates(filters = {}) {
  const params = {};
  if (filters.category) params.category = filters.category;
  if (filters.keyword) params.keyword = filters.keyword;
  return useQuery({
    queryKey: ['meaning-templates', filters],
    queryFn: () => apiClient.get('/api/admin/meanings/templates', { params }),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/meanings/templates', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meaning-templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiClient.put(`/api/admin/meanings/templates/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meaning-templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/meanings/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meaning-templates'] }),
  });
}

// --- PlateMeaning (ý nghĩa riêng từng biển) ---

export function usePlateMeanings(plateId) {
  return useQuery({
    queryKey: ['plate-meanings', plateId],
    queryFn: () => apiClient.get(`/api/admin/plates/${plateId}/meanings`),
    enabled: !!plateId,
  });
}

function invalidatePlateMeanings(qc, plateId) {
  qc.invalidateQueries({ queryKey: ['plate-meanings', plateId] });
  qc.invalidateQueries({ queryKey: ['admin-plate', plateId] });
}

export function useCreatePlateMeaning(plateId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post(`/api/admin/plates/${plateId}/meanings`, body),
    onSuccess: () => invalidatePlateMeanings(qc, plateId),
  });
}

export function useUpdatePlateMeaning(plateId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiClient.put(`/api/admin/plates/${plateId}/meanings/${id}`, body),
    onSuccess: () => invalidatePlateMeanings(qc, plateId),
  });
}

export function useDeletePlateMeaning(plateId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/plates/${plateId}/meanings/${id}`),
    onSuccess: () => invalidatePlateMeanings(qc, plateId),
  });
}

export function useReseedPlateMeanings(plateId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post(`/api/admin/plates/${plateId}/meanings/seed`, body),
    onSuccess: () => invalidatePlateMeanings(qc, plateId),
  });
}
