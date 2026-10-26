import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Activity, BarChart2, Layers, TrendingUp, CheckCircle2 } from 'lucide-react';
import DashboardPanel from './DashboardPanel.jsx';
import { InfoTip } from '../../../components/index.jsx';

/**
 * NetworkActivityWidget — Cụm biểu đồ hoạt động trung tâm lấy cảm hứng từ widget 'Network Activities' của Gentelella.
 * Bố cục tỷ lệ vàng:
 * - Cột trái (65%): Biểu đồ Area/Line đa chuỗi (Lượt xem, Cuộc gọi/Zalo, Yêu cầu liên hệ) với nút bật tắt chuỗi tương tác.
 * - Cột phải (35%): Panel 'Top Danh mục & Kênh chuyển đổi' với thanh tiến trình ngang (Progress Bar) sắc sảo và chỉ số nhanh.
 */
export default function NetworkActivityWidget({
  chartData,
  trafficData,
  distData,
  granularity = 'day',
  onGranularityChange,
  reduceMotion = false,
}) {
  const [activeSeries, setActiveSeries] = useState({ views: true, calls: true, contacts: true });

  const toggle = (key) => {
    setActiveSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.views && !next.calls && !next.contacts) return prev;
      return next;
    });
  };

  const points = chartData?.points || [];

  // Chuẩn bị danh sách Top Danh mục hoặc Kênh cho thanh Progress Bar bên phải
  const progressItems = useMemo(() => {
    if (distData?.items?.length) {
      const sorted = [...distData.items].sort((a, b) => (b.count || b.value || 0) - (a.count || a.value || 0)).slice(0, 5);
      const max = Math.max(1, ...sorted.map((s) => s.count || s.value || 0));
      return sorted.map((item, idx) => {
        const val = item.count || item.value || 0;
        const pct = Math.round((val / max) * 100);
        const colors = ['#C75B00', '#F19720', '#3FBF8F', '#26B99A', '#9B59B6'];
        return {
          label: item.name || item.label || item.plateType || 'Khác',
          value: val,
          pct,
          color: colors[idx % colors.length],
        };
      });
    }

    if (trafficData?.items?.length) {
      const sorted = [...trafficData.items].slice(0, 5);
      const total = sorted.reduce((acc, it) => acc + (Number(it.visits) || 0), 0) || 1;
      return sorted.map((item, idx) => {
        const val = Number(item.visits) || 0;
        const pct = Math.round((val / total) * 100);
        const colors = ['#C75B00', '#F19720', '#3FBF8F', '#26B99A', '#3498DB'];
        return {
          label: item.source || 'Trực tiếp',
          value: val,
          pct,
          color: colors[idx % colors.length],
        };
      });
    }

    return [
      { label: 'Tứ quý / Ngũ quý', value: 1420, pct: 92, color: '#C75B00' },
      { label: 'Thần tài / Lộc phát', value: 980, pct: 68, color: '#F19720' },
      { label: 'Biển số tiến lên', value: 650, pct: 45, color: '#3FBF8F' },
      { label: 'Tam hoa kép', value: 420, pct: 30, color: '#26B99A' },
      { label: 'Số phong thủy hợp mệnh', value: 310, pct: 22, color: '#9B59B6' },
    ];
  }, [distData, trafficData]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)',
        gap: 'var(--gutter-section, 20px)',
        alignItems: 'stretch',
      }}
      className="gentelella-network-layout"
    >
      {/* CỘT TRÁI (65%): Biểu đồ chính */}
      <DashboardPanel
        title="Nhịp độ tương tác khách hàng"
        icon={Activity}
        badge={granularity === 'day' ? 'Theo ngày' : granularity === 'week' ? 'Theo tuần' : 'Theo tháng'}
        badgeTone="brand"
        info="Theo dõi biến thiên lượng khách truy cập xem chi tiết, bấm gọi Zalo và để lại thông tin tư vấn theo thời gian."
        actions={
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => toggle('views')}
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill, 9999px)',
                border: '1px solid var(--action-primary, #C75B00)',
                background: activeSeries.views ? 'var(--action-primary, #C75B00)' : 'transparent',
                color: activeSeries.views ? '#ffffff' : 'var(--action-primary, #C75B00)',
                fontSize: '11px',
                fontWeight: 'var(--fw-semibold, 600)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeSeries.views ? '#fff' : 'var(--action-primary, #C75B00)' }} />
              <span>Xem biển</span>
            </button>

            <button
              type="button"
              onClick={() => toggle('calls')}
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill, 9999px)',
                border: '1px solid var(--status-warning, #F5C542)',
                background: activeSeries.calls ? 'var(--status-warning, #F5C542)' : 'transparent',
                color: activeSeries.calls ? '#111827' : 'var(--status-warning-ink, #8A6100)',
                fontSize: '11px',
                fontWeight: 'var(--fw-semibold, 600)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeSeries.calls ? '#111827' : 'var(--status-warning, #F5C542)' }} />
              <span>Gọi / Zalo</span>
            </button>

            <button
              type="button"
              onClick={() => toggle('contacts')}
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill, 9999px)',
                border: '1px solid var(--status-success, #3FBF8F)',
                background: activeSeries.contacts ? 'var(--status-success, #3FBF8F)' : 'transparent',
                color: activeSeries.contacts ? '#ffffff' : 'var(--status-success-ink, #1F7A59)',
                fontSize: '11px',
                fontWeight: 'var(--fw-semibold, 600)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeSeries.contacts ? '#fff' : 'var(--status-success, #3FBF8F)' }} />
              <span>Gửi tư vấn</span>
            </button>
          </div>
        }
      >
        <div style={{ height: 290, width: '100%', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={points} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gentelellaViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C75B00" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#C75B00" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gentelellaCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5C542" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F5C542" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gentelellaContacts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3FBF8F" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3FBF8F" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline, #e5e7eb)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted, #6b7280)' }} axisLine={{ stroke: 'var(--border-hairline, #e5e7eb)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted, #6b7280)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--white, #fff)',
                  border: '1px solid var(--border-hairline, #e5e7eb)',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />

              {activeSeries.views && (
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Lượt xem biển"
                  stroke="#C75B00"
                  strokeWidth={2.5}
                  fill="url(#gentelellaViews)"
                  isAnimationActive={!reduceMotion}
                  animationDuration={800}
                />
              )}

              {activeSeries.calls && (
                <Area
                  type="monotone"
                  dataKey="calls"
                  name="Bấm gọi / Zalo"
                  stroke="#F5C542"
                  strokeWidth={2}
                  fill="url(#gentelellaCalls)"
                  isAnimationActive={!reduceMotion}
                  animationDuration={800}
                />
              )}

              {activeSeries.contacts && (
                <Area
                  type="monotone"
                  dataKey="contacts"
                  name="Yêu cầu liên hệ"
                  stroke="#3FBF8F"
                  strokeWidth={2}
                  fill="url(#gentelellaContacts)"
                  isAnimationActive={!reduceMotion}
                  animationDuration={800}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashboardPanel>

      {/* CỘT PHẢI (35%): Top Profiles / Danh mục & Thanh tiến trình */}
      <DashboardPanel
        title="Hiệu suất danh mục trọng điểm"
        icon={BarChart2}
        badge="Top phân khúc"
        info="Tỷ lệ quan tâm và mật độ tương tác tập trung vào các dòng biển số đẹp hàng đầu thị trường."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {progressItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ fontWeight: 'var(--fw-semibold, 600)', color: 'var(--text-strong, #111827)' }}>
                    {item.label}
                  </span>
                  <span style={{ color: 'var(--text-muted, #6b7280)', fontWeight: 'var(--fw-bold, 700)' }}>
                    {item.pct}% ({item.value.toLocaleString('vi-VN')})
                  </span>
                </div>
                {/* Thanh Progress Bar phong cách Gentelella */}
                <div
                  style={{
                    height: 7,
                    width: '100%',
                    background: 'var(--grey-100, #f3f4f6)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${item.pct}%`,
                      background: item.color,
                      borderRadius: 4,
                      transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Info Box ở chân cột phải */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--surface-sunken, #f9fafb)',
              border: '1px solid var(--border-hairline, #e5e7eb)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted, #6b7280)' }}>
              <TrendingUp size={14} color="var(--action-primary, #C75B00)" />
              <span>Chốt đơn hiệu quả</span>
            </div>
            <span style={{ fontWeight: 'var(--fw-bold, 700)', color: 'var(--status-success, #3FBF8F)' }}>
              ~32.5%
            </span>
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}
