import { useState } from 'react';
import { MessageCircle, Phone, Heart, Eye } from 'lucide-react';
import { useAdminInterestLeads, useClaimInterestLead, useUnclaimInterestLead, useMarkInterestLeadContacted } from '../../services/adminInterestLeads.js';
import { formatDate } from '../../lib/date.js';
import { Badge } from '../../components/index.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import { loadAuth } from '../../lib/authStore.js';

const STATUS_TABS = [['all', 'Tất cả'], ['unassigned', 'Chưa nhận'], ['mine', 'Của tôi'], ['contacted', 'Đã liên hệ']];
const SIGNAL_LABEL = { favorited: 'Đã thả tim', repeat_view: 'Xem nhiều lần' };

export default function AdminInterestLeads({ notify }) {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const currentUserId = loadAuth()?.user?.id;
  const isSuperAdmin = loadAuth()?.user?.role === 'super-admin';

  const { data, isLoading, isError, refetch } = useAdminInterestLeads({ status, page, perPage: 20 });
  const claim = useClaimInterestLead();
  const unclaim = useUnclaimInterestLead();
  const markContacted = useMarkInterestLeadContacted();

  const result = data ?? { items: [], total: 0, page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  const handleClaim = (id) => claim.mutate(id, {
    onSuccess: () => notify('Đã nhận tư vấn khách này'),
    onError: (e) => notify(e.code === 'ALREADY_CLAIMED' ? 'Nhân viên khác vừa nhận khách này rồi' : 'Nhận tư vấn thất bại'),
  });
  const handleUnclaim = (id) => unclaim.mutate(id, {
    onSuccess: () => notify('Đã bỏ nhận'),
    onError: () => notify('Thao tác thất bại'),
  });
  const handleContacted = (id) => markContacted.mutate(id, {
    onSuccess: () => notify('Đã đánh dấu đã liên hệ'),
    onError: () => notify('Thao tác thất bại'),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div role="tablist" aria-label="Lọc theo trạng thái" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {STATUS_TABS.map(([val, label]) => {
          const active = status === val;
          return (
            <button key={val} role="tab" aria-selected={active} onClick={() => { setStatus(val); setPage(1); }}
              style={{
                display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px', border: 'none',
                borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                background: active ? 'var(--action-primary)' : 'var(--white)', color: active ? 'var(--text-inverse)' : 'var(--text-body)',
                boxShadow: 'var(--shadow-inset-hairline)',
              }}>{label}</button>
          );
        })}
        <span style={{ flex: 1, font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'right', alignSelf: 'center' }}>{result.total} khách</span>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div className="admin-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 720 }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              <span style={{ flex: '1 1 96px' }}>Khách hàng</span>
              <span style={{ flex: '1 1 100px' }}>Biển quan tâm</span>
              <span style={{ flex: '1 1 100px' }}>Tín hiệu</span>
              <span style={{ flex: '1 1 80px' }}>Gần nhất</span>
              <span style={{ flex: '1 1 180px' }}>Trạng thái</span>
            </div>

            {isLoading && <div style={{ padding: 'var(--space-4) var(--gutter-card)' }}><SkeletonTable rows={5} cols={5} /></div>}

            {isError && (
              <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lỗi tải dữ liệu. Vui lòng thử lại.</span>
                <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
              </div>
            )}

            {!isLoading && !isError && result.items.length === 0 && (
              <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có khách nào ở mục này.</div>
            )}

            {!isLoading && !isError && result.items.map((lead) => {
              const mine = lead.assignedStaffId === currentUserId;
              return (
                <div key={lead.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                  <span style={{ flex: '1 1 96px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{lead.userFullName || 'Chưa cập nhật tên'}</span>
                    {lead.userPhone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        {lead.userPhone}
                        <a href={`tel:${lead.userPhone}`} aria-label={`Gọi ${lead.userPhone}`} style={{ display: 'inline-flex', color: 'var(--action-primary)' }}><Phone size={13} /></a>
                        <a href={`https://zalo.me/${lead.userPhone}`} target="_blank" rel="noreferrer" aria-label="Chat Zalo" style={{ display: 'inline-flex', color: 'var(--blue-700)' }}><MessageCircle size={13} /></a>
                      </span>
                    )}
                  </span>
                  <span style={{ flex: '1 1 100px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{lead.plateNumber}</span>
                  <span style={{ flex: '1 1 100px' }}>
                    <Badge tone={lead.signal === 'favorited' ? 'rose' : 'blue'}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {lead.signal === 'favorited' ? <Heart size={12} /> : <Eye size={12} />}
                        {lead.signal === 'favorited' ? SIGNAL_LABEL.favorited : `${SIGNAL_LABEL.repeat_view} (${lead.viewCount})`}
                      </span>
                    </Badge>
                  </span>
                  <span style={{ flex: '1 1 80px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(lead.lastActivityAt)}</span>
                  <span style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {lead.contacted ? (
                      <Badge tone="mint">Đã liên hệ</Badge>
                    ) : !lead.assignedStaffId ? (
                      <Button variant="primary" size="sm" loading={claim.isPending} onClick={() => handleClaim(lead.id)}>Nhận tư vấn</Button>
                    ) : mine ? (
                      <>
                        <Button variant="primary" size="sm" loading={markContacted.isPending} onClick={() => handleContacted(lead.id)}>Đã liên hệ</Button>
                        <Button variant="ghost" size="sm" loading={unclaim.isPending} onClick={() => handleUnclaim(lead.id)}>Bỏ nhận</Button>
                      </>
                    ) : (
                      <>
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{lead.assignedStaffName || 'Đã có người nhận'}</span>
                        {isSuperAdmin && <Button variant="ghost" size="sm" loading={unclaim.isPending} onClick={() => handleUnclaim(lead.id)}>Giải phóng</Button>}
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)' }}>
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Trước</Button>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Trang {page} / {totalPages}</span>
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau →</Button>
          </div>
        )}
      </div>
    </div>
  );
}
