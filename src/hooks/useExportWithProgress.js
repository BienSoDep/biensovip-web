import { useState, useRef, useCallback } from 'react';
import { loadAuth } from '../lib/authStore.js';

const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Hook quản lý xuất file (Excel, Word, CSV) kèm theo thanh tiến trình % thực tế
 * Hỗ trợ stream chunk, đếm dung lượng, tự động phân chia phase và nút Hủy.
 */
export function useExportWithProgress() {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState({
    percent: 0,
    loadedBytes: 0,
    totalBytes: 0,
    phase: 'generating', // 'generating' | 'downloading' | 'completed' | 'error'
    fileName: '',
    format: 'xlsx',
    errorMessage: null,
  });

  const abortRef = useRef(null);
  const animTimerRef = useRef(null);

  const cancelDownload = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (animTimerRef.current) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const startExport = useCallback(async ({
    url,
    params = {},
    format = 'xlsx',
    defaultFileName = 'bien-so',
  }) => {
    // Chuẩn bị URL và Query String
    const qs = new URLSearchParams(
      Object.entries({ ...params, format }).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = v;
        return acc;
      }, {})
    ).toString();

    const fullUrl = `${url.startsWith('http') ? '' : BASE_URL}${url}?${qs}`;
    const initialFileName = `${defaultFileName}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.${format}`;

    // Khởi tạo trạng thái
    setIsOpen(true);
    setProgress({
      percent: 5,
      loadedBytes: 0,
      totalBytes: 0,
      phase: 'generating',
      fileName: initialFileName,
      format,
      errorMessage: null,
    });

    const abortController = new AbortController();
    abortRef.current = abortController;

    // Giả lập tiến trình mượt mà từ 5% -> 45% trong lúc máy chủ đang query DB & tạo workbook
    let simPct = 5;
    animTimerRef.current = setInterval(() => {
      simPct = Math.min(45, simPct + (45 - simPct) * 0.15);
      setProgress((p) => (p.phase === 'generating' ? { ...p, percent: Math.round(simPct) } : p));
    }, 400);

    try {
      const auth = loadAuth();
      const res = await fetch(fullUrl, {
        signal: abortController.signal,
        headers: auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
      });

      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || `Xuất file thất bại (mã ${res.status})`);
      }

      // Lấy tên file từ Content-Disposition nếu có
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const actualFileName = match?.[1] || initialFileName;

      // Lấy Content-Length nếu có
      const contentLengthHeader = res.headers.get('Content-Length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

      // Đọc Stream từng chunk
      const reader = res.body?.getReader();
      const chunks = [];
      let loadedBytes = 0;

      if (!reader) {
        // Fallback blob nếu không hỗ trợ getReader
        const blob = await res.blob();
        saveBlob(blob, actualFileName);
        setProgress({
          percent: 100,
          loadedBytes: blob.size,
          totalBytes: blob.size,
          phase: 'completed',
          fileName: actualFileName,
          format,
        });
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loadedBytes += value.length;

        let pct;
        if (totalBytes > 0) {
          // Tính % thực: 45% -> 98%
          pct = Math.min(98, 45 + Math.round((loadedBytes / totalBytes) * 53));
        } else {
          // Không có Content-Length: tăng dần theo dung lượng nhận được
          pct = Math.min(95, 45 + Math.round(Math.log10(loadedBytes / 1024 + 1) * 15));
        }

        setProgress({
          percent: pct,
          loadedBytes,
          totalBytes,
          phase: 'downloading',
          fileName: actualFileName,
          format,
        });
      }

      // Tạo Blob và tải về máy
      const blob = new Blob(chunks);
      saveBlob(blob, actualFileName);

      setProgress({
        percent: 100,
        loadedBytes,
        totalBytes: totalBytes || loadedBytes,
        phase: 'completed',
        fileName: actualFileName,
        format,
      });

      // Tự động đóng modal sau 2 giây khi thành công
      setTimeout(() => {
        setIsOpen((cur) => (cur ? false : false));
      }, 2200);

    } catch (err) {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
      if (err.name === 'AbortError') {
        setIsOpen(false);
        return;
      }
      setProgress((p) => ({
        ...p,
        percent: 0,
        phase: 'error',
        errorMessage: err.message || 'Có lỗi xảy ra khi tải file',
      }));
    } finally {
      abortRef.current = null;
    }
  }, []);

  return {
    isOpen,
    progress,
    startExport,
    cancelDownload,
    closeModal,
  };
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
