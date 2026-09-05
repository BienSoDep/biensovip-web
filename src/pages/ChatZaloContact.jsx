import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, Phone, Send, MessageSquare, ClipboardCheck, HandCoins, FileSignature, KeyRound } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Input, Select, Checkbox } from '../components/index.jsx';
import { useSubmitContact } from '../services/contactService.js';
import { logZaloClick } from '../services/zaloClicks.js';
import { trackGenerateLead } from '../services/tracking/events.js';
import { content } from '../lib/content/index.js';
import { validatePhone, normalizePhone } from '../lib/phone.js';

const PROCESS_ICONS = [MessageSquare, ClipboardCheck, HandCoins, FileSignature, KeyRound];

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" {...props}>
      <path d="M16.6 5.82c-.9-.9-1.4-2.1-1.4-3.32h-3.3v13.86c0 1.5-1.22 2.72-2.72 2.72a2.72 2.72 0 0 1 0-5.44c.28 0 .55.04.8.12V10.4a6.03 6.03 0 0 0-.8-.06 6.06 6.06 0 1 0 6.06 6.06V9.4a8.24 8.24 0 0 0 4.82 1.54V7.64c-1.28 0-2.46-.42-3.46-1.14a5.6 5.6 0 0 1 0 -.68Z" />
    </svg>
  );
}

const INTENT_OPTS = ['Hỏi chung', 'Đặt cọc giữ biển', 'Mua đứt', 'Săn hộ / tư vấn theo nhu cầu', 'Yêu cầu về dữ liệu cá nhân'];
const INTENT_VAL = { 'Hỏi chung': 'inquiry', 'Đặt cọc giữ biển': 'deposit_request', 'Mua đứt': 'buy', 'Săn hộ / tư vấn theo nhu cầu': 'hunting', 'Yêu cầu về dữ liệu cá nhân': 'data_request' };
const RATE_KEY = 'biensovip_contact_rate';

export default function ChatZaloContact({ notify, user }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.identifierType === 'phone' ? (user?.identifier || '') : '',
    email: user?.identifierType === 'email' ? (user?.identifier || '') : '',
    plateNumber: '', note: '', intent: 'inquiry', depositAmount: '', subscribe: false, honeypot: '',
  });
  const submit = useSubmitContact();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const rateLimited = () => {
    try {
      const now = Date.now();
      const ts = (JSON.parse(localStorage.getItem(RATE_KEY)) || []).filter((t) => now - t < 5 * 60 * 1000);
      localStorage.setItem(RATE_KEY, JSON.stringify([...ts, now]));
      return ts.length >= 3;
    } catch { return false; }
  };

  const handleSubmit = () => {
    if (form.honeypot) return; // bot trap — silently drop
    if (rateLimited()) { toast.error('Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút.'); return; }
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại.');
      return;
    }
    if (!validatePhone(form.phone)) {
      toast.error('Số điện thoại chưa đúng định dạng (VD: 0905221334).');
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error('Email chưa đúng định dạng.');
      return;
    }
    if ((form.intent === 'deposit_request' || form.intent === 'buy') && !form.plateNumber.trim()) {
      toast.error('Vui lòng nhập biển số quan tâm.');
      return;
    }

    submit.mutate({
      fullName: form.fullName.trim(),
      phone: normalizePhone(form.phone),
      email: form.email?.trim() || null,
      plateId: null,
      plateNumber: form.plateNumber.trim() || null,
      note: form.note.trim() || null,
      source: 'contact-page',
      intent: form.intent,
      depositAmount: form.intent === 'deposit_request' ? (Number(form.depositAmount.replace(/[^\d]/g, '')) || null) : null,
      subscribeToNotifications: !!form.subscribe,
      honeypot: form.honeypot || null,
    }, {
      onSuccess: () => {
        trackGenerateLead(form.plateNumber.trim() || undefined, 'contact-page');
        toast.success('Đã gửi yêu cầu, chúng tôi sẽ liên hệ trong thời gian sớm nhất!');
        setForm({ fullName: '', phone: '', email: '', plateNumber: '', note: '', intent: 'inquiry', depositAmount: '', subscribe: false, honeypot: '' });
      },
      onError: (err) => {
        toast.error(err?.message || 'Gửi thất bại, vui lòng thử lại.');
      },
    });
  };

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Liên hệ tư vấn</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Chọn kênh phù hợp — phản hồi trong 15 phút, kể cả cuối tuần.</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 'var(--gutter-section)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)', height: '100%' }}>
          <div style={{ position: 'relative', flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: '0 0 0 2px var(--action-primary) inset', padding: 'var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span style={{ position: 'absolute', top: -10, left: 20, background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', padding: '2px 10px', borderRadius: 'var(--radius-pill)' }}>Nhanh nhất</span>
            <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-pill)', background: '#E8F4FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={22} style={{ color: '#0180C7' }} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Nhắn Zalo</h3>
              <p style={{ margin: '2px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{content.info.phone_display} · phản hồi {content.info.reply_time}</p>
            </div>
            <Button variant="primary" size="md" onClick={() => { logZaloClick(null, 'contact_page'); window.open(`https://zalo.me/${content.info.zalo}`, '_blank'); notify('Đang mở Zalo...'); }} style={{ flexShrink: 0 }}>Mở Zalo</Button>
          </div>

          <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-pill)', background: 'var(--mint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={22} style={{ color: 'var(--status-success-ink)' }} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Gọi điện thoại</h3>
              <p style={{ margin: '2px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{content.info.hours}</p>
            </div>
            <a href={`tel:${content.info.phone}`} style={{ textDecoration: 'none', flexShrink: 0 }}><Button variant="dark" size="md">{content.info.phone_display}</Button></a>
          </div>

          <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-pill)', background: '#E7EFFD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FacebookIcon style={{ color: '#1877F2' }} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Facebook</h3>
              <p style={{ margin: '2px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Nhắn tin qua fanpage, xem thêm biển số mới đăng.</p>
            </div>
            <a href={content.info.facebook_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', flexShrink: 0 }}><Button variant="outline" size="md">Fanpage</Button></a>
          </div>

          <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-pill)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TikTokIcon style={{ color: 'var(--white)' }} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>TikTok</h3>
              <p style={{ margin: '2px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Video giới thiệu biển số, đánh giá thực tế từ khách.</p>
            </div>
            <a href={content.info.tiktok_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', flexShrink: 0 }}><Button variant="outline" size="md">Xem TikTok</Button></a>
          </div>
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-pill)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={22} style={{ color: 'var(--action-primary)' }} /></div>
            <div><h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Gửi yêu cầu</h3><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Gọi lại trong 15 phút.</span></div>
          </div>
          <input type="text" name="company" value={form.honeypot} onChange={set('honeypot')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
          <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} onChange={set('fullName')} />
          <Input label="Số điện thoại" placeholder="09xx xxx xxx" value={form.phone} onChange={set('phone')} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mục đích</span>
            <Select value={INTENT_OPTS[Object.keys(INTENT_VAL).indexOf(form.intent)] || 'Hỏi chung'} options={INTENT_OPTS.map((o) => ({ value: o, label: o }))} onChange={(v) => setForm((f) => ({ ...f, intent: INTENT_VAL[v] || 'inquiry' }))} />
          </label>
          {(form.intent === 'deposit_request' || form.intent === 'buy') && (
            <Input label="Biển số quan tâm" placeholder="VD: 43A1-999.99" value={form.plateNumber} onChange={set('plateNumber')} />
          )}
          {form.intent === 'deposit_request' && (
            <Input label="Số tiền cọc (VNĐ)" placeholder="VD: 50000000" value={form.depositAmount} onChange={set('depositAmount')} />
          )}
          <Input label="Email (tùy chọn)" type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} />
          <Checkbox label="Báo tôi khi có biển tương tự / khuyến mãi" checked={form.subscribe} onChange={(v) => setForm((f) => ({ ...f, subscribe: !!v }))} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ghi chú</span>
            <textarea rows={3} placeholder="VD: cần sang tên trong tuần này" value={form.note} onChange={set('note')} style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
          </label>
          <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={submit.isPending}>
            {submit.isPending ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
          </Button>
        </div>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div>
          <h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{content.process.detail.title}</h2>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{content.process.detail.desc}</p>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {content.process.steps.map((s, i) => {
            const Icon = PROCESS_ICONS[i] || MessageSquare;
            const isLast = i === content.process.steps.length - 1;
            return (
              <div key={s.title} style={{ position: 'relative', display: 'flex', gap: 'var(--space-4)', paddingBottom: isLast ? 0 : 'var(--space-6)' }}>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', boxShadow: 'var(--shadow-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <Icon size={20} style={{ color: 'var(--white)' }} />
                  </div>
                  {!isLast && <div style={{ position: 'absolute', top: 44, bottom: 0, width: 2, background: 'var(--border-hairline)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8 }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>Bước {i + 1}</span>
                  <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{s.title}</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{s.detail}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
        {[['Địa chỉ', content.info.address], ['Giờ làm việc', content.info.hours], ['Email', content.info.email]].map(([label, value]) => (
          <div key={label} style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
