import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import { ArrowRight } from 'lucide-react';
import { routeFor } from '../../../config/routes.js';
import SkeletonBase from '../../../components/skeletons/SkeletonBase.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';

export const PIE_COLORS = ['#3B5BFF', '#C75B00', '#F5C542', '#3FBF8F', '#E5484D', '#8A6100', '#6B7180', '#3A3E47'];

export const FUNNEL_STEPS = [
  ['Lượt xem', 'views', '#3B5BFF'],
  ['Liên hệ', 'contacts', '#C75B00'],
  ['Đang tư vấn', 'consulting', '#F5C542'],
  ['Đã chốt', 'closed', '#3FBF8F'],
];

export function parsePlate(raw) {
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

export function TrafficSourcesPie({ items, animate }) {
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

export function TopPlatesTable({ items }) {
  const sorted = [...items].sort((a, b) => (b.views || 0) - (a.views || 0));
  return (
    <div>
      {sorted.map((p, i) => {
        const parsed = parsePlate(p.plateNumber);
        const rank = i + 1;
        return (
          <div key={p.plateId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', boxShadow: i < sorted.length - 1 ? 'inset 0 -1px 0 var(--grey-100)' : 'none' }}>
            <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', flex: '0 0 auto',
              background: rank <= 3 ? 'var(--amber-500)' : 'var(--surface-sunken)', color: rank <= 3 ? 'var(--white)' : 'var(--text-muted)' }}>
              {rank}
            </span>
            <div style={{ width: 72, flexShrink: 0 }}>
              <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} />
            </div>
            <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plateNumber}</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: '0 0 60px', textAlign: 'right' }}>{p.views ?? 0} xem</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: '0 0 56px', textAlign: 'right' }}>{p.contacts ?? 0} LH</span>
            <a
              href={routeFor('detail', p.plateId)}
              onClick={(e) => { e.preventDefault(); history.pushState(null, '', routeFor('detail', p.plateId)); window.dispatchEvent(new PopStateEvent('popstate')); }}
              style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--link)', textDecoration: 'none', flex: '0 0 auto' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>Xem <ArrowRight size={11} /></span>
            </a>
          </div>
        );
      })}
    </div>
  );
}

export function FunnelView({ data }) {
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

export function DistributionCard({ title, data }) {
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
            <Bar dataKey="count" name="Số biển" fill="#3B5BFF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyBlock>Chưa có dữ liệu</EmptyBlock>
      )}
    </div>
  );
}

export function EmptyBlock({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, font: 'var(--type-body-sm)', color: 'var(--text-faint)' }}>
      {children}
    </div>
  );
}

export function ErrorBlock({ onRetry }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>
      <span>Lỗi tải dữ liệu</span>
      <button type="button" onClick={onRetry} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
    </div>
  );
}
