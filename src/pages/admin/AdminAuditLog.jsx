import { useState } from 'react';
import { Select } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import { useAdminAuditLogs, useAuditLogDetail } from '../../services/adminAuditLog.js';
import { useStaffLite } from '../../services/adminStaff.js';
import { useExportCsv } from '../../hooks/useExportCsv.js';
import { formatDate } from '../../lib/date.js';

const ENTITY_OPTS = [
  { value: '', label: 'Tất cả đối tượng' },
  { value: 'plate', label: 'Biển số' },
  { value: 'contact_request', label: 'Liên hệ' },
  { value: 'review', label: 'Đánh giá' },
  { value: 'commission', label: 'Hoa hồng' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'category', label: 'Danh mục' },
  { value: 'collaborator', label: 'CTV' },
  { value: 'blog_post', label: 'Bài viết blog' },
  { value: 'blog_comment', label: 'Bình luận blog' },
  { value: 'coupon', label: 'Mã giảm giá' },
  { value: 'maintenance_page', label: 'Bảo trì hệ thống' },
  { value: 'notification_broadcast', label: 'Thông báo hàng loạt' },
];

const ACTION_LABEL = { create: 'Tạo mới', update: 'Cập nhật', delete: 'Xóa', status_change: 'Đổi trạng thái' };

export default function AdminAuditLog() {
  const [entityType, setEntityType] = useState('');
  const [actorId, setActorId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const filterParams = {
    entityType: entityType || undefined,
    actorId: actorId || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };
  const { data, isLoading, isError, refetch } = useAdminAuditLogs({ ...filterParams, page });
  const { data: detail } = useAuditLogDetail(detailId);
  const { data: staffData } = useStaffLite();
  const { exportCsv, loading: exporting } = useExportCsv('/api/admin/audit-logs');

  const staffOpts = [
    { value: '', label: 'Tất cả người thực hiện' },
    ...(staffData?.items || []).map((s) => ({ value: s.id, label: s.fullName || s.email || s.id })),
  ];

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  let changes = null;
  if (detail?.changesJson) {
    try { changes = JSON.parse(detail.changesJson); } catch { changes = null; }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Select value={entityType} options={ENTITY_OPTS} onChange={(v) => { setEntityType(v); setPage(1); }} />
        <Select value={actorId} options={staffOpts} onChange={(v) => { setActorId(v); setPage(1); }} />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          style={{ height: 40, borderRadius: 'var(--radius-field)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 var(--space-3)', font: 'var(--type-body-sm)' }}
        />
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>đến</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          style={{ height: 40, borderRadius: 'var(--radius-field)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 var(--space-3)', font: 'var(--type-body-sm)' }}
        />
        {(fromDate || toDate) && (
          <button type="button" onClick={() => { setFromDate(''); setToDate(''); setPage(1); }}
            style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Xóa lọc ngày</button>
        )}
        <button
          type="button"
          disabled={exporting}
          onClick={() => exportCsv(filterParams)}
          style={{
            marginLeft: 'auto', height: 40, padding: '0 var(--space-4)', borderRadius: 'var(--radius-field)', border: 'none',
            background: 'var(--action-primary)', color: 'var(--text-inverse)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)',
            cursor: exporting ? 'default' : 'pointer', opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting ? 'Đang xuất…' : 'Xuất CSV'}
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
      ) : isError ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span>Lỗi tải dữ liệu</span>
          <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có nhật ký nào.</div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((log) => (
            <button
              key={log.id}
              type="button"
              onClick={() => setDetailId(log.id)}
              style={{
                width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer',
                padding: 'var(--space-3) var(--gutter-card)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center',
                boxShadow: 'inset 0 -1px 0 var(--grey-100)',
              }}
            >
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 140 }}>{formatDate(log.createdAt)}</span>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{log.actorLabel}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{ACTION_LABEL[log.action] || log.action}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{log.entityType} — {log.entityLabel}</span>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            style={{ minWidth: 64, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page <= 1 ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page <= 1 ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }}>Trước</button>
          <span style={{ font: 'var(--type-caption)' }}>{page}/{totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            style={{ minWidth: 64, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page >= totalPages ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page >= totalPages ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }}>Sau</button>
        </div>
      )}

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Chi tiết nhật ký" maxWidth="600px">
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ margin: 0, font: 'var(--type-body-sm)' }}>
              <b>{detail.actorLabel}</b> — {ACTION_LABEL[detail.action] || detail.action} — {detail.entityType} ({detail.entityLabel})
            </p>
            <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(detail.createdAt)}</p>
            {changes && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <div style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', marginBottom: 4 }}>Trước</div>
                  <pre style={{ font: 'var(--type-caption)', whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(changes.before, null, 2) ?? '—'}</pre>
                </div>
                <div>
                  <div style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', marginBottom: 4 }}>Sau</div>
                  <pre style={{ font: 'var(--type-caption)', whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(changes.after, null, 2) ?? '—'}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
