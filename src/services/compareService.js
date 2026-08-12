import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const STORAGE_KEY = 'compare_ids';
const MAX = 3;

function loadIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch { return []; }
}

function saveIds(ids) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

// ── Client-side compare list (localStorage) ──
export function useCompareIds() {
  const [ids, setIds] = useState(loadIds);

  useEffect(() => {
    const onStorage = () => setIds(loadIds());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((id) => {
    setIds((prev) => {
      if (prev.length >= MAX || prev.includes(id)) return prev;
      const next = [...prev, id];
      saveIds(next);
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setIds((prev) => {
      const next = prev.filter((x) => x !== id);
      saveIds(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    saveIds([]);
  }, []);

  const isInList = useCallback((id) => ids.includes(id), [ids]);

  return { ids, add, remove, clear, isInList, max: MAX };
}

// ── API: fetch compare plates ──
export function useComparePlates(ids) {
  const key = ids.length > 0 ? ids.join(',') : '';
  return useQuery({
    queryKey: ['compare-plates', key],
    queryFn: () => apiClient.get(`/api/plates/compare?ids=${key}`),
    enabled: ids.length >= 2,
    placeholderData: (prev) => prev,
  });
}
