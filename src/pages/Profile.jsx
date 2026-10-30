import { useEffect, useState } from 'react';
import { User, ShieldCheck, Bell, Briefcase, HelpCircle, ChevronRight } from 'lucide-react';
import Button from '../components/Button.jsx';
import BulletPicker from '../components/BulletPicker.jsx';
import AvatarUploader from '../components/AvatarUploader.jsx';
import FeedbackForm from '../components/FeedbackForm.jsx';
import { Input, Select, Eyebrow, DateInputVN, PageHeader } from '../components/index.jsx';
import { updateProfile, changePassword, refreshToken, requestEmailVerifyOtp, confirmEmailVerifyOtp } from '../services/authService.js';
import { useNotificationSettings, useUpdateNotificationSettings } from '../services/notificationService.js';
import { useBecomeCollaborator, useUpdateBankInfo } from '../services/collaborators.js';
import { PURPOSES, VEHICLES } from '../lib/fengshui.js';
import { validBirthDate } from '../lib/date.js';
import { validatePhone } from '../lib/phone.js';
import { fetchVietQrBanks, vietQrImageUrl } from '../lib/vietqr.js';
import { trackBecomeCollaborator } from '../services/tracking/events.js';

const GENDER_OPTS = [{ value: 'male', label: 'Nam' }, { value: 'female', label: 'Nữ' }, { value: 'other', label: 'Khác' }];

function GenderPicker({ value, onChange }) {
  return (
    <div>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Giới tính (không bắt buộc)</span>
      <div role="radiogroup" aria-label="Giới tính" style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 6, flexWrap: 'wrap' }}>
        {GENDER_OPTS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? '' : opt.value)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px',
                border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                font: 'var(--type-body-sm)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                background: active ? 'var(--action-primary)' : 'var(--surface-sunken)',
                color: active ? 'var(--text-inverse)' : 'var(--text-body)',
                boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: active ? 'var(--text-inverse)' : 'var(--grey-300)',
              }} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Profile({ go, notify, user, onUserUpdate, onLogout }) {
  // Đến từ "Trở thành CTV" (trang Collaborator) qua hash #become-ctv → cuộn thẳng tới section CTV
  // thay vì bắt user tự cuộn qua Thông tin/Đổi mật khẩu/Thông báo ở trên.
  useEffect(() => {
    if (window.location.hash === '#become-ctv') {
      document.getElementById('become-ctv')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const purposeLabelFromKey = (key) => PURPOSES.find((p) => p.key === key)?.label || '';
  const [form, setForm] = useState({
    fullName: user?.fullName || '', phone: user?.phone || '', birthDate: user?.birthDate || '', gender: user?.gender || '',
    preferredVehicle: user?.preferredVehicle || '', preferredPurpose: purposeLabelFromKey(user?.preferredPurpose),
  });
  const [err, setErr] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (form.birthDate && !validBirthDate(form.birthDate)) { setErr('Ngày sinh không hợp lệ hoặc ở tương lai.'); return; }
    if (form.phone.trim() && !validatePhone(form.phone)) { setPhoneErr('Số điện thoại chưa đúng định dạng (VD: 0905221334).'); return; }
    setErr('');
    setPhoneErr('');
    setSaving(true);
    try {
      const updated = await updateProfile({
        fullName: form.fullName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        preferredVehicle: form.preferredVehicle || undefined,
        preferredPurpose: PURPOSES.find((p) => p.label === form.preferredPurpose)?.key || undefined,
      });
      onUserUpdate?.(updated);
      notify('Đã lưu thông tin');
    } catch (err) {
      if (err.code === 'PHONE_EXISTS') setPhoneErr('Số điện thoại đã được sử dụng.');
      else notify(err.message || 'Không lưu được, thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  const identifierLabel = user?.identifierType === 'phone' ? 'Số điện thoại' : 'Email';

  // Settings dùng bố cục 2 cột (nav section bên trái sticky + nội dung bên phải) trên desktop
  // thay vì 1 card đơn độc giữa trang trống — giữ form max-width dễ đọc nhưng không lạc lõng.
  const SECTION_NAV = [
    { href: '#profile-section', label: 'Tài khoản', icon: User },
    { href: '#security-section', label: 'Bảo mật', icon: ShieldCheck },
    { href: '#notification-section', label: 'Thông báo', icon: Bell },
    { href: '#become-ctv', label: 'Cộng tác viên', icon: Briefcase },
    { href: '#feedback-section', label: 'Báo cáo hệ thống', icon: HelpCircle },
  ];

  return (
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div className="profile-layout">
        <nav aria-label="Mục cài đặt" className="profile-side-nav">
          <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-hairline)', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Cài đặt hồ sơ</span>
          </div>
          {SECTION_NAV.map((item) => {
            const IconComp = item.icon;
            return (
              <a key={item.href} href={item.href} className="profile-side-nav__item">
                <span className="profile-side-nav__icon-box">
                  <IconComp size={16} />
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <ChevronRight size={14} className="profile-side-nav__arrow" />
              </a>
            );
          })}
        </nav>

        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div id="profile-section">
            <PageHeader
              eyebrow="Tài khoản"
              title="Thông tin cá nhân"
              subtitle="Cập nhật họ tên, ngày sinh và giới tính — dùng để tính hợp mệnh phong thủy và gợi ý biển số phù hợp hơn với bạn."
            />
          </div>

          {((user?.email && (user.email.toLowerCase().endsWith('@biensovip.com') || user.email.toLowerCase().startsWith('admin'))) ||
            (user?.identifier && (user.identifier.toLowerCase().endsWith('@biensovip.com') || user.identifier.toLowerCase().startsWith('admin')))) && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)',
              padding: '14px 20px', borderRadius: 'var(--radius-card)',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              color: '#FFFFFF', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Tài khoản Quản trị viên hệ thống</div>
                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Bạn đang ở giao diện hồ sơ khách hàng. Chuyển sang khu vực quản trị để thao tác toàn quyền.</div>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.location.href = '/admin/tong-quan';
                }}
                style={{ background: 'var(--action-primary)', color: 'var(--white)', fontWeight: 600, border: 'none' }}
              >
                Vào Trang Quản Trị &rarr;
              </Button>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ width: '100%', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <AvatarUploader user={user} onUserUpdate={onUserUpdate} notify={notify} />
            <div>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{identifierLabel}</span>
              <div style={{ marginTop: 6, height: 40, display: 'flex', alignItems: 'center', padding: '0 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', font: 'var(--type-body)', color: 'var(--text-muted)' }}>{user?.identifier || '—'}</div>
            </div>
            <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} />

            <Input label="Số điện thoại" type="tel" placeholder="09xx xxx xxx" value={form.phone} error={phoneErr} onChange={(e) => set('phone')(e.target.value)} />

            <DateInputVN label="Ngày sinh (dương lịch)" value={form.birthDate} error={err} onChange={(e) => set('birthDate')(e.target.value)} />

            <GenderPicker value={form.gender} onChange={set('gender')} />

            <BulletPicker label="Loại xe thường dùng" value={form.preferredVehicle} onChange={set('preferredVehicle')} options={VEHICLES} allowDeselect labelSuffix=" (không bắt buộc)" />
            <BulletPicker label="Mục đích sử dụng biển thường xuyên" value={form.preferredPurpose} onChange={set('preferredPurpose')} options={PURPOSES.map((p) => p.label)} allowDeselect labelSuffix=" (không bắt buộc)" />

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Button variant="primary" type="submit" size="lg" disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
            </div>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'var(--space-6)' }} className="profile-grid-2col">
            <ChangePasswordSection notify={notify} />
            <NotificationSettingsSection notify={notify} />
          </div>
          <BecomeCollaboratorSection go={go} notify={notify} user={user} onUserUpdate={onUserUpdate} />
          <FeedbackSection />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--grey-100)' }}>
            <Button variant="ghost" onClick={onLogout} fullWidth style={{ color: 'var(--status-danger)' }}>Đăng xuất</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChangePasswordSection({ notify }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!current || !next) { setErr('Nhập đủ mật khẩu hiện tại và mật khẩu mới.'); return; }
    setErr('');
    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent(''); setNext('');
      notify('Đã đổi mật khẩu. Vui lòng đăng nhập lại trên các thiết bị khác.');
    } catch (e) {
      setErr(e.message || 'Không đổi được mật khẩu, thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="security-section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Eyebrow tone="brand">Bảo mật</Eyebrow>
      <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ width: '100%', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Đổi mật khẩu</h3>
        <Input label="Mật khẩu hiện tại" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <Input label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự, có cả chữ và số (nhấn Enter để lưu)" value={next} onChange={(e) => setNext(e.target.value)} required />
        {err && <span role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
        <Button variant="primary" type="submit" size="lg" disabled={saving} style={{ alignSelf: 'flex-start' }}>{saving ? 'Đang lưu...' : 'Đổi mật khẩu'}</Button>
      </form>
    </div>
  );
}

function FeedbackSection() {
  return (
    <div id="feedback-section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Eyebrow tone="brand">Báo cáo hệ thống</Eyebrow>
      <div style={{ width: '100%', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Gửi báo cáo lỗi / góp ý</h3>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Gặp lỗi hoặc có góp ý cải thiện hệ thống? Gửi cho đội ngũ phát triển ở đây.</p>
        </div>
        <FeedbackForm />
      </div>
    </div>
  );
}

const NOTIFY_HOUR_OPTS = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, '0')}:00` }));

function NotificationSettingsSection({ notify }) {
  const { data, isLoading } = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const [notifyByEmail, setNotifyByEmail] = useState(null);
  const [notifyHour, setNotifyHour] = useState(null);

  const emailOn = notifyByEmail ?? data?.notifyByEmail ?? false;
  const hour = notifyHour ?? (data?.notifyHour != null ? String(data.notifyHour) : '8');

  const toggleEmail = async () => {
    const value = !emailOn;
    setNotifyByEmail(value);
    try { await update.mutateAsync({ notifyByEmail: value }); }
    catch (e) { setNotifyByEmail(!value); notify(e.message || 'Lỗi khi lưu'); }
  };

  const changeHour = async (v) => {
    setNotifyHour(v);
    try { await update.mutateAsync({ notifyHour: Number(v) }); notify('Đã lưu khung giờ nhận thông báo'); }
    catch (e) { notify(e.message || 'Lỗi khi lưu'); }
  };

  if (isLoading) return null;

  return (
    <div id="notification-section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Eyebrow tone="brand">Thông báo</Eyebrow>
      <div style={{ width: '100%', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={emailOn} onChange={toggleEmail} />
          <span style={{ font: 'var(--type-body)', color: 'var(--text-strong)' }}>Nhận thông báo qua email</span>
        </label>
        <div style={{ maxWidth: 220 }}>
          <Select label="Khung giờ nhận email tổng hợp" info="Email tổng hợp các thông báo mới (biển yêu thích giảm giá, tin nhắn...) sẽ gửi vào khung giờ này mỗi ngày." value={hour} options={NOTIFY_HOUR_OPTS} onChange={changeHour} />
        </div>
      </div>
    </div>
  );
}

// CTV gộp vào User — user đăng nhập tự-activate từ profile. Sau kích hoạt refresh token để
// JWT có claim `collaborator` (policy CollaboratorOnly đọc claim, không đọc DB), rồi đẩy user mới lên App.
function BecomeCollaboratorSection({ notify, user, onUserUpdate }) {
  const become = useBecomeCollaborator();
  const updateBank = useUpdateBankInfo();
  const [bankAccount, setBankAccount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [banks, setBanks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [editingBank, setEditingBank] = useState(false);

  useEffect(() => { fetchVietQrBanks().then(setBanks); }, []);

  const sendOtp = async () => {
    setOtpBusy(true);
    try {
      await requestEmailVerifyOtp();
      setOtpSent(true);
      notify('Đã gửi mã xác thực tới email của bạn.');
    } catch (e) {
      notify(e?.message || 'Gửi mã thất bại, thử lại sau.');
    } finally {
      setOtpBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (otpCode.trim().length !== 6) { notify('Nhập đủ 6 số của mã xác thực.'); return; }
    setOtpBusy(true);
    try {
      await confirmEmailVerifyOtp(otpCode.trim());
      const data = await refreshToken();
      if (data?.user) onUserUpdate?.(data.user);
      notify(data?.user?.isCollaborator ? 'Xác thực email thành công. Bạn đã trở thành Cộng tác viên!' : 'Xác thực email thành công.');
      setOtpSent(false);
      setOtpCode('');
      if (data?.user?.isCollaborator) setEditingBank(true);
    } catch (e) {
      notify(e?.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
    } finally {
      setOtpBusy(false);
    }
  };

  const isCtv = Boolean(user?.isCollaborator);

  const activate = async () => {
    setBusy(true);
    try {
      await become.mutateAsync({});
      trackBecomeCollaborator();
      const data = await refreshToken();
      if (data?.user) onUserUpdate?.(data.user);
      notify('Bạn đã trở thành Cộng tác viên');
      setEditingBank(true);
    } catch (e) {
      const code = e?.code;
      // Chưa verify email → backend chặn. Tự gửi mã rồi mở ô nhập mã ngay tại đây,
      // giữ nguyên form ngân hàng user vừa điền thay vì bắt bấm nút khác trước.
      if (code === 'EMAIL_NOT_VERIFIED') {
        try {
          await requestEmailVerifyOtp();
          setOtpSent(true);
          notify('Đã gửi mã xác thực tới email của bạn. Nhập mã để hoàn tất.');
        } catch (err) {
          notify(err?.message || 'Gửi mã thất bại, thử lại sau.');
        }
      } else {
        notify(e?.message || 'Kích hoạt thất bại, thử lại sau.');
      }
    } finally {
      setBusy(false);
    }
  };

  const saveBankInfo = async () => {
    if (!bankAccount.trim()) { notify('Nhập số tài khoản.'); return; }
    if (!bankCode) { notify('Chọn ngân hàng.'); return; }
    setBusy(true);
    try {
      await updateBank.mutateAsync({ bankAccount: bankAccount.trim(), bankCode, bankAccountHolder: bankAccountHolder.trim() || undefined });
      const data = await refreshToken();
      if (data?.user) onUserUpdate?.(data.user);
      notify('Đã cập nhật thông tin ngân hàng.');
      setEditingBank(false);
    } catch (e) {
      notify(e?.message || 'Cập nhật thất bại, thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  const qrPreviewUrl = vietQrImageUrl(bankCode, bankAccount.trim());

  return (
    <div id="become-ctv" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Eyebrow tone="brand">Cộng tác viên</Eyebrow>
      <div style={{ width: '100%', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {isCtv ? (
          <>
            <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Bạn đang là Cộng tác viên</h3>
            {user?.ctvReferralCode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ font: 'var(--type-body)', color: 'var(--text-muted)' }}>Mã giới thiệu:</span>
                <span style={{ font: 'var(--type-title-3)', fontWeight: 700, color: 'var(--text-strong)', background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-pill)', padding: '6px 14px' }}>{user.ctvReferralCode}</span>
              </div>
            )}
            {!editingBank ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Ngân hàng nhận hoa hồng</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ font: 'var(--type-body)', color: 'var(--text-strong)' }}>
                    {user?.bankCode ? (banks.find((b) => b.value === user.bankCode)?.label || user.bankCode) : 'Chưa cập nhật'}
                    {user?.bankAccount ? ` — ${user.bankAccount}` : ''}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setBankAccount(user?.bankAccount || '');
                    setBankCode(user?.bankCode || '');
                    setBankAccountHolder(user?.bankAccountHolder || '');
                    setEditingBank(true);
                  }}>Sửa</Button>
                </div>
                {user?.bankAccountHolder && (
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chủ tài khoản: {user.bankAccountHolder}</span>
                )}
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); saveBankInfo(); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                  Cần thông tin ngân hàng để chuyển hoa hồng khi có giao dịch — có thể bổ sung sau, không ảnh hưởng tư cách CTV.
                </p>
                <Select label="Ngân hàng" value={bankCode} options={banks} onChange={setBankCode} required />
                <Input label="Số tài khoản" placeholder="Số tài khoản ngân hàng (nhấn Enter để lưu)" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required />
                <Input label="Tên chủ tài khoản (không bắt buộc)" placeholder="NGUYEN VAN A" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} />
                {qrPreviewUrl && (
                  <img src={qrPreviewUrl} alt="QR chuyển khoản" style={{ width: 160, height: 160, borderRadius: 'var(--radius-field)', alignSelf: 'flex-start' }} />
                )}
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button variant="primary" type="submit" size="md" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu'}</Button>
                  <Button variant="ghost" type="button" size="md" onClick={() => setEditingBank(false)} disabled={busy}>Hủy</Button>
                </div>
              </form>
            )}
          </>
        ) : (
          <>
            <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Trở thành Cộng tác viên</h3>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              Bấm Kích hoạt CTV để bắt đầu. Thông tin ngân hàng nhận hoa hồng điền sau khi kích hoạt xong.
            </p>
            {otpSent ? (
              <form onSubmit={(e) => { e.preventDefault(); confirmOtp(); }} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Input label="Mã xác thực (6 số)" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                <Button variant="primary" type="submit" size="md" disabled={otpBusy}>{otpBusy ? 'Đang xác nhận...' : 'Xác nhận'}</Button>
                <Button variant="ghost" type="button" size="md" onClick={sendOtp} disabled={otpBusy}>Gửi lại mã</Button>
              </form>
            ) : (
              <Button variant="primary" size="lg" onClick={activate} disabled={busy} style={{ alignSelf: 'flex-start', minWidth: 220, font: 'var(--type-title-3)', padding: '16px 32px' }}>
                {busy ? 'Đang kích hoạt...' : 'Kích hoạt CTV'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
