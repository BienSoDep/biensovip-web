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
