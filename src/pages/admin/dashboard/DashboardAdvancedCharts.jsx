import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Sparkles,
  Layers,
  DollarSign,
  Compass,
  Eye,
  PhoneCall,
  MessageSquare,
  Bookmark,
  GitCompare,
  Share2,
  ArrowRight,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Users,
  Tag,
  MapPin,
  Truck,
  Flame,
} from 'lucide-react';
import { InfoTip } from '../../../components/index.jsx';
import SkeletonBase from '../../../components/skeletons/SkeletonBase.jsx';

// Bảng màu series chuẩn thương hiệu theo tokens.css
const PALETTE = ['#3B5BFF', '#C75B00', '#F5C542', '#3FBF8F', '#E5484D', '#8A6100', '#6B7180', '#3A3E47'];

function EmptyChartBlock({ children = 'Chưa có đủ dữ liệu trong kỳ này' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 220,
      font: 'var(--type-body-sm)',
      color: 'var(--text-faint)',
      textAlign: 'center',
      padding: 'var(--space-4)',
    }}>
      {children}
    </div>
  );
}

/**
 * 1. BANNER ĐÁNH GIÁ ĐIỀU HÀNH KINH DOANH (EXECUTIVE SUMMARY)
 */
export function ExecutiveSummaryBanner({ summary, leadHealth, isSuperAdmin }) {
  if (!summary && !leadHealth) return null;

  return (
    <div style={{
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--gutter-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
      borderLeft: '4px solid var(--action-primary)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{
          background: 'var(--brand-50)',
          border: '1px solid var(--brand-200)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-pill)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--action-primary)',
          font: 'var(--type-caption)',
          fontWeight: 'var(--fw-bold)',
          letterSpacing: '0.02em',
        }}>
          <Sparkles size={14} />
          <span>Tóm tắt điều hành kinh doanh</span>
        </div>

        {leadHealth && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', font: 'var(--type-caption)' }}>
            <span style={{ color: leadHealth.newLeadsWaiting > 0 ? 'var(--status-danger-ink)' : 'var(--status-success-ink)', fontWeight: 'var(--fw-semibold)' }}>
              {leadHealth.newLeadsWaiting > 0 ? `⚠️ ${leadHealth.newLeadsWaiting} lead chờ gọi` : '✓ Lead đã tiếp nhận'}
            </span>
            <span style={{ color: 'var(--text-faint)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ chốt: <b style={{ color: 'var(--text-strong)' }}>{leadHealth.closingRatePct}%</b></span>
          </div>
        )}
      </div>

      <div style={{
        font: 'var(--type-body-sm)',
        lineHeight: 1.6,
        color: 'var(--text-body)',
      }}>
        {summary || 'Hệ thống đang phân tích toàn bộ luồng tương tác, phễu khách hàng và các giao dịch trong kỳ.'}
      </div>
    </div>
  );
}

/**
 * 2. BIỂU ĐỒ HÀNH VI KHÁCH HÀNG ĐA TRƯỜNG (MULTI-SERIES ACTION CHART WITH TOGGLE)
 */
export function EnhancedActionsChart({ chartData, reduceMotion }) {
  const [activeSeries, setActiveSeries] = useState({ views: true, calls: true, contacts: true });

  const toggle = (key) => {
    setActiveSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Đảm bảo luôn còn ít nhất 1 series được bật
      if (!next.views && !next.calls && !next.contacts) return prev;
      return next;
    });
  };

  const points = chartData?.points || [];

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
      padding: 'var(--gutter-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      flex: '1 1 500px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6 }}>
            Hành vi khách hàng đa chiều
            <InfoTip size={12} text="So sánh nhịp độ tương tác theo thời gian: Lượt xem biển, Cuộc gọi/Zalo và Yêu cầu tư vấn." />
          </h3>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Nhấp vào từng nút để bật/tắt đường hiển thị
          </span>
        </div>

        {/* Nút bật tắt từng chuỗi dữ liệu */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => toggle('views')}
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--action-primary)',
              background: activeSeries.views ? 'var(--action-primary)' : 'transparent',
              color: activeSeries.views ? 'var(--white)' : 'var(--action-primary)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeSeries.views ? 'var(--white)' : 'var(--action-primary)' }} />
            <span>Lượt xem</span>
          </button>

          <button
            type="button"
            onClick={() => toggle('calls')}
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--status-warning)',
              background: activeSeries.calls ? 'var(--status-warning)' : 'transparent',
              color: activeSeries.calls ? 'var(--white)' : 'var(--status-warning-ink)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeSeries.calls ? 'var(--white)' : 'var(--status-warning)' }} />
            <span>Cuộc gọi / Zalo</span>
          </button>

          <button
            type="button"
            onClick={() => toggle('contacts')}
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--status-success)',
              background: activeSeries.contacts ? 'var(--status-success)' : 'transparent',
              color: activeSeries.contacts ? 'var(--white)' : 'var(--status-success-ink)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeSeries.contacts ? 'var(--white)' : 'var(--status-success)' }} />
            <span>Yêu cầu liên hệ</span>
          </button>
        </div>
      </div>

      {points.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gViewsEnh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B5BFF" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3B5BFF" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            {activeSeries.views && (
              <Area
                type="monotone"
                dataKey="views"
                stroke="#3B5BFF"
                strokeWidth={2}
                fill="url(#gViewsEnh)"
                isAnimationActive={!reduceMotion}
                animationDuration={600}
                name="Lượt xem"
              />
            )}
            {activeSeries.calls && (
              <Line
                type="monotone"
                dataKey="calls"
                stroke="#F5C542"
                strokeWidth={2.2}
                dot={{ r: 3 }}
                isAnimationActive={!reduceMotion}
                name="Cuộc gọi / Zalo"
              />
            )}
            {activeSeries.contacts && (
              <Line
                type="monotone"
                dataKey="contacts"
                stroke="#3FBF8F"
                strokeWidth={2.2}
                dot={{ r: 3 }}
                isAnimationActive={!reduceMotion}
                name="Liên hệ"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartBlock>Chưa có dữ liệu hành vi trong khoảng thời gian này</EmptyChartBlock>
      )}
    </div>
  );
}

/**
 * 3. TRUNG TÂM PHÂN TÍCH & PHÂN BỔ KHO BIỂN ĐA CHIỀU (MULTI-DIMENSION INVENTORY MATRIX)
 */
export function MultiDimensionPlateDistributionMatrix({
  distTab,
  onTabChange,
  distData,
  chartType,
  onChartTypeChange,
  ratingsData,
  onActionClick,
}) {
  const items = distData?.data?.items || [];
  const totalCount = useMemo(() => items.reduce((sum, it) => sum + (it.count || 0), 0), [items]);

  const tabs = [
    { key: 'plate_type', label: 'Dòng số đẹp', icon: Tag },
    { key: 'province', label: 'Tỉnh / Thành', icon: MapPin },
    { key: 'vehicle_type', label: 'Loại xe', icon: Truck },
    { key: 'price_range', label: 'Phân khúc giá', icon: DollarSign },
    { key: 'region', label: 'Vùng miền', icon: Compass },
    { key: 'status', label: 'Tình trạng', icon: CheckCircle2 },
  ];

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
      padding: 'var(--gutter-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      width: '100%',
    }}>
      {/* Header & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Layers size={20} color="var(--action-primary)" />
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              Phân bổ kho biển tổng hợp theo nhiều trường
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Chuyển tab để soi kho theo Dòng số, Tỉnh thành, Loại xe, Phân khúc giá, Vùng miền hoặc Trạng thái.
          </p>
        </div>

        {/* Nút đổi kiểu Bar / Pie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-hairline)' }}>
          <button
            type="button"
            onClick={() => onChartTypeChange('bar')}
            title="Biểu đồ Cột"
            style={{
              border: 'none',
              background: chartType === 'bar' ? 'var(--white)' : 'transparent',
              color: chartType === 'bar' ? 'var(--action-primary)' : 'var(--text-muted)',
              padding: '5px 10px',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-semibold)',
              boxShadow: chartType === 'bar' ? 'var(--shadow-1)' : 'none',
            }}
          >
            <BarChart3 size={14} />
            <span>Cột</span>
          </button>
          <button
            type="button"
            onClick={() => onChartTypeChange('pie')}
            title="Biểu đồ Bánh"
            style={{
              border: 'none',
              background: chartType === 'pie' ? 'var(--white)' : 'transparent',
              color: chartType === 'pie' ? 'var(--action-primary)' : 'var(--text-muted)',
              padding: '5px 10px',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-semibold)',
              boxShadow: chartType === 'pie' ? 'var(--shadow-1)' : 'none',
            }}
          >
            <PieIcon size={14} />
            <span>Tròn / %</span>
          </button>
        </div>
      </div>

      {/* Tabs chuyển đổi trường */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--border-hairline)', paddingBottom: 'var(--space-2)' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = distTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              style={{
                border: 'none',
                background: isActive ? 'var(--brand-50)' : 'transparent',
                color: isActive ? 'var(--action-primary)' : 'var(--text-muted)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                font: 'var(--type-caption)',
                fontWeight: isActive ? 'var(--fw-bold)' : 'var(--fw-medium)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: isActive ? 'var(--brand-200)' : 'transparent',
                transition: 'var(--transition-control)',
              }}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Nội dung biểu đồ & Bảng xếp hạng 2 cột */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        {/* Cột trái: Biểu đồ trực quan */}
        <div style={{ flex: '1 1 450px', minWidth: 0 }}>
          {distData?.isLoading ? (
            <SkeletonBase height={280} />
          ) : items.length > 0 ? (
            chartType === 'bar' ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={items} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={items.length > 5 ? -25 : 0}
                    textAnchor={items.length > 5 ? 'end' : 'middle'}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số biển" radius={[4, 4, 0, 0]}>
                    {items.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={items}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {items.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} biển (${totalCount > 0 ? Math.round((val / totalCount) * 100) : 0}%)`, name]} />
                </PieChart>
              </ResponsiveContainer>
            )
          ) : (
            <EmptyChartBlock>Chưa có dữ liệu phân bổ cho mục này</EmptyChartBlock>
          )}
        </div>

        {/* Cột phải: Bảng thống kê chi tiết tỷ lệ % & Đánh giá */}
        <div style={{
          flex: '1 1 320px',
          minWidth: 0,
          background: 'var(--surface-sunken)',
          borderRadius: 'var(--radius-card)',
          padding: '14px 16px',
          border: '1px solid var(--border-hairline)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', color: 'var(--text-strong)' }}>
                Tỷ lệ phân bổ chi tiết ({totalCount} biển)
              </span>
              <button
                type="button"
                onClick={() => onActionClick && onActionClick('/admin/bien-so')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--action-primary)', font: 'var(--type-caption)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <span>Mở kho</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
              {items.slice(0, 8).map((it, idx) => {
                const pct = totalCount > 0 ? Math.round((it.count / totalCount) * 100) : 0;
                return (
                  <div key={it.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-strong)', fontWeight: 'var(--fw-medium)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE[idx % PALETTE.length], flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>{it.label}</span>
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        <b>{it.count}</b> biển ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--grey-200)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: PALETTE[idx % PALETTE.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini box đánh giá sao */}
          {ratingsData?.data?.total > 0 && (
            <div style={{
              marginTop: 'var(--space-3)',
              paddingTop: 'var(--space-2)',
              borderTop: '1px solid var(--border-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                  ★ {ratingsData.data.average}
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  ({ratingsData.data.total} đánh giá của khách)
                </span>
              </div>
              <span style={{ font: 'var(--type-caption)', color: 'var(--status-success-ink)', fontWeight: 'var(--fw-semibold)' }}>
                Tín nhiệm cao
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 4. BIỂU ĐỒ CÂN BẰNG CUNG - CẦU ĐA CỘT (GROUPED BAR: SUPPLY VS DEMAND)
 */
export function SupplyDemandComparisonChart({ categorySupplyDemand = [], onActionClick }) {
  if (!categorySupplyDemand.length) return null;

  // Lấy top 8 dòng biển để hiển thị biểu đồ sắc nét
  const chartData = categorySupplyDemand.slice(0, 8).map((cat) => ({
    name: cat.categoryName,
    demandPct: cat.demandPct,
    stockPct: cat.stockPct,
    stockCount: cat.stockCount,
    status: cat.status,
    statusLabel: cat.statusLabel,
    advice: cat.actionAdvice,
  }));

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
      padding: 'var(--gutter-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <TrendingUp size={20} color="var(--action-primary)" />
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              Cân bằng Cung - Cầu theo Loại Biển Số
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            So sánh trực quan giữa Nhu cầu khách quan tâm (% Cầu) và Số lượng biển có sẵn trong kho (% Cung).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', font: 'var(--type-caption)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3B5BFF' }} />
            <span>Nhu cầu khách (% Cầu)</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#C75B00' }} />
            <span>Kho sẵn có (% Cung)</span>
          </span>
        </div>
      </div>

      {/* Biểu đồ Cung Cầu Grouped Bar */}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" />
          <YAxis tick={{ fontSize: 11 }} unit="%" />
          <Tooltip
            formatter={(value, name) => [`${value}%`, name === 'demandPct' ? 'Nhu cầu (% Cầu)' : 'Kho sẵn có (% Cung)']}
          />
          <Bar dataKey="demandPct" name="Nhu cầu (% Cầu)" fill="#3B5BFF" radius={[3, 3, 0, 0]} />
          <Bar dataKey="stockPct" name="Kho sẵn có (% Cung)" fill="#C75B00" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Cảnh báo nhanh các dòng lệch cung cầu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-2)' }}>
        {chartData.slice(0, 3).map((cat) => {
          const isShort = cat.status === 'shortage';
          const isSurplus = cat.status === 'surplus';
          const bg = isShort ? 'var(--status-danger-bg)' : isSurplus ? 'var(--status-warning-bg)' : 'var(--status-success-bg)';
          const color = isShort ? 'var(--status-danger-ink)' : isSurplus ? 'var(--status-warning-ink)' : 'var(--status-success-ink)';

          return (
            <div
              key={cat.name}
              onClick={() => onActionClick && onActionClick('/admin/bien-so', { adminQ: cat.name })}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                cursor: 'pointer',
                border: '1px solid transparent',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 'var(--fw-bold)', font: 'var(--type-caption)', color }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.7)', color }}>
                    {cat.statusLabel}
                  </span>
                </div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                  Cầu: {cat.demandPct}% · Kho: {cat.stockCount} biển ({cat.stockPct}%)
                </div>
              </div>
              <ArrowRight size={14} color={color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 5. BIỂU ĐỒ PHÂN KHÚC GIÁ & SỨC MUA KHÁCH HÀNG (COMPOSED CHART: BAR + LINE)
 */
export function PriceSegmentsSweetSpotChart({ priceSegments = [], onActionClick }) {
  if (!priceSegments.length) return null;

  const chartData = priceSegments.map((seg) => ({
    name: seg.segmentName,
    stockCount: seg.stockCount,
    demandPct: seg.demandPct,
    status: seg.status,
    statusLabel: seg.statusLabel,
    action: seg.suggestedAction,
  }));

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
      padding: 'var(--gutter-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      flex: '1 1 450px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <DollarSign size={20} color="var(--status-success-ink)" />
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              Phân khúc giá & Sức mua thị trường
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Cột xanh thể hiện số biển tồn kho; Đường cam thể hiện % khách quan tâm tìm kiếm.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', font: 'var(--type-caption)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3FBF8F' }} />
            <span>Kho biển (Số lượng)</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E5484D' }} />
            <span>Nhu cầu (% Khách)</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
          <Tooltip />
          <Bar yAxisId="left" dataKey="stockCount" name="Kho biển (Số lượng)" fill="#3FBF8F" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="demandPct" name="Nhu cầu (% Khách)" stroke="#E5484D" strokeWidth={2.5} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Gợi ý phân khúc hot nhất */}
      {(() => {
        const hot = chartData.find((s) => s.status === 'hot') || chartData[0];
        if (!hot) return null;
        return (
          <div style={{
            background: 'var(--surface-sunken)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            font: 'var(--type-caption)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={16} color="#E5484D" />
              <span>
                Phân khúc sôi động nhất: <strong style={{ color: 'var(--text-strong)' }}>{hot.name}</strong> ({hot.demandPct}% khách quan tâm)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onActionClick && onActionClick('/admin/bien-so')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <span>Xem kho</span>
              <ArrowRight size={12} />
            </button>
          </div>
        );
      })()}
    </div>
  );
}

/**
 * 6. BIỂU ĐỒ HÀNH VI TƯƠNG TÁC VI MÔ CỦA KHÁCH HÀNG (MICRO-ENGAGEMENTS BAR)
 */
export function MicroEngagementsChart({ plateEngagement }) {
  if (!plateEngagement) return null;

  const actions = [
    { label: 'Xem chi tiết', count: plateEngagement.detailViews || 0, color: '#3B5BFF', icon: Eye },
    { label: 'Bấm Zalo', count: plateEngagement.zaloCount || 0, color: '#3FBF8F', icon: MessageSquare },
    { label: 'Gọi Hotline', count: plateEngagement.phoneCalls || 0, color: '#C75B00', icon: PhoneCall },
    { label: 'Lưu thích', count: plateEngagement.wishlistSaves || 0, color: '#F5C542', icon: Bookmark },
    { label: 'Đưa so sánh', count: plateEngagement.compareActions || 0, color: '#8A6100', icon: GitCompare },
    { label: 'Tra phong thủy', count: plateEngagement.fengShuiLookups || 0, color: '#E5484D', icon: Sparkles },
    { label: 'Chia sẻ biển', count: plateEngagement.shares || 0, color: '#6B7180', icon: Share2 },
  ];

  const indecision = plateEngagement.indecisionRate || 0;

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
      padding: 'var(--gutter-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      flex: '1 1 450px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Compass size={20} color="var(--action-primary)" />
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              Tương tác vi mô & Chỉ số phân vân
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Đo lường chi tiết mọi thao tác của khách hàng trên từng trang chi tiết biển số.
          </p>
        </div>

        {/* Thẻ chỉ số phân vân */}
        <div style={{
          padding: '6px 12px',
          borderRadius: 'var(--radius-pill)',
          background: indecision > 20 ? 'var(--status-warning-bg)' : 'var(--status-success-bg)',
          border: `1px solid ${indecision > 20 ? 'rgba(245,197,66,0.3)' : 'rgba(63,191,143,0.3)'}`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          font: 'var(--type-caption)',
        }}>
          <GitCompare size={14} color={indecision > 20 ? 'var(--status-warning-ink)' : 'var(--status-success-ink)'} />
          <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ phân vân:</span>
          <strong style={{ color: indecision > 20 ? 'var(--status-warning-ink)' : 'var(--status-success-ink)' }}>
            {indecision}% khách
          </strong>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={actions} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" name="Số lượt tương tác" radius={[4, 4, 0, 0]}>
            {actions.map((act) => (
              <Cell key={act.label} fill={act.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * 7. BIỂU ĐỒ QUY TRÌNH TIẾP NHẬN LEAD & TỶ LỆ CHỐT (LEAD PIPELINE & CONVERSION)
 */
export function LeadPipelineHealthCard({ leadHealth, intentData, onActionClick }) {
  const items = intentData?.items || [];
  const INTENT_LABEL = { inquiry: 'Hỏi chung', deposit_request: 'Đặt cọc', buy: 'Mua đứt', hunting: 'Săn hộ' };

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
      padding: 'var(--gutter-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      flex: '1 1 450px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Users size={20} color="var(--action-primary)" />
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              Tiếp nhận Lead & Mục đích liên hệ
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Theo dõi khối lượng yêu cầu tư vấn theo từng mục đích và sức khỏe phản hồi của đội ngũ.
          </p>
        </div>

        {leadHealth && (
          <button
            type="button"
            onClick={() => onActionClick && onActionClick('/admin/ban-hang?status=new')}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--action-primary)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-semibold)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Xử lý lead</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
        {/* Piechart mục đích */}
        <div style={{ flex: '1 1 200px', minWidth: 0, height: 210 }}>
          {items.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={items}
                  dataKey="count"
                  nameKey="intent"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  label={({ intent, count }) => `${INTENT_LABEL[intent] || intent}: ${count}`}
                >
                  {items.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartBlock>Chưa có yêu cầu liên hệ</EmptyChartBlock>
          )}
        </div>

        {/* 4 Thẻ chỉ số xử lý Lead */}
        {leadHealth && (
          <div style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: leadHealth.newLeadsWaiting > 0 ? 'var(--status-danger-bg)' : 'var(--surface-sunken)',
              border: `1px solid ${leadHealth.newLeadsWaiting > 0 ? 'rgba(229,72,77,0.3)' : 'var(--border-hairline)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              font: 'var(--type-caption)',
            }}>
              <span style={{ color: leadHealth.newLeadsWaiting > 0 ? 'var(--status-danger-ink)' : 'var(--text-strong)' }}>
                Chờ gọi tiếp nhận:
              </span>
              <strong style={{ color: leadHealth.newLeadsWaiting > 0 ? 'var(--status-danger-ink)' : 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                {leadHealth.newLeadsWaiting} khách
              </strong>
            </div>

            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              font: 'var(--type-caption)',
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Chưa phân công:</span>
              <strong style={{ color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                {leadHealth.unassignedLeads} khách
              </strong>
            </div>

            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: leadHealth.stagnantLeads > 0 ? 'var(--status-warning-bg)' : 'var(--surface-sunken)',
              border: `1px solid ${leadHealth.stagnantLeads > 0 ? 'rgba(245,197,66,0.3)' : 'var(--border-hairline)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              font: 'var(--type-caption)',
            }}>
              <span style={{ color: leadHealth.stagnantLeads > 0 ? 'var(--status-warning-ink)' : 'var(--text-muted)' }}>
                Đọng tư vấn &gt;48h:
              </span>
              <strong style={{ color: leadHealth.stagnantLeads > 0 ? 'var(--status-warning-ink)' : 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                {leadHealth.stagnantLeads} hồ sơ
              </strong>
            </div>

            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-success-bg)',
              border: '1px solid rgba(63,191,143,0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              font: 'var(--type-caption)',
            }}>
              <span style={{ color: 'var(--status-success-ink)' }}>Tỷ lệ chốt giao dịch:</span>
              <strong style={{ color: 'var(--status-success-ink)', fontVariantNumeric: 'tabular-nums' }}>
                {leadHealth.closingRatePct}%
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
