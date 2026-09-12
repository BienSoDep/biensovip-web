import { useCallback, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';
import { trackAddToCompare, trackRemoveFromCompare } from './tracking/events.js';

const STORAGE_KEY = 'compare_ids';
const MAX = 3;

function loadIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch { return []; }
}

// Một store dùng chung cho toàn app — KHÔNG phải useState cục bộ mỗi hook.
// Trước đây useCompareIds() dùng useState(loadIds) nên mỗi call site (Header, PlateList,
// PlateDetail, Home, Compare, CompareBar) giữ một bản sao riêng: bấm "So sánh" ở danh sách
// chỉ cập nhật bản sao của chính nó, Header không hề hay biết nên badge đếm đứng yên cho tới
// khi F5. useSyncExternalStore cho mọi call site đọc cùng một nguồn và re-render đồng bộ.
let ids = loadIds();
const listeners = new Set();

function emit() { for (const l of listeners) l(); }

function setIds(next) {
  if (next.length === ids.length && next.every((x, i) => x === ids[i])) return;
  ids = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  emit();
}

const subscribeStore = (listener) => {
  listeners.add(listener);
  // Đồng bộ khi tab khác sửa cùng key (cross-tab).
  const onStorage = (e) => { if (e.key === STORAGE_KEY) { ids = loadIds(); emit(); } };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
};

const getSnapshot = () => ids;

// ── Client-side compare list (localStorage, shared store) ──
export function useCompareIds() {
  const current = useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);

  const add = useCallback((id) => {
    if (ids.length >= MAX || ids.includes(id)) return;
    setIds([...ids, id]);
    trackAddToCompare(id);
  }, []);

  const remove = useCallback((id) => {
    if (!ids.includes(id)) return;
    setIds(ids.filter((x) => x !== id));
    trackRemoveFromCompare(id);
  }, []);

  const clear = useCallback(() => { setIds([]); }, []);

  const isInList = useCallback((id) => current.includes(id), [current]);

  return { ids: current, add, remove, clear, isInList, max: MAX };
}

// ── API: fetch compare plates ──
export function useComparePlates(ids) {
  const key = ids.length > 0 ? ids.join(',') : '';
  return useQuery({
    queryKey: ['compare-plates', key],
    queryFn: () => apiClient.get('/api/plates/compare', { params: { ids: key } }),
    enabled: ids.length >= 1,
    placeholderData: (prev) => prev,
  });
}
