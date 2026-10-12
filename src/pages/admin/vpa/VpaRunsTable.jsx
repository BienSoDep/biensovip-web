import { useState, useMemo } from 'react';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { Badge, Checkbox, Select, TableColumnMenu, TableSortHeader, useTableColumns, sortTableItems } from '../../../components/index.jsx';
import VpaRunDetail from './VpaRunDetail.jsx';
import VpaCrawlCharts from './VpaCrawlCharts.jsx';
import { useVpaRunSearch, exportVpaRunsCsv } from '../../../services/adminVpa.js';
import {
  VPA_SOURCES,
  getVpaSourceConfig,
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
  Clock,
  Download,
  Layers,
  Zap,
  Car,
  Bike,
  Check,
  CheckCircle2,
  Sparkles,
  User,
  CalendarDays,
  Gavel,
} from 'lucide-react';

const PAGE_SIZE = 20;
const RESUME_WINDOW_MS = 6 * 3600 * 1000; // Khớp VpaRunSupport.ResumeWindow ở backend

const VPA_RUN_COLUMNS = [
  { key: 'time', label: 'Thời gian & Thời lượng', default: true },
  { key: 'source', label: 'Nguồn & Loại xe', default: true },
  { key: 'status', label: 'Trạng thái & Nguồn gốc', default: true },
  { key: 'progress', label: 'Tiến độ cào', default: true },
  { key: 'volume', label: 'Quét thấy / Dự kiến', default: true },
  { key: 'mutation', label: 'Biến động (Mới · Sửa)', default: true },
  { key: 'speed', label: 'Tốc độ & Hiệu suất', default: true },
  { key: 'note', label: 'Ghi chú / Báo lỗi', default: true },
  { key: 'actions', label: 'Thao tác', default: true, lock: true },
];

function formatTriggeredBy(val) {
  if (!val) return 'Admin';
  const clean = String(val).replace(/^admin:/i, '').trim();
  if (clean.includes('@')) {
    const user = clean.split('@')[0];
    return user.length > 14 ? `${user.slice(0, 12)}…` : user;
  }
  return clean.length > 14 ? `${clean.slice(0, 12)}…` : clean;
}

const ALL = { value: '', label: 'Tất cả' };
const SOURCE_OPTS = [ALL, ...VPA_SOURCES.map((s) => ({ value: String(s.id), label: s.note ? `${s.label} (${s.note})` : s.label }))];
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
  const [sort, setSort] = useState({ key: 'time', dir: 'desc' });

  const { isVisible, colMenuProps } = useTableColumns({
    storageKey: 'bsv.admin.vpaRunsCols',
    columns: VPA_RUN_COLUMNS,
  });

  const params = { ...f, onlyProblems: f.onlyProblems || undefined, page, limit: PAGE_SIZE };
  const { data, isLoading, isError, refetch } = useVpaRunSearch(params);
  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));
  const setFilter = (k) => (v) => {
    setF((x) => ({ ...x, [k]: v }));
    setPage(1);
  };

  const sortedItems = useMemo(() => {
    return sortTableItems(items, sort.key, sort.dir, {
      time: (r) => (r.startedAt ? new Date(r.startedAt).getTime() : 0),
      source: (r) => r.source || 0,
      status: (r) => r.status || 0,
      progress: (r) => r.pagesFetched || 0,
      volume: (r) => r.itemsSeen || 0,
      mutation: (r) => (r.inserted || 0) + (r.updated || 0),
      speed: (r) => {
        const dur = r.finishedAt ? new Date(r.finishedAt) - new Date(r.startedAt) : null;
        const durSec = dur ? Math.max(1, Math.round(dur / 1000)) : null;
        return durSec && r.itemsSeen ? Math.round(r.itemsSeen / durSec) : 0;
      },
      note: (r) => (r.error || r.note || '').toLowerCase(),
    });
  }, [items, sort]);

  const gridCols = useMemo(() => {
    const parts = [];
    if (isVisible('time')) parts.push('minmax(160px, 1.15fr)');
    if (isVisible('source')) parts.push('minmax(175px, 1.25fr)');
    if (isVisible('status')) parts.push('minmax(160px, 1.15fr)');
    if (isVisible('progress')) parts.push('minmax(140px, 1fr)');
    if (isVisible('volume')) parts.push('minmax(155px, 1.1fr)');
    if (isVisible('mutation')) parts.push('minmax(145px, 1.05fr)');
    if (isVisible('speed')) parts.push('minmax(125px, 0.9fr)');
    if (isVisible('note')) parts.push('minmax(165px, 1.2fr)');
    if (isVisible('actions')) parts.push('minmax(115px, 0.85fr)');
    return parts.length ? parts.join(' ') : '1fr';
  }, [isVisible]);

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

      {/* Biểu đồ theo dõi tiến độ và lịch sử crawl data */}
      <VpaCrawlCharts items={items} onSelectRun={(r) => setDetail(r)} />

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

        <TableColumnMenu {...colMenuProps} />

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
        <div style={{ minWidth: 1380 }}>
          {/* Header bảng */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
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
            {isVisible('time') && (
              <TableSortHeader label="Thời gian & Thời lượng" sortKey="time" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            )}
            {isVisible('source') && (
              <TableSortHeader label="Nguồn & Loại xe" sortKey="source" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            )}
            {isVisible('status') && (
              <TableSortHeader label="Trạng thái & Nguồn gốc" sortKey="status" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            )}
            {isVisible('progress') && (
              <TableSortHeader label="Tiến độ cào (Tỉnh · Trang)" sortKey="progress" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            )}
            {isVisible('volume') && (
              <TableSortHeader label="Quét thấy / Dự kiến" sortKey="volume" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            )}
            {isVisible('mutation') && (
              <TableSortHeader label="Biến động (Mới · Sửa)" sortKey="mutation" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            )}
            {isVisible('speed') && (
              <TableSortHeader label="Tốc độ & Hiệu suất" sortKey="speed" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            )}
            {isVisible('note') && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ghi chú / Báo lỗi</span>}
            {isVisible('actions') && <span style={{ textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Thao tác</span>}
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

          {!isLoading && !isError && sortedItems.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              Không có lượt chạy nào khớp bộ lọc tìm kiếm.
            </div>
          )}

          {sortedItems.map((r, idx) => {
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
                  gridTemplateColumns: gridCols,
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
                {isVisible('time') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                      <Clock size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDateTime(r.startedAt)}</span>
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
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {dur != null ? formatDuration(dur) : r.status === 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Zap size={11} />Đang chạy…
                          </span>
                        ) : '—'}
                      </span>
                      {isFinished && (
                        <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                          Xong {new Date(r.finishedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Cột 2: Nguồn & Loại xe */}
                {isVisible('source') && (() => {
                  const srcCfg = getVpaSourceConfig(r.source);
                  const SrcIcon = r.source === 1 ? CalendarDays : r.source === 2 ? Layers : r.source === 3 ? Gavel : Layers;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        {/* Kí hiệu đặc biệt 3 màu pastel phía trước */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3.5,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-pill)',
                            background: srcCfg.bg,
                            border: `1px solid ${srcCfg.border}`,
                            color: srcCfg.color,
                            font: 'var(--type-caption)',
                            fontSize: '11px',
                            fontWeight: 'var(--fw-bold)',
                            lineHeight: 1.2,
                            flexShrink: 0,
                            letterSpacing: '0.02em',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          }}
                          title={`${srcCfg.label} (${srcCfg.note}) — ${srcCfg.desc}`}
                        >
                          <SrcIcon size={12} strokeWidth={2.4} />
                          <span>{srcCfg.tag}</span>
                        </span>
                        <span
                          style={{
                            fontWeight: 'var(--fw-bold)',
                            color: 'var(--text-strong)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {src?.label || 'Nguồn khác'}
                        </span>
                      </div>
                      {src?.note && (
                        <span
                          style={{
                            font: 'var(--type-caption)',
                            color: srcCfg.color,
                            fontSize: '11px',
                            fontWeight: 'var(--fw-semibold)',
                            marginTop: -1,
                            paddingLeft: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {src.note}
                        </span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 1 }}>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: isCar(r.vehicle) ? 'var(--blue-50, #eff6ff)' : 'var(--mint-50, #ecfdf5)',
                            color: isCar(r.vehicle) ? 'var(--blue-700, #1d4ed8)' : 'var(--status-success-ink, #065f46)',
                            font: 'var(--type-caption)',
                            fontSize: '11px',
                            fontWeight: 'var(--fw-medium)',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {r.vehicle == null ? 'Cả hai' : isCar(r.vehicle) ? (
                            <>
                              <Car size={12} /> Ô tô
                            </>
                          ) : (
                            <>
                              <Bike size={12} /> Xe máy
                            </>
                          )}
                        </span>
                        {settings && (
                          <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {vpaScheduleWindowLabel(settings, r.source)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Cột 3: Trạng thái & Khởi tạo */}
                {isVisible('status') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                    <Badge tone={VPA_RUN_STATUS_TONE[r.status] || 'neutral'}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {VPA_RUN_STATUS[r.status]}
                        {r.complete && (
                          <>
                            <Check size={11} /> đủ
                          </>
                        )}
                      </span>
                    </Badge>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', maxWidth: '100%', minWidth: 0 }}>
                      <Badge
                        tone={r.triggeredBy === 'schedule' ? 'blue' : 'orange'}
                        title={r.triggeredBy ? `Người chạy: ${r.triggeredBy}` : undefined}
                        style={{
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {r.triggeredBy === 'schedule' ? (
                            <>
                              <Clock size={11} /> Tự động
                            </>
                          ) : (
                            <>
                              <User size={11} /> {formatTriggeredBy(r.triggeredBy)}
                            </>
                          )}
                        </span>
                      </Badge>
                      {r.dryRun && <Badge tone="amber">Thử nghiệm</Badge>}
                      {r.options && (
                        <span
                          title={r.options}
                          style={{
                            font: 'var(--type-caption)',
                            fontSize: '11px',
                            color: 'var(--action-primary)',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.options}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Cột 4: Tiến độ cào (Tỉnh · Trang) */}
                {isVisible('progress') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, minWidth: 0 }}>
                      <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.slicesTotal ? `${r.slicesDone}/${r.slicesTotal} tỉnh` : 'Toàn quốc'}
                      </span>
                    </div>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <strong>{formatInt(r.pagesFetched)}</strong> trang
                    </span>
                    {r.currentSlice && (
                      <span
                        title={`Đang: ${r.currentSlice}`}
                        style={{
                          font: 'var(--type-caption)',
                          fontSize: '10px',
                          color: 'var(--action-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}
                      >
                        Đang: {r.currentSlice}
                      </span>
                    )}
                  </div>
                )}

                {/* Cột 5: Quét thấy / Dự kiến */}
                {isVisible('volume') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, minWidth: 0 }}>
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

                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', minWidth: 0 }}>
                      {r.itemsMissing > 0 ? (
                        <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--status-danger)', fontWeight: 'var(--fw-semibold)', whiteSpace: 'nowrap' }}>
                          Thiếu {formatInt(r.itemsMissing)} biển
                        </span>
                      ) : (
                        <span style={{ font: 'var(--type-caption)', fontSize: '10px', color: 'var(--status-success-ink, #16a34a)', whiteSpace: 'nowrap' }}>
                          {completionPct}% đạt chuẩn
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Cột 6: Biến động (Mới · Cập nhật) */}
                {isVisible('mutation') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
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
                          whiteSpace: 'nowrap',
                        }}
                      >
                        +{formatInt(r.inserted)} mới
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <span>{formatInt(r.updated)} sửa</span>
                      {r.tabChanges > 0 && (
                        <span style={{ color: 'var(--action-primary)', fontWeight: 'var(--fw-medium)' }}>
                          · {formatInt(r.tabChanges)} đổi tab
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Cột 7: Tốc độ & Hiệu suất */}
                {isVisible('speed') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
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
                      <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        ~{pagesPerMin} trang/phút
                      </span>
                    )}

                    {r.rounds > 1 && (
                      <span style={{ font: 'var(--type-caption)', fontSize: '10px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                        {r.rounds} vòng tải bù
                      </span>
                    )}
                  </div>
                )}

                {/* Cột 8: Ghi chú / Báo lỗi */}
                {isVisible('note') && (
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
                )}

                {/* Cột 9: Thao tác */}
                {isVisible('actions') && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap', minWidth: 0 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetail(r)}
                      style={{ height: 30, padding: '0 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Chi tiết
                    </Button>
                    {unfinished && (
                      <Button
                        variant={resumable ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => rerun(r)}
                        style={{ height: 30, padding: '0 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                      >
                        {resumable ? 'Tiếp tục' : 'Chạy lại'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />}
      {detail && <VpaRunDetail run={detail} onClose={() => setDetail(null)} notify={notify} settings={settings} />}
    </div>
  );
}
