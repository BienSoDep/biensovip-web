import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

function buildQuery({ status, keyword, page, perPage }) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (keyword) params.set('keyword', keyword);
  params.set('page', String(page || 1));
  params.set('perPage', String(perPage || 20));
  return params.toString();
}

export function useAdminPlates(filters) {
  const qs = buildQuery(filters);
  return useQuery({
    queryKey: ['admin-plates', qs],
    queryFn: () => apiClient.get(`/api/admin/plates?${qs}`),
  });
}

export function useAdminPlate(id) {
  return useQuery({
    queryKey: ['admin-plate', id],
    queryFn: () => apiClient.get(`/api/admin/plates/${id}`),
    enabled: !!id,
  });
}

function invalidate(qc) {
  qc.invalidateQueries({ queryKey: ['admin-plates'] });
  qc.invalidateQueries({ queryKey: ['admin-plate'] });
  // Cập nhật cả cache public để biển mới/sửa hiện ngay trên web (fallback cho realtime push)
  qc.invalidateQueries({ queryKey: ['plates'] });
  qc.invalidateQueries({ queryKey: ['plates-featured'] });
}

export function useCreatePlate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/plates', body),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdatePlate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiClient.put(`/api/admin/plates/${id}`, body),
    onSuccess: () => invalidate(qc),
  });
}

// Bulk create (quick-add / paste-CSV) — server trả kết quả TỪNG DÒNG {plateNumber, success, error, plateId}
export function useBulkCreatePlate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items) => apiClient.post('/api/admin/plates/bulk', { items }),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeletePlate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/plates/${id}`),
    onSuccess: () => invalidate(qc),
  });
}

export function useHardDeletePlate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/plates/${id}/hard`),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdatePlateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/api/admin/plates/${id}/status`, { status }),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdatePlateVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, visible }) => apiClient.patch(`/api/admin/plates/${id}/visibility`, { visible }),
    onSuccess: () => invalidate(qc),
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return apiClient.upload('/api/admin/plates/upload', fd);
    },
  });
}

export function useAddPlateImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plateId, file }) => {
      const fd = new FormData();
      fd.append('file', file);
      return apiClient.upload(`/api/admin/plates/${plateId}/images`, fd);
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useRemovePlateImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plateId, imageId }) => apiClient.delete(`/api/admin/plates/${plateId}/images/${imageId}`),
    onSuccess: () => invalidate(qc),
  });
}

export function useReorderImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plateId, orderedIds }) => apiClient.patch(`/api/admin/plates/${plateId}/images/reorder`, { orderedIds }),
    onSuccess: () => invalidate(qc),
  });
}
