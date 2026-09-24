import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from 'recharts';
import StatCard from './StatCard.jsx';

export default function TechnicalAnalyticsSection({
  overview,
  pages,
  funnel,
  events,
  devices,
  fmtDuration,
  pieColors,
}) {
  return (
    <>
      {/* Tổng quan kỹ thuật */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <StatCard label="Tổng phiên kỹ thuật" value={overview.data?.sessionCount ?? 0} />
        <StatCard label="Thời lượng TB" value={fmtDuration(overview.data?.avgDurationSeconds)} />
        <StatCard label="Tổng lượt xem trang" value={overview.data?.totalPageViews ?? 0} />
      </div>

      {/* Bảng theo trang */}
      <section style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)' }}>
        <h2 style={{ font: 'var(--type-title-2)', margin: '0 0 var(--space-3)', fontWeight: 'var(--fw-bold)' }}>Chi tiết lượt xem theo màn hình (Pages)</h2>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-body-sm)' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>
                <th style={{ padding: '8px' }}>Màn hình</th>
                <th style={{ padding: '8px' }}>Lượt xem</th>
                <th style={{ padding: '8px' }}>TG trung bình</th>
                <th style={{ padding: '8px' }}>Tỷ lệ thoát</th>
              </tr>
            </thead>
            <tbody>
              {(pages.data?.pages || []).map((p) => (
                <tr key={p.screen} style={{ borderTop: '1px solid var(--border-hairline)' }}>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{p.screen}</td>
                  <td style={{ padding: '8px' }}>{p.views}</td>
                  <td style={{ padding: '8px' }}>{fmtDuration(p.avgDurationSeconds)}</td>
                  <td style={{ padding: '8px' }}>{p.bounceRatePct.toFixed(0)}%</td>
                </tr>
              ))}
              {!pages.data?.pages?.length && (
                <tr><td colSpan={4} style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Chưa có dữ liệu trong khoảng ngày này.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Luồng đi kỹ thuật */}
      <section style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)' }}>
        <h2 style={{ font: 'var(--type-title-2)', margin: '0 0 var(--space-3)', fontWeight: 'var(--fw-bold)' }}>Luồng vào / thoát (Screen Transitions)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 'var(--fw-semibold)' }}>Trang vào đầu tiên (Entry)</div>
            {(funnel.data?.topEntryScreens || []).map((e) => (
              <div key={e.screen} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border-hairline)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{e.screen}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'var(--fw-semibold)' }}>{e.count}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 'var(--fw-semibold)' }}>Trang thoát (Exit)</div>
            {(funnel.data?.topExitScreens || []).map((e) => (
              <div key={e.screen} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border-hairline)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{e.screen}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'var(--fw-semibold)' }}>{e.count}</span>
              </div>
            ))}
          </div>
        </div>
        {!!(funnel.data?.transitions || []).length && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 'var(--fw-semibold)' }}>Chuyển đổi màn hình thường gặp</div>
            {funnel.data.transitions.slice(0, 10).map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border-hairline)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{t.fromScreen} → {t.toScreen}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'var(--fw-semibold)' }}>{t.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sự kiện CTA & Event Log */}
      <section style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)' }}>
        <h2 style={{ font: 'var(--type-title-2)', margin: '0 0 var(--space-3)', fontWeight: 'var(--fw-bold)' }}>Nhật ký sự kiện (Raw Analytics Events)</h2>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-body-sm)' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>
                <th style={{ padding: '8px' }}>Sự kiện</th>
                <th style={{ padding: '8px' }}>Dữ liệu chi tiết</th>
                <th style={{ padding: '8px' }}>Số lần</th>
              </tr>
            </thead>
            <tbody>
              {(events.data?.events || []).slice(0, 25).map((e, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-hairline)' }}>
                  <td style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>{e.eventName}</td>
                  <td style={{ padding: '8px', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {e.eventData || '—'}
                  </td>
                  <td style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>{e.count}</td>
                </tr>
              ))}
              {!events.data?.events?.length && (
                <tr><td colSpan={3} style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Chưa có sự kiện trong khoảng ngày này.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Thiết bị & Nguồn */}
      <section style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)' }}>
        <h2 style={{ font: 'var(--type-title-2)', margin: '0 0 var(--space-3)', fontWeight: 'var(--fw-bold)' }}>Thiết bị & Nguồn truy cập</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <div style={{ height: 240 }}>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 'var(--fw-semibold)' }}>Phân bổ thiết bị</div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={devices.data?.devices || []} dataKey="count" nameKey="device" outerRadius={75} label>
                  {(devices.data?.devices || []).map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ height: 240 }}>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 'var(--fw-semibold)' }}>Nguồn truy cập</div>
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
  );
}
