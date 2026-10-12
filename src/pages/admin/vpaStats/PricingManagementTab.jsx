import { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
  CheckCircle2, RefreshCw, Clock, ArrowRight,
  TrendingUp, Activity, DollarSign, Sparkles, AlertCircle, CheckCheck
} from 'lucide-react';
import Button from '../../../components/Button.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import { useVpaStats } from '../../../services/adminVpa.js';
import { useVpaCounts } from '../../../services/vpa.js';
import {
  CARD, num, PALETTE, SectionTitle, StatCard, STATE_COLORS, STATE_NAMES
} from './vpaStatsShared.jsx';

export default function PricingManagementTab({ go, patch }) {
  const { data: stats, isLoading: loadingStats, refetch } = useVpaStats(true);
  const { data: counts } = useVpaCounts('');

  const totalPlatesInStats = stats?.totalCount || counts?.all || 0;
  const approvedPlates = stats?.approvedCount || stats?.byPriceState?.Approved || 0;

  // Breakdown trạng thái duyệt
  const priceStateItems = useMemo(() => {
    if (!stats?.byPriceState) return [];
    return Object.entries(stats.byPriceState).map(([k, count]) => ({
      key: k,
      label: STATE_NAMES[k] || k,
      count,
      color: STATE_COLORS[k] || PALETTE[0],
    }));
  }, [stats?.byPriceState]);

  const pendingApproval = (stats?.byPriceState?.Suggested || 0) + (stats?.byPriceState?.Drifted || 0);

  // Xu hướng giá trúng 12 tuần
  const trendData = useMemo(() => {
    if (!stats?.priceTrend || !Array.isArray(stats.priceTrend)) return [];
    return stats.priceTrend.map((pt) => {
      const d = new Date(pt.weekStart);
      return {
        ...pt,
        weekLabel: `${d.getDate()}/${d.getMonth() + 1}`,
        avgPriceMil: Math.round(pt.avgPrice / 1_000_000),
      };
    });
  }, [stats?.priceTrend]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* KPI Cards Trạng thái Duyệt */}
      <div style={CARD}>
        <SectionTitle
          icon={CheckCircle2}
          tip="Số lượng biển VPA phân chia theo từng trạng thái thẩm định và phê duyệt giá."
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw size={13} /> Làm mới
            </Button>
          }
        >
          1. Tiến độ Thẩm định &amp; Phê duyệt Giá
        </SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <StatCard
            label="Đã duyệt giá niêm yết"
            value={num(stats?.byPriceState?.Approved || approvedPlates)}
            sub="Sẵn sàng hiển thị công khai"
            icon={CheckCheck}
            tone="var(--status-success-ink)"
          />
          <StatCard
            label="Chờ duyệt giá (Suggested)"
            value={num(stats?.byPriceState?.Suggested)}
            sub="Có thuật toán định giá sẵn"
            icon={Clock}
            tone="var(--action-primary)"
          />
          <StatCard
            label="Đề xuất đổi giá (Drifted)"
            value={num(stats?.byPriceState?.Drifted)}
            sub="Biến động thị trường yêu cầu đổi"
            icon={TrendingUp}
            tone="var(--status-warning-ink)"
          />
          <StatCard
            label="Chưa có gợi ý giá (None)"
            value={num(stats?.byPriceState?.None)}
            sub="Cần tính toán lại mô hình"
            icon={Activity}
            tone="var(--text-muted)"
          />
          <StatCard
            label="Đã từ chối duyệt (Rejected)"
            value={num(stats?.byPriceState?.Rejected)}
            sub="Không hiển thị ra ngoài web"
            icon={AlertCircle}
            tone="var(--status-danger)"
          />
        </div>

        {/* Action Callout nếu có biển chờ duyệt */}
        {pendingApproval > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(59,91,255,0.06)',
            border: '1px solid rgba(59,91,255,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={20} color="var(--action-primary)" />
              <div>
                <b style={{ color: 'var(--text-strong)' }}>
                  Có {num(pendingApproval)} biển số đang chờ quản trị viên phê duyệt hoặc đổi giá
                </b>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Bao gồm {num(stats?.byPriceState?.Suggested || 0)} biển chờ duyệt mới và {num(stats?.byPriceState?.Drifted || 0)} biển thị trường biến động.
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={go ? go('avpa') : () => patch?.({ screen: 'avpa' })}
            >
              Chuyển tới duyệt ngay <ArrowRight size={14} />
            </Button>
          </div>
        )}
      </div>

      {/* 2 Khối biểu đồ: Donut Trạng thái + Bar Phân khúc */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        {/* Donut Chart */}
        <div style={{ ...CARD, flex: '1 1 380px' }}>
          <SectionTitle icon={CheckCircle2} tip="Cơ cấu tỷ trọng % của các trạng thái duyệt giá.">
            Cơ cấu Tỷ trọng Trạng thái Duyệt giá
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
                    innerRadius={55}
                    outerRadius={88}
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

        {/* Phân khúc giá */}
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

      {/* 3. Xu hướng Giá trúng Đấu giá 12 tuần (Price Trend) */}
      <div style={CARD}>
        <SectionTitle
          icon={TrendingUp}
          tip="Giá trúng đấu giá thực tế thu thập từ bảng kết quả đấu giá VPA qua 12 tuần gần nhất (Đơn vị: Triệu VNĐ)."
        >
          2. Xu hướng Giá trúng Đấu giá Thực tế (12 tuần gần nhất)
        </SectionTitle>
        {loadingStats ? (
          <Skeleton variant="card" height={260} />
        ) : trendData.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có đủ dữ liệu kết quả đấu giá 12 tuần để vẽ biểu đồ xu hướng.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData} margin={{ top: 15, right: 20, left: 10, bottom: 15 }}>
                <defs>
                  <linearGradient id="priceTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--action-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--action-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-100)" vertical={false} />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  unit="tr"
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'avgPriceMil' ? `${num(val)} triệu đồng` : `${num(val)} lượt`,
                    name === 'avgPriceMil' ? 'Giá trúng bình quân' : 'Số mẫu đấu giá'
                  ]}
                  labelFormatter={(lbl) => `Tuần bắt đầu: ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="avgPriceMil"
                  name="Giá trúng bình quân"
                  stroke="var(--action-primary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#priceTrendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              <span>Dữ liệu trích xuất từ các phiên đấu giá đã kết thúc thành công.</span>
              <span>Tổng số tuần ghi nhận: <b>{trendData.length} tuần</b></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
