import { useMutation } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useFengShuiLookup() {
  return useMutation({
    mutationFn: (birthDate) =>
      apiClient.post('/api/fengshui/lookup', { birthDate }),
  });
}
