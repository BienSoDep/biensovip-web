import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@mantine/hooks';
import { startOfMonth, subDays, startOfDay, format, parseISO } from 'date-fns';
import {
  CreditCard, FileText, Users, BadgeCheck, ArrowRight, Activity,
  Layers, BarChart2, Server, Globe, Sparkles, Filter, PieChart as PieIcon, TrendingUp
} from 'lucide-react';
import { routeFor } from '../../config/routes.js';
import { InfoTip } from '../../components/index.jsx';
import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import DashboardPanel from './dashboard/DashboardPanel.jsx';
import GentelellaTileStats from './dashboard/GentelellaTileStats.jsx';
import NetworkActivityWidget from './dashboard/NetworkActivityWidget.jsx';
import {
  useDashboardSummary, useActionsChart, useTrafficSources, useFunnel, usePlateDistribution,
  useTopInterested, usePlateConversion, useConvertedOrders, useTopContent, useRatings, useIntent,
  useCollaboratorPerf, useDemand, useCustomerDemographics, useSearchInsights, useCompareInsights, useTrafficHeatmap,
} from '../../services/adminDashboard.js';
import { useBusinessInsights } from '../../services/analytics.js';
import GoogleAnalyticsPanel from './GoogleAnalyticsPanel.jsx';
import { useExportReport } from '../../hooks/useExportCsv.js';
import {
  ExecutiveSummaryBanner,
  MultiDimensionPlateDistributionMatrix,
  SupplyDemandComparisonChart,
  PriceSegmentsSweetSpotChart,
  MicroEngagementsChart,
  LeadPipelineHealthCard,
} from './dashboard/DashboardAdvancedCharts.jsx';
import SystemHealthWidget from './dashboard/SystemHealthWidget.jsx';
import SkeletonBase from '../../components/skeletons/SkeletonBase.jsx';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  PIE_COLORS, TrafficSourcesPie, TopPlatesTable,
  FunnelView, EmptyBlock, ErrorBlock
} from './dashboard/DashboardWidgets.jsx';

const KPI_CARDS = [
  { key: 'totalViews', label: 'Tổng lượt xem', info: 'Tổng số lượt khách truy cập xem chi tiết các biển số trong kỳ đã chọn.', icon: FileText, series: 'views', color: '#6B7180', access: (k) => k?.totalViews?.value, delta: (k) => k?.totalViews?.changePercent },
  { key: 'contactRequests', label: 'Yêu cầu liên hệ', info: 'Số lượt khách gửi yêu cầu gọi lại, tư vấn mua biển hoặc bấm nút chat Zalo/Hotline.', icon: Users, series: 'contacts', color: '#C75B00', access: (k) => k?.contactRequests?.value, delta: (k) => k?.contactRequests?.changePercent },
  { key: 'closedContacts', label: 'Đã chốt', info: 'Số lượng giao dịch tư vấn thành công đã được nhân viên chuyển sang trạng thái chốt.', icon: BadgeCheck, series: 'closed', color: '#3FBF8F', access: (k) => k?.closedContacts?.value, delta: (k) => k?.closedContacts?.changePercent },
  { key: 'soldPlates', label: 'Đã bán', info: 'Tổng số lượng biển số trong kho đã bán thành công trong khoảng thời gian đã chọn.', icon: CreditCard, series: 'sold', color: '#E5484D', access: (k) => k?.soldPlates },
];

const INTENT_LABEL = { inquiry: 'Hỏi chung', deposit_request: 'Đặt cọc', buy: 'Mua đứt', hunting: 'Săn hộ' };
const ORDER_STATUS_LABEL = { new: 'Mới', consulting: 'Tư vấn', closed: 'Chốt' };
const WEEKDAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const PRESETS = [
  { label: '7 ngày', from: () => startOfDay(subDays(new Date(), 7)) },
  { label: '30 ngày', from: () => startOfDay(subDays(new Date(), 30)) },
  { label: 'Tháng này', from: () => startOfMonth(new Date()) },
];

function fmtPct(n) {
  if (n == null) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}%`;
}

export default function Dashboard({ go, st, patch }) {
  const isSuperAdmin = st?.user?.role === 'super-admin';
  const [rangeIdx, setRangeIdx] = useState(1); // default 30 days
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') || 'overview';
    }
    return 'overview';
  });

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const [debouncedFrom] = useDebouncedValue(customFrom, 400);
  const [debouncedTo] = useDebouncedValue(customTo, 400);

  const range = useMemo(() => {
    if (rangeIdx === null && debouncedFrom && debouncedTo) {
      return { from: startOfDay(parseISO(debouncedFrom)), to: new Date(debouncedTo) };
    }
    const p = PRESETS[rangeIdx ?? 1];
    return { from: p.from(), to: new Date() };
  }, [rangeIdx, debouncedFrom, debouncedTo]);

  const granularity = useMemo(() => {
    const days = Math.max(1, Math.round((range.to - range.from) / 86400000));
    return days <= 14 ? 'day' : days <= 90 ? 'week' : 'month';
  }, [range]);

  const [compareFunnel, setCompareFunnel] = useState(false);
  const prevRange = useMemo(() => {
    const spanMs = range.to - range.from;
    return { from: new Date(range.from.getTime() - spanMs), to: new Date(range.from.getTime()) };
  }, [range]);

  // Queries API
  const summary = useDashboardSummary(range);
  const chart = useActionsChart({ ...range, granularity });
  const traffic = useTrafficSources(range);
  const funnel = useFunnel(range);
  const funnelPrev = useFunnel(prevRange, compareFunnel);
  const distProvince = usePlateDistribution('province');
  const distVehicle = usePlateDistribution('vehicle_type');
  const interested = useTopInterested({ ...range, limit: 8 });
  const conversion = usePlateConversion({ ...range, limit: 8 });
  const orders = useConvertedOrders({ ...range, limit: 8 });
  const topContent = useTopContent({ ...range, limit: 8 });
  const ratings = useRatings(range);
  const intent = useIntent(range);
  const collabPerf = useCollaboratorPerf({ ...range, limit: 5 }, isSuperAdmin);
  const demand = useDemand(range);
  const demographics = useCustomerDemographics();
  const searchInsights = useSearchInsights({ ...range, limit: 10 });
  const compareInsights = useCompareInsights({ ...range, limit: 10 });
  const heatmap = useTrafficHeatmap(range);
  const { exportReport, loading: exportingReport, exportModal: reportExportModal } = useExportReport('/api/admin/dashboard/export');

  const fromIso = useMemo(() => format(range.from, 'yyyy-MM-dd'), [range.from]);
  const toIso = useMemo(() => format(range.to, 'yyyy-MM-dd'), [range.to]);
  const businessInsights = useBusinessInsights(fromIso, toIso);
  const bData = businessInsights.data;

  const [distTab, setDistTab] = useState('plate_type');
  const [distChartType, setDistChartType] = useState('bar');
  const activeDistData = usePlateDistribution(distTab);

  const handleActionClick = (link, extraParams = {}) => {
    if (!link) return;
    let targetPath = link;
    let queryString = '';
    if (link.includes('?')) {
      const parts = link.split('?');
      targetPath = parts[0];
      queryString = parts[1];
    }
    const params = new URLSearchParams(queryString);

    if (targetPath.startsWith('/admin/')) {
      const part = targetPath.replace('/admin/', '');
      const screenMap = {
        'ban-hang': 'asales',
        'bien-so': 'aplates',
        'danh-muc': 'acats',
        'khach-hang': 'acustomers',
      };
      const targetScreen = screenMap[part] || 'dash';
      if (typeof window !== 'undefined') {
        const fullUrl = link.startsWith('/') ? link : '/' + link;
        try { window.history.pushState(null, '', fullUrl); } catch { /* ignore */ }
      }
      if (typeof go === 'function') {
        const goFn = go(targetScreen);
        if (typeof goFn === 'function') goFn();
      }
      return;
    }
    window.location.href = link;
  };

  const kpis = summary.data;

  const selectPreset = (i) => { setRangeIdx(i); setCustomFrom(''); setCustomTo(''); };
  const applyCustomRange = (from, to) => {
    if (!from || !to) { setCustomFrom(from); setCustomTo(to); return; }
    let f = from, t = to;
    if (f > t) [f, t] = [t, f];
    if ((new Date(t) - new Date(f)) / 86400000 > 365) {
      f = new Date(new Date(t).getTime() - 365 * 86400000).toISOString().slice(0, 10);
      toast('Khoảng thời gian tối đa 365 ngày — đã tự thu hẹp');
    }
    setCustomFrom(f);
    setCustomTo(t);
    setRangeIdx(null);
  };

  // Chuẩn bị dữ liệu cho Gentelella Tile Stats
  const tileCards = useMemo(() => {
    return KPI_CARDS.map((c) => {
      const val = c.access(kpis) || 0;
      const dNum = c.delta ? c.delta(kpis) : null;
      return {
        key: c.key,
        icon: c.icon,
        color: c.color,
        label: c.label,
        info: c.info,
        value: val,
        delta: fmtPct(dNum),
        deltaNumeric: dNum,
        spark: (chart.data?.points || []).map((p) => p[c.series] ?? 0),
      };
    });
  }, [kpis, chart.data]);

  // Thanh công cụ lọc ngày dùng chung
  const renderDateToolbar = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--white)', padding: '10px 14px', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Filter size={14} color="var(--text-muted)" />
        <span style={{ fontSize: '12px', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Kỳ báo cáo:</span>
      </div>
      {PRESETS.map((p, i) => (
        <button
          key={p.label}
          type="button"
          onClick={() => selectPreset(i)}
          style={{
            padding: '5px 14px',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            font: 'var(--type-caption)',
            fontWeight: 'var(--fw-semibold)',
            cursor: 'pointer',
            background: rangeIdx === i ? 'var(--action-primary, #C75B00)' : 'var(--grey-100)',
            color: rangeIdx === i ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 120ms ease',
          }}
        >
          {p.label}
        </button>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: rangeIdx === null ? 'rgba(199,91,0,0.1)' : 'transparent', border: rangeIdx === null ? '1px solid var(--action-primary)' : '1px solid var(--border-hairline)' }}>
        <input type="date" value={customFrom} max={customTo || format(new Date(), 'yyyy-MM-dd')}
          onChange={(e) => applyCustomRange(e.target.value, customTo)}
          style={{ font: 'var(--type-caption)', border: 'none', background: 'transparent', color: 'var(--text-body)' }} />
        <ArrowRight size={12} color="var(--text-faint)" />
        <input type="date" value={customTo} min={customFrom} max={format(new Date(), 'yyyy-MM-dd')}
          onChange={(e) => applyCustomRange(customFrom, e.target.value)}
          style={{ font: 'var(--type-caption)', border: 'none', background: 'transparent', color: 'var(--text-body)' }} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" disabled={exportingReport}
          onClick={() => exportReport('xlsx', { from: range.from.toISOString(), to: range.to.toISOString() }).catch(() => toast.error('Xuất báo cáo thất bại, vui lòng thử lại.'))}
          style={{ height: 30, padding: '0 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-hairline)', cursor: exportingReport ? 'default' : 'pointer', background: 'var(--white)', color: 'var(--text-body)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)' }}>
          {exportingReport ? 'Đang xuất…' : 'Xuất Excel'}
        </button>
        <button type="button" disabled={exportingReport}
          onClick={() => exportReport('pdf', { from: range.from.toISOString(), to: range.to.toISOString() }).catch(() => toast.error('Xuất báo cáo thất bại, vui lòng thử lại.'))}
          style={{ height: 30, padding: '0 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-hairline)', cursor: exportingReport ? 'default' : 'pointer', background: 'var(--white)', color: 'var(--text-body)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)' }}>
          {exportingReport ? 'Đang xuất…' : 'Xuất PDF'}
        </button>
      </div>
    </div>
  );

  // TAB 1: TỔNG QUAN KINH DOANH (Executive Overview)
  const renderOverviewTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {renderDateToolbar()}

      {/* Banner Tóm tắt điều hành kinh doanh */}
      <ExecutiveSummaryBanner summary={bData?.executiveSummary} leadHealth={bData?.leadHealth} isSuperAdmin={isSuperAdmin} />

      {/* Top Tile Stats phong cách Gentelella v4 */}
      {summary.isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map((i) => <SkeletonBase key={i} height={120} />)}
        </div>
      ) : (
        <GentelellaTileStats cards={tileCards} animate={!reduceMotion} />
      )}

      {/* Cụm biểu đồ hoạt động trung tâm (Tỷ lệ vàng 65% : 35%) */}
      <NetworkActivityWidget
        chartData={chart.data}
        trafficData={traffic.data}
        distData={activeDistData.data}
        granularity={granularity}
        reduceMotion={reduceMotion}
      />

      {/* Grid 2 cột: Phễu chuyển đổi + Nguồn truy cập */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--gutter-section, 20px)' }}>
        <DashboardPanel
          title="Phễu chuyển đổi khách hàng"
          icon={Activity}
          info="Phễu chuyển đổi: bao nhiêu khách Xem biển → Lưu yêu thích → Liên hệ → Chốt giao dịch. Giúp phát hiện điểm rơi của khách hàng."
          actions={
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={compareFunnel} onChange={(e) => setCompareFunnel(e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--action-primary)' }} />
              <span>So sánh kỳ trước</span>
            </label>
          }
        >
          {funnel.isLoading ? (
            <SkeletonBase height={230} />
          ) : funnel.data ? (
            compareFunnel ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <span style={{ display: 'block', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', marginBottom: 6 }}>Kỳ này</span>
                  <FunnelView data={funnel.data} />
                </div>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <span style={{ display: 'block', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)', marginBottom: 6 }}>Kỳ trước</span>
                  {funnelPrev.isLoading ? <SkeletonBase height={180} /> : funnelPrev.data ? <FunnelView data={funnelPrev.data} /> : <EmptyBlock>Không có dữ liệu</EmptyBlock>}
                </div>
              </div>
            ) : (
              <FunnelView data={funnel.data} />
            )
          ) : (
            <EmptyBlock>Chưa có dữ liệu funnel</EmptyBlock>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Phân bổ nguồn truy cập"
          icon={Globe}
          info="Tỷ lệ phân bổ khách hàng đến từ các kênh: Tìm kiếm tự nhiên Google (Organic), Mạng xã hội, Zalo, hoặc truy cập trực tiếp."
        >
          {traffic.isLoading ? (
            <SkeletonBase height={230} />
          ) : traffic.data?.items?.length > 0 ? (
            <TrafficSourcesPie items={traffic.data.items} animate={!reduceMotion} />
          ) : (
            <EmptyBlock>Chưa có dữ liệu nguồn truy cập</EmptyBlock>
          )}
        </DashboardPanel>
      </div>

      {/* Grid 2 cột: Biển số được quan tâm nhất + Sức khỏe luồng tư vấn */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--gutter-section, 20px)' }}>
        <DashboardPanel
          title="Biển số được quan tâm nhất"
          icon={Sparkles}
          badge="Top lượt xem"
          badgeTone="brand"
          info="Bảng xếp hạng các biển số có lượt xem, lưu vào danh sách yêu thích và liên hệ hỏi mua nhiều nhất trong kỳ."
        >
          {interested.isLoading ? (
            <SkeletonBase height={220} />
          ) : interested.data?.items?.length > 0 ? (
            <TopPlatesTable items={interested.data.items} />
          ) : (
            <EmptyBlock>Chưa có dữ liệu</EmptyBlock>
          )}
        </DashboardPanel>

        <LeadPipelineHealthCard leadHealth={bData?.leadHealth} intentData={intent.data} onActionClick={handleActionClick} />
      </div>

      {/* Bảng: Tỉ lệ chuyển đổi & Xu hướng */}
      <DashboardPanel
        title="Tỉ lệ chuyển đổi & Xu hướng quan tâm theo biển"
        icon={TrendingUp}
        info="Theo dõi chuyển đổi từ lượt xem sang yêu cầu gọi lại và chốt giao dịch của từng mã biển số."
      >
        {conversion.isLoading ? (
          <SkeletonBase height={200} />
        ) : conversion.data?.items?.length > 0 ? (
          <div className="admin-simple-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', font: 'var(--type-caption)' }}>
              <thead>
                <tr style={{ color: 'var(--text-faint)', textAlign: 'left', borderBottom: '1px solid var(--border-hairline)' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 'var(--fw-semibold)' }}>Biển số</th>
                  <th style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>Xem</th>
                  <th style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>Lưu</th>
                  <th style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>Liên hệ</th>
                  <th style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>Chốt</th>
                  <th style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>Tỷ lệ đổi</th>
                  <th style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>Xu hướng</th>
                </tr>
              </thead>
              <tbody>
                {conversion.data.items.map((p) => (
                  <tr key={p.plateId} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{p.plateNumber}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{p.views}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{p.favorites}</td>
                    <td style={{ padding: '8px', color: p.contacts > 0 ? 'var(--status-success)' : 'var(--text-muted)', fontWeight: p.contacts > 0 ? 600 : 400 }}>{p.contacts}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{p.closed}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{p.contactRate}%</td>
                    <td style={{ padding: '8px', fontWeight: 'var(--fw-bold)', color: p.trending > 0 ? 'var(--status-success)' : p.trending < 0 ? 'var(--status-danger)' : 'var(--text-faint)' }}>
                      {p.trending > 0 ? `+${p.trending}%` : `${p.trending}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBlock>Chưa có dữ liệu chuyển đổi</EmptyBlock>
        )}
      </DashboardPanel>

      {/* Bảng: Đơn chuyển đổi gần đây */}
      <DashboardPanel
        title="Giao dịch chuyển đổi gần đây"
        icon={BadgeCheck}
        badge="Khách đặt cọc / Chốt"
        badgeTone="success"
      >
        {orders.isLoading ? (
          <SkeletonBase height={200} />
        ) : orders.data?.items?.length > 0 ? (
          <div className="admin-simple-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', font: 'var(--type-caption)' }}>
              <thead>
                <tr style={{ color: 'var(--text-faint)', textAlign: 'left', borderBottom: '1px solid var(--border-hairline)' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 'var(--fw-semibold)' }}>Biển số</th>
                  <th style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>Khách hàng</th>
                  <th style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>Mục đích</th>
                  <th style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>Trạng thái</th>
                  <th style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>Ngày yêu cầu</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.items.map((o) => (
                  <tr key={o.contactId} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>{o.plateNumber || '—'}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{o.fullName}</div>
                      <div style={{ color: 'var(--text-faint)', fontSize: '11px' }}>{o.phone}</div>
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-body)' }}>{INTENT_LABEL[o.intent] || o.intent}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: '11px', fontWeight: 600, background: o.status === 'closed' ? 'rgba(63,191,143,0.15)' : 'rgba(199,91,0,0.12)', color: o.status === 'closed' ? 'var(--status-success)' : 'var(--action-primary)' }}>
                        {ORDER_STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-faint)' }}>{format(new Date(o.createdAt), 'dd/MM/yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBlock>Chưa có đơn chuyển đổi</EmptyBlock>
        )}
      </DashboardPanel>
    </div>
  );

  // TAB 2: CUNG - CẦU & KHO BIỂN (Supply & Demand)
  const renderSupplyDemandTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {renderDateToolbar()}

      {/* Phân bổ kho biển đa chiều */}
      <MultiDimensionPlateDistributionMatrix
        distTab={distTab}
        onTabChange={setDistTab}
        distData={activeDistData}
        chartType={distChartType}
        onChartTypeChange={setDistChartType}
        ratingsData={ratings}
        onActionClick={handleActionClick}
      />

      {/* Cân bằng Cung - Cầu */}
      <SupplyDemandComparisonChart
        categorySupplyDemand={bData?.categorySupplyDemand || []}
        onActionClick={handleActionClick}
      />

      {/* Điểm ngọt phân khúc giá + Tương tác vi mô */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--gutter-section, 20px)' }}>
        <PriceSegmentsSweetSpotChart
          priceSegments={bData?.priceSegments || []}
          onActionClick={handleActionClick}
        />
        <MicroEngagementsChart
          plateEngagement={bData?.plateEngagement}
        />
      </div>
    </div>
  );

  // TAB 3: KHÁCH HÀNG & THỊ TRƯỜNG (Audience & Market)
  const renderAudienceTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {renderDateToolbar()}

      {/* 3 Panel nhân khẩu học khách hàng */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--gutter-section, 20px)' }}>
        <DashboardPanel
          title="Khách hàng theo ngũ hành"
          icon={PieIcon}
          info="Phân loại khách theo bản mệnh Kim/Mộc/Thủy/Hỏa/Thổ suy từ ngày sinh — giúp chủ sàn tối ưu chiến lược nhập biển số hợp phong thủy."
        >
          {demographics.isLoading ? (
            <SkeletonBase height={230} />
          ) : demographics.data?.byElement?.length > 0 ? (
            <>
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={demographics.data.byElement} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={75} label={({ label, count }) => `${label}: ${count}`}>
                      {demographics.data.byElement.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {demographics.data && (
                <p style={{ margin: '8px 0 0', font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'center' }}>
                  {demographics.data.totalUsersWithBirthDate}/{demographics.data.totalUsers} khách hàng đã điền ngày sinh
                </p>
              )}
            </>
          ) : (
            <EmptyBlock>Chưa có dữ liệu ngày sinh khách hàng</EmptyBlock>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Khách hàng theo độ tuổi"
          icon={BarChart2}
        >
          {demographics.isLoading ? (
            <SkeletonBase height={230} />
          ) : demographics.data?.byAgeGroup?.length > 0 ? (
            <div style={{ height: 230 }}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={demographics.data.byAgeGroup} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline, #e5e7eb)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số khách" fill="#C75B00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock>Chưa có dữ liệu độ tuổi</EmptyBlock>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Khách hàng theo giới tính"
          icon={Users}
        >
          {demographics.isLoading ? (
            <SkeletonBase height={230} />
          ) : demographics.data?.byGender?.length > 0 ? (
            <div style={{ height: 230 }}>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={demographics.data.byGender} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={75} label={({ label, count }) => `${label}: ${count}`}>
                    {demographics.data.byGender.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock>Chưa có dữ liệu giới tính</EmptyBlock>
          )}
        </DashboardPanel>
      </div>

      {/* Grid 2 cột: Từ khóa tìm kiếm + Cặp biển so sánh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--gutter-section, 20px)' }}>
        <DashboardPanel
          title="Từ khóa tìm kiếm nhiều nhất"
          icon={Sparkles}
          badge={searchInsights.data ? `${searchInsights.data.totalSearches} lượt tìm` : null}
        >
          {searchInsights.isLoading ? (
            <SkeletonBase height={200} />
          ) : searchInsights.data?.topKeywords?.length > 0 ? (
            searchInsights.data.topKeywords.map((k, i) => (
              <div key={k.keyword} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < searchInsights.data.topKeywords.length - 1 ? '1px solid var(--grey-100)' : 'none' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 20 }}>{i + 1}</span>
                <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{k.keyword}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>~{k.avgResultCount} kết quả</span>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)' }}>{k.count} lượt</span>
              </div>
            ))
          ) : (
            <EmptyBlock>Chưa có dữ liệu tìm kiếm</EmptyBlock>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Cặp biển được so sánh nhiều nhất"
          icon={Layers}
          badge={compareInsights.data ? `${compareInsights.data.totalCompareSessions} phiên so sánh` : null}
        >
          {compareInsights.isLoading ? (
            <SkeletonBase height={200} />
          ) : compareInsights.data?.topPairs?.length > 0 ? (
            compareInsights.data.topPairs.map((p, i) => (
              <div key={`${p.plateNumberA}-${p.plateNumberB}`} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < compareInsights.data.topPairs.length - 1 ? '1px solid var(--grey-100)' : 'none' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 20 }}>{i + 1}</span>
                <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{p.plateNumberA} ↔ {p.plateNumberB}</span>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)' }}>{p.count} lần</span>
              </div>
            ))
          ) : (
            <EmptyBlock>Chưa có lượt so sánh</EmptyBlock>
          )}
        </DashboardPanel>
      </div>

      {/* Grid 2 cột: Traffic Heatmap theo giờ & theo ngày trong tuần */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--gutter-section, 20px)' }}>
        <DashboardPanel
          title="Lưu lượng truy cập theo giờ trong ngày"
          icon={Activity}
        >
          {heatmap.isLoading ? (
            <SkeletonBase height={200} />
          ) : heatmap.data?.byHour?.some((h) => h.count > 0) ? (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={heatmap.data.byHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline, #e5e7eb)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(h) => `${h}h`} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip labelFormatter={(h) => `${h}h`} />
                  <Bar dataKey="count" name="Lượt xem" fill="#C75B00" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock>Chưa có dữ liệu traffic theo giờ</EmptyBlock>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Lưu lượng theo các ngày trong tuần"
          icon={Activity}
        >
          {heatmap.isLoading ? (
            <SkeletonBase height={200} />
          ) : heatmap.data?.byWeekday?.some((d) => d.count > 0) ? (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={heatmap.data.byWeekday.map((d) => ({ ...d, label: WEEKDAY_LABEL[d.weekday] }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline, #e5e7eb)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Lượt xem" fill="#C75B00" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock>Chưa có dữ liệu theo ngày trong tuần</EmptyBlock>
          )}
        </DashboardPanel>
      </div>

      {/* Grid 2 cột: Bài viết xem nhiều + Hiệu suất CTV / Nhu cầu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--gutter-section, 20px)' }}>
        <DashboardPanel
          title="Bài viết hướng dẫn & phong thủy xem nhiều"
          icon={FileText}
        >
          {topContent.isLoading ? (
            <SkeletonBase height={180} />
          ) : topContent.data?.items?.length > 0 ? (
            topContent.data.items.map((c, i) => {
              const postUrl = routeFor('post', c.slug || c.contentId);
              return (
                <div key={c.contentId} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < topContent.data.items.length - 1 ? '1px solid var(--grey-100)' : 'none' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 20 }}>{i + 1}</span>
                  <a href={postUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.title}
                  </a>
                  <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)' }}>{c.views} xem</span>
                </div>
              );
            })
          ) : (
            <EmptyBlock>Chưa có bài viết</EmptyBlock>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Nhu cầu săn biển & Bộ lọc người dùng"
          icon={Filter}
          badge={demand.data ? `${demand.data.total} bộ lọc bật` : null}
          info="Khách hàng tự thiết lập tiêu chí tìm kiếm và nhận thông báo khi có biển tương ứng xuất hiện."
        >
          {demand.isLoading ? (
            <SkeletonBase height={180} />
          ) : demand.data?.items?.length > 0 ? (
            demand.data.items.map((d, i) => (
              <div key={d.name} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < demand.data.items.length - 1 ? '1px solid var(--grey-100)' : 'none' }}>
                <span style={{ flex: 1, font: 'var(--type-body-sm)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name || '—'}</span>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)' }}>{d.count} người theo dõi</span>
              </div>
            ))
          ) : (
            <EmptyBlock>Chưa có bộ lọc đã lưu</EmptyBlock>
          )}
        </DashboardPanel>
      </div>
    </div>
  );

  // TAB 4: SỨC KHỎE HỆ THỐNG & KỸ THUẬT (System Health)
  const renderSystemTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {isSuperAdmin && <SystemHealthWidget />}
      <GoogleAnalyticsPanel />

      {/* Hiệu suất CTV nếu là SuperAdmin */}
      {isSuperAdmin && (
        <DashboardPanel
          title="Top cộng tác viên xuất sắc (Hoa hồng chi trả)"
          icon={Users}
          badge="SuperAdmin"
          badgeTone="brand"
        >
          {collabPerf.isLoading ? (
            <SkeletonBase height={220} />
          ) : collabPerf.data?.items?.length > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={collabPerf.data.items} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="fullName" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="paid" name="Đã trả" stackId="a" fill="#3FBF8F" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="pending" name="Chờ trả" stackId="a" fill="#8A6100" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock>Chưa có dữ liệu CTV</EmptyBlock>
          )}
        </DashboardPanel>
      )}

      {/* Bulk retry khi mạng lỗi */}
      {(() => {
        const allQueries = [summary, chart, traffic, funnel, distProvince, distVehicle, activeDistData, businessInsights, interested, conversion,
          orders, topContent, ratings, intent, ...(isSuperAdmin ? [collabPerf] : []), demand, demographics,
          searchInsights, compareInsights, heatmap];
        const failedCount = allQueries.filter((q) => q.isError).length;
        if (failedCount < 2) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '12px 18px', background: 'var(--surface-tint-rose, #fee2e2)', border: '1px solid var(--status-danger, #ef4444)', borderRadius: 'var(--radius-card)' }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger)', fontWeight: 600 }}>{failedCount} khối truy vấn bị lỗi mạng.</span>
            <button type="button" onClick={() => allQueries.forEach((q) => q.isError && q.refetch())} style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', textDecoration: 'underline' }}>Thử lại tất cả ngay</button>
          </div>
        );
      })()}
    </div>
  );

  // Danh sách các Tabs chính
  const tabs = [
    {
      key: 'overview',
      label: 'Tổng quan kinh doanh',
      info: 'Chỉ số KPI cốt lõi, biểu đồ hoạt động, phễu chuyển đổi và đơn hàng',
      render: renderOverviewTab,
    },
    {
      key: 'supply-demand',
      label: 'Cung - Cầu & Kho biển',
      info: 'Phân bổ kho biển đa chiều, cán cân cung cầu và phân khúc giá',
      render: renderSupplyDemandTab,
    },
    {
      key: 'audience',
      label: 'Khách hàng & Thị trường',
      info: 'Nhân khẩu học ngũ hành/độ tuổi, từ khóa tìm kiếm, heatmap và CTV',
      render: renderAudienceTab,
    },
    ...(isSuperAdmin ? [{
      key: 'system',
      label: 'Sức khỏe hệ thống',
      info: 'Giám sát tài nguyên máy chủ, database, worker và Google Analytics',
      render: renderSystemTab,
    }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Tab bar điều hướng Gentelella v4 */}
      <AdminTabbedPage activeTab={activeTab} tabs={tabs} onTabChange={setActiveTab} />
      {reportExportModal}
    </div>
  );
}
