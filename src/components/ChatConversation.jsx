import { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, MessageCircle, Phone, BookOpen, Sparkles, Copy, Check, ArrowRight, Car, Compass, Scale, ShieldCheck, Headphones, UserCheck, AlertCircle, ArrowLeft, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSendChatbotMessage, useChatbotHistory, useRateChatbotMessage, useReportChatbotPlateClick } from '../services/chatbotService.js';
import { useClientLiveChatRealtime } from '../services/liveChatRealtime.js';
import { loadSavedChatAnswers, saveChatAnswer, removeSavedChatAnswer } from '../services/savedChatAnswersStore.js';
import { apiClient } from '../services/apiClient.js';
import { getCurrentPlateNumber } from '../lib/currentPlateContext.js';
import { DEFAULT_CONTACT } from '../common/constants.js';
import { loadAuth } from '../lib/authStore.js';
import { prefillFromUser } from '../lib/contactPrefill.js';

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

const normalizePlate = (str) => (str || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();

function renderMarkdownLite(text, plates = []) {
  if (!text) return '';
  let out = escapeHtml(text);

  // Map từ số biển chuẩn hoá sang slugOrId chính xác (từ m.plates)
  const plateMap = {};
  if (Array.isArray(plates)) {
    plates.forEach((p) => {
      const target = p.slugOrId || p.slug || p.id;
      if (p.plateNumber && target) {
        plateMap[normalizePlate(p.plateNumber)] = target;
      }
    });
  }

  // 1. Chữ đậm: **nội dung**
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 2. Liên kết markdown: [Tên biển](/bien/30F-68679) hoặc [Quy trình](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const isPlateUrl = url.includes('/bien/');
    let plateSlug = isPlateUrl ? url.split('/bien/')[1]?.replace(/[^\w-]/g, '') : null;
    if (plateSlug && plateMap[normalizePlate(plateSlug)]) {
      plateSlug = plateMap[normalizePlate(plateSlug)];
    }
    const finalUrl = isPlateUrl && plateSlug ? `/bien/${plateSlug}` : url;
    return `<a href="${finalUrl}" class="${isPlateUrl ? 'claude-plate-pill-link' : 'claude-text-link'}" ${plateSlug ? `data-plate="${plateSlug}"` : ''} title="Bấm để xem chi tiết ${label}">${label}</a>`;
  });

  // 3. Tự động nhận diện biển số xe (VD: 30F-68679, 51C7-88679, 30K-999.99...) khi LLM trả về text thông thường
  const plateRegex = /\b([0-9]{2}[A-Za-z]{1,2}[0-9]?[-. ]?[0-9]{3,5}(?:\.[0-9]{2})?)\b/g;
  const parts = out.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i++) {
    // Chỉ thay thế text bên ngoài các thẻ HTML
    if (!parts[i].startsWith('<')) {
      parts[i] = parts[i].replace(plateRegex, (match) => {
        const norm = normalizePlate(match);
        const resolvedId = plateMap[norm] || match.replace(/\s+/g, '').toUpperCase();
        return `<a href="/bien/${resolvedId}" class="claude-plate-pill-link" data-plate="${resolvedId}" title="Bấm để xem chi tiết biển ${match}">${match}</a>`;
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
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isWaitingStaff, setIsWaitingStaff] = useState(false);
  const [liveStaffName, setLiveStaffName] = useState(null);

  const restoredRef = useRef(false);
  const sendMessage = useSendChatbotMessage();
  const rateMessage = useRateChatbotMessage();
  const reportPlateClick = useReportChatbotPlateClick();
  const storedId = !restoredRef.current ? (openSessionId || loadStoredSessionId()) : null;
  const history = useChatbotHistory(storedId);

  const quickReplies = sendMessage.isPending ? [] : nextQuickReplies(msgs[msgs.length - 1]);

  // Lắng nghe SignalR realtime khi đang ở phiên chat
  useClientLiveChatRealtime(sessionId, {
    onReceiveMessage: (msg) => {
      if (msg.role === 'staff') {
        setMsgs((m) => [...m, { from: 'staff', text: msg.content, senderName: msg.senderName, createdAt: msg.createdAt }]);
        setIsLiveMode(true);
        setIsWaitingStaff(false);
        if (msg.senderName) setLiveStaffName(msg.senderName);
      } else if (msg.role === 'system') {
        setMsgs((m) => [...m, { from: 'system', text: msg.content }]);
      }
    },
    onStatusChanged: (statusInfo) => {
      if (statusInfo.status === 'staff_active') {
        setIsLiveMode(true);
        setIsWaitingStaff(false);
        if (statusInfo.staffName) setLiveStaffName(statusInfo.staffName);
      } else if (statusInfo.status === 'waiting_staff') {
        setIsWaitingStaff(true);
      } else if (statusInfo.status === 'bot' || statusInfo.status === 'resolved') {
        setIsLiveMode(false);
        setIsWaitingStaff(false);
        setLiveStaffName(null);
      }
      if (statusInfo.message) {
        setMsgs((m) => [...m, { from: 'system', text: statusInfo.message.content }]);
      }
    },
  });

  useEffect(() => {
    if (restoredRef.current || !storedId) return;
    if (history.isSuccess) {
      restoredRef.current = true;
      if (history.data?.messages?.length) {
        setSessionId(storedId);
        setMsgs(history.data.messages.map((m) => ({
          from: m.role === 'user' ? 'user' : (m.role === 'staff' ? 'staff' : (m.role === 'system' ? 'system' : 'bot')),
          text: m.content,
          senderName: m.senderName,
          messageId: m.id,
          ratedValue: m.rating,
        })));
      } else if (!openSessionId) {
        clearStoredSessionId();
      }
    } else if (history.isError) {
      restoredRef.current = true;
      if (!openSessionId) clearStoredSessionId();
    }
  }, [history.isSuccess, history.isError, history.data, storedId, openSessionId]);

  const requestStaffSupport = async ({ guestName, guestPhone } = {}) => {
    const auth = loadAuth();
    const user = auth?.user;
    const prefill = prefillFromUser(user);

    const finalName = guestName?.trim() || prefill.fullName || user?.fullName || user?.name || 'Khách hàng';
    const finalPhone = guestPhone?.trim() || prefill.phone || (user?.phone || (user?.identifierType === 'phone' ? user?.identifier : null));

    let curSessionId = sessionId;
    if (!curSessionId) {
      curSessionId = crypto.randomUUID();
      setSessionId(curSessionId);
      storeSessionId(curSessionId);
    }
    setIsWaitingStaff(true);
    setIsLiveMode(true);

    try {
      await apiClient.post(`/api/live-chat/request-support?sessionId=${curSessionId}`, {
        guestName: finalName,
        guestPhone: finalPhone,
      });
      setMsgs((m) => [
        ...m,
        { from: 'system', text: `Quý khách (${finalName}) đã yêu cầu kết nối chuyên viên tư vấn. Đội ngũ CSKH đang tiếp nhận trong giây lát...` }
      ]);
    } catch (err) {
      setIsWaitingStaff(false);
      setIsLiveMode(false);
    }
  };

  const switchToBot = () => {
    setIsLiveMode(false);
    setIsWaitingStaff(false);
    setLiveStaffName(null);
    setMsgs((m) => [
      ...m,
      { from: 'system', text: 'Đã chuyển lại chế độ Trợ lý AI. Bạn có thể tiếp tục tra cứu biển số.' }
    ]);
  };

  const send = async (text) => {
    const v = (text ?? input).trim();
    if (!v || sendMessage.isPending || rateLimited) return;

    // 1. Chế độ Live Chat với Tư vấn viên
    if (isLiveMode) {
      setMsgs((m) => [...m, { from: 'user', text: v }]);
      setInput('');
      try {
        await apiClient.post(`/api/live-chat/send?sessionId=${sessionId}`, { content: v });
        saveSessionToList({ sessionId, preview: v, lastMessageAt: new Date().toISOString() });
      } catch (err) {
        setMsgs((m) => [...m, { from: 'system', text: 'Chưa gửi được tin nhắn tới chuyên viên, vui lòng thử lại.' }]);
      }
      return;
    }

    // 2. Chế độ Trợ lý AI Bot thông thường
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
    const currentMsg = msgs[i];
    const prevVal = currentMsg?.ratedValue;

    // Nếu bấm lại giá trị hiện tại -> Hủy đánh giá
    if (prevVal === value) {
      setMsgs((m) => m.map((msg, idx) => (idx === i ? { ...msg, ratedValue: null } : msg)));
      toast('Đã hủy đánh giá', { icon: '↩️' });
      return;
    }

    // Cập nhật trạng thái đánh giá mới
    setMsgs((m) => m.map((msg, idx) => (idx === i ? { ...msg, ratedValue: value } : msg)));

    if (value === 1) {
      toast.success('Cảm ơn bạn đã phản hồi! Câu trả lời hữu ích.');
    } else if (value === -1) {
      toast('Cảm ơn bạn! Biensovip sẽ cải thiện câu trả lời tốt hơn.', { icon: '📝' });
    }

    // Nếu có messageId hợp lệ dạng UUID từ backend -> gọi mutation API
    if (messageId && typeof messageId === 'string' && messageId.includes('-')) {
      rateMessage.mutate({ messageId, rating: value }, {
        onError: () => {
          // Bỏ qua lỗi ngầm định để không làm gián đoạn trải nghiệm người dùng
        }
      });
    }
  };

  const isRestoring = !!storedId && !restoredRef.current && history.isLoading;

  return {
    msgs, input, setInput, sessionId, rateLimited, sendMessage, quickReplies,
    send, rate, reportPlateClick, isRestoring, isLiveMode, isWaitingStaff,
    liveStaffName, requestStaffSupport, switchToBot
  };
}

export function ChatConversationView({ conv, onOpenPlate, onOpenPost, onAction, autoFocusInput, onSwitchToStaff }) {
  const {
    msgs, input, setInput, rateLimited, sendMessage, quickReplies,
    send, rate, reportPlateClick, sessionId, isRestoring,
    isLiveMode, isWaitingStaff, liveStaffName, requestStaffSupport, switchToBot
  } = conv;

  const viewportRef = useRef(null);
  const textareaRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const authUser = loadAuth()?.user;
  const initialPrefill = prefillFromUser(authUser);
  const [guestNameInput, setGuestNameInput] = useState(() => initialPrefill.fullName || '');
  const [guestPhoneInput, setGuestPhoneInput] = useState(() => initialPrefill.phone || '');

  // Chuyển thẳng sang giao diện chat chuyên viên nếu có onSwitchToStaff
  const handleInitiateStaffChat = () => {
    if (onSwitchToStaff) {
      onSwitchToStaff();
      return;
    }

    const user = loadAuth()?.user;
    const prefill = prefillFromUser(user);

    if (user) {
      const name = prefill.fullName || user.fullName || user.name || 'Thành viên Biensovip';
      const phone = prefill.phone || (user.phone || (user.identifierType === 'phone' ? user.identifier : null));
      requestStaffSupport({ guestName: name, guestPhone: phone });
      toast.success(`Đã tự động kết nối chuyên viên cho tài khoản ${name}!`);
      return;
    }

    setGuestNameInput(prefill.fullName || '');
    setGuestPhoneInput(prefill.phone || '');
    setShowConnectModal(true);
  };

  useEffect(() => {
    const handleOpenModal = () => handleInitiateStaffChat();
    window.addEventListener('bsv_open_live_chat_modal', handleOpenModal);
    return () => window.removeEventListener('bsv_open_live_chat_modal', handleOpenModal);
  }, [requestStaffSupport]);

  useEffect(() => {
    if (viewportRef.current && msgs.length > 1) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [msgs, sendMessage.isPending]);

  useEffect(() => {
    if (autoFocusInput && !isRestoring) textareaRef.current?.focus({ preventScroll: true });
  }, [autoFocusInput, isRestoring]);

  const [savedAnswerIds, setSavedAnswerIds] = useState(() => {
    return new Set(loadSavedChatAnswers().map((x) => x.id));
  });

  useEffect(() => {
    const handleSavedAnswersUpdated = (e) => {
      const list = e.detail || loadSavedChatAnswers();
      setSavedAnswerIds(new Set(list.map((x) => x.id)));
    };
    window.addEventListener('bsv_saved_chat_answers_updated', handleSavedAnswersUpdated);
    return () => window.removeEventListener('bsv_saved_chat_answers_updated', handleSavedAnswersUpdated);
  }, []);

  const handleCopy = (text, index) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleSaveAnswer = (m, i) => {
    const itemKey = m.messageId || (m.text ? m.text.trim().slice(0, 100) : `ans_${i}`);
    const isAlreadySaved = savedAnswerIds.has(itemKey);

    if (isAlreadySaved) {
      removeSavedChatAnswer(itemKey);
      toast('Đã bỏ lưu câu trả lời', { icon: '🗑️' });
    } else {
      const prevPrompt = msgs.slice(0, i).reverse().find((x) => x.from === 'user')?.text || '';
      saveChatAnswer({
        id: itemKey,
        messageId: m.messageId,
        text: m.text,
        plates: m.plates,
        relatedPosts: m.relatedPosts,
        prompt: prevPrompt,
        sessionId,
      });
      toast.success('Đã lưu câu trả lời vào mục Yêu thích!');
    }
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

  useEffect(() => {
    if (showConnectModal) {
      const u = loadAuth()?.user;
      if (u) {
        const p = prefillFromUser(u);
        if (p.fullName) setGuestNameInput(p.fullName);
        if (p.phone) setGuestPhoneInput(p.phone);
      }
    }
  }, [showConnectModal]);

  const handleConfirmConnect = (e) => {
    e?.preventDefault();
    requestStaffSupport({ guestName: guestNameInput.trim(), guestPhone: guestPhoneInput.trim() });
    setShowConnectModal(false);
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
      {/* Banner thông báo trạng thái khi đang kết nối trực tiếp với Chuyên viên */}
      {isLiveMode && (
        <div style={{
          padding: '10px 18px',
          background: 'linear-gradient(90deg, #ECFDF5 0%, #F0FDF4 100%)',
          borderBottom: '1.5px solid #A7F3D0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          zIndex: 5,
          flexWrap: 'wrap',
          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#065F46' }}>
            <span className="live-dot-pulse" style={{ width: 8, height: 8 }} />
            <span>
              {isWaitingStaff ? (
                <span>Đang kết nối chuyên viên tư vấn... <em>Vui lòng chờ trong giây lát.</em></span>
              ) : (
                <span>Đang trò chuyện 1:1 với Chuyên viên CSKH: <strong style={{ color: '#047857' }}>{liveStaffName || 'Biensovip Support'}</strong></span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={switchToBot}
            style={{
              border: '1px solid #6EE7B7',
              background: '#FFFFFF',
              color: '#065F46',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontWeight: 600,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 140ms ease',
            }}
            title="Quay lại trò chuyện tự động cùng Trợ lý AI"
          >
            <ArrowLeft size={13} /> Chuyển về Trợ lý AI
          </button>
        </div>
      )}

      {/* Modal Popup Nhập thông tin gặp tư vấn viên */}
      {showConnectModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--white)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 360,
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Headphones size={22} />
              </div>
              <div>
                <strong style={{ fontSize: 16, color: '#0F172A', display: 'block' }}>Gặp Chuyên viên tư vấn</strong>
                <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>● Đội ngũ CSKH đang trực tuyến</span>
              </div>
            </div>
            {authUser ? (
              <div style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                fontSize: 12,
                color: '#065F46',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Check size={14} color="#059669" />
                <span>Tài khoản: <strong>{authUser.fullName || authUser.email}</strong> (Đã tự điền)</span>
              </div>
            ) : (
              <p style={{ fontSize: 12.5, color: '#64748B', marginBottom: 16, lineHeight: 1.5 }}>
                Quý khách vui lòng để lại thông tin để nhân viên tư vấn xưng hô và hỗ trợ trực tiếp nhanh nhất:
              </p>
            )}
            <form onSubmit={handleConfirmConnect} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Tên của bạn
                </label>
                <input
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  placeholder="VD: Anh Nam, Chị Linh..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Số điện thoại / Zalo
                </label>
                <input
                  value={guestPhoneInput}
                  onChange={(e) => setGuestPhoneInput(e.target.value)}
                  placeholder="Nhập số điện thoại để tiện gửi hình ảnh biển số..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: '#64748B',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.4,
                    padding: '9px 0',
                    borderRadius: 8,
                    border: 'none',
                    background: '#059669',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Headphones size={15} /> Bắt đầu tư vấn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div aria-live="polite" className="claude-messages-viewport" ref={viewportRef}>
        {isConversationFresh && !isLiveMode ? (
          <div className="claude-empty-hero">
            <div className="claude-empty-avatar">
              <Sparkles size={28} />
            </div>
            <h2 className="claude-empty-title">Chào bạn, hôm nay tôi có thể hỗ trợ gì về biển số?</h2>
            <p className="claude-empty-subtitle">
              Hệ thống hỗ trợ song song giữa Trợ lý AI thế hệ mới và Đội ngũ Chuyên viên tư vấn trực tiếp 1:1.
            </p>

            {/* Hai thẻ chọn chế độ lớn ở màn hình chính */}
            <div className="claude-hero-modes">
              {/* Thẻ AI */}
              <div
                role="button"
                tabIndex={0}
                onClick={switchToBot}
                className="claude-hero-mode-card active"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(241, 151, 32, 0.12)',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Sparkles size={20} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: 'rgba(241, 151, 32, 0.1)', padding: '3px 10px', borderRadius: 999 }}>
                    ✓ Đang sử dụng
                  </span>
                </div>
                <strong style={{ fontSize: 15.5, color: '#0F172A', marginBottom: 6 }}>
                  Hỏi Trợ lý AI Thông Minh
                </strong>
                <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  Tra cứu tình trạng biển số, định giá tự động, phân tích phong thủy hợp tuổi và giải đáp thủ tục đấu giá 24/7.
                </p>
                <div style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#D97706' }}>
                  <span>Nhập câu hỏi bên dưới để hỏi ngay</span> ↓
                </div>
              </div>

              {/* Thẻ Tư vấn viên */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleInitiateStaffChat}
                className="claude-hero-mode-card live-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Headphones size={20} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#DCFCE7', padding: '3px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span className="live-dot-pulse" style={{ width: 6, height: 6 }} /> Chuyên viên 1:1
                  </span>
                </div>
                <strong style={{ fontSize: 15.5, color: '#0F172A', marginBottom: 6 }}>
                  Gặp Tư vấn viên Trực tiếp
                </strong>
                <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  Kết nối chuyên viên hỗ trợ đàm phán giá tốt, đặt cọc giữ chỗ độc quyền, hỗ trợ đấu giá và sang tên trọn gói.
                </p>
                <div style={{
                  marginTop: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: '#059669',
                  padding: '6px 14px',
                  borderRadius: 8,
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                }}>
                  <span>Gặp Chuyên viên ngay</span> →
                </div>
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: 680, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)' }}>
                Hoặc bắt đầu nhanh với câu hỏi mẫu:
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--grey-400)' }}>
                Bấm vào để hỏi AI ngay
              </span>
            </div>

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
            if (i === 0 && isConversationFresh && !isLiveMode) return null;

            // Tin nhắn Hệ thống
            if (m.from === 'system') {
              return (
                <div key={i} style={{ textAlign: 'center', margin: '8px 0' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 14px',
                    background: 'rgba(0,0,0,0.04)',
                    borderRadius: 20,
                    fontSize: 12,
                    color: 'var(--text-faint)',
                  }}>
                    <AlertCircle size={13} /> {m.text}
                  </span>
                </div>
              );
            }

            // Tin nhắn Tư vấn viên trực tiếp
            if (m.from === 'staff') {
              return (
                <div key={i} className="claude-msg-row bot">
                  <div className="claude-bot-wrapper">
                    <div className="claude-bot-avatar" style={{ background: '#10B981', color: '#FFF' }}>
                      <UserCheck size={18} />
                    </div>
                    <div className="claude-bot-content">
                      <div className="claude-bot-header">
                        <span className="claude-bot-name">Tư vấn viên: {m.senderName || 'CSKH'}</span>
                        <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>• Nhân sự trực tiếp</span>
                      </div>
                      <div className="claude-bot-text" style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 12, padding: 12, whiteSpace: 'pre-wrap' }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

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
                        dangerouslySetInnerHTML={{ __html: renderMarkdownLite(m.text, m.plates) }}
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
                          {onSwitchToStaff && (
                            <button
                              type="button"
                              onClick={onSwitchToStaff}
                              className="claude-chip-btn"
                              style={{
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                color: '#FFFFFF',
                                borderColor: '#059669',
                                fontWeight: 600,
                                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                              }}
                            >
                              <Headphones size={14} /> Nhắn tin trực tiếp với Quản lý Duy Đinh
                            </button>
                          )}
                          <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" className="claude-chip-btn" style={{ background: 'var(--brand-500, #F19720)', color: 'var(--action-primary-text, #111827)', borderColor: 'var(--brand-500, #F19720)' }}>
                            <MessageCircle size={14} /> Nhắn Zalo Chuyên viên
                          </a>
                          <a href={TEL_LINK} className="claude-chip-btn" style={{ borderColor: 'var(--brand-500)', color: 'var(--brand-700)' }}>
                            <Phone size={14} /> Hotline {DEFAULT_CONTACT.phone}
                          </a>
                        </div>
                      )}

                      {/* Claude Action Bar dưới mỗi tin phản hồi */}
                      {(m.messageId || m.text) && (() => {
                        const itemKey = m.messageId || (m.text ? m.text.trim().slice(0, 100) : `ans_${i}`);
                        const isSaved = savedAnswerIds.has(itemKey);
                        return (
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
                              className={`claude-action-btn ${isSaved ? 'active saved' : ''}`}
                              onClick={() => toggleSaveAnswer(m, i)}
                              title={isSaved ? 'Bỏ lưu câu trả lời khỏi mục Yêu thích' : 'Lưu câu trả lời vào mục Yêu thích'}
                              style={{
                                color: isSaved ? '#D97706' : undefined,
                                background: isSaved ? 'rgba(241, 151, 32, 0.1)' : undefined,
                              }}
                            >
                              <Bookmark
                                size={13}
                                fill={isSaved ? '#D97706' : 'none'}
                                color={isSaved ? '#D97706' : 'currentColor'}
                              />
                              <span style={{ fontWeight: isSaved ? 600 : 400 }}>
                                {isSaved ? 'Đã lưu' : 'Lưu'}
                              </span>
                            </button>

                            {/* Nút Thích (Hữu ích) */}
                            <button
                              type="button"
                              aria-label="Câu trả lời hữu ích"
                              className={`claude-action-btn ${m.ratedValue === 1 ? 'active liked' : ''}`}
                              onClick={() => rate(i, m.messageId, 1)}
                              title={m.ratedValue === 1 ? 'Đã thích (Bấm để hủy)' : 'Câu trả lời hữu ích'}
                              style={{
                                color: m.ratedValue === 1 ? '#15803D' : undefined,
                                background: m.ratedValue === 1 ? 'rgba(22, 163, 74, 0.14)' : undefined,
                              }}
                            >
                              <ThumbsUp
                                size={14}
                                fill={m.ratedValue === 1 ? '#15803D' : 'none'}
                                color={m.ratedValue === 1 ? '#15803D' : 'currentColor'}
                              />
                            </button>

                            {/* Nút Chưa hài lòng (Chưa đúng ý) */}
                            <button
                              type="button"
                              aria-label="Câu trả lời chưa đúng ý"
                              className={`claude-action-btn ${m.ratedValue === -1 ? 'active disliked' : ''}`}
                              onClick={() => rate(i, m.messageId, -1)}
                              title={m.ratedValue === -1 ? 'Đã đánh giá chưa đúng ý (Bấm để hủy)' : 'Câu trả lời chưa đúng ý'}
                              style={{
                                color: m.ratedValue === -1 ? '#DC2626' : undefined,
                                background: m.ratedValue === -1 ? 'rgba(220, 38, 38, 0.14)' : undefined,
                              }}
                            >
                              <ThumbsDown
                                size={14}
                                fill={m.ratedValue === -1 ? '#DC2626' : 'none'}
                                color={m.ratedValue === -1 ? '#DC2626' : 'currentColor'}
                              />
                            </button>
                          </div>
                        );
                      })()}
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
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--action-primary, #F19720)', textDecoration: 'none' }}>
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
