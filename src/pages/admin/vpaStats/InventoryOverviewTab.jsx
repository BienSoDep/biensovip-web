import { useState, useMemo } from 'react';
import {
  Layers, Database, ShieldCheck, CheckCircle2,
  RefreshCw, Clock, ArrowRight, Activity, Car, Bike,
  AlertTriangle, FileCheck, ChevronRight
} from 'lucide-react';
import { Select, Badge } from '../../../components/index.jsx';
import Button from '../../../components/Button.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import {
  useVpaStats, useVpaOverview, useVpaIntegrity
} from '../../../services/adminVpa.js';
import { useVpaCounts } from '../../../services/vpa.js';
import { useAdminCategories } from '../../../services/categories.js';
import { CARD, catOpts, num, SectionTitle, StatCard } from './vpaStatsShared.jsx';

export default function InventoryOverviewTab({ go, patch }) {
  const [vehicle, setVehicle] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [plateTypeId, setPlateTypeId] = useState('');

  const { data: provData } = useAdminCategories('province');
  const { data: typeData } = useAdminCategories('plate_type');

  const { data: stats, refetch: refetchStats } = useVpaStats(true);
  const { data: counts, refetch: refetchCounts } = useVpaCounts(vehicle);
  const { data: carCounts } = useVpaCounts('Car');
  const { data: bikeCounts } = useVpaCounts('MotorBike');
  const { data: overview, refetch: refetchOverview } = useVpaOverview({ enabled: true });
  const { data: integrityData } = useVpaIntegrity(true);

  const refreshAll = () => {
    refetchStats();
    refetchCounts();
    refetchOverview();
  };

  const totalPlatesInStats = stats?.totalCount || counts?.all || 0;
  const approvedPlates = stats?.approvedCount || stats?.byPriceState?.Approved || 0;
  const approvalRate = totalPlatesInStats > 0 ? Math.round((approvedPlates / totalPlatesInStats) * 100) : 0;

  // Breakdown Ô tô vs Xe máy
  const carTotal = carCounts?.all || stats?.byVehicle?.Car || 0;
  const bikeTotal = bikeCounts?.all || stats?.byVehicle?.MotorBike || 0;
  const carPercent = totalPlatesInStats > 0 ? Math.round((carTotal / totalPlatesInStats) * 100) : 0;
  const bikePercent = totalPlatesInStats > 0 ? Math.round((bikeTotal / totalPlatesInStats) * 100) : 0;

  // Integrity summary
  const integrityIssues = useMemo(() => {
    if (!integrityData || !Array.isArray(integrityData)) return 0;
    return integrityData.reduce((acc, cur) => acc + (cur.count || 0), 0);
  }, [integrityData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Top Header & Filter Controls */}
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
              Phân hệ Vận hành &amp; Giám sát
            </span>
          </div>
          <h2 style={{ margin: '6px 0 2px', font: 'var(--type-h3)', color: 'var(--text-strong)' }}>
            Tổng quan Kho Biển VPA &amp; Tiến độ Thu thập
          </h2>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Theo dõi dung lượng kho biển, tỷ trọng phương tiện, chu kỳ các phiên đấu giá và sức khỏe hệ thống crawler.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Select
            label="Loại xe"
            value={vehicle}
            options={[
              { value: '', label: 'Tất cả loại xe' },
              { value: 'Car', label: 'Ô tô' },
              { value: 'MotorBike', label: 'Xe máy' },
            ]}
            onChange={setVehicle}
          />
          <Select
            label="Tỉnh/thành"
            value={provinceId}
            options={catOpts(provData?.items)}
            onChange={setProvinceId}
          />
          <Select
            label="Loại biển"
            value={plateTypeId}
            options={catOpts(typeData?.items)}
            onChange={setPlateTypeId}
          />
          <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
            <Button variant="secondary" size="md" onClick={refreshAll} title="Làm mới dữ liệu">
              <RefreshCw size={14} /> Làm mới
            </Button>
            <Button variant="primary" size="md" onClick={go ? go('avpa') : () => patch?.({ screen: 'avpa' })}>
              Quản lý kho VPA <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Tổng quan Kho biển & Vòng đời */}
      <div style={CARD}>
        <SectionTitle icon={Database} tip="Thống kê tổng số lượng biển VPA chia theo từng tab vòng đời đấu giá.">
          1. Chỉ số Kho biển &amp; Vòng đời đấu giá
        </SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <StatCard
            label="Tổng kho biển VPA"
            value={num(counts?.all ?? totalPlatesInStats)}
            sub="Toàn bộ biển đã thu thập"
            icon={Layers}
            tone="var(--text-strong)"
          />
          <StatCard
            label="Biển chính thức (Tuần)"
            value={num(counts?.weekly)}
            sub="Đang &amp; sắp mở đấu giá"
            icon={Clock}
            tone="var(--action-primary)"
          />
          <StatCard
            label="Biển công bố (Tháng)"
            value={num(counts?.monthly)}
            sub="Kho chuẩn bị đấu giá"
            icon={Database}
            tone="var(--status-warning-ink)"
          />
          <StatCard
            label="Biển đã hết hạn"
            value={num(counts?.expired)}
            sub="Phiên đấu giá đã kết thúc"
            icon={Activity}
            tone="var(--text-muted)"
          />
          <StatCard
            label="Tỷ lệ duyệt giá toàn kho"
            value={`${approvalRate}%`}
            sub={`${num(approvedPlates)}/${num(totalPlatesInStats)} biển`}
            icon={CheckCircle2}
            tone={approvalRate >= 80 ? 'var(--status-success-ink)' : 'var(--status-warning-ink)'}
          />
        </div>
      </div>

      {/* 2. So sánh chuyên sâu Cơ cấu Xe Ô tô vs Xe máy */}
      <div style={CARD}>
        <SectionTitle icon={Car} tip="So sánh tương quan giữa kho biển Ô tô và Xe máy về số lượng và tiến độ.">
          2. Cơ cấu Phương tiện: Ô tô vs Xe máy
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {/* Card Ô tô */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,91,255,0.04) 0%, rgba(59,91,255,0.01) 100%)',
            border: '1px solid rgba(59,91,255,0.15)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--action-primary)', color: 'white' }}>
                  <Car size={18} />
                </div>
                <div>
                  <b style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Kho Biển Ô tô</b>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Phân khúc chủ lực</div>
                </div>
              </div>
              <Badge tone="blue">{carPercent}% tổng kho</Badge>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 120px' }}>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng số biển</div>
                <div style={{ font: 'var(--type-h3)', fontWeight: 'bold', color: 'var(--text-strong)' }}>{num(carTotal)}</div>
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang đấu giá (Tuần)</div>
                <div style={{ font: 'var(--type-h4)', fontWeight: 'bold', color: 'var(--action-primary)' }}>{num(carCounts?.weekly)}</div>
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chuẩn bị lên sàn (Tháng)</div>
                <div style={{ font: 'var(--type-h4)', fontWeight: 'bold', color: 'var(--status-warning-ink)' }}>{num(carCounts?.monthly)}</div>
              </div>
            </div>
          </div>

          {/* Card Xe máy */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(63,191,143,0.04) 0%, rgba(63,191,143,0.01) 100%)',
            border: '1px solid rgba(63,191,143,0.18)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: '#3FBF8F', color: 'white' }}>
                  <Bike size={18} />
                </div>
                <div>
                  <b style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Kho Biển Xe máy</b>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Phân khúc mở rộng</div>
                </div>
              </div>
              <Badge tone="mint">{bikePercent}% tổng kho</Badge>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 120px' }}>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng số biển</div>
                <div style={{ font: 'var(--type-h3)', fontWeight: 'bold', color: 'var(--text-strong)' }}>{num(bikeTotal)}</div>
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang đấu giá (Tuần)</div>
                <div style={{ font: 'var(--type-h4)', fontWeight: 'bold', color: '#2b8a3e' }}>{num(bikeCounts?.weekly)}</div>
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chuẩn bị lên sàn (Tháng)</div>
                <div style={{ font: 'var(--type-h4)', fontWeight: 'bold', color: 'var(--status-warning-ink)' }}>{num(bikeCounts?.monthly)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stacked Ratio Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <span>Tỷ trọng Ô tô: <b>{carPercent}%</b> ({num(carTotal)} biển)</span>
            <span>Tỷ trọng Xe máy: <b>{bikePercent}%</b> ({num(bikeTotal)} biển)</span>
          </div>
          <div style={{ width: '100%', height: 10, background: 'var(--grey-100)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${carPercent}%`, background: 'var(--action-primary)', transition: 'width 300ms ease' }} title={`Ô tô: ${carPercent}%`} />
            <div style={{ width: `${bikePercent}%`, background: '#3FBF8F', transition: 'width 300ms ease' }} title={`Xe máy: ${bikePercent}%`} />
          </div>
        </div>
      </div>

      {/* 3. Giám sát Thu thập (Crawler) & Sức khỏe Dữ liệu (Integrity) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        {/* Crawler Status */}
        <div style={{ ...CARD, flex: '2 1 450px' }}>
          <SectionTitle icon={ShieldCheck} tip="Trạng thái các luồng crawler tự động thu thập từ Cổng đấu giá VPA.">
            3. Giám sát Luồng Thu thập Dữ liệu (Crawler Engine)
          </SectionTitle>
          {overview?.sources ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
              {overview.sources.map((src) => (
                <div key={src.source} style={{
                  padding: 'var(--space-3)',
                  background: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  border: src.running ? '1px solid var(--action-primary)' : '1px solid transparent'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <b style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                      {src.source === 'Official' ? 'Biển Tuần (Chính thức)' : src.source === 'Announcement' ? 'Biển Tháng (Công bố)' : 'Kết quả Đấu giá'}
                    </b>
                    <Badge tone={src.running ? 'blue' : src.stale ? 'amber' : 'mint'}>
                      {src.running ? 'Đang chạy' : src.stale ? 'Chờ cập nhật' : 'Ổn định'}
                    </Badge>
                  </div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Chu kỳ: <b>{src.intervalMinutes} phút / lần</b>
                  </div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Chạy gần nhất: <b>{src.lastCompleteAt ? new Date(src.lastCompleteAt).toLocaleTimeString('vi-VN') : '—'}</b>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Skeleton variant="card" height={100} />
          )}
        </div>

        {/* Data Integrity Summary */}
        <div style={{ ...CARD, flex: '1 1 300px' }}>
          <SectionTitle icon={FileCheck} tip="Kiểm tra tính toàn vẹn dữ liệu (trùng lặp biển, lệch giá, sai thông tin).">
            Sức khỏe &amp; Toàn vẹn Dữ liệu
          </SectionTitle>
          <div style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: integrityIssues === 0 ? 'rgba(43,138,62,0.06)' : 'rgba(217,119,6,0.06)',
            border: integrityIssues === 0 ? '1px solid rgba(43,138,62,0.2)' : '1px solid rgba(217,119,6,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {integrityIssues === 0 ? (
                <CheckCircle2 size={20} color="var(--status-success-ink)" />
              ) : (
                <AlertTriangle size={20} color="var(--status-warning-ink)" />
              )}
              <b style={{ font: 'var(--type-label)', color: integrityIssues === 0 ? 'var(--status-success-ink)' : 'var(--status-warning-ink)' }}>
                {integrityIssues === 0 ? 'Kho dữ liệu toàn vẹn 100%' : `Phát hiện ${num(integrityIssues)} vấn đề cần xử lý`}
              </b>
            </div>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              {integrityIssues === 0
                ? 'Không có biển số trùng lặp, sai tab hoặc cấu trúc giá bất thường.'
                : 'Có các bản ghi cần đối soát hoặc đồng bộ lại định dạng.'}
            </p>
            {integrityIssues > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={go ? go('avpa') : () => patch?.({ screen: 'avpa' })}
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
              >
                Mở công cụ sửa lỗi <ChevronRight size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
