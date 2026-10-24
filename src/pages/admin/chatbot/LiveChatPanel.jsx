import { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageSquare, Send, User, Bot, Headphones, CheckCircle2,
  Clock, Phone, Car, AlertCircle, Sparkles, Zap, RotateCcw,
  FileText, Search, ThumbsDown, ThumbsUp, ChevronRight,
  PanelRightClose, PanelRightOpen, X, ExternalLink, CornerDownLeft,
  Loader2, Radio
} from 'lucide-react';
import {
  useLiveChatSessions, useLiveChatSessionDetail, useSendStaffLiveMessage,
  useTakeoverLiveSession, useReturnToBotLiveSession, useResolveLiveSession,
  useConvertLiveSessionToContact, useCannedResponses
} from '../../../services/adminChatbot.js';
import { useAdminLiveChatRealtime } from '../../../services/liveChatRealtime.js';
import { formatDateTime } from '../../../lib/date.js';
import { toZaloUrl } from '../../../lib/zaloMessage.js';

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'waiting', label: 'Chờ hỗ trợ', dotColor: '#ef4444' },
  { key: 'active', label: 'Đang tư vấn', dotColor: '#10b981' },
  { key: 'leads', label: 'Có SĐT/Lead' },
  { key: 'dislikes', label: 'Cần cải thiện' },
  { key: 'resolved', label: 'Đã hoàn tất' },
];

export default function LiveChatPanel({ notify }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [showCannedMenu, setShowCannedMenu] = useState(false);
  const [showCrmPanel, setShowCrmPanel] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Queries
  const { data: sessionsData, isLoading: loadingSessions, refetch: refetchSessions } = useLiveChatSessions({
    tab: activeTab,
    q: search,
    page: 1,
    pageSize: 50,
  });

  const { data: sessionDetail, isLoading: loadingDetail, refetch: refetchDetail } = useLiveChatSessionDetail(selectedSessionId);
  const { data: cannedList = [] } = useCannedResponses();

  // Mutations
  const sendStaffMsg = useSendStaffLiveMessage();
  const takeover = useTakeoverLiveSession();
  const returnToBot = useReturnToBotLiveSession();
  const resolve = useResolveLiveSession();
  const convertToContact = useConvertLiveSessionToContact();

  // SignalR Realtime Hub
  useAdminLiveChatRealtime({
    activeSessionId: selectedSessionId,
    onMessageReceived: (payload) => {
      if (payload?.sessionId === selectedSessionId) {
        refetchDetail();
      }
    },
  });

  const sessions = sessionsData?.items || [];
  const waitingCount = useMemo(() => sessions.filter(s => s.status === 'waiting_staff').length, [sessions]);

  // Tự động chọn session đầu tiên nếu chưa chọn
  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  // Cuộn xuống tin nhắn cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionDetail?.messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !selectedSessionId || sendStaffMsg.isPending) return;

    const content = inputMessage.trim();
    setInputMessage('');
    setShowCannedMenu(false);

    try {
      await sendStaffMsg.mutateAsync({ sessionId: selectedSessionId, content });
      textareaRef.current?.focus();
    } catch (err) {
      notify?.(err.message || 'Lỗi gửi tin nhắn');
    }
  };

  const handleTakeover = async () => {
    if (!selectedSessionId) return;
    try {
      await takeover.mutateAsync(selectedSessionId);
      notify?.('Bạn đã tiếp nhận tư vấn phiên này');
    } catch (err) {
      notify?.(err.message || 'Lỗi tiếp nhận');
    }
  };

  const handleReturnToBot = async () => {
    if (!selectedSessionId) return;
    try {
      await returnToBot.mutateAsync(selectedSessionId);
      notify?.('Đã chuyển quyền phản hồi lại cho Trợ lý AI');
    } catch (err) {
      notify?.(err.message || 'Lỗi chuyển bot');
    }
  };

  const handleResolve = async () => {
    if (!selectedSessionId) return;
    try {
      await resolve.mutateAsync(selectedSessionId);
      notify?.('Đã đóng phiên tư vấn');
    } catch (err) {
      notify?.(err.message || 'Lỗi đóng phiên');
    }
  };

  const handleConvertToContact = async () => {
    if (!selectedSessionId) return;
    try {
      await convertToContact.mutateAsync(selectedSessionId);
      notify?.('Đã tạo Lead CRM thành công trong Quản lý Liên hệ!');
    } catch (err) {
      notify?.(err.message || 'Lỗi tạo Contact Lead');
    }
  };

  const insertCanned = (content) => {
    setInputMessage(content);
    setShowCannedMenu(false);
    textareaRef.current?.focus();
  };

  const filteredCanned = useMemo(() => {
    if (!inputMessage.startsWith('/')) return cannedList;
    const filter = inputMessage.slice(1).toLowerCase();
    return cannedList.filter(c => c.shortcut.toLowerCase().includes(filter) || c.title.toLowerCase().includes(filter));
  }, [cannedList, inputMessage]);

  const zaloUrl = sessionDetail?.guestPhone ? toZaloUrl(sessionDetail.guestPhone) : null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: showCrmPanel ? '320px minmax(400px, 1fr) 290px' : '320px minmax(400px, 1fr)',
      height: 'calc(100vh - 185px)',
      minHeight: 640,
      background: 'var(--white)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      border: '1px solid var(--border-hairline)',
      boxShadow: 'var(--shadow-card)',
      transition: 'grid-template-columns 200ms ease',
    }}>
      <style>{`
        @keyframes bsd-pulse-red {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          50% { opacity: 0.85; transform: scale(1.1); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
        }
        .bsd-chat-session-item:hover {
          background: var(--surface-sunken) !important;
        }
        .bsd-custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .bsd-custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .bsd-custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--grey-300, #cbd5e1);
          border-radius: 4px;
        }
        .bsd-canned-item:hover {
          background: var(--surface-sunken) !important;
        }
      `}</style>

      {/* ================= CỘT 1: DANH SÁCH PHIÊN ================= */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--white)',
        borderRight: '1px solid var(--border-hairline)',
        overflow: 'hidden',
      }}>
        {/* Search Bar */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-hairline)', background: 'var(--surface-sunken)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, SĐT, biển số..."
              style={{
                width: '100%',
                padding: '8px 30px 8px 32px',
                borderRadius: 'var(--radius-field)',
                border: '1px solid var(--border-hairline)',
                font: 'var(--type-body-sm)',
                background: 'var(--white)',
                color: 'var(--text-strong)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 2,
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bsd-custom-scrollbar" style={{
          display: 'flex',
          gap: 4,
          padding: '8px 10px',
          background: 'var(--white)',
          borderBottom: '1px solid var(--border-hairline)',
          overflowX: 'auto',
          flexShrink: 0,
        }}>
          {TABS.map((t) => {
            const isSelected = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                style={{
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '5px 10px',
                  font: 'var(--type-caption)',
                  fontWeight: isSelected ? 600 : 500,
                  background: isSelected ? 'var(--action-primary)' : 'var(--surface-sunken)',
                  color: isSelected ? '#ffffff' : 'var(--text-body)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 120ms ease',
                }}
              >
                {t.dotColor && !isSelected && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dotColor }} />
                )}
                <span>{t.label}</span>
                {t.key === 'waiting' && waitingCount > 0 && (
                  <span style={{
                    background: isSelected ? '#ffffff' : '#ef4444',
                    color: isSelected ? '#ef4444' : '#ffffff',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 10,
                    padding: '1px 6px',
                    animation: isSelected ? 'none' : 'bsd-pulse-red 1.6s infinite ease-in-out',
                  }}>
                    {waitingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List items */}
        <div className="bsd-custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          {loadingSessions ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>
              <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--action-primary)' }} />
              <div>Đang tải danh sách...</div>
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>
              <MessageSquare size={28} strokeWidth={1.5} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div>Không tìm thấy phiên chat nào</div>
            </div>
          ) : (
            sessions.map((s) => {
              const isSelected = s.id === selectedSessionId;
              const isWaiting = s.status === 'waiting_staff';
              const isActive = s.status === 'staff_active';

              return (
                <div
                  key={s.id}
                  className="bsd-chat-session-item"
                  onClick={() => setSelectedSessionId(s.id)}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border-hairline)',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(234, 88, 12, 0.08)'
                      : (isWaiting ? 'rgba(239, 68, 68, 0.04)' : 'transparent'),
                    borderLeft: isSelected
                      ? '3.5px solid var(--action-primary)'
                      : (isWaiting ? '3.5px solid #ef4444' : '3.5px solid transparent'),
                    transition: 'all 120ms ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isWaiting ? '#fee2e2' : (isActive ? 'rgba(234, 88, 12, 0.15)' : 'var(--surface-sunken)'),
                        color: isWaiting ? '#ef4444' : (isActive ? 'var(--action-primary)' : 'var(--text-strong)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                        position: 'relative',
                      }}>
                        {s.guestName ? s.guestName.charAt(0).toUpperCase() : 'K'}
                        {/* Status beacon indicator */}
                        <span style={{
                          position: 'absolute',
                          bottom: -1,
                          right: -1,
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          border: '1.5px solid #ffffff',
                          background: isWaiting ? '#ef4444' : (isActive ? '#10b981' : (s.status === 'resolved' ? '#94a3b8' : '#3b82f6')),
                        }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          font: 'var(--type-body-sm)',
                          fontWeight: 600,
                          color: 'var(--text-strong)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {s.guestName || 'Khách vãng lai'}
                        </div>
                        {s.guestPhone && (
                          <div style={{ font: 'var(--type-caption)', color: '#0284c7', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Phone size={10} /> {s.guestPhone}
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>
                      {formatDateTime(s.lastMessageAt || s.createdAt).split(' ')[1] || ''}
                    </span>
                  </div>

                  {s.detectedPlate && (
                    <div style={{ marginTop: 5, marginBottom: 4 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'var(--surface-sunken)',
                        color: 'var(--text-strong)',
                        padding: '2px 7px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        border: '1px solid var(--border-hairline)',
                        fontFamily: 'monospace',
                        letterSpacing: '0.04em',
                      }}>
                        <Car size={11} style={{ color: 'var(--action-primary)' }} /> {s.detectedPlate}
                      </span>
                    </div>
                  )}

                  <div style={{
                    font: 'var(--type-caption)',
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 2,
                  }}>
                    {s.lastMessagePreview || 'Chưa có tin nhắn'}
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {isWaiting && (
                      <span style={{
                        fontSize: 10.5,
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-pill)',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444' }} />
                        Cần gặp tư vấn
                      </span>
                    )}
                    {isActive && (
                      <span style={{
                        fontSize: 10.5,
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-pill)',
                        background: '#dcfce7',
                        color: '#15803d',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <Headphones size={11} /> {s.assignedStaffName || 'Đang hỗ trợ'}
                      </span>
                    )}
                    {s.status === 'bot' && (
                      <span style={{
                        fontSize: 10.5,
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--surface-sunken)',
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <Bot size={11} /> AI Bot
                      </span>
                    )}
                    {s.hasDislike && (
                      <span title="Có câu trả lời khách chưa hài lòng" style={{ display: 'inline-flex', alignItems: 'center', color: '#ef4444' }}>
                        <ThumbsDown size={12} />
                      </span>
                    )}
                    {s.ledToContact && (
                      <span title="Đã chuyển thành Lead CRM" style={{ display: 'inline-flex', alignItems: 'center', color: '#10b981' }}>
                        <CheckCircle2 size={12} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= CỘT 2: KHUNG CHAT HAI CHIỀU ================= */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--white)',
        overflow: 'hidden',
      }}>
        {selectedSessionId && sessionDetail ? (
          <>
            {/* Header chat */}
            <div style={{
              padding: '12px 18px',
              borderBottom: '1px solid var(--border-hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--white)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'var(--action-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 15,
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                }}>
                  {sessionDetail.guestName ? sessionDetail.guestName.charAt(0).toUpperCase() : 'K'}
                </div>
                <div>
                  <div style={{ font: 'var(--type-body-md)', fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{sessionDetail.guestName || 'Khách hàng'}</span>
                    {sessionDetail.detectedPlate && (
                      <span style={{
                        fontSize: 11.5,
                        padding: '1px 7px',
                        borderRadius: 4,
                        background: 'var(--surface-sunken)',
                        color: 'var(--text-strong)',
                        fontWeight: 700,
                        border: '1px solid var(--border-hairline)',
                        fontFamily: 'monospace',
                        letterSpacing: '0.04em'
                      }}>
                        {sessionDetail.detectedPlate}
                      </span>
                    )}
                  </div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 1 }}>
                    <span>Phụ trách: <strong>{
                      sessionDetail.status === 'waiting_staff' ? 'Đang đợi nhân viên vào' :
                      sessionDetail.status === 'staff_active' ? (sessionDetail.assignedStaffName || 'Tư vấn viên') :
                      sessionDetail.status === 'resolved' ? 'Đã kết thúc' : 'Trợ lý AI tự động'
                    }</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {sessionDetail.status !== 'staff_active' ? (
                  <button
                    type="button"
                    onClick={handleTakeover}
                    disabled={takeover.isPending}
                    style={{
                      border: 'none',
                      borderRadius: 'var(--radius-field)',
                      padding: '7px 14px',
                      background: 'var(--action-primary)',
                      color: '#ffffff',
                      font: 'var(--type-body-sm)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <Headphones size={15} /> Tiếp nhận tư vấn
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReturnToBot}
                    disabled={returnToBot.isPending}
                    style={{
                      border: '1px solid var(--border-hairline)',
                      borderRadius: 'var(--radius-field)',
                      padding: '7px 12px',
                      background: 'var(--white)',
                      color: 'var(--text-strong)',
                      font: 'var(--type-body-sm)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Bot size={15} style={{ color: 'var(--action-primary)' }} /> Chuyển lại cho AI
                  </button>
                )}

                {sessionDetail.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={resolve.isPending}
                    title="Đóng phiên tư vấn này"
                    style={{
                      border: '1px solid var(--border-hairline)',
                      borderRadius: 'var(--radius-field)',
                      padding: '7px 12px',
                      background: 'var(--white)',
                      color: 'var(--text-strong)',
                      font: 'var(--type-body-sm)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <CheckCircle2 size={15} style={{ color: '#10b981' }} /> Hoàn tất
                  </button>
                )}

                {/* Nút ẩn/hiện Panel CRM */}
                <button
                  type="button"
                  onClick={() => setShowCrmPanel(!showCrmPanel)}
                  title={showCrmPanel ? 'Thu gọn panel CRM' : 'Mở rộng panel CRM'}
                  style={{
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-field)',
                    padding: '7px 10px',
                    background: showCrmPanel ? 'var(--surface-sunken)' : 'var(--white)',
                    color: 'var(--text-strong)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {showCrmPanel ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                </button>
              </div>
            </div>

            {/* Khung tin nhắn */}
            <div className="bsd-custom-scrollbar" style={{
              flex: 1,
              padding: '16px 20px',
              overflowY: 'auto',
              background: 'var(--surface-sunken)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              {(sessionDetail.messages || []).map((m) => {
                const isUser = m.role === 'user';
                const isStaff = m.role === 'staff';
                const isSystem = m.role === 'system';
                const isAssistant = m.role === 'assistant';

                if (isSystem) {
                  return (
                    <div key={m.id} style={{ textAlign: 'center', margin: '4px 0' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 14px',
                        background: 'rgba(0,0,0,0.06)',
                        borderRadius: 14,
                        fontSize: 11.5,
                        color: 'var(--text-muted)',
                      }}>
                        <AlertCircle size={12} /> {m.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isStaff ? 'flex-end' : 'flex-start',
                      maxWidth: '78%',
                      alignSelf: isStaff ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginBottom: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0 4px'
                    }}>
                      {isStaff && <span>Tư vấn viên: <strong>{m.senderName || 'Bạn'}</strong></span>}
                      {isUser && <span>Khách: <strong>{m.senderName || 'Khách hàng'}</strong></span>}
                      {isAssistant && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#0284c7' }}>
                          <Bot size={12} /> Trợ lý AI
                        </span>
                      )}
                      <span>• {formatDateTime(m.createdAt).split(' ')[1]}</span>
                    </div>

                    <div style={{
                      padding: '10px 14px',
                      borderRadius: isStaff ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                      background: isStaff ? 'var(--action-primary)' : (isAssistant ? 'var(--white)' : 'var(--white)'),
                      color: isStaff ? '#ffffff' : 'var(--text-strong)',
                      boxShadow: isStaff ? '0 2px 8px rgba(234, 88, 12, 0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
                      font: 'var(--type-body-sm)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      border: isStaff ? 'none' : '1px solid var(--border-hairline)',
                    }}>
                      {m.content}
                    </div>

                    {m.rating !== null && m.rating !== undefined && (
                      <div style={{
                        marginTop: 3,
                        fontSize: 11,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: m.rating === 1 ? '#dcfce7' : '#fee2e2',
                        color: m.rating === 1 ? '#15803d' : '#b91c1c'
                      }}>
                        {m.rating === 1 ? (
                          <>
                            <ThumbsUp size={11} /> Khách thấy hữu ích
                          </>
                        ) : (
                          <>
                            <ThumbsDown size={11} /> Khách chưa hài lòng
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Menu Canned Responses gợi ý khi gõ / */}
            {showCannedMenu && (
              <div className="bsd-custom-scrollbar" style={{
                background: 'var(--white)',
                borderTop: '1px solid var(--border-hairline)',
                maxHeight: 200,
                overflowY: 'auto',
                boxShadow: '0 -6px 16px rgba(0,0,0,0.08)',
                padding: '6px 0',
              }}>
                <div style={{
                  padding: '4px 14px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Mẫu câu trả lời nhanh (Nhấp để chèn)</span>
                  <button
                    type="button"
                    onClick={() => setShowCannedMenu(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                  >
                    <X size={13} />
                  </button>
                </div>
                {filteredCanned.length === 0 ? (
                  <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                    Không tìm thấy câu mẫu phù hợp với từ khóa này.
                  </div>
                ) : (
                  filteredCanned.map((c) => (
                    <div
                      key={c.id}
                      className="bsd-canned-item"
                      onClick={() => insertCanned(c.content)}
                      style={{
                        padding: '7px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 13,
                        transition: 'background 100ms ease',
                      }}
                    >
                      <div style={{ minWidth: 0, paddingRight: 10 }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--action-primary)',
                          background: 'rgba(234, 88, 12, 0.1)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          marginRight: 8
                        }}>
                          {c.shortcut}
                        </span>
                        <strong style={{ color: 'var(--text-strong)' }}>{c.title}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>
                          — {c.content.slice(0, 50)}...
                        </span>
                      </div>
                      <span style={{
                        fontSize: 10.5,
                        color: 'var(--text-muted)',
                        background: 'var(--surface-sunken)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        flexShrink: 0
                      }}>
                        {c.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Composer Input - Hỗ trợ gõ nhiều dòng */}
            <form onSubmit={handleSend} style={{
              padding: '10px 16px',
              background: 'var(--white)',
              borderTop: '1px solid var(--border-hairline)',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
            }}>
              <button
                type="button"
                onClick={() => setShowCannedMenu(!showCannedMenu)}
                title="Mẫu trả lời nhanh (hoặc gõ / trong ô nhập)"
                style={{
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-field)',
                  padding: '9px 12px',
                  background: showCannedMenu ? 'var(--surface-sunken)' : 'var(--white)',
                  color: 'var(--text-strong)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12.5,
                  fontWeight: 600,
                  height: 38,
                  boxSizing: 'border-box'
                }}
              >
                <Zap size={14} style={{ color: 'var(--action-primary)' }} />
                <span>Mẫu /</span>
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  if (e.target.value.startsWith('/')) {
                    setShowCannedMenu(true);
                  } else if (showCannedMenu && !e.target.value.includes('/')) {
                    setShowCannedMenu(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Nhập tin nhắn... (Enter gửi, Shift+Enter xuống dòng, / gọi mẫu câu)"
                style={{
                  flex: 1,
                  minHeight: 38,
                  maxHeight: 110,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-field)',
                  border: '1px solid var(--border-hairline)',
                  font: 'var(--type-body-sm)',
                  color: 'var(--text-strong)',
                  background: 'var(--white)',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.45,
                  boxSizing: 'border-box'
                }}
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || sendStaffMsg.isPending}
                style={{
                  border: 'none',
                  borderRadius: 'var(--radius-field)',
                  padding: '9px 16px',
                  background: inputMessage.trim() ? 'var(--action-primary)' : 'var(--grey-300)',
                  color: '#ffffff',
                  cursor: inputMessage.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  height: 38,
                  transition: 'background 120ms ease',
                }}
              >
                {sendStaffMsg.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                <span>Gửi</span>
              </button>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: 12,
            background: 'var(--surface-sunken)',
          }}>
            <MessageSquare size={44} strokeWidth={1.3} style={{ opacity: 0.35 }} />
            <div style={{ font: 'var(--type-body-md)', fontWeight: 500 }}>Chọn một phiên chat từ danh sách bên trái để bắt đầu</div>
          </div>
        )}
      </div>

      {/* ================= CỘT 3: THÔNG TIN KHÁCH & CRM ================= */}
      {showCrmPanel && (
        <div className="bsd-custom-scrollbar" style={{
          background: 'var(--white)',
          borderLeft: '1px solid var(--border-hairline)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          overflowY: 'auto',
        }}>
          {selectedSessionId && sessionDetail ? (
            <>
              {/* Customer Box */}
              <div>
                <div style={{ font: 'var(--type-caption)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>
                  Thông tin khách hàng
                </div>
                <div style={{
                  background: 'var(--surface-sunken)',
                  padding: 12,
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--border-hairline)'
                }}>
                  <div style={{ font: 'var(--type-body-md)', fontWeight: 700, color: 'var(--text-strong)' }}>
                    {sessionDetail.guestName || 'Chưa cung cấp tên'}
                  </div>
                  <div style={{ font: 'var(--type-body-sm)', color: '#0284c7', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={13} /> {sessionDetail.guestPhone || 'Chưa có số điện thoại'}
                  </div>

                  {/* Call & Zalo Quick Actions */}
                  {sessionDetail.guestPhone && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                      <a
                        href={`tel:${sessionDetail.guestPhone}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-field)',
                          background: 'var(--action-primary)',
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <Phone size={12} /> Gọi ngay
                      </a>
                      {zaloUrl && (
                        <a
                          href={zaloUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-field)',
                            background: '#0068FF',
                            color: '#ffffff',
                            fontSize: 11.5,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={12} /> Nhắn Zalo
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Plate Showcase */}
              <div>
                <div style={{ font: 'var(--type-caption)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>
                  Biển số xe quan tâm
                </div>
                {sessionDetail.detectedPlate ? (
                  <div style={{
                    background: '#ffffff',
                    border: '2px solid #000000',
                    borderRadius: 8,
                    padding: '12px 8px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    position: 'relative'
                  }}>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#000000',
                      letterSpacing: 2
                    }}>
                      {sessionDetail.detectedPlate}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                      Trích xuất tự động qua ngữ cảnh chat
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: 12,
                    background: 'var(--surface-sunken)',
                    borderRadius: 'var(--radius-card)',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    border: '1px solid var(--border-hairline)'
                  }}>
                    Khách chưa nhắc đến biển số cụ thể
                  </div>
                )}
              </div>

              {/* CRM Lead Conversion */}
              <div>
                <div style={{ font: 'var(--type-caption)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>
                  Chuyển đổi CRM
                </div>
                {sessionDetail.ledToContact ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 10,
                    background: '#dcfce7',
                    color: '#15803d',
                    borderRadius: 'var(--radius-card)',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid #bbf7d0'
                  }}>
                    <CheckCircle2 size={16} /> Đã lưu thành Lead CRM
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConvertToContact}
                    disabled={convertToContact.isPending}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: 'var(--radius-field)',
                      padding: '9px 14px',
                      background: '#10b981',
                      color: '#ffffff',
                      font: 'var(--type-body-sm)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {convertToContact.isPending ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                    <span>Tạo Lead CRM ngay</span>
                  </button>
                )}
              </div>

              {/* Session Timeline */}
              <div>
                <div style={{ font: 'var(--type-caption)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>
                  Thông số phiên
                </div>
                <div style={{
                  font: 'var(--type-caption)',
                  color: 'var(--text-body)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: 10,
                  background: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--border-hairline)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Bắt đầu:</span>
                    <span>{formatDateTime(sessionDetail.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cập nhật:</span>
                    <span>{formatDateTime(sessionDetail.lastMessageAt)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tổng tin:</span>
                    <strong style={{ color: 'var(--text-strong)' }}>{sessionDetail.messages?.length || 0} tin nhắn</strong>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', font: 'var(--type-caption)', textAlign: 'center', marginTop: 40 }}>
              Chưa chọn phiên
            </div>
          )}
        </div>
      )}
    </div>
  );
}
