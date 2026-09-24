import {
  CarFront, ArrowUpDown, ArrowUp, ArrowDown, TriangleAlert, Star, Gift,
  SlidersHorizontal, LayoutGrid, List as ListIcon, ChevronDown, ChevronUp,
} from 'lucide-react';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import AuditHistoryButton from '../../../components/AuditHistoryButton.jsx';
import { Select, IconButton, SearchField, InfoTip } from '../../../components/index.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import { formatDate } from '../../../lib/date.js';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import {
  DATA_ISSUE_LABELS,
  PER_PAGE_OPTIONS,
  HOT_OPTIONS,
  STATUS_OPTIONS,
  TOGGLEABLE_COLUMNS,
  fmt,
  isNewPlate,
} from './plateUtils.js';

export default function PlateTable({
  // Filter state
  keyword, setKeyword,
  status, setStatus,
  fromDate, setFromDate,
  toDate, setToDate,
  perPage, setPerPage,
  plateTypeFilter, setPlateTypeFilter,
  vehicleTypeFilter, setVehicleTypeFilter,
  provinceFilter, setProvinceFilter,
  hotFilter, setHotFilter,
  setPage, page,

  // Mobile state
  mobileFiltersOpen, setMobileFiltersOpen,
  mobileView, setMobileView,
  activeFiltersCount,

  // Column prefs
  colPrefs, toggleCol,
  colMenuOpen, setColMenuOpen,

  // Top action handlers
  exportCsv, exporting,
  checkingMissingInfo, openMissingInfoModal,
  checkingMissingImage, openMissingImageModal,
  checkingGeneratedImage, openPurgeImageModal,
  openAdd, openEdit,

  // Category options
  plateTypes, vehicleTypes, provinces,

  // Table data
  plates, sortedPlates, isLoading, isError, refetch, totalPages,
  selected, toggleAll, toggleOne, allSelected, someSelected,
  dataIssuesByPlateId, toggleHot, generatingRowId, generateRowImage,
  setConfirmDelete, setConfirmBulkDelete, bulkStatus,
  statusMut,
  sort, toggleSort,
  cell, setCell, commitPrice,
  notify,
}) {
  const SortHeader = ({ label, sortKey, style, className }) => (
    <button
      type="button"
      className={className}
      onClick={() => toggleSort(sortKey)}
      aria-sort={sort?.key === sortKey ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: 'inherit',
        font: 'inherit',
        fontSize: 'inherit',
        letterSpacing: 'inherit',
        textTransform: 'inherit',
      }}
    >
      {label}
      {sort?.key === sortKey ? (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
    </button>
  );

  const renderCell = (p, field) => {
    const editing = cell?.id === p.id && cell?.field === field;
    const cellStyle = {
      border: 'none',
      background: 'none',
      cursor: 'text',
      font: 'var(--type-caption)',
      color: 'var(--text-strong)',
      textAlign: 'left',
      padding: '4px 6px',
      borderRadius: 'var(--radius-sm)',
      width: '100%',
    };
    if (field === 'price') {
      if (editing) {
        return (
          <input
            autoFocus
            value={cell.value}
            onChange={(e) => setCell({ ...cell, value: e.target.value })}
            onBlur={() => commitPrice(p)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitPrice(p);
              if (e.key === 'Escape') setCell(null);
            }}
            onFocus={(e) => e.target.select()}
            style={{ ...cellStyle, background: 'var(--white)', boxShadow: 'inset 0 0 0 1.5px var(--action-primary)' }}
          />
        );
      }
      return (
        <button
          type="button"
          onClick={() => setCell({ id: p.id, field: 'price', value: p.priceOnRequest ? '' : String(p.price || '') })}
          style={cellStyle}
          title="Bấm để sửa giá"
        >
          {p.priceOnRequest ? 'Giá liên hệ' : (p.price ? fmt(p.price) : '—')}
        </button>
      );
    }
    return null;
  };

  return (
    <>
      {/* Mobile-only control bar */}
      <div className="admin-plates-mobile-bar" style={{ flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchField placeholder="Tìm biển số…" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
          </div>
          <Button variant="primary" size="sm" onClick={openAdd} style={{ flexShrink: 0 }}>+ Thêm</Button>
        </div>
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

      {/* Filter toolbar (collapsible on mobile, visible on desktop) */}
      <div className={`admin-plates-filters ${mobileFiltersOpen ? 'admin-filters-mobile-open' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Header row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          <Select label="Trạng thái" value={status} options={STATUS_OPTIONS} onChange={(v) => { setStatus(v); setPage(1); }} />
          <SearchField placeholder="Tìm biển số…" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} width={220} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Từ ngày
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} style={{ height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 8px', font: 'var(--type-caption)' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Đến ngày
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} style={{ height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 8px', font: 'var(--type-caption)' }} />
          </label>
          <Select label="Hiển thị" value={perPage} options={PER_PAGE_OPTIONS} onChange={(v) => { setPerPage(Number(v)); setPage(1); }} />
          <div style={{ position: 'relative' }}>
            <Button variant="ghost" size="md" onClick={() => setColMenuOpen((o) => !o)}>Cột hiển thị</Button>
            {colMenuOpen && (
              <>
                <div onClick={() => setColMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 10, background: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-2)', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {TOGGLEABLE_COLUMNS.map((c) => (
                    <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                      <input type="checkbox" checked={!!colPrefs[c.key]} onChange={() => toggleCol(c.key)} style={{ width: 14, height: 14, accentColor: 'var(--action-primary)', cursor: 'pointer' }} />
                      {c.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" size="md" disabled={exporting} onClick={() => exportCsv({ status, keyword, ...(fromDate && { fromDate }), ...(toDate && { toDate }) }).catch((e) => notify(e.message))}>
            {exporting ? 'Đang xuất…' : 'Xuất CSV'}
          </Button>
          <Button variant="ghost" size="md" disabled={checkingMissingInfo} onClick={openMissingInfoModal}>
            {checkingMissingInfo ? 'Đang kiểm tra…' : 'Sinh thông tin hàng loạt'}
          </Button>
          <Button variant="ghost" size="md" disabled={checkingMissingImage} onClick={openMissingImageModal}>
            {checkingMissingImage ? 'Đang kiểm tra…' : 'Sinh ảnh hàng loạt'}
          </Button>
          <Button variant="ghost" size="md" disabled={checkingGeneratedImage} onClick={openPurgeImageModal}>
            {checkingGeneratedImage ? 'Đang kiểm tra…' : 'Xóa ảnh sinh cũ'}
          </Button>
          <Button variant="primary" size="md" onClick={openAdd}>Thêm biển số (đầy đủ)</Button>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          <Select label="Loại biển" value={plateTypeFilter} options={[{ value: '', label: 'Tất cả' }, ...plateTypes]} onChange={(v) => { setPlateTypeFilter(v); setPage(1); }} />
          <Select label="Loại xe" value={vehicleTypeFilter} options={[{ value: '', label: 'Tất cả' }, ...vehicleTypes]} onChange={(v) => { setVehicleTypeFilter(v); setPage(1); }} />
          <Select label="Tỉnh/thành" value={provinceFilter} options={[{ value: '', label: 'Tất cả' }, ...provinces]} onChange={(v) => { setProvinceFilter(v); setPage(1); }} />
          <Select label="Nổi bật" value={hotFilter} options={HOT_OPTIONS} onChange={(v) => { setHotFilter(v); setPage(1); }} />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className={`admin-plates-cards-container ${mobileView === 'card' ? 'is-active' : ''}`}>
        {isLoading && <div style={{ padding: 'var(--space-4)' }}><Skeleton variant="table" rows={6} /></div>}

        {!isLoading && isError && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--status-danger)' }}>
            Lỗi tải danh sách biển số.{' '}
            <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Thử lại</button>
          </div>
        )}

        {!isLoading && !isError && plates.length === 0 && (status !== 'all' || keyword) && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có biển số nào khớp bộ lọc.</div>
        )}

        {!isLoading && !isError && plates.length === 0 && status === 'all' && !keyword && (
          <div style={{ padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <CarFront size={40} style={{ color: 'var(--text-faint)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có biển số nào trong hệ thống</span>
            <Button variant="primary" size="md" onClick={openAdd}>Thêm biển số mới</Button>
          </div>
        )}

        {!isLoading && sortedPlates.map((p) => {
          const parsed = parsePlateNumber(p.plateNumber);
          return (
            <div
              key={p.id}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-inset-hairline)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${p.plateNumber}`}
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    style={{ width: 18, height: 18, accentColor: 'var(--action-primary)', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flexShrink: 0 }}>
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt="" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    ) : (
                      <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => toggleHot(p)}
                        title={p.isHot ? 'Bỏ đánh dấu nổi bật' : 'Đánh dấu nổi bật'}
                        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', flexShrink: 0 }}
                      >
                        <Star size={15} fill={p.isHot ? 'var(--amber-500)' : 'none'} color={p.isHot ? 'var(--amber-500)' : 'var(--grey-300)'} />
                      </button>
                      <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.plateNumber}
                      </span>
                      {dataIssuesByPlateId.has(p.id) && (
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          title={`Dữ liệu thiếu/sai: ${dataIssuesByPlateId.get(p.id).map((c) => DATA_ISSUE_LABELS[c] || c).join(', ')}`}
                          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', flexShrink: 0 }}
                        >
                          <TriangleAlert size={15} color="var(--status-danger)" />
                        </button>
                      )}
                    </div>
                    {isNewPlate(p) && (
                      <span style={{ alignSelf: 'flex-start', display: 'inline-block', padding: '0 6px', borderRadius: 'var(--radius-sm)', background: 'var(--mint-100)', color: 'var(--status-success-ink)', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', marginTop: 2 }}>
                        Mới
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)' }}>
                    {p.priceOnRequest ? 'Giá liên hệ' : (p.price ? fmt(p.price) : '—')}
                  </div>
                  {p.salePrice ? (
                    <div style={{ font: 'var(--type-caption)', color: 'var(--status-danger)', textDecoration: 'line-through' }}>
                      {fmt(p.salePrice)}
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {p.plateTypeName && (
                  <span style={{ background: 'var(--surface-sunken)', color: 'var(--text-body)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', font: 'var(--type-caption)' }}>
                    {p.plateTypeName}
                  </span>
                )}
                {p.vehicleTypeName && (
                  <span style={{ background: 'var(--surface-sunken)', color: 'var(--text-body)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', font: 'var(--type-caption)' }}>
                    {p.vehicleTypeName}
                  </span>
                )}
                {p.provinceName && (
                  <span style={{ background: 'var(--surface-sunken)', color: 'var(--text-body)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', font: 'var(--type-caption)' }}>
                    {p.provinceName}
                  </span>
                )}
                {p.giftedPlateNumber && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--brand-50)', color: 'var(--action-primary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)' }}>
                    <Gift size={12} /> Tặng {p.giftedPlateNumber}
                  </span>
                )}
                {p.pendingContactCount > 0 && (
                  <span style={{ background: 'var(--rose-100)', color: 'var(--status-danger)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)' }}>
                    {p.pendingContactCount} liên hệ
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--grey-100)' }}>
                <select
                  value={p.status}
                  onChange={(e) => statusMut.mutate({ id: p.id, status: e.target.value }, {
                    onSuccess: () => notify(e.target.value === 'sold' ? 'Đã đánh dấu Đã bán' : 'Đã đổi sang Còn hàng'),
                    onError: (err) => notify(err.message || 'Lỗi cập nhật trạng thái'),
                  })}
                  style={{
                    border: 'none',
                    background: p.status === 'sold' ? 'var(--grey-100)' : 'var(--mint-100)',
                    color: p.status === 'sold' ? 'var(--text-muted)' : 'var(--status-success-ink)',
                    fontWeight: 'var(--fw-semibold)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '5px 10px',
                    font: 'var(--type-caption)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="available">Còn hàng</option>
                  <option value="sold">Đã bán</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  {!p.imageCount && (
                    <IconButton name="image" label="Sinh ảnh" size="sm" disabled={generatingRowId === p.id} onClick={() => generateRowImage(p)} />
                  )}
                  <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(p)} />
                  <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => setConfirmDelete(p.id)} />
                  <AuditHistoryButton entityType="plate" entityId={p.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className={`admin-plates-table-container ${mobileView === 'table' ? 'force-mobile-table' : ''}`} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div className="admin-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 1180 }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              <span style={{ flex: '0 0 34px' }}>
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả"
                  checked={allSelected}
                  onChange={toggleAll}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  style={{ width: 16, height: 16, accentColor: 'var(--action-primary)', cursor: 'pointer' }}
                />
              </span>
              <span style={{ flex: '0 0 56px' }}>Ảnh</span>
              <SortHeader label="Biển số" sortKey="plateNumber" style={{ flex: '1 1 120px' }} />
              {colPrefs.plateType && <SortHeader label="Loại biển" sortKey="plateTypeName" style={{ flex: '1 1 88px' }} />}
              {colPrefs.vehicleType && <SortHeader label="Loại xe" sortKey="vehicleTypeName" style={{ flex: '1 1 88px' }} />}
              {colPrefs.province && <SortHeader label="Tỉnh" sortKey="provinceName" style={{ flex: '1 1 88px' }} />}
              {colPrefs.price && <SortHeader label="Giá (bấm sửa)" sortKey="price" style={{ flex: '1 1 110px' }} />}
              {colPrefs.salePrice && <SortHeader label="Giá KM" sortKey="salePrice" style={{ flex: '1 1 96px' }} />}
              {colPrefs.gifted && <span style={{ flex: '1 1 96px' }}>Biển tặng</span>}
              {colPrefs.isNew && <span className="plate-col-new" style={{ flex: '0 0 48px' }}>Mới</span>}
              {colPrefs.status && (
                <span style={{ flex: '1 1 100px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <SortHeader label="Trạng thái" sortKey="status" />
                  <InfoTip size={12} text="Trạng thái biển: Còn hàng = đang bán; Đã bán = chốt giao dịch; Hết hạn = biển đấu giá quá hạn, tự ẩn khỏi trang." />
                </span>
              )}
              {colPrefs.pendingContact && <SortHeader label="Liên hệ chờ" sortKey="pendingContactCount" style={{ flex: '0 0 96px' }} />}
              {colPrefs.imageCount && <SortHeader label="Số ảnh" sortKey="imageCount" style={{ flex: '0 0 76px' }} />}
              {colPrefs.createdAt && <SortHeader label="Ngày tạo" sortKey="createdAt" style={{ flex: '1 1 96px' }} />}
              {colPrefs.updatedAt && <SortHeader label="Cập nhật" sortKey="updatedAt" className="plate-col-updated" style={{ flex: '1 1 96px' }} />}
              <span style={{ flex: '0 0 80px' }}>Thao tác</span>
            </div>

            {isLoading && <div style={{ padding: 'var(--space-4)' }}><Skeleton variant="table" rows={6} /></div>}

            {!isLoading && sortedPlates.map((p) => {
              const parsed = parsePlateNumber(p.plateNumber);
              return (
                <div key={p.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-2) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                  <span style={{ flex: '0 0 34px' }}>
                    <input
                      type="checkbox"
                      aria-label={`Chọn ${p.plateNumber}`}
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      style={{ width: 16, height: 16, accentColor: 'var(--action-primary)', cursor: 'pointer' }}
                    />
                  </span>
                  <span style={{ flex: '0 0 56px' }}>
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    ) : (
                      <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} />
                    )}
                  </span>
                  <span style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => toggleHot(p)}
                      title={p.isHot ? 'Bỏ đánh dấu nổi bật' : 'Đánh dấu nổi bật'}
                      style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', flexShrink: 0 }}
                    >
                      <Star size={14} fill={p.isHot ? 'var(--amber-500)' : 'none'} color={p.isHot ? 'var(--amber-500)' : 'var(--grey-300)'} />
                    </button>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.plateNumber}</span>
                    {dataIssuesByPlateId.has(p.id) && (
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        title={`Dữ liệu thiếu/sai: ${dataIssuesByPlateId.get(p.id).map((c) => DATA_ISSUE_LABELS[c] || c).join(', ')} — bấm để sửa`}
                        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', flexShrink: 0 }}
                      >
                        <TriangleAlert size={14} color="var(--status-danger)" />
                      </button>
                    )}
                  </span>
                  {colPrefs.plateType && <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.plateTypeName}</span>}
                  {colPrefs.vehicleType && <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.vehicleTypeName}</span>}
                  {colPrefs.province && <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.provinceName}</span>}
                  {colPrefs.price && <span style={{ flex: '1 1 110px' }}>{renderCell(p, 'price')}</span>}
                  {colPrefs.salePrice && <span style={{ flex: '1 1 96px', font: 'var(--type-body-sm)', color: p.salePrice ? 'var(--status-danger)' : 'var(--text-faint)' }}>{p.salePrice ? fmt(p.salePrice) : '—'}</span>}
                  {colPrefs.gifted && (
                    <span style={{ flex: '1 1 96px', font: 'var(--type-body-sm)' }}>
                      {p.giftedPlateNumber ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>
                          <Gift size={13} />{p.giftedPlateNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>—</span>
                      )}
                    </span>
                  )}
                  {colPrefs.isNew && (
                    <span className="plate-col-new" style={{ flex: '0 0 48px' }}>
                      {isNewPlate(p) ? (
                        <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--mint-100)', color: 'var(--status-success-ink)', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)' }}>Mới</span>
                      ) : (
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>—</span>
                      )}
                    </span>
                  )}
                  {colPrefs.status && (
                    <span style={{ flex: '1 1 100px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <select
                        value={p.status}
                        onChange={(e) => statusMut.mutate({ id: p.id, status: e.target.value }, {
                          onSuccess: () => notify(e.target.value === 'sold' ? 'Đã đánh dấu Đã bán' : 'Đã đổi sang Còn hàng'),
                          onError: (err) => notify(err.message || 'Lỗi cập nhật trạng thái'),
                        })}
                        style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', font: 'var(--type-caption)', color: 'var(--text-body)', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="available">Còn hàng</option>
                        <option value="sold">Đã bán</option>
                      </select>
                    </span>
                  )}
                  {colPrefs.pendingContact && (
                    <span style={{ flex: '0 0 96px', font: 'var(--type-body-sm)', color: p.pendingContactCount > 0 ? 'var(--action-primary)' : 'var(--text-faint)', fontWeight: p.pendingContactCount > 0 ? 'var(--fw-semibold)' : 'var(--fw-regular)' }}>
                      {p.pendingContactCount > 0 ? p.pendingContactCount : '—'}
                    </span>
                  )}
                  {colPrefs.imageCount && <span style={{ flex: '0 0 76px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{p.imageCount ?? 0}</span>}
                  {colPrefs.createdAt && <span style={{ flex: '1 1 96px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</span>}
                  {colPrefs.updatedAt && <span className="plate-col-updated" style={{ flex: '1 1 96px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(p.updatedAt)}</span>}
                  <span style={{ flex: '0 0 104px', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    {!p.imageCount && (
                      <IconButton name="image" label="Sinh ảnh" size="sm" disabled={generatingRowId === p.id} onClick={() => generateRowImage(p)} />
                    )}
                    <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(p)} />
                    <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => setConfirmDelete(p.id)} />
                    <AuditHistoryButton entityType="plate" entityId={p.id} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {!isLoading && !isError && plates.length === 0 && (status !== 'all' || keyword) && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có biển số nào khớp bộ lọc.</div>
        )}
        {!isLoading && !isError && plates.length === 0 && status === 'all' && !keyword && (
          <div style={{ padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <CarFront size={40} style={{ color: 'var(--text-faint)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có biển số nào trong hệ thống</span>
            <Button variant="primary" size="md" onClick={openAdd}>Thêm biển số mới</Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)',
          zIndex: 'var(--z-bulk)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-2) var(--space-4)', background: 'var(--text-strong)', color: 'var(--white)',
          borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-4)', maxWidth: 'calc(100vw - 24px)', boxSizing: 'border-box',
        }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--white)' }}>Đã chọn {selected.size} biển</span>
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) { bulkStatus(e.target.value); e.target.value = ''; } }}
            style={{ border: 'none', background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', font: 'var(--type-caption)', color: 'var(--text-strong)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="" disabled>Đổi trạng thái ▾</option>
            <option value="available">Còn hàng</option>
            <option value="sold">Đã bán</option>
            <option value="inactive">Hết hạn</option>
          </select>
          <button
            type="button"
            onClick={() => setConfirmBulkDelete(true)}
            style={{ border: 'none', background: 'var(--status-danger)', color: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', cursor: 'pointer' }}
          >
            Xóa
          </button>
        </div>
      )}
    </>
  );
}
