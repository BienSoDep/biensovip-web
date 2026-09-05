import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import BulletPicker from '../components/BulletPicker.jsx';
import { Input, Select, Eyebrow, Icon, DateInputVN } from '../components/index.jsx';
import { updateProfile, changePassword, refreshToken, requestEmailVerifyOtp, confirmEmailVerifyOtp } from '../services/authService.js';
import { useNotificationSettings, useUpdateNotificationSettings } from '../services/notificationService.js';
import { useBecomeCollaborator, useUpdateBankInfo } from '../services/collaborators.js';
import { PURPOSES, VEHICLES } from '../lib/fengshui.js';
import { validBirthDate } from '../lib/date.js';
import { fetchVietQrBanks, vietQrImageUrl } from '../lib/vietqr.js';
import { trackCompleteProfile, trackSkipProfileOnboarding, trackBecomeCollaborator } from '../services/tracking/events.js';

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

export default function Profile({ go, notify, user, onboarding, onUserUpdate, onLogout }) {
  // Đến từ "Trở thành CTV" (trang Collaborator) qua hash #become-ctv → cuộn thẳng tới section CTV
  // thay vì bắt user tự cuộn qua Thông tin/Đổi mật khẩu/Thông báo ở trên.
  useEffect(() => {
    if (window.location.hash === '#become-ctv') {
      document.getElementById('become-ctv')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const purposeLabelFromKey = (key) => PURPOSES.find((p) => p.key === key)?.label || '';
  const [form, setForm] = useState({
    fullName: user?.fullName || '', birthDate: user?.birthDate || '', gender: user?.gender || '',
    preferredVehicle: user?.preferredVehicle || '', preferredPurpose: purposeLabelFromKey(user?.preferredPurpose),
  });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (form.birthDate && !validBirthDate(form.birthDate)) { setErr('Ngày sinh không hợp lệ hoặc ở tương lai.'); return; }
    setErr('');
    setSaving(true);
    try {
      const updated = await updateProfile({
        fullName: form.fullName.trim() || undefined,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        preferredVehicle: form.preferredVehicle || undefined,
        preferredPurpose: PURPOSES.find((p) => p.label === form.preferredPurpose)?.key || undefined,
      });
      onUserUpdate?.(updated);
      if (onboarding) trackCompleteProfile(!!form.birthDate);
      notify('Đã lưu thông tin');
      if (onboarding) go('home')();
    } catch (err) {
      notify(err.message || 'Không lưu được, thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  const skip = () => { trackSkipProfileOnboarding(); go('home')(); };

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

        <DateInputVN label="Ngày sinh (dương lịch)" value={form.birthDate} error={err} onChange={(e) => set('birthDate')(e.target.value)} />

        <GenderPicker value={form.gender} onChange={set('gender')} />

        <BulletPicker label="Loại xe thường dùng" value={form.preferredVehicle} onChange={set('preferredVehicle')} options={VEHICLES} allowDeselect labelSuffix=" (không bắt buộc)" />
        <BulletPicker label="Mục đích sử dụng biển thường xuyên" value={form.preferredPurpose} onChange={set('preferredPurpose')} options={PURPOSES.map((p) => p.label)} allowDeselect labelSuffix=" (không bắt buộc)" />

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
  const needsEmailVerify = user?.identifierType === 'email' && !user?.verified;

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
      notify('Xác thực email thành công.');
      setOtpSent(false);
      setOtpCode('');
    } catch (e) {
      notify(e?.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
    } finally {
      setOtpBusy(false);
    }
  };

  const isCtv = Boolean(user?.isCollaborator);

  const activate = async () => {
    if (!bankAccount.trim()) { notify('Nhập số tài khoản nhận hoa hồng trước khi kích hoạt.'); return; }
    if (!bankCode) { notify('Chọn ngân hàng trước khi kích hoạt.'); return; }
    setBusy(true);
    try {
      await become.mutateAsync({ bankAccount: bankAccount.trim(), bankCode, bankAccountHolder: bankAccountHolder.trim() || undefined });
      trackBecomeCollaborator();
      const data = await refreshToken();
      if (data?.user) onUserUpdate?.(data.user);
      notify('Bạn đã trở thành Cộng tác viên');
      go('collab')();
    } catch (e) {
      const code = e?.code;
      if (code === 'EMAIL_NOT_VERIFIED') notify('Xác thực email trước khi trở thành CTV.');
      else notify(e?.message || 'Kích hoạt thất bại, thử lại sau.');
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <Select label="Ngân hàng" value={bankCode} options={banks} onChange={setBankCode} />
                <Input label="Số tài khoản" placeholder="Số tài khoản ngân hàng" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
                <Input label="Tên chủ tài khoản (không bắt buộc)" placeholder="NGUYEN VAN A" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} />
                {qrPreviewUrl && (
                  <img src={qrPreviewUrl} alt="QR chuyển khoản" style={{ width: 160, height: 160, borderRadius: 'var(--radius-field)', alignSelf: 'flex-start' }} />
                )}
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button variant="primary" size="md" onClick={saveBankInfo} disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu'}</Button>
                  <Button variant="ghost" size="md" onClick={() => setEditingBank(false)} disabled={busy}>Hủy</Button>
                </div>
              </div>
            )}
          </>
        ) : needsEmailVerify ? (
          <>
            <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Trở thành Cộng tác viên</h3>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              Xác thực email trước khi kích hoạt tài khoản Cộng tác viên (để nhận thông báo hoa hồng).
            </p>
            {!otpSent ? (
              <Button variant="primary" size="md" style={{ alignSelf: 'flex-start' }} onClick={sendOtp} disabled={otpBusy}>
                {otpBusy ? 'Đang gửi...' : 'Gửi mã xác thực'}
              </Button>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Input label="Mã xác thực (6 số)" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                <Button variant="primary" size="md" onClick={confirmOtp} disabled={otpBusy}>{otpBusy ? 'Đang xác nhận...' : 'Xác nhận'}</Button>
                <Button variant="ghost" size="md" onClick={sendOtp} disabled={otpBusy}>Gửi lại mã</Button>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Trở thành Cộng tác viên</h3>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              Giới thiệu khách mua biển số đẹp, nhận hoa hồng trên mỗi giao dịch thành công. Kích hoạt ngay từ tài khoản này — không cần đăng ký riêng.
            </p>
            <Select label="Ngân hàng" value={bankCode} options={banks} onChange={setBankCode} />
            <Input
              label="Số tài khoản nhận hoa hồng"
              placeholder="Số tài khoản ngân hàng"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
            />
            <Input
              label="Tên chủ tài khoản (không bắt buộc)"
              placeholder="NGUYEN VAN A"
              value={bankAccountHolder}
              onChange={(e) => setBankAccountHolder(e.target.value)}
            />
            {qrPreviewUrl && (
              <img src={qrPreviewUrl} alt="QR chuyển khoản" style={{ width: 160, height: 160, borderRadius: 'var(--radius-field)', alignSelf: 'flex-start' }} />
            )}
            <Button variant="primary" size="lg" onClick={activate} disabled={busy} style={{ alignSelf: 'flex-start' }}>
              {busy ? 'Đang kích hoạt...' : 'Kích hoạt CTV'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
