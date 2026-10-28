import { useState, useRef, useEffect } from 'react';
import { Send, Phone, MessageCircle, ShieldCheck, Headphones, Check, Copy, UserCheck, AlertCircle, Sparkles, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useClientLiveChatRealtime } from '../services/liveChatRealtime.js';
import { apiClient } from '../services/apiClient.js';
import { DEFAULT_CONTACT } from '../common/constants.js';
import { loadAuth } from '../lib/authStore.js';
import { prefillFromUser } from '../lib/contactPrefill.js';

export const STAFF_SESSION_KEY = 'bsv.liveStaffSessionId';
export const STAFF_SESSIONS_LIST_KEY = 'bsv.liveStaffSessionsList';
export const ZALO_LINK = `https://zalo.me/${DEFAULT_CONTACT.zalo}`;
export const TEL_LINK = `tel:${DEFAULT_CONTACT.phone}`;

export function loadStoredStaffSessionId() {
  try { return localStorage.getItem(STAFF_SESSION_KEY); } catch { return null; }
}
export function storeStaffSessionId(id) {
  try { localStorage.setItem(STAFF_SESSION_KEY, id); } catch { /* ignore */ }
}
export function clearStoredStaffSessionId() {
  try { localStorage.removeItem(STAFF_SESSION_KEY); } catch { /* ignore */ }
}

export function loadStaffSessionsList() {
  try {
    const raw = localStorage.getItem(STAFF_SESSIONS_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStaffSessionToList({ sessionId, preview, lastMessageAt }) {
  if (!sessionId) return;
  try {
    const list = loadStaffSessionsList();
    const existingIdx = list.findIndex((s) => s.sessionId === sessionId);
    const cleanPreview = (preview || 'Trao đổi với Chuyên viên').trim().slice(0, 80);
    const now = lastMessageAt || new Date().toISOString();

    if (existingIdx >= 0) {
      const existing = list[existingIdx];
      const updated = {
        ...existing,
        lastMessageAt: now,
        preview: (!existing.preview || existing.preview === 'Trao đổi với Chuyên viên') ? cleanPreview : existing.preview,
      };
      list.splice(existingIdx, 1);
      list.unshift(updated);
    } else {
      list.unshift({
        sessionId,
        preview: cleanPreview,
        lastMessageAt: now,
      });
    }
    localStorage.setItem(STAFF_SESSIONS_LIST_KEY, JSON.stringify(list.slice(0, 50)));
    window.dispatchEvent(new CustomEvent('bsv_staff_sessions_updated'));
  } catch {
    /* ignore */
  }
}

export function deleteStaffSessionFromList(sessionId) {
  try {
    const list = loadStaffSessionsList().filter((s) => s.sessionId !== sessionId);
    localStorage.setItem(STAFF_SESSIONS_LIST_KEY, JSON.stringify(list));
    if (loadStoredStaffSessionId() === sessionId) {
      clearStoredStaffSessionId();
    }
    window.dispatchEvent(new CustomEvent('bsv_staff_sessions_updated'));
  } catch {
    /* ignore */
  }
}

const STAFF_QUICK_REPLIES = [
  'Kiểm tra tình trạng biển số và giá chuẩn',
  'Tư vấn thủ tục định danh & sang tên Thông tư 24',
  'Hỗ trợ nộp cọc và đấu giá hộ VPA',
  'Cần gọi điện thoại tư vấn trực tiếp',
];

function getStaffGreeting(user) {
  const name = user?.fullName || user?.name || '';
  return {
    from: 'staff',
    senderName: 'Quản lý Duy Đinh',
    text: `Kính chào ${name ? `anh/chị ${name}` : 'Quý khách'}! Tôi là Duy Đinh (Quản lý Biển Số Đẹp Đà Nẵng). Đội ngũ chuyên viên tư vấn đang trực tuyến 24/7. Chúng tôi sẵn sàng hỗ trợ bạn kiểm tra tình trạng biển số, báo giá chi tiết, giữ chỗ biển VIP và hoàn tất thủ tục định danh xe theo Thông tư 24. Bạn đang quan tâm đến biển số nào hoặc cần hỗ trợ thủ tục gì ạ?`,
    createdAt: new Date().toISOString(),
  };
}

export function useLiveStaffConversation(openSessionId, user) {
  const [sessionId, setSessionId] = useState(() => openSessionId || loadStoredStaffSessionId() || crypto.randomUUID());
  const [msgs, setMsgs] = useState(() => [getStaffGreeting(user)]);
  const [input, setInput] = useState('');
  const [isWaitingStaff, setIsWaitingStaff] = useState(true);
  const [liveStaffName, setLiveStaffName] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const requestedRef = useRef(false);

  // Lưu sessionId vào storage
  useEffect(() => {
    if (sessionId) {
      storeStaffSessionId(sessionId);
    }
  }, [sessionId]);

  // Khởi tạo yêu cầu hỗ trợ nếu chưa gửi
  const initSupportRequest = async (targetId) => {
    const u = user || loadAuth()?.user;
    const prefill = prefillFromUser(u);
    const guestName = prefill.fullName || u?.fullName || u?.name || 'Khách hàng';
    const guestPhone = prefill.phone || u?.phone || (u?.identifierType === 'phone' ? u?.identifier : null) || '';

    try {
      await apiClient.post(`/api/live-chat/request-support?sessionId=${targetId}`, {
        guestName,
        guestPhone,
      });
      setIsWaitingStaff(true);
    } catch {
      // ignore
    }
  };

  // Tải lịch sử tin nhắn từ server nếu có
  useEffect(() => {
    let isMounted = true;
    const loadSessionDetail = async () => {
      if (!sessionId) return;
      try {
        const res = await apiClient.get(`/api/live-chat/session/${sessionId}`);
        if (!isMounted) return;
        const detail = res.data || res;
        if (detail && Array.isArray(detail.messages) && detail.messages.length > 0) {
          // Lọc chỉ giữ tin nhắn của User, Staff, System (tuyệt đối không nhận bot)
          const validMsgs = detail.messages
            .filter((m) => m.role !== 'bot')
            .map((m) => ({
              from: m.role === 'user' ? 'user' : (m.role === 'staff' ? 'staff' : 'system'),
              text: m.content,
              senderName: m.senderName,
              createdAt: m.createdAt,
              id: m.id,
            }));

          if (validMsgs.length > 0) {
            setMsgs(validMsgs);
          } else {
            setMsgs([getStaffGreeting(user)]);
          }

          if (detail.assignedStaffName) {
            setLiveStaffName(detail.assignedStaffName);
            setIsWaitingStaff(false);
          } else if (detail.status === 'waiting_staff') {
            setIsWaitingStaff(true);
          }
          requestedRef.current = true;
          return;
        }
      } catch {
        // Chưa có phiên trên server -> tự động tạo mới
      }

      // Nếu chưa có trên server, gửi request-support để đăng ký
      if (!requestedRef.current) {
        requestedRef.current = true;
        initSupportRequest(sessionId);
      }
    };

    loadSessionDetail();
    return () => { isMounted = false; };
  }, [sessionId, user]);

  // Lắng nghe SignalR realtime khi có tin nhắn từ Nhân viên / Quản lý
  useClientLiveChatRealtime(sessionId, {
    onReceiveMessage: (msg) => {
      if (msg.role === 'staff') {
        setMsgs((m) => [...m, { from: 'staff', text: msg.content, senderName: msg.senderName || 'Chuyên viên tư vấn', createdAt: msg.createdAt }]);
        setIsWaitingStaff(false);
        if (msg.senderName) setLiveStaffName(msg.senderName);
      } else if (msg.role === 'system') {
        setMsgs((m) => [...m, { from: 'system', text: msg.content, createdAt: msg.createdAt }]);
      }
    },
    onStatusChanged: (statusInfo) => {
      if (statusInfo.status === 'staff_active') {
        setIsWaitingStaff(false);
        if (statusInfo.staffName) setLiveStaffName(statusInfo.staffName);
      } else if (statusInfo.status === 'waiting_staff') {
        setIsWaitingStaff(true);
      }
      if (statusInfo.message) {
        setMsgs((m) => [...m, { from: 'system', text: statusInfo.message.content }]);
      }
    },
  });

  const send = async (text) => {
    const v = (text ?? input).trim();
    if (!v || isSending) return;

    const userMsg = { from: 'user', text: v, createdAt: new Date().toISOString() };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      await apiClient.post(`/api/live-chat/send?sessionId=${sessionId}`, { content: v });
      saveStaffSessionToList({ sessionId, preview: v, lastMessageAt: new Date().toISOString() });
    } catch {
      setMsgs((m) => [...m, { from: 'system', text: 'Chưa gửi được tin nhắn tới chuyên viên, vui lòng kiểm tra kết nối mạng và thử lại.' }]);
    } finally {
      setIsSending(false);
    }
  };

  const startNewStaffSession = () => {
    const newId = crypto.randomUUID();
    setSessionId(newId);
    storeStaffSessionId(newId);
    setMsgs([getStaffGreeting(user)]);
    setIsWaitingStaff(true);
    setLiveStaffName(null);
    requestedRef.current = true;
    initSupportRequest(newId);
    toast.success('Đã mở phiên kết nối chuyên viên mới!');
  };

  return {
    sessionId,
    msgs,
    input,
    setInput,
    send,
    isSending,
    isWaitingStaff,
    liveStaffName,
    startNewStaffSession,
    setSessionId,
  };
}

export default function LiveStaffChatView({
  user,
  activeSessionId,
  onNewStaffChat,
  autoFocusInput = true,
}) {
  const conv = useLiveStaffConversation(activeSessionId, user);
  const viewportRef = useRef(null);
  const textareaRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conv.msgs, conv.isSending]);

  useEffect(() => {
    if (autoFocusInput) {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, [autoFocusInput]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      conv.send();
    }
  };

  const handleCopy = (text, index) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const u = user || loadAuth()?.user;
  const userName = u?.fullName || u?.name || 'Khách hàng';

  return (
    <div className="claude-conversation-stage" style={{ background: '#FAF9F6' }}>
      {/* Top Banner giới thiệu Quản lý & Chuyên viên trực tiếp */}
      <div style={{
        padding: '14px 24px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            position: 'relative',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
          }}>
            <Headphones size={22} />
            <span style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#10B981',
              border: '2px solid #FFFFFF',
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>
                {conv.liveStaffName ? `Chuyên viên: ${conv.liveStaffName}` : 'Quản lý Duy Đinh & CSKH Trực tiếp'}
              </span>
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: '#DCFCE7',
                color: '#15803D',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span className="live-dot-pulse" style={{ width: 5, height: 5 }} />
                Online 24/7
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--grey-500)' }}>
              Biển Số Đẹp Đà Nẵng • Phản hồi trực tiếp trong 5 – 15 phút • Đang kết nối: <strong>{userName}</strong>
            </span>
          </div>
        </div>

        {/* Nút gọi Hotline & Zalo khẩn cấp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href={ZALO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="claude-chip-btn"
            style={{
              background: '#0068FF',
              color: '#FFFFFF',
              borderColor: '#0068FF',
              padding: '6px 12px',
              fontSize: 12.5,
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(0, 104, 255, 0.25)',
            }}
          >
            <MessageCircle size={14} /> Nhắn Zalo Quản lý
          </a>
          <a
            href={TEL_LINK}
            className="claude-chip-btn"
            style={{
              borderColor: 'var(--brand-500)',
              color: 'var(--brand-700)',
              background: 'var(--brand-50)',
              padding: '6px 12px',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Phone size={14} /> Hotline {DEFAULT_CONTACT.phone}
          </a>
        </div>
      </div>

      {/* Viewport chứa toàn bộ tin nhắn */}
      <div ref={viewportRef} className="claude-viewport">
        {conv.msgs.map((m, i) => {
          // Tin nhắn hệ thống (System)
          if (m.from === 'system') {
            return (
              <div key={i} style={{ textAlign: 'center', margin: '10px 0' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  background: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: 20,
                  fontSize: 12,
                  color: 'var(--grey-600)',
                }}>
                  <AlertCircle size={13} /> {m.text}
                </span>
              </div>
            );
          }

          // Tin nhắn của Chuyên viên / Quản lý (Staff)
          if (m.from === 'staff') {
            return (
              <div key={i} className="claude-msg-row bot">
                <div className="claude-bot-wrapper">
                  <div className="claude-bot-avatar" style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}>
                    <UserCheck size={18} />
                  </div>
                  <div className="claude-bot-content">
                    <div className="claude-bot-header">
                      <span className="claude-bot-name">{m.senderName || 'Chuyên viên tư vấn'}</span>
                      <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>• Nhân sự tư vấn 1:1</span>
                      {m.createdAt && (
                        <span style={{ fontSize: 11, color: 'var(--grey-400)', marginLeft: 6 }}>
                          {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div
                      className="claude-bot-text"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #DCFCE7',
                        borderRadius: '0 16px 16px 16px',
                        padding: '14px 16px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                        lineHeight: 1.6,
                        color: 'var(--ink-900)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.text}
                    </div>

                    <div className="claude-bot-footer" style={{ marginTop: 6 }}>
                      <button
                        type="button"
                        className="claude-action-btn"
                        onClick={() => handleCopy(m.text, i)}
                        title="Sao chép nội dung"
                      >
                        {copiedIndex === i ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                        <span>{copiedIndex === i ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Tin nhắn của Khách hàng (User)
          return (
            <div key={i} className="claude-msg-row user">
              <div
                className="claude-user-bubble"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  borderRadius: '16px 16px 0 16px',
                  padding: '12px 18px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  fontSize: 14.5,
                  maxWidth: '75%',
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {/* Trạng thái đang chuyển tiếp tới nhân viên */}
        {conv.isWaitingStaff && conv.msgs.length <= 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '14px 20px',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 14,
            margin: '16px auto',
            maxWidth: 520,
            color: '#166534',
            fontSize: 13,
          }}>
            <div className="live-dot-pulse" style={{ width: 8, height: 8 }} />
            <span>Đang kết nối tới Quản lý Duy Đinh & Chuyên viên tư vấn... Chuyên viên sẽ trả lời bạn trong ít phút.</span>
          </div>
        )}

        {/* Trạng thái đang gửi */}
        {conv.isSending && (
          <div className="claude-msg-row user">
            <span style={{ fontSize: 12, color: 'var(--grey-400)', fontStyle: 'italic', paddingRight: 8 }}>
              Đang gửi tin nhắn...
            </span>
          </div>
        )}
      </div>

      {/* Floating Composer cho Chat Chuyên viên */}
      <div className="claude-composer-wrapper">
        <div className="claude-composer-inner">
          {/* Quick Replies chips chuyên dụng cho tư vấn viên */}
          <div className="claude-quick-chips">
            {STAFF_QUICK_REPLIES.map((qr) => (
              <button
                key={qr}
                type="button"
                className="claude-chip-btn"
                onClick={() => conv.send(qr)}
                disabled={conv.isSending}
                style={{
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  color: '#065F46',
                  background: '#ECFDF5',
                }}
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Composer Box */}
          <div className="claude-composer-box" style={{ borderColor: 'rgba(16, 185, 129, 0.35)' }}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={conv.input}
              disabled={conv.isSending}
              onChange={(e) => conv.setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn gửi tới Quản lý Duy Đinh & Chuyên viên... (Nhấn Enter để gửi)"
              className="claude-composer-textarea"
              style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
            />
            <button
              type="button"
              onClick={() => conv.send()}
              disabled={conv.isSending || !conv.input.trim()}
              className="claude-composer-send-btn"
              title="Gửi tin nhắn"
              style={{
                background: conv.input.trim() ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : undefined,
                color: '#FFFFFF',
              }}
            >
              <Send size={16} />
            </button>
          </div>

          <div className="claude-composer-disclaimer" style={{ color: '#059669' }}>
            <ShieldCheck size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
            Hội thoại trực tiếp 1:1 với Người quản lý & Chuyên viên CSKH Biensovip. Thông tin trao đổi được bảo mật 100%.
          </div>
        </div>
      </div>
    </div>
  );
}
