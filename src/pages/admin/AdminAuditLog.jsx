import { useState, useMemo } from 'react';
import {
  History, PlusCircle, Pencil, Trash2, AlertCircle,
  RotateCw, Download, Calendar, Filter, User, Search,
  X, ChevronRight, Eye, CheckCircle2, ArrowRight
} from 'lucide-react';
import { Select, Badge } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import Button from '../../components/Button.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useAdminAuditLogs, useAuditLogDetail } from '../../services/adminAuditLog.js';
import { useStaffLite } from '../../services/adminStaff.js';
import { useExportCsv } from '../../hooks/useExportCsv.js';
import { formatDate } from '../../lib/date.js';

const ENTITY_OPTS = [
  { value: '', label: 'Tất cả đối tượng' },
  { value: 'plate', label: 'Biển số xe' },
  { value: 'contact_request', label: 'Yêu cầu liên hệ' },
  { value: 'review', label: 'Đánh giá khách hàng' },
  { value: 'commission', label: 'Hoa hồng CTV' },
  { value: 'staff', label: 'Nhân viên quản trị' },
  { value: 'category', label: 'Danh mục biển số' },
  { value: 'collaborator', label: 'Cộng tác viên' },
  { value: 'blog_post', label: 'Bài viết blog' },
  { value: 'blog_comment', label: 'Bình luận bài viết' },
  { value: 'coupon', label: 'Mã giảm giá' },
  { value: 'maintenance_page', label: 'Bảo trì hệ thống' },
  { value: 'notification_broadcast', label: 'Thông báo broadcast' },
];

const ACTION_CONFIG = {
  create: { label: 'Tạo mới', tone: 'mint', bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)', icon: PlusCircle },
  update: { label: 'Cập nhật', tone: 'blue', bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: 'rgba(59, 130, 246, 0.25)', icon: Pencil },
  delete: { label: 'Xóa dữ liệu', tone: 'danger', bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: 'rgba(239, 68, 68, 0.25)', icon: Trash2 },
  status_change: { label: 'Đổi trạng thái', tone: 'amber', bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)', icon: AlertCircle },
};

function formatVNTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  } catch {
    return iso;
  }
}

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
  const totalItems = data?.total || items.length;

  // Thống kê nhanh từ danh sách hiện tại
  const stats = useMemo(() => {
    const total = totalItems;
    const creates = items.filter((x) => x.action === 'create').length;
    const updates = items.filter((x) => x.action === 'update').length;
    const statusChanges = items.filter((x) => x.action === 'status_change').length;
    const deletes = items.filter((x) => x.action === 'delete').length;
    return { total, creates, updates, statusChanges, deletes };
  }, [items, totalItems]);

  let changes = null;
  if (detail?.changesJson) {
    try { changes = JSON.parse(detail.changesJson); } catch { changes = null; }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 4 Thẻ KPI Hoạt động */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng lượt thao tác</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlusCircle size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Thao tác Tạo mới</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#059669' }}>{stats.creates}</div>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pencil size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Thao tác Cập nhật</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#2563eb' }}>{stats.updates}</div>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đổi trạng thái & Xóa</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#d97706' }}>{stats.statusChanges + stats.deletes}</div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        padding: '14px 18px',
        boxShadow: 'var(--shadow-inset-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}>
        {/* Dropdown Filters */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            value={entityType}
            options={ENTITY_OPTS}
            onChange={(v) => { setEntityType(v); setPage(1); }}
            style={{ width: 180 }}
          />

          <Select
            value={actorId}
            options={staffOpts}
            onChange={(v) => { setActorId(v); setPage(1); }}
            style={{ width: 200 }}
          />

          {/* Date range picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-sunken)', padding: '4px 8px', borderRadius: 'var(--radius-field)' }}>
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              style={{
                height: 32,
                border: 'none',
                background: 'transparent',
                font: 'var(--type-body-sm)',
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>đến</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              style={{
                height: 32,
                border: 'none',
                background: 'transparent',
                font: 'var(--type-body-sm)',
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => { setFromDate(''); setToDate(''); setPage(1); }}
                title="Xóa lọc ngày"
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => refetch()}
            title="Làm mới"
            style={{
              height: 36,
              width: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--border-hairline)',
              background: 'var(--white)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <RotateCw size={14} />
          </button>

          <Button
            variant="primary"
            size="sm"
            disabled={exporting}
            onClick={() => exportCsv(filterParams)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36 }}
          >
            <Download size={14} />
            <span>{exporting ? 'Đang xuất…' : 'Xuất CSV'}</span>
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <RotateCw size={24} className="animate-spin" style={{ color: 'var(--action-primary)' }} />
            <span>Đang tải nhật ký hệ thống…</span>
          </div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <span>Lỗi tải dữ liệu nhật ký.</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <History size={36} style={{ color: 'var(--text-faint)' }} />
            <div style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)' }}>
              Không có nhật ký nào
            </div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Chưa có bản ghi nhật ký thao tác phù hợp với bộ lọc hiện tại.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((log, idx) => {
              const actCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.update;
              const ActionIcon = actCfg.icon;

              return (
                <div
                  key={log.id}
                  onClick={() => setDetailId(log.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: idx < items.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 120ms ease',
                    gap: 16,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-sunken)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Left: Time & Actor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-strong)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}>
                      <User size={16} />
                    </div>
                    <div>
                      <div style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)' }}>
                        {log.actorLabel || 'Hệ thống'}
                      </div>
                      <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 12 }}>
                        {formatVNTime(log.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Action Badge & Entity Info */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: 12,
                      fontWeight: 600,
                      background: actCfg.bg,
                      color: actCfg.color,
                      border: `1px solid ${actCfg.border}`,
                    }}>
                      <ActionIcon size={12} />
                      {actCfg.label}
                    </span>

                    <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
                      Đối tượng: <strong style={{ color: 'var(--text-strong)' }}>{log.entityType}</strong>
                      {log.entityLabel && <span> — <code style={{ background: 'var(--surface-sunken)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{log.entityLabel}</code></span>}
                    </span>
                  </div>

                  {/* Right: View Detail */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--action-primary)', fontSize: 13, fontWeight: 600 }}>
                    <Eye size={14} />
                    <span>Chi tiết</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />
      )}

      {/* Modal Chi tiết Audit Log */}
      {detailId && (
        <Modal open onClose={() => setDetailId(null)} title="Chi tiết nhật ký thao tác" maxWidth="640px">
          {detail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Người thực hiện</span>
                  <div style={{ font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>{detail.actorLabel}</div>
                </div>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Thời gian</span>
                  <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{formatVNTime(detail.createdAt)}</div>
                </div>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hành vi</span>
                  <div style={{ font: 'var(--type-body-sm)', fontWeight: 600 }}>{ACTION_CONFIG[detail.action]?.label || detail.action}</div>
                </div>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đối tượng</span>
                  <div style={{ font: 'var(--type-body-sm)' }}>{detail.entityType} ({detail.entityLabel || '—'})</div>
                </div>
                {detail.ipAddress && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Địa chỉ IP</span>
                    <div style={{ font: 'var(--type-body-sm)', fontFamily: 'monospace' }}>{detail.ipAddress}</div>
                  </div>
                )}
              </div>

              {/* Dữ liệu thay đổi */}
              {changes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ font: 'var(--type-label)', fontWeight: 700, color: 'var(--text-strong)' }}>
                    Chi tiết thay đổi dữ liệu (Diff):
                  </span>
                  <pre style={{
                    margin: 0,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    lineHeight: 1.5,
                    overflowX: 'auto',
                    maxHeight: 280,
                  }}>
                    {JSON.stringify(changes, null, 2)}
                  </pre>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Button variant="ghost" size="md" onClick={() => setDetailId(null)}>Đóng</Button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải chi tiết…</div>
          )}
        </Modal>
      )}
    </div>
  );
}
