import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

// Admin "Insight khách hàng" — 5 hook đọc /admin/analytics/* (xem AdminInsights.jsx). Bộ lọc khoảng
// ngày dùng chung queryKey — đổi ngày tự invalidate cache cũ, không cần refetchInterval polling
// (dữ liệu đọc lại thủ công khi đổi bộ lọc là đủ, không cần realtime như notification counts).

export function useAnalyticsOverview(fromDate, toDate) {
  return useQuery({
    queryKey: ['admin-analytics-overview', fromDate, toDate],
    queryFn: () => apiClient.get('/api/admin/analytics/overview', { params: { fromDate, toDate } }),
    enabled: Boolean(fromDate && toDate),
  });
}

export function useAnalyticsPages(fromDate, toDate) {
  return useQuery({
    queryKey: ['admin-analytics-pages', fromDate, toDate],
    queryFn: () => apiClient.get('/api/admin/analytics/pages', { params: { fromDate, toDate } }),
    enabled: Boolean(fromDate && toDate),
  });
}

export function useAnalyticsDevices(fromDate, toDate) {
  return useQuery({
    queryKey: ['admin-analytics-devices', fromDate, toDate],
    queryFn: () => apiClient.get('/api/admin/analytics/devices', { params: { fromDate, toDate } }),
    enabled: Boolean(fromDate && toDate),
  });
}

export function useAnalyticsFunnel(fromDate, toDate, fromScreen) {
  return useQuery({
    queryKey: ['admin-analytics-funnel', fromDate, toDate, fromScreen],
    queryFn: () => apiClient.get('/api/admin/analytics/funnel', { params: { fromDate, toDate, fromScreen } }),
    enabled: Boolean(fromDate && toDate),
  });
}

export function useAnalyticsEvents(fromDate, toDate, eventName) {
  return useQuery({
    queryKey: ['admin-analytics-events', fromDate, toDate, eventName],
    queryFn: () => apiClient.get('/api/admin/analytics/events', { params: { fromDate, toDate, eventName } }),
    enabled: Boolean(fromDate && toDate),
  });
}

export function useBusinessInsights(fromDate, toDate) {
  return useQuery({
    queryKey: ['admin-business-insights', fromDate, toDate],
    queryFn: () => apiClient.get('/api/admin/analytics/business-insights', { params: { fromDate, toDate } }),
    enabled: Boolean(fromDate && toDate),
  });
}
