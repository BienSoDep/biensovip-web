import { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
  MapPin, RefreshCw, Award, Sparkles
} from 'lucide-react';
import Button from '../../../components/Button.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import { Badge } from '../../../components/index.jsx';
import { useVpaStats } from '../../../services/adminVpa.js';
import {
  CARD, num, SectionTitle, VIP_PLATE_KEYWORDS
} from './vpaStatsShared.jsx';

export default function GeographyAndPlateTypesTab({ go, patch }) {
  const { data: stats, isLoading: loadingStats, refetch } = useVpaStats(true);
  const totalPlatesInStats = stats?.totalCount || 0;

  // Phân nhóm Loại biển VIP vs Phong thủy
  const categorizedPlateTypes = useMemo(() => {
    if (!stats?.byPlateType) return { vip: [], lucky: [], other: [] };
    const vip = [];
    const lucky = [];
    const other = [];

    stats.byPlateType.forEach((pt) => {
      const lower = (pt.label || '').toLowerCase();
      if (VIP_PLATE_KEYWORDS.some((k) => lower.includes(k))) {
        vip.push(pt);
      } else if (lower.includes('lộc phát') || lower.includes('thần tài') || lower.includes('ông địa') || lower.includes('gánh')) {
        lucky.push(pt);
      } else {
        other.push(pt);
      }
    });

    return { vip, lucky, other };
  }, [stats?.byPlateType]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 1. Top Tỉnh/Thành có nhiều biển VPA nhất */}
      <div style={CARD}>
        <SectionTitle
          icon={MapPin}
          tip="Top 10 địa phương dẫn đầu về số lượng biển số được đưa lên sàn đấu giá VPA."
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw size={13} /> Làm mới
            </Button>
          }
        >
          1. Phân bổ Địa lý: Top Tỉnh/Thành phố nhiều biển VPA nhất
        </SectionTitle>

        {loadingStats || !stats?.byProvince?.length ? (
          <Skeleton variant="card" height={280} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byProvince} margin={{ top: 15, right: 15, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-100)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(val) => [`${num(val)} biển`, 'Số biển VPA']} />
                <Bar dataKey="count" name="Số biển" fill="#C75B00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Chi tiết bảng xếp hạng Top Tỉnh */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 8,
              marginTop: 8
            }}>
              {stats.byProvince.slice(0, 8).map((p, idx) => {
                const percent = totalPlatesInStats > 0 ? Math.round((p.count / totalPlatesInStats) * 100) : 0;
                return (
                  <div
                    key={p.label}
                    onClick={go ? go('avpa') : () => patch?.({ screen: 'avpa' })}
                    title={`Xem biển ${p.label} trong kho VPA`}
                    style={{
                      background: 'var(--surface-sunken)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      font: 'var(--type-caption)',
                      cursor: 'pointer',
                      transition: 'transform 120ms ease, box-shadow 120ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: idx < 3 ? '#C75B00' : 'var(--grey-200)',
                        color: idx < 3 ? '#fff' : 'var(--text-body)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 'bold'
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{p.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <b style={{ color: 'var(--text-strong)' }}>{num(p.count)}</b>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{percent}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Loại Biển số đẹp & Phân nhóm Phong thủy */}
      <div style={CARD}>
        <SectionTitle
          icon={Award}
          tip="Phân bổ số lượng biển theo từng loại hình số đẹp (Tứ quý, Ngũ quý, Thần tài, Lộc phát...)."
        >
          2. Cơ cấu Loại Biển số đẹp &amp; Phong thủy
        </SectionTitle>

        {loadingStats || !stats?.byPlateType?.length ? (
          <Skeleton variant="card" height={280} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byPlateType} margin={{ top: 15, right: 15, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-100)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(val) => [`${num(val)} biển`, 'Số lượng biển']} />
                <Bar dataKey="count" name="Số biển" fill="#3FBF8F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Phân nhóm Trực quan VIP vs Phong thủy */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-3)' }}>
              {/* Nhóm Siêu VIP */}
              <div style={{
                background: 'rgba(245,197,66,0.06)',
                border: '1px solid rgba(245,197,66,0.25)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <b style={{ color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={16} color="#d97706" /> Nhóm Biển Siêu VIP (Ngũ quý, Tứ quý, Sảnh)
                  </b>
                  <Badge tone="amber">Độ hiếm cao</Badge>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {categorizedPlateTypes.vip.map((item) => (
                    <div key={item.label} style={{
                      padding: '4px 8px',
                      background: 'var(--white)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      display: 'flex',
                      gap: 4
                    }}>
                      <span>{item.label}:</span>
                      <b style={{ color: 'var(--text-strong)' }}>{num(item.count)}</b>
                    </div>
                  ))}
                  {categorizedPlateTypes.vip.length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Đang cập nhật...</span>
                  )}
                </div>
              </div>

              {/* Nhóm Phong thủy */}
              <div style={{
                background: 'rgba(63,191,143,0.06)',
                border: '1px solid rgba(63,191,143,0.25)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <b style={{ color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Award size={16} color="#2b8a3e" /> Nhóm May mắn &amp; Tài lộc (Lộc phát, Thần tài...)
                  </b>
                  <Badge tone="mint">Thị trường cao</Badge>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {categorizedPlateTypes.lucky.map((item) => (
                    <div key={item.label} style={{
                      padding: '4px 8px',
                      background: 'var(--white)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      display: 'flex',
                      gap: 4
                    }}>
                      <span>{item.label}:</span>
                      <b style={{ color: 'var(--text-strong)' }}>{num(item.count)}</b>
                    </div>
                  ))}
                  {categorizedPlateTypes.lucky.length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Đang cập nhật...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
