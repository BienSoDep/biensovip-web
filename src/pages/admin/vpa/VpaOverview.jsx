import { useState } from 'react';
import { Input, Switch, InfoTip } from '../../../components/index.jsx';
import Button from '../../../components/Button.jsx';
import VpaExcelImport from './VpaExcelImport.jsx';
import VpaSourceCard from './VpaSourceCard.jsx';
import VpaRunsTable from './VpaRunsTable.jsx';
import VpaQualityPanel from './VpaQualityPanel.jsx';
import {
  useVpaOverview, useUpdateVpaSettings, useRunVpaCrawl, useStopVpaCrawl, useForceStopVpaCrawl, usePauseVpaCrawl, useVpaAlertTest,
} from '../../../services/adminVpa.js';
import { VPA_SOURCES } from '../../../lib/vpaFormat.js';
import {
  Calculator,
  CalendarClock,
  CheckCircle2,
  Cpu,
  Mail,
  RotateCcw,
  Save,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';

const CARD = {
  background: 'var(--white)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-4)',
  boxShadow: 'var(--shadow-inset-hairline)',
  border: '1px solid var(--border-hairline)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const ALERT_STYLE = {
  error: { bg: 'var(--rose-50)', fg: 'var(--status-danger)' },
  warn: { bg: 'var(--amber-50)', fg: 'var(--text-strong)' },
  info: { bg: 'var(--surface-sunken)', fg: 'var(--text-body)' },
};

const caption = { font: 'var(--type-caption)', color: 'var(--text-muted)' };

function SwitchRow({ checked, onChange, label, info }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', font: 'var(--type-body-sm)', color: 'var(--text-body)' }} title={info}>
      <Switch checked={checked} onChange={onChange} label={label} />
      <span>{label}</span>
      {info && <InfoTip text={info} />}
    </span>
  );
}

export default function VpaOverview({ notify, isSuperAdmin }) {
  const { data, isLoading, isError, error } = useVpaOverview({ enabled: isSuperAdmin, poll: true });

  if (!isSuperAdmin) {
    return (
      <div style={CARD}>
        <span style={{ color: 'var(--text-muted)' }}>
          Cài đặt đồng bộ và "Crawl ngay" chỉ dành cho quản trị viên (super-admin). Bạn vẫn duyệt giá ở tab "Duyệt giá".
        </span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ ...CARD, textAlign: 'center', color: 'var(--text-muted)', padding: '48px 24px' }}>
        Đang tải dữ liệu tổng quan và cấu hình VPA…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ ...CARD, color: 'var(--status-danger)' }}>
        {error?.message || 'Không tải được cấu hình đồng bộ VPA.'}
      </div>
    );
  }

  return <OverviewBody data={data} notify={notify} />;
}

function OverviewBody({ data, notify }) {
  const save = useUpdateVpaSettings();
  const crawl = useRunVpaCrawl();
  const stop = useStopVpaCrawl();
  const forceStop = useForceStopVpaCrawl();
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
        officialWindowStartHour: num(form.officialWindowStartHour), officialWindowEndHour: num(form.officialWindowEndHour),
        resultsWindowStartHour: num(form.resultsWindowStartHour), resultsWindowEndHour: num(form.resultsWindowEndHour),
      });
      notify?.('Đã lưu cấu hình (tham số vận hành có hiệu lực từ lượt crawl kế tiếp; đổi tham số giá sẽ tính lại toàn bộ nhóm)');
    } catch (e) {
      notify?.(e.message || 'Lưu thất bại');
    }
  };

  const onRun = async (body, src) => {
    setBusySource(src.id);
    try {
      await crawl.mutateAsync(body);
      notify?.(`Đã bắt đầu: ${src.label}${body.dryRun ? ' (chạy thử)' : ''}${body.province ? ` — tỉnh ${body.province}` : ''}`);
    } catch (e) {
      notify?.(e.message || 'Không bắt đầu được');
    } finally {
      setBusySource(null);
    }
  };

  const onStop = async (src) => {
    try {
      await stop.mutateAsync(src.key);
      notify?.(`Đang dừng: ${src.label}`);
    } catch (e) {
      notify?.(e.message || 'Không dừng được');
    }
  };

  // Admin bấm Dừng rồi muốn đổi xe/Crawl ngay ngay nhưng lượt cũ chưa kịp dọn xong (đang rollback/đóng kết nối HTTP dở)
  // nên vẫn báo "đang chạy" — nút này chờ hẳn lượt cũ kết thúc rồi mới trả về (khác Dừng chỉ ra lệnh hủy rồi trả ngay).
  const onForceStop = async (src) => {
    if (!window.confirm(`Hủy hẳn lượt "${src.label}" đang chạy? Có thể mất vài giây để dọn dẹp xong.`)) return;
    setBusySource(src.id);
    try {
      await forceStop.mutateAsync(src.key);
      notify?.(`Đã hủy hẳn: ${src.label}`);
    } catch (e) {
      notify?.(e.message || 'Không hủy được');
    } finally {
      setBusySource(null);
    }
  };

  const onPause = async (value) => {
    const msg = value
      ? 'Bật DỪNG KHẨN: dừng mọi lượt đang chạy, tắt chạy theo lịch và chặn "Crawl ngay" cho tới khi tắt công tắc. Tiếp tục?'
      : 'Tắt dừng khẩn và cho phép crawl chạy lại theo lịch?';
    if (!window.confirm(msg)) return;
    try {
      await pause.mutateAsync(value);
      notify?.(value ? 'Đã bật dừng khẩn crawl VPA' : 'Đã tắt dừng khẩn');
    } catch (e) {
      notify?.(e.message || 'Không đổi được');
    }
  };

  const onAlertTest = async () => {
    try {
      const r = await alertTest.mutateAsync();
      notify?.(`Đã gửi email thử tới ${r?.to || 'hộp thư cảnh báo'}`);
    } catch (e) {
      notify?.(e.message || 'Không gửi được');
    }
  };

  const paused = !!data.settings.crawlPaused;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Thông báo lỗi / cảnh báo hệ thống */}
      {(data.alerts || []).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }} role="status">
          {data.alerts.map((a, i) => (
            <div
              key={i}
              style={{
                background: (ALERT_STYLE[a.level] || ALERT_STYLE.info).bg,
                color: (ALERT_STYLE[a.level] || ALERT_STYLE.info).fg,
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                font: 'var(--type-body-sm)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Công tắc dừng khẩn */}
      <div
        style={{
          ...CARD,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          background: paused ? 'var(--rose-50)' : 'var(--white)',
          borderColor: paused ? 'var(--status-danger)' : 'var(--border-hairline)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={18} style={{ color: paused ? 'var(--status-danger)' : 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Công tắc dừng khẩn</span>
          </div>
          <span style={caption}>
            Bật khi VPA báo chặn, dữ liệu bất thường hoặc cần bảo trì: dừng mọi lượt, không chạy theo lịch, không cho "Crawl ngay". Không đổi hay xóa dữ liệu đã có.
          </span>
        </div>
        <SwitchRow
          checked={paused}
          onChange={onPause}
          label={paused ? 'ĐANG DỪNG KHẨN' : 'Crawl hoạt động bình thường'}
          info="Dừng ngay lập tức toàn bộ các phiên crawl đang chạy, tạm ngắt scheduler tự động và khóa tính năng Crawl ngay để bảo vệ IP máy chủ."
        />
      </div>

      {/* 3 Nguồn crawl chính */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Server size={18} style={{ color: 'var(--action-primary)' }} />
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
            3 nguồn crawl biển số VPA
          </h3>
        </div>
        <Button variant="primary" size="sm" loading={save.isPending} onClick={onSave} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Save size={14} />
          Lưu chu kỳ & cấu hình
        </Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 'var(--space-3)' }}>
        {VPA_SOURCES.map((s) => (
          <VpaSourceCard
            key={s.key}
            src={s}
            status={statusOf(s)}
            settings={data.settings}
            form={form}
            setForm={setForm}
            set={set}
            onRun={onRun}
            onStop={onStop}
            onForceStop={onForceStop}
            busy={busySource === s.id}
          />
        ))}
      </div>

      <VpaQualityPanel enabled />

      {/* PHẦN CÀI ĐẶT 1: CÔNG THỨC GIÁ GỢI Ý - Chia 2 cột cân đối */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={18} style={{ color: 'var(--action-primary)' }} />
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Công thức tính giá gợi ý VPA</h3>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Áp dụng tự động cho toàn bộ nhóm biển đấu giá</span>
        </div>
        <p style={{ margin: 0, ...caption }}>
          Giá gợi ý = trung bình giá trúng của nhóm (tỉnh + loại xe + loại biển + chữ ký) × hệ số, làm tròn theo bước. Đổi tham số sẽ kích hoạt tính lại toàn bộ.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 'var(--space-4)', marginTop: 4 }}>
          {/* Cột trái: 5 tham số toán học */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              background: 'var(--surface-sunken)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', textTransform: 'uppercase' }}>
              Tham số thống kê đầu vào
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
              <Input
                label="Cửa sổ (tháng)"
                info="Khoảng thời gian lịch sử (theo tháng) dùng để gom dữ liệu các phiên trúng đấu giá nhằm tính giá trung bình."
                type="number"
                min="1"
                value={form.windowMonths}
                onChange={set('windowMonths')}
              />
              <Input
                label="Số mẫu tối thiểu"
                info="Số lượng kết quả trúng đấu giá tối thiểu cần có trong nhóm (cùng tỉnh + loại xe + loại biển) để công thức tính giá kích hoạt."
                type="number"
                min="1"
                value={form.minSamples}
                onChange={set('minSamples')}
              />
              <Input
                label="Hệ số nhân"
                info="Hệ số nhân trên giá trúng trung bình để xác định giá bán gợi ý niêm yết (ví dụ 2.5 = gấp 2.5 lần giá trúng trung bình)."
                type="number"
                min="0"
                step="0.05"
                value={form.factor}
                onChange={set('factor')}
              />
              <Input
                label="Lệch xu hướng (%)"
                info="Tỷ lệ phần trăm điều chỉnh biên độ giá theo xu hướng tăng/giảm của thị trường gần nhất."
                type="number"
                min="0"
                value={form.driftPercent}
                onChange={set('driftPercent')}
              />
              <Input
                label="Bước làm tròn (đ)"
                info="Mức làm tròn số tiền của giá gợi ý (ví dụ: bước 100.000đ thì giá sẽ được làm tròn theo bội số 100.000đ)."
                type="number"
                min="1000"
                step="100000"
                value={form.roundStep}
                onChange={set('roundStep')}
              />
            </div>
          </div>

          {/* Cột phải: Mô phỏng công thức & Tùy chọn giá sàn */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              background: 'var(--surface-tint-cream)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div>
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)', textTransform: 'uppercase' }}>
                Mô phỏng áp dụng
              </span>
              <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', marginTop: 6, lineHeight: 1.5 }}>
                <code>Giá gợi ý = Giá trúng TB ({form.windowMonths || 6} tháng) × {form.factor || 1.3} ± {form.driftPercent || 5}%</code>
                <div style={{ marginTop: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Làm tròn bội số: <strong>{Number(form.roundStep || 1000000).toLocaleString('vi-VN')}đ</strong>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-hairline)' }}>
              <SwitchRow
                checked={form.includeFloorPrice}
                onChange={(v) => setForm((f) => ({ ...f, includeFloorPrice: v }))}
                label="Tính cả các kết quả chạm mức giá sàn khởi điểm"
                info="Bao gồm cả các biển trúng với giá bằng đúng mức giá sàn khởi điểm (40 triệu) vào mẫu tính giá trung bình nhóm."
              />
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN CÀI ĐẶT 2: THAM SỐ VẬN HÀNH CRAWL - Chia thành 3 Cột rõ rệt */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal size={18} style={{ color: 'var(--action-primary)' }} />
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              Tham số vận hành crawl VPA
            </h3>
          </div>
          <Button variant="primary" size="md" loading={save.isPending} onClick={onSave} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Save size={14} />
            Lưu toàn bộ cấu hình
          </Button>
        </div>
        <span style={caption}>
          Các thay đổi sẽ có hiệu lực từ lượt crawl kế tiếp. Tăng thời gian giãn cách giữa các request để giảm tải và tránh bị hạ tầng VPA chặn IP.
        </span>

        {/* 3 Cột chức năng chuyên biệt */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 'var(--space-4)', marginTop: 4 }}>
          {/* CỘT 1: HIỆU NĂNG & ĐIỀU TIẾT TẢI HTTP */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              background: 'var(--surface-sunken)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={16} style={{ color: 'var(--action-primary)' }} />
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>1. Hiệu năng & Điều tiết HTTP</span>
            </div>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Kiểm soát độ trễ giữa các request tránh nghẽn mạng và chống bị phát hiện bot
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              <Input
                label="Nghỉ tối thiểu (ms)"
                info="Thời gian nghỉ tối thiểu (mili-giây) giữa các request gửi đến VPA để giảm tải mạng và chống bị phát hiện bot chặn IP."
                type="number"
                min="0"
                step="100"
                value={form.minDelayMs}
                onChange={set('minDelayMs')}
              />
              <Input
                label="Nghỉ tối đa (ms)"
                info="Thời gian nghỉ tối đa ngẫu nhiên giữa các request, tạo độ trễ biến thiên tự nhiên như người dùng duyệt web thật."
                type="number"
                min="0"
                step="100"
                value={form.maxDelayMs}
                onChange={set('maxDelayMs')}
              />
            </div>

            <Input
              label="Timeout mỗi request (giây)"
              info="Thời gian chờ phản hồi tối đa cho mỗi request HTTP trước khi bị ngắt kết nối do quá hạn."
              type="number"
              min="1"
              value={form.timeoutSeconds}
              onChange={set('timeoutSeconds')}
            />
            <Input
              label="Số lần thử lại (lỗi tạm)"
              info="Số lần tự động gửi lại request khi gặp lỗi mạng tạm thời hoặc timeout (lỗi 403 / 429 luôn lập tức kích hoạt dừng khẩn để bảo vệ IP)."
              type="number"
              min="0"
              value={form.maxRetries}
              onChange={set('maxRetries')}
              hint="Lỗi 403 / 429 luôn lập tức dừng khẩn để bảo vệ IP"
            />

            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                font: 'var(--type-caption)',
                color: 'var(--text-muted)',
              }}
            >
              <Zap size={12} style={{ color: 'var(--action-primary)' }} />
              <span>Tốc độ dự kiến: <strong>~{(1000 / Math.max(100, Number(form.minDelayMs || 500))).toFixed(1)} req/giây</strong></span>
            </div>
          </div>

          {/* CỘT 2: AN TOÀN DỮ LIỆU & CẢNH BÁO */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              background: 'var(--surface-sunken)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={16} style={{ color: 'var(--action-primary)' }} />
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>2. An toàn & Cảnh báo</span>
            </div>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Ngăn ngừa rớt dữ liệu quy mô lớn và gửi email khẩn khi có sự cố
            </span>

            <Input
              label="Ngưỡng 'giảm đột ngột' (%)"
              info="Nếu số lượng biển số cào được đột ngột giảm quá X% so với lượt trước, hệ thống sẽ tạm dừng tự động chuyển tab để chống rớt dữ liệu ngoài ý muốn."
              type="number"
              min="1"
              value={form.suddenDropPercent}
              onChange={set('suddenDropPercent')}
              hint="Nếu số biển giảm quá X%, hệ thống dừng tự động chuyển tab"
            />

            <Input
              label="Quét kết quả đầy đủ mỗi (ngày)"
              info="Chu kỳ (tính theo ngày) để tự động quét vét toàn bộ lịch sử đấu giá từ trước đến nay thay vì chỉ cào các phiên gần nhất."
              type="number"
              min="1"
              value={form.resultsFullEveryDays}
              onChange={set('resultsFullEveryDays')}
              hint="Chu kỳ quét vét toàn bộ lịch sử đấu giá"
            />

            <Input
              label="Giãn cách cảnh báo (phút)"
              info="Khoảng cách thời gian tối thiểu giữa các email cảnh báo sự cố gửi đến kỹ thuật viên, tránh gửi dồn dập nhiều email liên tục."
              type="number"
              min="1"
              value={form.alertCooldownMinutes}
              onChange={set('alertCooldownMinutes')}
              hint="Tối đa 1 email cảnh báo / nguồn trong khoảng này"
            />

            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '8px 10px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Email kỹ thuật nhận tin:</span>
                {data.alertEmail && (
                  <button
                    type="button"
                    onClick={onAlertTest}
                    disabled={alertTest.isPending}
                    style={{ border: 'none', background: 'none', color: 'var(--action-primary)', cursor: 'pointer', padding: 0, font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)' }}
                  >
                    {alertTest.isPending ? 'Đang gửi…' : 'Gửi thử'}
                  </button>
                )}
              </div>
              <strong style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', wordBreak: 'break-all' }}>
                {data.alertEmail || 'Chưa cấu hình (Contact:DevEmail)'}
              </strong>
            </div>
          </div>

          {/* CỘT 3: KHUNG GIỜ LỊCH CHẠY THEO NGUỒN (SCHEDULER) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              background: 'var(--surface-sunken)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarClock size={16} style={{ color: 'var(--action-primary)' }} />
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>3. Khung giờ chạy theo lịch</span>
            </div>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Cài đặt khung giờ Việt Nam (0–23h) mà cron job được phép tự khởi chạy
            </span>

            {/* Nguồn 1: Danh sách chính thức */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--white)', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                  1. Danh sách chính thức:
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary, #C75B00)', fontWeight: 'var(--fw-semibold)', fontSize: '11px' }}>
                  Biển tuần
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <Input
                  label="Từ giờ"
                  info="Giờ bắt đầu khung thời gian (0-23h giờ VN) cho phép tự động khởi chạy lượt cào Danh sách chính thức."
                  type="number"
                  min="0"
                  max="23"
                  value={form.officialWindowStartHour}
                  onChange={set('officialWindowStartHour')}
                />
                <Input
                  label="Đến giờ"
                  info="Giờ kết thúc khung thời gian. Ngoài khung giờ này scheduler sẽ không tự động kích hoạt lượt mới."
                  type="number"
                  min="0"
                  max="23"
                  value={form.officialWindowEndHour}
                  onChange={set('officialWindowEndHour')}
                />
              </div>
            </div>

            {/* Nguồn 2: Danh sách công bố */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--white)', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                  2. Danh sách công bố (Nặng ~5-6h):
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary, #C75B00)', fontWeight: 'var(--fw-semibold)', fontSize: '11px' }}>
                  Biển tháng
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <Input
                  label="Từ giờ"
                  info="Giờ bắt đầu khung thời gian cho phép tự khởi chạy cào Danh sách công bố (thường đặt vào ban đêm 2h-3h vì dữ liệu nặng)."
                  type="number"
                  min="0"
                  max="23"
                  value={form.publishedWindowStartHour}
                  onChange={set('publishedWindowStartHour')}
                />
                <Input
                  label="Đến giờ"
                  info="Giờ kết thúc khung thời gian cho phép khởi chạy Danh sách công bố."
                  type="number"
                  min="0"
                  max="23"
                  value={form.publishedWindowEndHour}
                  onChange={set('publishedWindowEndHour')}
                />
              </div>
            </div>

            {/* Nguồn 3: Kết quả đấu giá */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--white)', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                  3. Kết quả đấu giá:
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary, #C75B00)', fontWeight: 'var(--fw-semibold)', fontSize: '11px' }}>
                  Biển hết hạn
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <Input
                  label="Từ giờ"
                  info="Giờ bắt đầu khung thời gian cho phép tự khởi chạy cào Kết quả đấu giá."
                  type="number"
                  min="0"
                  max="23"
                  value={form.resultsWindowStartHour}
                  onChange={set('resultsWindowStartHour')}
                />
                <Input
                  label="Đến giờ"
                  info="Giờ kết thúc khung thời gian cho phép khởi chạy cào Kết quả đấu giá."
                  type="number"
                  min="0"
                  max="23"
                  value={form.resultsWindowEndHour}
                  onChange={set('resultsWindowEndHour')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <VpaExcelImport notify={notify} />

      <VpaRunsTable notify={notify} onRun={onRun} settings={data.settings} />
    </div>
  );
}
