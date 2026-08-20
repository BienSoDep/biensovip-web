import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useAdminCollaborators(q) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return useQuery({
    queryKey: ['admin-collaborators', q ?? ''],
    queryFn: () => apiClient.get(`/api/admin/collaborators${qs}`),
  });
}

export function useUpdateCollaboratorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/api/admin/collaborators/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-collaborators'] }),
  });
}
