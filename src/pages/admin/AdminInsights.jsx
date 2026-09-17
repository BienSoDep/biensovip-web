import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import {
  useAnalyticsOverview, useAnalyticsPages, useAnalyticsDevices, useAnalyticsFunnel, useAnalyticsEvents,
} from '../../services/analytics.js';

const PIE_COLORS = ['var(--action-primary)', 'var(--amber-500)', 'var(--status-success-ink)', 'var(--status-danger)', 'var(--blue-500)'];

function todayIso() { return new Date().toISOString().slice(0, 10); }
function daysAgoIso(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

function fmtDuration(seconds) {
  const s = Math.round(seconds || 0);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}p${s % 60}s`;
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 16, flex: 1, minWidth: 160 }}>
      <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function AdminInsights() {
  const [fromDate, setFromDate] = useState(daysAgoIso(7));
  const [toDate, setToDate] = useState(todayIso());

  const overview = useAnalyticsOverview(fromDate, toDate);
  const pages = useAnalyticsPages(fromDate, toDate);
  const devices = useAnalyticsDevices(fromDate, toDate);
  const funnel = useAnalyticsFunnel(fromDate, toDate, null);
  const events = useAnalyticsEvents(fromDate, toDate, null);

  const loading = overview.isLoading || pages.isLoading || devices.isLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', margin: 0 }}>Insight khách hàng</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: 150, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', padding: '0 10px' }} />
          <span style={{ color: 'var(--text-muted)' }}>—</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: 150, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', padding: '0 10px' }} />
        </div>
      </div>

      {loading ? <SkeletonTable rows={4} /> : (
        <>
          {/* Tổng quan */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatCard label="Tổng phiên" value={overview.data?.sessionCount ?? 0} />
            <StatCard label="Thời lượng TB" value={fmtDuration(overview.data?.avgDurationSeconds)} />
            <StatCard label="Tổng lượt xem trang" value={overview.data?.totalPageViews ?? 0} />
          </div>

          {/* Bảng theo trang */}
          <section style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <h2 style={{ font: 'var(--type-title-3)', margin: '0 0 12px' }}>Theo trang</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-body)' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>
                    <th style={{ padding: '6px 8px' }}>Màn hình</th>
                    <th style={{ padding: '6px 8px' }}>Lượt xem</th>
                    <th style={{ padding: '6px 8px' }}>TG trung bình</th>
                    <th style={{ padding: '6px 8px' }}>Tỷ lệ thoát</th>
                  </tr>
                </thead>
                <tbody>
                  {(pages.data?.pages || []).map((p) => (
                    <tr key={p.screen} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 8px' }}>{p.screen}</td>
                      <td style={{ padding: '6px 8px' }}>{p.views}</td>
                      <td style={{ padding: '6px 8px' }}>{fmtDuration(p.avgDurationSeconds)}</td>
                      <td style={{ padding: '6px 8px' }}>{p.bounceRatePct.toFixed(0)}%</td>
                    </tr>
                  ))}
                  {!pages.data?.pages?.length && (
                    <tr><td colSpan={4} style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Chưa có dữ liệu trong khoảng ngày này.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Luồng đi */}
          <section style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <h2 style={{ font: 'var(--type-title-3)', margin: '0 0 12px' }}>Luồng đi</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              <div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6 }}>Trang vào đầu tiên</div>
                {(funnel.data?.topEntryScreens || []).map((e) => (
                  <div key={e.screen} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>{e.screen}</span><span style={{ color: 'var(--text-muted)' }}>{e.count}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6 }}>Trang thoát</div>
                {(funnel.data?.topExitScreens || []).map((e) => (
                  <div key={e.screen} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>{e.screen}</span><span style={{ color: 'var(--text-muted)' }}>{e.count}</span>
                  </div>
                ))}
              </div>
            </div>
            {!!(funnel.data?.transitions || []).length && (
              <div style={{ marginTop: 12 }}>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6 }}>Vào trang X rồi thường đi đâu tiếp</div>
                {funnel.data.transitions.slice(0, 10).map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>{t.fromScreen} → {t.toScreen}</span><span style={{ color: 'var(--text-muted)' }}>{t.count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* CTA/hành vi */}
          <section style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <h2 style={{ font: 'var(--type-title-3)', margin: '0 0 12px' }}>CTA & hành vi</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-body)' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>
                    <th style={{ padding: '6px 8px' }}>Sự kiện</th>
                    <th style={{ padding: '6px 8px' }}>Chi tiết</th>
                    <th style={{ padding: '6px 8px' }}>Số lần</th>
                  </tr>
                </thead>
                <tbody>
                  {(events.data?.events || []).slice(0, 20).map((e, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 8px' }}>{e.eventName}</td>
                      <td style={{ padding: '6px 8px', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.eventData || '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{e.count}</td>
                    </tr>
                  ))}
                  {!events.data?.events?.length && (
                    <tr><td colSpan={3} style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Chưa có dữ liệu trong khoảng ngày này.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Thiết bị/nguồn */}
          <section style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <h2 style={{ font: 'var(--type-title-3)', margin: '0 0 12px' }}>Thiết bị & nguồn</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              <div style={{ height: 220 }}>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6 }}>Thiết bị</div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={devices.data?.devices || []} dataKey="count" nameKey="device" outerRadius={70} label>
                      {(devices.data?.devices || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: 220 }}>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6 }}>Nguồn truy cập</div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={devices.data?.sources || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" /><YAxis allowDecimals={false} />
                    <Tooltip /><Bar dataKey="count" fill="var(--action-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
