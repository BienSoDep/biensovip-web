import { useState } from 'react';
import { loadAuth } from '../lib/authStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Tải file CSV có auth header (window.location.href không gửi được Authorization) —
// dùng fetch + blob + <a download> ảo. Trả về hook state để UI hiện loading/disable nút.
export function useExportCsv(path) {
  const [loading, setLoading] = useState(false);

  const exportCsv = async (params = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ ...params, format: 'csv' }).toString();
      const auth = loadAuth();
      const res = await fetch(`${BASE_URL}${path}?${qs}`, {
        headers: auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || `Xuất file thất bại (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const fileName = match?.[1] || 'export.csv';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return { exportCsv, loading };
}
