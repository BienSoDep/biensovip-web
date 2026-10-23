import { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, MessageCircle, Phone, BookOpen, Sparkles, Copy, Check, ArrowRight, Car, Compass, Scale, ShieldCheck } from 'lucide-react';
import { useSendChatbotMessage, useChatbotHistory, useRateChatbotMessage, useReportChatbotPlateClick } from '../services/chatbotService.js';
import { getCurrentPlateNumber } from '../lib/currentPlateContext.js';
import { DEFAULT_CONTACT } from '../common/constants.js';

export const ACTION_LABEL = { chat_with_staff: 'Chat với nhân viên', contact_form: 'Để lại thông tin liên hệ' };
export const ZALO_LINK = `https://zalo.me/${DEFAULT_CONTACT.zalo}`;
export const TEL_LINK = `tel:${DEFAULT_CONTACT.phone}`;
export const SESSION_KEY = 'bsv.chatSessionId';
export const SESSIONS_LIST_KEY = 'bsv.chatSessionsList';
const GREETING = { from: 'bot', text: 'Chào bạn! Tôi là trợ lý AI Biensovip. Tôi có thể giúp bạn tra cứu biển số, tư vấn phong thủy hợp tuổi hoặc giải đáp thủ tục đấu giá Thông tư 24.' };

export function loadStoredSessionId() {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}
export function storeSessionId(id) {
  try { localStorage.setItem(SESSION_KEY, id); } catch { /* ignore */ }
}
export function clearStoredSessionId() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

export function loadSessionsList() {
  try {
    const raw = localStorage.getItem(SESSIONS_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessionToList({ sessionId, preview, lastMessageAt }) {
  if (!sessionId) return;
  try {
    const list = loadSessionsList();
    const existingIdx = list.findIndex((s) => s.sessionId === sessionId);
    const cleanPreview = (preview || 'Cuộc trò chuyện mới').trim().slice(0, 80);
    const now = lastMessageAt || new Date().toISOString();

    if (existingIdx >= 0) {
      const existing = list[existingIdx];
      const updated = {
        ...existing,
        lastMessageAt: now,
        preview: (!existing.preview || existing.preview === 'Cuộc trò chuyện mới') ? cleanPreview : existing.preview,
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
    localStorage.setItem(SESSIONS_LIST_KEY, JSON.stringify(list.slice(0, 50)));
    window.dispatchEvent(new CustomEvent('bsv_chat_sessions_updated'));
  } catch {
    /* ignore */
  }
}

export function deleteSessionFromList(sessionId) {
  try {
    const list = loadSessionsList().filter((s) => s.sessionId !== sessionId);
    localStorage.setItem(SESSIONS_LIST_KEY, JSON.stringify(list));
    if (loadStoredSessionId() === sessionId) {
      clearStoredSessionId();
    }
    window.dispatchEvent(new CustomEvent('bsv_chat_sessions_updated'));
  } catch {
    /* ignore */
  }
}

const GREETING_QUICK_REPLIES = ['Xem biển giá dưới 100 triệu', 'Tìm biển hợp mệnh của tôi', 'Cách đặt cọc đấu giá VPA?'];
const PLATE_FOUND_QUICK_REPLIES = ['Ý nghĩa phong thủy biển này?', 'Thủ tục sang tên xe giữ biển?', 'Cách cọc đấu giá hộ?'];
const NO_RESULT_QUICK_REPLIES = ['Xem biển giá dưới 100 triệu', 'Chat với nhân viên tư vấn', 'Nhờ tìm biển theo yêu cầu'];

const STARTER_PROMPTS = [
  {
    icon: Car,
    title: 'Tra cứu biển số VIP',
    desc: 'Kiểm tra tình trạng biển 30K-999.99 hoặc ngũ quý 8 Hà Nội',
    prompt: 'Kiểm tra giúp tôi biển số 30K-999.99 có sẵn hay đang đấu giá?'
  },
  {
    icon: Compass,
    title: 'Biển số hợp tuổi & Mệnh',
    desc: 'Tư vấn chọn biển số phong thủy theo năm sinh',
    prompt: 'Tôi sinh năm 1990 Canh Ngọ (mệnh Lộ Bàng Thổ), nên chọn biển đuôi số mấy?'
  },
  {
    icon: Scale,
    title: 'Pháp lý Thông tư 24',
    desc: 'Quy định cọc 40 triệu và chuyển nhượng xe giữ biển',
    prompt: 'Biển trúng đấu giá có được chuyển nhượng kèm theo xe không theo Thông tư 24?'
  },
  {
    icon: ShieldCheck,
    title: 'Lọc biển theo ngân sách',
    desc: 'Gợi ý các biển số tài lộc từ 100 đến 300 triệu',
    prompt: 'Gợi ý cho tôi các biển số lộc phát, thần tài trong tầm giá từ 100 đến 300 triệu'
  }
];

function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMarkdownLite(text) {
  if (!text) return '';
  let out = escapeHtml(text);

  // 1. Chữ đậm: **nội dung**
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 2. Liên kết markdown: [Tên biển](/bien/30F-68679) hoặc [Quy trình](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const isPlateUrl = url.includes('/bien/');
    const plateSlug = isPlateUrl ? url.split('/bien/')[1]?.replace(/[^\w-]/g, '') : null;
    return `<a href="${url}" class="${isPlateUrl ? 'claude-plate-pill-link' : 'claude-text-link'}" ${plateSlug ? `data-plate="${plateSlug}"` : ''} title="Bấm để xem chi tiết biển ${label}">${label}</a>`;
  });

  // 3. Tự động nhận diện biển số xe (VD: 30F-68679, 51C7-88679, 30K-999.99...) khi LLM trả về text thông thường
  const plateRegex = /\b([0-9]{2}[A-Za-z]{1,2}[0-9]?[-. ]?[0-9]{3,5}(?:\.[0-9]{2})?)\b/g;
  const parts = out.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i++) {
    // Chỉ thay thế text bên ngoài các thẻ HTML
    if (!parts[i].startsWith('<')) {
      parts[i] = parts[i].replace(plateRegex, (match) => {
        const cleanSlug = match.replace(/\s+/g, '').toUpperCase();
        return `<a href="/bien/${cleanSlug}" class="claude-plate-pill-link" data-plate="${cleanSlug}" title="Bấm để xem chi tiết biển ${match}">${match}</a>`;
      });
    }
  }
  out = parts.join('');

  // 4. Xuống dòng
  return out.replace(/\n/g, '<br/>');
}

function nextQuickReplies(lastMsg) {
  if (!lastMsg || lastMsg.from !== 'bot') return [];
  if (lastMsg.plates?.length > 0) return PLATE_FOUND_QUICK_REPLIES;
  if (/không tìm thấy|không có thông tin/i.test(lastMsg.text || '')) return NO_RESULT_QUICK_REPLIES;
  return GREETING_QUICK_REPLIES;
}

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
      saveSessionToList({ sessionId: res.sessionId, preview: v, lastMessageAt: new Date().toISOString() });
      setMsgs((m) => [...m, { from: 'bot', text: res.reply, actions: res.suggestActions, plates: res.plates, relatedPosts: res.relatedPosts, messageId: res.messageId, disclaimer: res.disclaimer }]);
    } catch (e) {
      if (e.status === 429) {
        setRateLimited(true);
        setMsgs((m) => [...m, { from: 'bot', text: e.message || 'Bạn đã gửi quá nhiều tin nhắn, vui lòng thử lại sau ít phút.', directContact: true }]);
      } else {
        setInput(v);
        setMsgs((m) => [...m, { from: 'bot', text: 'Trợ lý AI đang bận, vui lòng liên hệ trực tiếp chuyên viên Biensovip để được hỗ trợ ngay.', directContact: true }]);
      }
    }
  };

  const rate = (i, messageId, value) => {
    if (!messageId) return;
    setMsgs((m) => m.map((msg, idx) => (idx === i ? { ...msg, ratedValue: value } : msg)));
    rateMessage.mutate({ messageId, rating: value });
  };

  const isRestoring = !!storedId && !restoredRef.current && history.isLoading;

  return { msgs, input, setInput, sessionId, rateLimited, sendMessage, quickReplies, send, rate, reportPlateClick, isRestoring };
}

export function ChatConversationView({ conv, onOpenPlate, onOpenPost, onAction, autoFocusInput }) {
  const { msgs, input, setInput, rateLimited, sendMessage, quickReplies, send, rate, reportPlateClick, sessionId, isRestoring } = conv;
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
  }, [msgs, sendMessage.isPending]);

  useEffect(() => {
    if (autoFocusInput && !isRestoring) textareaRef.current?.focus({ preventScroll: true });
  }, [autoFocusInput, isRestoring]);

  const handleCopy = (text, index) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const openPlate = (slugOrId) => {
    if (sessionId) reportPlateClick.mutate(sessionId);
    onOpenPlate?.(slugOrId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (isRestoring) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '32px 24px' }}>
        {[70, 45, 60, 40].map((w, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: i % 2 ? 'flex-end' : 'flex-start' }}>
            <div className="skeleton-shimmer" style={{ width: `${w}%`, maxWidth: 360, height: 44, borderRadius: 16 }} />
          </div>
        ))}
      </div>
    );
  }

  // Khi chưa có tin nhắn nào từ người dùng -> hiển thị Claude Empty/Hero Screen
  const isConversationFresh = msgs.length === 1 && msgs[0].from === 'bot';

  return (
    <>
      <div aria-live="polite" className="claude-messages-viewport" ref={viewportRef}>
        {isConversationFresh ? (
          <div className="claude-empty-hero">
            <div className="claude-empty-avatar">
              <Sparkles size={28} />
            </div>
            <h2 className="claude-empty-title">Chào bạn, hôm nay tôi có thể hỗ trợ gì về biển số?</h2>
            <p className="claude-empty-subtitle">
              Trợ lý AI Biensovip sẵn sàng hỗ trợ định giá, tra cứu biển số VIP, thẩm định phong thủy bản mệnh và giải đáp thủ tục đấu giá Thông tư 24/2023/TT-BCA.
            </p>
            <div className="claude-prompt-grid">
              {STARTER_PROMPTS.map((p, idx) => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    className="claude-prompt-card"
                    onClick={() => send(p.prompt)}
                    disabled={sendMessage.isPending}
                  >
                    <span className="claude-prompt-label">
                      <IconComponent size={16} color="var(--brand-600)" />
                      {p.title}
                    </span>
                    <span className="claude-prompt-desc">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          msgs.map((m, i) => {
            if (i === 0 && isConversationFresh) return null; // Ẩn câu greeting thô sơ khi đã có thẻ hero
            return (
              <div key={i} className={`claude-msg-row ${m.from}`}>
                {m.from === 'user' ? (
                  <div className="claude-user-bubble">{m.text}</div>
                ) : (
                  <div className="claude-bot-wrapper">
                    <div className="claude-bot-avatar">
                      <Sparkles size={18} />
                    </div>
                    <div className="claude-bot-content">
                      <div className="claude-bot-header">
                        <span className="claude-bot-name">Trợ lý Biensovip</span>
                        <span style={{ fontSize: 11, color: 'var(--grey-400)' }}>• DeepSeek AI</span>
                      </div>

                      <div
                        className="claude-bot-text"
                        onClick={(e) => {
                          const link = e.target.closest('a[data-plate]');
                          if (link) {
                            const plate = link.getAttribute('data-plate');
                            if (plate) {
                              e.preventDefault();
                              openPlate(plate);
                            }
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdownLite(m.text) }}
                      />

                      {/* Hiển thị thẻ biển số Claude style */}
                      {m.plates?.length > 0 && (
                        <div className="claude-plates-container">
                          {m.plates.map((p) => {
                            const isSold = p.status === 'Sold';
                            const priceStr = p.priceOnRequest ? 'Giá liên hệ' : `${Number(p.price).toLocaleString('vi-VN')} đ`;
                            return (
                              <button
                                key={p.slugOrId}
                                type="button"
                                className="claude-plate-card"
                                onClick={() => !isSold && openPlate(p.slugOrId)}
                                disabled={isSold}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div className="claude-plate-visual">{p.plateNumber}</div>
                                  <span className={`claude-plate-badge ${isSold ? 'sold' : 'available'}`}>
                                    {isSold ? 'Đã bán' : 'Có sẵn'}
                                  </span>
                                </div>
                                <div className="claude-plate-meta">
                                  <span className="claude-plate-price">{priceStr}</span>
                                  <span style={{ fontSize: 12, color: 'var(--brand-600)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                    Chi tiết <ArrowRight size={13} />
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Disclaimer giá */}
                      {m.plates?.length > 0 && m.disclaimer && (
                        <span style={{ fontSize: 11.5, color: 'var(--grey-400)', fontStyle: 'italic' }}>
                          * Giá và trạng thái biển số mang tính tham khảo tại thời điểm tra cứu. Vui lòng liên hệ để xác nhận thực tế.
                        </span>
                      )}

                      {/* Bài viết quy trình liên quan */}
                      {m.relatedPosts?.length > 0 && (
                        <div className="claude-posts-container">
                          {m.relatedPosts.map((p) => (
                            <button key={p.slug} type="button" className="claude-post-card" onClick={() => onOpenPost?.(p.slug)}>
                              <BookOpen size={16} color="var(--brand-600)" style={{ flexShrink: 0 }} />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{p.title}</span>
                                {p.excerpt && (
                                  <span style={{ fontSize: 11.5, color: 'var(--grey-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.excerpt}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Các nút hành động CTA */}
                      {m.actions?.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                          {m.actions.map((a) => (
                            <button
                              key={a}
                              onClick={() => onAction?.(a)}
                              className="claude-chip-btn"
                              style={{ borderColor: 'var(--brand-500)', color: 'var(--brand-700)', background: 'var(--brand-50)' }}
                            >
                              {ACTION_LABEL[a] || a}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Nút liên hệ khẩn cấp */}
                      {m.directContact && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                          <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" className="claude-chip-btn" style={{ background: '#0068FF', color: '#FFFFFF', borderColor: '#0068FF' }}>
                            <MessageCircle size={14} /> Nhắn Zalo Chuyên viên
                          </a>
                          <a href={TEL_LINK} className="claude-chip-btn" style={{ borderColor: 'var(--brand-500)', color: 'var(--brand-700)' }}>
                            <Phone size={14} /> Hotline {DEFAULT_CONTACT.phone}
                          </a>
                        </div>
                      )}

                      {/* Claude Action Bar dưới mỗi tin phản hồi */}
                      {m.messageId && (
                        <div className="claude-bot-footer">
                          <button
                            type="button"
                            className="claude-action-btn"
                            onClick={() => handleCopy(m.text, i)}
                            title="Sao chép nội dung"
                          >
                            {copiedIndex === i ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                            <span>{copiedIndex === i ? 'Đã chép' : 'Sao chép'}</span>
                          </button>
                          <button
                            type="button"
                            aria-label="Hữu ích"
                            className={`claude-action-btn ${m.ratedValue === 1 ? 'active' : ''}`}
                            onClick={() => rate(i, m.messageId, 1)}
                            disabled={m.ratedValue != null}
                            title="Câu trả lời hữu ích"
                          >
                            <ThumbsUp size={13} />
                          </button>
                          <button
                            type="button"
                            aria-label="Chưa hài lòng"
                            className={`claude-action-btn ${m.ratedValue === -1 ? 'active' : ''}`}
                            onClick={() => rate(i, m.messageId, -1)}
                            disabled={m.ratedValue != null}
                            title="Câu trả lời chưa đúng ý"
                          >
                            <ThumbsDown size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Trạng thái Claude đang suy nghĩ */}
        {sendMessage.isPending && (
          <div className="claude-msg-row bot">
            <div className="claude-bot-wrapper">
              <div className="claude-bot-avatar">
                <Sparkles size={18} />
              </div>
              <div className="claude-bot-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <span style={{ fontSize: 13.5, color: 'var(--grey-500)' }}>Trợ lý AI đang suy nghĩ…</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-500)', animation: 'pulse 1s infinite alternate' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-500)', animation: 'pulse 1s infinite alternate 0.2s' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-500)', animation: 'pulse 1s infinite alternate 0.4s' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Claude Floating Composer */}
      <div className="claude-composer-wrapper">
        <div className="claude-composer-inner">
          {/* Quick Replies chips */}
          {!rateLimited && quickReplies.length > 0 && (
            <div className="claude-quick-chips">
              {quickReplies.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  className="claude-chip-btn"
                  onClick={() => send(qr)}
                  disabled={sendMessage.isPending}
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Rate limited warning */}
          {rateLimited && (
            <div style={{ padding: '8px 12px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, color: '#991B1B' }}>Bạn đã gửi quá nhiều tin nhắn liên tiếp.</span>
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 600, color: '#0068FF', textDecoration: 'none' }}>
                Nhắn Zalo ngay
              </a>
            </div>
          )}

          {/* Claude Composer Box */}
          <div className="claude-composer-box">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              disabled={rateLimited}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={rateLimited ? 'Hệ thống tạm khóa gửi tin...' : 'Hỏi Trợ lý AI về biển số, phong thủy, pháp lý... (Nhấn Enter để gửi)'}
              className="claude-composer-textarea"
              style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={sendMessage.isPending || rateLimited || !input.trim()}
              className="claude-composer-send-btn"
              title="Gửi câu hỏi"
            >
              <Send size={16} />
            </button>
          </div>

          <div className="claude-composer-disclaimer">
            Trợ lý AI Biensovip được đồng bộ theo Thông tư 24/2023/TT-BCA và quy chế đấu giá VPA.
          </div>
        </div>
      </div>
    </>
  );
}
