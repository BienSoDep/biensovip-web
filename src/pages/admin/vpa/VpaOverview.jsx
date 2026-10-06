import { useState } from 'react';
import { Badge, Input, Switch } from '../../../components/index.jsx';
import Button from '../../../components/Button.jsx';
import { useVpaOverview, useVpaRuns, useUpdateVpaSettings, useRunVpaCrawl } from '../../../services/adminVpa.js';
import { VPA_SOURCES, VPA_RUN_STATUS, formatDateTime, isCar } from '../../../lib/vpaFormat.js';

const CARD = { background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' };
const STATUS_TONE = { success: 'mint', partial: 'amber', failed: 'rose' };
function SwitchRow({ checked, onChange, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
      <Switch checked={checked} onChange={onChange} label={label} />{label}
    </span>
  );
}

const RUN_COLS = '150px 90px 110px 120px 110px 110px 1fr';

// Tổng quan đồng bộ VPA: lịch + bật/tắt từng nguồn, "Crawl ngay", tham số công thức giá, các lần chạy gần nhất. Chỉ super-admin.
export default function VpaOverview({ notify, isSuperAdmin }) {
  const { data, isLoading, isError, error } = useVpaOverview({ enabled: isSuperAdmin, poll: true });
  const { data: runs } = useVpaRuns(30, isSuperAdmin);

  if (!isSuperAdmin) return <div style={CARD}><span style={{ color: 'var(--text-muted)' }}>Cài đặt đồng bộ và "Crawl ngay" chỉ dành cho quản trị viên (super-admin). Bạn vẫn duyệt giá ở tab "Duyệt giá".</span></div>;
  if (isLoading) return <div style={{ ...CARD, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError || !data) return <div style={{ ...CARD, color: 'var(--status-danger)' }}>{error?.message || 'Không tải được cấu hình đồng bộ VPA.'}</div>;
  return <OverviewBody data={data} runs={runs} notify={notify} />;
}

// Form khởi tạo từ cài đặt đã tải một lần; polling chỉ làm mới trạng thái chạy, không ghi đè ô đang sửa.
function OverviewBody({ data, runs, notify }) {
  const save = useUpdateVpaSettings();
  const crawl = useRunVpaCrawl();
  const [form, setForm] = useState(() => ({ ...data.settings }));

  const running = new Set(data.running || []);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e && e.target ? e.target.value : e }));
  const num = (v) => (v === '' || v == null ? '' : Number(v));

  const onSave = async () => {
    try {
      await save.mutateAsync({
        officialEnabled: !!form.officialEnabled, officialIntervalMinutes: num(form.officialIntervalMinutes),
        publishedEnabled: !!form.publishedEnabled, publishedIntervalMinutes: num(form.publishedIntervalMinutes),
        resultsEnabled: !!form.resultsEnabled, resultsIntervalMinutes: num(form.resultsIntervalMinutes),
        windowMonths: num(form.windowMonths), minSamples: num(form.minSamples), factor: num(form.factor),
        includeFloorPrice: !!form.includeFloorPrice, driftPercent: num(form.driftPercent), roundStep: num(form.roundStep),
      });
      notify?.('Đã lưu cấu hình (đổi tham số giá sẽ tính lại toàn bộ nhóm)');
    } catch (e) { notify?.(e.message || 'Lưu thất bại'); }
  };
  const onCrawl = async (s) => {
    try { await crawl.mutateAsync(s.key); notify?.(`Đã bắt đầu crawl: ${s.label}`); } catch (e) { notify?.(e.message || 'Không bắt đầu được'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 'var(--space-3)' }}>
        {VPA_SOURCES.map((s) => {
          const last = data.settings[`${s.prefix}LastStatus`];
          const enabled = form[`${s.prefix}Enabled`];
          return (
            <div key={s.key} style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{s.label}</span>
                {running.has(s.id) ? <Badge tone="blue">Đang chạy</Badge> : last ? <Badge tone={STATUS_TONE[last] || 'neutral'}>{last}</Badge> : <Badge tone="neutral">Chưa chạy</Badge>}
              </div>
              <SwitchRow checked={enabled} onChange={(v) => setForm((f) => ({ ...f, [`${s.prefix}Enabled`]: v }))} label={enabled ? 'Đang bật' : 'Đang tắt'} />
              <Input label="Chu kỳ (phút)" type="number" min="1" value={form[`${s.prefix}IntervalMinutes`]} onChange={set(`${s.prefix}IntervalMinutes`)} />
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Lần chạy gần nhất: {formatDateTime(data.settings[`${s.prefix}LastRunAt`])}</span>
              <Button variant="outline" size="sm" loading={crawl.isPending} disabled={running.has(s.id)} onClick={() => onCrawl(s)}>Crawl ngay</Button>
            </div>
          );
        })}
      </div>

      <div style={CARD}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Công thức giá gợi ý</span>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giá gợi ý = trung bình giá trúng của nhóm (tỉnh + loại xe + loại biển + chữ ký) × hệ số, làm tròn theo bước. Đổi tham số sẽ tính lại toàn bộ nhóm.</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 'var(--space-3)' }}>
          <Input label="Cửa sổ (tháng)" type="number" min="1" value={form.windowMonths} onChange={set('windowMonths')} />
          <Input label="Số mẫu tối thiểu" type="number" min="1" value={form.minSamples} onChange={set('minSamples')} />
          <Input label="Hệ số" type="number" min="0" value={form.factor} onChange={set('factor')} />
          <Input label="Lệch xu hướng (%)" type="number" min="0" value={form.driftPercent} onChange={set('driftPercent')} />
          <Input label="Bước làm tròn (đ)" type="number" min="1" value={form.roundStep} onChange={set('roundStep')} />
        </div>
        <SwitchRow checked={form.includeFloorPrice} onChange={(v) => setForm((f) => ({ ...f, includeFloorPrice: v }))} label="Tính cả kết quả chạm giá sàn" />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" size="md" loading={save.isPending} onClick={onSave}>Lưu cấu hình</Button>
        </div>
      </div>

      <div style={{ ...CARD, padding: 0, overflowX: 'auto' }}>
        <div style={{ minWidth: 720 }}>
          <div style={{ display: 'grid', gridTemplateColumns: RUN_COLS, gap: 8, padding: '10px 16px', font: 'var(--type-label)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-hairline)' }}>
            <span>Bắt đầu</span><span>Nguồn</span><span>Loại xe</span><span>Trạng thái</span><span>Đã thấy / Dự kiến</span><span>Mới / Cập nhật</span><span>Lỗi</span>
          </div>
          {(runs || []).length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có lần chạy nào.</div>
          ) : runs.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: RUN_COLS, gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border-hairline)', font: 'var(--type-body-sm)' }}>
              <span>{formatDateTime(r.startedAt)}</span>
              <span>{VPA_SOURCES.find((s) => s.id === r.source)?.key}</span>
              <span>{r.vehicle == null ? '—' : isCar(r.vehicle) ? 'Ô tô' : 'Xe máy'}</span>
              <span>{VPA_RUN_STATUS[r.status]}{r.complete ? ' ✓' : ''}</span>
              <span>{r.itemsSeen} / {r.itemsExpected}</span>
              <span>{r.inserted} / {r.updated}</span>
              <span style={{ color: r.error ? 'var(--status-danger)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.error || ''}>{r.error || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
