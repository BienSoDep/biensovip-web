import { useState, useMemo, useEffect } from 'react';
import {
  Users, UserCheck, UserX, Coins, Wallet, FileCheck,
  Search, X, RotateCw, Download, Phone, Copy, Check,
  Edit2, Eye, ShieldAlert, ArrowUpRight, MessageCircle,
  ExternalLink, CheckCircle2, AlertTriangle, ChevronRight
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Select, Badge } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import AuditHistoryButton from '../../components/AuditHistoryButton.jsx';
import CollaboratorCommissionsModal from '../../components/CollaboratorCommissionsModal.jsx';
import {
  useAdminCollaborators, useUpdateCollaboratorStatus,
  useDealReports, useApproveDealReport, useRejectDealReport
} from '../../services/adminCollaborators.js';
import { useZaloClickStats } from '../../services/zaloClicks.js';
import { useExportCsv } from '../../hooks/useExportCsv.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const STATUS_OPTS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'locked', label: 'Bị khóa' },
];

const STATUS_LABEL = { active: 'Hoạt động', locked: 'Bị khóa' };
const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

function getAvatarInitial(name) {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].charAt(0).toUpperCase() || 'C';
}

/* ================= Deal Reports Waiting Queue ================= */
function DealReportsQueue({ notify }) {
  const { data, isLoading, refetch } = useDealReports('pending');
  const approve = useApproveDealReport();
  const reject = useRejectDealReport();
  const [rejectTarget, setRejectTarget] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [reason, setReason] = useState('');
  const items = data?.items || [];

  if (isLoading || items.length === 0) return null;

  const doApprove = (id) => {
    approve.mutate(id, {
      onSuccess: () => notify('Đã duyệt báo cáo, tự động tạo giao dịch & hoa hồng'),
      onError: (err) => notify(err.message || 'Duyệt thất bại'),
    });
  };

  const doReject = () => {
    reject.mutate({ id: rejectTarget.id, reason: reason.trim() || undefined }, {
      onSuccess: () => {
        notify('Đã từ chối báo cáo giao dịch');
        setRejectTarget(null);
        setReason('');
      },
      onError: (err) => notify(err.message || 'Từ chối thất bại'),
    });
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.4), rgba(253, 230, 138, 0.2))',
      border: '1.5px solid #f59e0b',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
    }}>
      <div style={{
        padding: '12px 18px',
        background: '#fef3c7',
        borderBottom: '1px solid #fde68a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400e', fontWeight: 700, fontSize: 14 }}>
          <FileCheck size={18} />
          <span>Báo cáo giao dịch CTV tự chốt ngoài nền tảng ({items.length} chờ duyệt)</span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#92400e', display: 'flex' }}
        >
          <RotateCw size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((r) => (
          <div
            key={r.id}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              alignItems: 'center',
              padding: '14px 18px',
              borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
              background: 'rgba(255, 255, 255, 0.6)'
            }}
          >
            <div style={{ flex: '1 1 140px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cộng tác viên</div>
              <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{r.collaboratorName}</div>
            </div>

            <div style={{ flex: '1 1 120px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Biển số xe</div>
              <div style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#0f172a',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '2px 6px',
                borderRadius: 4,
                width: 'fit-content'
              }}>
                {r.plateNumber || '—'}
              </div>
            </div>

            <div style={{ flex: '1 1 160px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Khách mua</div>
              <div style={{ fontWeight: 500, color: 'var(--text-strong)' }}>
                {r.buyerFullName} — <span style={{ color: 'var(--text-muted)' }}>{r.buyerPhone}</span>
              </div>
            </div>

            <div style={{ flex: '1 1 120px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Giá trị deal</div>
              <div style={{ fontWeight: 700, color: '#b45309', fontSize: 15 }}>{money(r.dealAmount)}</div>
            </div>

            <div style={{ flex: '1 1 160px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ghi chú</div>
              <div style={{ fontSize: 13, color: 'var(--text-body)' }}>{r.note || '—'}</div>
            </div>

            {/* Ảnh minh chứng giao dịch */}
            <div style={{ flex: '0 0 auto' }}>
              {r.proofImageUrl ? (
                <button
                  type="button"
                  onClick={() => setPreviewImage(r.proofImageUrl)}
                  title="Nhấp để phóng to ảnh minh chứng"
                  style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <img
                    src={r.proofImageUrl}
                    alt="Chứng từ deal"
                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }}
                  />
                </button>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Không có ảnh</span>
              )}
            </div>

            <div style={{ flex: '0 0 auto', display: 'flex', gap: 8 }}>
              <Button
                variant="primary"
                size="sm"
                disabled={approve.isPending}
                onClick={() => doApprove(r.id)}
                style={{ background: '#059669', borderColor: '#059669' }}
              >
                Duyệt deal
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectTarget(r)}
                style={{ color: '#dc2626' }}
              >
                Từ chối
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal từ chối deal */}
      {rejectTarget && (
        <Modal open onClose={() => setRejectTarget(null)} title="Từ chối báo cáo giao dịch" maxWidth="420px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              Từ chối báo cáo của CTV <strong>{rejectTarget?.collaboratorName}</strong> (giá trị {money(rejectTarget?.dealAmount)}).
            </span>
            <input
              type="text"
              maxLength={255}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do từ chối (CTV sẽ thấy lý do này)…"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-field)',
                border: '1px solid var(--border-hairline)',
                font: 'var(--type-body-sm)'
              }}
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 4 }}>
              <Button variant="ghost" size="sm" onClick={() => setRejectTarget(null)}>Hủy</Button>
              <Button variant="primary" size="sm" disabled={reject.isPending} onClick={doReject} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
                {reject.isPending ? 'Đang xử lý…' : 'Xác nhận từ chối'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Lightbox xem ảnh minh chứng */}
      {previewImage && (
        <Modal open onClose={() => setPreviewImage(null)} title="Ảnh minh chứng giao dịch" maxWidth="640px">
          <div style={{ textAlign: 'center' }}>
            <img src={previewImage} alt="Ảnh giao dịch" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= Main Admin Collaborators Page ================= */
export default function AdminCollaborators({ st, patch, notify }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | locked
  const [copiedCode, setCopiedCode] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError, refetch } = useAdminCollaborators(debouncedSearch || undefined);
  const updateStatus = useUpdateCollaboratorStatus();
  const { exportCsv, loading: exporting } = useExportCsv('/api/admin/collaborators');
  const { data: zaloStats } = useZaloClickStats();

  const collabs = data?.items || [];

  // Lọc theo trạng thái
  const list = useMemo(() => {
    if (statusFilter === 'all') return collabs;
    return collabs.filter((c) => c.status === statusFilter);
  }, [collabs, statusFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = collabs.length;
    const active = collabs.filter((c) => c.status === 'active').length;
    const locked = collabs.filter((c) => c.status === 'locked').length;
    const totalEarned = collabs.reduce((a, c) => a + (Number(c.commissionEarned) || 0), 0);
    const pendingPayout = collabs.reduce((a, c) => a + (Number(c.commissionPending) || 0), 0);
    return { total, active, locked, totalEarned, pendingPayout };
  }, [collabs]);

  const [updatingId, setUpdatingId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { id, to, hasEmail, collabName }
  const [reasonDraft, setReasonDraft] = useState('');
  const [sendLockEmail, setSendLockEmail] = useState(false);
  const [detailCollab, setDetailCollab] = useState(null);

  // Chỉnh sửa hệ số hoa hồng inline
  const [editingRateId, setEditingRateId] = useState(null);
  const [editingRateValue, setEditingRateValue] = useState('');

  const copyReferralCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    notify?.(`Đã copy mã giới thiệu: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const applyStatus = (id, v) => {
    setUpdatingId(id);
    updateStatus.mutate({
      id,
      status: v,
      suspendReason: v === 'locked' ? (reasonDraft.trim() || undefined) : undefined,
      sendEmail: v === 'locked' && sendLockEmail
    }, {
      onSuccess: () => notify('Đã cập nhật trạng thái CTV thành công'),
      onError: (err) => notify(err.message || 'Cập nhật trạng thái thất bại'),
      onSettled: () => {
        setUpdatingId(null);
        setConfirm(null);
        setReasonDraft('');
        setSendLockEmail(false);
      },
    });
  };

  const saveRate = (c) => {
    const pct = Number(editingRateValue);
    if (editingRateValue === '' || Number.isNaN(pct) || pct < 10 || pct > 100) {
      notify('Hệ số hoa hồng phải từ 10% đến 100%');
      return;
    }
    setUpdatingId(c.id);
    updateStatus.mutate({
      id: c.id,
      status: c.status,
      commissionRate: pct / 100
    }, {
      onSuccess: () => {
        notify(`Đã cập nhật hệ số hoa hồng cho ${c.fullName}: ${pct}%`);
        setEditingRateId(null);
      },
      onError: (err) => notify(err.message || 'Cập nhật hệ số thất bại'),
      onSettled: () => setUpdatingId(null),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 5 Thẻ KPI Thống kê & Lọc nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        {/* KPI 1: Tổng CTV */}
        <div
          onClick={() => setStatusFilter('all')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: statusFilter === 'all' ? '2px solid var(--action-primary)' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng số CTV</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.total}</div>
          </div>
        </div>

        {/* KPI 2: Đang hoạt động */}
        <div
          onClick={() => setStatusFilter('active')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: statusFilter === 'active' ? '2px solid #059669' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang hoạt động</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#059669' }}>{stats.active}</div>
          </div>
        </div>

        {/* KPI 3: Bị khóa */}
        <div
          onClick={() => setStatusFilter('locked')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: statusFilter === 'locked' ? '2px solid #dc2626' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserX size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bị khóa tài khoản</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#dc2626' }}>{stats.locked}</div>
          </div>
        </div>

        {/* KPI 4: Hoa hồng đã tích lũy */}
        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coins size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng hoa hồng tích lũy</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#d97706' }}>{money(stats.totalEarned)}</div>
          </div>
        </div>

        {/* KPI 5: Hoa hồng chờ chi trả */}
        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hoa hồng chờ chi trả</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#7c3aed' }}>{money(stats.pendingPayout)}</div>
          </div>
        </div>
      </div>

      {/* Banner báo cáo deal tự chốt chờ duyệt (nếu có) */}
      <DealReportsQueue notify={notify} />

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
        {/* Tab Pills lọc nhanh */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Tất cả', count: stats.total },
            { id: 'active', label: 'Hoạt động', count: stats.active },
            { id: 'locked', label: 'Bị khóa', count: stats.locked, alert: stats.locked > 0 },
          ].map((t) => {
            const active = statusFilter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatusFilter(t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--action-dark)' : 'var(--surface-sunken)',
                  color: active ? 'var(--white)' : 'var(--text-body)',
                  font: 'var(--type-body-sm)',
                  fontWeight: active ? 600 : 500,
                  transition: 'all 120ms ease',
                }}
              >
                <span>{t.label}</span>
                <span style={{
                  padding: '1px 7px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  background: active ? 'rgba(255, 255, 255, 0.22)' : t.alert ? '#fee2e2' : 'var(--border-hairline)',
                  color: active ? 'var(--white)' : t.alert ? '#b91c1c' : 'var(--text-muted)',
                }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tìm kiếm & Công cụ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, mã ref…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 30px 0 32px',
                borderRadius: 'var(--radius-field)',
                border: 'none',
                background: 'var(--surface-sunken)',
                boxShadow: 'var(--shadow-inset-hairline)',
                font: 'var(--type-body-sm)',
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={exporting}
            onClick={() => exportCsv({ q: debouncedSearch || undefined }).catch((e) => notify(e.message))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36 }}
          >
            <Download size={14} />
            <span>{exporting ? 'Đang xuất…' : 'Xuất CSV'}</span>
          </Button>

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
        </div>
      </div>

      {/* Collaborator List Table */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--gutter-card)' }}><SkeletonTable rows={5} cols={6} /></div>
        ) : isError ? (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <span>Lỗi tải danh sách cộng tác viên.</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: '56px var(--gutter-card)', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Users size={36} style={{ color: 'var(--text-faint)' }} />
            <div style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)' }}>
              Không tìm thấy cộng tác viên
            </div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              {searchTerm ? 'Không có CTV nào khớp với từ khóa tìm kiếm.' : 'Chưa có cộng tác viên nào trong danh mục này.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ minWidth: 840 }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 2fr) minmax(130px, 1.2fr) minmax(120px, 1.1fr) minmax(150px, 1.3fr) minmax(120px, 1fr) minmax(100px, 0.9fr) 140px',
                padding: '12px 20px',
                background: 'var(--surface-sunken)',
                font: 'var(--type-caption)',
                fontSize: 11,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontWeight: 700,
                alignItems: 'center',
              }}>
                <span>Cộng tác viên</span>
                <span>Liên hệ</span>
                <span>Mã giới thiệu</span>
                <span>Hoa hồng</span>
                <span>Hệ số %</span>
                <span>Trạng thái</span>
                <span style={{ textAlign: 'right' }}>Thao tác</span>
              </div>

              {/* Table Body */}
              {list.map((c, idx) => {
                const initial = getAvatarInitial(c.fullName);
                const isEditingRate = editingRateId === c.id;
                const ratePct = c.commissionRate != null ? (c.commissionRate * 100) : 10;

                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(220px, 2fr) minmax(130px, 1.2fr) minmax(120px, 1.1fr) minmax(150px, 1.3fr) minmax(120px, 1fr) minmax(100px, 0.9fr) 140px',
                      padding: '14px 20px',
                      alignItems: 'center',
                      borderBottom: idx < list.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                      transition: 'background 120ms ease',
                      background: c.status === 'locked' ? 'rgba(239, 68, 68, 0.02)' : 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-sunken)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = c.status === 'locked' ? 'rgba(239, 68, 68, 0.02)' : 'transparent'}
                  >
                    {/* CTV Name & Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: c.status === 'locked' ? 'linear-gradient(135deg, #9ca3af, #6b7280)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                        flexShrink: 0,
                      }}>
                        {initial}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {c.fullName}
                        </div>
                        {c.email && (
                          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {c.email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Phone & Zalo */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ font: 'var(--type-body-sm)', fontWeight: 500, color: 'var(--text-strong)' }}>
                          {c.phone || '—'}
                        </span>
                        {c.phone && (
                          <a
                            href={`https://zalo.me/${c.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Nhắn Zalo"
                            style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}
                          >
                            <MessageCircle size={13} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Referral Code with Copy */}
                    <div>
                      <button
                        type="button"
                        onClick={() => copyReferralCode(c.referralCode)}
                        title="Bấm để copy mã giới thiệu"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          color: '#2563eb',
                          fontFamily: 'monospace',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{c.referralCode || '—'}</span>
                        {copiedCode === c.referralCode ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Commissions (Earned & Pending) */}
                    <div>
                      <div style={{ font: 'var(--type-body-sm)', fontWeight: 700, color: '#059669' }}>
                        {money(c.commissionEarned)}
                      </div>
                      {Number(c.commissionPending) > 0 && (
                        <div style={{ font: 'var(--type-caption)', color: '#d97706', fontSize: 11 }}>
                          Chờ trả: {money(c.commissionPending)}
                        </div>
                      )}
                    </div>

                    {/* Commission Rate (%) with Inline Editor */}
                    <div>
                      {isEditingRate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            min="10"
                            max="100"
                            step="0.5"
                            value={editingRateValue}
                            onChange={(e) => setEditingRateValue(e.target.value)}
                            style={{
                              width: 48,
                              height: 30,
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: '1.5px solid var(--action-primary)',
                              fontSize: 12,
                              fontWeight: 600,
                              outline: 'none',
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveRate(c)}
                            disabled={updatingId === c.id}
                            title="Lưu"
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 4,
                              background: '#059669',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRateId(null)}
                            title="Hủy"
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 4,
                              background: 'var(--surface-sunken)',
                              color: 'var(--text-muted)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: 12,
                            fontWeight: 700,
                            background: c.commissionRate != null ? 'rgba(139, 92, 246, 0.1)' : 'var(--surface-sunken)',
                            color: c.commissionRate != null ? '#7c3aed' : 'var(--text-body)',
                            border: '1px solid var(--border-hairline)',
                          }}>
                            {ratePct}%
                          </span>
                          <button
                            type="button"
                            onClick={() => { setEditingRateId(c.id); setEditingRateValue(String(ratePct)); }}
                            title="Chỉnh sửa hệ số hoa hồng"
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex' }}
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Status Badge & Toggle Action */}
                    <div>
                      {c.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => setConfirm({ id: c.id, to: 'locked', hasEmail: !!c.email, collabName: c.fullName })}
                          title="Nhấp để khóa tài khoản CTV"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: 12,
                            fontWeight: 600,
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            cursor: 'pointer',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          <span>Hoạt động</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirm({ id: c.id, to: 'active', hasEmail: !!c.email, collabName: c.fullName })}
                          title="Nhấp để mở khóa tài khoản CTV"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: 12,
                            fontWeight: 600,
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#dc2626',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            cursor: 'pointer',
                          }}
                        >
                          <ShieldAlert size={12} />
                          <span>Bị khóa</span>
                        </button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setDetailCollab(c)}
                        title="Xem chi tiết hoa hồng & xác nhận thanh toán"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: 12,
                          fontWeight: 600,
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#2563eb',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'; e.currentTarget.style.color = '#2563eb'; }}
                      >
                        <Wallet size={13} />
                        <span>Hoa hồng</span>
                      </button>

                      <AuditHistoryButton entityType="collaborator" entityId={c.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal xác nhận đổi trạng thái CTV */}
      {confirm != null && (
        <Modal open onClose={() => setConfirm(null)} title="Xác nhận đổi trạng thái CTV" maxWidth="420px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
              Bạn có chắc chắn muốn chuyển trạng thái của CTV <strong>{confirm.collabName}</strong> sang{' '}
              <strong style={{ color: confirm.to === 'locked' ? '#dc2626' : '#059669' }}>
                {STATUS_LABEL[confirm.to] || confirm.to}
              </strong>?
            </p>

            {confirm.to === 'locked' && (
              <>
                <input
                  type="text"
                  maxLength={255}
                  value={reasonDraft}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  placeholder="Lý do khóa (ghi rõ để lưu vết & hỗ trợ CTV)…"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-field)',
                    border: '1px solid var(--border-hairline)',
                    font: 'var(--type-body-sm)'
                  }}
                />
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  font: 'var(--type-body-sm)',
                  color: confirm.hasEmail ? 'var(--text-strong)' : 'var(--text-faint)',
                  cursor: confirm.hasEmail ? 'pointer' : 'default'
                }}>
                  <input
                    type="checkbox"
                    checked={sendLockEmail}
                    disabled={!confirm.hasEmail}
                    onChange={(e) => setSendLockEmail(e.target.checked)}
                    style={{ accentColor: 'var(--action-primary)' }}
                  />
                  <span>Gửi email thông báo lý do + hỗ trợ Zalo{!confirm.hasEmail && ' (CTV này chưa cập nhật email)'}</span>
                </label>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 8 }}>
              <Button variant="ghost" size="md" onClick={() => setConfirm(null)}>Hủy bỏ</Button>
              <Button
                variant="primary"
                size="md"
                disabled={updatingId === confirm.id}
                onClick={() => applyStatus(confirm.id, confirm.to)}
                style={{
                  background: confirm.to === 'locked' ? '#dc2626' : '#059669',
                  borderColor: confirm.to === 'locked' ? '#dc2626' : '#059669'
                }}
              >
                {updatingId === confirm.id ? 'Đang cập nhật…' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal chi tiết hoa hồng & xác nhận chi trả VietQR */}
      <CollaboratorCommissionsModal
        collaborator={detailCollab}
        onClose={() => setDetailCollab(null)}
        notify={notify}
      />
    </div>
  );
}
