import { useState } from 'react';
import { loadAuth } from '../lib/authStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Tải file CSV có auth header (window.location.href không gửi được Authorization) —
// dùng fetch + blob + <a download> ảo. Trả về hook state để UI hiện loading/disable nút.
async function downloadFile(path, params, fallbackName) {
  const qs = new URLSearchParams(params).toString();
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
  const fileName = match?.[1] || fallbackName;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useExportCsv(path) {
  const [loading, setLoading] = useState(false);

  const exportCsv = async (params = {}) => {
    setLoading(true);
    try {
      await downloadFile(path, { ...params, format: 'csv' }, 'export.csv');
    } finally {
      setLoading(false);
    }
  };

  return { exportCsv, loading };
}

// Report export — Excel (.xlsx) hoặc PDF, dùng cho Dashboard.
export function useExportReport(path) {
  const [loading, setLoading] = useState(false);

  const exportReport = async (format, params = {}) => {
    setLoading(true);
    try {
      await downloadFile(path, { ...params, format }, `export.${format}`);
    } finally {
      setLoading(false);
    }
  };

  return { exportReport, loading };
}
