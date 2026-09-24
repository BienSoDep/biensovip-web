import { useState } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import {
  useAnalyticsOverview,
  useAnalyticsPages,
  useAnalyticsDevices,
  useAnalyticsFunnel,
  useAnalyticsEvents,
  useBusinessInsights,
} from '../../services/analytics.js';
import { formatPrice } from '../../lib/plateFormat.js';

// Modular Subcomponents
import ExecutiveSummaryBanner from './insights/ExecutiveSummaryBanner.jsx';
import FunnelKpiSection from './insights/FunnelKpiSection.jsx';
import BottleneckRadarSection from './insights/BottleneckRadarSection.jsx';
import PlateEngagementSection from './insights/PlateEngagementSection.jsx';
import SupplyDemandSection from './insights/SupplyDemandSection.jsx';
import LeadHealthAndGapsSection from './insights/LeadHealthAndGapsSection.jsx';
import StalledPlatesSection from './insights/StalledPlatesSection.jsx';
import TechnicalAnalyticsSection from './insights/TechnicalAnalyticsSection.jsx';

// Bảng màu series chuẩn thương hiệu (khớp tokens.css & Dashboard.jsx)
const PIE_COLORS = [
  'var(--brand-500, #d4650a)',
  'var(--status-warning, #f5c542)',
  'var(--status-success, #3fbf8f)',
  'var(--status-danger, #e5484d)',
  'var(--ink-700, #24272e)',
  'var(--grey-500, #6b7180)',
];

function todayIso() { return new Date().toISOString().slice(0, 10); }
function daysAgoIso(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function startOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function fmtDuration(seconds) {
  const s = Math.round(seconds || 0);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}p${s % 60}s`;
}

export default function AdminInsights({ go }) {
  const [fromDate, setFromDate] = useState(daysAgoIso(14));
  const [toDate, setToDate] = useState(todayIso());
  const [viewMode, setViewMode] = useState('business'); // 'business' | 'technical'

  // Business Insights Data
  const businessInsights = useBusinessInsights(fromDate, toDate);

  // Technical Analytics Data
  const overview = useAnalyticsOverview(fromDate, toDate);
  const pages = useAnalyticsPages(fromDate, toDate);
  const devices = useAnalyticsDevices(fromDate, toDate);
  const funnel = useAnalyticsFunnel(fromDate, toDate, null);
  const events = useAnalyticsEvents(fromDate, toDate, null);

  const loading = businessInsights.isLoading || (viewMode === 'technical' && (overview.isLoading || pages.isLoading));

  const bData = businessInsights.data;
  const bottlenecks = bData?.bottlenecks || [];
  const funnelData = bData?.funnel;
  const searchGaps = bData?.searchGaps || [];
  const stalledPlates = bData?.stalledPlates || [];
  const leadHealth = bData?.leadHealth;
  const plateEngagement = bData?.plateEngagement;
  const categorySupplyDemand = bData?.categorySupplyDemand || [];
  const priceSegments = bData?.priceSegments || [];
  const topInteracted = plateEngagement?.topInteractedPlates || [];

  const handleActionClick = (link) => {
    if (!link) return;
    if (link.startsWith('/admin/') && go) {
      const part = link.replace('/admin/', '').split('?')[0];
      const screenMap = {
        'ban-hang': 'asales',
        'bien-so': 'aplates',
        'lien-he': 'acontacts',
        'quy-trinh': 'akanban',
        'khach-hang': 'acustomers',
      };
      if (screenMap[part]) {
        go(screenMap[part]);
        return;
      }
    }
    window.location.href = link;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)', width: '100%' }}>
      {/* 1. Header & Bộ lọc thời gian đồng bộ */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        background: 'var(--surface-card)',
        padding: 'var(--gutter-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
      }}>
        <div style={{ minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <h1 style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)', margin: 0 }}>
              Insight Khách Hàng & Điểm Nghẽn
            </h1>
            <span style={{
              background: 'var(--blue-50)',
              color: 'var(--action-primary)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-bold)',
              letterSpacing: '0.02em',
              border: '1px solid var(--blue-100)',
            }}>
              Phân tích thông minh
            </span>
          </div>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Tự động rà soát luồng khách, đo lường điểm rơi rớt, sức khỏe tư vấn và cơ hội bán hàng.
          </p>
        </div>

        {/* Date Filters & Presets đồng bộ Dashboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-hairline)' }}>
            {[
              { label: '7 ngày', from: daysAgoIso(7) },
              { label: '14 ngày', from: daysAgoIso(14) },
              { label: '30 ngày', from: daysAgoIso(30) },
              { label: 'Tháng này', from: startOfMonthIso() },
            ].map((preset) => {
              const active = fromDate === preset.from;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => { setFromDate(preset.from); setToDate(todayIso()); }}
                  style={{
                    border: 'none',
                    background: active ? 'var(--text-strong)' : 'transparent',
                    boxShadow: active ? 'var(--shadow-1)' : 'none',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    font: 'var(--type-caption)',
                    fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                    cursor: 'pointer',
                    color: active ? 'var(--white)' : 'var(--text-muted)',
                    transition: 'var(--transition-control)',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--surface-sunken)',
            border: '1px solid var(--border-hairline)',
          }}>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                font: 'var(--type-caption)',
                color: 'var(--text-body)',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                font: 'var(--type-caption)',
                color: 'var(--text-body)',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              businessInsights.refetch();
              if (viewMode === 'technical') {
                overview.refetch();
                pages.refetch();
                devices.refetch();
                funnel.refetch();
                events.refetch();
              }
            }}
            title="Tải lại dữ liệu"
            style={{
              height: 32,
              width: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-card)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'var(--transition-control)',
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 2. Mode Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-3)',
        borderBottom: '1px solid var(--border-hairline)',
        paddingBottom: 0,
      }}>
        <button
          type="button"
          onClick={() => setViewMode('business')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: viewMode === 'business' ? '2.5px solid var(--action-primary)' : '2.5px solid transparent',
            marginBottom: -1,
            cursor: 'pointer',
            font: 'var(--type-label)',
            fontWeight: viewMode === 'business' ? 'var(--fw-bold)' : 'var(--fw-medium)',
            color: viewMode === 'business' ? 'var(--action-primary)' : 'var(--text-muted)',
            transition: 'var(--transition-control)',
          }}
        >
          <Sparkles size={16} />
          <span>Tổng quan & Điểm nghẽn kinh doanh (Dễ hiểu)</span>
          {bottlenecks.length > 0 && (
            <span style={{
              background: 'var(--status-danger-bg)',
              color: 'var(--status-danger-ink)',
              padding: '1px 7px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.75rem',
              fontWeight: 'var(--fw-bold)',
            }}>
              {bottlenecks.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setViewMode('technical')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: viewMode === 'technical' ? '2.5px solid var(--action-primary)' : '2.5px solid transparent',
            marginBottom: -1,
            cursor: 'pointer',
            font: 'var(--type-label)',
            fontWeight: viewMode === 'technical' ? 'var(--fw-bold)' : 'var(--fw-medium)',
            color: viewMode === 'technical' ? 'var(--action-primary)' : 'var(--text-muted)',
            transition: 'var(--transition-control)',
          }}
        >
          <SlidersHorizontal size={16} />
          <span>Nhật ký kỹ thuật & Dữ liệu chi tiết</span>
        </button>
      </div>


      {loading ? (
        <SkeletonTable rows={6} />
      ) : viewMode === 'business' ? (
        /* BUSINESS & BOTTLENECKS VIEW (Dành cho Admin & Quản lý shop) */
        <>
          {/* Executive Summary Banner */}
          <ExecutiveSummaryBanner summary={bData?.executiveSummary} />

          {/* KPI Cards & Funnel */}
          <FunnelKpiSection funnelData={funnelData} />

          {/* Radar Bottlenecks & Recommendations */}
          <BottleneckRadarSection bottlenecks={bottlenecks} onActionClick={handleActionClick} />

          {/* Micro-interactions & Plate Engagement */}
          <PlateEngagementSection
            plateEngagement={plateEngagement}
            topInteracted={topInteracted}
            formatPrice={formatPrice}
          />

          {/* Supply & Demand Balance (Category & Price Segments) */}
          <SupplyDemandSection
            categorySupplyDemand={categorySupplyDemand}
            priceSegments={priceSegments}
            onActionClick={handleActionClick}
          />

          {/* Lead Response Health & Search Gaps */}
          <LeadHealthAndGapsSection
            leadHealth={leadHealth}
            searchGaps={searchGaps}
            onActionClick={handleActionClick}
          />

          {/* Stalled Hot Plates */}
          <StalledPlatesSection
            stalledPlates={stalledPlates}
            formatPrice={formatPrice}
            onActionClick={handleActionClick}
          />
        </>
      ) : (
        /* TECHNICAL & RAW EVENTS VIEW (Dành cho Lập trình viên / Dev) */
        <TechnicalAnalyticsSection
          overview={overview}
          pages={pages}
          funnel={funnel}
          events={events}
          devices={devices}
          fmtDuration={fmtDuration}
          pieColors={PIE_COLORS}
        />
      )}
    </div>
  );
}
