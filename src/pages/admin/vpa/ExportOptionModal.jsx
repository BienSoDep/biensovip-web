import { useState, useMemo } from 'react';
import {
  Download, FileSpreadsheet, FileText, FileCode, Check,
  Gavel, Calendar, Landmark, Filter, Layers2,
  Clock, AlertCircle, Store,
  Bike, Car, MapPin, Search, X, Eye, EyeOff
} from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import { useVpaExportCounts } from '../../../services/adminVpa.js';
import { useAdminCategories } from '../../../services/categories.js';

// Danh sách các thành phố lớn ưu tiên
const TOP_5_NAMES = ['Hà Nội', 'Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

// Bảng tra cứu tỉnh thành 3 miền tiêu chuẩn (phục vụ chọn nhanh chính xác)
const REGION_PROVINCES = {
  bac: [
    'Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Hải Dương', 'Hưng Yên',
    'Vĩnh Phúc', 'Thái Nguyên', 'Nam Định', 'Ninh Bình', 'Thái Bình', 'Hà Nam',
    'Phú Thọ', 'Bắc Giang', 'Lạng Sơn', 'Tuyên Quang', 'Cao Bằng', 'Hà Giang',
    'Lào Cai', 'Yên Bái', 'Điện Biên', 'Lai Châu', 'Sơn La', 'Hòa Bình', 'Bắc Kạn'
  ],
  trung: [
    'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Huế',
    'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa',
    'Ninh Thuận', 'Bình Thuận', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng'
  ],
  nam: [
    'Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Bà Rịa',
    'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'Cần Thơ',
    'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau', 'Kiên Giang', 'An Giang',
    'Đồng Tháp', 'Tây Ninh', 'Bình Phước'
  ]
};

export default function ExportOptionModal({
  open,
  onClose,
  onExport,
  onOpenHistory,
  page = 1,
  pageSize = 50,
  currentPageCount = 0,
  totalCount: _totalCount = 0,
  counts = {},
  filter = {},
}) {
  // Lựa chọn nguồn dữ liệu (Checkboxes) - Mặc định chọn cả 4 nguồn
  const [selectedSources, setSelectedSources] = useState(['shop', 'month', 'week', 'expired']);

  // Phân loại phương tiện (Xe máy vs Ô tô vs Cả 2)
  const [vehicle, setVehicle] = useState(null); // null = Tất cả, 1 = Ô tô, 2 = Xe máy

  // Chế độ tỉnh thành: 'all' = Toàn bộ 63 tỉnh/thành, 'custom' = Tùy biến chọn từng tỉnh
  const [provinceMode, setProvinceMode] = useState('all');
  const [selectedProvinceIds, setSelectedProvinceIds] = useState([]);
  const [provinceSearch, setProvinceSearch] = useState('');

  // Bộ lọc phụ bổ trợ
  const [priceState, _setPriceState] = useState(null); // null = Tất cả, 1 = Đã duyệt giá bán, 2 = Chờ định giá

  // Định dạng file & Phạm vi số lượng
  const [format, setFormat] = useState('xlsx'); // 'xlsx' | 'docx' | 'csv'
  const [range, setRange] = useState('all'); // 'all' | 'page'

  // Chế độ xem trước thành phẩm (Preview Mockup)
  const [showPreview, setShowPreview] = useState(true);
  const [previewTab, setPreviewTab] = useState('xlsx'); // 'xlsx' | 'docx'

  // Lấy toàn bộ danh mục tỉnh thành hệ thống
  const { data: rawProvinces = [], isLoading: _provincesLoading } = useAdminCategories('province');

  const provinces = useMemo(() => {
    const list = Array.isArray(rawProvinces)
      ? rawProvinces
      : (Array.isArray(rawProvinces?.items)
        ? rawProvinces.items
        : (Array.isArray(rawProvinces?.data) ? rawProvinces.data : []));

    return [...list].sort((a, b) => {
      const aTop = TOP_5_NAMES.some((n) => (a.name || '').includes(n));
      const bTop = TOP_5_NAMES.some((n) => (b.name || '').includes(n));
      if (aTop && !bTop) return -1;
      if (!aTop && bTop) return 1;
      return (a.name || '').localeCompare(b.name || '', 'vi');
    });
  }, [rawProvinces]);

  // Lọc tỉnh thành theo ô tìm kiếm
  const filteredProvinces = useMemo(() => {
    const q = (provinceSearch || '').trim().toLowerCase();
    if (!q) return provinces;
    return provinces.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q))
    );
  }, [provinces, provinceSearch]);

  // Tạo query filter gửi lên server để đếm số lượng real-time
  const countParams = useMemo(() => {
    const p = {
      ...filter,
      sources: selectedSources.join(','),
    };
    if (vehicle != null && vehicle !== '') p.vehicle = vehicle;
    if (provinceMode === 'custom' && selectedProvinceIds.length > 0) {
      p.provinceIds = selectedProvinceIds.join(',');
    }
    if (priceState != null && priceState !== '') p.priceState = priceState;
    return p;
  }, [filter, selectedSources, vehicle, provinceMode, selectedProvinceIds, priceState]);

  const { data: serverCounts, isLoading: countsLoading } = useVpaExportCounts(countParams, {
    enabled: !!open,
  });

  // Danh sách các Sheet mẫu cho preview Excel dựa trên chế độ tỉnh thành
  const previewSheets = useMemo(() => {
    if (provinceMode === 'custom' && selectedProvinceIds.length > 0) {
      const names = provinces
        .filter((p) => selectedProvinceIds.includes(p.id))
        .map((p) => p.name);
      return names.length > 0 ? names : ['Hà Nội'];
    }
    return ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  }, [provinceMode, selectedProvinceIds, provinces]);

  // Danh sách biển số mẫu phản ánh đúng loại xe và nguồn đang chọn
  const previewPlates = useMemo(() => {
    if (vehicle === 2) {
      return [
        { id: 1, plate: '29-AA 888.88', vehicle: 'Xe máy', type: 'Ngũ quý 8', prov: 'Hà Nội', source: 'Kho riêng', price: '185.000.000 đ', state: 'Sẵn sàng bán' },
        { id: 2, plate: '59-P1 686.88', vehicle: 'Xe máy', type: 'Lộc phát', prov: 'TP. Hồ Chí Minh', source: 'Phiên tuần', price: '75.000.000 đ', state: 'Sắp lên sàn' },
        { id: 3, plate: '43-B1 999.99', vehicle: 'Xe máy', type: 'Ngũ quý 9', prov: 'Đà Nẵng', source: 'Phiên tháng', price: '120.000.000 đ', state: 'Công bố VPA' },
      ];
    }
    if (vehicle === 1) {
      return [
        { id: 1, plate: '30K-999.99', vehicle: 'Ô tô', type: 'Ngũ quý 9', prov: 'Hà Nội', source: 'Kho riêng', price: '1.250.000.000 đ', state: 'Sẵn sàng bán' },
        { id: 2, plate: '51K-888.88', vehicle: 'Ô tô', type: 'Ngũ quý 8', prov: 'TP. Hồ Chí Minh', source: 'Phiên tuần', price: '980.000.000 đ', state: 'Sắp lên sàn' },
        { id: 3, plate: '43A-688.88', vehicle: 'Ô tô', type: 'Lộc phát', prov: 'Đà Nẵng', source: 'Phiên tháng', price: '350.000.000 đ', state: 'Công bố VPA' },
      ];
    }
    return [
      { id: 1, plate: '30K-999.99', vehicle: 'Ô tô', type: 'Ngũ quý 9', prov: 'Hà Nội', source: 'Kho riêng', price: '1.250.000.000 đ', state: 'Sẵn sàng bán' },
      { id: 2, plate: '29-AA 888.88', vehicle: 'Xe máy', type: 'Ngũ quý 8', prov: 'Hà Nội', source: 'Kho riêng', price: '185.000.000 đ', state: 'Sẵn sàng bán' },
      { id: 3, plate: '51K-888.88', vehicle: 'Ô tô', type: 'Ngũ quý 8', prov: 'TP. Hồ Chí Minh', source: 'Phiên tuần', price: '980.000.000 đ', state: 'Sắp lên sàn' },
      { id: 4, plate: '43-B1 999.99', vehicle: 'Xe máy', type: 'Ngũ quý 9', prov: 'Đà Nẵng', source: 'Phiên tháng', price: '120.000.000 đ', state: 'Công bố VPA' },
    ];
  }, [vehicle]);

  if (!open) return null;

  // Số lượng thực tế của từng nguồn
  const sourceStats = {
    shop: serverCounts?.shop ?? serverCounts?.available ?? counts?.shop ?? counts?.available ?? 0,
    month: serverCounts?.month ?? 0,
    week: serverCounts?.week ?? 0,
    expired: serverCounts?.expired ?? 0,
  };

  // Tính tổng số lượng biển cho các nguồn đang được chọn
  const totalSelectedPlates = selectedSources.reduce((sum, src) => sum + (sourceStats[src] || 0), 0);

  const handleToggleSource = (srcId) => {
    setSelectedSources((prev) =>
      prev.includes(srcId) ? prev.filter((s) => s !== srcId) : [...prev, srcId]
    );
  };

  // Xử lý chọn tỉnh thành
  const handleToggleProvince = (pId) => {
    setSelectedProvinceIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const handleSelectAllProvinces = () => {
    setSelectedProvinceIds(provinces.map((p) => p.id));
  };

  const handleClearProvinces = () => {
    setSelectedProvinceIds([]);
  };

  const handleSelectTop5 = () => {
    const topIds = provinces
      .filter((p) => TOP_5_NAMES.some((n) => (p.name || '').includes(n)))
      .map((p) => p.id);
    setSelectedProvinceIds(topIds);
  };

  const handleSelectRegion = (regionKey) => {
    const fallbackNames = REGION_PROVINCES[regionKey] || [];
    const regionIds = provinces
      .filter((p) => {
        if ((p.region || '').toLowerCase() === regionKey.toLowerCase()) return true;
        return fallbackNames.some((name) => (p.name || '').includes(name));
      })
      .map((p) => p.id);
    setSelectedProvinceIds(regionIds);
  };

  // Xác định scope gửi đi
  const hasShop = selectedSources.includes('shop');
  const hasVpa = selectedSources.some((s) => ['month', 'week', 'expired'].includes(s));
  const effectiveScope = hasShop && hasVpa ? 'all' : (hasShop ? 'available' : 'vpa');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (selectedSources.length === 0) return;
    if (provinceMode === 'custom' && selectedProvinceIds.length === 0) return;

    onExport({
      format,
      scope: effectiveScope,
      sources: selectedSources,
      vehicle: vehicle != null ? vehicle : undefined,
      provinceIds: provinceMode === 'custom' && selectedProvinceIds.length > 0 ? selectedProvinceIds : undefined,
      priceState: priceState || undefined,
      isCurrentPageOnly: range === 'page',
      page,
      pageSize,
    });
    onClose();
  };

  const sourceCards = [
    {
      id: 'shop',
      title: 'Kho riêng Duy Đinh',
      sub: 'Biển số có sẵn showroom',
      badge: 'Kho riêng • Sẵn sàng giao dịch',
      badgeBg: 'rgba(5, 150, 105, 0.1)',
      badgeColor: '#059669',
      count: sourceStats.shop,
      icon: Store,
      color: '#059669',
      desc: 'Các biển số Duy Đinh sở hữu và đã nhập kho riêng (không nằm trong phiên VPA), sẵn sàng giao dịch và sang tên ngay.',
    },
    {
      id: 'month',
      title: 'VPA - Phiên đấu giá tháng',
      sub: 'Biển sắp đấu giá trong tháng',
      badge: 'Phiên tháng',
      badgeBg: 'rgba(37, 99, 235, 0.1)',
      badgeColor: '#2563eb',
      count: sourceStats.month,
      icon: Calendar,
      color: '#2563eb',
      desc: 'Danh sách biển số VPA công bố dự kiến đấu giá trong tháng tới, phân theo các tỉnh thành.',
    },
    {
      id: 'week',
      title: 'VPA - Phiên đấu giá tuần',
      sub: 'Biển đấu giá trong tuần này',
      badge: 'Phiên tuần • Sắp lên sàn',
      badgeBg: 'rgba(217, 119, 6, 0.1)',
      badgeColor: '#d97706',
      count: sourceStats.week,
      icon: Gavel,
      color: '#d97706',
      desc: 'Các biển số đã chốt lịch đấu giá chính thức trong tuần hiện tại trên sàn VPA.',
    },
    {
      id: 'expired',
      title: 'VPA - Kết quả / Lịch sử đấu giá',
      sub: 'Các phiên đấu giá đã kết thúc',
      badge: 'Kết quả đấu giá',
      badgeBg: 'rgba(71, 85, 105, 0.1)',
      badgeColor: '#475569',
      count: sourceStats.expired,
      icon: Landmark,
      color: '#475569',
      desc: 'Toàn bộ biển số đã đấu giá thành công hoặc phiên đã đóng, phục vụ tra cứu lịch sử và thống kê thị trường.',
    },
  ];

  const formatOptions = [
    {
      id: 'xlsx',
      title: 'Excel (.xlsx)',
      sub: provinceMode === 'custom' && selectedProvinceIds.length === 1 ? '1 sheet tỉnh đã chọn' : 'Tự động chia Sheet từng Tỉnh',
      icon: FileSpreadsheet,
      color: '#107c41',
      badge: 'Khuyên dùng',
    },
    {
      id: 'docx',
      title: 'Word (.docx)',
      sub: vehicle === 2 ? 'Catalogue Xe máy in ấn' : vehicle === 1 ? 'Catalogue Ô tô in ấn' : 'Bảng biểu chuẩn in ấn',
      icon: FileText,
      color: '#2b579a',
      badge: 'In / Gửi khách',
    },
    {
      id: 'csv',
      title: 'CSV (.csv)',
      sub: 'Stream siêu tốc không giới hạn',
      icon: FileCode,
      color: '#c2410c',
      badge: 'CRM / Tích hợp',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Tùy chọn xuất dữ liệu biển số" maxWidth="720px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* MỤC 1: PHÂN LOẠI PHƯƠNG TIỆN (XE MÁY / Ô TÔ / TẤT CẢ) */}
        <div
          style={{
            background: 'var(--surface-sunken, #f8fafc)',
            border: '1.5px solid var(--border-subtle, #e2e8f0)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '10px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--action-primary, #F19720)' }}>🛵/🚗</span>
              <span>1. Phân loại xe xuất file:</span>
            </label>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {vehicle === 2 ? 'Đang lọc riêng Xe máy' : vehicle === 1 ? 'Đang lọc riêng Ô tô' : 'Đang lấy cả Ô tô & Xe máy'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              {
                val: null,
                label: 'Tất cả (Ô tô & Xe máy)',
                sub: 'Xuất gộp toàn bộ xe',
                icon: Layers2,
                color: '#64748b',
              },
              {
                val: 2,
                label: 'Chỉ Xe máy 🛵',
                sub: 'Biển số xe máy 2 bánh',
                icon: Bike,
                color: '#d97706',
                highlight: true,
              },
              {
                val: 1,
                label: 'Chỉ Ô tô 🚗',
                sub: 'Biển số ô tô các loại',
                icon: Car,
                color: '#2563eb',
              },
            ].map((vOpt) => {
              const active = vehicle === vOpt.val;
              const Icon = vOpt.icon;
              return (
                <button
                  key={String(vOpt.val)}
                  type="button"
                  data-testid={`vehicle-option-${vOpt.val ?? 'all'}`}
                  onClick={() => setVehicle(vOpt.val)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm, 8px)',
                    border: `1.5px solid ${active ? (vOpt.color || 'var(--action-primary)') : 'var(--border-subtle, #e2e8f0)'}`,
                    background: active ? (vOpt.color ? `${vOpt.color}12` : 'rgba(241,151,32,0.1)') : '#ffffff',
                    color: active ? (vOpt.color || 'var(--action-primary)') : 'var(--text-strong)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Icon size={16} color={active ? (vOpt.color || 'var(--action-primary)') : '#64748b'} />
                    <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 600 }}>{vOpt.label}</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{vOpt.sub}</span>
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: vOpt.color || '#F19720',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MỤC 2: TÙY BIẾN TỈNH THÀNH (TOÀN BỘ 63 TỈNH HOẶC CHỌN TỪNG TỈNH) */}
        <div
          style={{
            background: 'var(--surface-sunken, #f8fafc)',
            border: '1.5px solid var(--border-subtle, #e2e8f0)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '10px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} style={{ color: '#0284c7' }} />
              <span>2. Tùy biến Tỉnh / Thành phố:</span>
            </label>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {provinceMode === 'all'
                ? 'Toàn bộ 63 Tỉnh/Thành'
                : `Đã chọn: ${selectedProvinceIds.length}/${provinces.length} tỉnh`}
            </span>
          </div>

          {/* Toggle Chế độ Tỉnh thành */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              data-testid="province-mode-all"
              onClick={() => {
                setProvinceMode('all');
                setSelectedProvinceIds([]);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: `1.5px solid ${provinceMode === 'all' ? '#0284c7' : 'var(--border-subtle, #cbd5e1)'}`,
                background: provinceMode === 'all' ? 'rgba(2, 132, 199, 0.08)' : '#ffffff',
                color: provinceMode === 'all' ? '#0284c7' : 'var(--text-strong)',
                fontSize: 12,
                fontWeight: provinceMode === 'all' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>🏛️ Toàn bộ 63 Tỉnh/Thành phố</span>
              {provinceMode === 'all' && <Check size={14} strokeWidth={2.5} />}
            </button>

            <button
              type="button"
              data-testid="province-mode-custom"
              onClick={() => {
                setProvinceMode('custom');
                if (selectedProvinceIds.length === 0 && provinces.length > 0) {
                  // Mặc định chọn top 5 nếu chưa chọn gì
                  handleSelectTop5();
                }
              }}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: `1.5px solid ${provinceMode === 'custom' ? '#0284c7' : 'var(--border-subtle, #cbd5e1)'}`,
                background: provinceMode === 'custom' ? 'rgba(2, 132, 199, 0.08)' : '#ffffff',
                color: provinceMode === 'custom' ? '#0284c7' : 'var(--text-strong)',
                fontSize: 12,
                fontWeight: provinceMode === 'custom' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>📍 Tùy chọn từng Tỉnh/Thành</span>
              {provinceMode === 'custom' && <Check size={14} strokeWidth={2.5} />}
            </button>
          </div>

          {/* Chi tiết chọn từng tỉnh */}
          {provinceMode === 'custom' && (
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid var(--border-subtle, #e2e8f0)', padding: 10 }}>
              {/* Quick Select Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Chọn nhanh:</span>
                  {[
                    { label: '⭐ Top 5 TP lớn', action: handleSelectTop5 },
                    { label: '🏔️ Miền Bắc', action: () => handleSelectRegion('bac') },
                    { label: '🌊 Miền Trung', action: () => handleSelectRegion('trung') },
                    { label: '🌴 Miền Nam', action: () => handleSelectRegion('nam') },
                    { label: 'Chọn hết (63)', action: handleSelectAllProvinces },
                    { label: 'Bỏ chọn', action: handleClearProvinces },
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={btn.action}
                      style={{
                        padding: '3px 7px',
                        fontSize: 10.5,
                        fontWeight: 600,
                        borderRadius: 4,
                        border: '1px solid var(--border-subtle, #cbd5e1)',
                        background: 'var(--surface-sunken, #f8fafc)',
                        color: 'var(--text-strong)',
                        cursor: 'pointer',
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Tìm kiếm tỉnh */}
                <div style={{ position: 'relative', minWidth: 160, flex: 1, maxWidth: 220 }}>
                  <Search size={13} style={{ position: 'absolute', left: 7, top: 7, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={provinceSearch}
                    onChange={(e) => setProvinceSearch(e.target.value)}
                    placeholder="Tìm tỉnh (Hà Nội, 29...)"
                    style={{
                      width: '100%',
                      padding: '4px 24px 4px 24px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: '1px solid var(--border-subtle, #cbd5e1)',
                      outline: 'none',
                    }}
                  />
                  {provinceSearch && (
                    <button
                      type="button"
                      onClick={() => setProvinceSearch('')}
                      style={{ position: 'absolute', right: 5, top: 5, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={12} color="#94a3b8" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid các tỉnh thành */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 5,
                  maxHeight: 140,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {filteredProvinces.map((prov) => {
                  const isChecked = selectedProvinceIds.includes(prov.id);
                  return (
                    <div
                      key={prov.id}
                      onClick={() => handleToggleProvince(prov.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 6px',
                        borderRadius: 4,
                        border: `1px solid ${isChecked ? '#0284c7' : 'var(--border-subtle, #e2e8f0)'}`,
                        background: isChecked ? 'rgba(2, 132, 199, 0.08)' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: 11,
                        color: isChecked ? '#0284c7' : 'var(--text-strong)',
                        fontWeight: isChecked ? 600 : 400,
                        userSelect: 'none',
                        transition: 'all 0.1s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 13,
                          height: 13,
                          borderRadius: 3,
                          border: `1px solid ${isChecked ? '#0284c7' : '#94a3b8'}`,
                          background: isChecked ? '#0284c7' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isChecked && <Check size={10} color="#ffffff" strokeWidth={3} />}
                      </div>
                      {prov.code && (
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: '1px 3px',
                            borderRadius: 3,
                            background: isChecked ? 'rgba(2, 132, 199, 0.2)' : '#f1f5f9',
                            color: isChecked ? '#0284c7' : '#64748b',
                            flexShrink: 0,
                          }}
                        >
                          {prov.code}
                        </span>
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prov.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Thông báo số sheet Excel xuất tương ứng */}
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed var(--border-subtle, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: selectedProvinceIds.length === 0 ? '#dc2626' : 'var(--text-muted)' }}>
                  {selectedProvinceIds.length === 0 ? (
                    '⚠️ Vui lòng chọn ít nhất 1 tỉnh/thành để xuất file.'
                  ) : selectedProvinceIds.length === 1 ? (
                    `💡 File Excel sẽ xuất duy nhất 1 sheet của tỉnh: "${provinces.find((p) => p.id === selectedProvinceIds[0])?.name || ''}"`
                  ) : (
                    `💡 File Excel sẽ phân tách riêng ${selectedProvinceIds.length} sheet tương ứng với ${selectedProvinceIds.length} tỉnh thành đã chọn.`
                  )}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>
                  {selectedProvinceIds.length}/{provinces.length} tỉnh
                </span>
              </div>
            </div>
          )}
        </div>

        {/* MỤC 3: NGUỒN DỮ LIỆU BIỂN SỐ (CHECKBOXES) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers2 size={15} style={{ color: 'var(--action-primary, #F19720)' }} />
              <span>3. Chọn các nguồn biển số cần xuất:</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>
                Đã chọn: <strong style={{ color: selectedSources.length > 0 ? 'var(--text-strong)' : '#dc2626' }}>{selectedSources.length}/4</strong> nguồn
              </span>
              <button
                type="button"
                onClick={() => setSelectedSources(['shop', 'month', 'week', 'expired'])}
                style={{
                  padding: '2px 7px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  borderRadius: 4,
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  background: 'var(--surface-sunken, #f8fafc)',
                  color: 'var(--text-strong)',
                  cursor: 'pointer',
                }}
              >
                Tất cả (4)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSources(['shop'])}
                style={{
                  padding: '2px 7px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  borderRadius: 4,
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  background: 'var(--surface-sunken, #f8fafc)',
                  color: 'var(--text-strong)',
                  cursor: 'pointer',
                }}
              >
                Chỉ Kho riêng
              </button>
              <button
                type="button"
                onClick={() => setSelectedSources(['month', 'week', 'expired'])}
                style={{
                  padding: '2px 7px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  borderRadius: 4,
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  background: 'var(--surface-sunken, #f8fafc)',
                  color: 'var(--text-strong)',
                  cursor: 'pointer',
                }}
              >
                Chỉ VPA
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {sourceCards.map((card) => {
              const checked = selectedSources.includes(card.id);
              const Icon = card.icon;

              return (
                <div
                  key={card.id}
                  onClick={() => handleToggleSource(card.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '9px 11px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: `1.5px solid ${checked ? card.color : 'var(--border-subtle, #e2e8f0)'}`,
                    background: checked ? `${card.color}0a` : 'var(--surface-raised, #ffffff)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ paddingTop: 2, flexShrink: 0 }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: `1.5px solid ${checked ? card.color : 'var(--grey-400, #94a3b8)'}`,
                        background: checked ? card.color : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {checked && <Check size={11} color="#ffffff" strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Icon */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: checked ? `${card.color}15` : 'var(--surface-sunken, #f1f5f9)',
                      color: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: checked ? card.color : 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {card.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 99,
                          background: checked ? card.color : 'var(--surface-sunken, #f1f5f9)',
                          color: checked ? '#ffffff' : 'var(--text-strong, #334155)',
                          fontVariantNumeric: 'tabular-nums',
                          flexShrink: 0,
                        }}
                      >
                        {countsLoading ? '…' : Number(card.count || 0).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted, #64748b)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedSources.length === 0 && (
            <div
              style={{
                marginTop: 6,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm, 6px)',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#b91c1c',
                fontSize: 11.5,
              }}
            >
              <AlertCircle size={14} />
              <span>Vui lòng chọn ít nhất 1 nguồn dữ liệu để có thể xuất file.</span>
            </div>
          )}
        </div>

        {/* MỤC 4: ĐỊNH DẠNG FILE & PHẠM VI XUẤT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
          {/* Định dạng */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <FileSpreadsheet size={15} style={{ color: 'var(--action-primary, #F19720)' }} />
              <span>4. Định dạng file:</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {formatOptions.map((opt) => {
                const active = format === opt.id;
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setFormat(opt.id);
                      if (opt.id === 'docx') setPreviewTab('docx');
                      else if (opt.id === 'xlsx') setPreviewTab('xlsx');
                    }}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: `1.5px solid ${active ? opt.color : 'var(--border-subtle, #e2e8f0)'}`,
                      background: active ? `${opt.color}0a` : 'var(--surface-raised, #ffffff)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={18} color={opt.color} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: active ? opt.color : 'var(--text-strong)' }}>
                      {opt.title}
                    </span>
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)', lineHeight: 1.2 }}>
                      {opt.sub}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phạm vi */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Filter size={15} style={{ color: 'var(--action-primary, #F19720)' }} />
              <span>5. Số lượng biển:</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                onClick={() => setRange('all')}
                style={{
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: `1.5px solid ${range === 'all' ? 'var(--action-primary, #F19720)' : 'var(--border-subtle, #e2e8f0)'}`,
                  background: range === 'all' ? 'rgba(241, 151, 32, 0.08)' : 'var(--surface-raised, #ffffff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: range === 'all' ? 'var(--action-primary, #d97706)' : 'var(--text-strong)' }}>
                    Toàn bộ theo bộ lọc
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Tự động tạo job chạy ngầm
                  </div>
                </div>
                <strong style={{ color: 'var(--action-primary, #d97706)', fontSize: 12.5, fontWeight: 800 }}>
                  {countsLoading ? '…' : Number(totalSelectedPlates).toLocaleString('vi-VN')}
                </strong>
              </div>

              <div
                onClick={() => setRange('page')}
                style={{
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: `1.5px solid ${range === 'page' ? 'var(--action-primary, #F19720)' : 'var(--border-subtle, #e2e8f0)'}`,
                  background: range === 'page' ? 'rgba(241, 151, 32, 0.08)' : 'var(--surface-raised, #ffffff)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: range === 'page' ? 'var(--action-primary, #d97706)' : 'var(--text-strong)' }}>
                    Chỉ trang hiện tại
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Trang {page}
                  </div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>
                  {currentPageCount || pageSize} biển
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MỤC 6: XEM TRƯỚC THÀNH PHẨM (PREVIEW EXCEL & WORD) */}
        <div
          style={{
            background: 'var(--surface-sunken, #f8fafc)',
            border: '1.5px solid var(--border-subtle, #e2e8f0)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '10px 14px',
          }}
        >
          {/* Header Preview & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPreview ? 8 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={15} style={{ color: previewTab === 'xlsx' ? '#107c41' : '#2b579a' }} />
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)' }}>
                6. Xem trước mẫu thành phẩm ({previewTab === 'xlsx' ? 'Bảng tính Excel .xlsx' : 'Tài liệu in ấn Word .docx'}):
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Tab Selector Excel vs Word */}
              <div style={{ display: 'inline-flex', background: '#ffffff', borderRadius: 6, padding: 2, border: '1px solid var(--border-subtle, #cbd5e1)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTab('xlsx');
                    setShowPreview(true);
                  }}
                  style={{
                    padding: '3px 9px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: 'none',
                    background: previewTab === 'xlsx' ? '#107c41' : 'transparent',
                    color: previewTab === 'xlsx' ? '#ffffff' : 'var(--text-strong)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FileSpreadsheet size={13} />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTab('docx');
                    setShowPreview(true);
                  }}
                  style={{
                    padding: '3px 9px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: 'none',
                    background: previewTab === 'docx' ? '#2b579a' : 'transparent',
                    color: previewTab === 'docx' ? '#ffffff' : 'var(--text-strong)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FileText size={13} />
                  <span>Word (.docx)</span>
                </button>
              </div>

              {/* Nút Ẩn/Hiện */}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 4,
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  background: '#ffffff',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showPreview ? 'Thu gọn' : 'Xem mẫu'}</span>
              </button>
            </div>
          </div>

          {/* Khung Hiển Thị Preview */}
          {showPreview && (
            <div style={{ marginTop: 6 }}>
              {previewTab === 'xlsx' ? (
                /* EXCEL MOCKUP */
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', background: '#ffffff', fontSize: 11 }}>
                  {/* Excel Window Header */}
                  <div style={{ background: '#107c41', color: '#ffffff', padding: '5px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileSpreadsheet size={14} color="#ffffff" />
                      <strong style={{ fontSize: 11 }}>
                        bien-so-vpa-{vehicle === 2 ? 'xe-may' : vehicle === 1 ? 'o-to' : 'tat-ca'}-{provinceMode === 'custom' && selectedProvinceIds.length === 1 ? 'tinh-thanh' : 'toan-quoc'}.xlsx
                      </strong>
                    </div>
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 3 }}>
                      Microsoft Excel Spreadsheet
                    </span>
                  </div>

                  {/* Formula Bar */}
                  <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5 }}>
                    <span style={{ fontWeight: 700, color: '#64748b', background: '#e2e8f0', padding: '1px 6px', borderRadius: 3 }}>A1</span>
                    <span style={{ fontStyle: 'italic', fontWeight: 700, color: '#94a3b8' }}>fx</span>
                    <span style={{ color: '#334155', fontWeight: 600 }}>
                      DANH SÁCH BIỂN SỐ XE {vehicle === 2 ? 'XE MÁY 🛵' : vehicle === 1 ? 'Ô TÔ 🚗' : 'HỆ THỐNG'} — BIENSOVIP.COM
                    </span>
                  </div>

                  {/* Spreadsheet Grid */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left', minWidth: 540 }}>
                      <thead>
                        {/* Column Index Row */}
                        <tr style={{ background: '#f1f5f9', color: '#64748b', fontSize: 9.5 }}>
                          <th style={{ width: 28, padding: '2px 4px', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>#</th>
                          <th style={{ width: 100, padding: '2px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>A</th>
                          <th style={{ width: 70, padding: '2px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>B</th>
                          <th style={{ width: 85, padding: '2px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>C</th>
                          <th style={{ width: 95, padding: '2px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>D</th>
                          <th style={{ width: 80, padding: '2px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>E</th>
                          <th style={{ width: 110, padding: '2px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>F</th>
                          <th style={{ padding: '2px 6px', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>G</th>
                        </tr>
                        {/* Data Header Row */}
                        <tr style={{ background: '#e8f5e9', color: '#166534', fontWeight: 700, fontSize: 10.5 }}>
                          <th style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>1</th>
                          <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Biển số</th>
                          <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Loại xe</th>
                          <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Loại thế số</th>
                          <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Tỉnh/Thành</th>
                          <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Nguồn gốc</th>
                          <th style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Giá niêm yết</th>
                          <th style={{ padding: '4px 6px', borderBottom: '1px solid #cbd5e1' }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewPlates.map((row, idx) => (
                          <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fcfcfc' }}>
                            <td style={{ padding: '4px 6px', textAlign: 'center', color: '#94a3b8', fontSize: 10, borderRight: '1px solid #cbd5e1', background: '#f8fafc' }}>
                              {idx + 2}
                            </td>
                            <td style={{ padding: '4px 6px', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                              {row.plate}
                            </td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0', color: row.vehicle === 'Xe máy' ? '#d97706' : '#2563eb', fontWeight: 600 }}>
                              {row.vehicle}
                            </td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0', color: '#475569' }}>
                              {row.type}
                            </td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0', color: '#334155', fontWeight: 500 }}>
                              {row.prov}
                            </td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: row.source === 'Kho riêng' ? '#dcfce7' : '#eff6ff', color: row.source === 'Kho riêng' ? '#15803d' : '#1d4ed8', fontWeight: 600 }}>
                                {row.source}
                              </span>
                            </td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: '#b45309', fontVariantNumeric: 'tabular-nums', borderRight: '1px solid #e2e8f0' }}>
                              {row.price}
                            </td>
                            <td style={{ padding: '4px 6px', color: '#059669', fontWeight: 600, fontSize: 10 }}>
                              {row.state}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Excel Sheet Tabs Bar */}
                  <div style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', padding: '3px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', maxWidth: '75%' }}>
                      <span style={{ color: '#94a3b8', fontSize: 10, marginRight: 2 }}>◀ ▶</span>
                      {previewSheets.slice(0, 5).map((sh, idx) => (
                        <div
                          key={sh}
                          style={{
                            padding: '3px 8px',
                            background: idx === 0 ? '#ffffff' : 'transparent',
                            borderTop: idx === 0 ? '2px solid #107c41' : 'none',
                            borderLeft: '1px solid #cbd5e1',
                            borderRight: '1px solid #cbd5e1',
                            fontWeight: idx === 0 ? 700 : 500,
                            color: idx === 0 ? '#107c41' : '#64748b',
                            borderRadius: '3px 3px 0 0',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          📄 {sh}
                        </div>
                      ))}
                      {previewSheets.length > 5 && (
                        <span style={{ color: '#64748b', padding: '0 4px' }}>+{previewSheets.length - 5} tỉnh...</span>
                      )}
                    </div>
                    <span style={{ color: '#64748b', fontSize: 10 }}>
                      ⚡ Tự động chia Sheet từng Tỉnh
                    </span>
                  </div>
                </div>
              ) : (
                /* WORD MOCKUP */
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', background: '#e2e8f0', fontSize: 11 }}>
                  {/* Word Window Header */}
                  <div style={{ background: '#2b579a', color: '#ffffff', padding: '5px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} color="#ffffff" />
                      <strong style={{ fontSize: 11 }}>
                        catalogue-bien-so-{vehicle === 2 ? 'xe-may' : vehicle === 1 ? 'o-to' : 'tat-ca'}.docx
                      </strong>
                    </div>
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 3 }}>
                      Microsoft Word (Bảng biểu in ấn & Báo giá)
                    </span>
                  </div>

                  {/* Word Paper Document Simulator */}
                  <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 640,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.07)',
                        padding: '10px 14px',
                        borderRadius: 3,
                      }}
                    >
                      {/* Brand Header */}
                      <div style={{ textAlign: 'center', borderBottom: '1.5px solid #2b579a', paddingBottom: 5, marginBottom: 6 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          BIENSOVIP.COM — HỆ THỐNG BIỂN SỐ XE VIP & ĐẤU GIÁ VPA
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b', marginTop: 1 }}>
                          DANH MỤC & BẢNG BÁO GIÁ BIỂN SỐ {vehicle === 2 ? 'XE MÁY 🛵' : vehicle === 1 ? 'Ô TÔ 🚗' : 'XE VIP'}
                        </div>
                      </div>

                      {/* Summary Box */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', marginBottom: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, fontSize: 10 }}>
                        <div>• <strong>Phạm vi:</strong> {provinceMode === 'custom' && selectedProvinceIds.length > 0 ? `${selectedProvinceIds.length} tỉnh thành đã chọn` : 'Toàn quốc (63 tỉnh/thành)'}</div>
                        <div>• <strong>Chủng loại:</strong> {vehicle === 2 ? 'Chỉ Xe máy 🛵' : vehicle === 1 ? 'Chỉ Ô tô 🚗' : 'Cả Ô tô & Xe máy'}</div>
                        <div>• <strong>Nguồn dữ liệu:</strong> {selectedSources.length === 4 ? 'Toàn bộ 4 nguồn' : `${selectedSources.length} nguồn đã chọn`}</div>
                        <div>• <strong>Định dạng in:</strong> A4 Tiêu chuẩn (Portrait)</div>
                      </div>

                      {/* Print-ready Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#1e293b', color: '#ffffff', fontWeight: 700 }}>
                            <th style={{ padding: '3px 5px', width: 28, textAlign: 'center' }}>STT</th>
                            <th style={{ padding: '3px 5px', width: 110 }}>Biển số</th>
                            <th style={{ padding: '3px 5px', width: 90 }}>Tỉnh / Loại</th>
                            <th style={{ padding: '3px 5px' }}>Thế số / Phong thủy</th>
                            <th style={{ padding: '3px 5px', textAlign: 'right', width: 110 }}>Giá niêm yết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewPlates.slice(0, 3).map((row, idx) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '3px 5px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                              <td style={{ padding: '3px 5px', fontWeight: 800, fontFamily: 'monospace', fontSize: 11, color: '#0f172a' }}>
                                {row.plate}
                              </td>
                              <td style={{ padding: '3px 5px', color: '#475569' }}>
                                {row.prov} • {row.vehicle}
                              </td>
                              <td style={{ padding: '3px 5px', color: '#334155' }}>
                                <strong>{row.type}</strong>
                              </td>
                              <td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 800, color: '#b45309' }}>
                                {row.price}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Word Document Footer */}
                      <div style={{ marginTop: 6, paddingTop: 3, borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#94a3b8' }}>
                        <span>Biên bản báo giá chuẩn in ấn • Hỗ trợ sang tên toàn quốc</span>
                        <span>Trang 1 / 1 • Hotline: 09xx.xxx.xxx</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--border-subtle, #f1f5f9)', flexWrap: 'wrap' }}>
          <div>
            {onOpenHistory && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#0284c7',
                  fontWeight: 600,
                  fontSize: 12,
                  padding: '5px 8px',
                }}
              >
                <Clock size={13} />
                <span>Lịch sử xuất file (30 ngày)</span>
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button type="button" variant="outline" size="sm" onClick={onClose} style={{ minWidth: 70 }}>
              Hủy
            </Button>
            <Button
              type="submit"
              data-testid="export-submit-btn"
              variant="primary"
              size="md"
              disabled={selectedSources.length === 0 || (provinceMode === 'custom' && selectedProvinceIds.length === 0)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                minWidth: 160,
                fontWeight: 700,
                background: selectedSources.length === 0 || (provinceMode === 'custom' && selectedProvinceIds.length === 0)
                  ? 'var(--grey-400)'
                  : (format === 'xlsx' ? '#107c41' : (format === 'docx' ? '#2b579a' : '#c2410c')),
                borderColor: 'transparent',
                cursor: selectedSources.length === 0 || (provinceMode === 'custom' && selectedProvinceIds.length === 0) ? 'not-allowed' : 'pointer',
              }}
            >
              <Download size={15} />
              <span>
                {format === 'xlsx'
                  ? `Xuất Excel ${provinceMode === 'custom' && selectedProvinceIds.length > 0 ? `(${selectedProvinceIds.length} tỉnh)` : '(63 tỉnh)'}`
                  : format === 'docx'
                  ? `Xuất Word ${vehicle === 2 ? '(Xe máy)' : vehicle === 1 ? '(Ô tô)' : ''}`
                  : 'Xuất CSV (.csv)'}
              </span>
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
