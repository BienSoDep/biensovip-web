import { useEffect, useState } from 'react';
import { Badge, Checkbox, Input, Select, Switch } from '../../../components/index.jsx';
import Button from '../../../components/Button.jsx';
import { formatDateTime, formatDuration, formatInt, vpaRunNote } from '../../../lib/vpaFormat.js';

const CARD = { background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' };
const STATUS_TONE = { success: 'mint', partial: 'amber', failed: 'rose' };
const STATUS_TEXT = { success: 'Thành công', partial: 'Chưa đủ', failed: 'Lỗi' };
const VEHICLES = [{ value: '', label: 'Cả ô tô và xe máy' }, { value: 'Car', label: 'Chỉ ô tô' }, { value: 'MotorBike', label: 'Chỉ xe máy' }];
const caption = { font: 'var(--type-caption)', color: 'var(--text-muted)' };

// Cập nhật mỗi giây khi có lượt đang chạy để thời lượng/"hoạt động cuối" tự nhảy giữa các lần tải trạng thái.
function useNow(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function Progress({ run, now, stuck }) {
  const total = run.slicesTotal || 0;
  const done = run.slicesDone || 0;
  const pct = total ? Math.min(100, Math.round((done * 100) / total)) : 0;
  const elapsed = now - new Date(run.startedAt).getTime();
  const pagesPerSec = elapsed > 5000 ? run.pagesFetched / (elapsed / 1000) : null;
  const eta = done >= 2 && total > done ? (elapsed / done) * (total - done) : null;
  const idle = run.lastActivityAt ? now - new Date(run.lastActivityAt).getTime() : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
        <span>{run.vehicle === 1 ? 'Ô tô' : run.vehicle === 2 ? 'Xe máy' : 'Đang chạy'}{run.options ? ` · ${run.options}` : ''}</span>
        <b>{total ? `${done}/${total} tỉnh` : 'Đang khởi động…'}</b>
      </div>
      <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ height: 8, borderRadius: 4, background: 'var(--grey-200)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: stuck ? 'var(--status-danger)' : 'var(--action-primary)', transition: 'width 400ms var(--ease-standard)' }} />
      </div>
      <div style={{ ...caption, display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
        {run.currentSlice && <span>Đang cào tỉnh <b>{run.currentSlice}</b></span>}
        <span>{formatInt(run.pagesFetched)} trang</span>
        {pagesPerSec != null && <span>{pagesPerSec.toFixed(1)} trang/giây (trung bình)</span>}
        <span>Đã chạy {formatDuration(elapsed)}</span>
        {eta != null && <span title="Ước tính thô theo thời gian trung bình mỗi tỉnh đã xong; tỉnh lớn có thể lâu hơn nhiều">Còn khoảng {formatDuration(eta)}</span>}
        {idle != null && <span style={{ color: stuck ? 'var(--status-danger)' : undefined }}>Hoạt động cuối {formatDuration(idle)} trước{stuck ? ' — nghi bị treo' : ''}</span>}
      </div>
    </div>
  );
}

// Thẻ một nguồn crawl: bật/tắt + chu kỳ, độ mới của dữ liệu, tiến độ lượt đang chạy, Crawl ngay / Tiếp tục / Dừng + tùy chọn nâng cao.
export default function VpaSourceCard({ src, status, settings, form, setForm, set, onRun, onStop, busy }) {
  const [adv, setAdv] = useState(false);
  const [opt, setOpt] = useState({ vehicle: '', province: '', fresh: false, flag: false });
  const isResults = src.id === 3;
  const running = !!status?.running;
  const now = useNow(running);
  const enabled = form[`${src.prefix}Enabled`];
  const last = settings[`${src.prefix}LastStatus`];
  const run = status?.activeRun;
  const resumable = !running && last === 'failed';

  const start = () => {
    const body = { source: src.key, vehicle: opt.vehicle || undefined, fresh: opt.fresh };
    if (!isResults && opt.province.trim()) body.province = opt.province.trim();
    if (isResults) body.resultsFull = opt.flag; else body.dryRun = opt.flag;
    if (opt.fresh && !window.confirm('Bắt đầu lượt MỚI sẽ bỏ qua tiến độ của lượt dở dang. Tiếp tục?')) return;
    onRun(body, src);
  };
  const stop = () => {
    if (window.confirm(`Dừng lượt "${src.label}" đang chạy? Dữ liệu đã ghi được giữ lại và có thể bấm "Tiếp tục" sau.`)) onStop(src);
  };

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{src.label}</span>
        <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
          {running ? <Badge tone={status.stuck ? 'rose' : 'blue'}>{status.stuck ? 'Nghi treo' : 'Đang chạy'}</Badge> : last ? <Badge tone={STATUS_TONE[last] || 'neutral'}>{STATUS_TEXT[last] || last}</Badge> : <Badge tone="neutral">Chưa chạy</Badge>}
          {status?.stale && <Badge tone="amber">Dữ liệu cũ</Badge>}
        </span>
      </div>

      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
        <Switch checked={!!enabled} onChange={(v) => setForm((f) => ({ ...f, [`${src.prefix}Enabled`]: v }))} label={enabled ? 'Đang bật' : 'Đang tắt'} />
        {enabled ? 'Chạy theo lịch' : 'Tắt (chỉ chạy tay)'}
      </span>
      <Input label="Chu kỳ (phút)" type="number" min="1" value={form[`${src.prefix}IntervalMinutes`]} onChange={set(`${src.prefix}IntervalMinutes`)} />

      <div style={{ ...caption, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span title="Lần chạy gần nhất đủ dữ liệu (không tính chạy thử/riêng một tỉnh)">Dữ liệu đủ gần nhất: <b style={{ color: 'var(--text-strong)' }}>{formatDateTime(status?.lastCompleteAt)}</b></span>
        <span>Lần chạy gần nhất: {formatDateTime(settings[`${src.prefix}LastRunAt`])}</span>
        <span>Chạy kế tiếp: {settings.crawlPaused ? 'đang dừng khẩn' : status?.nextRunAt ? formatDateTime(status.nextRunAt) : enabled ? 'theo lịch máy chủ (Vpa:Enabled tắt?)' : '—'}</span>
      </div>

      {running && run && <Progress run={run} now={now} stuck={status.stuck} />}
      {running && !run && <span style={caption}>Đang chạy (chưa có bản ghi lượt — đang khởi động).</span>}
      {!running && run?.note && <span style={caption}>{vpaRunNote(run.note)}</span>}

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Button variant="outline" size="sm" loading={busy} disabled={running || settings.crawlPaused} onClick={start}>
          {resumable && !opt.fresh ? 'Tiếp tục lượt dở' : opt.flag && !isResults ? 'Chạy thử' : 'Crawl ngay'}
        </Button>
        {running && <Button variant="outline" size="sm" onClick={stop} style={{ color: 'var(--status-danger)' }}>Dừng</Button>}
        <Button variant="ghost" size="sm" onClick={() => setAdv((v) => !v)}>{adv ? 'Ẩn tùy chọn' : 'Tùy chọn nâng cao'}</Button>
      </div>

      {adv && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', borderTop: '1px solid var(--grey-100)', paddingTop: 'var(--space-3)' }}>
          <Select label="Loại xe" value={opt.vehicle} options={VEHICLES} onChange={(v) => setOpt((o) => ({ ...o, vehicle: v }))} />
          {!isResults && <Input label="Chỉ một tỉnh (mã VPA, vd 79)" placeholder="Để trống = tất cả tỉnh" value={opt.province} onChange={(e) => setOpt((o) => ({ ...o, province: e.target.value }))} />}
          <Checkbox checked={opt.fresh} onChange={(v) => setOpt((o) => ({ ...o, fresh: !!v }))} label="Làm mới: bỏ qua tiến độ lượt dở dang" />
          <Checkbox checked={opt.flag} onChange={(v) => setOpt((o) => ({ ...o, flag: !!v }))}
            label={isResults ? 'Quét đầy đủ theo tỉnh (ngoài chu kỳ 7 ngày)' : 'Chạy thử: chỉ cào và đếm, không ghi dữ liệu'} />
          <span style={caption}>
            {isResults
              ? 'Kết quả đấu giá chỉ hỗ trợ chọn loại xe, làm mới và quét đầy đủ.'
              : 'Chạy riêng một tỉnh hoặc chạy thử không đổi tab và không tính là lượt theo lịch. Để trống tỉnh và không tick chạy thử = như "Crawl ngay" thường.'}
          </span>
        </div>
      )}
    </div>
  );
}
