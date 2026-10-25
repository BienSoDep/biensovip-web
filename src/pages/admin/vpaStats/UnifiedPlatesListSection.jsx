import { useState, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  Layers, Landmark, CarFront, Download, FileSpreadsheet,
  Search, Filter, ExternalLink, CheckCircle2, Clock,
  ArrowRight, Sparkles, RefreshCw, Car, Bike
} from 'lucide-react';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { useAdminPlates } from '../../../services/adminPlates.js';
import { useVpaAdminPlates } from '../../../services/adminVpa.js';
import { useTableColumns, TableColumnMenu } from '../../../components/table/TableColumnMenu.jsx';
import { CARD, num } from './vpaStatsShared.jsx';

const money = (v) => (v == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(v)} ₫`);

export const UNIFIED_COLUMNS = [
  { key: 'source', label: 'Nguồn kho', default: true },
  { key: 'plateType', label: 'Loại biển', default: true },
  { key: 'vehicleType', label: 'Loại xe', default: true },
  { key: 'province', label: 'Tỉnh / Thành', default: true },
  { key: 'price', label: 'Giá niêm yết / KĐ', default: true },
  { key: 'status', label: 'Trạng thái', default: true },
];
export const UNIFIED_COLUMN_KEY = 'bsv.admin.unifiedPlateColumns';

export default function UnifiedPlatesListSection({
  shopTotal = 0,
  vpaTotal = 0,
  onOpenExport,
  onQuickExport,
  onOpenHistory,
  go,
}) {
  const [scope, setScope] = useState('all'); // 'all' | 'shop' | 'vpa'
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword] = useDebouncedValue(keyword, 300);
  const [vehicleFilter, setVehicleFilter] = useState('all'); // 'all' | 'Car' | 'MotorBike'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'available'
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { isVisible, colMenuProps } = useTableColumns({
    storageKey: UNIFIED_COLUMN_KEY,
    columns: UNIFIED_COLUMNS,
  });

  // Tham số cho Shop
  const shopPerPage = scope === 'all' ? Math.ceil(perPage / 2) : perPage;
  const shopQuery = {
    keyword: debouncedKeyword || undefined,
    page: page,
    perPage: shopPerPage,
    status: statusFilter === 'available' ? 'available' : undefined,
  };

  // Tham số cho VPA
  const vpaLimit = scope === 'all' ? Math.ceil(perPage / 2) : perPage;
  const vpaQuery = {
    q: debouncedKeyword || undefined,
    page: page,
    limit: vpaLimit,
    vehicle: vehicleFilter === 'all' ? undefined : vehicleFilter,
    priceState: statusFilter === 'available' ? '2,3' : undefined,
  };

  // Lấy dữ liệu từ 2 nguồn
  const {
    data: shopData,
    isLoading: shopLoading,
    isFetching: shopFetching,
    refetch: refetchShop,
  } = useAdminPlates(shopQuery, scope !== 'vpa');

  const {
    data: vpaData,
    isLoading: vpaLoading,
    isFetching: vpaFetching,
    refetch: refetchVpa,
  } = useVpaAdminPlates(vpaQuery);

  const isLoading = (scope !== 'vpa' && shopLoading) || (scope !== 'shop' && vpaLoading);
  const isFetching = shopFetching || vpaFetching;

  // Chuẩn hóa danh sách dữ liệu hiển thị
  const unifiedList = useMemo(() => {
    const list = [];

    // 1. Dữ liệu từ Kho Shop
    if (scope !== 'vpa' && shopData?.items?.length) {
      shopData.items.forEach((p) => {
        const isCarVehicle = !p.vehicleTypeName?.toLowerCase()?.includes('máy') && !p.vehicleType?.name?.toLowerCase()?.includes('máy');
        if (vehicleFilter === 'Car' && !isCarVehicle) return;
        if (vehicleFilter === 'MotorBike' && isCarVehicle) return;

        list.push({
          id: p.id,
          source: 'shop',
          sourceLabel: 'Kho Shop',
          plateNumber: p.plateNumber,
          vehicleType: isCarVehicle ? 'Ô tô' : 'Xe máy',
          isCar: isCarVehicle,
          plateTypeName: p.plateTypeName || p.plateType?.name || '—',
          provinceName: p.provinceName || p.province?.name || '—',
          price: p.price,
          priceDisplay: p.price ? money(p.price) : 'Liên hệ',
          priceSub: p.suggestedPrice ? `Gợi ý: ${money(p.suggestedPrice)}` : null,
          status: p.status,
          statusText: p.status === 'available' ? 'Còn hàng' : p.status === 'reserved' ? 'Đã giữ chỗ / cọc' : 'Đã bán',
          statusTone: p.status === 'available' ? 'green' : p.status === 'reserved' ? 'purple' : 'gray',
          isHot: !!p.isHot,
          raw: p,
        });
      });
    }

    // 2. Dữ liệu từ Đấu giá VPA
    if (scope !== 'shop' && vpaData?.items?.length) {
      vpaData.items.forEach((p) => {
        const isCarVehicle = p.vehicle === 'Car' || p.vehicleType === 'Car';
        const isApproved = p.priceState === 2 || p.priceState === 3;
        const currentPrice = p.finalPrice || p.announcedPrice || p.currentPrice || p.startPrice || 40000000;

        list.push({
          id: p.id,
          source: 'vpa',
          sourceLabel: 'Đấu giá VPA',
          plateNumber: p.plateNumber,
          vehicleType: isCarVehicle ? 'Ô tô' : 'Xe máy',
          isCar: isCarVehicle,
          plateTypeName: p.plateTypeName || '—',
          provinceName: p.provinceName || p.province || '—',
          price: currentPrice,
          priceDisplay: money(currentPrice),
          priceSub: isApproved ? 'Đã duyệt giá bán' : 'Giá khởi điểm / dự kiến',
          status: isApproved ? 'approved' : p.priceState === 1 ? 'suggested' : 'pending',
          statusText: isApproved ? 'Đã duyệt giá' : p.priceState === 1 ? 'Chờ duyệt giá' : 'Chờ đấu giá',
          statusTone: isApproved ? 'green' : p.priceState === 1 ? 'amber' : 'gray',
          isHot: !!p.isPin,
          raw: p,
        });
      });
    }

    return list;
  }, [scope, shopData, vpaData, vehicleFilter]);

  // Tính tổng số lượng và phân trang
  const totalCount = useMemo(() => {
    if (scope === 'shop') return shopData?.total || shopTotal || 0;
    if (scope === 'vpa') return vpaData?.total || vpaTotal || 0;
    return (shopData?.total || 0) + (vpaData?.total || 0);
  }, [scope, shopData, vpaData, shopTotal, vpaTotal]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  const handleRefresh = () => {
    if (scope !== 'vpa') refetchShop?.();
    if (scope !== 'shop') refetchVpa?.();
  };

  return (
    <div style={{ ...CARD, padding: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
      {/* 1. Header & Quick Export Action Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(241, 151, 32, 0.08)',
                color: 'var(--action-primary, #F19720)',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <Layers size={13} />
              <span>Kho dữ liệu gộp hợp nhất</span>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              (Tổng cộng <strong>{num(totalCount)}</strong> biển số)
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>
            Danh Sách Kho Biển Số Gộp (Shop &amp; Đấu Giá VPA)
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Tra cứu trực tiếp cả hai nguồn biển số trên cùng một giao diện, hỗ trợ lọc và xuất file toàn bộ không giới hạn
          </p>
        </div>

        {/* Nút Xuất File & Tải Dữ Liệu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="primary"
            size="md"
            title="Xuất trực tiếp toàn bộ kho biển số gộp ra file Excel (.xlsx) xử lý ngầm không giới hạn"
            onClick={() => onQuickExport ? onQuickExport({ format: 'xlsx', scope: 'all' }) : onOpenExport?.()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontWeight: 700,
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Xuất file Excel kho gộp</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            title="Mở bảng tùy chọn chi tiết để chọn định dạng (Excel, Word, CSV) và phạm vi xuất"
            onClick={onOpenExport}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <Download size={14} />
            <span>Tùy chọn tải về…</span>
          </Button>

          {onOpenHistory && (
            <Button
              type="button"
              variant="outline"
              size="md"
              title="Xem danh sách các file đã xuất trong vòng 30 ngày để tải lại ngay"
              onClick={onOpenHistory}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            >
              <Clock size={14} />
              <span>Lịch sử tải về (30 ngày)</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="md"
            title="Làm mới dữ liệu bảng"
            onClick={handleRefresh}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* 2. Thanh Bộ Lọc & Tìm Kiếm */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Nhóm tab nguồn dữ liệu: Tất cả / Shop / VPA */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--surface-sunken)',
            padding: 3,
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {[
            { id: 'all', label: 'Tất cả (Kho gộp)', count: null, icon: Layers },
            { id: 'shop', label: 'Kho Shop', count: shopTotal, icon: CarFront },
            { id: 'vpa', label: 'Đấu giá VPA', count: vpaTotal, icon: Landmark },
          ].map((tab) => {
            const active = scope === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setScope(tab.id); setPage(1); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: active ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  background: active ? 'var(--white, #ffffff)' : 'transparent',
                  color: active ? 'var(--action-primary, #F19720)' : 'var(--text-muted, #64748b)',
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
                {tab.count != null && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 9999,
                      background: active ? 'rgba(241,151,32,0.12)' : 'var(--surface-sunken)',
                      color: active ? 'var(--action-primary, #F19720)' : 'var(--text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {num(tab.count)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Thanh tìm kiếm & Dropdown lọc */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          {/* Ô tìm kiếm biển số */}
          <div style={{ position: 'relative', minWidth: 200, maxWidth: 280, flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              placeholder="Tìm biển số (VD: 30K, 999.99)..."
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px 0 32px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--white)',
                fontSize: 12.5,
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
          </div>

          {/* Lọc loại xe */}
          <select
            value={vehicleFilter}
            onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }}
            style={{
              height: 36,
              padding: '0 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--white)',
              fontSize: 12.5,
              color: 'var(--text-strong)',
              cursor: 'pointer',
            }}
          >
            <option value="all">Mọi loại xe</option>
            <option value="Car">Chỉ Ô tô</option>
            <option value="MotorBike">Chỉ Xe máy</option>
          </select>

          {/* Lọc trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              height: 36,
              padding: '0 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--white)',
              fontSize: 12.5,
              color: 'var(--text-strong)',
              cursor: 'pointer',
            }}
          >
            <option value="all">Mọi trạng thái</option>
            <option value="available">Sẵn sàng / Đã duyệt giá</option>
          </select>

          {/* Chọn số dòng hiển thị */}
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            style={{
              height: 36,
              padding: '0 8px',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--white)',
              fontSize: 12,
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <option value={10}>10 dòng/trang</option>
            <option value={20}>20 dòng/trang</option>
            <option value={50}>50 dòng/trang</option>
          </select>

          {/* Nút Cột hiển thị đồng bộ chuẩn VPA */}
          <TableColumnMenu {...colMenuProps} />

          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => { refetchShop?.(); refetchVpa?.(); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Tải lại danh sách biển"
          >
            <RefreshCw size={14} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Biển Số Hợp Nhất (Đồng bộ cấu trúc & màu sắc với tab Biển số & Biển VPA) */}
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-card, 10px)',
          overflow: 'hidden',
          background: 'var(--white)',
          boxShadow: 'var(--shadow-inset-hairline)',
        }}
      >
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 1080 }}>
            {/* Header row đồng bộ chuẩn hệ thống */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3, 12px)',
                padding: 'var(--space-3, 12px) var(--gutter-card, 16px)',
                background: 'var(--surface-sunken, #f8fafc)',
                font: 'var(--type-caption)',
                fontSize: 'var(--fs-micro, 11px)',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted, #64748b)',
                fontWeight: 700,
                borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
              }}
            >
              <span style={{ flex: '0 0 56px' }}>Ảnh</span>
              <span style={{ flex: '1 1 140px' }}>Biển số</span>
              {isVisible('source') && <span style={{ flex: '0 0 110px' }}>Nguồn kho</span>}
              {isVisible('plateType') && <span style={{ flex: '1 1 100px' }}>Loại biển</span>}
              {isVisible('vehicleType') && <span style={{ flex: '0 0 80px' }}>Loại xe</span>}
              {isVisible('province') && <span style={{ flex: '1 1 100px' }}>Tỉnh / Thành</span>}
              {isVisible('price') && <span style={{ flex: '1 1 130px', textAlign: 'right' }}>Giá niêm yết / KĐ</span>}
              {isVisible('status') && <span style={{ flex: '0 0 120px', textAlign: 'center' }}>Trạng thái</span>}
              <span style={{ flex: '0 0 90px', textAlign: 'right' }}>Thao tác</span>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div style={{ padding: 'var(--space-4, 16px)' }}>
                <Skeleton height={180} />
              </div>
            )}

            {/* Empty state */}
            {!isLoading && unifiedList.length === 0 && (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <CarFront size={36} style={{ color: 'var(--text-faint, #cbd5e1)' }} />
                  <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-strong)' }}>
                    Không tìm thấy biển số nào khớp với bộ lọc hiện tại
                  </span>
                  <span style={{ fontSize: 12 }}>Thử thay đổi từ khóa tìm kiếm hoặc chọn nguồn kho khác</span>
                </div>
              </div>
            )}

            {/* Rows list */}
            {!isLoading && unifiedList.map((item, idx) => {
              const parsed = parsePlateNumber(item.plateNumber);
              const isShop = item.source === 'shop';

              return (
                <div
                  key={`${item.source}-${item.id || idx}`}
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3, 12px)',
                    alignItems: 'center',
                    padding: 'var(--space-2, 8px) var(--gutter-card, 16px)',
                    boxShadow: 'inset 0 -1px 0 var(--border-subtle, #f1f5f9)',
                    background: idx % 2 === 1 ? 'rgba(248, 250, 252, 0.4)' : '#ffffff',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken, #f8fafc)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? 'rgba(248, 250, 252, 0.4)' : '#ffffff'; }}
                >
                  {/* Cột 1: ẢNH (Khung biển số chuẩn Việt Nam mô phỏng chân thực) */}
                  <span style={{ flex: '0 0 56px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 56 }}>
                      <PlateVisual
                        size="sm"
                        prov={parsed.prov}
                        seri={parsed.seri}
                        num={parsed.num}
                        shape={item.isCar ? 'long' : 'short'}
                      />
                    </div>
                  </span>

                  {/* Cột 2: BIỂN SỐ */}
                  <span
                    style={{
                      flex: '1 1 140px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      font: 'var(--type-body-sm)',
                      fontWeight: 700,
                      color: 'var(--text-strong)',
                      minWidth: 0,
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.plateNumber}
                    </span>
                    {item.isHot && (
                      <span
                        title="Biển nổi bật / VIP"
                        style={{
                          fontSize: 10,
                          color: '#f59e0b',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Sparkles size={11} fill="#f59e0b" />
                      </span>
                    )}
                  </span>

                  {/* Cột 3: NGUỒN KHO (Badge chuẩn màu thương hiệu) */}
                  {isVisible('source') && (
                    <span style={{ flex: '0 0 110px' }}>
                      {isShop ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm, 4px)',
                            background: 'rgba(5, 150, 105, 0.08)',
                            color: '#059669',
                            fontSize: 11,
                            fontWeight: 600,
                            border: '1px solid rgba(5, 150, 105, 0.2)',
                          }}
                        >
                          <CarFront size={11} />
                          <span>Kho Shop</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm, 4px)',
                            background: 'rgba(241, 151, 32, 0.08)',
                            color: 'var(--action-primary, #F19720)',
                            fontSize: 11,
                            fontWeight: 600,
                            border: '1px solid rgba(241, 151, 32, 0.25)',
                          }}
                        >
                          <Landmark size={11} />
                          <span>Đấu giá VPA</span>
                        </span>
                      )}
                    </span>
                  )}

                  {/* Cột 4: LOẠI BIỂN */}
                  {isVisible('plateType') && (
                    <span
                      style={{
                        flex: '1 1 100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        style={{
                          background: 'var(--surface-sunken)',
                          color: 'var(--text-body)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm, 4px)',
                          fontSize: 11.5,
                          fontWeight: 500,
                        }}
                      >
                        {item.plateTypeName}
                      </span>
                    </span>
                  )}

                  {/* Cột 5: LOẠI XE */}
                  {isVisible('vehicleType') && (
                    <span style={{ flex: '0 0 80px', fontSize: 12, color: 'var(--text-body)', fontWeight: 500 }}>
                      {item.vehicleType}
                    </span>
                  )}

                  {/* Cột 6: TỈNH / THÀNH */}
                  {isVisible('province') && (
                    <span style={{ flex: '1 1 100px', fontSize: 12.5, color: 'var(--text-body)', fontWeight: 500 }}>
                      {item.provinceName}
                    </span>
                  )}

                  {/* Cột 7: GIÁ NIÊM YẾT / KĐ (Đồng bộ font & màu chữ tiêu chuẩn hệ thống) */}
                  {isVisible('price') && (
                    <div style={{ flex: '1 1 130px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                        {item.priceDisplay}
                      </span>
                      {item.priceSub && (
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                          {item.priceSub}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Cột 8: TRẠNG THÁI (Pill ngữ nghĩa chuẩn) */}
                  {isVisible('status') && (
                    <span style={{ flex: '0 0 120px', display: 'flex', justifyContent: 'center' }}>
                      {item.statusTone === 'green' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'var(--mint-100, #dcfce7)',
                            color: 'var(--status-success-ink, #15803d)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm, 4px)',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={11} />
                          <span>{item.statusText}</span>
                        </span>
                      )}
                      {item.statusTone === 'amber' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'rgba(241, 151, 32, 0.1)',
                            color: 'var(--action-primary, #F19720)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm, 4px)',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          <Clock size={11} />
                          <span>{item.statusText}</span>
                        </span>
                      )}
                      {item.statusTone === 'purple' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#ede9fe',
                            color: '#6d28d9',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm, 4px)',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          <span>{item.statusText}</span>
                        </span>
                      )}
                      {item.statusTone === 'gray' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'var(--surface-sunken)',
                            color: 'var(--text-muted)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm, 4px)',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          <span>{item.statusText}</span>
                        </span>
                      )}
                    </span>
                  )}

                  {/* Cột 9: THAO TÁC */}
                  <span style={{ flex: '0 0 90px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      title={isShop ? 'Xem biển này trong trang Quản lý Kho Biển Shop' : 'Xem biển này trong trang Quản lý Biển VPA'}
                      onClick={() => {
                        if (isShop) {
                          go ? go('aplates')() : null;
                        } else {
                          go ? go('avpa')() : null;
                        }
                      }}
                      style={{
                        fontSize: 11.5,
                        padding: '3px 8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--action-primary, #F19720)',
                        fontWeight: 600,
                      }}
                    >
                      <span>Chi tiết</span>
                      <ExternalLink size={12} />
                    </Button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Footer & Phân Trang */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '10px 16px',
            background: 'var(--surface-sunken, #f8fafc)',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Đang hiển thị <strong>{unifiedList.length}</strong> / <strong>{num(totalCount)}</strong> biển số
            {scope === 'all' && ' (Gộp song song Kho Shop & Đấu giá VPA)'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(p) => setPage(p)}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
