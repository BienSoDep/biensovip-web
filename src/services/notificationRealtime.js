import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { loadAuth } from '../lib/authStore.js';

// Realtime notification: kết nối `/hubs/notifications` (user đã đăng nhập) với access token.
// Server push `NotificationChanged` khi có thông báo mới (biển mới khớp saved-search, broadcast...)
// → invalidate chuông + hiện toast nhẹ, cập nhật TỨC THÌ không cần reload.
export function useNotificationRealtime(user) {
  const qc = useQueryClient();
  const connRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const token = loadAuth()?.accessToken;
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || '';
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${base}/hubs/notifications`, { accessTokenFactory: () => token })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();
    connRef.current = conn;

    conn.on('NotificationChanged', (n) => {
      qc.invalidateQueries({ queryKey: ['me', 'notifications'] });
      if (n?.title) toast(n.title);
    });

    conn.start().catch(() => { /* retry tự động */ });
    return () => { conn.stop().catch(() => {}); };
  }, [user, qc]);
}
