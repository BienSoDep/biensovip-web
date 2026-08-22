import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import { Input, Select, Eyebrow, Badge, Icon, InfoTip } from '../components/index.jsx';
import { useFengShuiLookup, useSaveFengShuiHistory, useFengShuiHistory } from '../services/fengshuiService.js';
import { ELEMENTS, PURPOSES, VEHICLES, BUDGETS, scoreColor } from '../lib/fengshui.js';
import { loadAuth } from '../lib/authStore.js';

const CURRENT_YEAR = new Date().getFullYear();
const yearOpts = (() => { const a = []; for (let y = CURRENT_YEAR; y >= 1950; y--) a.push({ value: String(y), label: String(y) }); return a; })();
const monthOpts = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const dayOpts = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const toOpts = (arr) => arr.map((o) => ({ value: o.label, label: o.label }));

function validBirthDate({ day, month, year }) {
  const d = Number(day), m = Number(month), y = Number(year);
  if (!d || !m || !y) return false;
  if (y < 1900 || y > CURRENT_YEAR) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

const pad = (n) => String(n).padStart(2, '0');
const EL_DISP = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
const elName = (k) => EL_DISP[k] || k;

function splitBirthDate(iso) {
  if (!iso) return { day: '', month: '', year: '' };
  const [y, m, d] = iso.split('-');
  return { day: String(Number(d)), month: String(Number(m)), year: y };
}

export default function LuckyPlate({ go, notify, onNotice, user }) {
  const bd = splitBirthDate(user?.birthDate);
  const [form, setForm] = useState({ name: user?.fullName || '', day: bd.day, month: bd.month, year: bd.year, purpose: 'Kinh doanh', vehicle: 'Ô tô', budget: 'Mọi ngân sách' });
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const lookup = useFengShuiLookup();
  const saveHistory = useSaveFengShuiHistory();
  const isAuthed = !!loadAuth()?.accessToken;
  const history = useFengShuiHistory(isAuthed);
  const hasProfileBirthDate = !!user?.birthDate;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!validBirthDate(form)) { setErr('Ngày sinh không hợp lệ hoặc ở tương lai.'); return; }
    setErr('');
    const budgetCap = BUDGETS.find((b) => b.label === form.budget)?.cap ?? null;
    lookup.mutate({
      birthDate: `${form.year}-${pad(form.month)}-${pad(form.day)}`,
      purpose: PURPOSES.find((p) => p.label === form.purpose)?.key || 'ca_nhan',
      budget: budgetCap,
      vehicle: form.vehicle,
    }, { onError: () => notify('Không tra cứu được, thử lại sau.') });
  };

  const reset = () => { lookup.reset(); setForm((f) => ({ ...f, day: '', month: '', year: '' })); };

  const result = lookup.data;

  // Có ngày sinh trong hồ sơ (đăng nhập + đã điền Profile) → tra cứu luôn, khỏi bắt nhập lại.
  useEffect(() => {
    if (hasProfileBirthDate && !result && !lookup.isPending) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProfileBirthDate]);

  useEffect(() => {
    if (result && isAuthed && form.year) {
      saveHistory.mutate({ birthDate: `${form.year}-${pad(form.month)}-${pad(form.day)}` });
      history.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const el = result ? ELEMENTS[result.element] : null;

  const shareUrl = useMemo(
    () => (result && form.year ? `${location.origin}${location.pathname}#/hop-menh?y=${form.year}` : ''),
    [result, form.year],
  );

  const shareLink = () => {
    try { navigator.clipboard.writeText(shareUrl); setCopied(true); notify('Đã sao chép liên kết'); setTimeout(() => setCopied(false), 2000); }
    catch { notify('Không sao chép được'); }
  };

  const shareFb = () => {
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl), '_blank', 'noopener');
  };

  const viewLuckyPlates = () => {
    const digit = result?.luckyDigits?.[0];
    const base = '#/danh-sach';
    window.location.hash = digit !== undefined ? `${base}?q=${digit}` : base;
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
              Mẹo: <a href="#" onClick={(e) => { e.preventDefault(); go('profile')(); }}>lưu ngày sinh vào hồ sơ</a> để lần sau vào đây là có kết quả ngay.
            </p>
          )}
          <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.name} onChange={(e) => set('name')(e.target.value)} />

          <div>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ngày sinh (dương lịch)</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 6 }}>
              <div style={{ flex: 1 }}><Select label="Ngày" value={form.day} options={dayOpts} onChange={set('day')} /></div>
              <div style={{ flex: 1 }}><Select label="Tháng" value={form.month} options={monthOpts} onChange={set('month')} /></div>
              <div style={{ flex: 1.4 }}><Select label="Năm" value={form.year} options={yearOpts} onChange={set('year')} /></div>
            </div>
            {err && <span role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
            <p style={{ margin: '6px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tính theo dương lịch. Nếu chỉ nhớ ngày âm lịch, hãy quy đổi trước khi nhập.</p>
          </div>

          <Select label="Mục đích sử dụng" value={form.purpose} options={toOpts(PURPOSES)} onChange={set('purpose')} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ flex: '1 1 180px' }}><Select label="Loại xe" value={form.vehicle} options={toOpts(VEHICLES)} onChange={set('vehicle')} /></div>
            <div style={{ flex: '1 1 220px' }}><Select label="Ngân sách" value={form.budget} options={toOpts(BUDGETS)} onChange={set('budget')} /></div>
          </div>

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
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 2 }}>
                    <Button variant="dark" size="sm" onClick={() => { window.location.hash = '#/bien/' + r.plateId; go('detail')(); }}>Xem biển</Button>
                    <Button variant="primary" size="sm" onClick={() => notify('Liên hệ Duy Đinh để giữ chỗ')}>Gọi ngay</Button>
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
                  <Badge tone="blue">Mệnh {elName(h.element)}</Badge>
                  <span style={{ flex: 1 }}>{h.birthDate}</span>
                  <Button variant="ghost" size="sm" onClick={() => { setForm((f) => ({ ...f, year: String(h.birthDate).slice(0, 4) })); }}>Xem lại</Button>
                </div>
              ))}
            </div>
          )}

          <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{result.disclaimer}</p>
        </div>
      )}
    </section>
  );
}
