import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, Phone, Send } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Input, Select } from '../components/index.jsx';
import { useSubmitContact } from '../services/contactService.js';

const INTENT_OPTS = ['Hỏi chung', 'Đặt cọc giữ biển', 'Mua đứt'];
const INTENT_VAL = { 'Hỏi chung': 'inquiry', 'Đặt cọc giữ biển': 'deposit_request', 'Mua đứt': 'buy' };

export default function ChatZaloContact({ notify }) {
  const [form, setForm] = useState({ fullName: '', phone: '', plateNumber: '', note: '', intent: 'inquiry' });
  const submit = useSubmitContact();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại.');
      return;
    }
    if (!/^0\d{8,10}$/.test(form.phone.trim().replace(/[\s\-\.]/g, ''))) {
      toast.error('Số điện thoại chưa đúng định dạng (VD: 0905221334).');
      return;
    }
    if (form.intent !== 'inquiry' && !form.plateNumber.trim()) {
      toast.error('Vui lòng nhập biển số quan tâm.');
      return;
    }

    submit.mutate({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      plateId: null,
      note: form.note.trim() || null,
      source: 'contact-page',
      intent: form.intent,
      depositAmount: null,
      honeypot: null,
    }, {
      onSuccess: () => {
        toast.success('Đã gửi yêu cầu, chúng tôi sẽ liên hệ trong thời gian sớm nhất!');
        setForm({ fullName: '', phone: '', plateNumber: '', note: '', intent: 'inquiry' });
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 'var(--gutter-section)' }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-pill)', background: '#E8F4FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={28} style={{ color: '#0180C7' }} /></div>
          <div><h3 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Nhắn Zalo</h3><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Trao đổi trực tiếp, gửi ảnh, nhận báo giá nhanh.</p></div>
          <Button variant="primary" size="lg" fullWidth onClick={() => { window.open('https://zalo.me/0905221334', '_blank'); notify('Đang mở Zalo...'); }}>Mở Zalo</Button>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>0905 221 334 · phản hồi 5–15 phút</span>
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-pill)', background: 'var(--mint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={28} style={{ color: '#1B7A5A' }} /></div>
          <div><h3 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Gọi điện thoại</h3><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Gọi trực tiếp để đặt lịch xem biển.</p></div>
          <a href="tel:0905221334" style={{ textDecoration: 'none', width: '100%' }}><Button variant="dark" size="lg" fullWidth>0905 221 334</Button></a>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>8:00–20:00 mỗi ngày</span>
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-pill)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={22} style={{ color: 'var(--action-primary)' }} /></div>
            <div><h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Gửi yêu cầu</h3><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Gọi lại trong 15 phút.</span></div>
          </div>
          <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} onChange={set('fullName')} />
          <Input label="Số điện thoại" placeholder="09xx xxx xxx" value={form.phone} onChange={set('phone')} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mục đích</span>
            <Select value={INTENT_OPTS[Object.keys(INTENT_VAL).indexOf(form.intent)] || 'Hỏi chung'} options={INTENT_OPTS} onChange={(v) => setForm((f) => ({ ...f, intent: INTENT_VAL[v] || 'inquiry' }))} />
          </label>
          {(form.intent === 'deposit_request' || form.intent === 'buy') && (
            <Input label="Biển số quan tâm" placeholder="VD: 43A1-999.99" value={form.plateNumber} onChange={set('plateNumber')} />
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ghi chú</span>
            <textarea rows={3} placeholder="VD: cần sang tên trong tuần này" value={form.note} onChange={set('note')} style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
          </label>
          <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={submit.isPending}>
            {submit.isPending ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
          </Button>
        </div>
      </div>

      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
        {[['Địa chỉ', '123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng'], ['Giờ làm việc', '8:00–20:00 · Tất cả các ngày'], ['Email', 'lienhe@biensovip.com']].map(([label, value]) => (
          <div key={label} style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
