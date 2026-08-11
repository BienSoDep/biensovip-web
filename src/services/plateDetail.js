import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function usePlateDetail(id) {
  return useQuery({
    queryKey: ['plate-detail', id],
    queryFn: () => apiClient.get(`/api/plates/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useSimilarPlates(id, limit = 8) {
  return useQuery({
    queryKey: ['plate-similar', id, limit],
    queryFn: () => apiClient.get(`/api/plates/${id}/similar?limit=${limit}`),
    enabled: !!id,
  });
}

export function useLogPlateView() {
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/plates/${id}/view`),
  });
}

export function useLogPlateContact() {
  return useMutation({
    mutationFn: ({ id, action }) => apiClient.post(`/api/plates/${id}/contact-log`, { action }),
  });
}
