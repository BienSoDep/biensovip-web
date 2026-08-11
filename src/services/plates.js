import { useQuery } from '@tanstack/react-query';
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

export function usePlates(filters) {
  const qs = toQueryString(filters);
  return useQuery({
    queryKey: ['plates', qs],
    queryFn: () => apiClient.get(`/api/plates${qs ? `?${qs}` : ''}`),
  });
}

export function useFeaturedPlates(limit = 6) {
  return useQuery({
    queryKey: ['plates-featured', limit],
    queryFn: () => apiClient.get(`/api/plates/featured?limit=${limit}`),
  });
}
