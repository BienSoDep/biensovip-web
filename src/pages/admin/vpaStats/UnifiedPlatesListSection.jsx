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
import { CARD, num, SectionTitle } from './vpaStatsShared.jsx';

const money = (v) => (v == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(v)} ₫`);

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
        // Lọc xe cho shop nếu có chọn
        const isCarVehicle = !p.vehicleTypeName?.toLowerCase()?.includes('máy') && !p.vehicleType?.name?.toLowerCase()?.includes('máy');
        if (vehicleFilter === 'Car' && !isCarVehicle) return;
        if (vehicleFilter === 'MotorBike' && isCarVehicle) return;

        list.push({
          id: p.id,
          source: 'shop',
          sourceLabel: 'Kho Biển Shop',
          plateNumber: p.plateNumber,
          vehicleType: isCarVehicle ? 'Ô tô' : 'Xe máy',
          isCar: isCarVehicle,
          plateTypeName: p.plateTypeName || p.plateType?.name || '—',
          provinceName: p.provinceName || p.province?.name || '—',
          price: p.price,
          priceDisplay: p.price ? money(p.price) : 'Liên hệ',
          priceSub: p.suggestedPrice ? `Gợi ý: ${money(p.suggestedPrice)}` : null,
          status: p.status,
          statusText: p.status === 'available' ? 'Sẵn sàng bán' : p.status === 'reserved' ? 'Đã giữ chỗ / cọc' : 'Đã bán',
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
          statusTone: isApproved ? 'green' : p.priceState === 1 ? 'amber' : 'blue',
          isHot: !!p.isPin,
          raw: p,
        });
      });
    }

    // Nếu chọn gộp "Tất cả", ta xếp xen kẽ hoặc xếp Shop trước
    if (scope === 'all') {
      return list;
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
                background: 'rgba(2, 132, 199, 0.1)',
                color: '#0284c7',
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
              background: '#107c41',
              borderColor: '#107c41',
              boxShadow: '0 2px 4px rgba(16, 124, 65, 0.2)',
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0369a1', borderColor: 'rgba(2, 132, 199, 0.3)' }}
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
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => { setScope('all'); setPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: scope === 'all' ? '#0f172a' : 'transparent',
              color: scope === 'all' ? '#ffffff' : 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: scope === 'all' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={13} />
            <span>Tất cả (Kho gộp)</span>
          </button>

          <button
            type="button"
            onClick={() => { setScope('shop'); setPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: scope === 'shop' ? '#0284c7' : 'transparent',
              color: scope === 'shop' ? '#ffffff' : 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: scope === 'shop' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <CarFront size={13} />
            <span>Kho Shop ({num(shopTotal)})</span>
          </button>

          <button
            type="button"
            onClick={() => { setScope('vpa'); setPage(1); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: scope === 'vpa' ? '#d97706' : 'transparent',
              color: scope === 'vpa' ? '#ffffff' : 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: scope === 'vpa' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Landmark size={13} />
            <span>Đấu giá VPA ({num(vpaTotal)})</span>
          </button>
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
                height: 34,
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
              height: 34,
              padding: '0 8px',
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
              height: 34,
              padding: '0 8px',
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
              height: 34,
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
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Biển Số Hợp Nhất */}
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-card, 10px)',
          overflow: 'hidden',
          background: 'var(--white)',
        }}
      >
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 920, borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', width: 130 }}>Nguồn kho</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', width: 170 }}>Biển số</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', width: 110 }}>Phương tiện</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', width: 130 }}>Loại biển</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', width: 130 }}>Tỉnh / Thành</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', width: 160, textAlign: 'right' }}>Giá niêm yết / KĐ</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', width: 130, textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', width: 110, textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} style={{ padding: '24px 12px' }}>
                    <Skeleton height={180} />
                  </td>
                </tr>
              )}

              {!isLoading && unifiedList.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <CarFront size={32} style={{ color: 'var(--text-faint)' }} />
                      <span style={{ fontWeight: 600 }}>Không tìm thấy biển số nào khớp với bộ lọc hiện tại</span>
                      <span style={{ fontSize: 12 }}>Thử thay đổi từ khóa tìm kiếm hoặc chọn nguồn kho khác</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && unifiedList.map((item, idx) => {
                const parsed = parsePlateNumber(item.plateNumber);
                const isShop = item.source === 'shop';

                return (
                  <tr
                    key={`${item.source}-${item.id || idx}`}
                    style={{
                      borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
                      background: idx % 2 === 1 ? 'rgba(248, 250, 252, 0.4)' : '#ffffff',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.03)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? 'rgba(248, 250, 252, 0.4)' : '#ffffff'; }}
                  >
                    {/* Cột 1: Nguồn kho */}
                    <td style={{ padding: '10px 12px' }}>
                      {isShop ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(2, 132, 199, 0.1)',
                            color: '#0284c7',
                            fontSize: 11,
                            fontWeight: 700,
                            border: '1px solid rgba(2, 132, 199, 0.25)',
                          }}
                        >
                          <CarFront size={12} />
                          <span>Kho Shop</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(217, 119, 6, 0.1)',
                            color: '#d97706',
                            fontSize: 11,
                            fontWeight: 700,
                            border: '1px solid rgba(217, 119, 6, 0.25)',
                          }}
                        >
                          <Landmark size={12} />
                          <span>Đấu giá VPA</span>
                        </span>
                      )}
                    </td>

                    {/* Cột 2: Biển số */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flexShrink: 0 }}>
                          <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.04em', color: 'var(--text-strong)' }}>
                            {item.plateNumber}
                          </span>
                          {item.isHot && (
                            <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              <Sparkles size={10} /> VIP Nổi bật
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cột 3: Phương tiện */}
                    <td style={{ padding: '10px 12px', color: 'var(--text-strong)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {item.isCar ? <Car size={13} color="#64748b" /> : <Bike size={13} color="#64748b" />}
                        <span>{item.vehicleType}</span>
                      </span>
                    </td>

                    {/* Cột 4: Loại biển */}
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          background: 'var(--surface-sunken)',
                          color: 'var(--text-body)',
                          padding: '2px 7px',
                          borderRadius: 4,
                          fontSize: 11.5,
                          fontWeight: 500,
                        }}
                      >
                        {item.plateTypeName}
                      </span>
                    </td>

                    {/* Cột 5: Tỉnh / Thành */}
                    <td style={{ padding: '10px 12px', color: 'var(--text-strong)', fontWeight: 500 }}>
                      {item.provinceName}
                    </td>

                    {/* Cột 6: Giá niêm yết / khởi điểm */}
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: isShop ? '#0284c7' : '#16a34a' }}>
                          {item.priceDisplay}
                        </span>
                        {item.priceSub && (
                          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                            {item.priceSub}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cột 7: Trạng thái */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {item.statusTone === 'green' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          <CheckCircle2 size={11} />
                          <span>{item.statusText}</span>
                        </span>
                      )}
                      {item.statusTone === 'amber' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          <Clock size={11} />
                          <span>{item.statusText}</span>
                        </span>
                      )}
                      {item.statusTone === 'purple' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ede9fe', color: '#6d28d9', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          <span>{item.statusText}</span>
                        </span>
                      )}
                      {item.statusTone === 'blue' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          <span>{item.statusText}</span>
                        </span>
                      )}
                      {item.statusTone === 'gray' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          <span>{item.statusText}</span>
                        </span>
                      )}
                    </td>

                    {/* Cột 8: Thao tác */}
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
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
                        style={{ fontSize: 11.5, padding: '3px 7px', gap: 3 }}
                      >
                        <span>Quản lý</span>
                        <ExternalLink size={11} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Footer & Phân Trang */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '10px 14px',
            background: 'var(--surface-sunken)',
            borderTop: '1px solid var(--border-subtle)',
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
