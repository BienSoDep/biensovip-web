import { Loader2, MessageCircle, Phone, SlidersHorizontal, LayoutGrid, List as ListIcon, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../../../components/Button.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import AuditHistoryButton from '../../../components/AuditHistoryButton.jsx';
import { Select, IconButton } from '../../../components/index.jsx';
import { SkeletonTable } from '../../../components/Skeleton.jsx';
import { formatDate } from '../../../lib/date.js';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { toZaloUrl } from '../../../lib/zaloMessage.js';
import {
  INTENT_LABEL,
  INTENT_COLOR,
  SOURCE_LABEL,
  STATUS_OPTS,
  STATUS_LABEL,
  STATUS_COLOR,
  STATUS_VAL,
  INTENT_OPTS,
  daysLeftInTrash,
} from './contactUtils.js';

export default function ContactTable({
  // Search & filters
  search, setSearch,
  status, setStatus,
  intent, setIntent,
  fromDate, setFromDate,
  toDate, setToDate,
  assignedTo, setAssignedTo,
  setPage, page, totalPages,
  activeFiltersCount,

  // Mobile state
  mobileFiltersOpen, setMobileFiltersOpen,
  mobileView, setMobileView,

  // Export
  exportCsv, exporting,

  // Status counts & list
  result, statusCounts,
  isLoading, isError, refetch,

  // Staff & selection
  staffList,
  setSelected,
  updatingId,
  handleStatus,
  setDeleteTarget,
  setViewingTx,
  assignContact,
  notify,

  // Trash
  deletedItems, deletedLoading, restoreContact, handleRestore,
}) {
  return (
    <>
      <style>{'@keyframes bsd-spin { to { transform: rotate(360deg); } } .bsd-spin { animation: bsd-spin 0.8s linear infinite; }'}</style>

      {/* Mobile-only top bar */}
      <div className="admin-contacts-mobile-bar" style={{ flexDirection: 'column', gap: 'var(--space-3)' }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm tên / SĐT..."
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 14px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)', color: 'var(--text-body)', background: 'var(--white)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            variant={mobileFiltersOpen ? 'dark' : 'ghost'}
            size="sm"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <SlidersHorizontal size={14} />
            <span>Bộ lọc {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
            {mobileFiltersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>

          <div style={{ display: 'inline-flex', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', padding: 2, border: '1px solid var(--grey-200)' }}>
            <button
              type="button"
              onClick={() => setMobileView('card')}
              style={{
                border: 'none',
                background: mobileView === 'card' ? 'var(--white)' : 'none',
                boxShadow: mobileView === 'card' ? 'var(--shadow-1)' : 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 10px',
                font: 'var(--type-caption)',
                fontWeight: mobileView === 'card' ? 'var(--fw-semibold)' : 'var(--fw-regular)',
                color: mobileView === 'card' ? 'var(--text-strong)' : 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <LayoutGrid size={13} /> Thẻ
            </button>
            <button
              type="button"
              onClick={() => setMobileView('table')}
              style={{
                border: 'none',
                background: mobileView === 'table' ? 'var(--white)' : 'none',
                boxShadow: mobileView === 'table' ? 'var(--shadow-1)' : 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 10px',
                font: 'var(--type-caption)',
                fontWeight: mobileView === 'table' ? 'var(--fw-semibold)' : 'var(--fw-regular)',
                color: mobileView === 'table' ? 'var(--text-strong)' : 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <ListIcon size={13} /> Bảng
            </button>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className={`admin-contacts-filters ${mobileFiltersOpen ? 'admin-filters-mobile-open' : ''}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm tên / SĐT..."
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)', color: 'var(--text-body)', background: 'var(--white)', minWidth: 200 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Trạng thái:</span>
          <Select
            value={status === 'all' ? 'Tất cả' : STATUS_LABEL[status]}
            options={['Tất cả', ...STATUS_OPTS].map((o) => ({ value: o, label: o }))}
            onChange={(v) => { setStatus(v === 'Tất cả' ? 'all' : STATUS_VAL[v]); setPage(1); }}
            variant="pill"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Mục đích:</span>
          <Select
            value={intent === 'all' ? 'Tất cả' : INTENT_LABEL[intent]}
            options={INTENT_OPTS.map((o) => ({ value: o, label: o }))}
            onChange={(v) => { setIntent(v === 'Tất cả' ? 'all' : STATUS_VAL[v]); setPage(1); }}
            variant="pill"
          />
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
          <Select
            value={assignedTo === 'all' ? 'Tất cả' : assignedTo === 'me' ? 'Của tôi' : 'Chưa gán'}
            options={[{ value: 'Tất cả', label: 'Tất cả' }, { value: 'Của tôi', label: 'Của tôi' }, { value: 'Chưa gán', label: 'Chưa gán' }]}
            onChange={(v) => { setAssignedTo(v === 'Tất cả' ? 'all' : v === 'Của tôi' ? 'me' : 'unassigned'); setPage(1); }}
            variant="pill"
          />
        </div>
        <Button variant="ghost" size="md" disabled={exporting} onClick={() => exportCsv({ status, intent, ...(fromDate && { fromDate }), ...(toDate && { toDate }) }).catch((e) => notify(e?.message || 'Xuất CSV thất bại, thử lại.'))}>
          {exporting ? 'Đang xuất…' : 'Xuất CSV'}
        </Button>
        <span style={{ flex: 1, font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'right' }}>{result.total} yêu cầu</span>
      </div>

      {/* Horizontally scrollable status tabs */}
      <div role="tablist" aria-label="Lọc theo trạng thái" className="admin-tablist">
        {[['all', 'Tất cả'], ['new', 'Mới'], ['consulting', 'Đang tư vấn'], ['closed', 'Đã chốt'], ['cancelled', 'Hủy']].map(([val, label]) => {
          const active = status === val;
          return (
            <button
              key={val}
              role="tab"
              aria-selected={active}
              onClick={() => { setStatus(val); setPage(1); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', border: 'none',
                borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                background: active ? 'var(--action-primary)' : 'var(--white)', color: active ? 'var(--text-inverse)' : 'var(--text-body)',
                boxShadow: 'var(--shadow-inset-hairline)',
              }}
            >
              <span>{label}</span>
              <span style={{
                display: 'inline-flex', minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
                padding: '0 6px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)',
                background: active ? 'rgba(255,255,255,.22)' : 'var(--grey-100)', color: active ? 'var(--text-inverse)' : 'var(--text-muted)',
              }}>
                {statusCounts[val]}
              </span>
            </button>
          );
        })}
        {deletedItems.length > 0 && (
          <button
            type="button"
            onClick={() => document.getElementById('contact-trash')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', border: 'none',
              borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-medium)',
              background: 'var(--white)', color: 'var(--text-body)', boxShadow: 'var(--shadow-inset-hairline)',
            }}
          >
            <span>Thùng rác</span>
            <span style={{ display: 'inline-flex', minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', padding: '0 6px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', background: 'var(--grey-100)', color: 'var(--text-muted)' }}>
              {deletedItems.length}
            </span>
          </button>
        )}
      </div>

      {/* Mobile Card View */}
      <div className={`admin-contacts-cards-container ${mobileView === 'card' ? 'is-active' : ''}`}>
        {isLoading && <div style={{ padding: 'var(--space-4)' }}><SkeletonTable rows={4} cols={2} /></div>}

        {isError && (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lỗi tải dữ liệu. Vui lòng thử lại.</span>
            <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
          </div>
        )}

        {!isLoading && !isError && result.items.length === 0 && (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có yêu cầu nào.</div>
        )}

        {!isLoading && !isError && result.items.map((c) => {
          const parsed = parsePlateNumber(c.plateNumber);
          return (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-inset-hairline)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                cursor: 'pointer',
              }}
            >
              {/* Header: Customer name + Intent + Time */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', fontWeight: 'var(--fw-bold)' }}>{c.fullName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', background: `color-mix(in srgb, ${INTENT_COLOR[c.intent] || 'var(--text-muted)'} 16%, transparent)`, color: INTENT_COLOR[c.intent] || 'var(--text-muted)' }}>
                      {INTENT_LABEL[c.intent] || c.intent}
                    </span>
                    {c.source && <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-faint)' }}>• {SOURCE_LABEL[c.source] || c.source}</span>}
                  </div>
                </div>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {formatDate(c.createdAt)}
                </span>
              </div>

              {/* Phone & Quick Contact Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: '6px 12px' }}>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{c.phone}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }} onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`tel:${c.phone}`}
                    aria-label={`Gọi ${c.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--mint-100)',
                      color: 'var(--status-success-ink)',
                      font: 'var(--type-caption)',
                      fontWeight: 'var(--fw-semibold)',
                      textDecoration: 'none',
                    }}
                  >
                    <Phone size={13} /> Gọi
                  </a>
                  <a
                    href={toZaloUrl(c.phone)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Chat Zalo"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--blue-50)',
                      color: 'var(--blue-700)',
                      font: 'var(--type-caption)',
                      fontWeight: 'var(--fw-semibold)',
                      textDecoration: 'none',
                    }}
                  >
                    <MessageCircle size={13} /> Zalo
                  </a>
                </div>
              </div>

              {/* Plate of Interest & Deposit Info */}
              {(parsed.num || c.plateNumber || c.transactionId) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Biển:</span>
                    {parsed.num ? (
                      <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} />
                    ) : (
                      <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)' }}>{c.plateNumber || '—'}</span>
                    )}
                  </div>
                  {c.transactionId && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setViewingTx(c); }}
                      style={{ display: 'inline-block', padding: '2px 8px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', background: 'color-mix(in srgb, var(--status-success) 16%, transparent)', color: 'var(--status-success)', cursor: 'pointer' }}
                    >
                      Đã đặt cọc
                    </button>
                  )}
                </div>
              )}

              {/* Note preview if any */}
              {c.note && (
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', background: 'var(--surface-sunken)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--action-primary)' }}>
                  {c.note}
                </div>
              )}

              {/* Assignment & Status Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--grey-100)' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Phụ trách:</span>
                  <Select
                    value={c.assignedStaffId ? (c.assignedStaffName || '—') : 'Chưa gán'}
                    options={[{ value: 'Chưa gán', label: 'Chưa gán' }, ...staffList.map((s) => ({ value: s.fullName, label: s.fullName, _id: s.id }))]}
                    onChange={(v) => {
                      const onError = (err) => notify?.(err?.message || 'Gán nhân viên thất bại, thử lại.');
                      if (v === 'Chưa gán') { assignContact.mutate({ id: c.id, staffId: null }, { onError }); return; }
                      const staff = staffList.find((s) => s.fullName === v);
                      if (staff) assignContact.mutate({ id: c.id, staffId: staff.id }, { onError });
                    }}
                    variant="pill"
                    style={{ whiteSpace: 'nowrap', color: c.assignedStaffId ? 'var(--text-strong)' : 'var(--text-faint)', boxShadow: 'inset 0 0 0 1px var(--grey-200)' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <AuditHistoryButton entityType="contact_request" entityId={c.id} />
                    <IconButton name="trash-2" label="Xóa liên hệ" size="sm" onClick={() => setDeleteTarget(c)} />
                  </div>

                  {updatingId === c.id ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                      <Loader2 size={16} className="bsd-spin" />
                      <span style={{ color: STATUS_COLOR[c.status] || 'var(--text-strong)' }}>{STATUS_LABEL[c.status] || c.status}</span>
                    </span>
                  ) : c.status === 'cancelled' ? (
                    <Button variant="outline" size="sm" onClick={() => { if (window.confirm(`Đưa liên hệ ${c.fullName} về trạng thái "Mới"?`)) handleStatus(c.id, 'Mới'); }}>Khôi phục</Button>
                  ) : (
                    <Select
                      value={STATUS_LABEL[c.status] || c.status}
                      options={STATUS_OPTS.map((o) => ({ value: o, label: o }))}
                      onChange={(v) => handleStatus(c.id, v)}
                      variant="pill"
                      style={{ color: STATUS_COLOR[c.status] || 'var(--text-strong)' }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className={`admin-contacts-table-container ${mobileView === 'table' ? 'force-mobile-table' : ''}`} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div className="admin-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div className="admin-rows" style={{ minWidth: 820 }}>
            <div className="admin-head" style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              <span style={{ flex: '1 1 96px' }}>Khách hàng</span>
              <span style={{ flex: '1 1 88px' }}>Điện thoại</span>
              <span style={{ flex: '1 1 100px' }}>Biển quan tâm</span>
              <span style={{ flex: '1 1 72px' }}>Mục đích</span>
              <span className="contact-col-note" style={{ flex: '1 1 120px' }}>Ghi chú</span>
              <span style={{ flex: '1 1 80px' }}>Đặt cọc</span>
              <span className="contact-col-time" style={{ flex: '1 1 64px' }}>Thời gian</span>
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
                <div
                  className="admin-row"
                  key={c.id}
                  onClick={() => setSelected(c)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSelected(c); } }}
                  title="Xem chi tiết"
                  style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', cursor: 'pointer' }}
                >
                  <span data-primary data-label="Khách hàng" style={{ flex: '1 1 96px', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{c.fullName}</span>
                  <span data-label="Điện thoại" style={{ flex: '1 1 88px', display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                    {c.phone}
                    <a href={`tel:${c.phone}`} aria-label={`Gọi ${c.phone}`} onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', color: 'var(--action-primary)' }}><Phone size={14} /></a>
                    <a href={toZaloUrl(c.phone)} target="_blank" rel="noreferrer" aria-label="Chat Zalo" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', color: 'var(--blue-700)' }}><MessageCircle size={14} /></a>
                  </span>
                  <span data-label="Biển quan tâm" style={{ flex: '1 1 100px' }}>
                    {parsed.num ? <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} /> : <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>—</span>}
                  </span>
                  <span data-label="Mục đích" style={{ flex: '1 1 72px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', background: `color-mix(in srgb, ${INTENT_COLOR[c.intent] || 'var(--text-muted)'} 16%, transparent)`, color: INTENT_COLOR[c.intent] || 'var(--text-muted)' }}>
                      {INTENT_LABEL[c.intent] || c.intent}
                    </span>
                  </span>
                  <span className="contact-col-note" data-label="Ghi chú" style={{ flex: '1 1 120px', font: 'var(--type-caption)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.note}>{c.note || '—'}</span>
                  <span data-label="Đặt cọc" style={{ flex: '1 1 80px' }}>
                    {c.transactionId ? (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setViewingTx(c); }}
                        style={{ display: 'inline-block', padding: '2px 8px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', background: 'color-mix(in srgb, var(--status-success) 16%, transparent)', color: 'var(--status-success)', cursor: 'pointer' }}>Đã cọc</button>
                    ) : (
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>—</span>
                    )}
                  </span>
                  <span className="contact-col-time" data-label="Thời gian" style={{ flex: '1 1 64px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    {formatDate(c.createdAt)}
                  </span>
                  <span onClick={(e) => e.stopPropagation()} data-label="Phụ trách" style={{ flex: '1 1 120px' }}>
                    <Select
                      value={c.assignedStaffId ? (c.assignedStaffName || '—') : 'Chưa gán'}
                      options={[{ value: 'Chưa gán', label: 'Chưa gán' }, ...staffList.map((s) => ({ value: s.fullName, label: s.fullName, _id: s.id }))]}
                      onChange={(v) => {
                        const onError = (err) => notify?.(err?.message || 'Gán nhân viên thất bại, thử lại.');
                        if (v === 'Chưa gán') { assignContact.mutate({ id: c.id, staffId: null }, { onError }); return; }
                        const staff = staffList.find((s) => s.fullName === v);
                        if (staff) assignContact.mutate({ id: c.id, staffId: staff.id }, { onError });
                      }}
                      variant="pill"
                      style={{ whiteSpace: 'nowrap', color: c.assignedStaffId ? 'var(--text-strong)' : 'var(--text-faint)', boxShadow: 'inset 0 0 0 1px var(--grey-200)' }}
                    />
                  </span>
                  <span onClick={(e) => e.stopPropagation()} data-label="Trạng thái" style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    <AuditHistoryButton entityType="contact_request" entityId={c.id} />
                    <IconButton name="trash-2" label="Xóa liên hệ" size="sm" onClick={() => setDeleteTarget(c)} />
                    {updatingId === c.id ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                        <Loader2 size={16} className="bsd-spin" />
                        <span style={{ color: STATUS_COLOR[c.status] || 'var(--text-strong)' }}>{STATUS_LABEL[c.status] || c.status}</span>
                      </span>
                    ) : c.status === 'cancelled' ? (
                      <Button variant="outline" size="sm" onClick={() => { if (window.confirm(`Đưa liên hệ ${c.fullName} về trạng thái "Mới"?`)) handleStatus(c.id, 'Mới'); }}>Khôi phục</Button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page <= 1 ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page <= 1 ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }}
            aria-label="Trang trước"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              aria-current={p === page ? 'page' : undefined}
              style={{
                minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)',
                background: p === page ? 'var(--action-primary)' : 'var(--white)',
                color: p === page ? 'var(--white)' : 'var(--text-body)',
                font: 'var(--type-body-sm)', fontWeight: p === page ? 'var(--fw-bold)' : 'var(--fw-medium)',
                cursor: 'pointer', boxShadow: 'var(--shadow-inset-hairline)',
              }}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page >= totalPages ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page >= totalPages ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }}
            aria-label="Trang sau"
          >
            ›
          </button>
        </div>
      )}

      {/* Trash Tab */}
      {(deletedLoading || deletedItems.length > 0) && (
        <div id="contact-trash" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', scrollMarginTop: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)' }}>
            Liên hệ đã xóa {deletedItems.length > 0 && `(${deletedItems.length})`}
          </h3>
          {deletedLoading ? (
            <SkeletonTable rows={2} cols={4} />
          ) : (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
              {deletedItems.map((c) => {
                const daysLeft = daysLeftInTrash(c.deletedAt);
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-200)', font: 'var(--type-body-sm)', opacity: 0.75 }}>
                    <span style={{ flex: '1 1 120px' }}>
                      <div>{c.fullName}</div>
                      <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{c.phone}</div>
                    </span>
                    <span style={{ flex: '1 1 100px' }}>{c.plateNumber || '—'}</span>
                    <span style={{ flex: '1 1 110px', color: STATUS_COLOR[c.status] || 'var(--text-strong)' }}>{STATUS_LABEL[c.status] || c.status}</span>
                    <span style={{ flex: '1 1 140px', font: 'var(--type-caption)', color: 'var(--status-danger)' }}>
                      {daysLeft === 0 ? 'Xóa vĩnh viễn hôm nay' : `Tự xóa sau ${daysLeft} ngày`}
                    </span>
                    <Button variant="outline" size="sm" disabled={restoreContact.isPending} onClick={() => handleRestore(c)}>Khôi phục</Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
