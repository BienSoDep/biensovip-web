import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useAdminAuditLogs(filter = {}) {
  const params = new URLSearchParams();
  if (filter.entityType) params.set('entityType', filter.entityType);
  if (filter.actorId) params.set('actorId', filter.actorId);
  if (filter.fromDate) params.set('fromDate', filter.fromDate);
  if (filter.toDate) params.set('toDate', filter.toDate);
  params.set('page', filter.page ?? 1);
  params.set('limit', filter.limit ?? 20);
  const qs = params.toString();
  return useQuery({
    queryKey: ['admin-audit-logs', qs],
    queryFn: () => apiClient.get(`/api/admin/audit-logs?${qs}`),
  });
}

export function useAuditLogDetail(id) {
  return useQuery({
    queryKey: ['admin-audit-log-detail', id],
    queryFn: () => apiClient.get(`/api/admin/audit-logs/${id}`),
    enabled: !!id,
  });
}

export function useAuditLogByEntity(entityType, entityId) {
  return useQuery({
    queryKey: ['admin-audit-log-entity', entityType, entityId],
    queryFn: () => apiClient.get(`/api/admin/audit-logs/entity/${entityType}/${entityId}`),
    enabled: !!entityType && !!entityId,
  });
}
