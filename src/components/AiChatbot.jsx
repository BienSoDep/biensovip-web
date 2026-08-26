import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { useSendChatbotMessage, useChatbotHistory } from '../services/chatbotService.js';

const ACTION_LABEL = { chat_with_staff: 'Chat với nhân viên', contact_form: 'Để lại thông tin liên hệ' };
const SESSION_KEY = 'bsv.chatSessionId';
const GREETING = { from: 'bot', text: 'Chào bạn! Tôi là trợ lý Biensovip. Bạn cần tư vấn gì về biển số ạ?' };

function loadStoredSessionId() {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}
function storeSessionId(id) {
  try { localStorage.setItem(SESSION_KEY, id); } catch { /* ignore */ }
}
function clearStoredSessionId() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

export default function AiChatbot({ go }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const restoredRef = useRef(false);
  const bottomRef = useRef(null);
  const panelRef = useRef(null);
  const fabRef = useRef(null);
  const sendMessage = useSendChatbotMessage();
  const storedId = !restoredRef.current ? loadStoredSessionId() : null;
  const history = useChatbotHistory(storedId);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, sendMessage.isPending]);

  // Khôi phục hội thoại cũ từ localStorage — chỉ chạy 1 lần khi có kết quả history.
  useEffect(() => {
    if (restoredRef.current || !storedId) return;
    if (history.isSuccess) {
      restoredRef.current = true;
      if (history.data?.messages?.length) {
        setSessionId(storedId);
        setMsgs(history.data.messages.map((m) => ({ from: m.role === 'user' ? 'user' : 'bot', text: m.content })));
      } else {
        clearStoredSessionId();
      }
    } else if (history.isError) {
      restoredRef.current = true;
      clearStoredSessionId();
    }
  }, [history.isSuccess, history.isError, history.data, storedId]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusable = panel?.querySelector('input, textarea, button, [href], [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab' || !panel) return;
      const els = Array.from(panel.querySelectorAll('input, textarea, button, [href], [tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!els.length) return;
      const f = els[0];
      const l = els[els.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      fabRef.current?.focus();
    };
  }, [open]);

  const send = async () => {
    const v = input.trim();
    if (!v || sendMessage.isPending) return;
    setMsgs((m) => [...m, { from: 'user', text: v }]);
    setInput('');

    try {
      const res = await sendMessage.mutateAsync({ sessionId, message: v });
      setSessionId(res.sessionId);
      storeSessionId(res.sessionId);
      setMsgs((m) => [...m, { from: 'bot', text: res.reply, actions: res.suggestActions, plates: res.plates }]);
    } catch (e) {
      if (e.status === 429) {
        setMsgs((m) => [...m, { from: 'bot', text: e.message || 'Bạn đã gửi quá nhiều tin nhắn, vui lòng thử lại sau ít phút.' }]);
      } else {
        setMsgs((m) => [...m, { from: 'bot', text: 'Trợ lý AI đang bận, vui lòng chat với nhân viên.', actions: ['chat_with_staff', 'contact_form'] }]);
      }
    }
  };

  const handleAction = (action) => {
    setOpen(false);
    if (action === 'chat_with_staff') go?.('chat')();
    else if (action === 'contact_form') go?.('chat')();
  };

  const openPlate = (slugOrId) => {
    setOpen(false);
    go?.('detail', slugOrId)();
  };

  return (
    <>
      {!open && (
        <button ref={fabRef} aria-label="Mở trợ lý" onClick={() => setOpen(true)} className="chatbot-fab" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 'var(--z-chatbot)', width: 52, height: 52, borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--action-primary)', color: 'var(--white)', cursor: 'pointer', boxShadow: 'var(--shadow-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={24} />
        </button>
      )}
      {open && (
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Trợ lý Biensovip" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 'var(--z-chatbot)', width: 360, maxWidth: 'calc(100vw - 32px)', height: 480, maxHeight: 'calc(100vh - 80px)', background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'modalIn 200ms var(--ease-out)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', background: 'var(--action-primary)', color: 'var(--white)' }}>
            <Sparkles size={20} />
            <div style={{ flex: 1 }}><span style={{ font: 'var(--type-title-3)', color: 'var(--white)' }}>Trợ lý Biensovip</span></div>
            <button aria-label="Đóng trợ lý" onClick={() => setOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--white)', padding: 4 }}><X size={20} /></button>
          </div>
          <div aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.from === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: m.from === 'user' ? 'var(--radius-pill)' : 'var(--radius-md)', background: m.from === 'user' ? 'var(--action-primary)' : 'var(--surface-sunken)', color: m.from === 'user' ? 'var(--white)' : 'var(--text-body)', font: 'var(--type-body-sm)', whiteSpace: 'pre-wrap' }}>{m.text}</div>
                {m.plates?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '90%', width: '100%' }}>
                    {m.plates.map((p) => <PlateMiniCard key={p.slugOrId} plate={p} onOpen={() => openPlate(p.slugOrId)} />)}
                  </div>
                )}
                {m.actions?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {m.actions.map((a) => (
                      <button key={a} onClick={() => handleAction(a)} style={{ border: '1px solid var(--action-primary)', borderRadius: 'var(--radius-pill)', background: 'transparent', padding: '4px 10px', font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>{ACTION_LABEL[a] || a}</button>
                    ))}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 var(--space-3) var(--space-2)' }}>
            {['Ý nghĩa biển số này là gì?', 'Còn hàng không?', 'Cách đặt cọc?'].map((qr) => (
              <button key={qr} onClick={() => setInput(qr)} style={{ border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', padding: '5px 12px', font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>{qr}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-3)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
            <input type="text" placeholder="Nhập câu hỏi..." aria-label="Câu hỏi" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} style={{ flex: 1, height: 40, border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', padding: '0 16px', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }} />
            <button onClick={send} disabled={sendMessage.isPending} style={{ width: 40, height: 40, borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--action-primary)', color: 'var(--white)', cursor: sendMessage.isPending ? 'default' : 'pointer', opacity: sendMessage.isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={16} /></button>
          </div>
        </div>
      )}
    </>
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
      <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{plate.plateNumber}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {sold && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Đã bán</span>}
        <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>{price}</span>
      </span>
    </button>
  );
}
