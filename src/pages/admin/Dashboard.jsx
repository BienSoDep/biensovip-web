import { useState, useMemo, useEffect, useRef } from 'react';
import { startOfMonth, subDays, startOfDay, format, parseISO } from 'date-fns';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { toast } from 'react-hot-toast';
import { CreditCard, FileText, Users, BadgeCheck } from 'lucide-react';
import { routeFor } from '../../config/routes.js';
import SkeletonBase from '../../components/skeletons/SkeletonBase.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';
import { InfoTip } from '../../components/index.jsx';
import {
  useDashboardSummary, useActionsChart, useTrafficSources, useFunnel, usePlateDistribution,
  useTopInterested, usePlateConversion, useConvertedOrders, useTopContent, useRatings, useIntent,
  useCollaboratorPerf, useDemand, useCustomerDemographics, useSearchInsights, useCompareInsights, useTrafficHeatmap,
} from '../../services/adminDashboard.js';
import { useSystemHealth } from '../../services/systemHealth.js';

const HEALTH_LABEL = { ok: 'Ổn định', degraded: 'Cần chú ý', down: 'Sự cố' };
const HEALTH_COLOR = { ok: 'var(--status-success-ink)', degraded: 'var(--status-warning-ink)', down: 'var(--status-danger)' };

function SystemHealthWidget() {
  const { data, isLoading } = useSystemHealth();
  if (isLoading || !data) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Tình trạng hệ thống</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)' }}>
        <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLOR[data.emailStatus] || 'var(--text-faint)', display: 'inline-block' }} />
        Email: <b style={{ color: HEALTH_COLOR[data.emailStatus] }}>{HEALTH_LABEL[data.emailStatus] || data.emailStatus}</b>
        {data.lastEmailFailedAt && data.emailStatus === 'down' && <span style={{ color: 'var(--text-faint)' }}>(lỗi lúc {new Date(data.lastEmailFailedAt).toLocaleString('vi-VN')})</span>}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)' }}>
        <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLOR[data.dbStatus] || 'var(--text-faint)', display: 'inline-block' }} />
        Database: <b style={{ color: HEALTH_COLOR[data.dbStatus] }}>{HEALTH_LABEL[data.dbStatus] || data.dbStatus}</b>
      </span>
    </div>
  );
}

const PIE_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#0891b2', '#6d28d9'];

const KPI_CARDS = [
  { key: 'totalViews', label: 'Tổng lượt xem', icon: FileText, series: 'views', color: '#2563eb', access: (k) => k?.totalViews?.value, delta: (k) => k?.totalViews?.changePercent },
  { key: 'contactRequests', label: 'Yêu cầu liên hệ', icon: Users, series: 'contacts', color: '#7c3aed', access: (k) => k?.contactRequests?.value, delta: (k) => k?.contactRequests?.changePercent },
  { key: 'closedContacts', label: 'Đã chốt', icon: BadgeCheck, series: 'closed', color: '#16a34a', access: (k) => k?.closedContacts?.value, delta: (k) => k?.closedContacts?.changePercent },
  { key: 'soldPlates', label: 'Đã bán', icon: CreditCard, series: 'sold', color: '#ea580c', access: (k) => k?.soldPlates },
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

export default function Dashboard({ go, st }) {
  const isSuperAdmin = st?.user?.role === 'super-admin';
  const [rangeIdx, setRangeIdx] = useState(1); // default 30 days; null nếu đang dùng custom range
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const range = useMemo(() => {
    if (rangeIdx === null && customFrom && customTo) {
      return { from: startOfDay(parseISO(customFrom)), to: new Date(customTo) };
    }
    const p = PRESETS[rangeIdx ?? 1];
    return { from: p.from(), to: new Date() };
  }, [rangeIdx, customFrom, customTo]);

  // Granularity tự suy ra theo độ dài khoảng thời gian: ≤14 ngày → ngày, ≤90 ngày → tuần, còn lại → tháng
  const granularity = useMemo(() => {
    const days = Math.max(1, Math.round((range.to - range.from) / 86400000));
    return days <= 14 ? 'day' : days <= 90 ? 'week' : 'month';
  }, [range]);

  const summary = useDashboardSummary(range);
  const chart = useActionsChart({ ...range, granularity });
  const traffic = useTrafficSources(range);
  const funnel = useFunnel(range);
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
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>→</span>
          <input type="date" value={customTo} min={customFrom} max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => applyCustomRange(customFrom, e.target.value)}
            style={{ font: 'var(--type-caption)', border: 'none', background: 'transparent', color: 'var(--text-body)' }} />
        </div>
        <div style={{ flex: 1 }} />
      </div>

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
        <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Funnel chuyển đổi<InfoTip size={12} text="Phễu chuyển đổi: bao nhiêu khách Xem biển → Lưu yêu thích → Liên hệ → Chốt giao dịch. Mỗi bậc nhỏ dần cho thấy điểm khách bỏ lại." /></h3>
        {funnel.isLoading ? (
          <SkeletonBase height={240} />
        ) : funnel.data ? (
          <FunnelView data={funnel.data} />
        ) : (
          <EmptyBlock>Chưa có dữ liệu funnel</EmptyBlock>
        )}
      </div>

      {/* Views chart + Traffic sources */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 500px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Hành vi khách hàng</h3>
          {chart.isLoading ? (
            <SkeletonBase height={280} />
          ) : chart.data?.points?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chart.data.points}>
                <defs>
                  <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} fill="url(#gViews)" isAnimationActive={!reduceMotion} animationDuration={700} name="Xem" />
                <Line type="monotone" dataKey="contacts" stroke="#16a34a" strokeWidth={2} dot={false} isAnimationActive={!reduceMotion} name="Liên hệ" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có dữ liệu trong khoảng thời gian này</EmptyBlock>
          )}
        </div>

        <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Nguồn truy cập</h3>
          {traffic.isLoading ? (
            <SkeletonBase height={280} />
          ) : traffic.data?.items?.length > 0 ? (
            <TrafficSourcesPie items={traffic.data.items} animate={!reduceMotion} />
          ) : (
            <EmptyBlock>Chưa có dữ liệu nguồn truy cập</EmptyBlock>
          )}
        </div>
      </div>

      {/* Top interested plates */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 500px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Biển số được quan tâm nhất</h3>
          </div>
          {interested.isLoading ? (
            <div style={{ padding: 'var(--gutter-card)' }}><SkeletonBase height={200} /></div>
          ) : interested.data?.items?.length > 0 ? (
            <TopPlatesTable items={interested.data.items} />
          ) : (
            <div style={{ padding: 'var(--gutter-card)' }}><EmptyBlock>Chưa có dữ liệu</EmptyBlock></div>
          )}
        </div>

        <div style={{ flex: '1 1 280px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Mục đích liên hệ</h3>
          {intent.isLoading ? (
            <SkeletonBase height={280} />
          ) : intent.data?.items?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={intent.data.items} dataKey="count" nameKey="intent" cx="50%" cy="50%" outerRadius={90} label={({ intent, count }) => `${INTENT_LABEL[intent] || intent}: ${count}`}>
                  {intent.data.items.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có dữ liệu mục đích</EmptyBlock>
          )}
        </div>
      </div>

      {/* Plate conversion + trending */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Tỉ lệ chuyển đổi & xu hướng</h3>
        </div>
        {conversion.isLoading ? (
          <div style={{ padding: 'var(--gutter-card)' }}><SkeletonBase height={220} /></div>
        ) : conversion.data?.items?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-caption)' }}>
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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-caption)' }}>
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
            topContent.data.items.map((c, i) => (
              <div key={c.contentId} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: i < topContent.data.items.length - 1 ? 'inset 0 -1px 0 var(--grey-100)' : 'none' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 24 }}>{i + 1}</span>
                <span style={{ flex: 1, font: 'var(--type-body-sm)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)' }}>{c.views} xem</span>
              </div>
            ))
          ) : (
            <div style={{ padding: 'var(--gutter-card)' }}><EmptyBlock>Chưa có dữ liệu bài viết</EmptyBlock></div>
          )}
        </div>
      </div>

      {/* Distribution */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        <DistributionCard title="Kho biển theo tỉnh" data={distProvince} />
        <DistributionCard title="Kho biển theo loại xe" data={distVehicle} />
        <div style={{ flex: '1 1 320px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Đánh giá biển số</h3>
          {ratings.isLoading ? (
            <SkeletonBase height={260} />
          ) : ratings.data?.total > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                <span style={{ font: 'var(--type-display-2)', color: 'var(--text-strong)' }}>{ratings.data.average}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>/ 5 · {ratings.data.total} đánh giá</span>
              </div>
              {[...ratings.data.distribution].reverse().map((b) => (
                <div key={b.stars} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ width: 40, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{b.stars} ★</span>
                  <div style={{ flex: 1, height: 14, background: 'var(--grey-100)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <div style={{ width: `${(b.count / ratings.data.total) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                  <span style={{ width: 32, textAlign: 'right', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{b.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock>Chưa có đánh giá</EmptyBlock>
          )}
        </div>
      </div>

      {/* Collaborator performance (SuperAdmin only) + demand */}
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
                <Bar dataKey="paid" name="Đã trả" stackId="a" fill="#16a34a" radius={[0, 4, 4, 0]} />
                <Bar dataKey="pending" name="Chờ trả" stackId="a" fill="#ca8a04" />
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

      {/* Nhân khẩu học khách hàng */}
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
                <Bar dataKey="count" name="Số khách" fill="#7c3aed" radius={[4, 4, 0, 0]} />
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

      {/* Search insights + Compare insights */}
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

      {/* Traffic heatmap */}
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
                <Bar dataKey="count" name="Lượt xem" fill="#0891b2" radius={[3, 3, 0, 0]} />
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
                <Bar dataKey="count" name="Lượt xem" fill="#6d28d9" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có dữ liệu traffic theo ngày trong tuần</EmptyBlock>
          )}
        </div>
      </div>

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

function useCountUp(target, animate) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!animate) { setVal(Number(target) || 0); return; }
    const n = Number(target) || 0;
    if (!n) { setVal(0); return; }
    let raf;
    const t0 = performance.now();
    const dur = 700;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setVal(Math.round(n * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, animate]);
  return val;
}

function Sparkline({ data, color, animate }) {
  const pts = (data || []).map((v) => ({ v }));
  if (!pts.length) return null;
  return (
    <div style={{ height: 36, width: '100%' }}>
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={pts} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spark-${color.replace('#', '')})`} isAnimationActive={animate} animationDuration={700} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ icon: Icon, color, label, value, delta, deltaColor, spark, animate }) {
  const shown = useCountUp(value, animate);
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: `${color}1f`, color }}>
          <Icon size={18} />
        </span>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: 1 }}>{label}</span>
      </div>
      <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{shown.toLocaleString('vi-VN')}</span>
      {delta != null && (
        <span style={{ font: 'var(--type-caption)', color: deltaColor }}>{delta} so với kỳ trước</span>
      )}
      <Sparkline data={spark} color={color} animate={animate} />
    </div>
  );
}

function parsePlate(raw) {
  if (!raw) return { prov: '', seri: '', num: '' };
  const s = raw.trim();
  const idx = Math.max(s.lastIndexOf('-'), s.lastIndexOf(' '));
  if (idx < 0) return { prov: '', seri: '', num: s };
  const left = s.slice(0, idx).replace(/[\s-]/g, '');
  const num = s.slice(idx + 1).trim();
  const prov = left.match(/^\d{1,2}/)?.[0] || '';
  const seri = left.slice(prov.length);
  return { prov, seri, num };
}

function TrafficSourcesPie({ items, animate }) {
  const total = items.reduce((acc, it) => acc + (Number(it.visits) || 0), 0);
  const data = items.map((it, i) => ({
    name: it.source,
    value: Number(it.visits) || 0,
    pct: total > 0 ? Math.round((Number(it.visits) || 0) / total * 100) : 0,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={90} isAnimationActive={animate} animationDuration={700}>
              {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v} (${data.find((d) => d.name === n)?.pct ?? 0}%)`, n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', font: 'var(--type-caption)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.fill, flex: '0 0 auto' }} />
            <span style={{ flex: 1, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopPlatesTable({ items }) {
  const sorted = [...items].sort((a, b) => (b.views || 0) - (a.views || 0));
  return (
    <div>
      {sorted.map((p, i) => {
        const parsed = parsePlate(p.plateNumber);
        const rank = i + 1;
        return (
          <div key={p.plateId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', boxShadow: i < sorted.length - 1 ? 'inset 0 -1px 0 var(--grey-100)' : 'none' }}>
            <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', flex: '0 0 auto',
              background: rank <= 3 ? '#f59e0b' : 'var(--surface-sunken)', color: rank <= 3 ? 'var(--white)' : 'var(--text-muted)' }}>
              {rank}
            </span>
            <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} />
            <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plateNumber}</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: '0 0 84px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plateTypeName || '—'}</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: '0 0 60px', textAlign: 'right' }}>{p.views ?? 0} xem</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: '0 0 56px', textAlign: 'right' }}>{p.contacts ?? 0} LH</span>
            <a
              href={routeFor('detail', p.plateId)}
              onClick={(e) => { e.preventDefault(); window.location.hash = routeFor('detail', p.plateId); }}
              style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--link)', textDecoration: 'none', flex: '0 0 auto' }}
            >
              Xem →
            </a>
          </div>
        );
      })}
    </div>
  );
}

const FUNNEL_STEPS = [
  ['Lượt xem', 'views', '#2563eb'],
  ['Liên hệ', 'contacts', '#7c3aed'],
  ['Đang tư vấn', 'consulting', '#ca8a04'],
  ['Đã chốt', 'closed', '#16a34a'],
];

function FunnelView({ data }) {
  const max = Math.max(1, data.views);
  const rows = FUNNEL_STEPS.map(([label, key, color]) => ({
    label,
    value: data[key] ?? 0,
    color,
    pct: Math.round(((data[key] ?? 0) / max) * 100),
  }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ width: 96, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{r.label}</span>
          <div style={{ flex: 1, height: 28, background: 'var(--grey-100)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: 'var(--radius-sm)', transition: 'width .3s var(--ease-out)' }} />
          </div>
          <span style={{ width: 40, textAlign: 'right', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>{r.value}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
        <span>Liên hệ/Xem: <b style={{ color: 'var(--text-strong)' }}>{data.contactRate}%</b></span>
        <span>Chốt/Liên hệ: <b style={{ color: 'var(--text-strong)' }}>{data.closeRate}%</b></span>
      </div>
    </div>
  );
}

function DistributionCard({ title, data }) {
  const items = data.data?.items || [];
  return (
    <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
      <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{title}</h3>
      {data.isLoading ? (
        <SkeletonBase height={260} />
      ) : items.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={items}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Số biển" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyBlock>Chưa có dữ liệu</EmptyBlock>
      )}
    </div>
  );
}

function EmptyBlock({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, font: 'var(--type-body-sm)', color: 'var(--text-faint)' }}>
      {children}
    </div>
  );
}

function ErrorBlock({ onRetry }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>
      <span>Lỗi tải dữ liệu</span>
      <button type="button" onClick={onRetry} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
    </div>
  );
}
