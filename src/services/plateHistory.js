import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient.js';

const HISTORY_KEY = 'biensovip_plate_history';
const MAX_HISTORY = 50;

/**
 * Đọc danh sách lịch sử duyệt biển số lưu tại localStorage của trình duyệt (dùng cho cả Khách và User).
 */
export function getLocalHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Lưu 1 biển số vừa xem vào localStorage.
 * Nếu biển đã có trong lịch sử thì đưa lên đầu danh sách và cập nhật viewedAt mới nhất.
 */
export function addLocalHistory(plate) {
  if (!plate || (!plate.id && !plate.plateNumber)) return;
  const list = getLocalHistory();
  const id = plate.id || plate.plateNumber;
  const filtered = list.filter((p) => p.id !== id && p.plateNumber !== plate.plateNumber);

  const thumb = plate.thumbnailUrl || (plate.images && plate.images[0]?.url) || null;
  const item = {
    id: plate.id,
    plateNumber: plate.plateNumber,
    price: plate.price,
    salePrice: plate.salePrice,
    priceOnRequest: plate.priceOnRequest,
    province: plate.province || (plate.provinceName) || '',
    vehicleType: plate.vehicleType || '',
    status: plate.status || 'available',
    slug: plate.slug || plate.id,
    thumbnailUrl: thumb,
    viewedAt: new Date().toISOString(),
  };

  const updated = [item, ...filtered].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('bsd_history_change', { detail: { plateId: id } }));
  } catch {
    /* storage full / blocked */
  }
}

/**
 * Xóa 1 biển số khỏi lịch sử duyệt cục bộ.
 */
export function removeLocalHistory(plateId) {
  const list = getLocalHistory().filter((p) => p.id !== plateId);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bsd_history_change', { detail: { plateId } }));
  } catch {
    /* ignore */
  }
}

/**
 * Xóa toàn bộ lịch sử duyệt cục bộ.
 */
export function clearLocalHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new CustomEvent('bsd_history_change'));
  } catch {
    /* ignore */
  }
}

// ── API SERVICES CHO NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP ──

export async function fetchServerHistory() {
  return apiClient.get('/api/plates/history');
}

export async function addServerHistory(plateId) {
  return apiClient.put(`/api/plates/history/${plateId}`);
}

export async function removeServerHistory(plateId) {
  return apiClient.delete(`/api/plates/history/${plateId}`);
}

export async function clearServerHistory() {
  return apiClient.delete('/api/plates/history');
}

/**
 * Đồng bộ lịch sử duyệt từ guest (localStorage) lên tài khoản server khi đăng nhập.
 */
export async function syncPlateHistory() {
  const localItems = getLocalHistory();
  if (!localItems.length) return;

  const payload = localItems.map((item) => ({
    plateId: item.id,
    viewedAt: item.viewedAt,
  })).filter((x) => !!x.plateId);

  if (!payload.length) return;

  try {
    await apiClient.post('/api/plates/history/sync', payload);
  } catch {
    /* ignore network / auth error */
  }
}

/**
 * Ghi nhận 1 lượt duyệt biển số cho cả Khách và User:
 * - Lưu ngay lập tức vào localStorage để phản hồi tức thì.
 * - Nếu đã đăng nhập, gọi API backend ghi nhận vào cơ sở dữ liệu.
 */
export function recordPlateView(plate, user) {
  if (!plate) return;
  addLocalHistory(plate);

  if (user && plate.id) {
    addServerHistory(plate.id).catch(() => {});
  }
}

/**
 * React Hook lấy danh sách lịch sử duyệt biển số:
 * - Khách (Guest): Lấy từ localStorage, tự động re-render khi có sự kiện bsd_history_change.
 * - Người dùng (User): Tải từ API /api/plates/history, fallback/merge với localStorage.
 */
export function usePlateHistory(user) {
  const queryClient = useQueryClient();
  const [localHistory, setLocalHistory] = useState(getLocalHistory);

  useEffect(() => {
    const handleUpdate = () => {
      setLocalHistory(getLocalHistory());
    };
    window.addEventListener('bsd_history_change', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('bsd_history_change', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const { data: serverHistory, isLoading: serverLoading } = useQuery({
    queryKey: ['plate-history'],
    queryFn: fetchServerHistory,
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const removeMutation = useMutation({
    mutationFn: async (plateId) => {
      removeLocalHistory(plateId);
      if (user) {
        await removeServerHistory(plateId).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plate-history'] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      clearLocalHistory();
      if (user) {
        await clearServerHistory().catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plate-history'] });
    },
  });

  // Đối với user: ưu tiên server data, kết hợp danh sách local
  let history = localHistory;
  if (user && Array.isArray(serverHistory)) {
    // Map server items, bổ sung những item vừa xem ở local nếu server chưa kịp trả về
    const serverMap = new Map(serverHistory.map((it) => [it.id, it]));
    const merged = [...serverHistory];
    localHistory.forEach((loc) => {
      if (!serverMap.has(loc.id)) {
        merged.push(loc);
      }
    });
    history = merged;
  }

  return {
    history,
    isLoading: user ? serverLoading : false,
    removeItem: (plateId) => removeMutation.mutate(plateId),
    clearAll: () => clearMutation.mutate(),
  };
}
