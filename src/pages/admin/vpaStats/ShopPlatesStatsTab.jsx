import { useMemo } from 'react';
import {
  CarFront, CheckCircle2, Clock, CheckCheck, Sparkles,
  ArrowRight, DollarSign, MapPin, Tag, BarChart3, TrendingUp, Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import Button from '../../../components/Button.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import { usePlateDistribution } from '../../../services/adminDashboard.js';
import { usePlates } from '../../../services/plates.js';
import { useAdminCategories } from '../../../services/categories.js';
import { CARD, num, SectionTitle, StatCard, PALETTE } from './vpaStatsShared.jsx';

export default function ShopPlatesStatsTab({ go }) {
  const { data: statusDist, isLoading: statusLoading } = usePlateDistribution('status');
  const { data: priceDist, isLoading: priceLoading } = usePlateDistribution('price_range');
  const { data: regionDist, isLoading: regionLoading } = usePlateDistribution('region');

  const { data: totalData, isLoading: totalLoading } = usePlates({ perPage: 1 });
  const { data: availableData } = usePlates({ status: 'available', perPage: 1 });
  const { data: hotData } = usePlates({ isHot: true, perPage: 1 });

  const { data: plateTypes } = useAdminCategories('plate_type');
  const { data: provinces } = useAdminCategories('province');
  const plateTypesList = Array.isArray(plateTypes) ? plateTypes : (plateTypes?.items || []);

  // Trạng thái kho biển
  const statusItems = useMemo(() => statusDist?.items || [], [statusDist]);
  const availableCount = availableData?.total ?? (statusItems.find(x => x.label === 'Available' || x.label === 'Có sẵn')?.count || 0);
  const reservedCount = statusItems.find(x => x.label === 'Reserved' || x.label === 'Đã cọc' || x.label === 'Giữ chỗ')?.count || 0;
  const soldCount = statusItems.find(x => x.label === 'Sold' || x.label === 'Đã bán')?.count || 0;
  const totalShopPlates = totalData?.total || 0;
  const hotCount = hotData?.total || 0;

  // Dữ liệu phân khúc giá
  const priceItems = useMemo(() => priceDist?.items || [], [priceDist]);

  // Dữ liệu vùng miền
  const regionItems = useMemo(() => regionDist?.items || [], [regionDist]);

  const isLoading = statusLoading || priceLoading || regionLoading || totalLoading;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ ...CARD, padding: 'var(--space-5)' }}>
          <Skeleton height={180} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
        <StatCard
          label="Tổng biển số trong kho"
          value={num(totalShopPlates)}
          sub="Biển số hệ thống quản lý"
          tone="var(--text-strong)"
          icon={CarFront}
        />
        <StatCard
          label="Biển đang mở bán"
          value={num(availableCount)}
          sub={totalShopPlates > 0 ? `${Math.round((availableCount / totalShopPlates) * 100)}% tổng kho biển` : 'Sẵn sàng giao dịch'}
          tone="var(--status-success-ink, #16a34a)"
          badge="Có sẵn"
          icon={CheckCircle2}
        />
        <StatCard
          label="Đang giữ chỗ / Đã cọc"
          value={num(reservedCount)}
          sub="Khách hàng đang giao dịch"
          tone="var(--status-warning-ink, #d97706)"
          badge="Đang cọc"
          icon={Clock}
        />
        <StatCard
          label="Biển VIP / Nổi bật"
          value={num(hotCount)}
          sub="Được gắn huy hiệu HOT"
          tone="#8b5cf6"
          badge="VIP"
          icon={Sparkles}
        />
      </div>

      {/* Grid 2 Cột Biểu Đồ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Khối 1: Phân bố theo Phân khúc giá */}
        <div style={CARD}>
          <SectionTitle
            icon={DollarSign}
            tip="Cơ cấu số lượng biển số có sẵn trong kho theo từng khoảng giá niêm yết"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => go?.('aplates')}
                style={{ fontSize: 12, padding: '4px 8px' }}
              >
                <span>Xem kho biển</span>
                <ArrowRight size={13} style={{ marginLeft: 4 }} />
              </Button>
            }
          >
            Phân khúc giá niêm yết
          </SectionTitle>

          {priceItems.length > 0 ? (
            <div style={{ height: 260, width: '100%', marginTop: 'var(--space-2)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceItems} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <XAxis dataKey="label" angle={-15} textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [`${num(val)} biển`, 'Số lượng']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {priceItems.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Chưa có dữ liệu phân khúc giá
            </div>
          )}
        </div>

        {/* Khối 2: Phân bố theo Vùng miền & Trạng thái */}
        <div style={CARD}>
          <SectionTitle
            icon={MapPin}
            tip="Phân bổ biển số kho theo các miền địa lý Bắc - Trung - Nam"
          >
            Cơ cấu địa lý theo Vùng miền
          </SectionTitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'var(--space-2)' }}>
            {regionItems.map((r, i) => {
              const total = regionItems.reduce((acc, c) => acc + c.count, 0);
              const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
              return (
                <div key={r.label || i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{r.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{num(r.count)} biển ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: PALETTE[i % PALETTE.length], borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Đã bán: <strong style={{ color: 'var(--text-strong)' }}>{num(soldCount)}</strong> biển thành công
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => go?.('aplates')}
              style={{ fontSize: 12, gap: 4 }}
            >
              <CarFront size={13} />
              <span>Quản lý kho</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Khối 3: Thống kê Danh mục Loại biển */}
      <div style={CARD}>
        <SectionTitle
          icon={Tag}
          tip="Số lượng các phân loại biển số trong hệ thống danh mục"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => go?.('acats')}
              style={{ fontSize: 12 }}
            >
              <span>Quản lý danh mục</span>
              <ArrowRight size={13} style={{ marginLeft: 4 }} />
            </Button>
          }
        >
          Danh mục Loại biển số &amp; Tỉnh thành
        </SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
          {plateTypesList.slice(0, 8).map((t, idx) => (
            <div
              key={t.id}
              onClick={() => go?.('aplates')}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-sunken)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-strong)' }}>{t.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Xem biển số →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
