import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

function toQueryString(filters) {
  const params = new URLSearchParams();
  if (filters.cat?.length) filters.cat.forEach((id) => params.append('cat', id));
  if (filters.city?.length) filters.city.forEach((id) => params.append('city', id));
  if (filters.vehicle) params.set('vehicle', filters.vehicle);
  if (filters.priceMin != null) params.set('priceMin', filters.priceMin);
  if (filters.priceMax != null) params.set('priceMax', filters.priceMax);
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', filters.page);
  if (filters.perPage) params.set('perPage', filters.perPage);
  return params.toString();
}

export function usePlates(filters, options) {
  const qs = toQueryString(filters);
  return useQuery({
    queryKey: ['plates', qs],
    queryFn: () => apiClient.get(`/api/plates${qs ? `?${qs}` : ''}`),
    enabled: options?.enabled,
  });
}

export function useInfinitePlates(filters, options) {
  const { page, ...rest } = filters;
  return useInfiniteQuery({
    queryKey: ['plates-infinite', JSON.stringify(rest)],
    queryFn: ({ pageParam = 1 }) => {
      const qs = toQueryString({ ...rest, page: pageParam });
      return apiClient.get(`/api/plates${qs ? `?${qs}` : ''}`);
    },
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const tp = last?.totalPages || 1;
      const next = all.length + 1;
      return next <= tp ? next : undefined;
    },
    getPreviousPageParam: (_first, _all, firstPageParam) => (firstPageParam > 1 ? firstPageParam - 1 : undefined),
    maxPages: 6,
    enabled: options?.enabled,
  });
}

export function useFeaturedPlates(limit = 6) {
  return useQuery({
    queryKey: ['plates-featured', limit],
    queryFn: () => apiClient.get(`/api/plates/featured?limit=${limit}`),
  });
}
