import { apiClient } from './apiClient.js';
import { getLocalFavorites, clearLocalFavorites } from './favoriteStore.js';

export async function listFavorites() {
  return apiClient.get('/api/favorites');
}

export async function addFavorite(plateId) {
  return apiClient.put(`/api/favorites/${plateId}`);
}

export async function removeFavorite(plateId) {
  return apiClient.delete(`/api/favorites/${plateId}`);
}

export async function clearFavorites() {
  return apiClient.delete('/api/favorites');
}

// Sync local → server after login. Per-item catch so one failure doesn't block others.
export async function syncFavorites() {
  const ids = getLocalFavorites();
  if (!ids.length) return;
  await Promise.all(ids.map((id) => apiClient.put(`/api/favorites/${id}`).catch(() => {})));
  clearLocalFavorites();
}
