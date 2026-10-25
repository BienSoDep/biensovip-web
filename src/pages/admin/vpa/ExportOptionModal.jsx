import { useState, useMemo } from 'react';
import {
  Download, FileSpreadsheet, FileText, FileCode, Check,
  CarFront, Gavel, Calendar, Landmark, Filter, Layers2,
  Clock, SlidersHorizontal, AlertCircle, Store, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import { useVpaExportCounts } from '../../../services/adminVpa.js';
import { useVpaProvinces } from '../../../services/vpa.js';

// Các cấu hình định sẵn (Presets)
const PRESETS = [
  {
    id: 'all',
    label: 'Tất cả (VPA & Kho riêng)',
    desc: 'Bao gồm toàn bộ biển VPA và kho biển riêng Duy Đinh',
    sources: ['shop', 'month', 'week', 'expired'],
  },
  {
    id: 'vpa',
    label: 'Toàn bộ VPA',
    desc: 'Phiên tháng, phiên tuần & kết quả đấu giá',
    sources: ['month', 'week', 'expired'],
  },
  {
    id: 'shop',
    label: 'Chỉ kho riêng Duy Đinh',
    desc: 'Biển có sẵn showroom, không nằm trong VPA',
    sources: ['shop'],
  },
  {
    id: 'open',
    label: 'Phiên đang mở',
    desc: 'Biển sắp & đang đấu giá (Tháng & Tuần)',
    sources: ['month', 'week'],
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
  
  // Bộ lọc phụ bổ trợ
  const [vehicle, setVehicle] = useState(null); // null = Tất cả, 1 = Ô tô, 2 = Xe máy
  const [provinceId, setProvinceId] = useState(''); // '' = Toàn quốc
  const [priceState, setPriceState] = useState(null); // null = Tất cả, 1 = Đã duyệt giá bán, 2 = Chờ định giá
  const [showFilters, setShowFilters] = useState(false);

  // Định dạng file & Phạm vi số lượng
  const [format, setFormat] = useState('xlsx'); // 'xlsx' | 'docx' | 'csv'
  const [range, setRange] = useState('all'); // 'all' | 'page'

  // Lấy danh mục tỉnh thành
  const { data: provinces = [] } = useVpaProvinces();

  // Tạo query filter gửi lên server để đếm số lượng real-time
  const countParams = useMemo(() => {
    const p = {
      ...filter,
      sources: selectedSources.join(','),
    };
    if (vehicle != null && vehicle !== '') p.vehicle = vehicle;
    if (provinceId) p.provinceId = provinceId;
    if (priceState != null && priceState !== '') p.priceState = priceState;
    return p;
  }, [filter, selectedSources, vehicle, provinceId, priceState]);

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
      p.sources.every((s) => selectedSources.includes(s))
  )?.id;

  const handleApplyPreset = (preset) => {
    setSelectedSources([...preset.sources]);
  };

  const handleToggleSource = (srcId) => {
    setSelectedSources((prev) =>
      prev.includes(srcId) ? prev.filter((s) => s !== srcId) : [...prev, srcId]
    );
  };

  // Xác định scope gửi đi
  const hasShop = selectedSources.includes('shop');
  const hasVpa = selectedSources.some((s) => ['month', 'week', 'expired'].includes(s));
  const effectiveScope = hasShop && hasVpa ? 'all' : (hasShop ? 'available' : 'vpa');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (selectedSources.length === 0) return;

    onExport({
      format,
      scope: effectiveScope,
      sources: selectedSources,
      vehicle: vehicle || undefined,
      provinceId: provinceId || undefined,
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
      badge: 'Kho riêng • Có sẵn giao dịch',
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
      sub: 'Chia Sheet theo từng Tỉnh thành',
      icon: FileSpreadsheet,
      color: '#107c41',
      badge: 'Khuyên dùng',
    },
    {
      id: 'docx',
      title: 'Word (.docx)',
      sub: 'Bảng biểu chuẩn văn bản in ấn',
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
    <Modal open={open} onClose={onClose} title="Tùy chọn xuất dữ liệu biển số" maxWidth="680px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Presets Bar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Chọn nhanh cấu hình:
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Đã chọn: <strong style={{ color: 'var(--text-strong)' }}>{selectedSources.length}/4</strong> nguồn
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PRESETS.map((preset) => {
              const active = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  title={preset.desc}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    border: `1px solid ${active ? 'var(--primary, #0284c7)' : 'var(--grey-200, #e2e8f0)'}`,
                    background: active ? 'rgba(2, 132, 199, 0.08)' : 'var(--surface-sunken, #f8fafc)',
                    color: active ? 'var(--primary, #0284c7)' : 'var(--text-strong, #334155)',
                    fontSize: 11.5,
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

        {/* Section 1: Checkboxes Nguồn biển số */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Layers2 size={15} style={{ color: 'var(--primary, #0284c7)' }} />
            <span>1. Chọn các nguồn biển số cần xuất:</span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: `1.5px solid ${checked ? card.color : 'var(--grey-200, #e2e8f0)'}`,
                    background: checked ? `${card.color}0a` : 'var(--surface-raised, #ffffff)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Custom Checkbox */}
                  <div style={{ paddingTop: 3, flexShrink: 0 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `1.5px solid ${checked ? card.color : 'var(--grey-400, #94a3b8)'}`,
                        background: checked ? card.color : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {checked && <Check size={13} color="#ffffff" strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: checked ? `${card.color}15` : 'var(--surface-sunken, #f1f5f9)',
                      color: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={17} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: checked ? card.color : 'var(--text-strong)' }}>
                        {card.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: card.badgeBg,
                          color: card.badgeColor,
                        }}
                      >
                        {card.badge}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: checked ? card.color : 'var(--surface-sunken, #f1f5f9)',
                          color: checked ? '#ffffff' : 'var(--text-strong, #334155)',
                          marginLeft: 'auto',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {countsLoading ? '…' : Number(card.count || 0).toLocaleString('vi-VN')} biển
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted, #64748b)', lineHeight: 1.45 }}>
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
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#b91c1c',
                fontSize: 12,
              }}
            >
              <AlertCircle size={15} />
              <span>Vui lòng chọn ít nhất 1 nguồn dữ liệu để có thể xuất file.</span>
            </div>
          )}
        </div>

        {/* Section Bổ trợ: Bộ lọc phụ */}
        <div
          style={{
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--grey-200, #e2e8f0)',
            background: 'var(--surface-sunken, #f8fafc)',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-strong)',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SlidersHorizontal size={14} style={{ color: 'var(--primary, #0284c7)' }} />
              <span>Bộ lọc bổ trợ (thu hẹp theo Loại xe / Tỉnh thành / Giá)</span>
              {(vehicle != null || provinceId || priceState != null) && (
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'var(--primary, #0284c7)', color: '#ffffff' }}>
                  Đang lọc
                </span>
              )}
            </div>
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showFilters && (
            <div style={{ padding: '10px 12px 14px', borderTop: '1px solid var(--grey-200, #e2e8f0)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Row 1: Loại xe & Trạng thái giá */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Loại xe */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Loại phương tiện:
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { val: null, label: 'Tất cả' },
                      { val: 1, label: 'Ô tô' },
                      { val: 2, label: 'Xe máy' },
                    ].map((btn) => {
                      const active = vehicle === btn.val;
                      return (
                        <button
                          key={String(btn.val)}
                          type="button"
                          onClick={() => setVehicle(btn.val)}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            fontSize: 11,
                            fontWeight: active ? 700 : 500,
                            borderRadius: 4,
                            border: `1px solid ${active ? 'var(--primary, #0284c7)' : 'var(--grey-300, #cbd5e1)'}`,
                            background: active ? 'var(--primary, #0284c7)' : '#ffffff',
                            color: active ? '#ffffff' : 'var(--text-strong)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trạng thái định giá */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Trạng thái giá:
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { val: null, label: 'Tất cả' },
                      { val: 1, label: 'Đã duyệt giá' },
                      { val: 2, label: 'Chờ định giá' },
                    ].map((btn) => {
                      const active = priceState === btn.val;
                      return (
                        <button
                          key={String(btn.val)}
                          type="button"
                          onClick={() => setPriceState(btn.val)}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            fontSize: 11,
                            fontWeight: active ? 700 : 500,
                            borderRadius: 4,
                            border: `1px solid ${active ? 'var(--primary, #0284c7)' : 'var(--grey-300, #cbd5e1)'}`,
                            background: active ? 'var(--primary, #0284c7)' : '#ffffff',
                            color: active ? '#ffffff' : 'var(--text-strong)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 2: Tỉnh / Thành phố */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Tỉnh / Thành phố:
                </label>
                <select
                  value={provinceId}
                  onChange={(e) => setProvinceId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid var(--grey-300, #cbd5e1)',
                    background: '#ffffff',
                    color: 'var(--text-strong)',
                  }}
                >
                  <option value="">Toàn quốc (Tất cả 63 Tỉnh/Thành)</option>
                  {provinces.map((prov) => (
                    <option key={prov.id || prov.code} value={prov.id || prov.code}>
                      {prov.name} ({prov.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Chọn định dạng file */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FileSpreadsheet size={15} style={{ color: 'var(--primary, #0284c7)' }} />
            <span>2. Chọn định dạng tải về:</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {formatOptions.map((opt) => {
              const active = format === opt.id;
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  style={{
                    padding: '10px 10px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: `1.5px solid ${active ? opt.color : 'var(--grey-200, #e2e8f0)'}`,
                    background: active ? `${opt.color}0a` : 'var(--surface-raised, #ffffff)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={22} color={opt.color} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: active ? opt.color : 'var(--text-strong)' }}>
                    {opt.title}
                  </span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    {opt.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Phạm vi số lượng */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Filter size={15} style={{ color: 'var(--primary, #0284c7)' }} />
            <span>3. Số lượng xuất:</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div
              onClick={() => setRange('all')}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md, 8px)',
                border: `1.5px solid ${range === 'all' ? 'var(--primary, #0284c7)' : 'var(--grey-200, #e2e8f0)'}`,
                background: range === 'all' ? 'rgba(2, 132, 199, 0.05)' : 'var(--surface-raised, #ffffff)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: range === 'all' ? 'var(--primary)' : 'var(--text-strong)', marginBottom: 2 }}>
                Toàn bộ theo bộ lọc đã chọn
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                <strong style={{ color: 'var(--primary, #0284c7)', fontSize: 12.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {countsLoading ? '…' : Number(totalSelectedPlates).toLocaleString('vi-VN')}
                </strong>{' '}
                biển dự kiến xuất • Chạy ngầm &amp; theo dõi %
              </div>
            </div>

            <div
              onClick={() => setRange('page')}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md, 8px)',
                border: `1.5px solid ${range === 'page' ? 'var(--primary, #0284c7)' : 'var(--grey-200, #e2e8f0)'}`,
                background: range === 'page' ? 'rgba(2, 132, 199, 0.05)' : 'var(--surface-raised, #ffffff)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: range === 'page' ? 'var(--primary)' : 'var(--text-strong)', marginBottom: 2 }}>
                Chỉ trang hiện tại
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Trang {page} • {currentPageCount || pageSize} biển đang xem
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 4, paddingTop: 14, borderTop: '1px solid var(--grey-100, #f1f5f9)', flexWrap: 'wrap' }}>
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
                  fontSize: 12.5,
                  padding: '6px 10px',
                }}
              >
                <Clock size={14} />
                <span>Xem lịch sử tải về (30 ngày)</span>
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button type="button" variant="outline" onClick={onClose} style={{ minWidth: 80 }}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={selectedSources.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 160,
                fontWeight: 600,
                background: selectedSources.length === 0 ? 'var(--grey-400)' : (format === 'xlsx' ? '#107c41' : (format === 'docx' ? '#2b579a' : '#c2410c')),
                borderColor: 'transparent',
                cursor: selectedSources.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Download size={15} />
              <span>Tải dữ liệu ngay</span>
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
