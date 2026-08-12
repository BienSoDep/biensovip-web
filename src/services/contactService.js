import { useMutation } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useSubmitContact() {
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/contact-requests', body),
  });
}
