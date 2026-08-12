import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Input, Select, Eyebrow } from '../components/index.jsx';
import { useFengShuiLookup, useSaveFengShuiHistory } from '../services/fengshuiService.js';
import { loadAuth } from '../lib/authStore.js';

const PURPOSES = ['Kinh doanh', 'Đi lại cá nhân', 'Sang tên/sưu tầm'];
const VEHICLES = ['Ô tô', 'Xe máy'];
const BUDGETS = ['Dưới 100 triệu', '100 – 500 triệu', '500 triệu – 1 tỷ', 'Trên 1 tỷ', 'Mọi ngân sách'];

export default function LuckyPlate({ go, notify }) {
  const [form, setForm] = useState({ name: '', birthDate: '', purpose: '', vehicle: '', budget: '' });
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const lookup = useFengShuiLookup();
  const saveHistory = useSaveFengShuiHistory();

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.birthDate) { setErr('Vui lòng nhập ngày sinh.'); return; }
    const d = new Date(form.birthDate);
    if (isNaN(d.getTime()) || d > new Date()) { setErr('Ngày sinh không hợp lệ hoặc ở tương lai.'); return; }
    setErr('');
    lookup.mutate(form.birthDate, { onError: () => notify('Không tra cứu được, thử lại sau.') });
  };

  const reset = () => { lookup.reset(); setForm((f) => ({ ...f, birthDate: '' })); };

  const result = lookup.data;

  useEffect(() => {
    if (!result) return;
    const auth = loadAuth();
    if (!auth?.accessToken) return;
    saveHistory.mutate({ birthDate: form.birthDate, element: result.element });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const viewLuckyPlates = () => {
    const digit = result?.luckyDigits?.[0];
    const base = '#/danh-sach';
    window.location.hash = digit !== undefined ? `${base}?q=${digit}` : base;
    go('list')();
  };

  const share = () => {
    const text = `Mệnh ${result.element} — con số may mắn: ${result.luckyDigits.join(', ')}. Tra cứu biển hợp mệnh tại Biensovip.com`;
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      notify('Đã sao chép kết quả');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('Không sao chép được');
    }
  };

  return (
    <section style={{ maxWidth: 820, margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-7)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Eyebrow tone="blue">Tư vấn theo ngũ hành</Eyebrow>
        <h1 style={{ margin: 0, font: 'var(--type-display-1)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Tìm biển số hợp mệnh của bạn</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Nhập ngày sinh để biết bản mệnh, con số may mắn và nhận gợi ý biển số phù hợp phong thủy.</p>
      </div>

      {!result ? (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.name} onChange={(e) => set('name')(e.target.value)} />
          <Input label="Ngày sinh" type="date" value={form.birthDate} error={err} onChange={(e) => set('birthDate')(e.target.value)} />
          <Select label="Mục đích sử dụng" value={form.purpose} options={PURPOSES} onChange={set('purpose')} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ flex: '1 1 200px' }}><Select label="Loại xe" value={form.vehicle} options={VEHICLES} onChange={set('vehicle')} /></div>
            <div style={{ flex: '1 1 240px' }}><Select label="Ngân sách" value={form.budget} options={BUDGETS} onChange={set('budget')} /></div>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={submit} disabled={lookup.isPending}>{lookup.isPending ? 'Đang tra cứu...' : 'Tra cứu mệnh của bạn'}</Button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'fadeIn 180ms var(--ease-out)' }}>
          <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Dành cho <b style={{ color: 'var(--text-strong)' }}>{form.name || 'bạn'}</b></span>
              <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Mệnh {result.element} — {result.elementLabel}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>← Tra cứu lại</Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Con số may mắn</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {result.luckyDigits.map((d) => (
                  <span key={d} style={{ width: 40, height: 40, borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-title-3)', fontWeight: 'var(--fw-semibold)' }}>{d}</span>
                ))}
              </div>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Nên chọn biển số chứa các số này</span>
            </div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Con số nên tránh</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {result.avoidDigits.map((d) => (
                  <span key={d} style={{ width: 40, height: 40, borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-title-3)', fontWeight: 'var(--fw-semibold)' }}>{d}</span>
                ))}
              </div>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Hạn chế biển số chứa các số này</span>
            </div>
          </div>

          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)', justifyContent: 'space-between' }}>
            <span style={{ font: 'var(--type-body)', color: 'var(--text-body)' }}>Xem kho biển số đẹp và lọc theo số may mắn của bạn.</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="outline" size="md" onClick={share}><Share2 size={16} style={{ marginRight: 6 }} />{copied ? 'Đã sao chép' : 'Chia sẻ'}</Button>
              <Button variant="primary" size="md" onClick={viewLuckyPlates}>Xem biển hợp mệnh →</Button>
            </div>
          </div>

          <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{result.disclaimer}</p>
        </div>
      )}
    </section>
  );
}
