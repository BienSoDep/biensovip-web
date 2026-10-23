import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Plus, MessageSquare, RotateCcw, ShieldCheck,
  PanelLeftClose, PanelLeftOpen, Trash2, LogIn, Clock, X, Headphones, UserCheck
} from 'lucide-react';
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
import LiveStaffChatView, {
  loadStoredStaffSessionId,
  storeStaffSessionId,
  clearStoredStaffSessionId,
  loadStaffSessionsList,
  deleteStaffSessionFromList,
} from '../components/LiveStaffChatView.jsx';
import { useMyChatbotSessions } from '../services/chatbotService.js';
import { useSeo } from '../hooks/useSeo.js';

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

  // Xác định chế độ chat ban đầu từ URL (?mode=staff hoặc ?mode=ai)
  const [chatMode, setChatMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('mode') === 'staff' ? 'staff' : 'ai';
    }
    return 'ai';
  });

  const [aiResetKey, setAiResetKey] = useState(0);
  const [staffResetKey, setStaffResetKey] = useState(0);

  const [activeAiSessionId, setActiveAiSessionId] = useState(null);
  const [activeStaffSessionId, setActiveStaffSessionId] = useState(() => loadStoredStaffSessionId());

  // On mobile (<= 768px), sidebar is closed by default to focus on conversation stage
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 768 : true));

  // Lịch sử AI sessions
  const [localAiSessions, setLocalAiSessions] = useState(() => loadSessionsList());
  const aiSessionsQuery = useMyChatbotSessions(!!user);

  // Lịch sử Staff sessions
  const [staffSessions, setStaffSessions] = useState(() => loadStaffSessionsList());

  useEffect(() => {
    const handleAiUpdate = () => setLocalAiSessions(loadSessionsList());
    const handleStaffUpdate = () => setStaffSessions(loadStaffSessionsList());

    window.addEventListener('bsv_chat_sessions_updated', handleAiUpdate);
    window.addEventListener('bsv_staff_sessions_updated', handleStaffUpdate);

    return () => {
      window.removeEventListener('bsv_chat_sessions_updated', handleAiUpdate);
      window.removeEventListener('bsv_staff_sessions_updated', handleStaffUpdate);
    };
  }, []);

  // Đồng bộ popstate nếu người dùng bấm Back/Forward trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      const m = p.get('mode') === 'staff' ? 'staff' : 'ai';
      setChatMode(m);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Merge server AI sessions (if logged in) and local guest sessions
  const combinedAiSessions = useMemo(() => {
    const map = new Map();
    (aiSessionsQuery.data || []).forEach((s) => {
      map.set(s.sessionId, { ...s, isServer: true });
    });
    (localAiSessions || []).forEach((s) => {
      if (!map.has(s.sessionId)) {
        map.set(s.sessionId, { ...s, isLocal: true });
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
    );
  }, [aiSessionsQuery.data, localAiSessions]);

  // Chuyển chế độ dứt khoát giữa AI và Chuyên viên
  const handleSwitchMode = (targetMode) => {
    if (chatMode === targetMode) return;
    setChatMode(targetMode);

    if (typeof window !== 'undefined') {
      const newUrl = targetMode === 'staff' ? '/tro-ly-ai?mode=staff' : '/tro-ly-ai?mode=ai';
      window.history.pushState(null, '', newUrl);
    }
  };

  // Tạo mới cuộc trò chuyện AI
  const handleNewAiChat = () => {
    clearStoredSessionId();
    setActiveAiSessionId(null);
    setAiResetKey((k) => k + 1);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
    toast.success('Đã bắt đầu cuộc trò chuyện AI mới');
  };

  // Mở session AI
  const handleOpenAiSession = (id) => {
    storeSessionId(id);
    setActiveAiSessionId(id);
    setAiResetKey((k) => k + 1);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // Xóa session AI
  const handleDeleteAiSession = (sessionId) => {
    deleteSessionFromList(sessionId);
    if (activeAiSessionId === sessionId || loadStoredSessionId() === sessionId) {
      handleNewAiChat();
    }
  };

  // Tạo mới phiên tư vấn với Chuyên viên
  const handleNewStaffChat = () => {
    const newId = crypto.randomUUID();
    storeStaffSessionId(newId);
    setActiveStaffSessionId(newId);
    setStaffResetKey((k) => k + 1);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
    toast.success('Đã mở phiên kết nối chuyên viên mới');
  };

  // Mở session Chuyên viên
  const handleOpenStaffSession = (id) => {
    storeStaffSessionId(id);
    setActiveStaffSessionId(id);
    setStaffResetKey((k) => k + 1);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // Xóa session Chuyên viên
  const handleDeleteStaffSession = (sessionId) => {
    deleteStaffSessionFromList(sessionId);
    if (activeStaffSessionId === sessionId || loadStoredStaffSessionId() === sessionId) {
      handleNewStaffChat();
    }
  };

  return (
    <div className="claude-chat-outer">
      <div className="claude-chat-page">
        {/* Mobile backdrop for drawer */}
        <div
          className={`claude-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Claude Sidebar - Quản lý lịch sử phân tách rõ ràng */}
        <aside className={`claude-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
          <div className="claude-sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {chatMode === 'ai' ? (
                <button
                  type="button"
                  onClick={handleNewAiChat}
                  className="claude-btn-new-chat"
                  title="Bắt đầu phiên hội thoại AI mới"
                  style={{ flex: 1 }}
                >
                  <Plus size={18} /> Cuộc trò chuyện mới
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNewStaffChat}
                  className="claude-btn-new-chat"
                  title="Mở phiên trao đổi mới với Chuyên viên"
                  style={{ flex: 1, borderColor: 'rgba(16, 185, 129, 0.4)', color: '#065F46', background: '#ECFDF5' }}
                >
                  <Plus size={18} /> Phiên tư vấn mới
                </button>
              )}

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="claude-sidebar-close-btn"
                title="Đóng sidebar"
                aria-label="Đóng sidebar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Toggle chọn lịch sử trong sidebar */}
            <div style={{
              display: 'flex',
              background: '#F1F5F9',
              padding: 2,
              borderRadius: 8,
              gap: 2,
            }}>
              <button
                type="button"
                onClick={() => handleSwitchMode('ai')}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: chatMode === 'ai' ? '#FFFFFF' : 'transparent',
                  color: chatMode === 'ai' ? '#D97706' : '#64748B',
                  fontWeight: chatMode === 'ai' ? 600 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: chatMode === 'ai' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 120ms ease',
                }}
              >
                <Sparkles size={13} /> Trợ lý AI
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('staff')}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: chatMode === 'staff' ? '#FFFFFF' : 'transparent',
                  color: chatMode === 'staff' ? '#059669' : '#64748B',
                  fontWeight: chatMode === 'staff' ? 600 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: chatMode === 'staff' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 120ms ease',
                }}
              >
                <Headphones size={13} /> Chuyên viên
              </button>
            </div>

            <div className="claude-sidebar-title">
              {chatMode === 'ai' ? 'Lịch sử Trợ lý AI' : 'Lịch sử Tư vấn trực tiếp'}
            </div>
          </div>

          {/* Danh sách Sessions: Chế độ AI */}
          {chatMode === 'ai' && (
            <div className="claude-sessions-list">
              {aiSessionsQuery.isLoading && combinedAiSessions.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 4px' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton-shimmer" style={{ height: 42, borderRadius: 8 }} />
                  ))}
                </div>
              )}

              {!aiSessionsQuery.isLoading && combinedAiSessions.length === 0 && (
                <div style={{ padding: '32px 16px', fontSize: 13, color: 'var(--grey-400)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Clock size={24} style={{ opacity: 0.4 }} />
                  <span>Chưa có cuộc trò chuyện nào</span>
                  <span style={{ fontSize: 11, color: 'var(--grey-500)' }}>Hỏi AI để bắt đầu lưu lại lịch sử hội thoại của bạn.</span>
                </div>
              )}

              {combinedAiSessions.map((s) => {
                const isActive = s.sessionId === (activeAiSessionId || loadStoredSessionId());
                return (
                  <div
                    key={s.sessionId}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenAiSession(s.sessionId)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenAiSession(s.sessionId); }}
                    className={`claude-session-item ${isActive ? 'active' : ''}`}
                    title={s.preview || 'Cuộc trò chuyện AI'}
                  >
                    <MessageSquare
                      size={15}
                      style={{ flexShrink: 0, marginTop: 2, color: isActive ? 'var(--brand-600)' : 'var(--grey-500)' }}
                    />
                    <div className="claude-session-body">
                      <span className="claude-session-preview">{s.preview || 'Cuộc trò chuyện AI'}</span>
                      <span className="claude-session-time">{timeAgo(s.lastMessageAt)}</span>
                    </div>
                    <button
                      type="button"
                      aria-label="Xóa cuộc trò chuyện này"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAiSession(s.sessionId);
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
          )}

          {/* Danh sách Sessions: Chế độ Chuyên viên trực tiếp */}
          {chatMode === 'staff' && (
            <div className="claude-sessions-list">
              {staffSessions.length === 0 && (
                <div style={{ padding: '32px 16px', fontSize: 13, color: 'var(--grey-400)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <UserCheck size={24} style={{ opacity: 0.4, color: '#10B981' }} />
                  <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>Phiên tư vấn hiện tại</span>
                  <span style={{ fontSize: 11.5, color: 'var(--grey-500)' }}>Gửi tin nhắn để bắt đầu lưu phiên trao đổi với Quản lý Duy Đinh.</span>
                </div>
              )}

              {staffSessions.map((s) => {
                const isActive = s.sessionId === (activeStaffSessionId || loadStoredStaffSessionId());
                return (
                  <div
                    key={s.sessionId}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenStaffSession(s.sessionId)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenStaffSession(s.sessionId); }}
                    className={`claude-session-item ${isActive ? 'active' : ''}`}
                    style={isActive ? { background: '#DCFCE7' } : undefined}
                    title={s.preview || 'Trao đổi với Chuyên viên'}
                  >
                    <Headphones
                      size={15}
                      style={{ flexShrink: 0, marginTop: 2, color: isActive ? '#059669' : '#94A3B8' }}
                    />
                    <div className="claude-session-body">
                      <span className="claude-session-preview" style={{ color: isActive ? '#065F46' : undefined }}>
                        {s.preview || 'Trao đổi với Chuyên viên'}
                      </span>
                      <span className="claude-session-time">{timeAgo(s.lastMessageAt)}</span>
                    </div>
                    <button
                      type="button"
                      aria-label="Xóa phiên tư vấn này"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStaffSession(s.sessionId);
                      }}
                      className="claude-session-delete-btn"
                      title="Xóa phiên tư vấn"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="claude-sidebar-footer">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <ShieldCheck size={20} color="var(--brand-600)" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name || user.fullName || user.email || 'Thành viên VIP'}
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
          {/* Header với bộ chuyển đổi chế độ Segmented Pill rõ ràng */}
          <header className="claude-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="claude-action-btn"
                title={sidebarOpen ? 'Thu gọn lịch sử' : 'Mở lịch sử trò chuyện'}
              >
                {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              </button>

              <div className="claude-mode-segmented">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('ai')}
                  className={`claude-mode-pill ${chatMode === 'ai' ? 'active' : ''}`}
                  title="Hỏi đáp & tra cứu tự động cùng Trợ lý AI DeepSeek v2 (24/7)"
                >
                  <Sparkles size={14} color={chatMode === 'ai' ? '#D97706' : '#94A3B8'} />
                  <span>Trợ lý AI 24/7</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchMode('staff')}
                  className={`claude-mode-pill ${chatMode === 'staff' ? 'active live' : ''}`}
                  title="Kết nối trực tiếp chuyên viên tư vấn hỗ trợ thủ tục & giữ chỗ biển số"
                >
                  <span className="live-dot-pulse" />
                  <Headphones size={14} color={chatMode === 'staff' ? '#059669' : '#94A3B8'} />
                  <span>Tư vấn viên trực tiếp</span>
                  <span className="claude-mode-badge-live">Online</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {chatMode === 'ai' ? (
                <>
                  <button
                    type="button"
                    onClick={handleNewAiChat}
                    className="claude-action-btn"
                    title="Tạo cuộc trò chuyện AI mới"
                  >
                    <Plus size={15} color="var(--brand-600)" />
                    <span className="claude-header-btn-text" style={{ fontSize: 13, fontWeight: 500 }}>Đoạn chat mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNewAiChat}
                    className="claude-action-btn"
                    title="Làm mới cuộc trò chuyện"
                  >
                    <RotateCcw size={15} />
                    <span className="claude-header-btn-text" style={{ fontSize: 13 }}>Làm mới</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleNewStaffChat}
                    className="claude-action-btn"
                    title="Mở phiên trao đổi mới với Chuyên viên"
                  >
                    <Plus size={15} color="#059669" />
                    <span className="claude-header-btn-text" style={{ fontSize: 13, fontWeight: 500, color: '#059669' }}>Phiên tư vấn mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNewStaffChat}
                    className="claude-action-btn"
                    title="Kết nối lại chuyên viên"
                  >
                    <RotateCcw size={15} />
                    <span className="claude-header-btn-text" style={{ fontSize: 13 }}>Kết nối lại</span>
                  </button>
                </>
              )}
            </div>
          </header>

          {/* CHẾ ĐỘ 1: Cuộc trò chuyện thuần AI (Trợ lý AI 24/7) */}
          {chatMode === 'ai' && (
            <ChatbotAiStage
              key={aiResetKey}
              go={go}
              openPlate={openPlate}
              openPost={openPost}
              activeSessionId={activeAiSessionId}
              onSwitchToStaff={() => handleSwitchMode('staff')}
            />
          )}

          {/* CHẾ ĐỘ 2: Cuộc trò chuyện thuần Chuyên viên / Người quản lý (Tư vấn viên trực tiếp 1:1) */}
          {chatMode === 'staff' && (
            <LiveStaffChatView
              key={staffResetKey}
              user={user}
              activeSessionId={activeStaffSessionId}
              onNewStaffChat={handleNewStaffChat}
              autoFocusInput
            />
          )}
        </main>
      </div>
    </div>
  );
}

function ChatbotAiStage({ go, openPlate: onOpenPlateProp, openPost: onOpenPostProp, activeSessionId, onSwitchToStaff }) {
  const conv = useChatConversation(activeSessionId);

  const handleAction = (action) => {
    if (action === 'chat_with_staff' || action === 'contact_form') {
      onSwitchToStaff?.();
    }
  };

  const openPlate = (slugOrId) => {
    if (onOpenPlateProp) onOpenPlateProp(slugOrId);
    else go?.('detail', slugOrId)();
  };

  const openPost = (slug) => {
    if (onOpenPostProp) onOpenPostProp(slug);
    else go?.('post', slug)();
  };

  return (
    <ChatConversationView
      conv={conv}
      onOpenPlate={openPlate}
      onOpenPost={openPost}
      onAction={handleAction}
      onSwitchToStaff={onSwitchToStaff}
      autoFocusInput
    />
  );
}
