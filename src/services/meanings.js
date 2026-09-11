import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// --- MeaningTemplate (mẫu chung) ---

export function useMeaningTemplates(filters = {}) {
  const params = {};
  if (filters.category) params.category = filters.category;
  if (filters.keyword) params.keyword = filters.keyword;
  return useQuery({
    queryKey: ['meaning-templates', filters],
    queryFn: () => apiClient.get('/api/admin/meanings/templates', { params }),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/meanings/templates', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meaning-templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiClient.put(`/api/admin/meanings/templates/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meaning-templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/meanings/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meaning-templates'] }),
  });
}

// --- PlateMeaning (ý nghĩa riêng từng biển) ---

export function usePlateMeanings(plateId) {
  return useQuery({
    queryKey: ['plate-meanings', plateId],
    queryFn: () => apiClient.get(`/api/admin/plates/${plateId}/meanings`),
    enabled: !!plateId,
  });
}

function invalidatePlateMeanings(qc, plateId) {
  qc.invalidateQueries({ queryKey: ['plate-meanings', plateId] });
  qc.invalidateQueries({ queryKey: ['admin-plate', plateId] });
  // Ý nghĩa đổi → cột/badge trong bảng biển + trang public phải cập nhật ngay, không cần F5.
  qc.invalidateQueries({ queryKey: ['admin-plates'] });
  qc.invalidateQueries({ queryKey: ['plates'] });
}

export function useCreatePlateMeaning(plateId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post(`/api/admin/plates/${plateId}/meanings`, body),
    onSuccess: () => invalidatePlateMeanings(qc, plateId),
  });
}

export function useUpdatePlateMeaning(plateId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiClient.put(`/api/admin/plates/${plateId}/meanings/${id}`, body),
    onSuccess: () => invalidatePlateMeanings(qc, plateId),
  });
}

export function useDeletePlateMeaning(plateId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/plates/${plateId}/meanings/${id}`),
    onSuccess: () => invalidatePlateMeanings(qc, plateId),
  });
}

// Xem trước những ý nghĩa sẽ được thêm nếu bấm "Sinh lại từ mẫu" — không ghi DB.
export async function previewSeedPlateMeanings(plateId, plateNumber) {
  const result = await apiClient.post(`/api/admin/plates/${plateId}/meanings/seed-preview`, { plateNumber });
  return result;
}

export function useReseedPlateMeanings(plateId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post(`/api/admin/plates/${plateId}/meanings/seed`, body),
    onSuccess: () => invalidatePlateMeanings(qc, plateId),
  });
}

// --- Sinh ý nghĩa hàng loạt cho biển đang thiếu ---

export async function fetchMissingMeaningPlates() {
  return apiClient.get('/api/admin/plates/meanings/missing');
}

export function useBulkSeedMeanings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/api/admin/plates/meanings/bulk-seed'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-plates'] }),
  });
}
