import { useState } from 'react';
import { Input, Switch } from '../../../components/index.jsx';
import Button from '../../../components/Button.jsx';
import VpaExcelImport from './VpaExcelImport.jsx';
import VpaSourceCard from './VpaSourceCard.jsx';
import VpaRunsTable from './VpaRunsTable.jsx';
import VpaQualityPanel from './VpaQualityPanel.jsx';
import {
  useVpaOverview, useUpdateVpaSettings, useRunVpaCrawl, useStopVpaCrawl, usePauseVpaCrawl, useVpaAlertTest,
} from '../../../services/adminVpa.js';
import { VPA_SOURCES } from '../../../lib/vpaFormat.js';

const CARD = { background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' };
const ALERT_STYLE = {
  error: { bg: 'var(--rose-50)', fg: 'var(--status-danger)' },
  warn: { bg: 'var(--amber-50)', fg: 'var(--text-strong)' },
  info: { bg: 'var(--surface-sunken)', fg: 'var(--text-body)' },
};
const caption = { font: 'var(--type-caption)', color: 'var(--text-muted)' };
function SwitchRow({ checked, onChange, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
      <Switch checked={checked} onChange={onChange} label={label} />{label}
    </span>
  );
}

// Tổng quan đồng bộ VPA: cảnh báo, công tắc dừng khẩn, từng nguồn (tiến độ, độ mới, chạy/dừng/tiếp tục), chất lượng dữ liệu,
// tham số vận hành + công thức giá, nhập Excel dự phòng, lịch sử lượt chạy. Chỉ super-admin.
export default function VpaOverview({ notify, isSuperAdmin }) {
  const { data, isLoading, isError, error } = useVpaOverview({ enabled: isSuperAdmin, poll: true });

  if (!isSuperAdmin) return <div style={CARD}><span style={{ color: 'var(--text-muted)' }}>Cài đặt đồng bộ và "Crawl ngay" chỉ dành cho quản trị viên (super-admin). Bạn vẫn duyệt giá ở tab "Duyệt giá".</span></div>;
  if (isLoading) return <div style={{ ...CARD, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError || !data) return <div style={{ ...CARD, color: 'var(--status-danger)' }}>{error?.message || 'Không tải được cấu hình đồng bộ VPA.'}</div>;
  return <OverviewBody data={data} notify={notify} />;
}

// Form khởi tạo từ cài đặt đã tải một lần; polling chỉ làm mới trạng thái chạy, không ghi đè ô đang sửa.
function OverviewBody({ data, notify }) {
  const save = useUpdateVpaSettings();
  const crawl = useRunVpaCrawl();
  const stop = useStopVpaCrawl();
  const pause = usePauseVpaCrawl();
  const alertTest = useVpaAlertTest();
  const [form, setForm] = useState(() => ({ ...data.settings }));
  const [busySource, setBusySource] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e && e.target ? e.target.value : e }));
  const num = (v) => (v === '' || v == null ? '' : Number(v));
  const statusOf = (src) => (data.sources || []).find((s) => s.source === src.id);

  const onSave = async () => {
    try {
      await save.mutateAsync({
        officialEnabled: !!form.officialEnabled, officialIntervalMinutes: num(form.officialIntervalMinutes),
        publishedEnabled: !!form.publishedEnabled, publishedIntervalMinutes: num(form.publishedIntervalMinutes),
        resultsEnabled: !!form.resultsEnabled, resultsIntervalMinutes: num(form.resultsIntervalMinutes),
        windowMonths: num(form.windowMonths), minSamples: num(form.minSamples), factor: num(form.factor),
        includeFloorPrice: !!form.includeFloorPrice, driftPercent: num(form.driftPercent), roundStep: num(form.roundStep),
        minDelayMs: num(form.minDelayMs), maxDelayMs: num(form.maxDelayMs), timeoutSeconds: num(form.timeoutSeconds), maxRetries: num(form.maxRetries),
        suddenDropPercent: num(form.suddenDropPercent), resultsFullEveryDays: num(form.resultsFullEveryDays), alertCooldownMinutes: num(form.alertCooldownMinutes),
        publishedWindowStartHour: num(form.publishedWindowStartHour), publishedWindowEndHour: num(form.publishedWindowEndHour),
      });
      notify?.('Đã lưu cấu hình (tham số vận hành có hiệu lực từ lượt crawl kế tiếp; đổi tham số giá sẽ tính lại toàn bộ nhóm)');
    } catch (e) { notify?.(e.message || 'Lưu thất bại'); }
  };

  const onRun = async (body, src) => {
    setBusySource(src.id);
    try {
      await crawl.mutateAsync(body);
      notify?.(`Đã bắt đầu: ${src.label}${body.dryRun ? ' (chạy thử)' : ''}${body.province ? ` — tỉnh ${body.province}` : ''}`);
    } catch (e) { notify?.(e.message || 'Không bắt đầu được'); } finally { setBusySource(null); }
  };
  const onStop = async (src) => {
    try { await stop.mutateAsync(src.key); notify?.(`Đang dừng: ${src.label}`); } catch (e) { notify?.(e.message || 'Không dừng được'); }
  };
  const onPause = async (value) => {
    const msg = value
      ? 'Bật DỪNG KHẨN: dừng mọi lượt đang chạy, tắt chạy theo lịch và chặn "Crawl ngay" cho tới khi tắt công tắc. Tiếp tục?'
      : 'Tắt dừng khẩn và cho phép crawl chạy lại theo lịch?';
    if (!window.confirm(msg)) return;
    try { await pause.mutateAsync(value); notify?.(value ? 'Đã bật dừng khẩn crawl VPA' : 'Đã tắt dừng khẩn'); } catch (e) { notify?.(e.message || 'Không đổi được'); }
  };
  const onAlertTest = async () => {
    try { const r = await alertTest.mutateAsync(); notify?.(`Đã gửi email thử tới ${r?.to || 'hộp thư cảnh báo'}`); } catch (e) { notify?.(e.message || 'Không gửi được'); }
  };

  const paused = !!data.settings.crawlPaused;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {(data.alerts || []).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }} role="status">
          {data.alerts.map((a, i) => (
            <div key={i} style={{ background: (ALERT_STYLE[a.level] || ALERT_STYLE.info).bg, color: (ALERT_STYLE[a.level] || ALERT_STYLE.info).fg, borderRadius: 'var(--radius-md)', padding: '10px 14px', font: 'var(--type-body-sm)' }}>
              {a.message}
            </div>
          ))}
        </div>
      )}

      <div style={{ ...CARD, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: paused ? 'var(--rose-50)' : 'var(--white)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Công tắc dừng khẩn</span>
          <span style={caption}>Bật khi VPA báo chặn, dữ liệu bất thường hoặc cần bảo trì: dừng mọi lượt, không chạy theo lịch, không cho "Crawl ngay". Không đổi hay xóa dữ liệu đã có.</span>
        </div>
        <SwitchRow checked={paused} onChange={onPause} label={paused ? 'ĐANG DỪNG KHẨN' : 'Crawl hoạt động'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 'var(--space-3)' }}>
        {VPA_SOURCES.map((s) => (
          <VpaSourceCard key={s.key} src={s} status={statusOf(s)} settings={data.settings} form={form} setForm={setForm} set={set}
            onRun={onRun} onStop={onStop} busy={busySource === s.id} />
        ))}
      </div>

      <VpaQualityPanel enabled />

      <div style={CARD}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Công thức giá gợi ý</span>
        <span style={caption}>Giá gợi ý = trung bình giá trúng của nhóm (tỉnh + loại xe + loại biển + chữ ký) × hệ số, làm tròn theo bước. Đổi tham số sẽ tính lại toàn bộ nhóm.</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 'var(--space-3)' }}>
          <Input label="Cửa sổ (tháng)" type="number" min="1" value={form.windowMonths} onChange={set('windowMonths')} />
          <Input label="Số mẫu tối thiểu" type="number" min="1" value={form.minSamples} onChange={set('minSamples')} />
          <Input label="Hệ số" type="number" min="0" value={form.factor} onChange={set('factor')} />
          <Input label="Lệch xu hướng (%)" type="number" min="0" value={form.driftPercent} onChange={set('driftPercent')} />
          <Input label="Bước làm tròn (đ)" type="number" min="1" value={form.roundStep} onChange={set('roundStep')} />
        </div>
        <SwitchRow checked={form.includeFloorPrice} onChange={(v) => setForm((f) => ({ ...f, includeFloorPrice: v }))} label="Tính cả kết quả chạm giá sàn" />
      </div>

      <div style={CARD}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Tham số vận hành crawl</span>
        <span style={caption}>Đổi ở đây có hiệu lực từ lượt crawl kế tiếp, không cần khởi động lại. Giá trị hiện hiển thị là giá trị đang dùng (cấu hình máy chủ nếu chưa ghi đè). Tăng thời gian nghỉ giữa request để nhẹ cho VPA hơn.</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: 'var(--space-3)' }}>
          <Input label="Nghỉ tối thiểu giữa request (ms)" type="number" min="0" value={form.minDelayMs} onChange={set('minDelayMs')} />
          <Input label="Nghỉ tối đa giữa request (ms)" type="number" min="0" value={form.maxDelayMs} onChange={set('maxDelayMs')} />
          <Input label="Timeout mỗi request (giây)" type="number" min="1" value={form.timeoutSeconds} onChange={set('timeoutSeconds')} />
          <Input label="Số lần thử lại (lỗi tạm)" type="number" min="0" value={form.maxRetries} onChange={set('maxRetries')} hint="403/429 luôn dừng ngay" />
          <Input label="Ngưỡng 'giảm đột ngột' (%)" type="number" min="1" value={form.suddenDropPercent} onChange={set('suddenDropPercent')} hint="Lượt công bố thấp hơn lượt đủ trước quá X% thì bỏ qua phát hiện biến mất" />
          <Input label="Quét kết quả đầy đủ mỗi (ngày)" type="number" min="1" value={form.resultsFullEveryDays} onChange={set('resultsFullEveryDays')} />
          <Input label="Giãn cách cảnh báo (phút)" type="number" min="1" value={form.alertCooldownMinutes} onChange={set('alertCooldownMinutes')} hint="Tối đa 1 cảnh báo / nguồn / khoảng này" />
          <Input label="Nguồn công bố: chạy từ giờ" type="number" min="0" max="23" value={form.publishedWindowStartHour} onChange={set('publishedWindowStartHour')} hint="Giờ Việt Nam. Lượt công bố nặng (5–6 giờ) nên hẹn đêm khuya" />
          <Input label="Nguồn công bố: chạy đến giờ" type="number" min="0" max="23" value={form.publishedWindowEndHour} onChange={set('publishedWindowEndHour')}
            hint={Number(form.publishedWindowStartHour) === Number(form.publishedWindowEndHour) ? 'Hai giờ bằng nhau = không giới hạn, chạy bất kỳ lúc nào' : `Lịch chỉ khởi chạy trong khung ${form.publishedWindowStartHour}h–${form.publishedWindowEndHour}h; nút "Crawl ngay" không bị chặn`} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={caption}>
            Email nhận cảnh báo: <b>{data.alertEmail || 'chưa cấu hình (Contact:Email) — chỉ ghi log'}</b>
            {data.alertEmail && <> · <button type="button" onClick={onAlertTest} disabled={alertTest.isPending} style={{ border: 'none', background: 'none', color: 'var(--link)', cursor: 'pointer', padding: 0, font: 'inherit' }}>Gửi email thử</button></>}
          </span>
          <Button variant="primary" size="md" loading={save.isPending} onClick={onSave}>Lưu cấu hình</Button>
        </div>
      </div>

      <VpaExcelImport notify={notify} />

      <VpaRunsTable notify={notify} onRun={onRun} />
    </div>
  );
}
