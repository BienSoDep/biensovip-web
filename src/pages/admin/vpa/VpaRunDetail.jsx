import { useState } from 'react';
import Drawer from '../../../components/Drawer.jsx';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { Badge } from '../../../components/index.jsx';
import { useVpaRunChanges, useRevertVpaRun, useApplyVpaVanish, exportVpaRunChangesCsv } from '../../../services/adminVpa.js';
import {
  VPA_SOURCES, VPA_RUN_STATUS, VPA_RUN_STATUS_TONE, VPA_TAB_LABELS, VPA_CHANGE_REASONS, formatDateTime, formatDuration, formatInt, isCar, vpaRunNote,
} from '../../../lib/vpaFormat.js';

const KV = ({ k, v }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{k}</span>
    <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', overflowWrap: 'anywhere' }}>{v ?? '—'}</span>
  </div>
);

const PAGE_SIZE = 50;

// Chi tiết một lượt crawl: mọi con số + ghi chú/lỗi + danh mục không khớp + danh sách biển đổi tab (lọc theo lý do, xuất CSV, hoàn tác).
export default function VpaRunDetail({ run, onClose, notify }) {
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const hasTabs = run.source === 1 || run.source === 2;
  const { data: changes, isLoading } = useVpaRunChanges(hasTabs ? run.id : null, { reason, page, limit: PAGE_SIZE });
  const revert = useRevertVpaRun();
  const applyVanish = useApplyVpaVanish();
  const src = VPA_SOURCES.find((s) => s.id === run.source);
  const unmapped = (() => { try { return run.unmappedJson ? Object.entries(JSON.parse(run.unmappedJson)) : []; } catch { return []; } })();
  const duration = run.finishedAt ? new Date(run.finishedAt) - new Date(run.startedAt) : null;
  const canApplyVanish = run.source === 2 && !!run.note?.startsWith('sudden_drop') && !run.note.includes('đã xác nhận');
  const reasons = Object.entries(changes?.byReason || {});
  const totalPages = Math.max(1, Math.ceil((changes?.total || 0) / PAGE_SIZE));

  const act = async (fn, ok) => {
    try { notify?.(ok(await fn())); } catch (e) { notify?.(e.message || 'Thao tác thất bại'); }
  };

  return (
    <Drawer open onClose={onClose} title="Chi tiết lượt chạy" width="min(60%, 820px)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge tone={VPA_RUN_STATUS_TONE[run.status] || 'neutral'}>{VPA_RUN_STATUS[run.status]}{run.complete ? ' ✓ đủ' : ''}</Badge>
          {run.options && <Badge tone="blue">{run.options}</Badge>}
          {run.dryRun && <Badge tone="amber">Không ghi dữ liệu</Badge>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 'var(--space-3)' }}>
          <KV
            k="Nguồn"
            v={
              src ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span>{src.label}</span>
                  {src.note && (
                    <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary, #C75B00)', fontSize: '11px', fontWeight: 'var(--fw-semibold)' }}>
                      {src.note}
                    </span>
                  )}
                </div>
              ) : '—'
            }
          />
          <KV k="Loại xe" v={run.vehicle == null ? '—' : isCar(run.vehicle) ? 'Ô tô' : 'Xe máy'} />
          <KV k="Người chạy" v={run.triggeredBy === 'schedule' ? 'Lịch tự động' : run.triggeredBy?.replace('admin:', 'Admin: ')} />
          <KV k="Bắt đầu" v={formatDateTime(run.startedAt)} />
          <KV k="Kết thúc" v={formatDateTime(run.finishedAt)} />
          <KV k="Thời lượng" v={duration != null ? formatDuration(duration) : 'Đang chạy / chưa kết thúc'} />
          <KV k="Tỉnh đã xong" v={run.slicesTotal ? `${run.slicesDone}/${run.slicesTotal}` : '—'} />
          <KV k="Số trang đã lấy" v={formatInt(run.pagesFetched)} />
          <KV k="Đã thấy / Dự kiến" v={`${formatInt(run.itemsSeen)} / ${formatInt(run.itemsExpected)}`} />
          <KV k="Thiếu" v={formatInt(run.itemsMissing)} />
          <KV k="Mới / Cập nhật" v={`${formatInt(run.inserted)} / ${formatInt(run.updated)}`} />
          <KV k="Biển đổi tab" v={formatInt(run.tabChanges)} />
          <KV k="Vòng tải bù tối đa" v={run.rounds || '—'} />
          <KV k="Bỏ qua (khác loại xe)" v={formatInt(run.skippedForeign)} />
          <KV k="Hoạt động cuối" v={formatDateTime(run.lastActivityAt)} />
        </div>

        {run.note && (
          <div style={{ background: 'var(--amber-50)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
            <b>Ghi chú: </b>{vpaRunNote(run.note)}
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
        )}
        {run.error && (
          <div style={{ background: 'var(--rose-50)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', font: 'var(--type-body-sm)', color: 'var(--status-danger)', overflowWrap: 'anywhere' }}>
            <b>Lỗi: </b>{run.error}
          </div>
        )}
        {unmapped.length > 0 && (
          <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
            <b>Tiền tố biển chưa khớp danh mục (số biển): </b>
            {unmapped.map(([k, n]) => `${k}: ${n}`).join(' · ')}
          </div>
        )}

        {hasTabs && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Biển đổi tab trong lượt này {changes ? `(${formatInt(changes.total)})` : ''}</span>
              <span style={{ display: 'inline-flex', gap: 8 }}>
                <Button variant="ghost" size="sm" disabled={exporting || !changes?.total}
                  onClick={async () => { setExporting(true); try { await exportVpaRunChangesCsv(run.id, { reason }); } catch (e) { notify?.(e.message); } finally { setExporting(false); } }}>
                  {exporting ? 'Đang xuất…' : 'Xuất CSV'}
                </Button>
                <Button variant="outline" size="sm" loading={revert.isPending} disabled={!changes?.total}
                  onClick={() => window.confirm('Hoàn tác: trả các biển đã đổi tab trong lượt này về tab cũ (bỏ qua biển Admin đã khóa tab hoặc đã đổi tiếp). Tiếp tục?')
                    && act(() => revert.mutateAsync(run.id), (r) => `Đã hoàn tác ${r?.reverted ?? 0} biển`)}>
                  Hoàn tác lượt này
                </Button>
              </span>
            </div>

            {reasons.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[['', 'Tất cả'], ...reasons.map(([k, n]) => [k, `${VPA_CHANGE_REASONS[k] || k} (${n})`])].map(([k, label]) => (
                  <button key={k || 'all'} type="button" onClick={() => { setReason(k); setPage(1); }}
                    style={{ border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-pill)', padding: '4px 10px', font: 'var(--type-caption)', background: reason === k ? 'var(--action-primary)' : 'var(--surface-sunken)', color: reason === k ? 'var(--action-primary-text)' : 'var(--text-body)' }}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflowX: 'auto' }}>
              <div style={{ minWidth: 460 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr 1.2fr 1.6fr', gap: 8, padding: '8px 12px', background: 'var(--surface-sunken)', font: 'var(--type-caption)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)' }}>
                  <span>Biển số</span><span>Loại xe</span><span>Tab</span><span>Lý do</span>
                </div>
                {isLoading && <div style={{ padding: 16, color: 'var(--text-muted)' }}>Đang tải…</div>}
                {!isLoading && (changes?.items || []).length === 0 && <div style={{ padding: 16, color: 'var(--text-muted)' }}>Lượt này không đổi tab biển nào.</div>}
                {(changes?.items || []).map((c, i) => (
                  <div key={`${c.plateId}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr 1.2fr 1.6fr', gap: 8, padding: '8px 12px', borderTop: '1px solid var(--grey-100)', font: 'var(--type-body-sm)', alignItems: 'center' }}>
                    <b style={{ color: 'var(--text-strong)' }}>{c.plateNumber}</b>
                    <span>{isCar(c.vehicle) ? 'Ô tô' : 'Xe máy'}</span>
                    <span>{c.fromTab ? VPA_TAB_LABELS[c.fromTab] : '—'} → {VPA_TAB_LABELS[c.toTab]}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{VPA_CHANGE_REASONS[c.reason] || c.reason}</span>
                  </div>
                ))}
              </div>
            </div>
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />}
          </div>
        )}
      </div>
    </Drawer>
  );
}
