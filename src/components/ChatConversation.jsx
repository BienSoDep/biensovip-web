import { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, MessageCircle, Phone, BookOpen } from 'lucide-react';
import { useSendChatbotMessage, useChatbotHistory, useRateChatbotMessage, useReportChatbotPlateClick } from '../services/chatbotService.js';
import { getCurrentPlateNumber } from '../lib/currentPlateContext.js';
import { DEFAULT_CONTACT } from '../common/constants.js';

export const ACTION_LABEL = { chat_with_staff: 'Chat với nhân viên', contact_form: 'Để lại thông tin liên hệ' };
export const ZALO_LINK = `https://zalo.me/${DEFAULT_CONTACT.zalo}`;
export const TEL_LINK = `tel:${DEFAULT_CONTACT.phone}`;
export const SESSION_KEY = 'bsv.chatSessionId';
const GREETING = { from: 'bot', text: 'Chào bạn! Tôi là trợ lý Biensovip. Bạn cần tư vấn gì về biển số ạ?' };

export function loadStoredSessionId() {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}
export function storeSessionId(id) {
  try { localStorage.setItem(SESSION_KEY, id); } catch { /* ignore */ }
}
export function clearStoredSessionId() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

const GREETING_QUICK_REPLIES = ['Xem biển giá dưới 100 triệu', 'Tìm biển hợp mệnh của tôi', 'Cách đặt cọc?'];
const PLATE_FOUND_QUICK_REPLIES = ['Ý nghĩa biển số này là gì?', 'Còn hàng không?', 'Cách đặt cọc?'];
const NO_RESULT_QUICK_REPLIES = ['Xem biển giá dưới 100 triệu', 'Chat với nhân viên tư vấn'];

// Định dạng markdown tối giản cho tin nhắn bot — chỉ **in đậm** + xuống dòng, KHÔNG dùng thư viện
// markdown full (marked) để tránh render HTML tùy ý từ AI (dù đã giới hạn chủ đề, vẫn escape trước
// khi chèn — an toàn tuyệt đối trước injection dù model có bị chọc cho xuất HTML/script).
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderMarkdownLite(text) {
  const escaped = escapeHtml(text || '');
  const bolded = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return bolded.replace(/\n/g, '<br/>');
}

// Gợi ý câu hỏi tiếp theo — rule-based theo nội dung tin bot vừa trả lời, không cần đổi prompt AI.
function nextQuickReplies(lastMsg) {
  if (!lastMsg || lastMsg.from !== 'bot') return [];
  if (lastMsg.plates?.length > 0) return PLATE_FOUND_QUICK_REPLIES;
  if (/không tìm thấy|không có thông tin/i.test(lastMsg.text || '')) return NO_RESULT_QUICK_REPLIES;
  return GREETING_QUICK_REPLIES;
}

/// <summary>Logic hội thoại chat dùng chung giữa widget popup (AiChatbot) và trang full-page
/// (ChatbotPage) — cùng đọc/ghi sessionId qua localStorage nên mở trang nào cũng tiếp tục đúng hội
/// thoại đang dở. `openSessionId` (tùy chọn): khi trang full-page muốn mở 1 phiên cũ cụ thể từ sidebar
/// thay vì phiên đang lưu trong localStorage.</summary>
export function useChatConversation(openSessionId) {
  const [msgs, setMsgs] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);
  const restoredRef = useRef(false);
  const sendMessage = useSendChatbotMessage();
  const rateMessage = useRateChatbotMessage();
  const reportPlateClick = useReportChatbotPlateClick();
  const storedId = !restoredRef.current ? (openSessionId || loadStoredSessionId()) : null;
  const history = useChatbotHistory(storedId);

  const quickReplies = sendMessage.isPending ? [] : nextQuickReplies(msgs[msgs.length - 1]);

  // Khôi phục hội thoại cũ (từ localStorage hoặc openSessionId truyền vào) — chỉ chạy 1 lần khi có
  // kết quả history.
  useEffect(() => {
    if (restoredRef.current || !storedId) return;
    if (history.isSuccess) {
      restoredRef.current = true;
      if (history.data?.messages?.length) {
        setSessionId(storedId);
        setMsgs(history.data.messages.map((m) => ({ from: m.role === 'user' ? 'user' : 'bot', text: m.content, messageId: m.id, ratedValue: m.rating })));
      } else if (!openSessionId) {
        clearStoredSessionId();
      }
    } else if (history.isError) {
      restoredRef.current = true;
      if (!openSessionId) clearStoredSessionId();
    }
  }, [history.isSuccess, history.isError, history.data, storedId, openSessionId]);

  const send = async (text) => {
    const v = (text ?? input).trim();
    if (!v || sendMessage.isPending || rateLimited) return;
    setMsgs((m) => [...m, { from: 'user', text: v }]);

    try {
      const res = await sendMessage.mutateAsync({ sessionId, message: v, currentPlateNumber: getCurrentPlateNumber() });
      setInput('');
      setSessionId(res.sessionId);
      storeSessionId(res.sessionId);
      setMsgs((m) => [...m, { from: 'bot', text: res.reply, actions: res.suggestActions, plates: res.plates, relatedPosts: res.relatedPosts, messageId: res.messageId, disclaimer: res.disclaimer }]);
    } catch (e) {
      if (e.status === 429) {
        setRateLimited(true);
        setMsgs((m) => [...m, { from: 'bot', text: e.message || 'Bạn đã gửi quá nhiều tin nhắn, vui lòng thử lại sau ít phút.', directContact: true }]);
      } else {
        setInput(v);
        setMsgs((m) => [...m, { from: 'bot', text: 'Trợ lý AI đang bận, vui lòng liên hệ trực tiếp để được hỗ trợ ngay.', directContact: true }]);
      }
    }
  };

  const rate = (i, messageId, value) => {
    if (!messageId) return;
    setMsgs((m) => m.map((msg, idx) => (idx === i ? { ...msg, ratedValue: value } : msg)));
    rateMessage.mutate({ messageId, rating: value });
  };

  // Chỉ "đang khôi phục" khi có 1 sessionId cần load (localStorage hoặc openSessionId) VÀ chưa xong —
  // phiên mới hoàn toàn (không storedId) thì isLoading=false ngay, tránh màn hình chờ vô ích.
  const isRestoring = !!storedId && !restoredRef.current && history.isLoading;

  return { msgs, input, setInput, sessionId, rateLimited, sendMessage, quickReplies, send, rate, reportPlateClick, isRestoring };
}

/// <summary>Phần render thuần (message list + input bar) — không style khung ngoài, nơi gọi tự quyết
/// kích thước/vị trí (popup 360x480 hay full-page).</summary>
export function ChatConversationView({ conv, onOpenPlate, onOpenPost, onAction, autoFocusInput }) {
  const { msgs, input, setInput, rateLimited, sendMessage, quickReplies, send, rate, reportPlateClick, sessionId, isRestoring } = conv;
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, sendMessage.isPending]);
  useEffect(() => { if (autoFocusInput && !isRestoring) inputRef.current?.focus(); }, [autoFocusInput, isRestoring]);

  const openPlate = (slugOrId) => {
    if (sessionId) reportPlateClick.mutate(sessionId);
    onOpenPlate?.(slugOrId);
  };

  if (isRestoring) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
        {[72, 48, 64].map((w, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: i % 2 ? 'flex-end' : 'flex-start' }}>
            <div className="skeleton-shimmer" style={{ width: `${w}%`, maxWidth: 260, height: 36, borderRadius: 'var(--radius-md)' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.from === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
            <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: m.from === 'user' ? 'var(--radius-pill)' : 'var(--radius-md)', background: m.from === 'user' ? 'var(--action-primary)' : 'var(--surface-sunken)', color: m.from === 'user' ? 'var(--white)' : 'var(--text-body)', font: 'var(--type-body-sm)', whiteSpace: 'pre-wrap' }}>
              {m.from === 'bot' ? <span dangerouslySetInnerHTML={{ __html: renderMarkdownLite(m.text) }} /> : m.text}
            </div>
            {m.plates?.length >= 2 ? (
              <PlateCompareTable plates={m.plates} onOpen={openPlate} />
            ) : m.plates?.length === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '90%', width: '100%' }}>
                {m.plates.map((p) => <PlateMiniCard key={p.slugOrId} plate={p} onOpen={() => openPlate(p.slugOrId)} />)}
              </div>
            )}
            {m.plates?.length > 0 && m.disclaimer && (
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', fontStyle: 'italic' }}>Giá/tình trạng mang tính tham khảo, có thể thay đổi — liên hệ để xác nhận chính xác.</span>
            )}
            {m.relatedPosts?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '90%', width: '100%' }}>
                {m.relatedPosts.map((p) => (
                  <button key={p.slug} type="button" onClick={() => onOpenPost?.(p.slug)} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, border: 'none', borderRadius: 'var(--radius-field)',
                    background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '8px 12px',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}>
                    <BookOpen size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--action-primary)' }} />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{p.title}</span>
                      {p.excerpt && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.excerpt}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {m.actions?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {m.actions.map((a) => (
                  <button key={a} onClick={() => onAction?.(a)} style={{ border: '1px solid var(--action-primary)', borderRadius: 'var(--radius-pill)', background: 'transparent', padding: '4px 10px', font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>{ACTION_LABEL[a] || a}</button>
                ))}
              </div>
            )}
            {m.directContact && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--action-primary)', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', padding: '4px 10px', font: 'var(--type-caption)', color: 'var(--white)', textDecoration: 'none' }}><MessageCircle size={12} /> Nhắn Zalo ngay</a>
                <a href={TEL_LINK} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--action-primary)', borderRadius: 'var(--radius-pill)', background: 'transparent', padding: '4px 10px', font: 'var(--type-caption)', color: 'var(--action-primary)', textDecoration: 'none' }}><Phone size={12} /> Gọi {DEFAULT_CONTACT.phone}</a>
              </div>
            )}
            {m.from === 'bot' && m.messageId && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button aria-label="Câu trả lời hữu ích" onClick={() => rate(i, m.messageId, 1)} disabled={m.ratedValue != null} style={{ border: 'none', background: 'transparent', cursor: m.ratedValue != null ? 'default' : 'pointer', padding: 2, color: m.ratedValue === 1 ? 'var(--status-success)' : 'var(--text-muted)', opacity: m.ratedValue != null && m.ratedValue !== 1 ? 0.4 : 1 }}><ThumbsUp size={13} /></button>
                <button aria-label="Câu trả lời không hữu ích" onClick={() => rate(i, m.messageId, -1)} disabled={m.ratedValue != null} style={{ border: 'none', background: 'transparent', cursor: m.ratedValue != null ? 'default' : 'pointer', padding: 2, color: m.ratedValue === -1 ? 'var(--status-danger)' : 'var(--text-muted)', opacity: m.ratedValue != null && m.ratedValue !== -1 ? 0.4 : 1 }}><ThumbsDown size={13} /></button>
              </div>
            )}
          </div>
        ))}
        {sendMessage.isPending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>Đang trả lời…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {!rateLimited && quickReplies.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 var(--space-3) var(--space-2)' }}>
          {quickReplies.map((qr) => (
            <button key={qr} onClick={() => send(qr)} disabled={sendMessage.isPending} style={{ border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', padding: '5px 12px', font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: sendMessage.isPending ? 'default' : 'pointer', opacity: sendMessage.isPending ? 0.6 : 1 }}>{qr}</button>
          ))}
        </div>
      )}
      {rateLimited && (
        <div style={{ padding: '0 var(--space-3) var(--space-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Bạn đã gửi quá nhiều tin nhắn. Liên hệ trực tiếp để được hỗ trợ ngay:</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', padding: '4px 10px', font: 'var(--type-caption)', color: 'var(--white)', textDecoration: 'none' }}><MessageCircle size={12} /> Nhắn Zalo ngay</a>
            <a href={TEL_LINK} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--action-primary)', borderRadius: 'var(--radius-pill)', background: 'transparent', padding: '4px 10px', font: 'var(--type-caption)', color: 'var(--action-primary)', textDecoration: 'none' }}><Phone size={12} /> Gọi {DEFAULT_CONTACT.phone}</a>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-3)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
        <input ref={inputRef} type="text" placeholder={rateLimited ? 'Đã tạm khóa gửi tin...' : 'Nhập câu hỏi...'} aria-label="Câu hỏi" disabled={rateLimited} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} style={{ flex: 1, height: 40, border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', padding: '0 16px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', opacity: rateLimited ? 0.6 : 1 }} />
        <button onClick={() => send()} disabled={sendMessage.isPending || rateLimited} style={{ width: 40, height: 40, borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--action-primary)', color: 'var(--white)', cursor: sendMessage.isPending || rateLimited ? 'default' : 'pointer', opacity: sendMessage.isPending || rateLimited ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={16} /></button>
      </div>
    </>
  );
}

function PlateCompareTable({ plates, onOpen }) {
  return (
    <div style={{ maxWidth: '95%', width: '100%', overflowX: 'auto', borderRadius: 'var(--radius-field)', boxShadow: 'var(--shadow-inset-hairline)', background: 'var(--white)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-caption)' }}>
        <thead>
          <tr style={{ background: 'var(--surface-sunken)' }}>
            <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)' }}>Biển</th>
            <th style={{ textAlign: 'right', padding: '6px 10px', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)' }}>Giá</th>
            <th style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)' }}>TT</th>
          </tr>
        </thead>
        <tbody>
          {plates.map((p) => {
            const sold = p.status === 'Sold';
            return (
              <tr key={p.slugOrId} onClick={() => !sold && onOpen(p.slugOrId)} style={{ cursor: sold ? 'default' : 'pointer', borderTop: '1px solid var(--border-hairline)' }}>
                <td style={{ padding: '6px 10px', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{p.plateNumber}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>{p.priceOnRequest ? 'Liên hệ' : `${Number(p.price).toLocaleString('vi-VN')}đ`}</td>
                <td style={{ padding: '6px 10px', textAlign: 'center', color: sold ? 'var(--status-danger)' : 'var(--status-success)' }}>{sold ? 'Đã bán' : 'Còn'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PlateMiniCard({ plate, onOpen }) {
  const price = plate.priceOnRequest ? 'Giá liên hệ' : `${Number(plate.price).toLocaleString('vi-VN')}đ`;
  const sold = plate.status === 'Sold';
  return (
    <button type="button" onClick={onOpen} disabled={sold} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
      border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)',
      padding: '8px 12px', cursor: sold ? 'default' : 'pointer', textAlign: 'left', width: '100%',
    }}>
      <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{plate.plateNumber}{plate.source === 'VPA' && <span style={{ marginLeft: 6, font: 'var(--type-caption)', fontWeight: 'var(--fw-regular)', color: 'var(--text-muted)' }}>Biển VPA</span>}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {sold && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Đã bán</span>}
        <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>{price}</span>
      </span>
    </button>
  );
}
