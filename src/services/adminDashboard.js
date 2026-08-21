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

export function useTrafficSources({ from, to }) {
  const qs = buildRange(from, to);
  return useQuery({
    queryKey: ['dashboard-traffic', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/traffic-sources?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useFunnel({ from, to }) {
  const qs = buildRange(from, to);
  return useQuery({
    queryKey: ['dashboard-funnel', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/funnel?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useActionsChart({ from, to, granularity }) {
  const params = new URLSearchParams(buildRange(from, to));
  if (granularity) params.set('granularity', granularity);
  const qs = params.toString();
  return useQuery({
    queryKey: ['dashboard-actions-chart', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/actions-chart?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function usePlateDistribution(group) {
  return useQuery({
    queryKey: ['dashboard-distribution', group],
    queryFn: () => apiClient.get(`/api/admin/dashboard/plate-distribution?group=${group}`),
    placeholderData: (prev) => prev,
  });
}

export function useTopInterested({ from, to, limit }) {
  const params = new URLSearchParams(buildRange(from, to));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ['dashboard-top-interested', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/top-interested?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function usePlateConversion({ from, to, limit }) {
  const params = new URLSearchParams(buildRange(from, to));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ['dashboard-plate-conversion', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/plate-conversion?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useConvertedOrders({ from, to, limit }) {
  const params = new URLSearchParams(buildRange(from, to));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ['dashboard-converted-orders', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/converted-orders?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useTopContent({ from, to, limit }) {
  const params = new URLSearchParams(buildRange(from, to));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ['dashboard-top-content', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/top-content?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useRatings({ from, to }) {
  const qs = buildRange(from, to);
  return useQuery({
    queryKey: ['dashboard-ratings', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/ratings?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useIntent({ from, to }) {
  const qs = buildRange(from, to);
  return useQuery({
    queryKey: ['dashboard-intent', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/intent?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useCollaboratorPerf({ from, to, limit = 5 }, enabled = true) {
  const params = new URLSearchParams(buildRange(from, to));
  params.set('limit', String(limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ['dashboard-collab-perf', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/collaborators?${qs}`),
    placeholderData: (prev) => prev,
    enabled,
  });
}

export function useDemand({ from, to }) {
  const qs = buildRange(from, to);
  return useQuery({
    queryKey: ['dashboard-demand', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/demand?${qs}`),
    placeholderData: (prev) => prev,
  });
}

// ── Insight nhân khẩu học + hành vi mới ──

export function useCustomerDemographics() {
  return useQuery({
    queryKey: ['dashboard-demographics'],
    queryFn: () => apiClient.get('/api/admin/dashboard/customer-demographics'),
    placeholderData: (prev) => prev,
  });
}

export function useSearchInsights({ from, to, limit }) {
  const params = new URLSearchParams(buildRange(from, to));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ['dashboard-search-insights', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/search-insights?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useCompareInsights({ from, to, limit }) {
  const params = new URLSearchParams(buildRange(from, to));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ['dashboard-compare-insights', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/compare-insights?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useTrafficHeatmap({ from, to }) {
  const qs = buildRange(from, to);
  return useQuery({
    queryKey: ['dashboard-heatmap', qs],
    queryFn: () => apiClient.get(`/api/admin/dashboard/traffic-heatmap?${qs}`),
    placeholderData: (prev) => prev,
  });
}
