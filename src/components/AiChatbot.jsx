import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';

// ponytail: UC26 keyword-matching chatbot, floating widget, quick replies
const REPLIES = {
  'giá': 'Giá biển số phụ thuộc vào loại (ngũ quý, tứ quý, lộc phát...), đầu số tỉnh và độ hiếm. Bạn muốn tham khảo loại nào?',
  'mua': 'Để mua biển số, chọn biển ưng ý, nhấn "Yêu cầu tư vấn". Shop gọi lại trong 15 phút để báo giá và hướng dẫn thủ tục.',
  'thủ tục': 'Thủ tục sang tên mất 1–2 ngày. Cần: CMND/CCCD, giấy đăng ký xe. Shop lo phần còn lại.',
  'liên hệ': 'Gọi 0905 221 334 hoặc nhắn Zalo cùng số. Shop làm việc 8:00–20:00 mỗi ngày.',
  'zalo': 'Nhắn Zalo 0905 221 334 để được tư vấn nhanh nhất kèm ảnh biển thực tế.',
  'đẹp': 'Biển đẹp là biển hợp mệnh chủ xe. Dùng công cụ "Tra cứu hợp mệnh" để xem biển nào hợp tuổi nhé!',
};

function matchReply(msg) {
  const lower = msg.toLowerCase();
  for (const [k, v] of Object.entries(REPLIES)) {
    if (lower.includes(k)) return v;
  }
  return 'Cảm ơn bạn! Bạn cần tư vấn về giá, thủ tục, hay muốn xem kho biển? Tôi sẽ giúp ngay.';
}

export default function AiChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ from: 'bot', text: 'Chào bạn! Tôi là trợ lý Biensovip. Bạn cần tư vấn gì về biển số ạ?' }]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = () => {
    const v = input.trim();
    if (!v) return;
    const next = [...msgs, { from: 'user', text: v }];
    setMsgs(next);
    setInput('');
    setTimeout(() => setMsgs([...next, { from: 'bot', text: matchReply(v) }]), 600 + Math.random() * 600);
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 70, width: 52, height: 52, borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--action-primary)', color: 'var(--white)', cursor: 'pointer', boxShadow: 'var(--shadow-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={24} />
        </button>
      )}
      {open && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 70, width: 360, maxWidth: 'calc(100vw - 32px)', height: 480, maxHeight: 'calc(100vh - 80px)', background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'modalIn 200ms var(--ease-out)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', background: 'var(--action-primary)', color: 'var(--white)' }}>
            <Sparkles size={20} />
            <div style={{ flex: 1 }}><span style={{ font: 'var(--type-title-3)', color: 'var(--white)' }}>Trợ lý Biensovip</span></div>
            <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--white)', padding: 4 }}><X size={20} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: m.from === 'user' ? 'var(--radius-pill)' : 'var(--radius-md)', background: m.from === 'user' ? 'var(--action-primary)' : 'var(--surface-sunken)', color: m.from === 'user' ? 'var(--white)' : 'var(--text-body)', font: 'var(--type-body-sm)' }}>{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 var(--space-3) var(--space-2)' }}>
            {['Báo giá', 'Thủ tục', 'Liên hệ', 'Biển hợp mệnh'].map((qr) => (
              <button key={qr} onClick={() => { setInput(qr); }} style={{ border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', padding: '5px 12px', font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>{qr}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-3)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
            <input type="text" placeholder="Nhập câu hỏi..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} style={{ flex: 1, height: 40, border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', padding: '0 16px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }} />
            <button onClick={send} style={{ width: 40, height: 40, borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--action-primary)', color: 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={16} /></button>
          </div>
        </div>
      )}
    </>
  );
}
