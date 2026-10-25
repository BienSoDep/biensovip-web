import { useState } from 'react';
import {
  CarFront, ArrowUpDown, ArrowUp, ArrowDown, TriangleAlert, Star, Gift,
  SlidersHorizontal, LayoutGrid, List as ListIcon, ChevronDown, ChevronUp, RefreshCw, ArrowRight,
  Download, Sparkles, Image, Trash2,
} from 'lucide-react';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import AuditHistoryButton from '../../../components/AuditHistoryButton.jsx';
import { Select, IconButton, SearchField, InfoTip, PlateIssueTip } from '../../../components/index.jsx';
import { TableColumnMenu } from '../../../components/table/TableColumnMenu.jsx';
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
  colMenuProps,
  colMenuOpen, setColMenuOpen,

  // Top action handlers
  exportCsv, exportXlsx, exportDocx, exportPlateDocx, exporting,
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
  openPriceReference,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const setDatePreset = (preset) => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    if (preset === 'today') {
      const s = fmt(d);
      setFromDate(s);
      setToDate(s);
    } else if (preset === '7days') {
      const to = fmt(d);
      d.setDate(d.getDate() - 7);
      const from = fmt(d);
      setFromDate(from);
      setToDate(to);
    } else if (preset === '30days') {
      const to = fmt(d);
      d.setDate(d.getDate() - 30);
      const from = fmt(d);
      setFromDate(from);
      setToDate(to);
    } else if (preset === 'clear') {
      setFromDate('');
      setToDate('');
    }
    setPage(1);
  };
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Thời gian</span>
              <div style={{ display: 'inline-flex', gap: 3 }}>
                {[['Hôm nay', 'today'], ['7 ngày', '7days'], ['30 ngày', '30days']].map(([txt, val]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDatePreset(val)}
                    style={{
                      border: 'none',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-body)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'background-color 120ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--grey-200)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                  >
                    {txt}
                  </button>
                ))}
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => setDatePreset('clear')}
                    title="Xóa lọc ngày"
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--status-danger)',
                      padding: '1px 4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                style={{ height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 8px', font: 'var(--type-caption)' }}
                title="Từ ngày"
              />
              <ArrowRight size={11} color="var(--text-muted)" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                style={{ height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 8px', font: 'var(--type-caption)' }}
                title="Đến ngày"
              />
            </div>
          </div>
          <Select label="Hiển thị" value={perPage} options={PER_PAGE_OPTIONS} onChange={(v) => { setPerPage(Number(v)); setPage(1); }} />
          {colMenuProps ? (
            <TableColumnMenu {...colMenuProps} />
          ) : (
            <div style={{ position: 'relative' }}>
              <Button variant="ghost" size="md" onClick={() => setColMenuOpen?.((o) => !o)}>Cột hiển thị</Button>
              {colMenuOpen && (
                <>
                  <div onClick={() => setColMenuOpen?.(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
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
          )}
          <Button
            variant="ghost"
            size="md"
            onClick={() => refetch()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Tải lại danh sách biển"
          >
            <RefreshCw size={14} />
            <span>Làm mới</span>
          </Button>
          <div style={{ flex: 1 }} />
          {/* Nút Xuất dữ liệu Dropdown */}
          <div style={{ position: 'relative' }}>
            <Button
              variant="ghost"
              size="md"
              disabled={exporting}
              title="Xuất danh sách biển số ra file Excel (.xlsx), Word (.docx) hoặc CSV (.csv)"
              onClick={() => { setExportOpen((o) => !o); setAiMenuOpen(false); }}
              style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} />
              <span>{exporting ? 'Đang xuất…' : 'Xuất dữ liệu'}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
            </Button>
            {exportOpen && (
              <>
                <div onClick={() => setExportOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    background: 'var(--white)',
                    border: '1px solid var(--grey-200, #e2e8f0)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-4, 0 20px 25px -5px rgba(0,0,0,0.15))',
                    zIndex: 20,
                    minWidth: 260,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '6px',
                  }}
                >
                  <button
                    type="button"
                    style={{
                      background: 'none', border: 'none', padding: '8px 10px', textAlign: 'left',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-caption)',
                      color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    onClick={() => {
                      setExportOpen(false);
                      exportXlsx({ status, keyword, ...(fromDate && { fromDate }), ...(toDate && { toDate }) }).catch((e) => notify(e.message));
                    }}
                  >
                    <span style={{ fontSize: 16 }}>📗</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: '#107c41' }}>Xuất Excel (.xlsx)</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bảng tính có trang trí, gửi khách</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    style={{
                      background: 'none', border: 'none', padding: '8px 10px', textAlign: 'left',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-caption)',
                      color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    onClick={() => {
                      setExportOpen(false);
                      exportDocx({ status, keyword, ...(fromDate && { fromDate }), ...(toDate && { toDate }) }).catch((e) => notify(e.message));
                    }}
                  >
                    <span style={{ fontSize: 16 }}>📘</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: '#2b579a' }}>Xuất Word (.docx)</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Catalogue có ảnh biển số xe</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    style={{
                      background: 'none', border: 'none', padding: '8px 10px', textAlign: 'left',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-caption)',
                      color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    onClick={() => {
                      setExportOpen(false);
                      exportCsv({ status, keyword, ...(fromDate && { fromDate }), ...(toDate && { toDate }) }).catch((e) => notify(e.message));
                    }}
                  >
                    <span style={{ fontSize: 16 }}>📙</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: '#c2410c' }}>Xuất CSV (.csv)</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dữ liệu thô gọn nhẹ</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Nút Tiện ích AI Dropdown */}
          <div style={{ position: 'relative' }}>
            <Button
              variant="ghost"
              size="md"
              disabled={checkingMissingInfo || checkingMissingImage || checkingGeneratedImage}
              title="Các công cụ trí tuệ nhân tạo (AI) tự động phân tích phong thủy và tạo ảnh mockup"
              onClick={() => { setAiMenuOpen((o) => !o); setExportOpen(false); }}
              style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Sparkles size={14} color="var(--amber-500)" />
              <span>Tiện ích AI</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
            </Button>
            {aiMenuOpen && (
              <>
                <div onClick={() => setAiMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    background: 'var(--white)',
                    border: '1px solid var(--grey-200, #e2e8f0)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-4, 0 20px 25px -5px rgba(0,0,0,0.15))',
                    zIndex: 20,
                    minWidth: 290,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '6px',
                  }}
                >
                  <button
                    type="button"
                    disabled={checkingMissingInfo}
                    style={{
                      background: 'none', border: 'none', padding: '8px 10px', textAlign: 'left',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-caption)',
                      color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    onClick={() => { setAiMenuOpen(false); openMissingInfoModal(); }}
                  >
                    <Sparkles size={16} color="var(--amber-500)" style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>Sinh thông tin & phong thủy</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI tự động phân tích quẻ kinh dịch và mô tả</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={checkingMissingImage}
                    style={{
                      background: 'none', border: 'none', padding: '8px 10px', textAlign: 'left',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-caption)',
                      color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    onClick={() => { setAiMenuOpen(false); openMissingImageModal(); }}
                  >
                    <Image size={16} color="var(--action-primary)" style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>Sinh ảnh mockup hàng loạt</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vẽ ảnh mockup biển số gắn xe thực tế</span>
                    </div>
                  </button>

                  <div style={{ height: 1, background: 'var(--grey-100, #f1f5f9)', margin: '4px 0' }} />

                  <button
                    type="button"
                    disabled={checkingGeneratedImage}
                    style={{
                      background: 'none', border: 'none', padding: '8px 10px', textAlign: 'left',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-caption)',
                      color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    onClick={() => { setAiMenuOpen(false); openPurgeImageModal(); }}
                  >
                    <Trash2 size={16} color="var(--status-danger)" style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>Xóa ảnh mockup sinh cũ</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Xóa các ảnh tự động để tạo lại mẫu mới</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
          <Button variant="primary" size="md" onClick={openAdd}>Thêm biển số (đầy đủ)</Button>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          <Select label="Loại biển" info="Lọc theo thế số đặc biệt: Ngũ quý, Tứ quý, Tam hoa, Thần tài, Lộc phát, Tiến lên..." value={plateTypeFilter} options={[{ value: '', label: 'Tất cả' }, ...plateTypes]} onChange={(v) => { setPlateTypeFilter(v); setPage(1); }} />
          <Select label="Loại xe" info="Phân loại biển đăng ký dành cho Ô tô hoặc Xe máy" value={vehicleTypeFilter} options={[{ value: '', label: 'Tất cả' }, ...vehicleTypes]} onChange={(v) => { setVehicleTypeFilter(v); setPage(1); }} />
          <Select label="Tỉnh/thành" info="Lọc theo tỉnh thành hoặc đầu số đăng ký xe" value={provinceFilter} options={[{ value: '', label: 'Tất cả' }, ...provinces]} onChange={(v) => { setProvinceFilter(v); setPage(1); }} />
          <Select label="Nổi bật" info="Lọc các biển số được đánh dấu sao VIP hoặc hiển thị ưu tiên tại trang chủ" value={hotFilter} options={HOT_OPTIONS} onChange={(v) => { setHotFilter(v); setPage(1); }} />
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
                        <PlateIssueTip
                          issues={dataIssuesByPlateId.get(p.id).map((c) => DATA_ISSUE_LABELS[c] || c)}
                          tone="danger"
                          size={15}
                          onClick={() => openEdit(p)}
                        />
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
                  {p.suggestedPrice ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => openPriceReference(p.id)}
                          title="Xem nguồn và công thức tính giá thị trường tham khảo"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            font: 'var(--type-caption)',
                            color: 'var(--text-muted)',
                            textDecoration: 'underline dotted',
                          }}
                        >
                          TT: {fmt(p.suggestedPrice)}
                        </button>
                        {p.sampleCount && p.sampleCount > 0 ? (
                          <span style={{ fontSize: '10px', color: '#3FBF8F', background: '#F0FAF6', padding: '1px 4px', borderRadius: '4px', fontWeight: 600 }}>
                            Cùng tỉnh
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#d97706', background: '#fffbeb', padding: '1px 4px', borderRadius: '4px', fontWeight: 600 }}>
                            Giá khởi điểm
                          </span>
                        )}
                      </div>
                  ) : null}
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
                  <IconButton name="download" label="Xuất Word" size="sm" onClick={() => exportPlateDocx(p.id, p.plateNumber)} />
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
              {colPrefs.price && (
                <span style={{ flex: '1 1 110px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <SortHeader label="Giá niêm yết" sortKey="price" />
                  <InfoTip size={12} text="Giá bán công khai trên website (VND). Bấm trực tiếp vào ô giá để sửa nhanh mà không cần mở form." />
                </span>
              )}
              {colPrefs.suggestedPrice && (
                <span style={{ flex: '1 1 135px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <SortHeader label="Giá gợi ý / tham khảo" sortKey="suggestedPrice" />
                  <InfoTip size={12} text="Giá thị trường tham khảo (gợi ý từ VPA dựa trên kết quả đấu giá các mẫu tương đồng × hệ số). Bấm vào giá để xem chi tiết mẫu và công thức." />
                </span>
              )}
              {colPrefs.salePrice && (
                <span style={{ flex: '1 1 96px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <SortHeader label="Giá KM" sortKey="salePrice" />
                  <InfoTip size={12} text="Giá khuyến mãi giảm giá trực tiếp cho khách mua trong đợt ưu đãi." />
                </span>
              )}
              {colPrefs.gifted && (
                <span style={{ flex: '1 1 96px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span>Biển tặng</span>
                  <InfoTip size={12} text="Biển số tặng kèm hoặc ưu đãi đặc biệt dành cho khách hàng thân thiết/mua combo." />
                </span>
              )}
              {colPrefs.isNew && <span className="plate-col-new" style={{ flex: '0 0 48px' }}>Mới</span>}
              {colPrefs.status && (
                <span style={{ flex: '1 1 100px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <SortHeader label="Trạng thái" sortKey="status" />
                  <InfoTip size={12} text="Trạng thái biển: Còn hàng = đang bán; Đã bán = chốt giao dịch; Hết hạn = biển đấu giá quá hạn, tự ẩn khỏi trang." />
                </span>
              )}
              {colPrefs.pendingContact && (
                <span style={{ flex: '0 0 96px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <SortHeader label="Liên hệ chờ" sortKey="pendingContactCount" />
                  <InfoTip size={12} text="Số lượng khách hàng đã gửi form yêu cầu tư vấn hoặc liên hệ mua biển này chưa được xử lý." />
                </span>
              )}
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
                      <PlateIssueTip
                        issues={dataIssuesByPlateId.get(p.id).map((c) => DATA_ISSUE_LABELS[c] || c)}
                        tone="danger"
                        size={14}
                        onClick={() => openEdit(p)}
                      />
                    )}
                  </span>
                  {colPrefs.plateType && <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.plateTypeName}</span>}
                  {colPrefs.vehicleType && <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.vehicleTypeName}</span>}
                  {colPrefs.province && <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.provinceName}</span>}
                  {colPrefs.price && (
                    <span style={{ flex: '1 1 110px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {renderCell(p, 'price')}
                      {!p.priceOnRequest && p.suggestedPrice > 0 && p.price > 0
                        && Math.abs(p.price - p.suggestedPrice) > p.suggestedPrice * 0.1 && (
                        <PlateIssueTip
                          text={`Giá bán lệch ${Math.round(Math.abs(p.price - p.suggestedPrice) / p.suggestedPrice * 100)}% so với giá gợi ý VPA (${fmt(p.suggestedPrice)})`}
                          tone="warning"
                          size={14}
                        />
                      )}
                    </span>
                  )}
                  {colPrefs.suggestedPrice && (
                    <div style={{ flex: '1 1 135px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        type="button"
                        onClick={() => openPriceReference(p.id)}
                        title="Xem nguồn và công thức tính giá thị trường tham khảo (VPA)"
                        style={{
                          font: 'var(--type-body-sm)',
                          fontWeight: p.suggestedPrice ? 'var(--fw-medium)' : 'normal',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          textAlign: 'left',
                          cursor: 'pointer',
                          color: p.suggestedPrice ? 'var(--action-primary, #C75B00)' : 'var(--text-faint)',
                          textDecoration: 'underline dotted',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span>{p.suggestedPrice ? fmt(p.suggestedPrice) : '—'}</span>
                      </button>
                      {p.suggestedPrice ? (
                        p.sampleCount && p.sampleCount > 0 ? (
                          <span style={{ fontSize: '10.5px', color: '#3FBF8F', background: '#F0FAF6', padding: '1px 5px', borderRadius: '4px', fontWeight: 600, width: 'fit-content', border: '1px solid #D6F0E5' }}>
                            Cùng tỉnh ({p.sampleCount} mẫu)
                          </span>
                        ) : (
                          <span style={{ fontSize: '10.5px', color: '#d97706', background: '#fffbeb', padding: '1px 5px', borderRadius: '4px', fontWeight: 600, width: 'fit-content', border: '1px solid #fde68a' }}>
                            Giá khởi điểm
                          </span>
                        )
                      ) : null}
                    </div>
                  )}
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
                    <IconButton name="download" label="Xuất Word" size="sm" onClick={() => exportPlateDocx(p.id, p.plateNumber)} />
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
          <button
            type="button"
            onClick={() => toggleAll({ target: { checked: false } })}
            style={{ border: 'none', background: 'none', color: 'var(--white)', textDecoration: 'underline', font: 'var(--type-caption)', cursor: 'pointer' }}
          >
            Bỏ chọn
          </button>
        </div>
      )}
    </>
  );
}
