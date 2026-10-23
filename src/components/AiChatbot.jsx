import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Maximize2, Headphones } from 'lucide-react';
import { useChatbotWidgetEnabled } from '../services/chatbotService.js';
import { useHideOnScroll } from '../hooks/useHideOnScroll.js';
import { useChatConversation, ChatConversationView } from './ChatConversation.jsx';

export default function AiChatbot({ go, openPlate: onOpenPlateProp, openPost: onOpenPostProp }) {
  const { data: widgetFlag } = useChatbotWidgetEnabled();
  const [open, setOpen] = useState(false);
  const scrolling = useHideOnScroll();
  const panelRef = useRef(null);
  const fabRef = useRef(null);
  const conv = useChatConversation();

  // Lắng nghe sự kiện mở widget từ ContactFab (hỗ trợ chọn thẳng chế độ 'bot' hoặc 'human')
  useEffect(() => {
    const handleOpenWidget = (e) => {
      const mode = e.detail?.mode || 'bot';
      setOpen(true);
      if (conv?.switchMode) {
        conv.switchMode(mode);
      }
      if (mode === 'human' && !conv?.customerInfo) {
        conv?.setConnectModal?.(true);
      }
    };
    window.addEventListener('open-chat-widget', handleOpenWidget);
    return () => window.removeEventListener('open-chat-widget', handleOpenWidget);
  }, [conv]);

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
    if (action === 'chat_with_staff' || action === 'contact_form') go?.('chat')();
  };

  const openPlate = (slugOrId) => {
    setOpen(false);
    if (onOpenPlateProp) onOpenPlateProp(slugOrId);
    else go?.('detail', slugOrId)();
  };

  const openPost = (slug) => {
    setOpen(false);
    if (onOpenPostProp) onOpenPostProp(slug);
    else go?.('post', slug)();
  };

  if (widgetFlag && widgetFlag.enabled === false) return null;

  return (
    <>
      {!open && (
        <button
          ref={fabRef}
          aria-label="Mở Trợ lý AI Claude"
          onClick={() => setOpen(true)}
          className="chatbot-fab"
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 'var(--z-chatbot, 70)',
            width: 44,
            height: 44,
            borderRadius: '999px',
            border: '1.5px solid rgba(241, 151, 32, 0.4)',
            background: 'linear-gradient(135deg, #F19720 0%, #D97706 100%)',
            color: '#0E0F12',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(241, 151, 32, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: scrolling ? 0 : 1,
            transform: scrolling ? 'translateX(72px)' : 'translateX(0)',
            pointerEvents: scrolling ? 'none' : 'auto',
            transition: 'opacity 180ms ease, transform 180ms ease, box-shadow 180ms ease',
          }}
          title="Trợ lý AI Claude-style Biensovip"
        >
          <Sparkles size={22} color="#FFFFFF" />
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Trợ lý AI Biensovip"
          className="claude-widget-popup"
        >
          {/* Claude Header Bar */}
          <div className="claude-widget-header">
            <div
              className="claude-bot-avatar"
              style={{
                width: 34,
                height: 34,
                background: conv.chatMode === 'human' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : undefined,
              }}
            >
              {conv.chatMode === 'human' ? <Headphones size={18} /> : <Sparkles size={18} />}
            </div>
            <div className="claude-widget-header-title">
              <span className="claude-widget-header-name">
                {conv.chatMode === 'human' ? 'Tư vấn viên trực tiếp' : 'Trợ lý AI Biensovip'}
              </span>
              <span className="claude-widget-header-sub">
                {conv.chatMode === 'human'
                  ? (conv.isStaffOnline ? 'Chuyên viên đang trực tuyến' : 'Hỗ trợ trực tiếp')
                  : 'DeepSeek v2 • Trực tuyến'}
              </span>
            </div>
            <button
              type="button"
              aria-label="Mở trang toàn màn hình"
              onClick={() => { setOpen(false); go?.('aiChat')(); }}
              title="Mở toàn màn hình"
              className="claude-action-btn"
              style={{ padding: '6px 8px' }}
            >
              <Maximize2 size={16} />
            </button>
            <button
              type="button"
              aria-label="Đóng trợ lý"
              onClick={() => setOpen(false)}
              className="claude-action-btn"
              style={{ padding: '6px 8px' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Claude Viewport */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <ChatConversationView
              conv={conv}
              onOpenPlate={openPlate}
              onOpenPost={openPost}
              onAction={handleAction}
              autoFocusInput={open}
            />
          </div>
        </div>
      )}
    </>
  );
}
