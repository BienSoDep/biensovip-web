import { useState } from 'react';
import toast from 'react-hot-toast';
import { Input, Select, Checkbox } from './index.jsx';
import Button from './Button.jsx';
import { useSubmitContact } from '../services/contactService.js';
import { trackGenerateLead } from '../services/tracking/events.js';
import { validatePhone, normalizePhone } from '../lib/phone.js';

const RATE_KEY = 'biensovip_contact_rate';
const INTENT_OPTS = ['Hỏi chung', 'Đặt cọc giữ biển', 'Mua đứt', 'Yêu cầu về dữ liệu cá nhân'];
const INTENT_VAL = { 'Hỏi chung': 'inquiry', 'Đặt cọc giữ biển': 'deposit_request', 'Mua đứt': 'buy', 'Yêu cầu về dữ liệu cá nhân': 'data_request' };

// Form liên hệ đầy đủ — trước đây trang Liên hệ (ChatZaloContact) và trang chủ (Home) mỗi nơi tự
// dựng 1 bản riêng: bản Home thiếu rate-limit, honeypot, mục đích, email — validate sơ sài hơn hẳn.
// Giờ dùng chung bản đầy đủ (chuẩn theo trang Liên hệ), chỉ đổi `source` để phân biệt nơi gửi.
// compact=true (Home) ẩn Mục đích/Biển số quan tâm/Email/Subscribe — vẫn giữ rate-limit + honeypot + validate.
export default function ContactRequestForm({ user, source, compact = false }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.identifierType === 'phone' ? (user?.identifier || '') : '',
    email: user?.identifierType === 'email' ? (user?.identifier || '') : '',
    plateNumber: '', note: '', intent: 'inquiry', subscribe: false, honeypot: '',
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
      source,
      intent: form.intent,
      subscribeToNotifications: !!form.subscribe,
      honeypot: form.honeypot || null,
    }, {
      onSuccess: () => {
        trackGenerateLead(form.plateNumber.trim() || undefined, source);
        toast.success('Đã gửi yêu cầu, chúng tôi sẽ liên hệ trong thời gian sớm nhất!');
        setForm({ fullName: '', phone: '', email: '', plateNumber: '', note: '', intent: 'inquiry', subscribe: false, honeypot: '' });
      },
      onError: (err) => toast.error(err?.message || 'Gửi thất bại, vui lòng thử lại.'),
    });
  };

  return (
    <>
      <input type="text" name="company" value={form.honeypot} onChange={set('honeypot')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
      <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} onChange={set('fullName')} required />
      <Input label="Số điện thoại" placeholder="09xx xxx xxx" value={form.phone} onChange={set('phone')} required />
      {!compact && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mục đích</span>
          <Select value={INTENT_OPTS[Object.keys(INTENT_VAL).indexOf(form.intent)] || 'Hỏi chung'} options={INTENT_OPTS.map((o) => ({ value: o, label: o }))} onChange={(v) => setForm((f) => ({ ...f, intent: INTENT_VAL[v] || 'inquiry' }))} />
        </label>
      )}
      {!compact && (form.intent === 'deposit_request' || form.intent === 'buy') && (
        <Input label="Biển số quan tâm" placeholder="VD: 43A1-999.99" value={form.plateNumber} onChange={set('plateNumber')} />
      )}
      {!compact && <Input label="Email (tùy chọn)" type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} />}
      {!compact && <Checkbox label="Báo tôi khi có biển tương tự / khuyến mãi" checked={form.subscribe} onChange={(v) => setForm((f) => ({ ...f, subscribe: !!v }))} />}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ghi chú</span>
        <textarea rows={3} placeholder="VD: cần sang tên trong tuần này" value={form.note} onChange={set('note')} style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
      </label>
      <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={submit.isPending}>
        {submit.isPending ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
      </Button>
    </>
  );
}
