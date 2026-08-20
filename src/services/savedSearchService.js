import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const KEY = ['me', 'saved-searches'];

export function useSavedSearches() {
  return useQuery({ queryKey: KEY, queryFn: () => apiClient.get('/api/me/saved-searches'), staleTime: 30_000 });
}

export function useCreateSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/me/saved-searches', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiClient.patch(`/api/me/saved-searches/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/me/saved-searches/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
