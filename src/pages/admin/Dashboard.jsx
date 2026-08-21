import { useState, useMemo } from 'react';
import { startOfMonth, subDays, startOfDay, format, parseISO } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import SkeletonBase from '../../components/skeletons/SkeletonBase.jsx';
import {
  useDashboardSummary, useActionsChart, useTrafficSources, useFunnel, usePlateDistribution,
  useTopInterested, usePlateConversion, useConvertedOrders, useTopContent, useRatings, useIntent,
  useCollaboratorPerf, useDemand, useCustomerDemographics, useSearchInsights, useCompareInsights, useTrafficHeatmap,
} from '../../services/adminDashboard.js';

const PIE_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#0891b2', '#6d28d9'];

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
  const [granularity, setGranularity] = useState('day');

  const range = useMemo(() => {
    if (rangeIdx === null && customFrom && customTo) {
      return { from: startOfDay(parseISO(customFrom)), to: new Date(customTo) };
    }
    const p = PRESETS[rangeIdx ?? 1];
    return { from: p.from(), to: new Date() };
  }, [rangeIdx, customFrom, customTo]);

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
    setCustomFrom(from);
    setCustomTo(to);
    if (from && to) setRangeIdx(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>

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
        <select
          value={granularity}
          onChange={(e) => setGranularity(e.target.value)}
          style={{ font: 'var(--type-caption)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)', background: 'var(--white)' }}
        >
          <option value="day">Theo ngày</option>
          <option value="week">Theo tuần</option>
          <option value="month">Theo tháng</option>
        </select>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter-section)' }}>
        {summary.isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => <SkeletonBase key={i} height={100} />)
        ) : (
          <>
            <Kpi label="Tổng lượt xem" value={kpis?.totalViews?.value} delta={fmtPct(kpis?.totalViews?.changePercent)} deltaColor={kpis?.totalViews?.changePercent >= 0 ? 'var(--status-success)' : 'var(--status-danger)'} />
            <Kpi label="Yêu cầu liên hệ" value={kpis?.contactRequests?.value} delta={fmtPct(kpis?.contactRequests?.changePercent)} deltaColor={kpis?.contactRequests?.changePercent >= 0 ? 'var(--status-success)' : 'var(--status-danger)'} />
            <Kpi label="Chuyển đổi (liên hệ/xem)" value={kpis?.conversionPercent != null ? `${kpis.conversionPercent}%` : '--'} />
            <Kpi label="Đã chốt" value={kpis?.closedContacts?.value} delta={fmtPct(kpis?.closedContacts?.changePercent)} deltaColor={kpis?.closedContacts?.changePercent >= 0 ? 'var(--status-success)' : 'var(--status-danger)'} />
            <Kpi label="Biển đang rao" value={kpis?.activePlates} />
            <Kpi label="Đã bán" value={kpis?.soldPlates} />
          </>
        )}
      </div>

      {/* Funnel */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
        <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Funnel chuyển đổi</h3>
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
              <LineChart data={chart.data.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} dot={false} name="Xem" />
                <Line type="monotone" dataKey="calls" stroke="#ca8a04" strokeWidth={2} dot={false} name="Gọi" />
                <Line type="monotone" dataKey="contacts" stroke="#16a34a" strokeWidth={2} dot={false} name="Liên hệ" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có dữ liệu trong khoảng thời gian này</EmptyBlock>
          )}
        </div>

        <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Nguồn truy cập theo hành vi</h3>
          {traffic.isLoading ? (
            <SkeletonBase height={280} />
          ) : traffic.data?.items?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={traffic.data.items}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                <XAxis dataKey="source" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="visits" name="Xem" stackId="a" fill="#2563eb" />
                <Bar dataKey="calls" name="Gọi" stackId="a" fill="#ca8a04" />
                <Bar dataKey="contacts" name="Liên hệ" stackId="a" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
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
            interested.data.items.map((p, i) => (
              <div key={p.plateId} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: i < interested.data.items.length - 1 ? 'inset 0 -1px 0 var(--grey-100)' : 'none' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 24 }}>{i + 1}</span>
                <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{p.plateNumber}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{p.views} xem</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{p.favorites} lưu</span>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: p.contacts > 0 ? 'var(--status-success)' : 'var(--text-faint)' }}>{p.contacts} liên hệ</span>
              </div>
            ))
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
                  <th style={{ padding: 'var(--space-2)', fontWeight: 'var(--fw-semibold)' }}>Đổi l/hệ</th>
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
                    <td style={{ padding: 'var(--space-2)', color: 'var(--text-faint)' }}>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
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
            <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Nhu cầu săn biển</h3>
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
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Khách hàng theo mệnh phong thủy</h3>
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

function Kpi({ label, value, delta, deltaColor }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{value ?? '--'}</span>
      {delta != null && (
        <span style={{ font: 'var(--type-caption)', color: deltaColor }}>{delta} so với kỳ trước</span>
      )}
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
