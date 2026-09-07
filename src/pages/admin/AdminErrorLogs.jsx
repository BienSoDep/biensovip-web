import { useState } from 'react';
import { Select, Badge } from '../../components/index.jsx';
import { useAdminErrorLogs } from '../../services/adminErrorLogs.js';
import { formatDate } from '../../lib/date.js';

const LEVEL_OPTS = [
  { value: '', label: 'Tất cả mức độ' },
  { value: 'Warning', label: 'Warning' },
  { value: 'Error', label: 'Error' },
  { value: 'Fatal', label: 'Fatal' },
];
const LEVEL_TONE = { Warning: 'amber', Error: 'rose', Fatal: 'rose' };

export default function AdminErrorLogs() {
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useAdminErrorLogs({ level: level || undefined, page });

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <Select value={level} options={LEVEL_OPTS} onChange={(v) => { setLevel(v); setPage(1); }} />

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
      ) : isError ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span>Lỗi tải dữ liệu</span>
          <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có log lỗi nào — tốt đấy.</div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((log) => (
            <div key={log.id} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Badge tone={LEVEL_TONE[log.level] || 'neutral'}>{log.level}</Badge>
                {log.sourceContext && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{log.sourceContext}</span>}
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatDate(log.createdAt)}</span>
              </div>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{log.message}</span>
              {log.exception && (
                <pre style={{ margin: 0, padding: 8, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', font: 'var(--type-caption)', color: 'var(--text-muted)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{log.exception}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ border: 'none', background: 'none', cursor: page <= 1 ? 'default' : 'pointer', color: page <= 1 ? 'var(--text-faint)' : 'var(--link)' }}>Trước</button>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Trang {page}/{totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ border: 'none', background: 'none', cursor: page >= totalPages ? 'default' : 'pointer', color: page >= totalPages ? 'var(--text-faint)' : 'var(--link)' }}>Sau</button>
        </div>
      )}
    </div>
  );
}
