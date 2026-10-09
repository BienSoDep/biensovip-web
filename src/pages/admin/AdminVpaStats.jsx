import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Layers, Database, ShieldCheck, CheckCircle2,
  AlertTriangle, RefreshCw, ExternalLink, Lightbulb, ArrowUpRight, ArrowDownRight,
  Car, Bike, Activity, Award, BarChart3, Clock, DollarSign, ArrowRight
} from 'lucide-react';
import { Select, InfoTip, Badge } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import {
  useVpaStats, useVpaMarketAnalysis, useVpaOverview, useVpaAdminPlates
} from '../../services/adminVpa.js';
import { useVpaCounts } from '../../services/vpa.js';
import { useAdminCategories } from '../../services/categories.js';

const PALETTE = ['#3B5BFF', '#C75B00', '#F5C542', '#3FBF8F', '#E5484D', '#8A6100', '#6B7180', '#3A3E47'];
const STATE_NAMES = {
  None: 'Chưa có gợi ý',
  Suggested: 'Có gợi ý chờ duyệt',
  Approved: 'Đã duyệt giá',
  Rejected: 'Đã từ chối',
  Drifted: 'Đề xuất đổi giá'
};
const STATE_COLORS = {
  Approved: 'var(--status-success-ink, #2b8a3e)',
  Suggested: 'var(--action-primary, #3b5bff)',
  None: 'var(--text-muted, #868e96)',
  Drifted: 'var(--status-warning-ink, #d97706)',
  Rejected: 'var(--status-danger, #e03131)',
};

const TAB_NAMES = {
  1: 'Biển tháng (công bố)',
  2: 'Biển tuần (chính thức)',
  3: 'Biển hết hạn',
  4: 'Hết hạn nội bộ',
  Monthly: 'Biển tháng (công bố)',
  Weekly: 'Biển tuần (chính thức)',
  Expired: 'Biển hết hạn',
  ExpiredInternal: 'Hết hạn nội bộ'
};

const money = (v) => (v == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(v)}đ`);
const num = (v) => (v == null ? '0' : new Intl.NumberFormat('vi-VN').format(v));

const CARD = {
  background: 'var(--white)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-4)',
  boxShadow: 'var(--shadow-inset-hairline)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)'
};

const ALL_OPT = { value: '', label: 'Toàn thị trường' };
const catOpts = (list) => [ALL_OPT, ...(list || []).map((c) => ({ value: c.id, label: c.name }))];

function SectionTitle({ icon: Icon, children, tip, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
        {Icon && <Icon size={16} color="var(--action-primary)" />} {children} {tip && <InfoTip size={12} text={tip} />}
      </span>
      {action}
    </div>
  );
}

function StatCard({ label, value, sub, tone, icon: Icon }) {
  return (
    <div style={{
      flex: '1 1 180px',
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-3) var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
        {Icon && <Icon size={15} style={{ opacity: 0.4 }} />}
      </div>
      <span style={{ font: 'var(--type-h3)', fontWeight: 'var(--fw-bold)', color: tone || 'var(--text-strong)', lineHeight: 1.2 }}>
        {value}
      </span>
      {sub && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}

export default function AdminVpaStats({ go, patch, st }) {
  const [vehicle, setVehicle] = useState(''); // '' | 'Car' | 'MotorBike'
  const [provinceId, setProvinceId] = useState('');
  const [plateTypeId, setPlateTypeId] = useState('');

  const { data: provData } = useAdminCategories('province');
  const { data: typeData } = useAdminCategories('plate_type');

  // Queries
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useVpaStats(true);
  const { data: counts, isLoading: loadingCounts, refetch: refetchCounts } = useVpaCounts(vehicle);
  const { data: market, isLoading: loadingMarket, refetch: refetchMarket } = useVpaMarketAnalysis({
    provinceId: provinceId || undefined,
    plateTypeId: plateTypeId || undefined
  });
  const { data: overview, refetch: refetchOverview } = useVpaOverview({ enabled: true });

  const isSuperAdmin = st?.user?.role === 'super-admin';

  const refreshAll = () => {
    refetchStats();
    refetchCounts();
    refetchMarket();
    refetchOverview();
  };

  // State Breakdown Items
  const priceStateItems = useMemo(() => {
    if (!stats?.byPriceState) return [];
    return Object.entries(stats.byPriceState).map(([k, count]) => ({
      key: k,
      label: STATE_NAMES[k] || k,
      count,
      color: STATE_COLORS[k] || PALETTE[0],
    }));
  }, [stats?.byPriceState]);

  const totalPlatesInStats = stats?.totalCount || counts?.all || 0;
  const approvedPlates = stats?.approvedCount || stats?.byPriceState?.Approved || 0;
  const approvalRate = totalPlatesInStats > 0 ? Math.round((approvedPlates / totalPlatesInStats) * 100) : 0;

  // Trend Chart Data
  const trendChartData = useMemo(() => {
    if (!market?.priceTrend) {
      if (!stats?.priceTrend) return [];
      return stats.priceTrend.map((p) => ({
        ...p,
        label: new Date(p.weekStart).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      }));
    }
    const base = market.priceTrend.map((p) => ({
      ...p,
      label: new Date(p.weekStart).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    }));
    if (market.forecast) {
      base.push({
        label: new Date(market.forecast.forecastWeekStart).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' (Dự báo)',
        avgPrice: null,
        movingAvg4w: null,
        forecastPrice: market.forecast.forecastPrice,
      });
    }
    return base;
  }, [market?.priceTrend, market?.forecast, stats?.priceTrend]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Top Header & Filter Controls */}
      <div style={{ ...CARD, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{
              display: 'inline-flex',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--action-primary-subtle, rgba(59,91,255,0.08))',
              color: 'var(--action-primary)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-bold)'
            }}>
              VPA Analytics Engine
            </span>
          </div>
          <h1 style={{ margin: '6px 0 2px', font: 'var(--type-h3)', color: 'var(--text-strong)' }}>
            Thống kê &amp; Phân tích Biển số VPA
          </h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Báo cáo toàn diện kho biển VPA, tiến độ duyệt giá, cơ cấu chủng loại, xu hướng đấu giá thị trường và giám sát crawler.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Select
            label="Loại xe"
            value={vehicle}
            options={[
              { value: '', label: 'Tất cả loại xe' },
              { value: 'Car', label: 'Ô tô' },
              { value: 'MotorBike', label: 'Xe máy' },
            ]}
            onChange={setVehicle}
          />
          <Select
            label="Tỉnh/thành"
            value={provinceId}
            options={catOpts(provData?.items)}
            onChange={setProvinceId}
          />
          <Select
            label="Loại biển"
            value={plateTypeId}
            options={catOpts(typeData?.items)}
            onChange={setPlateTypeId}
          />
          <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
            <Button variant="secondary" size="md" onClick={refreshAll} title="Làm mới dữ liệu">
              <RefreshCw size={14} /> Làm mới
            </Button>
            <Button variant="primary" size="md" onClick={go ? go('avpa') : () => patch?.({ screen: 'avpa' })}>
              Quản lý kho VPA <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Tổng quan Kho biển & Vòng đời */}
      <div style={CARD}>
        <SectionTitle icon={Database} tip="Thống kê tổng số lượng biển VPA chia theo từng tab vòng đời đấu giá.">
          1. Tổng quan Kho biển &amp; Vòng đời đấu giá
        </SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <StatCard
            label="Tổng kho biển VPA"
            value={num(counts?.all ?? totalPlatesInStats)}
            sub="Toàn bộ biển đã thu thập"
            icon={Layers}
            tone="var(--text-strong)"
          />
          <StatCard
            label="Biển chính thức (Tuần)"
            value={num(counts?.weekly)}
            sub="Đang & sắp mở đấu giá"
            icon={Clock}
            tone="var(--action-primary)"
          />
          <StatCard
            label="Biển công bố (Tháng)"
            value={num(counts?.monthly)}
            sub="Kho chuẩn bị đấu giá"
            icon={Database}
            tone="var(--status-warning-ink)"
          />
          <StatCard
            label="Biển đã hết hạn"
            value={num(counts?.expired)}
            sub="Phiên đấu giá đã kết thúc"
            icon={Activity}
            tone="var(--text-muted)"
          />
          <StatCard
            label="Tỷ lệ duyệt giá"
            value={`${approvalRate}%`}
            sub={`${num(approvedPlates)}/${num(totalPlatesInStats)} biển`}
            icon={CheckCircle2}
            tone={approvalRate >= 80 ? 'var(--status-success-ink)' : 'var(--status-warning-ink)'}
          />
        </div>
      </div>

      {/* 2. Quản trị Giá & Tiến độ Duyệt giá */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        {/* Biểu đồ tròn trạng thái giá */}
        <div style={{ ...CARD, flex: '1 1 380px' }}>
          <SectionTitle icon={CheckCircle2} tip="Số lượng và tỷ trọng biển ở mỗi trạng thái duyệt giá nội bộ.">
            Cơ cấu Trạng thái Duyệt giá
          </SectionTitle>
          {loadingStats || !stats ? (
            <Skeleton variant="card" height={260} />
          ) : priceStateItems.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={priceStateItems}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {priceStateItems.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [
                      `${num(val)} biển (${totalPlatesInStats > 0 ? Math.round((val / totalPlatesInStats) * 100) : 0}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {priceStateItems.map((item) => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}:</span>
                    <b style={{ color: 'var(--text-strong)' }}>{num(item.count)}</b>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Biểu đồ phân khúc khoảng giá */}
        <div style={{ ...CARD, flex: '1 1 420px' }}>
          <SectionTitle icon={DollarSign} tip="Phân bổ số lượng biển theo từng khoảng giá khởi điểm hoặc giá duyệt.">
            Phân khúc Giá niêm yết &amp; Khởi điểm
          </SectionTitle>
          {loadingStats || !stats?.byPriceRange ? (
            <Skeleton variant="card" height={260} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.byPriceRange} margin={{ top: 15, right: 15, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-100)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(val) => [`${num(val)} biển`, 'Số lượng']} />
                <Bar dataKey="count" name="Số biển" fill="var(--action-primary, #3B5BFF)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Cơ cấu Kho biển Đa chiều */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        {/* Top Tỉnh/Thành */}
        <div style={{ ...CARD, flex: '1 1 420px' }}>
          <SectionTitle icon={BarChart3} tip="Top các tỉnh/thành tập trung nhiều biển VPA nhất.">
            Top Tỉnh/Thành có nhiều biển VPA nhất
          </SectionTitle>
          {loadingStats || !stats?.byProvince?.length ? (
            <Skeleton variant="card" height={260} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.byProvince} margin={{ top: 10, right: 10, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-100)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(val) => [`${num(val)} biển`, 'Số biển VPA']} />
                <Bar dataKey="count" name="Số biển" fill="#C75B00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Loại biển */}
        <div style={{ ...CARD, flex: '1 1 420px' }}>
          <SectionTitle icon={Award} tip="Cơ cấu các loại biển đẹp chiếm tỷ trọng cao trong kho VPA.">
            Top Loại Biển số đẹp
          </SectionTitle>
          {loadingStats || !stats?.byPlateType?.length ? (
            <Skeleton variant="card" height={260} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.byPlateType} margin={{ top: 10, right: 10, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-100)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(val) => [`${num(val)} biển`, 'Số biển']} />
                <Bar dataKey="count" name="Số biển" fill="#3FBF8F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Xu hướng Thị trường Đấu giá & Dự báo */}
      {market && (
        <div style={CARD}>
          <SectionTitle icon={TrendingUp} tip="Phân tích trên giá trúng đấu giá thật từ VPA (vpa_auction_results).">
            4. Xu hướng Thị trường &amp; Dự báo Giá trúng Đấu giá
          </SectionTitle>

          {/* So kỳ 7 ngày */}
          {market.periodCompare && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              background: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-md)'
            }}>
              <StatCard
                label="7 ngày qua — Số phiên trúng"
                value={num(market.periodCompare.currentCount)}
                sub="Phiên đấu giá thành công"
              />
              <StatCard
                label="7 ngày qua — Giá trúng TB"
                value={money(market.periodCompare.currentAvgPrice)}
                sub="Thực tế thị trường"
              />
              <StatCard
                label="7 ngày trước — Giá trúng TB"
                value={money(market.periodCompare.previousAvgPrice)}
                sub="Kỳ so sánh liền trước"
              />
              <StatCard
                label="Biến động giá"
                value={market.periodCompare.priceChangePercent == null ? '—' : `${market.periodCompare.priceChangePercent >= 0 ? '+' : ''}${market.periodCompare.priceChangePercent}%`}
                sub="So với kỳ trước"
                tone={(market.periodCompare.priceChangePercent ?? 0) >= 0 ? 'var(--status-success-ink)' : 'var(--status-danger)'}
                icon={(market.periodCompare.priceChangePercent ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight}
              />
            </div>
          )}

          {/* Biểu đồ xu hướng và trung bình động */}
          <div style={{ marginTop: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', marginBottom: 8, display: 'block' }}>
              Diễn biến giá trúng trung bình 12 tuần &amp; MA 4 tuần
            </span>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendChartData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-100)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
                <Tooltip formatter={(val, name) => [money(val), name === 'avgPrice' ? 'Giá trúng TB' : name === 'movingAvg4w' ? 'MA 4 tuần' : 'Dự báo']} />
                <Legend />
                <Line type="monotone" dataKey="avgPrice" name="Giá trúng TB" stroke="#3B5BFF" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="movingAvg4w" name="MA 4 tuần" stroke="#C75B00" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                {market.forecast && (
                  <Line type="monotone" dataKey="forecastPrice" name="Dự báo kỳ tới" stroke="#E5484D" strokeWidth={2} dot={{ r: 5, fill: '#E5484D' }} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Insights Khuyến nghị tự động */}
          {market.insights?.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 'var(--space-3)',
              background: 'rgba(59,91,255,0.04)',
              border: '1px solid var(--action-primary-subtle, rgba(59,91,255,0.15))',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)' }}>
                <Lightbulb size={14} /> Nhận định &amp; Khuyến nghị thị trường tự động:
              </span>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                {market.insights.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Biến động giá theo tỉnh & theo loại biển */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            <div style={{ flex: '1 1 350px' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'block', marginBottom: 8 }}>
                Top tỉnh biến động giá mạnh nhất
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(market.growthByProvince || []).slice(0, 5).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', font: 'var(--type-caption)' }}>
                    <span><b>{idx + 1}.</b> {item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{money(item.lateAvgPrice)}</span>
                      <b style={{ color: item.changePercent >= 0 ? 'var(--status-success-ink)' : 'var(--status-danger)' }}>
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent}%
                      </b>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: '1 1 350px' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'block', marginBottom: 8 }}>
                Top loại biển biến động giá mạnh nhất
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(market.growthByPlateType || []).slice(0, 5).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', font: 'var(--type-caption)' }}>
                    <span><b>{idx + 1}.</b> {item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{money(item.lateAvgPrice)}</span>
                      <b style={{ color: item.changePercent >= 0 ? 'var(--status-success-ink)' : 'var(--status-danger)' }}>
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent}%
                      </b>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. So sánh Đối chiếu Giá Shop vs Giá trúng VPA */}
      {market?.shopCompare?.length > 0 && (
        <div style={CARD}>
          <SectionTitle icon={DollarSign} tip="Đối chiếu giá trúng đấu giá thật VPA với giá niêm yết của kho biển shop cùng loại.">
            5. Đối chiếu Giá Niêm yết Shop vs Giá Trúng VPA
          </SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-body-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--surface-sunken)', textAlign: 'left', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 12px' }}>Tỉnh/thành</th>
                  <th style={{ padding: '8px 12px' }}>Loại biển</th>
                  <th style={{ padding: '8px 12px' }}>Giá trúng VPA TB</th>
                  <th style={{ padding: '8px 12px' }}>Mẫu VPA</th>
                  <th style={{ padding: '8px 12px' }}>Giá niêm yết Shop</th>
                  <th style={{ padding: '8px 12px' }}>Mẫu Shop</th>
                </tr>
              </thead>
              <tbody>
                {market.shopCompare.slice(0, 10).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-hairline, var(--grey-100))' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 'var(--fw-medium)' }}>{row.provinceName}</td>
                    <td style={{ padding: '10px 12px' }}>{row.plateTypeName}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>{money(row.vpaAvgPrice)}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{row.vpaSampleCount} mẫu</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-strong)', fontWeight: 'var(--fw-semibold)' }}>{money(row.shopAvgPrice)}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{row.shopSampleCount} biển</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Giám sát Thu thập Dữ liệu (Crawler Monitoring) */}
      {overview && (
        <div style={CARD}>
          <SectionTitle icon={ShieldCheck} tip="Trạng thái các luồng crawler tự động thu thập từ VPA.">
            6. Giám sát Thu thập Dữ liệu (Crawler &amp; Data Health)
          </SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            {(overview.sources || []).map((src) => (
              <div key={src.source} style={{
                flex: '1 1 240px',
                padding: 'var(--space-3)',
                background: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <b style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                    {src.source === 'Official' ? 'Biển Tuần (Chính thức)' : src.source === 'Announcement' ? 'Biển Tháng (Công bố)' : 'Kết quả đấu giá'}
                  </b>
                  <Badge tone={src.running ? 'blue' : src.stale ? 'amber' : 'mint'}>
                    {src.running ? 'Đang chạy' : src.stale ? 'Chờ cập nhật' : 'Ổn định'}
                  </Badge>
                </div>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Chu kỳ: {src.intervalMinutes} phút / lần
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Chạy gần nhất: {src.lastCompleteAt ? new Date(src.lastCompleteAt).toLocaleTimeString('vi-VN') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
