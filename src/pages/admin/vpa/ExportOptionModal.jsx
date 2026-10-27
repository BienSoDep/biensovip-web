import { useState, useMemo } from 'react';
import {
  Download, FileSpreadsheet, FileText, FileCode, Check,
  CarFront, Gavel, Calendar, Landmark, Filter, Layers2,
  Clock, SlidersHorizontal, AlertCircle, Store, CheckCircle2,
  ChevronDown, ChevronUp, Bike, Car, MapPin, Search, Sparkles, X
} from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import { useVpaExportCounts } from '../../../services/adminVpa.js';
import { useAdminCategories } from '../../../services/categories.js';

// Các cấu hình định sẵn (Presets)
const PRESETS = [
  {
    id: 'all',
    label: 'Tất cả (VPA & Kho)',
    desc: 'Bao gồm toàn bộ biển VPA và kho biển riêng Duy Đinh (cả ô tô & xe máy)',
    sources: ['shop', 'month', 'week', 'expired'],
    vehicle: null,
  },
  {
    id: 'moto',
    label: 'Chỉ Xe máy 🛵',
    desc: 'Chỉ xuất các biển số xe máy trên toàn hệ thống (VPA & kho riêng)',
    sources: ['shop', 'month', 'week', 'expired'],
    vehicle: 2,
  },
  {
    id: 'car',
    label: 'Chỉ Ô tô 🚗',
    desc: 'Chỉ xuất các biển số ô tô trên toàn hệ thống (VPA & kho riêng)',
    sources: ['shop', 'month', 'week', 'expired'],
    vehicle: 1,
  },
  {
    id: 'shop',
    label: 'Kho riêng Duy Đinh',
    desc: 'Biển có sẵn showroom, sẵn sàng sang tên ngay',
    sources: ['shop'],
    vehicle: null,
  },
  {
    id: 'open',
    label: 'Phiên VPA đang mở',
    desc: 'Biển sắp & đang đấu giá trên sàn VPA (Tháng & Tuần)',
    sources: ['month', 'week'],
    vehicle: null,
  },
];

export default function ExportOptionModal({
  open,
  onClose,
  onExport,
  onOpenHistory,
  page = 1,
  pageSize = 50,
  currentPageCount = 0,
  totalCount = 0,
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
  const [priceState, setPriceState] = useState(null); // null = Tất cả, 1 = Đã duyệt giá bán, 2 = Chờ định giá

  // Định dạng file & Phạm vi số lượng
  const [format, setFormat] = useState('xlsx'); // 'xlsx' | 'docx' | 'csv'
  const [range, setRange] = useState('all'); // 'all' | 'page'

  // Lấy toàn bộ danh mục tỉnh thành hệ thống
  const { data: rawProvinces = [], isLoading: provincesLoading } = useAdminCategories('province');

  // Danh sách các thành phố lớn ưu tiên
  const TOP_5_NAMES = ['Hà Nội', 'Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

  const provinces = useMemo(() => {
    if (!Array.isArray(rawProvinces)) return [];
    return [...rawProvinces].sort((a, b) => {
      const aTop = TOP_5_NAMES.some((n) => a.name?.includes(n));
      const bTop = TOP_5_NAMES.some((n) => b.name?.includes(n));
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

  // Kiểm tra preset hiện tại
  const activePreset = PRESETS.find(
    (p) =>
      p.sources.length === selectedSources.length &&
      p.sources.every((s) => selectedSources.includes(s)) &&
      (p.vehicle === undefined || p.vehicle === vehicle)
  )?.id;

  const handleApplyPreset = (preset) => {
    setSelectedSources([...preset.sources]);
    if (preset.vehicle !== undefined) {
      setVehicle(preset.vehicle);
    }
  };

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
      .filter((p) => TOP_5_NAMES.some((n) => p.name?.includes(n)))
      .map((p) => p.id);
    setSelectedProvinceIds(topIds);
  };

  const handleSelectRegion = (regionKey) => {
    const regionIds = provinces
      .filter((p) => (p.region || '').toLowerCase() === regionKey.toLowerCase())
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
        {/* Presets Bar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Cấu hình nhanh:
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Đã chọn: <strong style={{ color: 'var(--text-strong)' }}>{selectedSources.length}/4</strong> nguồn
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {PRESETS.map((preset) => {
              const active = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  title={preset.desc}
                  style={{
                    padding: '7px 4px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    border: `1px solid ${active ? 'var(--action-primary, #F19720)' : 'var(--border-subtle, #e2e8f0)'}`,
                    background: active ? 'rgba(241, 151, 32, 0.1)' : 'var(--surface-sunken, #f8fafc)',
                    color: active ? 'var(--action-primary, #d97706)' : 'var(--text-strong, #334155)',
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

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
          <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Layers2 size={15} style={{ color: 'var(--action-primary, #F19720)' }} />
            <span>3. Chọn các nguồn biển số cần xuất:</span>
          </label>

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
                    onClick={() => setFormat(opt.id)}
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
