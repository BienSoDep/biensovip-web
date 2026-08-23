import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useRegisterCollaborator() {
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/collaborators/register', body),
  });
}

export function useCollaboratorDashboard(code) {
  return useQuery({
    queryKey: ['collaborator-dashboard', code],
    queryFn: () => apiClient.get(`/api/collaborators/dashboard/${encodeURIComponent(code)}`),
    enabled: !!code,
    retry: false,
  });
}
