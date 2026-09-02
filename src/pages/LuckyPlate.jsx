import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import Button from '../components/Button.jsx';
import BulletPicker from '../components/BulletPicker.jsx';
import { Input, Eyebrow, Badge, Icon, InfoTip, DateInputVN } from '../components/index.jsx';
import { useFengShuiLookup, useSaveFengShuiHistory, useFengShuiHistory } from '../services/fengshuiService.js';
import { useSubmitContact } from '../services/contactService.js';
import { updateProfile } from '../services/authService.js';
import { ELEMENTS, PURPOSES, INDUSTRIES, VEHICLES, BUDGET_STEPS, formatBudget, scoreColor, elementAsciiLabel } from '../lib/fengshui.js';
import { loadAuth } from '../lib/authStore.js';
import { validatePhone, normalizePhone } from '../lib/phone.js';
import { validBirthDate } from '../lib/date.js';

function VehiclePicker({ value, onChange }) {
  return <BulletPicker label="Loại xe" value={value} onChange={onChange} options={VEHICLES} />;
}

function PurposePicker({ value, onChange }) {
  return <BulletPicker label="Mục đích sử dụng" value={value} onChange={onChange} options={PURPOSES.map((p) => p.label)} />;
}

function IndustryPicker({ value, onChange }) {
  return <BulletPicker label="Ngành kinh doanh" value={value} onChange={onChange} options={INDUSTRIES.map((i) => i.label)} />;
}

// Nút "Yêu cầu tư vấn" tại card gợi ý hợp mệnh — guest chỉ cần SĐT gửi thẳng (không bắt đăng nhập,
// mục tiêu tăng lượng contact); user đã đăng nhập nhưng thiếu SĐT (đăng ký bằng email) thì lưu SĐT
// vào profile trước rồi mới gửi, để lần sau không phải hỏi lại.
function RequestConsultButton({ plate, user, notify, onUserUpdate }) {
  const submitContact = useSubmitContact();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const send = (phoneToUse, fullName) => {
    submitContact.mutate({
      fullName: fullName || 'Khách hàng', phone: normalizePhone(phoneToUse),
      plateId: plate.plateId, plateNumber: plate.plateNumber,
      note: '', source: 'lucky_plate', intent: 'inquiry',
      depositAmount: null, subscribeToNotifications: false, honeypot: null,
    }, {
      onSuccess: () => { notify('Đã gửi yêu cầu tư vấn — admin sẽ liên hệ sớm.'); setSent(true); setOpen(false); },
      onError: () => notify('Gửi thất bại, vui lòng thử lại.'),
    });
  };

  const submitPhone = async () => {
    if (!validatePhone(phone)) { notify('Số điện thoại không hợp lệ.'); return; }
    setBusy(true);
    try {
      if (user) {
        const updated = await updateProfile({ phone });
        onUserUpdate?.(updated);
        send(phone, user.fullName);
      } else {
        send(phone, '');
      }
    } catch (e) {
      notify(e?.message || 'Có lỗi xảy ra, thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  const click = () => {
    if (sent) return;
    if (user?.phone) { send(user.phone, user.fullName); return; }
    setOpen(true);
  };

  if (sent) return <Button variant="ghost" size="sm" disabled>Đã gửi yêu cầu</Button>;

  return open ? (
    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ width: 180 }}><Input placeholder="Số điện thoại của bạn" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <Button variant="primary" size="sm" onClick={submitPhone} disabled={busy}>{busy ? 'Đang gửi...' : 'Gửi'}</Button>
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Hủy</Button>
    </div>
  ) : (
    <Button variant="outline" size="sm" onClick={click}>Yêu cầu tư vấn</Button>
  );
}

export default function LuckyPlate({ go, notify, onNotice, user, contact, openPlate, onUserUpdate }) {
  const [form, setForm] = useState({
    name: user?.fullName || '',
    birthDate: user?.birthDate || '',
    purpose: PURPOSES.find((p) => p.key === user?.preferredPurpose)?.label || 'Kinh doanh',
    industry: INDUSTRIES[0].label,
    vehicle: user?.preferredVehicle || 'Ô tô',
    budgetStep: BUDGET_STEPS.length - 1,
  });
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const shareCardRef = useRef(null);
  const lookup = useFengShuiLookup();
  const saveHistory = useSaveFengShuiHistory();
  const isAuthed = !!loadAuth()?.accessToken;
  const history = useFengShuiHistory(isAuthed);
  const hasProfileBirthDate = !!user?.birthDate;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!validBirthDate(form.birthDate)) { setErr('Ngày sinh không hợp lệ hoặc ở tương lai.'); return; }
    setErr('');
    const purposeKey = PURPOSES.find((p) => p.label === form.purpose)?.key || 'ca_nhan';
    lookup.mutate({
      birthDate: form.birthDate,
      purpose: purposeKey,
      budget: BUDGET_STEPS[form.budgetStep] ?? null,
      vehicle: form.vehicle,
      industry: purposeKey === 'kinh_doanh' ? (INDUSTRIES.find((i) => i.label === form.industry)?.key || null) : null,
    }, { onError: () => notify('Không tra cứu được, thử lại sau.') });
  };

  const reset = () => { lookup.reset(); setForm((f) => ({ ...f, birthDate: '' })); };

  const result = lookup.data;

  // Deep-link `/hop-menh?y={year}&t={name}` → tự điền + tra cứu khi mở link chia sẻ.
  useEffect(() => {
    const q = window.location.search.slice(1);
    if (!q) return;
    const params = new URLSearchParams(q);
    const y = params.get('y');
    if (!y) return;
    setForm((f) => ({ ...f, birthDate: `${y}-01-01`, name: params.get('t') ? decodeURIComponent(params.get('t')) : f.name }));
    lookup.mutate({ birthDate: `${y}-01-01`, purpose: 'ca_nhan', budget: null, vehicle: 'Ô tô' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (result && isAuthed && form.birthDate) {
      saveHistory.mutate({ birthDate: form.birthDate });
      history.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const el = result ? ELEMENTS[result.element] || { icon: 'sparkles', color: 'var(--action-primary)', desc: '' } : null;

  const shareYear = form.birthDate ? form.birthDate.split('-')[0] : '';
  const shareUrl = useMemo(
    () => (result && shareYear ? `${location.origin}${location.pathname}#/hop-menh?y=${shareYear}` : ''),
    [result, shareYear],
  );

  const shareLink = () => {
    try { navigator.clipboard.writeText(shareUrl); setCopied(true); notify('Đã sao chép liên kết'); setTimeout(() => setCopied(false), 2000); }
    catch { notify('Không sao chép được'); }
  };

  const shareFb = () => {
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl), '_blank', 'noopener');
  };

  const downloadPng = async () => {
    if (!shareCardRef.current) { notify('Không tải ảnh được — đã sao chép liên kết'); shareLink(); return; }
    try {
      const canvas = await html2canvas(shareCardRef.current, { scale: 2, backgroundColor: null });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'ket-qua-hop-menh.png';
      a.click();
    } catch { notify('Không tải ảnh được — đã sao chép liên kết'); shareLink(); }
  };

  const viewLuckyPlates = () => {
    const digit = result?.luckyDigits?.[0];
    onNotice?.({ text: `Bộ lọc hợp mệnh ${result?.element}: biển chứa số ${result?.luckyDigits?.join(', ')}`, q: digit });
    go('list')();
  };

  return (
    <section style={{ maxWidth: 860, margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-7)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Eyebrow tone="blue">Tư vấn theo ngũ hành</Eyebrow>
        <h1 style={{ margin: 0, font: 'var(--type-display-1)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Tìm biển số hợp mệnh của bạn</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Nhập ngày sinh để biết bản mệnh, con số may mắn và nhận gợi ý biển số phù hợp phong thủy, đúng ngân sách.</p>
      </div>

      {!result ? (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {isAuthed && !hasProfileBirthDate && (
            <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Mẹo: <button type="button" onClick={() => go('profile')()} style={{ border: 'none', background: 'none', padding: 0, font: 'inherit', color: 'var(--action-primary)', textDecoration: 'underline', cursor: 'pointer' }}>lưu ngày sinh vào hồ sơ</button> để lần sau vào đây là có kết quả ngay.
            </p>
          )}
          <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.name} onChange={(e) => set('name')(e.target.value)} />

          <DateInputVN label="Ngày sinh (dương lịch)" value={form.birthDate} error={err} hint="Tính theo dương lịch. Nếu chỉ nhớ ngày âm lịch, hãy quy đổi trước khi nhập." onChange={(e) => set('birthDate')(e.target.value)} />

          <PurposePicker value={form.purpose} onChange={set('purpose')} />
          {form.purpose === 'Kinh doanh' && <IndustryPicker value={form.industry} onChange={set('industry')} />}
          <VehiclePicker value={form.vehicle} onChange={set('vehicle')} />

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Ngân sách</span>
              <span style={{ color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>
                {form.budgetStep === 0 ? `Dưới ${formatBudget(BUDGET_STEPS[0])}` : `Tối đa ${formatBudget(BUDGET_STEPS[form.budgetStep])}`}
              </span>
            </span>
            <input
              type="range" min={0} max={BUDGET_STEPS.length - 1} step={1} value={form.budgetStep}
              onChange={(e) => set('budgetStep')(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--action-primary)' }}
            />
          </label>

          <Button variant="primary" size="lg" fullWidth onClick={submit} disabled={lookup.isPending}>{lookup.isPending ? 'Đang tra cứu...' : 'Tra cứu mệnh của bạn'}</Button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'fadeIn 180ms var(--ease-out)' }}>
          {/* Khối kết quả mệnh */}
          <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
              <span style={{ width: 56, height: 56, borderRadius: '50%', background: `${el.color}26`, color: el.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={el.icon} size={26} />
              </span>
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Dành cho <b style={{ color: 'var(--text-strong)' }}>{form.name || 'bạn'}</b></span>
                <span style={{ font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Mệnh {result.element}<InfoTip size={13} text="Ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ) suy từ ngày sinh. Mỗi mệnh hợp với vài con số riêng — người xưa chọn biển xe theo đó để 'hợp mệnh', cầu may mắn, thuận lợi." /></span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{result.elementLabel} · sinh {form.year}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>← Sửa thông tin</Button>
            </div>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{el.desc}</p>
          </div>

          {/* Số hợp / tránh */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Con số hợp mệnh {result.element}<InfoTip size={12} text="Con số tương sinh với mệnh của bạn. Chọn biển có các số này sẽ được xem là hợp phong thủy." /></span>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {result.luckyDigits.map((d) => <Badge key={d} tone="mint" style={{ width: 40, height: 40, fontSize: 'var(--type-title-3)', justifyContent: 'center' }}>{d}</Badge>)}
              </div>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Nên chọn biển số chứa các số này</span>
            </div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Con số nên tránh</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {result.avoidDigits.map((d) => <Badge key={d} tone="rose" style={{ width: 40, height: 40, fontSize: 'var(--type-title-3)', justifyContent: 'center' }}>{d}</Badge>)}
              </div>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Khắc mệnh — nên tránh đứng cuối</span>
            </div>
          </div>

          {/* Chia sẻ */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <Button variant="outline" size="md" onClick={shareLink}><Icon name="copy" size={16} style={{ marginRight: 6 }} />{copied ? 'Đã sao chép' : 'Sao chép liên kết'}</Button>
            <Button variant="outline" size="md" onClick={shareFb}><Icon name="share" size={16} style={{ marginRight: 6 }} />Chia sẻ Facebook</Button>
            <Button variant="outline" size="md" onClick={downloadPng}><Icon name="download" size={16} style={{ marginRight: 6 }} />Tải ảnh PNG</Button>
          </div>

          {/* Top biển ranked */}
          {result.ranked?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Top biển hợp mệnh bạn</h2>
              {result.ranked.map((r, i) => (
                <div key={r.plateId} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)' }}>#{i + 1}</span>
                    <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', flex: 1 }}>{r.plateNumber}</span>
                    <span style={{ font: 'var(--type-body)', color: 'var(--text-strong)' }}>{Number(r.price).toLocaleString('vi-VN')}đ</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 150 }}>
                      <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{r.score}% hợp mệnh</span>
                      <div style={{ width: 140, height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)', overflow: 'hidden' }}>
                        <div style={{ width: `${r.score}%`, height: '100%', background: scoreColor(r.score), borderRadius: 'var(--radius-pill)' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {r.explain.map((x, j) => <Badge key={j} tone="neutral">{x}</Badge>)}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 2, flexWrap: 'wrap' }}>
                    <Button variant="dark" size="sm" onClick={() => openPlate(r.plateId)}>Xem biển</Button>
                    <a href={`tel:${contact?.phone || '0815792699'}`} style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="sm">Gọi ngay</Button>
                    </a>
                    {contact?.zalo && (
                      <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Button variant="outline" size="sm">Nhắn Zalo</Button>
                      </a>
                    )}
                    <RequestConsultButton plate={r} user={user} notify={notify} onUserUpdate={onUserUpdate} />
                  </div>
                </div>
              ))}
              <Button variant="dark" size="lg" fullWidth onClick={viewLuckyPlates}>Xem biển số hợp mệnh →</Button>
            </div>
          )}

          {/* Lịch sử */}
          {isAuthed && history.data?.length > 0 && (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Lịch sử tra cứu</span>
              {history.data.map((h) => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                  <Badge tone="blue">Mệnh {elementAsciiLabel(h.element)}</Badge>
                  <span style={{ flex: 1 }}>{h.birthDate}</span>
                  <Button variant="ghost" size="sm" onClick={() => { setForm((f) => ({ ...f, birthDate: h.birthDate })); }}>Xem lại</Button>
                </div>
              ))}
            </div>
          )}

          <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{result.disclaimer}</p>

          {/* Card ẩn 1080×720 để html2canvas capture → PNG share. ponytail: render 1 bản cố định,
              không scale card hiển thị (responsive). */}
          <div ref={shareCardRef} style={{ position: 'fixed', left: -9999, top: 0, width: 1080, height: 720, background: 'var(--surface-tint-cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, fontFamily: 'system-ui, sans-serif', color: '#1F2933' }}>
            <div style={{ fontSize: 48, fontWeight: 800 }}>Biển số hợp mệnh của tôi</div>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: `${el.color}26`, color: el.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={el.icon} size={44} /></div>
            <div style={{ fontSize: 40, fontWeight: 700 }}>Mệnh {result.element} · {elementAsciiLabel(result.element)}</div>
            {form.name && <div style={{ fontSize: 28, color: '#5A6774' }}>{form.name} · sinh {form.year}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              {result.luckyDigits.map((d) => <span key={d} style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: '#E6F6EE', color: '#0B7A43', fontSize: 32, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</span>)}
            </div>
            <div style={{ fontSize: 24, color: '#5A6774' }}>Con số hợp mệnh · Biensovip.com</div>
          </div>
        </div>
      )}
    </section>
  );
}
