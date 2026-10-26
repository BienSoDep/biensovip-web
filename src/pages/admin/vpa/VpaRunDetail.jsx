import { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bike,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Gavel,
  Info,
  Layers,
  RotateCcw,
  Search,
  ShieldAlert,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import Drawer from '../../../components/Drawer.jsx';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { Badge } from '../../../components/index.jsx';
import { useVpaRunChanges, useRevertVpaRun, useApplyVpaVanish, exportVpaRunChangesCsv, useRunVpaCrawl } from '../../../services/adminVpa.js';
import {
  getVpaSourceConfig,
  VPA_RUN_STATUS,
  VPA_RUN_STATUS_TONE,
  VPA_TAB_LABELS,
  VPA_CHANGE_REASONS,
  formatDateTime,
  formatDuration,
  formatInt,
  isCar,
  vpaRunNote,
  vpaScheduleWindowLabel,
} from '../../../lib/vpaFormat.js';

const PAGE_SIZE = 50;

export default function VpaRunDetail({ run, onClose, notify, settings }) {
  const [reason, setReason] = useState('');
  const [searchPlate, setSearchPlate] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const hasTabs = run.source === 1 || run.source === 2;
  const srcCfg = getVpaSourceConfig(run.source);
  const { data: changes, isLoading } = useVpaRunChanges(hasTabs ? run.id : null, { reason, page, limit: PAGE_SIZE });
  const revert = useRevertVpaRun();
  const applyVanish = useApplyVpaVanish();
  const runCrawl = useRunVpaCrawl();
  const [recrawling, setRecrawling] = useState(null); // mã tỉnh đang bấm "Cào lại"

  // Tỉnh nào còn thiếu biển trong lượt này — SliceStatsJson ghi {expected,seen,missing} theo từng tỉnh
  // (ItemsMissing chỉ là tổng cả lượt, không nói được tỉnh nào). Chỉ Official/Published có lát theo tỉnh.
  const missingSlices = useMemo(() => {
    if (!hasTabs || !run.sliceStatsJson) return [];
    try {
      const stats = JSON.parse(run.sliceStatsJson);
      return Object.entries(stats)
        .filter(([, s]) => s.missing > 0)
        .map(([code, s]) => ({ code, ...s }))
        .sort((a, b) => b.missing - a.missing);
    } catch {
      return [];
    }
  }, [hasTabs, run.sliceStatsJson]);

  const recrawlProvince = async (code) => {
    setRecrawling(code);
    try {
      await runCrawl.mutateAsync({ source: srcCfg.key, vehicle: run.vehicle, province: code });
      notify?.(`Đã bắt đầu cào lại tỉnh ${code} — xem tiến trình ở danh sách lượt chạy.`);
    } catch (e) {
      notify?.(e.message || 'Không bắt đầu được lượt cào lại');
    } finally {
      setRecrawling(null);
    }
  };

  const SourceIcon = run.source === 1 ? CalendarDays : run.source === 2 ? Layers : run.source === 3 ? Gavel : Layers;

  const unmapped = (() => {
    try {
      return run.unmappedJson ? Object.entries(JSON.parse(run.unmappedJson)) : [];
    } catch {
      return [];
    }
  })();

  const duration = run.finishedAt ? new Date(run.finishedAt) - new Date(run.startedAt) : null;
  const canApplyVanish = run.source === 2 && !!run.note?.startsWith('sudden_drop') && !run.note.includes('đã xác nhận');
  const reasons = Object.entries(changes?.byReason || {});
  const totalPages = Math.max(1, Math.ceil((changes?.total || 0) / PAGE_SIZE));

  // Tốc độ và hiệu suất
  const ratePlates = duration && duration > 0 && run.itemsSeen > 0 ? Math.round(run.itemsSeen / (duration / 1000)) : null;
  const ratePages = duration && duration > 0 && run.pagesFetched > 0 ? Math.round(run.pagesFetched / (duration / 60000)) : null;

  // Tỷ lệ hoàn thành
  const completionPct = run.itemsExpected > 0 ? Math.min(100, Math.round((run.itemsSeen / run.itemsExpected) * 100)) : run.itemsSeen > 0 ? 100 : 0;

  // Biến động dữ liệu
  const deltaTotal = (run.inserted || 0) + (run.updated || 0);
  const pctInserted = deltaTotal > 0 ? Math.round(((run.inserted || 0) / deltaTotal) * 100) : 0;
  const pctUpdated = deltaTotal > 0 ? Math.round(((run.updated || 0) / deltaTotal) * 100) : 0;

  // Lọc biển số theo ô tìm kiếm trên frontend nếu người dùng nhập
  const displayedChanges = useMemo(() => {
    if (!changes?.items) return [];
    if (!searchPlate.trim()) return changes.items;
    const q = searchPlate.trim().toUpperCase();
    return changes.items.filter((c) => c.plateNumber?.toUpperCase().includes(q));
  }, [changes?.items, searchPlate]);

  const act = async (fn, ok) => {
    try {
      notify?.(ok(await fn()));
    } catch (e) {
      notify?.(e.message || 'Thao tác thất bại');
    }
  };

  return (
    <Drawer open onClose={onClose} title="Chi tiết lượt chạy cào dữ liệu" width="min(68%, 880px)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4, 16px)' }}>
        {/* 1. Header nhận diện Kiểu cào Pastel & Trạng thái */}
        <div
          style={{
            background: srcCfg.bg,
            border: `1px solid ${srcCfg.border}`,
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-control)',
                background: srcCfg.pillBg,
                border: `1px solid ${srcCfg.border}`,
                color: srcCfg.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                flexShrink: 0,
              }}
            >
              <SourceIcon size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    font: 'var(--type-caption)',
                    fontSize: '11px',
                    fontWeight: 'var(--fw-bold)',
                    color: srcCfg.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span>{srcCfg.tag}</span>
                  <span style={{ opacity: 0.5 }}>/</span>
                  <span>{srcCfg.note}</span>
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {srcCfg.desc}
                </span>
              </div>
              <h3 style={{ margin: '2px 0 0', font: 'var(--type-title-3)', color: 'var(--text-strong)', lineHeight: 1.3 }}>
                {srcCfg.label}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge tone={VPA_RUN_STATUS_TONE[run.status] || 'neutral'}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {run.status === 1 ? <CheckCircle2 size={12} /> : null}
                {VPA_RUN_STATUS[run.status]}
                {run.complete && ' (Đủ 100%)'}
              </span>
            </Badge>
            <Badge tone={isCar(run.vehicle) ? 'blue' : 'mint'}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {run.vehicle == null ? 'Cả hai' : isCar(run.vehicle) ? <><Car size={12} /> Ô tô</> : <><Bike size={12} /> Xe máy</>}
              </span>
            </Badge>
            {run.triggeredBy === 'schedule' ? (
              <Badge tone="blue">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} /> Tự động
                </span>
              </Badge>
            ) : (
              <Badge tone="orange">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <User size={11} /> {run.triggeredBy?.replace(/^admin:/i, 'Admin: ') || 'Thủ công'}
                </span>
              </Badge>
            )}
            {run.dryRun && <Badge tone="amber">Thử nghiệm (Không ghi DB)</Badge>}
            {run.options && <Badge tone="blue">{run.options}</Badge>}
          </div>
        </div>

        {/* 2. Lưới 4 Thẻ KPI Biến Số & Biến Động Cốt Lõi */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 12 }}>
          {/* Card 1: Khối lượng quét & Tỷ lệ hoàn thành */}
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: 'var(--type-caption)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)' }}>
                Đã thấy / Dự kiến
              </span>
              <BarChart3 size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', lineHeight: 1.2 }}>
              {formatInt(run.itemsSeen)}{' '}
              <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                / {formatInt(run.itemsExpected)}
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div style={{ height: 5, borderRadius: 3, background: 'var(--grey-100, #f3f4f6)', overflow: 'hidden', margin: '4px 0 2px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${completionPct}%`,
                  background: run.itemsMissing ? 'var(--status-warning, #F5C542)' : 'var(--status-success, #3FBF8F)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', alignItems: 'center' }}>
              <span>{formatInt(run.pagesFetched)} trang</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: run.itemsMissing ? 'var(--status-warning-ink, #8A6100)' : 'var(--status-success-ink, #1B7A5A)', fontWeight: 'var(--fw-semibold)' }}>
                {run.itemsMissing ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                {run.itemsMissing ? `Thiếu ${formatInt(run.itemsMissing)} biển` : '100% đạt chuẩn'}
              </span>
            </div>
          </div>

          {/* Card 2: Biến động nạp dữ liệu (Mới vs Sửa) */}
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: 'var(--type-caption)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)' }}>
                Biến động (Mới - Sửa)
              </span>
              <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', lineHeight: 1.2, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--status-success-ink, #1B7A5A)' }}>+{formatInt(run.inserted)}</span>
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>mới</span>
              <span style={{ color: 'var(--grey-400, #9ca3af)', fontSize: '12px' }}>/</span>
              <span style={{ color: 'var(--action-primary, #C75B00)' }}>{formatInt(run.updated)}</span>
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>sửa</span>
            </div>
            {/* Visual Delta Bar */}
            <div style={{ height: 5, borderRadius: 3, background: 'var(--grey-100, #f3f4f6)', overflow: 'hidden', margin: '4px 0 2px', display: 'flex' }}>
              <div style={{ height: '100%', width: `${pctInserted}%`, background: 'var(--status-success, #3FBF8F)' }} title={`Mới: ${pctInserted}%`} />
              <div style={{ height: '100%', width: `${pctUpdated}%`, background: 'var(--action-primary, #C75B00)' }} title={`Cập nhật: ${pctUpdated}%`} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Bỏ qua: {formatInt(run.skippedForeign)}</span>
              <span>Tổng biến động: {formatInt(deltaTotal)}</span>
            </div>
          </div>

          {/* Card 3: Biến động trạng thái / Kết quả đấu giá */}
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: 'var(--type-caption)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)' }}>
                {run.source === 3 ? 'Kết quả đấu giá' : 'Biển đổi Tab'}
              </span>
              <Activity size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', lineHeight: 1.2 }}>
              {run.source === 3 ? formatInt(deltaTotal) : formatInt(run.tabChanges)}{' '}
              <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                {run.source === 3 ? 'kết quả' : 'biển'}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--grey-100, #f3f4f6)', overflow: 'hidden', margin: '4px 0 2px' }}>
              <div
                style={{
                  height: '100%',
                  width: run.source === 3 ? '100%' : `${Math.min(100, (run.tabChanges / Math.max(1, run.itemsSeen)) * 100 * 5)}%`,
                  background: srcCfg.accent,
                  borderRadius: 3,
                }}
              />
            </div>
            <div style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {run.source === 3 ? 'Đã làm mới dữ liệu giá thị trường' : 'Chuyển vị trí giữa các tab niêm yết'}
            </div>
          </div>

          {/* Card 4: Tốc độ & Hiệu suất xử lý */}
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: 'var(--type-caption)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)' }}>
                Tốc độ & Hiệu suất
              </span>
              <Zap size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', lineHeight: 1.2 }}>
              {ratePlates != null ? `${ratePlates} biển/s` : run.status === 0 ? 'Đang đo…' : '—'}
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--grey-100, #f3f4f6)', overflow: 'hidden', margin: '4px 0 2px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, ((ratePlates || 0) / 150) * 100)}%`,
                  background: 'var(--action-primary, #C75B00)',
                  borderRadius: 3,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>{ratePages != null ? `${ratePages} trang/phút` : '—'}</span>
              <span>{duration != null ? formatDuration(duration) : 'Đang chạy'}</span>
            </div>
          </div>
        </div>

        {/* 3. Bảng Chi Tiết Toàn Bộ Các Biến Số Vận Hành */}
        <div
          style={{
            background: 'var(--surface-sunken, #f9fafb)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Database size={15} style={{ color: 'var(--action-primary, #C75B00)' }} />
            <span style={{ font: 'var(--type-title-3)', fontSize: '13px', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Thông số biến số vận hành chi tiết
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px 20px' }}>
            {/* Nhóm 1: Thời gian & Tiến trình */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ font: 'var(--type-caption)', fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Thời gian & Tiến trình thực thi
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--grey-200, #e5e7eb)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Bắt đầu:</span>
                <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>{formatDateTime(run.startedAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--grey-200, #e5e7eb)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Kết thúc:</span>
                <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>{formatDateTime(run.finishedAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--grey-200, #e5e7eb)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Thời lượng:</span>
                <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{duration != null ? formatDuration(duration) : 'Đang chạy'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--grey-200, #e5e7eb)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiến độ tỉnh:</span>
                <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>
                  {run.slicesTotal ? `${run.slicesDone} / ${run.slicesTotal} tỉnh (${Math.round((run.slicesDone / run.slicesTotal) * 100)}%)` : 'Toàn quốc (Quét tập trung)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hoạt động cuối:</span>
                <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>{formatDateTime(run.lastActivityAt)}</span>
              </div>
            </div>

            {/* Nhóm 2: Cấu hình & Môi trường chạy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ font: 'var(--type-caption)', fontSize: '11px', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Cấu hình & Môi trường đồng bộ
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--grey-200, #e5e7eb)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Nguồn cào:</span>
                <span style={{ fontWeight: 'var(--fw-medium)', color: srcCfg.color }}>
                  {srcCfg.label} ({srcCfg.note})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--grey-200, #e5e7eb)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Loại xe mục tiêu:</span>
                <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>
                  {run.vehicle == null ? 'Cả hai (Ô tô & Xe máy)' : isCar(run.vehicle) ? 'Ô tô' : 'Xe máy'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--grey-200, #e5e7eb)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Người / Cách chạy:</span>
                <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>
                  {run.triggeredBy === 'schedule' ? 'Lịch tự động (Hệ thống Cron)' : run.triggeredBy?.replace(/^admin:/i, 'Admin: ') || 'Thủ công'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed var(--grey-200, #e5e7eb)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Vòng tải bù tối đa:</span>
                <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>
                  {run.rounds ? `${run.rounds} vòng bù` : '1 vòng (không cần bù)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Khung giờ tự động:</span>
                <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>
                  {settings ? vpaScheduleWindowLabel(settings, run.source) : 'Mặc định'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Khối Cảnh báo & Ghi chú (nếu có) */}
        {run.note && (
          <div style={{ background: 'var(--amber-50, #fffbeb)', border: '1px solid var(--amber-200, #fde68a)', borderRadius: 'var(--radius-md, 8px)', padding: '12px 14px', font: 'var(--type-body-sm)', color: 'var(--amber-900, #78350f)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={16} style={{ color: 'var(--amber-600, #d97706)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <b>Ghi chú vận hành: </b>{vpaRunNote(run.note)}
                {canApplyVanish && (
                  <div style={{ marginTop: 8 }}>
                    <Button variant="outline" size="sm" loading={applyVanish.isPending}
                      onClick={() => window.confirm('Số biển lượt này giảm nhiều nhưng đúng sự thật? Áp dụng sẽ chuyển các biển vắng mặt sang tab nội bộ (chỉ áp dụng được cho lượt công bố mới nhất của loại xe này).')
                        && act(() => applyVanish.mutateAsync(run.id), (r) => `Đã áp dụng phát hiện biến mất: ${r?.changed ?? 0} biển`)}>
                      Xác nhận áp dụng phát hiện biến mất
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {run.error && (
          <div style={{ background: 'var(--rose-50, #fff1f2)', border: '1px solid var(--rose-200, #fecdd3)', borderRadius: 'var(--radius-md, 8px)', padding: '12px 14px', font: 'var(--type-body-sm)', color: 'var(--status-danger, #e11d48)', overflowWrap: 'anywhere' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <ShieldAlert size={16} style={{ color: 'var(--status-danger)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <b>Thông báo lỗi: </b>{run.error}
              </div>
            </div>
          </div>
        )}

        {unmapped.length > 0 && (
          <div style={{ background: 'var(--blue-50, #eff6ff)', border: '1px solid var(--blue-200, #bfdbfe)', borderRadius: 'var(--radius-md, 8px)', padding: '12px 14px', font: 'var(--type-body-sm)', color: 'var(--blue-900, #1e3a8a)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Info size={16} style={{ color: 'var(--blue-600)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <b>Tiền tố biển chưa khớp danh mục hành chính (số biển): </b>
                {unmapped.map(([k, n]) => `${k}: ${n}`).join(' · ')}
              </div>
            </div>
          </div>
        )}

        {missingSlices.length > 0 && (
          <div style={{ background: 'var(--amber-50, #fffbeb)', border: '1px solid var(--amber-200, #fde68a)', borderRadius: 'var(--radius-md, 8px)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={16} style={{ color: 'var(--amber-600, #d97706)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ font: 'var(--type-body-sm)', color: 'var(--amber-900, #78350f)' }}>
                <b>{missingSlices.length} tỉnh còn thiếu biển trong lượt này</b> — VPA đổi trang/xóa tin trong lúc đang cào (phân trang không ổn định với tỉnh lớn chạy nhiều giờ). Bấm "Cào lại" để quét riêng tỉnh đó, không cần chạy lại cả lượt.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {missingSlices.map((s) => (
                <div key={s.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 8px', background: 'var(--white)', borderRadius: 6, border: '1px solid var(--amber-100, #fef3c7)' }}>
                  <span style={{ font: 'var(--type-body-sm)', fontSize: '12px' }}>
                    <b style={{ color: 'var(--text-strong)' }}>Tỉnh {s.code}</b>
                    <span style={{ color: 'var(--text-muted)' }}> — thiếu {formatInt(s.missing)} / {formatInt(s.expected)} biển</span>
                  </span>
                  <Button variant="outline" size="sm" loading={recrawling === s.code}
                    disabled={recrawling !== null && recrawling !== s.code}
                    onClick={() => recrawlProvince(s.code)}>
                    Cào lại
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Phân Tích Biến Động Chuyên Sâu */}
        {hasTabs ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3, 12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                  Biến động chuyển Tab trong lượt này
                </span>
                <Badge tone="neutral">{changes ? formatInt(changes.total) : '0'} biển</Badge>
              </div>
              <div style={{ display: 'inline-flex', gap: 8 }}>
                <Button variant="ghost" size="sm" disabled={exporting || !changes?.total}
                  onClick={async () => { setExporting(true); try { await exportVpaRunChangesCsv(run.id, { reason }); } catch (e) { notify?.(e.message); } finally { setExporting(false); } }}>
                  <Download size={13} style={{ marginRight: 4 }} />
                  {exporting ? 'Đang xuất…' : 'Xuất CSV'}
                </Button>
                <Button variant="outline" size="sm" loading={revert.isPending} disabled={!changes?.total}
                  onClick={() => window.confirm('Hoàn tác: trả các biển đã đổi tab trong lượt này về tab cũ (bỏ qua biển Admin đã khóa tab hoặc đã đổi tiếp). Tiếp tục?')
                    && act(() => revert.mutateAsync(run.id), (r) => `Đã hoàn tác ${r?.reverted ?? 0} biển`)}>
                  <RotateCcw size={13} style={{ marginRight: 4 }} />
                  Hoàn tác lượt này
                </Button>
              </div>
            </div>

            {/* Thanh lọc lý do & Tìm kiếm nhanh biển số */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {reasons.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                  {[['', 'Tất cả'], ...reasons.map(([k, n]) => [k, `${VPA_CHANGE_REASONS[k] || k} (${n})`])].map(([k, label]) => (
                    <button key={k || 'all'} type="button" onClick={() => { setReason(k); setPage(1); }}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-pill)',
                        padding: '4px 10px',
                        font: 'var(--type-caption)',
                        fontSize: '11px',
                        background: reason === k ? 'var(--action-primary, #C75B00)' : 'var(--surface-sunken, #f3f4f6)',
                        color: reason === k ? 'var(--action-primary-text, #ffffff)' : 'var(--text-body)',
                        fontWeight: reason === k ? 'var(--fw-bold)' : 'normal',
                        transition: 'background 0.2s ease',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input tìm kiếm nhanh biển số */}
              <div style={{ position: 'relative', width: 170 }}>
                <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Lọc biển số…"
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value)}
                  style={{
                    width: '100%',
                    height: 28,
                    padding: '0 8px 0 26px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid var(--border-hairline)',
                    background: 'var(--white)',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Bảng danh sách biển đổi tab */}
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card, 8px)', boxShadow: 'var(--shadow-inset-hairline)', border: '1px solid var(--border-hairline)', overflowX: 'auto' }}>
              <div style={{ minWidth: 480 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr 1.3fr 1.5fr', gap: 8, padding: '9px 14px', background: 'var(--surface-sunken, #f9fafb)', font: 'var(--type-caption)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', fontSize: '11px', borderBottom: '1px solid var(--border-hairline)' }}>
                  <span>Biển số</span>
                  <span>Loại xe</span>
                  <span>Chuyển đổi Tab</span>
                  <span>Lý do ghi nhận</span>
                </div>
                {isLoading && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Đang tải danh sách biển đổi tab…</div>}
                {!isLoading && displayedChanges.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {searchPlate ? `Không tìm thấy biển số nào khớp với "${searchPlate}"` : 'Lượt này không có biển nào bị chuyển tab.'}
                  </div>
                )}
                {displayedChanges.map((c, i) => (
                  <div key={`${c.plateId}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr 1.3fr 1.5fr', gap: 8, padding: '8px 14px', borderTop: i > 0 ? '1px solid var(--grey-100, #f3f4f6)' : 'none', font: 'var(--type-body-sm)', fontSize: '12px', alignItems: 'center' }}>
                    <b style={{ color: 'var(--text-strong)', letterSpacing: '0.02em' }}>{c.plateNumber}</b>
                    <span style={{ color: 'var(--text-muted)' }}>{isCar(c.vehicle) ? 'Ô tô' : 'Xe máy'}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ padding: '1px 5px', borderRadius: 3, background: 'var(--grey-100, #f3f4f6)', fontSize: '11px' }}>
                        {c.fromTab ? VPA_TAB_LABELS[c.fromTab] : 'Mới'}
                      </span>
                      <ArrowRight size={11} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ padding: '1px 5px', borderRadius: 3, background: srcCfg.pillBg, color: srcCfg.color, fontWeight: 'var(--fw-semibold)', fontSize: '11px' }}>
                        {VPA_TAB_LABELS[c.toTab]}
                      </span>
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      {VPA_CHANGE_REASONS[c.reason] || c.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {totalPages > 1 && !searchPlate && <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />}
          </div>
        ) : (
          /* Nguồn 3: Kết quả đấu giá - Trình bày phân tích biến động kết quả chi tiết */
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-card, 8px)',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: srcCfg.pillBg,
                  color: srcCfg.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Gavel size={15} />
              </div>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                Chi tiết biến động Kết quả đấu giá (Kho giá thị trường)
              </span>
            </div>

            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Lượt cào này quét trực tiếp từ bảng <b>Kết quả đấu giá công khai</b> của VPA. Các bản ghi kết quả này được lưu trữ độc lập vào bảng dữ liệu{' '}
              <code style={{ background: 'var(--grey-100, #f3f4f6)', padding: '2px 5px', borderRadius: 4, fontSize: '11px' }}>vpa_auction_results</code>,
              đóng vai trò là <b>Nguồn chân lý về giá đấu giá thực tế</b> để định giá tự động cho các biển tương đồng trên toàn sàn.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 4 }}>
              <div style={{ background: 'var(--surface-sunken, #f9fafb)', borderRadius: 6, padding: '10px 12px', border: '1px solid var(--grey-100)' }}>
                <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Biến động nạp mới</span>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--status-success-ink, #1B7A5A)', fontWeight: 'var(--fw-bold)' }}>
                  +{formatInt(run.inserted)} phiên đấu giá mới
                </span>
                <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                  Phiên vừa kết thúc được bổ sung vào kho mẫu
                </span>
              </div>

              <div style={{ background: 'var(--surface-sunken, #f9fafb)', borderRadius: 6, padding: '10px 12px', border: '1px solid var(--grey-100)' }}>
                <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Biến động cập nhật</span>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--action-primary, #C75B00)', fontWeight: 'var(--fw-bold)' }}>
                  {formatInt(run.updated)} phiên được cập nhật
                </span>
                <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                  Đồng bộ giá trúng và trạng thái kết thúc
                </span>
              </div>

              <div style={{ background: 'var(--surface-sunken, #f9fafb)', borderRadius: 6, padding: '10px 12px', border: '1px solid var(--grey-100)' }}>
                <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Tác động định giá</span>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--action-primary, #C75B00)', fontWeight: 'var(--fw-bold)' }}>
                  Tự động làm tươi mẫu
                </span>
                <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                  Cập nhật gợi ý giá & cờ Đề xuất đổi giá (Drifted)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
