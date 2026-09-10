import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// --- Sinh ảnh đại diện hàng loạt cho biển đang thiếu ảnh ---

export async function fetchMissingImagePlates() {
  return apiClient.get('/api/admin/plates/images/missing');
}

export function useBulkGenerateImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/api/admin/plates/images/bulk-generate'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-plates'] }),
  });
}

// UC42 — sinh ảnh cho đúng 1 biển, gọi tuần tự từ vòng lặp FE (progress bar, lưu ngay từng biển
// nên dừng giữa chừng không mất phần đã xong). Không dùng useMutation (không cần loading state
// riêng lẻ per-call, modal tự quản lý progress qua state của nó).
export async function generateOneImage(plateId) {
  return apiClient.post(`/api/admin/plates/images/generate-one/${plateId}`);
}

// Xóa toàn bộ ảnh do hệ thống tự sinh (giữ nguyên ảnh admin upload tay) — dùng khi cần generate
// lại ảnh cũ bằng renderer đã sửa (VD sau khi fix bug thiếu font).
export async function purgeGeneratedImages() {
  return apiClient.delete('/api/admin/plates/images/generated');
}
