import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';
import { formatISO } from 'date-fns';

function buildRange(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', formatISO(from));
  if (to) params.set('to', formatISO(to));
  return params.toString();
}

export function useDashboardSummary({ from, to }) {
  const qs = buildRange(from, to);
  return useQuery({
    queryKey: ['dashboard-summary', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/summary?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useViewsChart({ from, to, granularity }) {
  const params = new URLSearchParams(buildRange(from, to));
  if (granularity) params.set('granularity', granularity);
  const qs = params.toString();
  return useQuery({
    queryKey: ['dashboard-views-chart', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/views-chart?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useTopViewedPlates({ from, to, limit }) {
  const params = new URLSearchParams(buildRange(from, to));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ['dashboard-top-plates', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/top-viewed-plates?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useTrafficSources({ from, to }) {
  const qs = buildRange(from, to);
  return useQuery({
    queryKey: ['dashboard-traffic', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/traffic-sources?${qs}`),
    placeholderData: (prev) => prev,
  });
}
