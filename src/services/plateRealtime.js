import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';

// Kết nối SignalR hub /hubs/plates. Khi admin tạo/sửa/xóa biển → server push PlateChanged
// → invalidate toàn bộ cache biển (public + admin) để web cập nhật TỨC THÌ, không cần reload.
// Nếu chưa kết nối được (server offline) → tự retry qua withAutomaticReconnect; mutation vẫn
// invalidate cục bộ như fallback.
export function usePlateRealtime() {
  const qc = useQueryClient();
  const connRef = useRef(null);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || '';
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${base}/hubs/plates`)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();
    connRef.current = conn;

    conn.on('PlateChanged', () => {
      qc.invalidateQueries({ queryKey: ['plates'] });
      qc.invalidateQueries({ queryKey: ['plates-featured'] });
      qc.invalidateQueries({ queryKey: ['admin-plates'] });
      qc.invalidateQueries({ queryKey: ['admin-plate'] });
    });

    conn.start().catch(() => { /* retry tự động */ });
    return () => { conn.stop().catch(() => {}); };
  }, [qc]);
}
