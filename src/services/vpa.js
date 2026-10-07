import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// API công khai UC49: 3 tab VPA (monthly | weekly | expired). "Biển có sẵn" dùng services/plates.js như cũ.
function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== '' && v != null) q.set(k, v); });
  return q.toString();
}

export function useVpaPlates(params, { enabled = true } = {}) {
  const qs = toQuery(params);
  return useQuery({
    queryKey: ['vpa-plates', qs],
    queryFn: () => apiClient.get(`/api/vpa/plates?${qs}`),
    placeholderData: (prev) => prev,
    enabled,
  });
}

// Số biển theo loại biển / tỉnh trong một tab (bộ lọc bên trái).
export function useVpaFacets(tab, vehicle, { enabled = true } = {}) {
  const qs = toQuery({ tab, vehicle });
  return useQuery({
    queryKey: ['vpa-facets', qs],
    queryFn: () => apiClient.get(`/api/vpa/plates/facets?${qs}`),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    enabled,
  });
}

export function useVpaProvinces() {
  return useQuery({
    queryKey: ['vpa-provinces'],
    queryFn: () => apiClient.get('/api/vpa/provinces'),
    staleTime: 60 * 60 * 1000,
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
