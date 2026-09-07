import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// UC38 — quản lý cấu hình "số liệu hiển thị" ảo (8 loại: bật/tắt + hệ số + trần).
export function useVanityMetrics() {
  return useQuery({
    queryKey: ['vanity-metrics'],
    queryFn: () => apiClient.get('/api/admin/vanity-metrics'),
  });
}

export function useUpdateVanityMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, ...data }) => apiClient.patch(`/api/admin/vanity-metrics/${type}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vanity-metrics'] }),
  });
}
