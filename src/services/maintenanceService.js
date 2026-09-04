import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const PUBLIC_KEY = ['maintenance', 'public'];
const ADMIN_KEY = ['admin', 'maintenance'];

// Public — không cần login. App.jsx poll định kỳ để phát hiện admin vừa bật bảo trì khi user
// đang duyệt site, không cần reload thủ công.
export function usePublicMaintenance() {
  return useQuery({
    queryKey: PUBLIC_KEY,
    queryFn: () => apiClient.get('/api/maintenance'),
    refetchInterval: 120000,
    staleTime: 60000,
  });
}

export function useAdminMaintenanceList() {
  return useQuery({ queryKey: ADMIN_KEY, queryFn: () => apiClient.get('/api/admin/maintenance') });
}

export function useUpdateMaintenancePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ screen, ...body }) => apiClient.put(`/api/admin/maintenance/${screen}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ADMIN_KEY }); qc.invalidateQueries({ queryKey: PUBLIC_KEY }); },
  });
}
