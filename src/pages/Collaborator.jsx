import Button from '../components/Button.jsx';
import { Input, Badge } from '../components/index.jsx';
import { validatePhone } from '../lib/mockData.js';

const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const copyText = (text, notify) => {
  const done = () => notify('Đã sao chép link giới thiệu');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
  else done();
};

function RegisterForm({ st, patch, notify }) {
  const f = st.collabForm || {};
  const err = st.collabErr || {};
  const set = (k) => (e) => patch({ collabForm: { ...f, [k]: e.target.value } });
  const submit = () => {
    const e2 = {};
    if (!(f.name || '').trim()) e2.name = 'Vui lòng nhập họ tên.';
    if (!validatePhone(f.phone || '')) e2.phone = 'Số điện thoại chưa đúng định dạng.';
    if (!(f.bank || '').trim()) e2.bank = 'Vui lòng nhập tên ngân hàng.';
    if (!(f.bankNo || '').trim()) e2.bankNo = 'Vui lòng nhập số tài khoản.';
    if (Object.keys(e2).length) { patch({ collabErr: e2 }); return; }
    const code = 'CTV' + String(f.phone).replace(/\D/g, '').slice(-4);
    patch({
      collabErr: {},
      collab: { name: f.name.trim(), phone: f.phone.trim(), bank: f.bank.trim(), bankNo: f.bankNo.trim(), code, status: 'Pending', earned: 0, pending: 0 },
    });
    notify('Đăng ký CTV thành công');
  };

  return (
    <section style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-7) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Đăng ký làm CTV</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Giới thiệu khách mua biển số, nhận hoa hồng trên mỗi giao dịch thành công.</span>
        </div>
        <Input label="Họ tên" placeholder="Nguyễn Văn A" value={f.name || ''} onChange={set('name')} error={err.name} />
        <Input label="Số điện thoại" placeholder="0905 221 334" value={f.phone || ''} onChange={set('phone')} error={err.phone} />
        <Input label="Ngân hàng nhận hoa hồng" placeholder="VCB, Techcombank, …" value={f.bank || ''} onChange={set('bank')} error={err.bank} />
        <Input label="Số tài khoản" placeholder="Số tài khoản nhận hoa hồng" value={f.bankNo || ''} onChange={set('bankNo')} error={err.bankNo} />
        <Button variant="primary" size="lg" fullWidth onClick={submit}>Đăng ký ngay</Button>
      </div>
    </section>
  );
}

export default function Collaborator({ st, patch, go, notify }) {
  const me = st.collab;
  if (!me) return <RegisterForm st={st} patch={patch} notify={notify} />;

  const referred = (st.collabs || []).filter((c) => c.referredBy === me.code);
  const active = referred.filter((c) => c.status === 'Active').length;
  const link = (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '') + '#/dang-ky?ref=' + me.code;

  return (
    <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--surface-inverse)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--white)' }}>Xin chào, {me.name}</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'rgba(255,255,255,.66)' }}>Mã giới thiệu của bạn</span>
        </div>
        <Badge tone="mint">{me.code}</Badge>
        <Badge tone={me.status === 'Active' ? 'mint' : me.status === 'Pending' ? 'amber' : 'neutral'}>{me.status}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter-section)' }}>
        {[
          ['Khách đã giới thiệu', String(referred.length), 'var(--text-strong)'],
          ['CTV đang hoạt động', String(active), 'var(--status-success)'],
          ['Hoa hồng đã nhận', money(me.earned), 'var(--status-success)'],
          ['Chờ thanh toán', money(me.pending), 'var(--status-warning)'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', minWidth: 0 }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Link giới thiệu của bạn</span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{link}</span>
        </div>
        <Button variant="primary" size="md" onClick={() => copyText(link, notify)}>Sao chép link</Button>
        <Button variant="ghost" size="md" onClick={go('list')}>Xem kho biển số</Button>
      </div>
    </section>
  );
}
