import { useState, useRef, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useChatbotWidgetEnabled } from '../services/chatbotService.js';
import { useHideOnScroll } from '../hooks/useHideOnScroll.js';
import { useChatConversation, ChatConversationView } from './ChatConversation.jsx';

export default function AiChatbot({ go }) {
  const { data: widgetFlag } = useChatbotWidgetEnabled();
  const [open, setOpen] = useState(false);
  // Ẩn tạm nút FAB lúc cuộn — chỉ khi panel đang đóng, tránh gián đoạn lúc đang chat/cuộn trong panel.
  const scrolling = useHideOnScroll();
  const panelRef = useRef(null);
  const fabRef = useRef(null);
  const conv = useChatConversation();

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

  const handleAction = (action) => {
    setOpen(false);
    if (action === 'chat_with_staff') go?.('chat')();
    else if (action === 'contact_form') go?.('chat')();
  };

  const openPlate = (slugOrId) => {
    setOpen(false);
    go?.('detail', slugOrId)();
  };

  const openPost = (slug) => {
    setOpen(false);
    go?.('post', slug)();
  };

  if (widgetFlag && widgetFlag.enabled === false) return null;

  return (
    <>
      {!open && (
        <button
          ref={fabRef} aria-label="Mở trợ lý" onClick={() => setOpen(true)} className="chatbot-fab"
          style={{
            position: 'fixed', bottom: 14, right: 10, zIndex: 'var(--z-chatbot)', width: 42, height: 42, borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--action-primary)', color: 'var(--white)', cursor: 'pointer', boxShadow: 'var(--shadow-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: scrolling ? 0 : 1, transform: scrolling ? 'translateX(72px)' : 'translateX(0)', pointerEvents: scrolling ? 'none' : 'auto',
            transition: 'opacity 160ms var(--ease-standard), transform 160ms var(--ease-standard)',
          }}
        >
          <Sparkles size={19} />
        </button>
      )}
      {open && (
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Trợ lý Biensovip" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 'var(--z-filter-overlay)', width: 360, maxWidth: 'calc(100vw - 32px)', height: 480, maxHeight: 'calc(100vh - 80px)', background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'modalIn 200ms var(--ease-out)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', background: 'var(--action-primary)', color: 'var(--white)' }}>
            <Sparkles size={20} />
            <div style={{ flex: 1 }}><span style={{ font: 'var(--type-title-3)', color: 'var(--white)' }}>Trợ lý Biensovip</span></div>
            <button
              aria-label="Mở trang trợ lý đầy đủ"
              onClick={() => { setOpen(false); go?.('aiChat')(); }}
              title="Mở trang trợ lý đầy đủ"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--white)', padding: 4, font: 'var(--type-caption)', opacity: 0.85 }}
            >Mở rộng</button>
            <button aria-label="Đóng trợ lý" onClick={() => setOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--white)', padding: 4 }}><X size={20} /></button>
          </div>
          <ChatConversationView conv={conv} onOpenPlate={openPlate} onOpenPost={openPost} onAction={handleAction} autoFocusInput={open} />
        </div>
      )}
    </>
  );
}
