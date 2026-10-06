import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// API công khai UC49: 3 tab VPA (monthly | weekly | expired). "Biển có sẵn" dùng services/plates.js như cũ.
function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== '' && v != null) q.set(k, v); });
  return q.toString();
}

export function useVpaPlates(params) {
  const qs = toQuery(params);
  return useQuery({
    queryKey: ['vpa-plates', qs],
    queryFn: () => apiClient.get(`/api/vpa/plates?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useVpaCounts(vehicle) {
  const qs = toQuery({ vehicle });
  return useQuery({
    queryKey: ['vpa-counts', qs],
    queryFn: () => apiClient.get(`/api/vpa/plates/counts${qs ? `?${qs}` : ''}`),
    staleTime: 5 * 60 * 1000,
  });
}

// Get-or-create Plate khi khách tương tác lần đầu → { plateId, slug }; sau đó dùng luồng biển thường.
export function openVpaPlate(id) {
  return apiClient.post(`/api/vpa/plates/${id}/open`);
}
