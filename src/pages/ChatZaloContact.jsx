import { MessageCircle, Phone, Send } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Input } from '../components/index.jsx';

// ponytail: UC05+UC06+UC07 — single page: Zalo button + phone + contact form
export default function ChatZaloContact({ st, patch, notify }) {
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Liên hệ tư vấn</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Chọn kênh phù hợp — phản hồi trong 15 phút, kể cả cuối tuần.</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--gutter-section)' }}>
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
          <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={st.mName} onChange={(e) => patch({ mName: e.target.value })} />
          <Input label="Số điện thoại" placeholder="09xx xxx xxx" value={st.mPhone} onChange={(e) => patch({ mPhone: e.target.value })} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Biển số quan tâm</span>
            <select value={st.curId} onChange={(e) => patch({ curId: e.target.value })} style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 12px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }}>
              {st.plates.filter((p) => p.status !== 'Ẩn').map((p) => <option key={p.id} value={p.id}>{p.prov}{p.seri} {p.num} — {p.cat}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ghi chú</span>
            <textarea rows={3} placeholder="VD: cần sang tên trong tuần này" value={st.mNote} onChange={(e) => patch({ mNote: e.target.value })} style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
          </label>
          <Button variant="primary" size="lg" fullWidth onClick={() => { if (!st.mName.trim() || !st.mPhone.trim()) { notify('Vui lòng nhập họ tên và số điện thoại.'); return; } patch({ modal: true }); }}>Gửi yêu cầu tư vấn</Button>
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
