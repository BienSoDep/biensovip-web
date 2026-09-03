import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// SOLID-VIOLATIONS.md #12 — nguồn duy nhất Purpose/Industry, thay lib/fengshui.js tự mirror tay.
// Danh sách hiếm đổi → staleTime dài, tránh refetch mỗi lần mount.
export function useFengShuiOptions() {
  return useQuery({
    queryKey: ['fengshui-options'],
    queryFn: () => apiClient.get('/api/fengshui/options'),
    staleTime: 60 * 60 * 1000,
  });
}

export function useFengShuiLookup() {
  return useMutation({
    mutationFn: ({ birthDate, purpose, budget, vehicle, industry, catIds, cityIds, vehicleTypeId, priceMin, priceMax, q, avoidNumbers }) =>
      apiClient.post('/api/fengshui/lookup', { birthDate, purpose, budget, vehicle, industry, catIds, cityIds, vehicleTypeId, priceMin, priceMax, q, avoidNumbers }),
  });
}

export function useSaveFengShuiHistory() {
  return useMutation({
    mutationFn: ({ birthDate }) => apiClient.post('/api/fengshui/history', { birthDate }),
  });
}

export function useFengShuiHistory(enabled) {
  return useQuery({
    queryKey: ['fengshui-history'],
    queryFn: () => apiClient.get('/api/fengshui/history'),
    enabled,
  });
}

// UC16 Compare — chấm điểm hợp mệnh cho danh sách biển cụ thể (1-3 biển).
export function useScorePlates() {
  return useMutation({
    mutationFn: ({ birthDate, plateIds, purpose, industry }) =>
      apiClient.post('/api/fengshui/score-plates', { birthDate, plateIds, purpose, industry }),
  });
}
