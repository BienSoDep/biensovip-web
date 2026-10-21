import { useState } from 'react';
import { Sparkles, Plus, MessageSquare } from 'lucide-react';
import { useChatConversation, ChatConversationView, loadStoredSessionId, storeSessionId, clearStoredSessionId } from '../components/ChatConversation.jsx';
import { useMyChatbotSessions } from '../services/chatbotService.js';
import { useSeo } from '../hooks/useSeo.js';

function timeAgo(iso) {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return `${Math.round(diffHour / 24)} ngày trước`;
}

export default function ChatbotPage({ go, user }) {
  useSeo('aiChat');
  // resetKey đổi → remount useChatConversation để bắt đầu/mở phiên khác, tránh lẫn state hội thoại cũ.
  const [resetKey, setResetKey] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const sessions = useMyChatbotSessions(!!user);

  return (
    <ChatbotPageInner
      key={resetKey}
      go={go}
      user={user}
      sessions={sessions}
      activeSessionId={activeSessionId}
      onNewChat={() => { clearStoredSessionId(); setActiveSessionId(null); setResetKey((k) => k + 1); }}
      onOpenSession={(id) => { storeSessionId(id); setActiveSessionId(id); setResetKey((k) => k + 1); }}
    />
  );
}

function ChatbotPageInner({ go, user, sessions, activeSessionId, onNewChat, onOpenSession }) {
  const conv = useChatConversation(activeSessionId);
  const currentSessionId = activeSessionId || conv.sessionId || loadStoredSessionId();

  const handleAction = (action) => {
    if (action === 'chat_with_staff' || action === 'contact_form') go?.('chat')();
  };

  const openPlate = (slugOrId) => go?.('detail', slugOrId)();
  const openPost = (slug) => go?.('post', slug)();

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', flexShrink: 0 }}>
          <Sparkles size={20} />
        </span>
        <div>
          <h1 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Trợ lý AI Biensovip</h1>
          <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hỏi về biển số đẹp, hợp mệnh, giá và quy trình đấu giá hộ.</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'stretch' }}>
        {user && (
          <aside style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <button
              type="button" onClick={onNewChat}
              style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--action-primary)', borderRadius: 'var(--radius-field)', background: 'var(--white)', padding: '10px 14px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)', cursor: 'pointer' }}
            >
              <Plus size={16} /> Cuộc trò chuyện mới
            </button>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-2)', overflow: 'hidden', flex: 1, overflowY: 'auto', maxHeight: 'min(60vh, 560px)' }}>
              {sessions.isLoading && (
                <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton-shimmer" style={{ height: 40, borderRadius: 'var(--radius-field)' }} />)}
                </div>
              )}
              {sessions.isSuccess && sessions.data?.length === 0 && (
                <div style={{ padding: 'var(--space-4)', font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'center' }}>Chưa có cuộc trò chuyện nào</div>
              )}
              {sessions.data?.map((s) => (
                <button
                  key={s.sessionId} type="button" onClick={() => onOpenSession(s.sessionId)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', textAlign: 'left',
                    border: 'none', borderBottom: '1px solid var(--border-hairline)',
                    background: s.sessionId === currentSessionId ? 'var(--surface-sunken)' : 'transparent',
                    padding: '10px 12px', cursor: 'pointer',
                  }}
                >
                  <MessageSquare size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }} />
                  <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.preview || 'Cuộc trò chuyện'}</span>
                    <span style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-faint)' }}>{timeAgo(s.lastMessageAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
        )}
        <div style={{ flex: 1, minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-2)', display: 'flex', flexDirection: 'column', height: 'min(70vh, 640px)', overflow: 'hidden' }}>
          <ChatConversationView conv={conv} onOpenPlate={openPlate} onOpenPost={openPost} onAction={handleAction} autoFocusInput />
        </div>
      </div>
    </div>
  );
}
