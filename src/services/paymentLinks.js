import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const KEY = ['admin', 'payment-links'];

// UC14 Phương án B — admin sinh link ZaloPay cho 1 yêu cầu liên hệ, gửi thủ công qua Zalo OA.
// Backend KHÔNG giữ tiền — chỉ tạo link + nhận webhook kết quả.
export function useCreatePaymentLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/payment-links', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAdminPaymentLinks(filter = {}) {
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.page) params.set('page', filter.page);
  if (filter.limit) params.set('limit', filter.limit);
  const qs = params.toString();
  return useQuery({
    queryKey: [...KEY, filter],
    queryFn: () => apiClient.get(`/api/admin/payment-links${qs ? `?${qs}` : ''}`),
  });
}
