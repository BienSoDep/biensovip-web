import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// Thứ tự ưu tiên sort mặc định (không truyền sort/sort=newest) của danh sách biển công khai —
// admin kéo-thả 4 tiêu chí (province/hot/date/type) + chọn tỉnh ưu tiên.
export function usePlateSortSettings() {
  return useQuery({
    queryKey: ['plate-sort-settings'],
    queryFn: () => apiClient.get('/api/admin/plate-sort-settings'),
  });
}

export function useUpdatePlateSortSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.patch('/api/admin/plate-sort-settings', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plate-sort-settings'] }),
  });
}
