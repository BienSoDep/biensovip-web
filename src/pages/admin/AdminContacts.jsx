import { useState } from 'react';
import { Loader2, MessageCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@mantine/hooks';
import { useAdminContacts, useUpdateContactStatus, useContactStats, useAssignContact } from '../../services/adminContacts.js';
import { useCreatePaymentLink } from '../../services/paymentLinks.js';
import { useAdminStaff } from '../../services/adminStaff.js';
import { formatDate, formatDateTime } from '../../lib/date.js';
import { Select, Badge } from '../../components/index.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import Modal from '../../components/Modal.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';
import AuditHistoryButton from '../../components/AuditHistoryButton.jsx';
import InternalNotesPanel from '../../components/InternalNotesPanel.jsx';
import Button from '../../components/Button.jsx';
import { useExportCsv } from '../../hooks/useExportCsv.js';
import { routeFor } from '../../config/routes.js';
import { loadAuth } from '../../lib/authStore.js';

const INTENT_LABEL = { inquiry: 'Hỏi chung', deposit_request: 'Đặt cọc', buy: 'Mua đứt', hunting: 'Săn hộ' };
const INTENT_COLOR = { inquiry: 'var(--text-muted)', deposit_request: 'var(--accent-orange-ink)', buy: 'var(--blue-700)', hunting: 'var(--accent-purple-ink)' };
const SOURCE_LABEL = { 'home-page': 'Trang chủ', 'contact-page': 'Trang liên hệ', 'plate-detail': 'Trang biển số', 'chatbot': 'Trợ lý AI' };
const STATUS_OPTS = ['Mới', 'Đang tư vấn', 'Đã chốt', 'Đã tìm thấy'];
const STATUS_VAL = { 'Mới': 'new', 'Đang tư vấn': 'consulting', 'Đã chốt': 'closed', 'Đã tìm thấy': 'found' };
const STATUS_LABEL = { new: 'Mới', consulting: 'Đang tư vấn', closed: 'Đã chốt', found: 'Đã tìm thấy' };
const STATUS_COLOR = { new: 'var(--blue-700)', consulting: 'var(--status-warning-ink)', closed: 'var(--status-success-ink)', found: '#7B2D8B' };
const INTENT_OPTS = ['Tất cả', 'Hỏi chung', 'Đặt cọc', 'Mua đứt', 'Săn hộ'];
const INTENT_VAL = { 'Hỏi chung': 'inquiry', 'Đặt cọc': 'deposit_request', 'Mua đứt': 'buy', 'Săn hộ': 'hunting' };

function parsePlateNumber(raw) {
  if (!raw) return null;
  const idx = Math.max(raw.lastIndexOf('-'), raw.lastIndexOf(' '));
  if (idx < 0) return null;
  const front = raw.substring(0, idx);
  const num = raw.substring(idx + 1);
  const m = front.match(/^(\d{1,2})(\D.*)$/);
  if (!m) return null;
  return { prov: m[1], seri: m[2], num };
}

export default function AdminContacts({ notify }) {
  const [status, setStatus] = useState('all');
  const [intent, setIntent] = useState('all');
  const [search, setSearch] = useState('');
  const [q] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('all');
  const { exportCsv, loading: exporting } = useExportCsv('/api/admin/contact-requests');
  const { data: staffData } = useAdminStaff();
  const staffList = staffData?.items || [];
  const currentUserId = loadAuth()?.user?.id;

  const { data, isLoading, isError, refetch } = useAdminContacts({ status, intent, q, page, perPage: 20, assignedTo, ...(fromDate && { fromDate }), ...(toDate && { toDate }) });
  const updateStatus = useUpdateContactStatus();
  const assignContact = useAssignContact();
  const createPaymentLink = useCreatePaymentLink();
  const [creatingLinkFor, setCreatingLinkFor] = useState(null);

  // UC11 — 1 query stats cho các tab (thay 4 query perPage=1).
  const { data: stats } = useContactStats({ intent, q });

  const result = data ?? { items: [], total: 0, page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));
  const statusCounts = { all: result.total, new: stats?.new ?? 0, consulting: stats?.consulting ?? 0, closed: stats?.closed ?? 0, found: stats?.found ?? 0 };

  const handleCreatePaymentLink = (contact) => {
    if (!contact.plateId || !contact.depositAmount) return;
    setCreatingLinkFor(contact.id);
    createPaymentLink.mutate({ contactRequestId: contact.id, amount: contact.depositAmount }, {
      onSuccess: (link) => { toast.success('Đã tạo link ZaloPay — gửi cho khách qua Zalo OA'); setSelected((s) => ({ ...s, paymentLink: link })); },
      onError: (e) => toast.error(e.message === 'zalopay_not_configured' ? 'Chưa cấu hình ZaloPay Merchant' : 'Tạo link thất bại'),
      onSettled: () => setCreatingLinkFor(null),
    });
  };

  const handleStatus = (id, label) => {
    if (updatingId) return;
    setUpdatingId(id);
    updateStatus.mutate({ id, status: STATUS_VAL[label] }, {
      onSuccess: () => { toast.success('Đã cập nhật trạng thái'); setUpdatingId(null); },
      onError: () => { toast.error('Lỗi cập nhật trạng thái'); setUpdatingId(null); },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <style>{'@keyframes bsd-spin { to { transform: rotate(360deg); } } .bsd-spin { animation: bsd-spin 0.8s linear infinite; }'}</style>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm tên / SĐT..."
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)', color: 'var(--text-body)', background: 'var(--white)', minWidth: 200 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Trạng thái:</span>
          <Select value={status === 'all' ? 'Tất cả' : STATUS_LABEL[status]} options={['Tất cả', ...STATUS_OPTS].map((o) => ({ value: o, label: o }))} onChange={(v) => { setStatus(v === 'Tất cả' ? 'all' : STATUS_VAL[v]); setPage(1); }} variant="pill" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Mục đích:</span>
          <Select value={intent === 'all' ? 'Tất cả' : INTENT_LABEL[intent]} options={INTENT_OPTS.map((o) => ({ value: o, label: o }))} onChange={(v) => { setIntent(v === 'Tất cả' ? 'all' : INTENT_VAL[v]); setPage(1); }} variant="pill" />
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Từ ngày
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} style={{ height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 8px', font: 'var(--type-caption)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Đến ngày
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} style={{ height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 8px', font: 'var(--type-caption)' }} />
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Phụ trách:</span>
          <Select value={assignedTo === 'all' ? 'Tất cả' : assignedTo === 'me' ? 'Của tôi' : 'Chưa gán'}
            options={[{ value: 'Tất cả', label: 'Tất cả' }, { value: 'Của tôi', label: 'Của tôi' }, { value: 'Chưa gán', label: 'Chưa gán' }]}
            onChange={(v) => { setAssignedTo(v === 'Tất cả' ? 'all' : v === 'Của tôi' ? 'me' : 'unassigned'); setPage(1); }} variant="pill" />
        </div>
        <Button variant="ghost" size="md" disabled={exporting} onClick={() => exportCsv({ status, intent, q, ...(fromDate && { fromDate }), ...(toDate && { toDate }) }).catch((e) => notify(e.message))}>
          {exporting ? 'Đang xuất…' : 'Xuất CSV'}
        </Button>
        <span style={{ flex: 1, font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'right' }}>{result.total} yêu cầu</span>
      </div>

      <div role="tablist" aria-label="Lọc theo trạng thái" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {[['all', 'Tất cả'], ['new', 'Mới'], ['consulting', 'Đang tư vấn'], ['closed', 'Đã chốt'], ['found', 'Đã tìm thấy']].map(([val, label]) => {
          const active = status === val;
          return (
            <button key={val} role="tab" aria-selected={active} onClick={() => { setStatus(val); setPage(1); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', border: 'none',
                borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                background: active ? 'var(--action-primary)' : 'var(--white)', color: active ? 'var(--text-inverse)' : 'var(--text-body)',
                boxShadow: 'var(--shadow-inset-hairline)',
              }}>
              <span>{label}</span>
              <span style={{ display: 'inline-flex', minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', padding: '0 6px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', background: active ? 'rgba(255,255,255,.22)' : 'var(--grey-100)', color: active ? 'var(--text-inverse)' : 'var(--text-muted)' }}>{statusCounts[val]}</span>
            </button>
          );
        })}
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 820 }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '1 1 96px' }}>Khách hàng</span>
          <span style={{ flex: '1 1 88px' }}>Điện thoại</span>
          <span style={{ flex: '1 1 100px' }}>Biển quan tâm</span>
          <span style={{ flex: '1 1 72px' }}>Mục đích</span>
          <span style={{ flex: '1 1 120px' }}>Ghi chú</span>
          <span style={{ flex: '1 1 80px' }}>Đặt cọc</span>
          <span style={{ flex: '1 1 64px' }}>Thời gian</span>
          <span style={{ flex: '1 1 120px' }}>Phụ trách</span>
          <span style={{ flex: '1 1 160px' }}>Trạng thái</span>
        </div>

        {isLoading && <div style={{ padding: 'var(--space-4) var(--gutter-card)' }}><SkeletonTable rows={5} cols={8} /></div>}

        {isError && (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lỗi tải dữ liệu. Vui lòng thử lại.</span>
            <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
          </div>
        )}

        {!isLoading && !isError && result.items.map((c) => {
          const parsed = parsePlateNumber(c.plateNumber);
          return (
            <div key={c.id} onClick={() => setSelected(c)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSelected(c); } }}
              title="Xem chi tiết" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', cursor: 'pointer' }}>
              <span style={{ flex: '1 1 96px', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{c.fullName}</span>
              <span style={{ flex: '1 1 88px', display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                {c.phone}
                <a href={`tel:${c.phone}`} aria-label={`Gọi ${c.phone}`} onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', color: 'var(--action-primary)' }}><Phone size={14} /></a>
                <a href={`https://zalo.me/${c.phone}`} target="_blank" rel="noreferrer" aria-label="Chat Zalo" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', color: 'var(--blue-700)' }}><MessageCircle size={14} /></a>
              </span>
              <span style={{ flex: '1 1 100px' }}>
                {parsed ? <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} /> : <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>—</span>}
              </span>
              <span style={{ flex: '1 1 72px' }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', background: `color-mix(in srgb, ${INTENT_COLOR[c.intent] || 'var(--text-muted)'} 16%, transparent)`, color: INTENT_COLOR[c.intent] || 'var(--text-muted)' }}>
                  {INTENT_LABEL[c.intent] || c.intent}
                </span>
              </span>
              <span style={{ flex: '1 1 120px', font: 'var(--type-caption)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.note}>{c.note || '—'}</span>
              <span style={{ flex: '1 1 80px', font: 'var(--type-caption)', color: 'var(--text-strong)' }}>{c.depositAmount != null ? new Intl.NumberFormat('vi-VN').format(c.depositAmount) + ' đ' : '—'}</span>
              <span style={{ flex: '1 1 64px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                {formatDate(c.createdAt)}
              </span>
              <span onClick={(e) => e.stopPropagation()} style={{ flex: '1 1 120px' }}>
                <Select
                  value={c.assignedStaffId ? (c.assignedStaffName || '—') : 'Chưa gán'}
                  options={[{ value: 'Chưa gán', label: 'Chưa gán' }, ...staffList.map((s) => ({ value: s.fullName, label: s.fullName, _id: s.id }))]}
                  onChange={(v) => {
                    if (v === 'Chưa gán') { assignContact.mutate({ id: c.id, staffId: null }); return; }
                    const staff = staffList.find((s) => s.fullName === v);
                    if (staff) assignContact.mutate({ id: c.id, staffId: staff.id });
                  }}
                  variant="pill"
                  style={{ whiteSpace: 'nowrap', color: c.assignedStaffId ? 'var(--text-strong)' : 'var(--text-faint)' }}
                />
              </span>
              <span onClick={(e) => e.stopPropagation()} style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <AuditHistoryButton entityType="contact_request" entityId={c.id} />
                {updatingId === c.id ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                    <Loader2 size={16} className="bsd-spin" />
                    <span style={{ color: STATUS_COLOR[c.status] || 'var(--text-strong)' }}>{STATUS_LABEL[c.status] || c.status}</span>
                  </span>
                ) : (
                  <Select
                    value={STATUS_LABEL[c.status] || c.status}
                    options={STATUS_OPTS.map((o) => ({ value: o, label: o }))}
                    onChange={(v) => handleStatus(c.id, v)}
                    variant="pill"
                    style={{ color: STATUS_COLOR[c.status] || 'var(--text-strong)' }}
                  />
                )}
              </span>
            </div>
          );
        })}
        </div>
        </div>

        {!isLoading && !isError && result.items.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có yêu cầu nào.</div>}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page <= 1 ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page <= 1 ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }} aria-label="Trang trước">‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined} style={{
              minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)',
              background: p === page ? 'var(--action-primary)' : 'var(--white)',
              color: p === page ? 'var(--white)' : 'var(--text-body)',
              font: 'var(--type-body-sm)', fontWeight: p === page ? 'var(--fw-bold)' : 'var(--fw-medium)',
              cursor: 'pointer', boxShadow: 'var(--shadow-inset-hairline)',
            }}>{p}</button>
          ))}
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page >= totalPages ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page >= totalPages ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }} aria-label="Trang sau">›</button>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.fullName || ''} maxWidth="520px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {selected && (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{INTENT_LABEL[selected.intent] || selected.intent}</span>
                {selected.source && <Badge tone="blue">{SOURCE_LABEL[selected.source] || selected.source}</Badge>}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Điện thoại</span>
                <a href={`tel:${selected.phone}`} style={{ font: 'var(--type-body)', color: 'var(--text-link)', textDecoration: 'none' }}>{selected.phone}</a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Biển quan tâm</span>
                {selected.plateNumber ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <PlateVisual size="sm" {...(parsePlateNumber(selected.plateNumber) || {})} />
                    {selected.plateId
                      ? <a href={routeFor('detail', selected.plateId)} style={{ font: 'var(--type-body-sm)', color: 'var(--text-link)', textDecoration: 'none' }}>Xem biển {selected.plateNumber} →</a>
                      : <span style={{ font: 'var(--type-body)', color: 'var(--text-strong)' }}>{selected.plateNumber}</span>}
                  </span>
                ) : (
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-faint)' }}>Khách hỏi chung, không có biển cụ thể</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Đặt cọc</span>
                <span style={{ font: 'var(--type-body)', color: 'var(--text-strong)' }}>{selected.depositAmount != null ? new Intl.NumberFormat('vi-VN').format(selected.depositAmount) + ' đ' : '—'}</span>
              </div>

              {selected.plateId && selected.depositAmount != null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Thanh toán ZaloPay</span>
                  {selected.paymentLink?.paymentUrl ? (
                    <a href={selected.paymentLink.paymentUrl} target="_blank" rel="noreferrer" style={{ font: 'var(--type-body-sm)', color: 'var(--text-link)' }}>
                      Mở link đã tạo — gửi cho khách qua Zalo OA →
                    </a>
                  ) : (
                    <Button variant="outline" size="sm" disabled={creatingLinkFor === selected.id} onClick={() => handleCreatePaymentLink(selected)}>
                      {creatingLinkFor === selected.id ? 'Đang tạo…' : 'Tạo link ZaloPay'}
                    </Button>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Ghi chú yêu cầu</span>
                <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>
                  {selected.note || <span style={{ color: 'var(--text-faint)' }}>Không có ghi chú</span>}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Thời gian gửi</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{formatDateTime(selected.createdAt)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Trạng thái xử lý</span>
                {updatingId === selected.id ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                    <Loader2 size={16} className="bsd-spin" />
                    <span style={{ color: STATUS_COLOR[selected.status] || 'var(--text-strong)' }}>{STATUS_LABEL[selected.status] || selected.status}</span>
                  </span>
                ) : (
                  <Select
                    value={STATUS_LABEL[selected.status] || selected.status}
                    options={STATUS_OPTS.map((o) => ({ value: o, label: o }))}
                    onChange={(v) => { handleStatus(selected.id, v); setSelected((s) => ({ ...s, status: STATUS_VAL[v] })); }}
                    variant="pill"
                    style={{ color: STATUS_COLOR[selected.status] || 'var(--text-strong)' }}
                  />
                )}
              </div>

              <InternalNotesPanel entityType="contact_request" entityId={selected.id} />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
