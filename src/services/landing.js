import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useProvinceLanding(provinceCode, vehicle) {
  return useQuery({
    queryKey: ['landing', 'province', provinceCode, vehicle],
    queryFn: () => apiClient.get(`/api/landing/province/${provinceCode}`, { params: { vehicle } }),
    enabled: !!provinceCode,
  });
}

export function usePlateTypeLanding(typeSlug, province) {
  return useQuery({
    queryKey: ['landing', 'plate-type', typeSlug, province],
    queryFn: () => apiClient.get(`/api/landing/plate-type/${typeSlug}`, { params: { province } }),
    enabled: !!typeSlug,
  });
}
