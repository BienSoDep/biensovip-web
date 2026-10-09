import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { InfoTip } from '../../../components/index.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import { useVpaStats } from '../../../services/adminVpa.js';

// Cùng bảng màu dùng ở Dashboard (DashboardAdvancedCharts.jsx) — nhất quán thương hiệu toàn admin.
const PALETTE = ['#3B5BFF', '#C75B00', '#F5C542', '#3FBF8F', '#E5484D', '#8A6100', '#6B7180', '#3A3E47'];
// Backend trả key theo TÊN enum VpaPriceState (None/Suggested/Approved/Rejected/Drifted), không phải số —
// khác VPA_PRICE_STATES (dùng cho cột "Trạng thái giá" trong bảng, key số theo JSON biển trả về).
const STATE_NAMES = { None: 'Chưa có gợi ý', Suggested: 'Có gợi ý', Approved: 'Đã duyệt', Rejected: 'Đã từ chối', Drifted: 'Đề xuất đổi giá' };
const money = (v) => `${new Intl.NumberFormat('vi-VN').format(v)}đ`;
const CARD = { background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-inset-hairline)' };

function ChartBox({ title, tip, children, empty }) {
  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: '1 1 320px', minWidth: 0 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: 'var(--type-label)', color: 'var(--text-strong)' }}>
        {title}{tip && <InfoTip size={12} text={tip} />}
      </span>
      {empty ? <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>Chưa có đủ dữ liệu</div> : children}
    </div>
  );
}

// 4 biểu đồ thống kê VPA: trạng thái giá (tròn), top tỉnh (cột), top loại biển (cột), xu hướng giá trúng theo tuần (đường).
// Chỉ ở tab "Danh sách biển VPA" (không phải Duyệt giá/Đồng bộ) — gấp lại mặc định để không chiếm chỗ bảng danh sách.
export default function VpaStatsCharts() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useVpaStats(open);

  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: open ? 'var(--space-3)' : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <button type="button" onClick={() => setOpen((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', cursor: 'pointer', padding: 0, font: 'var(--type-label)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
          <span>Thống kê nhanh biển VPA</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <a
          href="/admin/thong-ke-bien-vpa"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            font: 'var(--type-caption)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--action-primary)',
            textDecoration: 'none',
          }}
        >
          <span>Xem Dashboard Thống kê VPA chi tiết</span>
          <ArrowRight size={13} />
        </a>
      </div>
      {open && (
        isLoading || !data ? (
          <Skeleton variant="table" rows={3} />
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <ChartBox title="Theo trạng thái giá" tip="Số biển ở mỗi trạng thái duyệt giá — xem còn bao nhiêu cần duyệt.">
              {(() => {
                const items = Object.entries(data.byPriceState || {}).map(([k, n]) => ({ label: STATE_NAMES[k] || k, count: n }));
                const total = items.reduce((s, x) => s + x.count, 0);
                return items.length === 0 ? <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có dữ liệu</div> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={items} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2}
                        label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}>
                        {items.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Pie>
                      <Tooltip formatter={(val, name) => [`${val} biển (${total > 0 ? Math.round((val / total) * 100) : 0}%)`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </ChartBox>

            <ChartBox title="Top 10 tỉnh/thành" tip="Tỉnh có nhiều biển VPA nhất trong kho." empty={!data.byProvince?.length}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.byProvince} margin={{ top: 10, right: 10, left: -10, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số biển" radius={[4, 4, 0, 0]} fill={PALETTE[0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>

            <ChartBox title="Top 10 loại biển" tip="Loại biển (lộc phát, ngũ quý…) chiếm nhiều nhất trong kho." empty={!data.byPlateType?.length}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.byPlateType} margin={{ top: 10, right: 10, left: -10, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số biển" radius={[4, 4, 0, 0]} fill={PALETTE[1]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>

            <ChartBox title="Xu hướng giá trúng (12 tuần)" tip="Giá trúng trung bình mỗi tuần, lấy từ kết quả đấu giá thật (không phải giá gợi ý hay giá đã duyệt)." empty={!data.priceTrend?.length}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.priceTrend.map((p) => ({ ...p, label: new Date(p.weekStart).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) }))}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
                  <Tooltip formatter={(val, name, p) => [`${money(val)} (${p.payload.sampleCount} mẫu)`, 'Giá trúng TB']} />
                  <Line type="monotone" dataKey="avgPrice" stroke={PALETTE[3]} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
        )
      )}
    </div>
  );
}
