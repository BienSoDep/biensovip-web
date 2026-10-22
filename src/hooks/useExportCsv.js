import { useState, createElement } from 'react';
import { loadAuth } from '../lib/authStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Tải file CSV có auth header (window.location.href không gửi được Authorization) —
// dùng fetch + blob + <a download> ảo. Trả về hook state để UI hiện loading/disable nút.
export async function downloadFile(path, params, fallbackName) {
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

import { useExportWithProgress } from './useExportWithProgress.js';
import ExportProgressModal from '../components/ExportProgressModal.jsx';

export function useExportCsv(path) {
  const { isOpen, progress, startExport, cancelDownload, closeModal } = useExportWithProgress();

  const exportCsv = (params = {}) =>
    startExport({
      url: path,
      params,
      format: 'csv',
      defaultFileName: 'bien-so',
    });

  const exportXlsx = (params = {}) =>
    startExport({
      url: path,
      params,
      format: 'xlsx',
      defaultFileName: 'bien-so',
    });

  const exportDocx = (params = {}) =>
    startExport({
      url: path,
      params,
      format: 'docx',
      defaultFileName: 'catalogue-bien-so',
    });

  const exportModal = createElement(ExportProgressModal, {
    open: isOpen,
    progress,
    onCancel: cancelDownload,
    onClose: closeModal,
  });

  return {
    exportCsv,
    exportXlsx,
    exportDocx,
    loading: isOpen && progress.phase !== 'completed' && progress.phase !== 'error',
    exportModal,
  };
}

// Xuất Word giới thiệu 1 biển cụ thể — nút trên từng dòng danh sách biển.
export function useExportPlateDocx() {
  const exportPlateDocx = (id, plateNumber) =>
    downloadFile(`/api/admin/plates/${id}/export-docx`, {}, `bien-${plateNumber || id}.docx`);
  return { exportPlateDocx };
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
