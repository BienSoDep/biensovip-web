import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Plus, MessageSquare, RotateCcw, ShieldCheck, PanelLeftClose, PanelLeftOpen, Trash2, LogIn, Clock, X, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useChatConversation,
  ChatConversationView,
  loadStoredSessionId,
  storeSessionId,
  clearStoredSessionId,
  loadSessionsList,
  deleteSessionFromList,
} from '../components/ChatConversation.jsx';
import { useMyChatbotSessions } from '../services/chatbotService.js';
import { useSeo } from '../hooks/useSeo.js';
import { loadAuth } from '../lib/authStore.js';
import { prefillFromUser } from '../lib/contactPrefill.js';

function timeAgo(iso) {
  if (!iso) return 'Vừa xong';
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return `${Math.round(diffHour / 24)} ngày trước`;
}

export default function ChatbotPage({ go, user, openPlate, openPost }) {
  useSeo('aiChat');
  const [resetKey, setResetKey] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState(null);
  // On mobile (<= 768px), sidebar is closed by default to focus on conversation stage
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 768 : true));
  const [localSessions, setLocalSessions] = useState(() => loadSessionsList());
  const sessions = useMyChatbotSessions(!!user);

  useEffect(() => {
    const handleUpdate = () => setLocalSessions(loadSessionsList());
    window.addEventListener('bsv_chat_sessions_updated', handleUpdate);
    return () => window.removeEventListener('bsv_chat_sessions_updated', handleUpdate);
  }, []);

  // Merge server sessions (if logged in) and local guest sessions
  const combinedSessions = useMemo(() => {
    const map = new Map();
    (sessions.data || []).forEach((s) => {
      map.set(s.sessionId, { ...s, isServer: true });
    });
    (localSessions || []).forEach((s) => {
      if (!map.has(s.sessionId)) {
        map.set(s.sessionId, { ...s, isLocal: true });
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
    );
  }, [sessions.data, localSessions]);

  const handleNewChat = () => {
    clearStoredSessionId();
    setActiveSessionId(null);
    setResetKey((k) => k + 1);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleOpenSession = (id) => {
    storeSessionId(id);
    setActiveSessionId(id);
    setResetKey((k) => k + 1);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteSession = (sessionId) => {
    deleteSessionFromList(sessionId);
    if (activeSessionId === sessionId || loadStoredSessionId() === sessionId) {
      handleNewChat();
    }
  };

  return (
    <div className="claude-chat-outer">
      <ChatbotPageInner
        key={resetKey}
        go={go}
        openPlate={openPlate}
        openPost={openPost}
        user={user}
        sessions={combinedSessions}
        isLoadingSessions={sessions.isLoading}
        activeSessionId={activeSessionId}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onNewChat={handleNewChat}
        onOpenSession={handleOpenSession}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  );
}

function ChatbotPageInner({
  go,
  openPlate: onOpenPlateProp,
  openPost: onOpenPostProp,
  user,
  sessions,
  isLoadingSessions,
  activeSessionId,
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  onOpenSession,
  onDeleteSession,
}) {
  const conv = useChatConversation(activeSessionId);
  const currentSessionId = activeSessionId || conv.sessionId || loadStoredSessionId();

  const handleAction = (action) => {
    if (action === 'chat_with_staff' || action === 'contact_form') go?.('chat')();
  };

  const openPlate = (slugOrId) => {
    if (onOpenPlateProp) onOpenPlateProp(slugOrId);
    else go?.('detail', slugOrId)();
  };
  const openPost = (slug) => {
    if (onOpenPostProp) onOpenPostProp(slug);
    else go?.('post', slug)();
  };
  const switchDisabled = conv.sendMessage.isPending;

  return (
    <div className="claude-chat-page">
      {/* Mobile backdrop for drawer */}
      <div
        className={`claude-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={onToggleSidebar}
        aria-hidden="true"
      />

      {/* Claude Sidebar - Always accessible like Claude, Gemini, ChatGPT */}
      <aside className={`claude-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="claude-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onNewChat}
              disabled={switchDisabled}
              className="claude-btn-new-chat"
              title="Bắt đầu phiên hội thoại mới"
              style={{ flex: 1 }}
            >
              <Plus size={18} /> Cuộc trò chuyện mới
            </button>
            <button
              type="button"
              onClick={onToggleSidebar}
              className="claude-sidebar-close-btn"
              title="Đóng sidebar"
              aria-label="Đóng sidebar"
            >
              <X size={18} />
            </button>
          </div>
          <div className="claude-sidebar-title">Lịch sử trò chuyện</div>
        </div>

        <div className="claude-sessions-list">
          {isLoadingSessions && sessions.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 4px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-shimmer" style={{ height: 42, borderRadius: 8 }} />
              ))}
            </div>
          )}

          {!isLoadingSessions && sessions.length === 0 && (
            <div style={{ padding: '32px 16px', fontSize: 13, color: 'var(--grey-400)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Clock size={24} style={{ opacity: 0.4 }} />
              <span>Chưa có cuộc trò chuyện nào</span>
              <span style={{ fontSize: 11, color: 'var(--grey-500)' }}>Hỏi AI để bắt đầu lưu lại lịch sử hội thoại của bạn.</span>
            </div>
          )}

          {sessions.map((s) => {
            const isActive = s.sessionId === currentSessionId;
            return (
              <div
                key={s.sessionId}
                role="button"
                tabIndex={0}
                onClick={() => onOpenSession(s.sessionId)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenSession(s.sessionId); }}
                className={`claude-session-item ${isActive ? 'active' : ''}`}
                title={s.preview || 'Cuộc trò chuyện'}
              >
                <MessageSquare
                  size={15}
                  style={{ flexShrink: 0, marginTop: 2, color: isActive ? 'var(--brand-600)' : 'var(--grey-500)' }}
                />
                <div className="claude-session-body">
                  <span className="claude-session-preview">{s.preview || 'Cuộc trò chuyện'}</span>
                  <span className="claude-session-time">{timeAgo(s.lastMessageAt)}</span>
                </div>
                <button
                  type="button"
                  aria-label="Xóa cuộc trò chuyện này"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession?.(s.sessionId);
                  }}
                  className="claude-session-delete-btn"
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="claude-sidebar-footer">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <ShieldCheck size={20} color="var(--brand-600)" style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || user.email || 'Thành viên VIP'}
                </span>
                <span style={{ fontSize: 10.5, color: '#16A34A', fontWeight: 500 }}>• Đã đồng bộ tài khoản</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="var(--brand-600)" />
                <span style={{ fontSize: 11.5, color: 'var(--ink-800)', fontWeight: 500 }}>Lưu trên trình duyệt</span>
              </div>
              <button
                type="button"
                onClick={() => go?.('login')()}
                className="claude-chip-btn"
                style={{ width: '100%', justifyContent: 'center', gap: 6, fontSize: 11.5, padding: '6px 10px', background: 'var(--brand-50)', borderColor: 'var(--brand-500)', color: 'var(--brand-700)', fontWeight: 600 }}
              >
                <LogIn size={13} /> Đăng nhập để đồng bộ
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Claude Chat Main Stage */}
      <main className="claude-chat-main">
        <header className="claude-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              type="button"
              onClick={onToggleSidebar}
              className="claude-action-btn"
              title={sidebarOpen ? 'Thu gọn lịch sử' : 'Mở lịch sử trò chuyện'}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div className="claude-mode-segmented">
              <button
                type="button"
                onClick={conv.switchToBot}
                className={`claude-mode-pill ${!conv.isLiveMode ? 'active' : ''}`}
                title="Hỏi đáp & tra cứu tự động cùng Trợ lý AI DeepSeek v2 (24/7)"
              >
                <Sparkles size={14} color={!conv.isLiveMode ? '#D97706' : '#94A3B8'} />
                <span>Trợ lý AI 24/7</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!conv.isLiveMode) {
                    const u = user || loadAuth()?.user;
                    const prefill = prefillFromUser(u);
                    if (u) {
                      const name = prefill.fullName || u.fullName || u.name || 'Thành viên Biensovip';
                      const phone = prefill.phone || (u.phone || (u.identifierType === 'phone' ? u.identifier : null));
                      conv.requestStaffSupport({ guestName: name, guestPhone: phone });
                      toast.success(`Đang kết nối chuyên viên cho tài khoản ${name}!`);
                    } else {
                      window.dispatchEvent(new CustomEvent('bsv_open_live_chat_modal'));
                    }
                  }
                }}
                className={`claude-mode-pill ${conv.isLiveMode ? 'active live' : ''}`}
                title="Kết nối trực tiếp chuyên viên tư vấn hỗ trợ thủ tục & giữ chỗ biển số"
              >
                <span className="live-dot-pulse" />
                <Headphones size={14} color={conv.isLiveMode ? '#059669' : '#94A3B8'} />
                <span>{conv.liveStaffName ? `Tư vấn viên: ${conv.liveStaffName}` : 'Tư vấn viên trực tiếp'}</span>
                <span className="claude-mode-badge-live">Online</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onNewChat}
              disabled={switchDisabled}
              className="claude-action-btn"
              title="Tạo cuộc trò chuyện mới"
            >
              <Plus size={15} color="var(--brand-600)" />
              <span className="claude-header-btn-text" style={{ fontSize: 13, fontWeight: 500 }}>Đoạn chat mới</span>
            </button>
            <button
              type="button"
              onClick={onNewChat}
              disabled={switchDisabled}
              className="claude-action-btn"
              title="Làm mới cuộc trò chuyện"
            >
              <RotateCcw size={15} />
              <span className="claude-header-btn-text" style={{ fontSize: 13 }}>Làm mới</span>
            </button>
          </div>
        </header>

        <ChatConversationView
          conv={conv}
          onOpenPlate={openPlate}
          onOpenPost={openPost}
          onAction={handleAction}
          autoFocusInput
        />
      </main>
    </div>
  );
}
