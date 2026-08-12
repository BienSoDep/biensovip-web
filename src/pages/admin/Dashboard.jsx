import { useState, useMemo } from 'react';
import { startOfMonth, subDays, startOfDay } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import SkeletonBase from '../../components/skeletons/SkeletonBase.jsx';
import { useDashboardSummary, useViewsChart, useTopViewedPlates, useTrafficSources } from '../../services/adminDashboard.js';

const PIE_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#0891b2', '#6d28d9'];

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

export default function Dashboard({ go }) {
  const [rangeIdx, setRangeIdx] = useState(1); // default 30 days
  const [granularity, setGranularity] = useState('day');

  const range = useMemo(() => {
    const p = PRESETS[rangeIdx];
    return { from: p.from(), to: new Date() };
  }, [rangeIdx]);

  const summary = useDashboardSummary(range);
  const chart = useViewsChart({ ...range, granularity });
  const topPlates = useTopViewedPlates({ ...range, limit: 10 });
  const traffic = useTrafficSources(range);

  const kpis = summary.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>

      {/* Date range + granularity */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            className="pill-btn"
            data-on={String(i === rangeIdx)}
            data-dark="false"
            onClick={() => setRangeIdx(i)}
            style={{ padding: '6px 16px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', background: i === rangeIdx ? 'var(--text-strong)' : 'var(--grey-100)', color: i === rangeIdx ? 'var(--white)' : 'var(--text-muted)' }}
          >
            {p.label}
          </button>
        ))}
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
          [1, 2, 3].map((i) => <SkeletonBase key={i} height={100} />)
        ) : (
          <>
            <Kpi label="Tổng lượt xem" value={kpis?.totalViews?.value} delta={fmtPct(kpis?.totalViews?.changePercent)} deltaColor={kpis?.totalViews?.changePercent >= 0 ? 'var(--status-success)' : 'var(--status-danger)'} />
            <Kpi label="Yêu cầu liên hệ" value={kpis?.contactRequests?.value} delta={fmtPct(kpis?.contactRequests?.changePercent)} deltaColor={kpis?.contactRequests?.changePercent >= 0 ? 'var(--status-success)' : 'var(--status-danger)'} />
            <Kpi label="Biển đang rao" value={kpis?.activePlates} />
          </>
        )}
      </div>

      {/* Views chart + Traffic sources */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 500px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Lượt xem & Liên hệ</h3>
          {chart.isLoading ? (
            <SkeletonBase height={280} />
          ) : chart.data?.points?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chart.data.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} dot={false} name="Lượt xem" />
                <Line type="monotone" dataKey="contacts" stroke="#16a34a" strokeWidth={2} dot={false} name="Liên hệ" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có dữ liệu trong khoảng thời gian này</EmptyBlock>
          )}
        </div>

        <div style={{ flex: '1 1 280px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Nguồn truy cập</h3>
          {traffic.isLoading ? (
            <SkeletonBase height={280} />
          ) : traffic.data?.items?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={traffic.data.items} dataKey="visits" nameKey="source" cx="50%" cy="50%" outerRadius={90} label={({ source, percentage }) => `${source}: ${percentage}%`}>
                  {traffic.data.items.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock>Chưa có dữ liệu nguồn truy cập</EmptyBlock>
          )}
        </div>
      </div>

      {/* Top viewed plates */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Biển số xem nhiều nhất</h3>
        </div>
        {topPlates.isLoading ? (
          <div style={{ padding: 'var(--gutter-card)' }}><SkeletonBase height={200} /></div>
        ) : topPlates.data?.items?.length > 0 ? (
          topPlates.data.items.map((p, i) => (
            <div key={p.plateId} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: i < topPlates.data.items.length - 1 ? 'inset 0 -1px 0 var(--grey-100)' : 'none' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', minWidth: 24 }}>{i + 1}</span>
              <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{p.plateNumber}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{p.views} lượt xem</span>
            </div>
          ))
        ) : (
          <div style={{ padding: 'var(--gutter-card)' }}><EmptyBlock>Chưa có dữ liệu lượt xem</EmptyBlock></div>
        )}
      </div>

      {/* Error states */}
      {summary.isError && <ErrorBlock onRetry={() => summary.refetch()} />}
      {chart.isError && <ErrorBlock onRetry={() => chart.refetch()} />}
      {traffic.isError && <ErrorBlock onRetry={() => traffic.refetch()} />}
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
