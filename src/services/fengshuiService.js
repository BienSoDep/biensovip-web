import { useMutation } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useFengShuiLookup() {
  return useMutation({
    mutationFn: (birthDate) =>
      apiClient.post('/api/fengshui/lookup', { birthDate }),
  });
}

export function useSaveFengShuiHistory() {
  return useMutation({
    mutationFn: ({ birthDate, element }) =>
      apiClient.post('/api/fengshui/history', { birthDate, element }),
  });
}
