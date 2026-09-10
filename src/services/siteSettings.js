import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// Cache dài — cờ hiển thị ảnh biển số chỉ đổi khi admin bấm nút gạt (hiếm), không cần refetch
// liên tục ở mọi trang có hiển thị biển số.
export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: () => apiClient.get('/api/settings'),
    staleTime: 5 * 60 * 1000,
  });
}

// Admin — bật/tắt toàn hệ thống ưu tiên hiển thị ảnh biển số sinh tự động thay vì PlateVisual.
export function useUpdatePlateImagesSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (showGeneratedPlateImages) => apiClient.patch('/api/admin/settings/plate-images', { showGeneratedPlateImages }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site-settings'] }),
  });
}
