import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { InfoTip } from '../../../components/index.jsx';

export function useCountUp(target, animate) {
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

export function Sparkline({ data, color, animate }) {
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

export default function KpiCard({ icon: Icon, color, label, info, value, delta, deltaColor, spark, animate }) {
  const shown = useCountUp(value, animate);
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: `${color}1f`, color }}>
          <Icon size={18} />
        </span>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {label}
          {info && <InfoTip text={info} size={13} />}
        </span>
      </div>
      <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{shown.toLocaleString('vi-VN')}</span>
      {delta != null && (
        <span style={{ font: 'var(--type-caption)', color: deltaColor }}>{delta} so với kỳ trước</span>
      )}
      <Sparkline data={spark} color={color} animate={animate} />
    </div>
  );
}
