import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const KEY = ['admin', 'email-templates'];

export function useAdminEmailTemplates() {
  return useQuery({ queryKey: KEY, queryFn: () => apiClient.get('/api/admin/email-templates') });
}

export function useEmailTemplate(id) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => apiClient.get(`/api/admin/email-templates/${id}`),
    enabled: Boolean(id),
  });
}

function invalidateAll(qc) {
  qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiClient.post('/api/admin/email-templates', body),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiClient.patch(`/api/admin/email-templates/${id}`, body),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/email-templates/${id}`),
    onSuccess: () => invalidateAll(qc),
  });
}

// UC35 — nhân bản template
export function useDuplicateEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/admin/email-templates/${id}/duplicate`),
    onSuccess: () => invalidateAll(qc),
  });
}

// Preview template đã lưu (theo id).
export function usePreviewEmailTemplate() {
  return useMutation({
    mutationFn: ({ id, sampleType }) => apiClient.post(`/api/admin/email-templates/${id}/preview`, { sampleType }),
  });
}

// Preview layout đang chỉnh trong canvas, chưa lưu.
export function usePreviewDraftEmailTemplate() {
  return useMutation({
    mutationFn: ({ layoutJson, sampleType }) => apiClient.post('/api/admin/email-templates/preview-draft', { layoutJson, sampleType }),
  });
}

// Versioning (item #5) — lịch sử + rollback
export function useEmailTemplateVersions(id) {
  return useQuery({
    queryKey: [...KEY, id, 'versions'],
    queryFn: () => apiClient.get(`/api/admin/email-templates/${id}/versions`),
    enabled: Boolean(id),
  });
}

export function useRollbackEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, versionId }) => apiClient.post(`/api/admin/email-templates/${id}/versions/${versionId}/rollback`),
    onSuccess: (_, { id }) => {
      invalidateAll(qc);
      qc.invalidateQueries({ queryKey: [...KEY, id, 'versions'] });
    },
  });
}
