import { useState, useMemo, useEffect, useRef } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { startOfMonth, subDays, startOfDay, format, parseISO } from 'date-fns';
import { CreditCard, FileText, Users, BadgeCheck, ExternalLink, Edit3, ArrowRight } from 'lucide-react';
import { routeFor } from '../../config/routes.js';
import { InfoTip } from '../../components/index.jsx';
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
  EnhancedActionsChart,
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
import KpiCard from './dashboard/DashboardKpiCard.jsx';
import {
  PIE_COLORS, TrafficSourcesPie, TopPlatesTable,
  FunnelView, DistributionCard, EmptyBlock, ErrorBlock
} from './dashboard/DashboardWidgets.jsx';

const KPI_CARDS = [
  { key: 'totalViews', label: 'Tổng lượt xem', info: 'Tổng số lượt khách truy cập xem chi tiết các biển số trong kỳ đã chọn.', icon: FileText, series: 'views', color: '#3B5BFF', access: (k) => k?.totalViews?.value, delta: (k) => k?.totalViews?.changePercent },
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
  if (n == null) return '--';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}%`;
}

export default function Dashboard({ go, st, patch }) {
  const isSuperAdmin = st?.user?.role === 'super-admin';
  const [rangeIdx, setRangeIdx] = useState(1); // default 30 days; null nếu đang dùng custom range
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Debounce custom date range 400ms — đổi 1 ô ngày không gọi lại ~17 API ngay lập tức.
  const [debouncedFrom] = useDebouncedValue(customFrom, 400);
  const [debouncedTo] = useDebouncedValue(customTo, 400);

  const range = useMemo(() => {
    if (rangeIdx === null && debouncedFrom && debouncedTo) {
      return { from: startOfDay(parseISO(debouncedFrom)), to: new Date(debouncedTo) };
    }
    const p = PRESETS[rangeIdx ?? 1];
    return { from: p.from(), to: new Date() };
  }, [rangeIdx, debouncedFrom, debouncedTo]);

  // Granularity tự suy ra theo độ dài khoảng thời gian: ≤14 ngày → ngày, ≤90 ngày → tuần, còn lại → tháng
  const granularity = useMemo(() => {
    const days = Math.max(1, Math.round((range.to - range.from) / 86400000));
    return days <= 14 ? 'day' : days <= 90 ? 'week' : 'month';
  }, [range]);

  // So sánh kỳ trước — cùng độ dài, liền kề trước range hiện tại (áp dụng cho Funnel trước, tránh gọi thêm
  // API cho mọi bảng phân tích — xem ADMIN-PANEL-AUDIT.md mục "so sánh 2 khoảng thời gian").
  const [compareFunnel, setCompareFunnel] = useState(false);
  const prevRange = useMemo(() => {
    const spanMs = range.to - range.from;
    return { from: new Date(range.from.getTime() - spanMs), to: new Date(range.from.getTime()) };
  }, [range]);

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
  const { exportReport, loading: exportingReport } = useExportReport('/api/admin/dashboard/export');

  // Business Insights tổng hợp (Cung cầu, Phân khúc giá, Tương tác vi mô, Sức khỏe Lead)
  const fromIso = useMemo(() => format(range.from, 'yyyy-MM-dd'), [range.from]);
  const toIso = useMemo(() => format(range.to, 'yyyy-MM-dd'), [range.to]);
  const businessInsights = useBusinessInsights(fromIso, toIso);
  const bData = businessInsights.data;

  // Phân bổ kho biển đa chiều (Dòng số đẹp, Tỉnh thành, Loại xe, Phân khúc giá, Vùng miền, Tình trạng)
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
    const qParam = extraParams.adminQ || params.get('q');
    const statusParam = extraParams.status || params.get('status');

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
    if (f > t) [f, t] = [t, f]; // auto-swap from>to
    if ((new Date(t) - new Date(f)) / 86400000 > 365) {
      f = new Date(new Date(t).getTime() - 365 * 86400000).toISOString().slice(0, 10);
      toast('Khoảng thời gian tối đa 365 ngày — đã tự thu hẹp');
    }
    setCustomFrom(f);
    setCustomTo(t);
    setRangeIdx(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>

      {isSuperAdmin && <SystemHealthWidget />}
      <GoogleAnalyticsPanel />

      {/* Date range + granularity */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            className="pill-btn"
            data-on={String(rangeIdx === i)}
            data-dark="false"
            onClick={() => selectPreset(i)}
            style={{ padding: '6px 16px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', background: rangeIdx === i ? 'var(--text-strong)' : 'var(--grey-100)', color: rangeIdx === i ? 'var(--white)' : 'var(--text-muted)' }}
          >
            {p.label}
          </button>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: rangeIdx === null ? 'var(--action-primary)' + '18' : 'transparent', border: rangeIdx === null ? '1px solid var(--action-primary)' : '1px solid var(--border-hairline)' }}>
          <input type="date" value={customFrom} max={customTo || format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => applyCustomRange(e.target.value, customTo)}
            style={{ font: 'var(--type-caption)', border: 'none', background: 'transparent', color: 'var(--text-body)' }} />
          <ArrowRight size={12} color="var(--text-faint)" />
          <input type="date" value={customTo} min={customFrom} max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => applyCustomRange(customFrom, e.target.value)}
            style={{ font: 'var(--type-caption)', border: 'none', background: 'transparent', color: 'var(--text-body)' }} />
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" disabled={exportingReport}
          onClick={() => exportReport('xlsx', { from: range.from.toISOString(), to: range.to.toISOString() }).catch(() => toast.error('Xuất báo cáo thất bại, vui lòng thử lại.'))}
          style={{ height: 32, padding: '0 14px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: exportingReport ? 'default' : 'pointer', background: 'var(--surface-muted)', color: 'var(--text-body)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)' }}>
          {exportingReport ? 'Đang xuất…' : 'Xuất Excel'}
        </button>
        <button type="button" disabled={exportingReport}
          onClick={() => exportReport('pdf', { from: range.from.toISOString(), to: range.to.toISOString() }).catch(() => toast.error('Xuất báo cáo thất bại, vui lòng thử lại.'))}
          style={{ height: 32, padding: '0 14px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: exportingReport ? 'default' : 'pointer', background: 'var(--surface-muted)', color: 'var(--text-body)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)' }}>
          {exportingReport ? 'Đang xuất…' : 'Xuất PDF'}
        </button>
      </div>

      {/* Banner Tóm tắt điều hành kinh doanh tổng hợp */}
      <ExecutiveSummaryBanner summary={bData?.executiveSummary} leadHealth={bData?.leadHealth} isSuperAdmin={isSuperAdmin} />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter-section)' }}>
        {summary.isLoading ? (
          [1, 2, 3, 4].map((i) => <SkeletonBase key={i} height={116} />)
        ) : (
          KPI_CARDS.map((c) => (
            <KpiCard
              key={c.key}
              icon={c.icon}
              color={c.color}
              label={c.label}
              info={c.info}
              value={c.access(kpis)}
              delta={c.delta != null ? fmtPct(c.delta(kpis)) : null}
              deltaColor={c.delta != null ? ((c.delta(kpis) ?? 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)') : 'var(--text-muted)'}
              spark={(chart.data?.points || []).map((p) => p[c.series] ?? 0)}
              animate={!reduceMotion}
            />
          ))
        )}
      </div>

      {/* Funnel */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', margin: '0 0 var(--space-4)' }}>
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Funnel chuyển đổi<InfoTip size={12} text="Phễu chuyển đổi: bao nhiêu khách Xem biển → Lưu yêu thích → Liên hệ → Chốt giao dịch. Mỗi bậc nhỏ dần cho thấy điểm khách bỏ lại." /></h3>
          <div style={{ flex: 1 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={compareFunnel} onChange={(e) => setCompareFunnel(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--action-primary)' }} />
            So sánh với kỳ trước
          </label>
        </div>
        {funnel.isLoading ? (
          <SkeletonBase height={240} />
        ) : funnel.data ? (
          compareFunnel ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <span style={{ display: 'block', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', marginBottom: 8 }}>Kỳ hiện tại</span>
                <FunnelView data={funnel.data} />
              </div>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <span style={{ display: 'block', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)', marginBottom: 8 }}>Kỳ trước ({format(prevRange.from, 'dd/MM')} – {format(prevRange.to, 'dd/MM')})</span>
                {funnelPrev.isLoading ? <SkeletonBase height={200} /> : funnelPrev.data ? <FunnelView data={funnelPrev.data} /> : <EmptyBlock>Không có dữ liệu kỳ trước</EmptyBlock>}
              </div>
            </div>
          ) : (
            <FunnelView data={funnel.data} />
          )
        ) : (
          <EmptyBlock>Chưa có dữ liệu funnel</EmptyBlock>
        )}
      </div>

      {/* Views chart + Traffic sources */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        <EnhancedActionsChart chartData={chart.data} reduceMotion={reduceMotion} />

        <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Nguồn truy cập
            <InfoTip size={12} text="Tỷ lệ phân bổ khách hàng đến từ các kênh: Tìm kiếm tự nhiên Google (Organic), Mạng xã hội, Quảng cáo hoặc truy cập trực tiếp." />
          </h3>
          {traffic.isLoading ? (
            <SkeletonBase height={280} />
          ) : traffic.data?.items?.length > 0 ? (
            <TrafficSourcesPie items={traffic.data.items} animate={!reduceMotion} />
          ) : (
            <EmptyBlock>Chưa có dữ liệu nguồn truy cập</EmptyBlock>
          )}
        </div>
      </div>

      {/* Top interested plates + Lead pipeline health */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 500px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Biển số được quan tâm nhất
              <InfoTip size={12} text="Bảng xếp hạng các biển số có lượt xem, lưu vào danh sách yêu thích và liên hệ hỏi mua nhiều nhất trong kỳ." />
            </h3>
          </div>
          {interested.isLoading ? (
            <div style={{ padding: 'var(--gutter-card)' }}><SkeletonBase height={200} /></div>
          ) : interested.data?.items?.length > 0 ? (
            <TopPlatesTable items={interested.data.items} />
          ) : (
            <div style={{ padding: 'var(--gutter-card)' }}><EmptyBlock>Chưa có dữ liệu</EmptyBlock></div>
          )}
        </div>

        <LeadPipelineHealthCard leadHealth={bData?.leadHealth} intentData={intent.data} onActionClick={handleActionClick} />
      </div>

      {/* Plate conversion + trending */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Tỉ lệ chuyển đổi & xu hướng</h3>
        </div>
        {conversion.isLoading ? (
          <div style={{ padding: 'var(--gutter-card)' }}><SkeletonBase height={220} /></div>
        ) : conversion.data?.items?.length > 0 ? (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', font: 'var(--type-caption)' }}>
              <thead>
                <tr style={{ color: 'var(--text-faint)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-2) var(--gutter-card)', fontWeight: 'var(--fw-semibold)' }}>Biển số</th>
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Xem</th>
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Lưu</th>
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Liên hệ</th>
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Chốt</th>
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Đổi l/hệ<InfoTip size={12} text="Tỉ lệ chuyển đổi = số lần chốt giao dịch trên số lần liên hệ. Cao = khách hỏi là mua." /></th>
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Xu hướng</th>
                </tr>
              </thead>
              <tbody>
                {conversion.data.items.map((p) => (
                  <tr key={p.plateId} style={{ boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                    <td style={{ padding: 'var(--space-2) var(--gutter-card)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{p.plateNumber}</td>
                    <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>{p.views}</td>
                    <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>{p.favorites}</td>
                    <td style={{ padding: 'var(--space-2)', color: p.contacts > 0 ? 'var(--status-success)' : 'var(--text-muted)' }}>{p.contacts}</td>
                    <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>{p.closed}</td>
                    <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>{p.contactRate}%</td>
                    <td style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-bold)', color: p.trending > 0 ? 'var(--status-success)' : p.trending < 0 ? 'var(--status-danger)' : 'var(--text-faint)' }}>
                      {p.trending > 0 ? `+${p.trending}%` : `${p.trending}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 'var(--gutter-card)' }}><EmptyBlock>Chưa có dữ liệu chuyển đổi</EmptyBlock></div>
        )}
      </div>

      {/* Converted orders */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Đơn chuyển đổi</h3>
        </div>
        {orders.isLoading ? (
          <div style={{ padding: 'var(--gutter-card)' }}><SkeletonBase height={220} /></div>
        ) : orders.data?.items?.length > 0 ? (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', font: 'var(--type-caption)' }}>
              <thead>
                <tr style={{ color: 'var(--text-faint)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-2) var(--gutter-card)', fontWeight: 'var(--fw-semibold)' }}>Biển số</th>
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Khách hàng</th>
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Mục đích</th>
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Trạng thái</th>
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.items.map((o) => (
                  <tr key={o.contactId} style={{ boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                    <td style={{ padding: 'var(--space-2) var(--gutter-card)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{o.plateNumber || '—'}</td>
                    <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>
                      <div>{o.fullName}</div>
                      <div style={{ color: 'var(--text-faint)' }}>{o.phone}</div>
                    </td>
                    <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>{INTENT_LABEL[o.intent] || o.intent}</td>
                    <td style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)', color: o.status === 'closed' ? 'var(--status-success)' : 'var(--text-muted)' }}>{ORDER_STATUS_LABEL[o.status] || o.status}</td>
                    <td style={{ padding: 'var(--space-2)', color: 'var(--text-faint)' }}>{format(new Date(o.createdAt), 'dd/MM/yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 'var(--gutter-card)' }}><EmptyBlock>Chưa có đơn chuyển đổi</EmptyBlock></div>
        )}
      </div>

      {/* Top content */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 500px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Bài viết xem nhiều</h3>
          </div>
          {topContent.isLoading ? (
            <div style={{ padding: 'var(--gutter-card)' }}><SkeletonBase height={200} /></div>
          ) : topContent.data?.items?.length > 0 ? (
            topContent.data.items.map((c, i) => {
              const postUrl = routeFor('post', c.slug || c.contentId);
              return (
                <div
                  key={c.contentId}
                  style={{
                    padding: 'var(--space-3) var(--gutter-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    boxShadow: i < topContent.data.items.length - 1 ? 'inset 0 -1px 0 var(--border-hairline, var(--grey-100))' : 'none',
                  }}
                >
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 24, flexShrink: 0, fontWeight: 'var(--fw-semibold)' }}>
                    {i + 1}
                  </span>
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Mở bài viết: ${c.title}`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      font: 'var(--type-body-sm)',
                      fontWeight: 'var(--fw-medium)',
                      color: 'var(--text-strong)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'color 140ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--action-primary, #3b5bff)';
                      const icon = e.currentTarget.querySelector('.dash-ext-link');
                      if (icon) icon.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-strong)';
                      const icon = e.currentTarget.querySelector('.dash-ext-link');
                      if (icon) icon.style.opacity = '0.35';
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </span>
                    <ExternalLink
                      className="dash-ext-link"
                      size={13}
                      style={{ flexShrink: 0, opacity: 0.35, transition: 'opacity 140ms ease' }}
                      aria-hidden="true"
                    />
                  </a>
                  {patch && (
                    <button
                      type="button"
                      onClick={() => patch({ screen: 'compose', editPostId: c.contentId })}
                      title="Chỉnh sửa bài viết trong Admin"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 4,
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 'var(--radius-sm, 4px)',
                        transition: 'color 140ms ease, background-color 140ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--action-primary, #3b5bff)';
                        e.currentTarget.style.background = 'var(--surface-subtle, rgba(0,0,0,0.05))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Edit3 size={13} aria-hidden="true" />
                    </button>
                  )}
                  <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {c.views} xem
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ padding: 'var(--gutter-card)' }}><EmptyBlock>Chưa có dữ liệu bài viết</EmptyBlock></div>
          )}
        </div>
      </div>

      {/* Multi-Dimension Distribution & Supply vs Demand Balance */}
      <details className="dash-fold" open>
      <summary>Phân bổ kho biển đa chiều &amp; Cân bằng Cung - Cầu</summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)' }}>
        <MultiDimensionPlateDistributionMatrix
          distTab={distTab}
          onTabChange={setDistTab}
          distData={activeDistData}
          chartType={distChartType}
          onChartTypeChange={setDistChartType}
          ratingsData={ratings}
          onActionClick={handleActionClick}
        />

        <SupplyDemandComparisonChart
          categorySupplyDemand={bData?.categorySupplyDemand || []}
          onActionClick={handleActionClick}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
          <PriceSegmentsSweetSpotChart
            priceSegments={bData?.priceSegments || []}
            onActionClick={handleActionClick}
          />
          <MicroEngagementsChart
            plateEngagement={bData?.plateEngagement}
          />
        </div>
      </div>
      </details>


      {/* Collaborator performance (SuperAdmin only) + demand */}
      <details className="dash-fold" open>
      <summary>Hiệu suất cộng tác viên &amp; nhu cầu</summary>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        {isSuperAdmin && <div style={{ flex: '1 1 420px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Top cộng tác viên (hoa hồng)</h3>
          {collabPerf.isLoading ? (
            <SkeletonBase height={220} />
          ) : collabPerf.data?.items?.length > 0 ? (
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
          ) : (
            <EmptyBlock>Chưa có dữ liệu CTV</EmptyBlock>
          )}
        </div>}

        <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Nhu cầu săn biển<InfoTip size={12} text="Khách tự đặt 'bộ lọc săn biển' (VD: tứ quý, tổng nút cao). Khi biển khớp xuất hiện hệ thống nhắc họ. Đây là tín hiệu khách đang muốn gì." /></h3>
            {demand.data && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{demand.data.total} bộ lọc đang bật</span>}
          </div>
          {demand.isLoading ? (
            <div style={{ padding: 'var(--gutter-card)' }}><SkeletonBase height={180} /></div>
          ) : demand.data?.items?.length > 0 ? (
            demand.data.items.map((d, i) => (
              <div key={d.name} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: i < demand.data.items.length - 1 ? 'inset 0 -1px 0 var(--grey-100)' : 'none' }}>
                <span style={{ flex: 1, font: 'var(--type-body-sm)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name || '—'}</span>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)' }}>{d.count}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: 'var(--gutter-card)' }}><EmptyBlock>Chưa có saved search</EmptyBlock></div>
          )}
        </div>
      </div>
      </details>

      {/* Nhân khẩu học khách hàng */}
      <details className="dash-fold" open>
      <summary>Nhân khẩu học khách hàng</summary>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Khách hàng theo mệnh phong thủy<InfoTip size={12} text="Phân loại khách theo ngũ hành (Kim/Mộc/Thủy/Hỏa/Thổ) suy từ ngày sinh họ khai khi đăng ký — để hiểu khách thích biển hợp mệnh nào." /></h3>
          {demographics.isLoading ? (
            <SkeletonBase height={240} />
          ) : demographics.data?.byElement?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={demographics.data.byElement} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ label, count }) => `${label}: ${count}`}>
                  {demographics.data.byElement.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có khách hàng có ngày sinh</EmptyBlock>
          )}
          {demographics.data && (
            <p style={{ margin: 'var(--space-2) 0 0', font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'center' }}>
              {demographics.data.totalUsersWithBirthDate}/{demographics.data.totalUsers} khách đã điền ngày sinh
            </p>
          )}
        </div>

        <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Khách hàng theo độ tuổi</h3>
          {demographics.isLoading ? (
            <SkeletonBase height={240} />
          ) : demographics.data?.byAgeGroup?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={demographics.data.byAgeGroup}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Số khách" fill="#3B5BFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có dữ liệu độ tuổi</EmptyBlock>
          )}
        </div>

        <div style={{ flex: '1 1 240px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Khách hàng theo giới tính</h3>
          {demographics.isLoading ? (
            <SkeletonBase height={240} />
          ) : demographics.data?.byGender?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={demographics.data.byGender} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ label, count }) => `${label}: ${count}`}>
                  {demographics.data.byGender.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có dữ liệu giới tính</EmptyBlock>
          )}
        </div>
      </div>
      </details>

      {/* Search insights + Compare insights */}
      <details className="dash-fold" open>
      <summary>Tìm kiếm &amp; so sánh</summary>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 400px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Từ khóa tìm kiếm nhiều nhất</h3>
            {searchInsights.data && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{searchInsights.data.totalSearches} lượt tìm · {searchInsights.data.zeroResultSearches} không có kết quả</span>}
          </div>
          {searchInsights.isLoading ? (
            <div style={{ padding: 'var(--gutter-card)' }}><SkeletonBase height={200} /></div>
          ) : searchInsights.data?.topKeywords?.length > 0 ? (
            searchInsights.data.topKeywords.map((k, i) => (
              <div key={k.keyword} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: i < searchInsights.data.topKeywords.length - 1 ? 'inset 0 -1px 0 var(--grey-100)' : 'none' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 24 }}>{i + 1}</span>
                <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{k.keyword}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>~{k.avgResultCount} kết quả</span>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)' }}>{k.count} lượt</span>
              </div>
            ))
          ) : (
            <div style={{ padding: 'var(--gutter-card)' }}><EmptyBlock>Chưa có tìm kiếm bằng từ khóa</EmptyBlock></div>
          )}
        </div>

        <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Cặp biển hay được so sánh cùng nhau</h3>
            {compareInsights.data && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{compareInsights.data.totalCompareSessions} lượt so sánh</span>}
          </div>
          {compareInsights.isLoading ? (
            <div style={{ padding: 'var(--gutter-card)' }}><SkeletonBase height={200} /></div>
          ) : compareInsights.data?.topPairs?.length > 0 ? (
            compareInsights.data.topPairs.map((p, i) => (
              <div key={`${p.plateNumberA}-${p.plateNumberB}`} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: i < compareInsights.data.topPairs.length - 1 ? 'inset 0 -1px 0 var(--grey-100)' : 'none' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 24 }}>{i + 1}</span>
                <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{p.plateNumberA} ↔ {p.plateNumberB}</span>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)' }}>{p.count} lần</span>
              </div>
            ))
          ) : (
            <div style={{ padding: 'var(--gutter-card)' }}><EmptyBlock>Chưa có lượt so sánh biển</EmptyBlock></div>
          )}
        </div>
      </div>
      </details>

      {/* Traffic heatmap */}
      <details className="dash-fold" open>
      <summary>Lưu lượng theo thời gian</summary>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 400px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Traffic theo giờ trong ngày</h3>
          {heatmap.isLoading ? (
            <SkeletonBase height={220} />
          ) : heatmap.data?.byHour?.some((h) => h.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={heatmap.data.byHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(h) => `${h}h`} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={(h) => `${h}h`} />
                <Bar dataKey="count" name="Lượt xem" fill="#C75B00" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có dữ liệu traffic theo giờ</EmptyBlock>
          )}
        </div>

        <div style={{ flex: '1 1 320px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Traffic theo ngày trong tuần</h3>
          {heatmap.isLoading ? (
            <SkeletonBase height={220} />
          ) : heatmap.data?.byWeekday?.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={heatmap.data.byWeekday.map((d) => ({ ...d, label: WEEKDAY_LABEL[d.weekday] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Lượt xem" fill="#C75B00" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có dữ liệu traffic theo ngày trong tuần</EmptyBlock>
          )}
        </div>
      </div>
      </details>

      {/* Bulk retry — khi nhiều block lỗi cùng lúc (vd mất mạng), tránh phải cuộn click "Thử lại" từng cái */}
      {(() => {
        const allQueries = [summary, chart, traffic, funnel, distProvince, distVehicle, activeDistData, businessInsights, interested, conversion,
          orders, topContent, ratings, intent, ...(isSuperAdmin ? [collabPerf] : []), demand, demographics,
          searchInsights, compareInsights, heatmap];
        const failedCount = allQueries.filter((q) => q.isError).length;
        if (failedCount < 2) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-tint-rose)', borderRadius: 'var(--radius-card)' }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>{failedCount} mục tải lỗi.</span>
            <button type="button" onClick={() => allQueries.forEach((q) => q.isError && q.refetch())} style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', textDecoration: 'underline' }}>Thử lại tất cả</button>
          </div>
        );
      })()}

      {/* Error states */}
      {summary.isError && <ErrorBlock onRetry={() => summary.refetch()} />}
      {chart.isError && <ErrorBlock onRetry={() => chart.refetch()} />}
      {traffic.isError && <ErrorBlock onRetry={() => traffic.refetch()} />}
      {funnel.isError && <ErrorBlock onRetry={() => funnel.refetch()} />}
      {distProvince.isError && <ErrorBlock onRetry={() => distProvince.refetch()} />}
      {distVehicle.isError && <ErrorBlock onRetry={() => distVehicle.refetch()} />}
      {interested.isError && <ErrorBlock onRetry={() => interested.refetch()} />}
      {conversion.isError && <ErrorBlock onRetry={() => conversion.refetch()} />}
      {orders.isError && <ErrorBlock onRetry={() => orders.refetch()} />}
      {topContent.isError && <ErrorBlock onRetry={() => topContent.refetch()} />}
      {ratings.isError && <ErrorBlock onRetry={() => ratings.refetch()} />}
      {intent.isError && <ErrorBlock onRetry={() => intent.refetch()} />}
      {isSuperAdmin && collabPerf.isError && <ErrorBlock onRetry={() => collabPerf.refetch()} />}
      {demand.isError && <ErrorBlock onRetry={() => demand.refetch()} />}
      {demographics.isError && <ErrorBlock onRetry={() => demographics.refetch()} />}
      {searchInsights.isError && <ErrorBlock onRetry={() => searchInsights.refetch()} />}
      {compareInsights.isError && <ErrorBlock onRetry={() => compareInsights.refetch()} />}
      {heatmap.isError && <ErrorBlock onRetry={() => heatmap.refetch()} />}
    </div>
  );
}

