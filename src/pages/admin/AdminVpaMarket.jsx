import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Lightbulb, Info } from 'lucide-react';
import { Select, InfoTip, Badge } from '../../components/index.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { useVpaMarketAnalysis } from '../../services/adminVpa.js';
import { useAdminCategories } from '../../services/categories.js';

const PALETTE = ['#3B5BFF', '#C75B00', '#F5C542', '#3FBF8F', '#E5484D', '#8A6100', '#6B7180', '#3A3E47'];
const money = (v) => (v == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(v)}đ`);
const CARD = { background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' };
const ALL = { value: '', label: 'Toàn thị trường' };
const catOpts = (list) => [ALL, ...(list || []).map((c) => ({ value: c.id, label: c.name }))];

function SectionTitle({ icon: Icon, children, tip }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--type-label)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
      {Icon && <Icon size={16} />} {children} {tip && <InfoTip size={12} text={tip} />}
    </span>
  );
}

function StatBox({ label, value, sub, tone }) {
  return (
    <div style={{ flex: '1 1 160px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ font: 'var(--type-h4)', fontWeight: 'var(--fw-bold)', color: tone || 'var(--text-strong)' }}>{value}</span>
      {sub && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}

// Trang Phân tích thị trường VPA (menu Báo cáo): 6 khối, toàn bộ tính trên giá trúng đấu giá thật — không phải giá
// gợi ý/giá duyệt nội bộ. Admin lọc theo tỉnh/loại biển để xem dự báo và xu hướng riêng cho nhóm đó.
export default function AdminVpaMarket() {
  const [provinceId, setProvinceId] = useState('');
  const [plateTypeId, setPlateTypeId] = useState('');
  const { data: provData } = useAdminCategories('province');
  const { data: typeData } = useAdminCategories('plate_type');
  const { data, isLoading, isError, error } = useVpaMarketAnalysis({ provinceId: provinceId || undefined, plateTypeId: plateTypeId || undefined });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ ...CARD, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{
              display: 'inline-flex',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--action-primary-subtle, rgba(59,91,255,0.08))',
              color: 'var(--action-primary)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-bold)'
            }}>
              Dữ liệu đấu giá thật &amp; Thị trường
            </span>
          </div>
          <h2 style={{ margin: '6px 0 2px', font: 'var(--type-h3)', color: 'var(--text-strong)' }}>
            Phân tích Thị trường &amp; Dự báo Giá trúng
          </h2>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Dựa trên giá trúng đấu giá thật — không phải giá gợi ý hay giá đã duyệt nội bộ.
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <Select label="Tỉnh/thành" value={provinceId} options={catOpts(provData?.items)} onChange={setProvinceId} />
        <Select label="Loại biển" value={plateTypeId} options={catOpts(typeData?.items)} onChange={setPlateTypeId} />
      </div>

      {isLoading && <Skeleton variant="table" rows={6} />}
      {isError && <div style={{ ...CARD, color: 'var(--status-danger)' }}>{error?.message || 'Không tải được dữ liệu phân tích.'}</div>}

      {data && (
        <>
          <PeriodCompareCard data={data.periodCompare} />
          <TrendCard priceTrend={data.priceTrend} forecast={data.forecast} />
          <InsightsCard insights={data.insights} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <GrowthRankCard title="Top tỉnh biến động giá" items={data.growthByProvince} empty={provinceId ? 'Đang lọc theo 1 tỉnh — chọn "Toàn thị trường" để xem xếp hạng giữa các tỉnh.' : 'Chưa đủ dữ liệu'} />
            <GrowthRankCard title="Top loại biển biến động giá" items={data.growthByPlateType} empty={plateTypeId ? 'Đang lọc theo 1 loại biển — chọn "Toàn thị trường" để xem xếp hạng.' : 'Chưa đủ dữ liệu'} />
          </div>
          <ShopCompareCard items={data.shopCompare} />
        </>
      )}
    </div>
  );
}

function PeriodCompareCard({ data }) {
  const up = (data.priceChangePercent ?? 0) >= 0;
  return (
    <div style={CARD}>
      <SectionTitle icon={up ? TrendingUp : TrendingDown} tip="So giá trúng trung bình 7 ngày gần nhất với 7 ngày liền trước — cần cả hai kỳ có ít nhất vài phiên mới đủ ý nghĩa.">
        So kỳ 7 ngày
      </SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <StatBox label="7 ngày qua — số phiên trúng" value={data.currentCount} />
        <StatBox label="7 ngày qua — giá trúng TB" value={money(data.currentAvgPrice)} />
        <StatBox label="7 ngày trước — giá trúng TB" value={money(data.previousAvgPrice)} />
        <StatBox label="Thay đổi"
          value={data.priceChangePercent == null ? '—' : `${up ? '+' : ''}${data.priceChangePercent}%`}
          tone={data.priceChangePercent == null ? undefined : up ? 'var(--status-success-ink)' : 'var(--status-danger)'} />
      </div>
    </div>
  );
}

function TrendCard({ priceTrend, forecast }) {
  const chartData = (priceTrend || []).map((p) => ({ ...p, label: new Date(p.weekStart).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) }));
  return (
    <div style={CARD}>
      <SectionTitle icon={TrendingUp} tip="Giá trúng trung bình mỗi tuần (12 tuần gần nhất) và đường trung bình động 4 tuần để bớt nhiễu.">
        Xu hướng giá & trung bình động
      </SectionTitle>
      {chartData.length === 0 ? (
        <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có đủ dữ liệu trong 12 tuần qua</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
            <Tooltip formatter={(val, name) => [money(val), name]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="avgPrice" name="Giá trúng TB/tuần" stroke={PALETTE[0]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="movingAvg4w" name="Trung bình động 4 tuần" stroke={PALETTE[3]} strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )}
      {forecast && (
        <div style={{ background: 'var(--amber-50)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
            <Info size={14} /> Dự báo tuần tới ({new Date(forecast.forecastWeekStart).toLocaleDateString('vi-VN')}): {money(forecast.forecastPrice)}
          </span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Ước tính thô bằng hồi quy tuyến tính trên {forecast.sampleWeeks} tuần (R²={forecast.rSquared}) — {forecast.sampleWeeks < 6 || forecast.rSquared < 0.5
              ? 'độ tin cậy thấp, chỉ tham khảo, không phải cam kết.'
              : 'xu hướng khá rõ nhưng vẫn chỉ là ước tính, không phải cam kết.'}
          </span>
        </div>
      )}
    </div>
  );
}

function InsightsCard({ insights }) {
  if (!insights?.length) return null;
  return (
    <div style={CARD}>
      <SectionTitle icon={Lightbulb}>Lời khuyên tự động</SectionTitle>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {insights.map((s, i) => <li key={i} style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{s}</li>)}
      </ul>
    </div>
  );
}

function GrowthRankCard({ title, items, empty }) {
  return (
    <div style={{ ...CARD, flex: '1 1 400px', minWidth: 0 }}>
      <SectionTitle tip="% thay đổi giá trúng TB giữa nửa đầu và nửa cuối cửa sổ 12 tuần — chỉ hiện nhóm đủ mẫu cả hai nửa.">{title}</SectionTitle>
      {!items?.length ? (
        <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>{empty}</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, items.length * 32)}>
          <BarChart data={items} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
            <Tooltip formatter={(val, _, p) => [`${val}% (${money(p.payload.earlyAvgPrice)} → ${money(p.payload.lateAvgPrice)})`, 'Thay đổi']} />
            <Bar dataKey="changePercent" name="% thay đổi" radius={[0, 4, 4, 0]}>
              {items.map((it, i) => <Bar key={i} fill={it.changePercent >= 0 ? PALETTE[3] : PALETTE[4]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ShopCompareCard({ items }) {
  return (
    <div style={CARD}>
      <SectionTitle icon={TrendingUp} tip="Đối chiếu giá trúng đấu giá VPA với giá niêm yết biển của shop theo cùng tỉnh + loại biển.">
        So giá trúng VPA với giá niêm yết của shop
      </SectionTitle>
      <div style={{ background: 'var(--amber-50)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', font: 'var(--type-caption)', color: 'var(--text-body)' }}>
        Hai con số KHÁC BẢN CHẤT: giá trúng là giá đấu giá đã chốt, giá shop là giá rao bán (chưa chắc đã bán được đúng giá đó). Chỉ dùng để cảm nhận mặt bằng, không phải so sánh lãi/lỗ trực tiếp.
      </div>
      {!items?.length ? (
        <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có đủ dữ liệu để đối chiếu</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-body-sm)' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>
                <th style={{ padding: '6px 8px' }}>Tỉnh</th><th style={{ padding: '6px 8px' }}>Loại biển</th>
                <th style={{ padding: '6px 8px' }}>Giá trúng VPA (TB)</th><th style={{ padding: '6px 8px' }}>Giá niêm yết shop (TB)</th>
                <th style={{ padding: '6px 8px' }}>Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const diff = it.shopAvgPrice != null ? Math.round((it.shopAvgPrice - it.vpaAvgPrice) * 100 / it.vpaAvgPrice) : null;
                return (
                  <tr key={i} style={{ boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                    <td style={{ padding: '8px' }}>{it.provinceName}</td>
                    <td style={{ padding: '8px' }}>{it.plateTypeName}</td>
                    <td style={{ padding: '8px', fontWeight: 'var(--fw-semibold)' }}>{money(it.vpaAvgPrice)} <span style={{ color: 'var(--text-muted)', font: 'var(--type-caption)' }}>({it.vpaSampleCount})</span></td>
                    <td style={{ padding: '8px' }}>{it.shopAvgPrice != null ? <>{money(it.shopAvgPrice)} <span style={{ color: 'var(--text-muted)', font: 'var(--type-caption)' }}>({it.shopSampleCount})</span></> : <span style={{ color: 'var(--text-muted)' }}>Chưa có biển shop</span>}</td>
                    <td style={{ padding: '8px' }}>{diff == null ? '—' : <Badge tone={diff >= 0 ? 'mint' : 'rose'}>{diff >= 0 ? '+' : ''}{diff}%</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
