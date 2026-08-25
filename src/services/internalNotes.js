import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useInternalNotes(entityType, entityId) {
  return useQuery({
    queryKey: ['internal-notes', entityType, entityId],
    queryFn: () => apiClient.get(`/api/admin/internal-notes?entityType=${entityType}&entityId=${entityId}`),
    enabled: !!entityId,
  });
}

export function useAddInternalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, content }) => apiClient.post('/api/admin/internal-notes', { entityType, entityId, content }),
    onSuccess: (_, { entityType, entityId }) => qc.invalidateQueries({ queryKey: ['internal-notes', entityType, entityId] }),
  });
}

export function useDeleteInternalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => apiClient.delete(`/api/admin/internal-notes/${id}`),
    onSuccess: (_, { entityType, entityId }) => qc.invalidateQueries({ queryKey: ['internal-notes', entityType, entityId] }),
  });
}
