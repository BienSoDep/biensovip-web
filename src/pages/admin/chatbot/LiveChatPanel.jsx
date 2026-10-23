import { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageSquare, Send, User, Bot, Headphones, CheckCircle2,
  Clock, Phone, Car, AlertCircle, Sparkles, Zap, RotateCcw,
  FileText, Search, ThumbsDown, ThumbsUp, ChevronRight
} from 'lucide-react';
import {
  useLiveChatSessions, useLiveChatSessionDetail, useSendStaffLiveMessage,
  useTakeoverLiveSession, useReturnToBotLiveSession, useResolveLiveSession,
  useConvertLiveSessionToContact, useCannedResponses
} from '../../../services/adminChatbot.js';
import { useAdminLiveChatRealtime } from '../../../services/liveChatRealtime.js';
import { formatDateTime } from '../../../lib/date.js';

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'waiting', label: 'Chờ hỗ trợ', badgeColor: '#ef4444' },
  { key: 'active', label: 'Đang tư vấn', badgeColor: '#10b981' },
  { key: 'leads', label: 'Có SĐT/Lead' },
  { key: 'dislikes', label: 'Không hài lòng' },
  { key: 'resolved', label: 'Đã hoàn tất' },
];

export default function LiveChatPanel({ notify }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [showCannedMenu, setShowCannedMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
      inputRef.current?.focus();
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
      notify?.('Đã chuyển thành Lead CRM trong Quản lý Liên hệ!');
    } catch (err) {
      notify?.(err.message || 'Lỗi tạo Contact Lead');
    }
  };

  const insertCanned = (content) => {
    setInputMessage(content);
    setShowCannedMenu(false);
    inputRef.current?.focus();
  };

  const filteredCanned = useMemo(() => {
    if (!inputMessage.startsWith('/')) return cannedList;
    const filter = inputMessage.slice(1).toLowerCase();
    return cannedList.filter(c => c.shortcut.toLowerCase().includes(filter) || c.title.toLowerCase().includes(filter));
  }, [cannedList, inputMessage]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr 280px',
      gap: 'var(--space-3)',
      height: 'calc(100vh - 190px)',
      minHeight: 650,
      background: 'var(--grey-50)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      border: '1px solid var(--grey-200)',
    }}>
      {/* ================= CỘT 1: DANH SÁCH PHIÊN ================= */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--white)',
        borderRight: '1px solid var(--grey-200)',
        overflow: 'hidden',
      }}>
        {/* Search */}
        <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--grey-100)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, SĐT, biển số..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 34px',
                borderRadius: 'var(--radius-field)',
                border: '1px solid var(--grey-200)',
                font: 'var(--type-body-sm)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: 4,
          padding: '6px 8px',
          background: 'var(--grey-50)',
          borderBottom: '1px solid var(--grey-200)',
          overflowX: 'auto',
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
                  fontWeight: isSelected ? 'var(--fw-semibold)' : 'var(--fw-normal)',
                  background: isSelected ? 'var(--action-primary)' : 'transparent',
                  color: isSelected ? 'var(--white)' : 'var(--text-body)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{t.label}</span>
                {t.key === 'waiting' && waitingCount > 0 && (
                  <span style={{
                    background: isSelected ? 'var(--white)' : '#ef4444',
                    color: isSelected ? '#ef4444' : 'var(--white)',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 10,
                    padding: '1px 5px',
                  }}>
                    {waitingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingSessions ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-faint)', font: 'var(--type-body-sm)' }}>
              Đang tải danh sách...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-faint)', font: 'var(--type-body-sm)' }}>
              Không có phiên chat nào
            </div>
          ) : (
            sessions.map((s) => {
              const isSelected = s.id === selectedSessionId;
              const isWaiting = s.status === 'waiting_staff';
              const isActive = s.status === 'staff_active';

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  style={{
                    padding: '12px var(--space-3)',
                    borderBottom: '1px solid var(--grey-100)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(234, 88, 12, 0.08)' : (isWaiting ? 'rgba(239, 68, 68, 0.04)' : 'transparent'),
                    borderLeft: isSelected ? '4px solid var(--action-primary)' : (isWaiting ? '4px solid #ef4444' : '4px solid transparent'),
                    transition: 'all 120ms ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isWaiting ? '#ef4444' : (isActive ? 'var(--action-primary)' : 'var(--grey-200)'),
                        color: isWaiting || isActive ? 'var(--white)' : 'var(--text-body)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {s.guestName ? s.guestName.charAt(0).toUpperCase() : 'K'}
                      </div>
                      <div>
                        <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-title)' }}>
                          {s.guestName || 'Khách vãng lai'}
                        </div>
                        {s.guestPhone && (
                          <div style={{ font: 'var(--type-caption)', color: '#0284c7', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Phone size={11} /> {s.guestPhone}
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', fontSize: 11 }}>
                      {formatDateTime(s.lastMessageAt || s.createdAt).split(' ')[1] || ''}
                    </span>
                  </div>

                  {s.detectedPlate && (
                    <div style={{ marginTop: 4, marginBottom: 4 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        border: '1px solid #fde68a',
                      }}>
                        <Car size={11} /> {s.detectedPlate}
                      </span>
                    </div>
                  )}

                  <div style={{
                    font: 'var(--type-caption)',
                    color: 'var(--text-faint)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 2,
                  }}>
                    {s.lastMessagePreview || 'Chưa có tin nhắn'}
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                    {isWaiting && (
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}>
                        Cần gặp tư vấn
                      </span>
                    )}
                    {isActive && (
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                        {s.assignedStaffName || 'Đang hỗ trợ'}
                      </span>
                    )}
                    {s.status === 'bot' && (
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--grey-100)', color: 'var(--text-faint)' }}>
                        AI Bot
                      </span>
                    )}
                    {s.hasDislike && (
                      <span title="Có tin nhắn bị chấm không hữu ích" style={{ display: 'inline-flex', alignItems: 'center', color: '#ef4444' }}>
                        <ThumbsDown size={11} />
                      </span>
                    )}
                    {s.ledToContact && (
                      <span title="Đã chuyển thành Contact Lead" style={{ display: 'inline-flex', alignItems: 'center', color: '#10b981' }}>
                        <CheckCircle2 size={11} />
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
              padding: '12px var(--space-4)',
              borderBottom: '1px solid var(--grey-200)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--white)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--action-primary)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}>
                  {sessionDetail.guestName ? sessionDetail.guestName.charAt(0).toUpperCase() : 'K'}
                </div>
                <div>
                  <div style={{ font: 'var(--type-body-md)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-title)' }}>
                    {sessionDetail.guestName || 'Khách hàng'}
                    {sessionDetail.detectedPlate && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 12,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: '#fef3c7',
                        color: '#92400e',
                        fontWeight: 700,
                      }}>
                        {sessionDetail.detectedPlate}
                      </span>
                    )}
                  </div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', display: 'flex', gap: 8 }}>
                    <span>Trạng thái: <strong>{
                      sessionDetail.status === 'waiting_staff' ? 'Chờ tư vấn viên' :
                      sessionDetail.status === 'staff_active' ? `Đang chat với ${sessionDetail.assignedStaffName || 'Nhân viên'}` :
                      sessionDetail.status === 'resolved' ? 'Đã hoàn tất' : 'Trợ lý AI'
                    }</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                {sessionDetail.status !== 'staff_active' ? (
                  <button
                    type="button"
                    onClick={handleTakeover}
                    disabled={takeover.isPending}
                    style={{
                      border: 'none',
                      borderRadius: 'var(--radius-field)',
                      padding: '8px 12px',
                      background: 'var(--action-primary)',
                      color: 'var(--white)',
                      font: 'var(--type-body-sm)',
                      fontWeight: 'var(--fw-semibold)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
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
                      border: '1px solid var(--grey-300)',
                      borderRadius: 'var(--radius-field)',
                      padding: '8px 12px',
                      background: 'var(--white)',
                      color: 'var(--text-body)',
                      font: 'var(--type-body-sm)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Bot size={15} /> Chuyển lại cho AI
                  </button>
                )}

                {sessionDetail.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={resolve.isPending}
                    style={{
                      border: '1px solid var(--grey-300)',
                      borderRadius: 'var(--radius-field)',
                      padding: '8px 12px',
                      background: 'var(--white)',
                      color: 'var(--text-body)',
                      font: 'var(--type-body-sm)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <CheckCircle2 size={15} /> Hoàn tất phiên
                  </button>
                )}
              </div>
            </div>

            {/* Khung tin nhắn */}
            <div style={{
              flex: 1,
              padding: 'var(--space-4)',
              overflowY: 'auto',
              background: '#f8fafc',
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
                        gap: 4,
                        padding: '4px 12px',
                        background: 'rgba(0,0,0,0.05)',
                        borderRadius: 12,
                        fontSize: 11,
                        color: 'var(--text-faint)',
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
                      maxWidth: '75%',
                      alignSelf: isStaff ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-faint)',
                      marginBottom: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {isStaff && <span>Tư vấn viên: <strong>{m.senderName || 'Bạn'}</strong></span>}
                      {isUser && <span>Khách: <strong>{m.senderName || 'Khách hàng'}</strong></span>}
                      {isAssistant && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Bot size={12} /> Trợ lý AI</span>}
                      <span>• {formatDateTime(m.createdAt).split(' ')[1]}</span>
                    </div>

                    <div style={{
                      padding: '10px 14px',
                      borderRadius: isStaff ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isStaff ? 'var(--action-primary)' : (isAssistant ? 'var(--white)' : '#e2e8f0'),
                      color: isStaff ? 'var(--white)' : 'var(--text-body)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      font: 'var(--type-body-sm)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      border: isAssistant ? '1px solid var(--grey-200)' : 'none',
                    }}>
                      {m.content}
                    </div>

                    {m.rating !== null && m.rating !== undefined && (
                      <div style={{ marginTop: 2, fontSize: 11, color: m.rating === 1 ? '#10b981' : '#ef4444' }}>
                        {m.rating === 1 ? '👍 Khách đánh giá hữu ích' : '👎 Khách đánh giá chưa hài lòng'}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Menu Canned Responses gợi ý khi gõ / */}
            {showCannedMenu && (
              <div style={{
                background: 'var(--white)',
                borderTop: '1px solid var(--grey-200)',
                maxHeight: 180,
                overflowY: 'auto',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
                padding: '6px 0',
              }}>
                <div style={{ padding: '4px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  Gợi ý câu trả lời mẫu (Nhấn để chèn)
                </div>
                {filteredCanned.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => insertCanned(c.content)}
                    style={{
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 13,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--grey-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <strong style={{ color: 'var(--action-primary)' }}>{c.shortcut}</strong> - {c.title}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{c.category}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Composer Input */}
            <form onSubmit={handleSend} style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--white)',
              borderTop: '1px solid var(--grey-200)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <button
                type="button"
                onClick={() => setShowCannedMenu(!showCannedMenu)}
                title="Mẫu trả lời nhanh (hoặc gõ / trong ô nhập)"
                style={{
                  border: '1px solid var(--grey-300)',
                  borderRadius: 'var(--radius-field)',
                  padding: '8px 10px',
                  background: showCannedMenu ? 'var(--grey-100)' : 'var(--white)',
                  color: 'var(--text-body)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Zap size={15} color="var(--action-primary)" /> Mẫu /
              </button>

              <input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  if (e.target.value.startsWith('/')) {
                    setShowCannedMenu(true);
                  } else if (showCannedMenu) {
                    setShowCannedMenu(false);
                  }
                }}
                placeholder="Nhập tin nhắn trả lời (hoặc gõ / để chọn mẫu)..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-field)',
                  border: '1px solid var(--grey-300)',
                  font: 'var(--type-body-sm)',
                  outline: 'none',
                }}
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || sendStaffMsg.isPending}
                style={{
                  border: 'none',
                  borderRadius: 'var(--radius-field)',
                  padding: '10px 16px',
                  background: inputMessage.trim() ? 'var(--action-primary)' : 'var(--grey-300)',
                  color: 'var(--white)',
                  cursor: inputMessage.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  transition: 'background 120ms ease',
                }}
              >
                <Send size={15} /> Gửi
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
            color: 'var(--text-faint)',
            gap: 12,
          }}>
            <MessageSquare size={48} strokeWidth={1.2} />
            <div style={{ font: 'var(--type-body-md)' }}>Chọn một phiên chat từ danh sách để bắt đầu tư vấn</div>
          </div>
        )}
      </div>

      {/* ================= CỘT 3: THÔNG TIN KHÁCH & CRM ================= */}
      <div style={{
        background: 'var(--white)',
        borderLeft: '1px solid var(--grey-200)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        overflowY: 'auto',
      }}>
        {selectedSessionId && sessionDetail ? (
          <>
            <div>
              <div style={{ font: 'var(--type-caption)', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 700, marginBottom: 8 }}>
                Khách hàng
              </div>
              <div style={{ background: 'var(--grey-50)', padding: 12, borderRadius: 'var(--radius-card)', border: '1px solid var(--grey-200)' }}>
                <div style={{ font: 'var(--type-body-md)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-title)' }}>
                  {sessionDetail.guestName || 'Chưa cung cấp tên'}
                </div>
                <div style={{ font: 'var(--type-body-sm)', color: '#0284c7', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} /> {sessionDetail.guestPhone || 'Chưa có SĐT'}
                </div>
              </div>
            </div>

            <div>
              <div style={{ font: 'var(--type-caption)', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 700, marginBottom: 8 }}>
                Biển số xe quan tâm
              </div>
              {sessionDetail.detectedPlate ? (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  padding: 12,
                  borderRadius: 'var(--radius-card)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#92400e', letterSpacing: 1 }}>
                    {sessionDetail.detectedPlate}
                  </div>
                  <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>
                    Trích xuất tự động qua hội thoại
                  </div>
                </div>
              ) : (
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                  Khách chưa đề cập biển số cụ thể
                </div>
              )}
            </div>

            <div>
              <div style={{ font: 'var(--type-caption)', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 700, marginBottom: 8 }}>
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
                }}>
                  <CheckCircle2 size={16} /> Đã tạo Lead trong Contact CRM
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
                    padding: '10px 14px',
                    background: '#10b981',
                    color: 'var(--white)',
                    font: 'var(--type-body-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <FileText size={16} /> Tạo Lead CRM ngay
                </button>
              )}
            </div>

            <div>
              <div style={{ font: 'var(--type-caption)', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 700, marginBottom: 8 }}>
                Chi tiết phiên
              </div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-body)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>Bắt đầu: {formatDateTime(sessionDetail.createdAt)}</div>
                <div>Gần nhất: {formatDateTime(sessionDetail.lastMessageAt)}</div>
                <div>Tổng tin nhắn: {sessionDetail.messages?.length || 0}</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-faint)', font: 'var(--type-caption)', textAlign: 'center', marginTop: 40 }}>
            Chưa chọn phiên
          </div>
        )}
      </div>
    </div>
  );
}
