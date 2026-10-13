import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 as BarChartIcon } from 'lucide-react';
import { money, formatMoneyAxis } from './collaboratorUtils.js';

function CommissionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));
  const total = (byKey.paid || 0) + (byKey.approved || 0) + (byKey.pending || 0);
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-3)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
      <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{label}</span>
      <span style={{ font: 'var(--type-caption)', color: '#16a34a' }}>Đã trả: {money(byKey.paid || 0)}</span>
      <span style={{ font: 'var(--type-caption)', color: '#2563eb' }}>Đã duyệt: {money(byKey.approved || 0)}</span>
      <span style={{ font: 'var(--type-caption)', color: '#ca8a04' }}>Chờ duyệt: {money(byKey.pending || 0)}</span>
      <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', borderTop: '1px solid var(--grey-100)', paddingTop: 4, marginTop: 2 }}>Tổng: {money(total)}</span>
    </div>
  );
}

export default function CommissionChart({ recent }) {
  const [rangeMonths, setRangeMonths] = useState(6);

  // Group recent commissions by YYYY-MM
  const chartData = (() => {
    if (!recent || recent.length === 0) return [];
    const now = new Date();
    const months = [];
    for (let i = rangeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, month: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`, paid: 0, approved: 0, pending: 0 });
    }
    const map = Object.fromEntries(months.map((m) => [m.key, m]));
    for (const r of recent) {
      if (!r.createdAt) continue;
      const key = r.createdAt.slice(0, 7);
      if (map[key]) {
        if (r.status === 'paid') map[key].paid += r.amount || 0;
        else if (r.status === 'approved') map[key].approved += r.amount || 0;
        else if (r.status === 'pending') map[key].pending += r.amount || 0;
      }
    }
    return months;
  })();

  const RANGE_OPTIONS = [
    { value: 3, label: '3 tháng' },
    { value: 6, label: '6 tháng' },
    { value: 12, label: '12 tháng' },
  ];

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Biểu đồ hoa hồng theo tháng</span>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-xs)' }}>
          {RANGE_OPTIONS.map((o) => (
            <button key={o.value} type="button" onClick={() => setRangeMonths(o.value)}
              style={{ height: 28, padding: '0 12px', border: 'none', borderRadius: 'var(--radius-xs)', cursor: 'pointer', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)',
                background: rangeMonths === o.value ? 'var(--action-primary)' : 'transparent', color: rangeMonths === o.value ? 'var(--white)' : 'var(--text-muted)' }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {chartData.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', height: 200, textAlign: 'center' }}>
          <BarChartIcon size={28} style={{ color: 'var(--text-faint)' }} />
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có giao dịch nào trong {rangeMonths} tháng gần đây — chia sẻ link giới thiệu ngay để bắt đầu nhận hoa hồng.</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatMoneyAxis} />
            <Tooltip content={<CommissionTooltip />} />
            <Legend />
            <Bar dataKey="paid" name="Đã trả" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="approved" name="Đã duyệt" stackId="a" fill="#2563eb" />
            <Bar dataKey="pending" name="Chờ duyệt" stackId="a" fill="#ca8a04" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
