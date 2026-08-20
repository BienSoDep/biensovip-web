const FAV_KEY = 'biensovip_favorites';

export function getLocalFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed)];
  } catch {
    return [];
  }
}

export function addLocalFavorite(id) {
  const ids = getLocalFavorites();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  }
}

export function removeLocalFavorite(id) {
  const ids = getLocalFavorites().filter((x) => x !== id);
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

export function clearLocalFavorites() {
  localStorage.removeItem(FAV_KEY);
}
