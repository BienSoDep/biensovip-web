import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

export function useDbConsoleTables() {
  return useQuery({
    queryKey: ['admin-db-console-tables'],
    queryFn: () => apiClient.get('/api/admin/db-console/tables'),
    staleTime: 300_000,
  });
}

export function useDbConsoleQuery() {
  return useMutation({
    mutationFn: ({ table, filters, limit }) => apiClient.post('/api/admin/db-console/query', { table, filters, limit }),
  });
}
