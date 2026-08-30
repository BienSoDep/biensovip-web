import { useState } from 'react';
import Button from '../components/Button.jsx';
import { Input, Select, Eyebrow, Icon } from '../components/index.jsx';
import { updateProfile, changePassword, refreshToken } from '../services/authService.js';
import { useNotificationSettings, useUpdateNotificationSettings } from '../services/notificationService.js';
import { useBecomeCollaborator } from '../services/collaborators.js';

const CURRENT_YEAR = new Date().getFullYear();
const yearOpts = (() => { const a = []; for (let y = CURRENT_YEAR; y >= 1950; y--) a.push({ value: String(y), label: String(y) }); return a; })();
const monthOpts = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const dayOpts = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const GENDER_OPTS = [{ value: 'male', label: 'Nam' }, { value: 'female', label: 'Nữ' }, { value: 'other', label: 'Khác' }];
const pad = (n) => String(n).padStart(2, '0');

function splitBirthDate(iso) {
  if (!iso) return { day: '', month: '', year: '' };
  const [y, m, d] = iso.split('-');
  return { day: String(Number(d)), month: String(Number(m)), year: y };
}

function validBirthDate({ day, month, year }) {
  const d = Number(day), m = Number(month), y = Number(year);
  if (!d || !m || !y) return false;
  if (y < 1900 || y > CURRENT_YEAR) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export default function Profile({ go, notify, user, onboarding, onUserUpdate, onLogout }) {
  const bd = splitBirthDate(user?.birthDate);
  const [form, setForm] = useState({ fullName: user?.fullName || '', day: bd.day, month: bd.month, year: bd.year, gender: user?.gender || '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const hasBirthDate = form.day && form.month && form.year;

  const save = async () => {
    if (hasBirthDate && !validBirthDate(form)) { setErr('Ngày sinh không hợp lệ hoặc ở tương lai.'); return; }
    setErr('');
    setSaving(true);
    try {
      const updated = await updateProfile({
        fullName: form.fullName.trim() || undefined,
        birthDate: hasBirthDate ? `${form.year}-${pad(form.month)}-${pad(form.day)}` : undefined,
        gender: form.gender || undefined,
      });
      onUserUpdate?.(updated);
      notify('Đã lưu thông tin');
      if (onboarding) go('home')();
    } catch {
      notify('Không lưu được, thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  const skip = () => go('home')();

  const identifierLabel = user?.identifierType === 'phone' ? 'Số điện thoại' : 'Email';

  return (
    <section style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div
        style={
          onboarding
            ? { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--orange-50)', border: '1px solid var(--orange-100)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)' }
            : { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }
        }
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: onboarding ? 'var(--accent-orange-ink)' : 'var(--blue-600)' }}>
          {onboarding && <Icon name="sparkles" size={14} />}
          {onboarding ? 'Chào mừng bạn mới' : 'Tài khoản'}
        </span>
        <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>
          {onboarding ? 'Hoàn thiện hồ sơ của bạn' : 'Thông tin cá nhân'}
        </h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>
          {onboarding
            ? 'Điền đầy đủ họ tên, ngày sinh và giới tính để dùng ngay tính năng tìm biển số hợp mệnh, nhận gợi ý biển phù hợp và thông báo đúng nhu cầu của bạn. Bạn có thể bỏ qua và điền sau, nhưng trang này sẽ nhắc lại mỗi lần đăng nhập cho tới khi điền đủ.'
            : 'Cập nhật họ tên, ngày sinh và giới tính — dùng để tính hợp mệnh phong thủy và gợi ý biển số phù hợp hơn với bạn.'}
        </p>
      </div>

      <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{identifierLabel}</span>
          <div style={{ marginTop: 6, height: 40, display: 'flex', alignItems: 'center', padding: '0 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', font: 'var(--type-body)', color: 'var(--text-muted)' }}>{user?.identifier || '—'}</div>
        </div>
        <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} />

        <div>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ngày sinh (dương lịch)</span>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 6 }}>
            <div style={{ flex: 1 }}><Select label="Ngày" value={form.day} options={dayOpts} onChange={set('day')} /></div>
            <div style={{ flex: 1 }}><Select label="Tháng" value={form.month} options={monthOpts} onChange={set('month')} /></div>
            <div style={{ flex: 1.4 }}><Select label="Năm" value={form.year} options={yearOpts} onChange={set('year')} /></div>
          </div>
          {err && <span role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
        </div>

        <Select label="Giới tính (không bắt buộc)" value={form.gender} options={GENDER_OPTS} onChange={set('gender')} />

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button variant="primary" size="lg" onClick={save} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </Button>
          {onboarding && (
            <Button variant="ghost" size="lg" onClick={skip}>Bỏ qua</Button>
          )}
        </div>
      </div>

      {!onboarding && (
        <>
          <ChangePasswordSection notify={notify} />
          <NotificationSettingsSection notify={notify} />
          <BecomeCollaboratorSection go={go} notify={notify} user={user} onUserUpdate={onUserUpdate} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--grey-100)' }}>
            <Button variant="ghost" onClick={onLogout} fullWidth style={{ color: 'var(--status-danger)' }}>Đăng xuất</Button>
          </div>
        </>
      )}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Eyebrow tone="blue">Bảo mật</Eyebrow>
      <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Đổi mật khẩu</h3>
        <Input label="Mật khẩu hiện tại" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Input label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự, có cả chữ và số" value={next} onChange={(e) => setNext(e.target.value)} />
        {err && <span role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
        <Button variant="primary" size="lg" onClick={save} disabled={saving} style={{ alignSelf: 'flex-start' }}>{saving ? 'Đang lưu...' : 'Đổi mật khẩu'}</Button>
      </div>
    </div>
  );
}

const NOTIFY_HOUR_OPTS = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${pad(h)}:00` }));

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Eyebrow tone="blue">Thông báo</Eyebrow>
      <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={emailOn} onChange={toggleEmail} />
          <span style={{ font: 'var(--type-body)', color: 'var(--text-strong)' }}>Nhận thông báo qua email</span>
        </label>
        <div style={{ maxWidth: 220 }}>
          <Select label="Khung giờ nhận email tổng hợp" value={hour} options={NOTIFY_HOUR_OPTS} onChange={changeHour} />
        </div>
      </div>
    </div>
  );
}

// CTV gộp vào User — user đăng nhập tự-activate từ profile. Sau kích hoạt refresh token để
// JWT có claim `collaborator` (policy CollaboratorOnly đọc claim, không đọc DB), rồi đẩy user mới lên App.
function BecomeCollaboratorSection({ go, notify, user, onUserUpdate }) {
  const become = useBecomeCollaborator();
  const [bankAccount, setBankAccount] = useState('');
  const [busy, setBusy] = useState(false);
  const needsEmailVerify = user?.identifierType === 'email' && !user?.emailVerified;

  const isCtv = Boolean(user?.isCollaborator);

  const activate = async () => {
    if (!bankAccount.trim()) { notify('Nhập số tài khoản nhận hoa hồng trước khi kích hoạt.'); return; }
    setBusy(true);
    try {
      await become.mutateAsync(bankAccount.trim());
      const data = await refreshToken();
      if (data?.user) onUserUpdate?.(data.user);
      notify('Bạn đã trở thành Cộng tác viên');
    } catch (e) {
      const code = e?.code;
      if (code === 'EMAIL_NOT_VERIFIED') notify('Xác thực email trước khi trở thành CTV.');
      else notify(e?.message || 'Kích hoạt thất bại, thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Eyebrow tone="blue">Cộng tác viên</Eyebrow>
      <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {isCtv ? (
          <>
            <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Bạn đang là Cộng tác viên</h3>
            {user?.ctvReferralCode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ font: 'var(--type-body)', color: 'var(--text-muted)' }}>Mã giới thiệu:</span>
                <span style={{ font: 'var(--type-title-3)', fontWeight: 700, color: 'var(--text-strong)', background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-pill)', padding: '6px 14px' }}>{user.ctvReferralCode}</span>
              </div>
            )}
          </>
        ) : needsEmailVerify ? (
          <>
            <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Trở thành Cộng tác viên</h3>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              Xác thực email trước khi kích hoạt tài khoản Cộng tác viên (để nhận thông báo hoa hồng).
            </p>
            <Button variant="primary" size="md" style={{ alignSelf: 'flex-start' }} onClick={() => go('verify-email')()}>Xác thực email</Button>
          </>
        ) : (
          <>
            <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Trở thành Cộng tác viên</h3>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              Giới thiệu khách mua biển số đẹp, nhận hoa hồng trên mỗi giao dịch thành công. Kích hoạt ngay từ tài khoản này — không cần đăng ký riêng.
            </p>
            <Input
              label="Số tài khoản nhận hoa hồng"
              placeholder="Số tài khoản ngân hàng"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
            />
            <Button variant="primary" size="lg" onClick={activate} disabled={busy} style={{ alignSelf: 'flex-start' }}>
              {busy ? 'Đang kích hoạt...' : 'Kích hoạt CTV'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
