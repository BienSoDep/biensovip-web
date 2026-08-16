import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useFengShuiLookup() {
  return useMutation({
    mutationFn: ({ birthDate, purpose, budget, vehicle }) =>
      apiClient.post('/api/fengshui/lookup', { birthDate, purpose, budget, vehicle }),
  });
}

export function useSaveFengShuiHistory() {
  return useMutation({
    mutationFn: ({ birthDate }) => apiClient.post('/api/fengshui/history', { birthDate }),
  });
}

export function useFengShuiHistory(enabled) {
  return useQuery({
    queryKey: ['fengshui-history'],
    queryFn: () => apiClient.get('/api/fengshui/history'),
    enabled,
  });
}
