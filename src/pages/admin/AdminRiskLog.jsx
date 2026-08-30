import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { Select, Badge } from '../../components/index.jsx';
import { useRiskEvents, useResolveRiskEvent, useFlaggedCollaborators, useResolveCollaboratorFlags } from '../../services/adminRisk.js';
import { formatDate } from '../../lib/date.js';

const SEVERITY_LABEL = { Low: 'Thấp', Medium: 'TB', High: 'Cao', Critical: 'Nghiêm trọng' };
const STATUS_LABEL = { Open: 'Mở', Reviewed: 'Đã xử lý', Dismissed: 'Bỏ qua' };
const DIM_LABEL = { ReferralFraud: 'Gian lận giới thiệu', CommissionFraud: 'Gian lận hoa hồng', Impersonation: 'Giả mạo', Behavioral: 'Hành vi' };
const SEVERITY_TONE = { Low: 'blue', Medium: 'amber', High: 'rose', Critical: 'red' };

const STATUS_OPTS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Open', label: 'Mở' },
  { value: 'Reviewed', label: 'Đã xử lý' },
  { value: 'Dismissed', label: 'Bỏ qua' },
];

export default function AdminRiskLog() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const resolveEvent = useResolveRiskEvent();
  const resolveFlags = useResolveCollaboratorFlags();

  const { data: flagged, isLoading: flaggedLoading } = useFlaggedCollaborators();
  const { data: events, isLoading, isError, refetch } = useRiskEvents({ status: status || undefined, page: page || undefined });

  const items = events?.items || [];
  const totalPages = events?.totalPages || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* §1.4.2 — CTV cần rà soát (flagged) */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>CTV cần rà soát</span>
          <Badge tone="amber">{flagged?.flaggedCount ?? 0}</Badge>
        </div>
        {flaggedLoading ? (
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>
        ) : flagged?.flagged?.length === 0 ? (
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có CTV nào đang flagged hoặc risk_score vượt ngưỡng.</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(flagged?.flagged || []).map((c) => (
              <div key={c.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-2) 0', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', minWidth: 140 }}>{c.fullName}</span>
                <Badge tone="mint">{c.referralCode}</Badge>
                <span style={{ font: 'var(--type-caption)', color: 'var(--status-warning)' }}>Risk {c.riskScore}</span>
                {c.freeze && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Freeze</span>}
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: 1 }}>
                  {(c.flags || []).map((f) => `${f.rule} (+${f.points})`).join(' · ')}
                </span>
                <Button variant="ghost" size="sm" loading={resolveFlags.isPending} onClick={() => resolveFlags.mutate(c.id)}>Cho qua</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* §1.4.2 — Risk Activity Log */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <Select value={status} options={STATUS_OPTS} onChange={(v) => { setStatus(v); setPage(1); }} />
      </div>

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
      ) : isError ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>
          <span>Lỗi tải dữ liệu (có thể thiếu quyền risk_events:read)</span>
          <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có sự kiện rủi ro nào.</div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((e) => (
            <div key={e.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 150 }}>{formatDate(e.createdAt)}</span>
              <Badge tone={SEVERITY_TONE[e.severity] || 'blue'}>{SEVERITY_LABEL[e.severity] || e.severity}</Badge>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', minWidth: 90 }}>{e.rule}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{DIM_LABEL[e.dimension] || e.dimension}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: 1 }}>{e.collaboratorName || '—'}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>+{e.points}</span>
              {e.status === 'Open' ? (
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <Button variant="ghost" size="sm" loading={resolveEvent.isPending} onClick={() => resolveEvent.mutate({ id: e.id, action: 'resolve' })}>Xử lý</Button>
                  <Button variant="ghost" size="sm" loading={resolveEvent.isPending} onClick={() => resolveEvent.mutate({ id: e.id, action: 'dismiss' })}>Bỏ qua</Button>
                </div>
              ) : (
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{STATUS_LABEL[e.status]}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</button>
          <span style={{ font: 'var(--type-caption)' }}>{page}/{totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</button>
        </div>
      )}
    </div>
  );
}
