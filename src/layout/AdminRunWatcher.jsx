import { useEffect, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Loader2, X, ChevronUp } from 'lucide-react';
import { apiClient } from '../services/apiClient.js';
import { useVpaOverview } from '../services/adminVpa.js';
import { getActiveApproveRuns, subscribeApproveRuns, unregisterApproveRun } from '../lib/runWatcher.js';

// Widget góc màn hình: hiện khi có lượt duyệt giá (approve-run) hoặc lượt cào (crawl-run) VPA đang chạy,
// sống qua mọi trang admin (mount 1 lần ở AdminShell) — không chặn thao tác trang, chỉ thu nhỏ/phóng to.
function useApproveRunsStatus() {
  const [ids, setIds] = useState(() => getActiveApproveRuns());
  useEffect(() => subscribeApproveRuns(setIds), []);

  const results = useQueries({
    queries: ids.map((runId) => ({
      queryKey: ['admin-vpa', 'approve-run', runId],
      queryFn: () => apiClient.get(`/api/admin/vpa/plates/price/approve-runs/${runId}`),
      refetchInterval: (q) => (q.state.data?.status === 'running' ? 1500 : false),
    })),
  });

  useEffect(() => {
    results.forEach((r, i) => {
      const status = r.data?.status;
      if (status && status !== 'running') unregisterApproveRun(ids[i]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => r.data?.status).join(',')]);

  return ids.map((runId, i) => ({ runId, kind: 'approve', data: results[i]?.data }));
}

export default function AdminRunWatcher() {
  const approveRuns = useApproveRunsStatus();
  const { data: overview } = useVpaOverview({ poll: true, enabled: true });
  const crawlRuns = (overview?.running || []).map((r) => ({ runId: r.runId || r.id, kind: 'crawl', data: r }));

  const running = [...approveRuns.filter((r) => !r.data || r.data.status === 'running'), ...crawlRuns];
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (running.length === 0) setExpanded(false);
  }, [running.length]);

  if (running.length === 0) return null;

  return (
    <div style={{ position: 'fixed', right: 'var(--space-5)', bottom: 'var(--space-5)', zIndex: 60 }}>
      {expanded ? (
        <div style={{
          width: 320, maxWidth: '88vw', background: 'var(--white)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-4)', border: '1px solid var(--border-subtle)', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
              Tiến trình đang chạy ({running.length})
            </span>
            <button type="button" onClick={() => setExpanded(false)} aria-label="Thu gọn" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 320, overflowY: 'auto' }}>
            {running.map((r) => <RunRow key={`${r.kind}-${r.runId}`} run={r} />)}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          title="Có tiến trình đang chạy — bấm để xem chi tiết"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 'var(--radius-pill)',
            border: 'none', background: 'var(--action-primary)', color: 'var(--white)', boxShadow: 'var(--shadow-3)',
            cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-medium)',
          }}
        >
          <Loader2 size={16} style={{ animation: 'adminRunWatcherSpin 1s linear infinite' }} />
          <span>{running.length} tiến trình đang chạy</span>
          <ChevronUp size={14} />
        </button>
      )}
      <style>{'@keyframes adminRunWatcherSpin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

function RunRow({ run }) {
  const { kind, data } = run;
  const label = kind === 'approve' ? 'Duyệt giá VPA' : `Cào dữ liệu VPA${data?.source ? ` — ${data.source}` : ''}`;
  const hasTotal = kind === 'approve' && data?.total > 0;
  const pct = hasTotal ? Math.min(100, Math.round((data.done * 100) / data.total)) : null;
  const text = kind === 'approve'
    ? (hasTotal ? `Đã xét ${data.done.toLocaleString('vi-VN')}/${data.total.toLocaleString('vi-VN')}` : 'Đang xử lý…')
    : (data?.itemsSeen != null ? `Đã quét ${data.itemsSeen.toLocaleString('vi-VN')} biển` : 'Đang cào…');

  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', fontWeight: 'var(--fw-medium)' }}>{label}</span>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--grey-200)', overflow: 'hidden' }}>
        {pct == null ? (
          <div style={{ width: '35%', height: '100%', background: 'var(--action-primary)', borderRadius: 3, animation: 'adminRunWatcherIndeterminate 1.1s ease-in-out infinite' }} />
        ) : (
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--action-primary)', transition: 'width 300ms var(--ease-standard)' }} />
        )}
      </div>
      <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)' }}>{text}</span>
      <style>{'@keyframes adminRunWatcherIndeterminate { 0% { margin-left: 0%; } 50% { margin-left: 60%; } 100% { margin-left: 0%; } }'}</style>
    </div>
  );
}
