import { useState } from 'react';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { Badge } from '../../../components/index.jsx';
import { useVpaIntegrity, useVpaIntegrityRows, useFixVpaIntegrity, useVpaIntegrityFixes, useUndoVpaIntegrity } from '../../../services/adminVpa.js';
import { VPA_TAB_LABELS, formatDateTime, formatInt, isCar } from '../../../lib/vpaFormat.js';

const CARD = { background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' };
const SEVERITY = { error: { tone: 'rose', label: 'Lỗi' }, warn: { tone: 'amber', label: 'Cảnh báo' } };
const caption = { font: 'var(--type-caption)', color: 'var(--text-muted)' };

function Rows({ check, notify }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useVpaIntegrityRows(check.code, page);
  const fix = useFixVpaIntegrity();
  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / 20));

  const doFix = async (ids) => {
    try {
      const r = await fix.mutateAsync({ code: check.code, ids });
      notify?.(`Đã sửa ${formatInt(r.fixed)} biển` + (r.skipped > 0 ? `, ${formatInt(r.skipped)} biển không sửa được (đã khóa hoặc thiếu danh mục)` : '') + `. Còn ${formatInt(r.remaining)} biển lỗi.`);
    } catch (e) { notify?.(e.message || 'Sửa thất bại'); }
  };
  const fixAll = () => {
    if (window.confirm(`${check.fixLabel}: áp dụng cho tất cả ${formatInt(check.count)} biển đang lỗi (tối đa 20.000 mỗi lần)? Trường Admin đã khóa không bị đổi.`)) doFix(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', borderTop: '1px solid var(--grey-100)', paddingTop: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{check.help}</span>
      {check.fixable && check.count > 0 && (
        <span><Button variant="primary" size="sm" loading={fix.isPending} onClick={fixAll}>{check.fixLabel}: tất cả {formatInt(check.count)} biển</Button></span>
      )}
      {!check.fixable && <span style={caption}>Lỗi này do dữ liệu gốc của VPA nên không sửa tự động được; kiểm tra rồi sửa tay từng biển.</span>}
      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
        {isLoading && <div style={{ padding: 16, color: 'var(--text-muted)' }}>Đang tải…</div>}
        {isError && <div style={{ padding: 16, color: 'var(--status-danger)' }}>Không tải được danh sách.</div>}
        {!isLoading && !isError && items.length === 0 && <div style={{ padding: 16, color: 'var(--text-muted)' }}>Không còn biển nào dính lỗi này.</div>}
        {items.map((r) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px,1fr) 80px 110px minmax(160px,2fr) auto', gap: 8, alignItems: 'center', padding: '8px 12px', borderTop: '1px solid var(--grey-100)', font: 'var(--type-body-sm)', minWidth: 560 }}>
            <b style={{ color: 'var(--text-strong)' }}>{r.plateNumber}</b>
            <span>{isCar(r.vehicle) ? 'Ô tô' : 'Xe máy'}</span>
            <span>{VPA_TAB_LABELS[r.tab]}</span>
            <span style={{ color: 'var(--status-danger)', overflowWrap: 'anywhere' }}>{r.detail}</span>
            {check.fixable ? <Button variant="outline" size="sm" disabled={fix.isPending} onClick={() => doFix([r.id])}>Sửa</Button> : <span />}
          </div>
        ))}
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />}
    </div>
  );
}

// Lịch sử các lần sửa gần nhất; mỗi lần hoàn tác được một lần (biển bị sửa tiếp sau đó giữ nguyên).
function FixHistory({ notify }) {
  const { data } = useVpaIntegrityFixes(true);
  const undo = useUndoVpaIntegrity();
  if (!data || data.length === 0) return null;
  const doUndo = async (f) => {
    if (!window.confirm(`Hoàn tác "${f.title}" (${formatInt(f.fixed)} biển)? Biển đã bị sửa tiếp sau lần sửa đó sẽ giữ nguyên.`)) return;
    try {
      const r = await undo.mutateAsync(f.id);
      notify?.(`Đã hoàn tác ${formatInt(r.restored)} biển` + (r.skipped > 0 ? `, giữ nguyên ${formatInt(r.skipped)} biển đã bị sửa tiếp` : ''));
    } catch (e) { notify?.(e.message || 'Hoàn tác thất bại'); }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', borderTop: '1px solid var(--grey-100)', paddingTop: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Lịch sử sửa gần đây</span>
      {data.map((f) => (
        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', font: 'var(--type-body-sm)' }}>
          <span style={{ ...caption, minWidth: 110 }}>{formatDateTime(f.at)}</span>
          <span style={{ flex: 1, minWidth: 160, color: 'var(--text-body)' }}>{f.title} — {formatInt(f.fixed)} biển ({f.actorLabel})</span>
          {f.undoneAt ? <Badge tone="neutral">Đã hoàn tác</Badge>
            : <Button variant="outline" size="sm" disabled={undo.isPending} onClick={() => doUndo(f)}>Hoàn tác</Button>}
        </div>
      ))}
    </div>
  );
}

// Kiểm tra dữ liệu biển VPA ngay trong danh sách: nhóm lỗi + số biển, bấm vào để xem biển lỗi và sửa từng biển hoặc cả nhóm.
export default function VpaIntegrityPanel({ notify, onClose }) {
  const { data, isLoading, isError, isFetching, refetch } = useVpaIntegrity(true);
  const [open, setOpen] = useState(null);
  const bad = (data || []).filter((c) => c.count > 0);
  const total = bad.reduce((s, c) => s + c.count, 0);

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
          Kiểm tra dữ liệu {data ? (bad.length === 0 ? '— không phát hiện lỗi' : `— ${bad.length} nhóm lỗi, ${formatInt(total)} biển`) : ''}
        </span>
        <span style={{ display: 'inline-flex', gap: 8 }}>
          <Button variant="ghost" size="sm" loading={isFetching} onClick={() => refetch()}>Kiểm tra lại</Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Đóng</Button>
        </span>
      </div>
      {isLoading && <span style={caption}>Đang quét toàn bộ kho biển VPA, có thể mất vài giây…</span>}
      {isError && <span style={{ color: 'var(--status-danger)' }}>Không chạy được kiểm tra dữ liệu.</span>}
      {data && bad.length === 0 && <span style={caption}>Không có biển trùng, hỏng hay lệch trong kho VPA.</span>}
      {bad.map((c) => {
        const sev = SEVERITY[c.severity] || SEVERITY.warn;
        const expanded = open === c.code;
        return (
          <div key={c.code} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button type="button" onClick={() => setOpen(expanded ? null : c.code)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', border: 'none', background: expanded ? 'var(--amber-50)' : 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px', cursor: 'pointer', textAlign: 'left' }}>
              <Badge tone={sev.tone}>{sev.label}</Badge>
              <b style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', flex: 1, minWidth: 160 }}>{c.title}</b>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{formatInt(c.count)} biển</span>
              {c.fixable && <Badge tone="mint">Sửa được</Badge>}
            </button>
            {expanded && <Rows check={c} notify={notify} />}
          </div>
        );
      })}
      <FixHistory notify={notify} />
    </div>
  );
}
