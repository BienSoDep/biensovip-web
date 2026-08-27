import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useProvinceLanding(provinceCode, vehicle) {
  return useQuery({
    queryKey: ['landing', 'province', provinceCode, vehicle],
    queryFn: () => apiClient.get(`/api/landing/province/${provinceCode}`, { params: { vehicle } }),
    enabled: !!provinceCode,
  });
}
