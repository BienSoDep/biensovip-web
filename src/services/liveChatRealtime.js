import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { loadAuth } from '../lib/authStore.js';

const LIVE_SESSIONS_KEY = ['admin', 'live-chat', 'sessions'];

// 1. Hook realtime cho Admin/Staff Dashboard
export function useAdminLiveChatRealtime({ activeSessionId, onMessageReceived } = {}) {
  const qc = useQueryClient();
  const connRef = useRef(null);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || '';
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${base}/hubs/live-chat`, {
        accessTokenFactory: () => loadAuth()?.accessToken || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    connRef.current = conn;

    conn.on('NewSupportRequest', (data) => {
      qc.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY });
      toast.success(`🔔 Khách ${data?.guestName || 'mới'} vừa yêu cầu hỗ trợ trực tiếp!`, { duration: 6000 });
      // Phát âm thanh thông báo nếu trình duyệt hỗ trợ
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
        audio.play().catch(() => {});
      } catch (_) {}
    });

    conn.on('SessionMessageReceived', (data) => {
      qc.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY });
      if (data?.sessionId) {
        qc.invalidateQueries({ queryKey: [...LIVE_SESSIONS_KEY, 'detail', data.sessionId] });
      }
      if (onMessageReceived) {
        onMessageReceived(data);
      }
    });

    conn.on('SessionStatusChanged', (data) => {
      qc.invalidateQueries({ queryKey: LIVE_SESSIONS_KEY });
      if (data?.sessionId) {
        qc.invalidateQueries({ queryKey: [...LIVE_SESSIONS_KEY, 'detail', data.sessionId] });
      }
    });

    conn.start()
      .then(() => {
        conn.invoke('JoinAdminLive').catch(() => {});
      })
      .catch(() => {});

    return () => {
      conn.stop().catch(() => {});
    };
  }, [qc]);

  // Khi activeSessionId thay đổi, join group của session đó
  useEffect(() => {
    const conn = connRef.current;
    if (!conn || !activeSessionId || conn.state !== signalR.HubConnectionState.Connected) return;

    conn.invoke('JoinSession', activeSessionId).catch(() => {});
    return () => {
      if (conn.state === signalR.HubConnectionState.Connected) {
        conn.invoke('LeaveSession', activeSessionId).catch(() => {});
      }
    };
  }, [activeSessionId]);

  return connRef;
}

// 2. Hook realtime cho Client Widget (Khách hàng)
export function useClientLiveChatRealtime(sessionId, { onReceiveMessage, onStatusChanged } = {}) {
  const connRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const base = import.meta.env.VITE_API_URL || '';
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${base}/hubs/live-chat`)
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    connRef.current = conn;

    conn.on('ReceiveMessage', (msg) => {
      if (onReceiveMessage) {
        onReceiveMessage(msg);
      }
    });

    conn.on('StatusChanged', (statusInfo) => {
      if (onStatusChanged) {
        onStatusChanged(statusInfo);
      }
    });

    conn.start()
      .then(() => {
        conn.invoke('JoinSession', sessionId.toString()).catch(() => {});
      })
      .catch(() => {});

    return () => {
      conn.stop().catch(() => {});
    };
  }, [sessionId]);

  return connRef;
}
