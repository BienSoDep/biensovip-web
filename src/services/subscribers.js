import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const KEY = ['admin', 'subscribers'];

// Public — đăng ký email nhận thông báo (footer/banner). Không cần đăng nhập.
export function useSubscribe() {
  return useMutation({
    mutationFn: ({ email, source, fullName }) => apiClient.post('/api/subscribe', { email, source, fullName }),
  });
}

export function useAdminSubscribers({ q, page = 1, perPage = 20 } = {}) {
  return useQuery({
    queryKey: [...KEY, { q, page, perPage }],
    queryFn: () => apiClient.get('/api/admin/subscribers', { params: { q, page, perPage } }),
    placeholderData: (prev) => prev,
  });
}

export function useSubscriberActiveCount() {
  return useQuery({
    queryKey: [...KEY, 'active-count'],
    queryFn: () => apiClient.get('/api/admin/subscribers/active-count'),
  });
}

export function useRemoveSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/subscribers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAdminBlasts({ page = 1, perPage = 20 } = {}) {
  return useQuery({
    queryKey: [...KEY, 'blasts', { page, perPage }],
    queryFn: () => apiClient.get('/api/admin/subscribers/blasts', { params: { page, perPage } }),
    placeholderData: (prev) => prev,
  });
}
