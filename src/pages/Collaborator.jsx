import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import { Input, Badge } from '../components/index.jsx';
import { validatePhone } from '../lib/phone.js';
import { useRegisterCollaborator, useCollaboratorDashboard } from '../services/collaborators.js';

const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const CODE_KEY = 'bsv.ctvCode';

function RegisterForm({ onRegistered }) {
  const [f, setF] = useState({});
  const [err, setErr] = useState({});
  const [done, setDone] = useState(false);
  const register = useRegisterCollaborator();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const e2 = {};
    if (!(f.fullName || '').trim()) e2.fullName = 'Vui lòng nhập họ tên.';
    if (!validatePhone(f.phone || '')) e2.phone = 'Số điện thoại chưa đúng định dạng.';
    if (!(f.bankAccount || '').trim()) e2.bankAccount = 'Vui lòng nhập số tài khoản nhận hoa hồng.';
    if (Object.keys(e2).length) { setErr(e2); return; }
    setErr({});
    register.mutate(
      { fullName: f.fullName.trim(), phone: f.phone.trim(), email: f.email?.trim() || null, bankAccount: f.bankAccount.trim() },
      {
        onSuccess: () => setDone(true),
        onError: (e) => {
          if (e?.code === 'DUPLICATE_PHONE') setErr({ phone: 'Số điện thoại đã đăng ký CTV.' });
          else setErr({ form: e?.message || 'Đăng ký thất bại, thử lại.' });
        },
      },
    );
  };

  if (done) {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)' }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-7) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', textAlign: 'center' }}>
          <span style={{ font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>Đã gửi hồ sơ đăng ký</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Hồ sơ của bạn đang chờ admin duyệt. Khi được duyệt, bạn sẽ nhận mã giới thiệu riêng — quay lại trang này và nhập mã để xem dashboard.
          </span>
          <Button variant="ghost" size="md" onClick={onRegistered}>Về trang chủ</Button>
        </div>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-7) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Đăng ký làm CTV</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Giới thiệu khách mua biển số, nhận hoa hồng trên mỗi giao dịch thành công.</span>
        </div>
        <Input label="Họ tên" placeholder="Nguyễn Văn A" value={f.fullName || ''} onChange={set('fullName')} error={err.fullName} />
        <Input label="Số điện thoại" placeholder="0905 221 334" value={f.phone || ''} onChange={set('phone')} error={err.phone} />
        <Input label="Email (tùy chọn)" placeholder="ban@gmail.com" value={f.email || ''} onChange={set('email')} />
        <Input label="Số tài khoản nhận hoa hồng" placeholder="Ngân hàng · số tài khoản" value={f.bankAccount || ''} onChange={set('bankAccount')} error={err.bankAccount} />
        {err.form && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err.form}</span>}
        <Button variant="primary" size="lg" fullWidth onClick={submit} loading={register.isPending}>Đăng ký ngay</Button>
      </div>
    </section>
  );
}

function LookupForm({ onFound }) {
  const [code, setCode] = useState('');
  return (
    <section style={{ maxWidth: 560, margin: '0 auto', padding: '0 var(--pad-page) var(--space-9)' }}>
      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-5) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', flex: '1 1 240px' }}>Đã là CTV? Nhập mã giới thiệu để xem dashboard.</span>
        <Input placeholder="Mã giới thiệu (VD: CTV7K9X2A)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <Button variant="outline" size="md" onClick={() => code.trim() && onFound(code.trim())}>Xem dashboard</Button>
      </div>
    </section>
  );
}

function DashboardBody({ data, onReset }) {
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard.writeText(data.referralUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (data.status !== 'active') {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Badge tone={data.status === 'pending' ? 'amber' : 'rose'}>{data.status === 'pending' ? 'Chờ duyệt' : 'Bị khóa'}</Badge>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          {data.status === 'pending' ? 'Hồ sơ của bạn đang chờ admin duyệt.' : 'Tài khoản CTV đã bị khóa. Liên hệ admin để biết thêm.'}
        </span>
        <Button variant="ghost" size="sm" onClick={onReset}>Quay lại</Button>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--surface-inverse)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--white)' }}>Xin chào, {data.fullName}</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'rgba(255,255,255,.66)' }}>Mã giới thiệu của bạn</span>
        </div>
        <Badge tone="mint">{data.referralCode}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter-section)' }}>
        {[
          ['Lượt click', String(data.clicks), 'var(--text-strong)'],
          ['Giao dịch thành công', String(data.successfulDeals), 'var(--status-success)'],
          ['Chờ duyệt', money(data.pending), 'var(--status-warning)'],
          ['Đã duyệt / đã chi trả', money(data.approved + data.paid), 'var(--status-success)'],
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
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{data.referralUrl}</span>
        </div>
        <Button variant="primary" size="md" onClick={copyLink}>{copied ? 'Đã sao chép' : 'Sao chép link'}</Button>
      </div>

      {data.recent?.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Giao dịch gần đây</span>
          {data.recent.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '8px 0', borderTop: '1px solid var(--grey-100)' }}>
              <span style={{ font: 'var(--type-body-sm)' }}>{r.plateNumber || '—'}</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{money(r.amount)}</span>
              <Badge tone={r.status === 'paid' ? 'mint' : r.status === 'approved' ? 'blue' : 'amber'}>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={onReset}>Không phải bạn? Đổi mã</Button>
    </section>
  );
}

function Dashboard({ code, onReset }) {
  const { data, isLoading, isError } = useCollaboratorDashboard(code);

  if (isLoading) {
    return <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)' }}>Đang tải…</section>;
  }
  if (isError || !data) {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tìm thấy mã CTV này.</span>
        <Button variant="ghost" size="sm" onClick={onReset}>Thử mã khác</Button>
      </section>
    );
  }
  return <DashboardBody data={data} onReset={onReset} />;
}

export default function Collaborator({ go }) {
  const [code, setCode] = useState(() => { try { return localStorage.getItem(CODE_KEY) || ''; } catch { return ''; } });

  useEffect(() => {
    try { code ? localStorage.setItem(CODE_KEY, code) : localStorage.removeItem(CODE_KEY); } catch { /* ignore */ }
  }, [code]);

  if (code) return <Dashboard code={code} onReset={() => setCode('')} />;

  return (
    <>
      <LookupForm onFound={setCode} />
      <RegisterForm onRegistered={() => go('home')()} />
    </>
  );
}
