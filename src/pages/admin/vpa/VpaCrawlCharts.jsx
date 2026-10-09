import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Activity,
  Gauge,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  Layers,
  Zap,
} from 'lucide-react';
import { VPA_SOURCES, VPA_RUN_STATUS, formatDateTime, formatDuration, formatInt, isCar } from '../../../lib/vpaFormat.js';

const TONE_COLORS = {
  primary: '#C75B00',
  blue: '#3B5BFF',
  mint: '#10B981',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  rose: '#EF4444',
  grid: 'rgba(0, 0, 0, 0.06)',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div
      style={{
        background: 'var(--white, #ffffff)',
        border: '1px solid var(--border-hairline, #e5e7eb)',
        borderRadius: 'var(--radius-card, 10px)',
        boxShadow: 'var(--shadow-3, 0 10px 15px -3px rgba(0,0,0,0.1))',
        padding: '10px 14px',
        minWidth: 220,
        font: 'var(--type-body-sm, 13px sans-serif)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid var(--grey-100, #f3f4f6)', paddingBottom: 6 }}>
        <div>
          <strong style={{ color: 'var(--text-strong, #111827)', fontSize: '13px' }}>{d.fullTime}</strong>
          <div style={{ fontSize: '11px', color: 'var(--action-primary, #C75B00)', fontWeight: 'var(--fw-medium, 500)' }}>
            {d.sourceLabel} {d.sourceNote ? `(${d.sourceNote})` : ''} • {d.vehicleLabel}
          </div>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 'var(--fw-bold, 700)',
            padding: '2px 7px',
            borderRadius: 'var(--radius-pill, 9999px)',
            background: d.status === 1 ? '#ecfdf5' : d.status === 0 ? '#eff6ff' : '#fef2f2',
            color: d.status === 1 ? '#059669' : d.status === 0 ? '#2563eb' : '#dc2626',
          }}
        >
          {d.statusName}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '12px' }}>
        <span style={{ color: 'var(--text-muted, #6b7280)' }}>Thời lượng:</span>
        <strong style={{ textAlign: 'right', color: 'var(--text-strong, #111827)' }}>{d.durationMin} phút</strong>

        <span style={{ color: 'var(--text-muted, #6b7280)' }}>Tốc độ cào:</span>
        <strong style={{ textAlign: 'right', color: TONE_COLORS.primary }}>~{d.speedItemsPerSec} biển/s</strong>

        <span style={{ color: 'var(--text-muted, #6b7280)' }}>Tốc độ trang:</span>
        <strong style={{ textAlign: 'right', color: TONE_COLORS.blue }}>~{d.speedPagesPerMin} trang/p</strong>

        <span style={{ color: 'var(--text-muted, #6b7280)' }}>Quét thấy:</span>
        <strong style={{ textAlign: 'right', color: 'var(--text-strong, #111827)' }}>{formatInt(d.itemsSeen)} / {formatInt(d.itemsExpected)}</strong>

        <span style={{ color: 'var(--text-muted, #6b7280)' }}>Biển mới:</span>
        <strong style={{ textAlign: 'right', color: TONE_COLORS.mint }}>+{formatInt(d.inserted)}</strong>

        <span style={{ color: 'var(--text-muted, #6b7280)' }}>Cập nhật:</span>
        <strong style={{ textAlign: 'right', color: 'var(--text-body, #374151)' }}>{formatInt(d.updated)}</strong>

        <span style={{ color: 'var(--text-muted, #6b7280)' }}>Đạt chỉ tiêu:</span>
        <strong style={{ textAlign: 'right', color: d.completionPct >= 99 ? TONE_COLORS.mint : TONE_COLORS.amber }}>{d.completionPct}%</strong>
      </div>
    </div>
  );
}

export default function VpaCrawlCharts({ items = [], onSelectRun }) {
  const [open, setOpen] = useState(true);
  const [viewMode, setViewMode] = useState('speed'); // 'speed' | 'volume' | 'completion'

  // Tìm lượt đang chạy (nếu có) để hiển thị live tracking
  const runningRun = useMemo(() => items.find((r) => r.status === 0), [items]);

  // Chuẩn hóa và sắp xếp dữ liệu theo thứ tự thời gian tăng dần từ quá khứ -> hiện tại
  const chartData = useMemo(() => {
    if (!items || !items.length) return [];
    const sorted = [...items].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

    return sorted.map((r) => {
      const src = VPA_SOURCES.find((s) => s.id === r.source);
      const durMs = r.finishedAt
        ? new Date(r.finishedAt) - new Date(r.startedAt)
        : Math.max(1000, Date.now() - new Date(r.startedAt).getTime());
      const durSec = Math.max(1, Math.round(durMs / 1000));
      const durMin = Math.round((durSec / 60) * 10) / 10;

      const itemsPerSec = r.itemsSeen && durSec ? Math.round(r.itemsSeen / durSec) : 0;
      const pagesPerMin = r.pagesFetched && durSec ? Math.round((r.pagesFetched / durSec) * 60) : 0;
      const completionPct =
        r.itemsExpected > 0
          ? Math.min(100, Math.round((r.itemsSeen / r.itemsExpected) * 100))
          : r.itemsSeen > 0
          ? 100
          : 0;
      const slicesPct = r.slicesTotal > 0 ? Math.round((r.slicesDone / r.slicesTotal) * 100) : 100;

      const dateObj = new Date(r.startedAt);
      const timeLabel = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
      const dateLabel = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

      return {
        id: r.id,
        rawRun: r,
        time: timeLabel,
        fullTime: `${timeLabel} ${dateLabel}`,
        sourceLabel: src?.label || 'Nguồn khác',
        sourceNote: src?.note || '',
        vehicleLabel: r.vehicle == null ? 'Cả hai' : isCar(r.vehicle) ? 'Ô tô' : 'Xe máy',
        status: r.status,
        statusName: VPA_RUN_STATUS[r.status] || 'Khác',
        durationMin: durMin,
        speedItemsPerSec: itemsPerSec,
        speedPagesPerMin: pagesPerMin,
        itemsSeen: r.itemsSeen || 0,
        itemsExpected: r.itemsExpected || 0,
        inserted: r.inserted || 0,
        updated: r.updated || 0,
        pagesFetched: r.pagesFetched || 0,
        completionPct,
        slicesPct,
      };
    });
  }, [items]);

  // Các chỉ số KPI tổng hợp
  const kpis = useMemo(() => {
    if (!chartData.length) return null;
    const completed = chartData.filter((d) => d.status === 1 || d.durationMin > 0);
    if (!completed.length) return null;

    const totalSpeed = completed.reduce((acc, d) => acc + d.speedItemsPerSec, 0);
    const avgSpeed = Math.round(totalSpeed / completed.length);

    const totalDur = completed.reduce((acc, d) => acc + d.durationMin, 0);
    const avgDur = Math.round((totalDur / completed.length) * 10) / 10;

    const totalCompletion = completed.reduce((acc, d) => acc + d.completionPct, 0);
    const avgCompletion = Math.round(totalCompletion / completed.length);

    const totalInserted = completed.reduce((acc, d) => acc + d.inserted, 0);

    return { avgSpeed, avgDur, avgCompletion, totalInserted };
  }, [chartData]);

  if (!items.length) return null;

  return (
    <div
      style={{
        background: 'var(--white, #ffffff)',
        borderRadius: 'var(--radius-card, 12px)',
        border: '1px solid var(--border-hairline, #e5e7eb)',
        boxShadow: 'var(--shadow-inset-hairline, 0 1px 3px rgba(0,0,0,0.04))',
        padding: 'var(--space-4, 16px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3, 12px)',
        transition: 'all 200ms ease',
      }}
    >
      {/* Header bar của Card Biểu đồ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--surface-tint-cream, #fff7ed)',
              color: 'var(--action-primary, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart3 size={18} />
          </div>
          <div>
            <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', fontSize: '15px' }}>
              Biểu đồ tiến độ & lịch sử chạy crawl ({chartData.length} lượt gần nhất)
            </span>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '12px' }}>
              Trực quan hóa tốc độ cào, thời lượng xử lý, khối lượng bản ghi mới và độ hoàn thành
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Bộ nút chuyển đổi View Mode */}
          {open && (
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--surface-sunken, #f3f4f6)',
                borderRadius: 'var(--radius-pill, 9999px)',
                padding: 3,
                border: '1px solid var(--border-hairline, #e5e7eb)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('speed')}
                style={{
                  border: 'none',
                  background: viewMode === 'speed' ? 'var(--white, #ffffff)' : 'transparent',
                  color: viewMode === 'speed' ? 'var(--action-primary, #C75B00)' : 'var(--text-muted, #6b7280)',
                  fontWeight: viewMode === 'speed' ? 'var(--fw-bold, 700)' : 'var(--fw-medium, 500)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'speed' ? 'var(--shadow-1, 0 1px 2px rgba(0,0,0,0.06))' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 140ms ease',
                }}
              >
                <Gauge size={13} /> Tốc độ & Thời lượng
              </button>

              <button
                type="button"
                onClick={() => setViewMode('volume')}
                style={{
                  border: 'none',
                  background: viewMode === 'volume' ? 'var(--white, #ffffff)' : 'transparent',
                  color: viewMode === 'volume' ? 'var(--action-primary, #C75B00)' : 'var(--text-muted, #6b7280)',
                  fontWeight: viewMode === 'volume' ? 'var(--fw-bold, 700)' : 'var(--fw-medium, 500)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'volume' ? 'var(--shadow-1, 0 1px 2px rgba(0,0,0,0.06))' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 140ms ease',
                }}
              >
                <Layers size={13} /> Khối lượng dữ liệu
              </button>

              <button
                type="button"
                onClick={() => setViewMode('completion')}
                style={{
                  border: 'none',
                  background: viewMode === 'completion' ? 'var(--white, #ffffff)' : 'transparent',
                  color: viewMode === 'completion' ? 'var(--action-primary, #C75B00)' : 'var(--text-muted, #6b7280)',
                  fontWeight: viewMode === 'completion' ? 'var(--fw-bold, 700)' : 'var(--fw-medium, 500)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'completion' ? 'var(--shadow-1, 0 1px 2px rgba(0,0,0,0.06))' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 140ms ease',
                }}
              >
                <TrendingUp size={13} /> Tỷ lệ đạt chỉ tiêu
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            title={open ? 'Thu gọn biểu đồ' : 'Mở rộng biểu đồ'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              border: '1px solid var(--border-hairline, #e5e7eb)',
              background: 'var(--surface-sunken, #f9fafb)',
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              cursor: 'pointer',
              fontSize: '12px',
              color: 'var(--text-strong, #374151)',
            }}
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{open ? 'Thu gọn' : 'Xem biểu đồ'}</span>
          </button>
        </div>
      </div>

      {/* Banner Tiến độ Live thời gian thực khi có lượt đang cào */}
      {runningRun && (
        <div
          style={{
            background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1px solid #fed7aa',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  background: '#f97316',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 'var(--fw-bold, 700)',
                }}
              >
                <Zap size={12} /> ĐANG CÀO TRỰC TIẾP
              </span>
              <strong style={{ fontSize: '13px', color: 'var(--text-strong, #111827)' }}>
                {VPA_SOURCES.find((s) => s.id === runningRun.source)?.label || 'Crawl'}
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--action-primary, #C75B00)', fontWeight: 'var(--fw-medium, 500)' }}>
                ({VPA_SOURCES.find((s) => s.id === runningRun.source)?.note})
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #6b7280)' }}>•</span>
              <span style={{ fontSize: '12px', color: 'var(--text-strong, #111827)' }}>
                {runningRun.vehicle == null ? 'Cả hai loại' : isCar(runningRun.vehicle) ? 'Ô tô' : 'Xe máy'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '12px' }}>
              <span>
                Thời gian: <strong style={{ color: 'var(--text-strong)' }}>{formatDuration(Date.now() - new Date(runningRun.startedAt).getTime())}</strong>
              </span>
              <span>
                Trang: <strong style={{ color: 'var(--text-strong)' }}>{formatInt(runningRun.pagesFetched)}</strong>
              </span>
              <span>
                Quét thấy: <strong style={{ color: 'var(--text-strong)' }}>{formatInt(runningRun.itemsSeen)} / {formatInt(runningRun.itemsExpected)}</strong>
              </span>
              {onSelectRun && (
                <button
                  type="button"
                  onClick={() => onSelectRun(runningRun)}
                  style={{
                    border: 'none',
                    background: 'var(--action-primary, #C75B00)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 'var(--fw-semibold, 600)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  Xem chi tiết
                </button>
              )}
            </div>
          </div>

          {/* Thanh progress bar trực quan */}
          <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${runningRun.slicesTotal ? Math.min(100, Math.round((runningRun.slicesDone / runningRun.slicesTotal) * 100)) : (runningRun.itemsExpected ? Math.min(100, Math.round((runningRun.itemsSeen / runningRun.itemsExpected) * 100)) : 40)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
                borderRadius: 3,
                transition: 'width 300ms ease',
              }}
            />
          </div>
        </div>
      )}

      {open && (
        <>
          {/* Hàng 4 Card KPI tóm tắt */}
          {kpis && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap: 'var(--space-2, 8px)' }}>
              <div style={{ background: 'var(--surface-sunken, #f9fafb)', borderRadius: 'var(--radius-sm, 6px)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Tốc độ cào TB</span>
                <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: TONE_COLORS.primary, fontSize: '16px' }}>
                  ~{kpis.avgSpeed} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>biển/s</span>
                </span>
              </div>

              <div style={{ background: 'var(--surface-sunken, #f9fafb)', borderRadius: 'var(--radius-sm, 6px)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Thời lượng TB / lượt</span>
                <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', fontSize: '16px' }}>
                  {kpis.avgDur} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>phút</span>
                </span>
              </div>

              <div style={{ background: 'var(--surface-sunken, #f9fafb)', borderRadius: 'var(--radius-sm, 6px)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Tỷ lệ đạt chỉ tiêu</span>
                <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: kpis.avgCompletion >= 98 ? TONE_COLORS.mint : TONE_COLORS.amber, fontSize: '16px' }}>
                  {kpis.avgCompletion}%
                </span>
              </div>

              <div style={{ background: 'var(--surface-sunken, #f9fafb)', borderRadius: 'var(--radius-sm, 6px)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Biển mới phát hiện</span>
                <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: TONE_COLORS.mint, fontSize: '16px' }}>
                  +{formatInt(kpis.totalInserted)}
                </span>
              </div>
            </div>
          )}

          {/* Vùng vẽ biểu đồ Recharts */}
          <div style={{ width: '100%', height: 260, marginTop: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'speed' ? (
                <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={TONE_COLORS.grid} vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  {/* Trục Y trái: Tốc độ (biển/s) */}
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(v) => `${v} b/s`}
                  />
                  {/* Trục Y phải: Thời lượng (phút) */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(v) => `${v}p`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: 6 }} />
                  <Bar
                    yAxisId="right"
                    dataKey="durationMin"
                    name="Thời lượng (phút)"
                    fill="#fed7aa"
                    stroke="#f97316"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="speedItemsPerSec"
                    name="Tốc độ cào (biển/s)"
                    stroke={TONE_COLORS.primary}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: TONE_COLORS.primary }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="speedPagesPerMin"
                    name="Tốc độ trang (trang/p)"
                    stroke={TONE_COLORS.blue}
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    dot={{ r: 2.5, fill: TONE_COLORS.blue }}
                  />
                </ComposedChart>
              ) : viewMode === 'volume' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={TONE_COLORS.grid} vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: 6 }} />
                  <Bar
                    dataKey="inserted"
                    name="Biển mới (+mới)"
                    fill={TONE_COLORS.mint}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="updated"
                    name="Biển cập nhật"
                    fill={TONE_COLORS.blue}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={TONE_COLORS.mint} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={TONE_COLORS.mint} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={TONE_COLORS.grid} vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: 6 }} />
                  <Area
                    type="monotone"
                    dataKey="completionPct"
                    name="Tỷ lệ đạt chỉ tiêu (%)"
                    stroke={TONE_COLORS.mint}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#completionGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="slicesPct"
                    name="Tiến độ tỉnh (%)"
                    stroke={TONE_COLORS.primary}
                    strokeWidth={1.8}
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
