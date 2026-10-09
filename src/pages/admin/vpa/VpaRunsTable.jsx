import { useState, useMemo } from 'react';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { Badge, Checkbox, Select } from '../../../components/index.jsx';
import VpaRunDetail from './VpaRunDetail.jsx';
import { useVpaRunSearch, exportVpaRunsCsv } from '../../../services/adminVpa.js';
import {
  VPA_SOURCES,
  VPA_RUN_STATUS,
  VPA_RUN_STATUS_TONE,
  formatDateTime,
  formatDuration,
  formatInt,
  isCar,
  vpaRunNote,
  vpaScheduleWindowLabel,
} from '../../../lib/vpaFormat.js';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Gauge,
  Layers,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

const PAGE_SIZE = 20;
const RESUME_WINDOW_MS = 6 * 3600 * 1000; // Khớp VpaRunSupport.ResumeWindow ở backend

// Phân bổ 9 cột cân đối theo tỷ lệ, co giãn tự nhiên trên màn hình rộng
const COLS = 'minmax(160px, 1.15fr) minmax(180px, 1.35fr) minmax(150px, 1.1fr) minmax(135px, 1fr) minmax(160px, 1.2fr) minmax(150px, 1.1fr) minmax(130px, 0.95fr) minmax(170px, 1.25fr) minmax(130px, 0.9fr)';

const ALL = { value: '', label: 'Tất cả' };
const SOURCE_OPTS = [ALL, ...VPA_SOURCES.map((s) => ({ value: String(s.id), label: s.label }))];
const VEHICLE_OPTS = [ALL, { value: 'Car', label: 'Ô tô' }, { value: 'MotorBike', label: 'Xe máy' }];
const STATUS_OPTS = [ALL, ...Object.entries(VPA_RUN_STATUS).map(([value, label]) => ({ value, label }))];
const dateField = {
  height: 36,
  border: '1px solid var(--border-hairline)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--white)',
  padding: '0 10px',
  font: 'var(--type-caption)',
  color: 'var(--text-strong)',
  outline: 'none',
};

export default function VpaRunsTable({ notify, onRun, settings }) {
  const [f, setF] = useState({ source: '', vehicle: '', status: '', onlyProblems: false, from: '', to: '' });
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [exporting, setExporting] = useState(false);

  const params = { ...f, onlyProblems: f.onlyProblems || undefined, page, limit: PAGE_SIZE };
  const { data, isLoading, isError, refetch } = useVpaRunSearch(params);
  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));
  const setFilter = (k) => (v) => {
    setF((x) => ({ ...x, [k]: v }));
    setPage(1);
  };

  const rerun = (r) => {
    const src = VPA_SOURCES.find((s) => s.id === r.source);
    onRun({ source: src.key, vehicle: r.vehicle == null ? undefined : isCar(r.vehicle) ? 'Car' : 'MotorBike' }, src);
  };

  const doExport = async () => {
    setExporting(true);
    try {
      await exportVpaRunsCsv({ ...f, onlyProblems: f.onlyProblems || undefined });
      notify?.('Đã xuất file CSV lịch sử lượt chạy');
    } catch (e) {
      notify?.(e.message || 'Xuất CSV thất bại');
    } finally {
      setExporting(false);
    }
  };

  // Thống kê nhanh từ danh sách hiện tại để hỗ trợ người vận hành
  const stats = useMemo(() => {
    if (!items.length) return null;
    let success = 0;
    let inserted = 0;
    let updated = 0;
    let pages = 0;
    items.forEach((it) => {
      if (it.status === 1 || it.complete) success++;
      inserted += it.inserted || 0;
      updated += it.updated || 0;
      pages += it.pagesFetched || 0;
    });
    return {
      successRate: Math.round((success / items.length) * 100),
      totalInserted: inserted,
      totalUpdated: updated,
      totalPages: pages,
    };
  }, [items]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Tiêu đề & KPI tóm tắt */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Activity size={20} style={{ color: 'var(--action-primary)' }} />
            <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>
              Lịch sử các lượt chạy {data ? `(${formatInt(data.total)})` : ''}
            </h2>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Theo dõi chi tiết tiến độ, tốc độ crawl, số lượng biển mới và độ ổn định của từng phiên đồng bộ
          </span>
        </div>

        {stats && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-pill)',
                font: 'var(--type-caption)',
              }}
            >
              <CheckCircle2 size={14} style={{ color: 'var(--status-success-ink, #16a34a)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ đạt:</span>
              <strong style={{ color: 'var(--text-strong)' }}>{stats.successRate}%</strong>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'var(--surface-tint-cream)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-pill)',
                font: 'var(--type-caption)',
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--action-primary)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Mới trang này:</span>
              <strong style={{ color: 'var(--action-primary)' }}>+{formatInt(stats.totalInserted)}</strong>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-pill)',
                font: 'var(--type-caption)',
              }}
            >
              <Layers size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Đã cào:</span>
              <strong style={{ color: 'var(--text-strong)' }}>{formatInt(stats.totalPages)} trang</strong>
            </div>
          </div>
        )}
      </div>

      {/* Thanh bộ lọc */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 'var(--space-3)',
          background: 'var(--white)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          border: '1px solid var(--border-hairline)',
        }}
      >
        <Select label="Nguồn dữ liệu" value={f.source} options={SOURCE_OPTS} onChange={setFilter('source')} />
        <Select label="Loại xe" value={f.vehicle} options={VEHICLE_OPTS} onChange={setFilter('vehicle')} />
        <Select label="Trạng thái" value={f.status} options={STATUS_OPTS} onChange={setFilter('status')} />

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Từ ngày
          <input type="date" value={f.from} onChange={(e) => setFilter('from')(e.target.value)} style={dateField} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Đến ngày
          <input type="date" value={f.to} onChange={(e) => setFilter('to')(e.target.value)} style={dateField} />
        </label>

        <div style={{ display: 'flex', alignItems: 'center', height: 36, paddingBottom: 2 }}>
          <Checkbox
            checked={f.onlyProblems}
            onChange={(v) => setFilter('onlyProblems')(!!v)}
            label="Chỉ lượt lỗi / chưa đủ / có ghi chú"
          />
        </div>

        <div style={{ flex: 1 }} />

        <Button
          variant="outline"
          size="md"
          disabled={exporting}
          onClick={doExport}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36 }}
        >
          <Download size={14} />
          {exporting ? 'Đang xuất CSV…' : 'Xuất CSV'}
        </Button>
      </div>

      {/* Bảng dữ liệu Grid cách đều chuẩn responsive */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          border: '1px solid var(--border-hairline)',
          overflowX: 'auto',
        }}
      >
        <div style={{ minWidth: 1280 }}>
          {/* Header bảng */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: COLS,
              gap: 12,
              padding: '12px 18px',
              background: 'var(--surface-sunken)',
              borderBottom: '1px solid var(--border-hairline)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-bold)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--text-muted)',
              alignItems: 'center',
            }}
          >
            <span>Thời gian & Thời lượng</span>
            <span>Nguồn & Loại xe</span>
            <span>Trạng thái & Nguồn gốc</span>
            <span>Tiến độ cào (Tỉnh · Trang)</span>
            <span>Quét thấy / Dự kiến</span>
            <span>Biến động (Mới · Sửa)</span>
            <span>Tốc độ & Hiệu suất</span>
            <span>Ghi chú / Báo lỗi</span>
            <span style={{ textAlign: 'right' }}>Thao tác</span>
          </div>

          {isLoading && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--action-primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              <span>Đang tải lịch sử các lượt chạy…</span>
            </div>
          )}

          {isError && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={24} />
              <span>Không tải được lịch sử lượt chạy.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              Không có lượt chạy nào khớp bộ lọc tìm kiếm.
            </div>
          )}

          {items.map((r, idx) => {
            const src = VPA_SOURCES.find((s) => s.id === r.source);
            const dur = r.finishedAt ? new Date(r.finishedAt) - new Date(r.startedAt) : null;
            const unfinished = (r.status === 2 || r.status === 3) && !r.complete && !r.options && !r.dryRun;
            const resumable = unfinished && Date.now() - new Date(r.startedAt).getTime() < RESUME_WINDOW_MS;
            const text = r.error || vpaRunNote(r.note);

            // Các chỉ số tính toán thêm hữu ích
            const durSec = dur ? Math.max(1, Math.round(dur / 1000)) : null;
            const itemsPerSec = durSec && r.itemsSeen ? Math.round(r.itemsSeen / durSec) : null;
            const pagesPerMin = durSec && r.pagesFetched ? Math.round((r.pagesFetched / durSec) * 60) : null;
            const completionPct = r.itemsExpected > 0 ? Math.min(100, Math.round((r.itemsSeen / r.itemsExpected) * 100)) : (r.itemsSeen > 0 ? 100 : 0);
            const isFinished = !!r.finishedAt;

            return (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: COLS,
                  gap: 12,
                  padding: '12px 18px',
                  borderTop: idx > 0 ? '1px solid var(--border-hairline)' : 'none',
                  background: idx % 2 === 1 ? 'rgba(0,0,0,0.012)' : 'var(--white)',
                  font: 'var(--type-body-sm)',
                  alignItems: 'center',
                  transition: 'background-color 140ms ease',
                }}
              >
                {/* Cột 1: Thời gian & Thời lượng */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                    <Clock size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span>{formatDateTime(r.startedAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--surface-sunken)',
                        font: 'var(--type-caption)',
                        fontSize: '11px',
                        color: 'var(--text-strong)',
                      }}
                    >
                      {dur != null ? formatDuration(dur) : r.status === 0 ? '⚡ Đang chạy…' : '—'}
                    </span>
                    {isFinished && (
                      <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-faint)' }}>
                        Xong lúc {new Date(r.finishedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cột 2: Nguồn & Loại xe */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                    {src?.label || 'Nguồn khác'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: isCar(r.vehicle) ? 'var(--blue-50, #eff6ff)' : 'var(--mint-50, #ecfdf5)',
                        color: isCar(r.vehicle) ? 'var(--blue-700, #1d4ed8)' : 'var(--status-success-ink, #065f46)',
                        font: 'var(--type-caption)',
                        fontSize: '11px',
                        fontWeight: 'var(--fw-medium)',
                      }}
                    >
                      {r.vehicle == null ? 'Cả hai loại' : isCar(r.vehicle) ? '🚗 Ô tô' : '🏍️ Xe máy'}
                    </span>
                    {settings && (
                      <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {vpaScheduleWindowLabel(settings, r.source)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cột 3: Trạng thái & Khởi tạo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                  <Badge tone={VPA_RUN_STATUS_TONE[r.status] || 'neutral'}>
                    {VPA_RUN_STATUS[r.status]}
                    {r.complete ? ' ✓ đủ' : ''}
                  </Badge>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge tone={r.triggeredBy === 'schedule' ? 'blue' : 'orange'}>
                      {r.triggeredBy === 'schedule' ? '⏱ Tự động' : `✋ ${r.triggeredBy?.replace('admin:', '') || 'Admin'}`}
                    </Badge>
                    {r.dryRun && <Badge tone="amber">Thử nghiệm</Badge>}
                    {r.options && <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--action-primary)' }}>{r.options}</span>}
                  </div>
                </div>

                {/* Cột 4: Tiến độ cào (Tỉnh · Trang) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                      {r.slicesTotal ? `${r.slicesDone}/${r.slicesTotal} tỉnh` : 'Toàn quốc'}
                    </span>
                  </div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    <strong>{formatInt(r.pagesFetched)}</strong> trang
                  </span>
                  {r.currentSlice && (
                    <span style={{ font: 'var(--type-caption)', fontSize: '10px', color: 'var(--action-primary)' }}>
                      Đang: {r.currentSlice}
                    </span>
                  )}
                </div>

                {/* Cột 5: Quét thấy / Dự kiến */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <strong style={{ color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatInt(r.itemsSeen)}
                    </strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      / {formatInt(r.itemsExpected)}
                    </span>
                  </div>

                  {/* Thanh tiến độ mini trực quan */}
                  <div
                    style={{
                      height: 4,
                      width: '100%',
                      maxWidth: 120,
                      background: 'var(--grey-200)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${completionPct}%`,
                        background: r.itemsMissing > 0 ? 'var(--status-danger)' : 'var(--status-success)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {r.itemsMissing > 0 ? (
                      <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--status-danger)', fontWeight: 'var(--fw-semibold)' }}>
                        Thiếu {formatInt(r.itemsMissing)} biển
                      </span>
                    ) : (
                      <span style={{ font: 'var(--type-caption)', fontSize: '10px', color: 'var(--status-success-ink, #16a34a)' }}>
                        {completionPct}% đạt chuẩn
                      </span>
                    )}
                  </div>
                </div>

                {/* Cột 6: Biến động (Mới · Cập nhật) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: r.inserted > 0 ? 'var(--status-success-bg, #dcfce7)' : 'var(--surface-sunken)',
                        color: r.inserted > 0 ? 'var(--status-success-ink, #166534)' : 'var(--text-muted)',
                        fontWeight: r.inserted > 0 ? 'var(--fw-bold)' : 'var(--fw-normal)',
                        font: 'var(--type-caption)',
                        fontSize: '11px',
                      }}
                    >
                      +{formatInt(r.inserted)} mới
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{formatInt(r.updated)} sửa</span>
                    {r.tabChanges > 0 && (
                      <span style={{ color: 'var(--action-primary)', fontWeight: 'var(--fw-medium)' }}>
                        · {formatInt(r.tabChanges)} đổi tab
                      </span>
                    )}
                  </div>
                </div>

                {/* Cột 7: Tốc độ & Hiệu suất (MỚI THÊM) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {itemsPerSec != null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Zap size={12} style={{ color: 'var(--action-primary)' }} />
                      <strong style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-strong)' }}>
                        ~{itemsPerSec}
                      </strong>
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>biển/s</span>
                    </div>
                  ) : (
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>—</span>
                  )}

                  {pagesPerMin != null && (
                    <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      ~{pagesPerMin} trang/phút
                    </span>
                  )}

                  {r.rounds > 1 && (
                    <span style={{ font: 'var(--type-caption)', fontSize: '10px', color: 'var(--text-faint)' }}>
                      {r.rounds} vòng tải bù
                    </span>
                  )}
                </div>

                {/* Cột 8: Ghi chú / Báo lỗi */}
                <div style={{ minWidth: 0 }}>
                  {text ? (
                    <div
                      title={text}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: r.error ? 'var(--rose-50, #fff1f2)' : 'var(--surface-sunken)',
                        color: r.error ? 'var(--status-danger)' : 'var(--text-body)',
                        fontSize: '12px',
                        lineHeight: 1.35,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        border: r.error ? '1px solid rgba(229,72,77,0.2)' : 'none',
                      }}
                    >
                      {text}
                    </div>
                  ) : (
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Bình thường</span>
                  )}
                </div>

                {/* Cột 9: Thao tác */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetail(r)}
                    style={{ height: 30, padding: '0 10px', fontSize: '12px' }}
                  >
                    Chi tiết
                  </Button>
                  {unfinished && (
                    <Button
                      variant={resumable ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => rerun(r)}
                      style={{ height: 30, padding: '0 10px', fontSize: '12px' }}
                    >
                      {resumable ? 'Tiếp tục' : 'Chạy lại'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />}
      {detail && <VpaRunDetail run={detail} onClose={() => setDetail(null)} notify={notify} />}
    </div>
  );
}
