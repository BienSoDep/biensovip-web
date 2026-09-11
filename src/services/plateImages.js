import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

// Xóa ảnh do hệ thống tự sinh — dùng khi cần generate lại ảnh cũ bằng renderer đã sửa (VD sau khi
// fix bug thiếu font). Giữ nguyên ảnh admin upload tay.
export async function fetchGeneratedImagePlates() {
  return apiClient.get('/api/admin/plates/images/generated');
}

export async function purgeGeneratedImageForPlate(plateId) {
  return apiClient.delete(`/api/admin/plates/images/generated/${plateId}`);
}

// --- "Sinh thông tin hàng loạt" — gộp ảnh + ý nghĩa phong thủy + mô tả ngắn, thay 2 nút riêng cũ ---

export async function fetchMissingInfoPlates() {
  return apiClient.get('/api/admin/plates/info/missing');
}

// Sinh thông tin cho đúng 1 biển, gọi tuần tự từ vòng lặp FE (progress bar, chỉ chạy trên phần đã
// chọn) — cùng pattern generateOneImage ở trên, thay vì 1 request lớn chạy toàn bộ biển đang thiếu.
export async function seedInfoForPlate(plateId) {
  return apiClient.post(`/api/admin/plates/info/seed-one/${plateId}`);
}

// Icon cảnh báo đỏ trong bảng — issue codes cho từng biển có dữ liệu thiếu/sai.
export function usePlateDataIssues() {
  return useQuery({
    queryKey: ['admin-plates', 'data-issues'],
    queryFn: () => apiClient.get('/api/admin/plates/data-issues'),
    staleTime: 30_000,
  });
}
