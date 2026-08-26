import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// UC36 — ghi log click "Nhắn Zalo", fire-and-forget, không chặn window.open.
export function logZaloClick(plateId, source) {
  fetch(`${BASE_URL}/api/zalo-clicks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plateId: plateId || null, source }),
    keepalive: true,
  }).catch(() => {});
}

export function useZaloClickStats(filter = {}) {
  const params = new URLSearchParams();
  if (filter.fromDate) params.set('fromDate', filter.fromDate);
  if (filter.toDate) params.set('toDate', filter.toDate);
  if (filter.refCode) params.set('refCode', filter.refCode);
  const qs = params.toString();
  return useQuery({
    queryKey: ['zaloClickStats', filter],
    queryFn: () => apiClient.get(`/api/admin/zalo-clicks/stats${qs ? `?${qs}` : ''}`),
  });
}
