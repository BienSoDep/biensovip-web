import { useState } from 'react';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { Badge, Checkbox, Select } from '../../../components/index.jsx';
import VpaRunDetail from './VpaRunDetail.jsx';
import { useVpaRunSearch, exportVpaRunsCsv } from '../../../services/adminVpa.js';
import { VPA_SOURCES, VPA_RUN_STATUS, VPA_RUN_STATUS_TONE, formatDateTime, formatDuration, formatInt, isCar, vpaRunNote, vpaScheduleWindowLabel } from '../../../lib/vpaFormat.js';

const PAGE_SIZE = 20;
const RESUME_WINDOW_MS = 6 * 3600 * 1000; // khớp VpaRunSupport.ResumeWindow ở backend
const COLS = '150px 130px 150px 100px 130px 110px 90px minmax(160px,1fr) 150px';
const ALL = { value: '', label: 'Tất cả' };
const SOURCE_OPTS = [ALL, ...VPA_SOURCES.map((s) => ({ value: String(s.id), label: s.label }))];
const VEHICLE_OPTS = [ALL, { value: 'Car', label: 'Ô tô' }, { value: 'MotorBike', label: 'Xe máy' }];
const STATUS_OPTS = [ALL, ...Object.entries(VPA_RUN_STATUS).map(([value, label]) => ({ value, label }))];
const dateField = { height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 8px', font: 'var(--type-caption)' };

// Lịch sử lượt chạy: lọc (nguồn, loại xe, trạng thái, chỉ lỗi, ngày), phân trang, xuất CSV, xem chi tiết/thay đổi, tiếp tục hoặc chạy lại.
export default function VpaRunsTable({ notify, onRun, settings }) {
  const [f, setF] = useState({ source: '', vehicle: '', status: '', onlyProblems: false, from: '', to: '' });
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [exporting, setExporting] = useState(false);
  const params = { ...f, onlyProblems: f.onlyProblems || undefined, page, limit: PAGE_SIZE };
  const { data, isLoading, isError, refetch } = useVpaRunSearch(params);
  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));
  const setFilter = (k) => (v) => { setF((x) => ({ ...x, [k]: v })); setPage(1); };

  const rerun = (r) => {
    const src = VPA_SOURCES.find((s) => s.id === r.source);
    onRun({ source: src.key, vehicle: r.vehicle == null ? undefined : isCar(r.vehicle) ? 'Car' : 'MotorBike' }, src);
  };
  const doExport = async () => {
    setExporting(true);
    try { await exportVpaRunsCsv({ ...f, onlyProblems: f.onlyProblems || undefined }); } catch (e) { notify?.(e.message); } finally { setExporting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Lịch sử các lượt chạy {data ? `(${formatInt(data.total)})` : ''}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <Select label="Nguồn" value={f.source} options={SOURCE_OPTS} onChange={setFilter('source')} />
        <Select label="Loại xe" value={f.vehicle} options={VEHICLE_OPTS} onChange={setFilter('vehicle')} />
        <Select label="Trạng thái" value={f.status} options={STATUS_OPTS} onChange={setFilter('status')} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Từ ngày<input type="date" value={f.from} onChange={(e) => setFilter('from')(e.target.value)} style={dateField} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Đến ngày<input type="date" value={f.to} onChange={(e) => setFilter('to')(e.target.value)} style={dateField} />
        </label>
        <Checkbox checked={f.onlyProblems} onChange={(v) => setFilter('onlyProblems')(!!v)} label="Chỉ lượt lỗi / chưa đủ / có ghi chú" />
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="md" disabled={exporting} onClick={doExport}>{exporting ? 'Đang xuất…' : 'Xuất CSV'}</Button>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflowX: 'auto' }}>
        <div style={{ minWidth: 1120 }}>
          <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: 8, padding: '10px 16px', background: 'var(--surface-sunken)', font: 'var(--type-caption)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)' }}>
            <span>Bắt đầu</span><span>Nguồn / Xe</span><span>Trạng thái</span><span>Tỉnh · Trang</span><span>Đã thấy / Dự kiến</span><span>Mới / Cập nhật</span><span>Thời lượng</span><span>Ghi chú / Lỗi</span><span>Thao tác</span>
          </div>
          {isLoading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>}
          {isError && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--status-danger)' }}>
              Không tải được lịch sử lượt chạy. <button type="button" onClick={() => refetch()} style={{ border: 'none', background: 'none', color: 'var(--link)', cursor: 'pointer' }}>Thử lại</button>
            </div>
          )}
          {!isLoading && !isError && items.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Không có lượt chạy nào khớp bộ lọc.</div>}
          {items.map((r) => {
            const src = VPA_SOURCES.find((s) => s.id === r.source);
            const dur = r.finishedAt ? new Date(r.finishedAt) - new Date(r.startedAt) : null;
            const unfinished = (r.status === 2 || r.status === 3) && !r.complete && !r.options && !r.dryRun;
            const resumable = unfinished && Date.now() - new Date(r.startedAt).getTime() < RESUME_WINDOW_MS;
            const text = r.error || vpaRunNote(r.note);
            return (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: COLS, gap: 8, padding: '10px 16px', borderTop: '1px solid var(--grey-100)', font: 'var(--type-body-sm)', alignItems: 'center' }}>
                <span>{formatDateTime(r.startedAt)}</span>
                <span>
                  {src?.label}<br /><span style={{ color: 'var(--text-muted)' }}>{r.vehicle == null ? '—' : isCar(r.vehicle) ? 'Ô tô' : 'Xe máy'}</span>
                  {settings && <><br /><span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{vpaScheduleWindowLabel(settings, r.source)}</span></>}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                  <Badge tone={VPA_RUN_STATUS_TONE[r.status] || 'neutral'}>{VPA_RUN_STATUS[r.status]}{r.complete ? ' ✓' : ''}</Badge>
                  {r.options && <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{r.options}</span>}
                  <Badge tone={r.triggeredBy === 'schedule' ? 'blue' : 'orange'}>{r.triggeredBy === 'schedule' ? '⏱ Tự động' : `✋ ${r.triggeredBy?.replace('admin:', '') || 'Admin'}`}</Badge>
                </span>
                <span>{r.slicesTotal ? `${r.slicesDone}/${r.slicesTotal}` : '—'}<br /><span style={{ color: 'var(--text-muted)' }}>{formatInt(r.pagesFetched)} trang</span></span>
                <span>{formatInt(r.itemsSeen)} / {formatInt(r.itemsExpected)}{r.itemsMissing > 0 && <><br /><span style={{ color: 'var(--status-danger)' }}>thiếu {formatInt(r.itemsMissing)}</span></>}</span>
                <span>{formatInt(r.inserted)} / {formatInt(r.updated)}{r.tabChanges > 0 && <><br /><span style={{ color: 'var(--text-muted)' }}>{formatInt(r.tabChanges)} đổi tab</span></>}</span>
                <span>{dur != null ? formatDuration(dur) : r.status === 0 ? 'đang chạy' : '—'}</span>
                <span title={text || ''} style={{ color: r.error ? 'var(--status-danger)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{text || '—'}</span>
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>Chi tiết</Button>
                  {unfinished && <Button variant="outline" size="sm" onClick={() => rerun(r)}>{resumable ? 'Tiếp tục' : 'Chạy lại'}</Button>}
                </span>
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
