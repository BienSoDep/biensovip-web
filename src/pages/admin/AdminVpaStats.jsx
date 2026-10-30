import { useState } from 'react';
import {
  BarChart3, Download, Landmark, CarFront, Layers,
  CheckCircle2, Sparkles, Clock, ArrowRight, ShieldCheck, Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/Button.jsx';
import ExportOptionModal from './vpa/ExportOptionModal.jsx';
import ExportHistoryModal from './vpa/ExportHistoryModal.jsx';
import InventoryOverviewTab from './vpaStats/InventoryOverviewTab.jsx';
import PricingManagementTab from './vpaStats/PricingManagementTab.jsx';
import GeographyAndPlateTypesTab from './vpaStats/GeographyAndPlateTypesTab.jsx';
import AdminVpaMarket from './AdminVpaMarket.jsx';
import ShopPlatesStatsTab from './vpaStats/ShopPlatesStatsTab.jsx';
import UnifiedPlatesDashboardTab from './vpaStats/UnifiedPlatesDashboardTab.jsx';
import { useVpaStats } from '../../services/adminVpa.js';
import { useVpaCounts } from '../../services/vpa.js';
import { useShopPlateSummary } from '../../services/plates.js';
import { apiClient } from '../../services/apiClient.js';
import { registerExportJob } from '../../lib/runWatcher.js';
import { num } from './vpaStats/vpaStatsShared.jsx';

export default function AdminVpaStats({ go, patch, st }) {
  // 3 tab chính: 'overview' (Dashboard Tổng Hợp & So Sánh Tỉ Lệ), 'vpa' (Biển đấu giá VPA) và 'shop' (Kho biển số của chúng ta)
  const [activeMainTab, setActiveMainTab] = useState('overview');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Sub-tabs bên trong VPA
  const [vpaSubTab, setVpaSubTab] = useState('inventory');

  // Dữ liệu thống kê tổng hợp để hiển thị dải KPI chung (đã gom tối ưu thành 3 request có cache)
  const { data: vpaStats } = useVpaStats(true);
  const { data: vpaCounts } = useVpaCounts();
  const { data: shopCounts } = useShopPlateSummary();

  const totalVpa = vpaCounts?.all || vpaStats?.totalCount || 0;
  const approvedVpa = vpaStats?.approvedCount || 0;
  const totalShop = shopCounts?.total || 0;
  const availableShop = shopCounts?.available || 0;
  const hotShop = shopCounts?.hot || 0;

  // Xử lý xuất file ngầm cho toàn bộ kho (VPA, Có sẵn, hoặc Gộp cả hai với cấu hình nguồn & bộ lọc)
  const handleExportChoice = async (options) => {
    const targetFormat = options?.format || 'xlsx';
    const targetScope = options?.scope || 'all';
    const sources = options?.sources;
    const vehicle = options?.vehicle;
    const provinceId = options?.provinceId;
    const priceState = options?.priceState;

    try {
      setExporting(true);
      const params = {
        format: targetFormat,
        scope: targetScope,
      };
      if (sources && sources.length > 0) {
        params.sources = Array.isArray(sources) ? sources.join(',') : sources;
      }
      if (vehicle !== undefined && vehicle !== null && vehicle !== '') {
        params.vehicle = vehicle;
      }
      if (provinceId) {
        params.provinceId = provinceId;
      }
      if (options?.provinceIds && options.provinceIds.length > 0) {
        params.provinceIds = Array.isArray(options.provinceIds) ? options.provinceIds.join(',') : options.provinceIds;
      }
      if (priceState !== undefined && priceState !== null && priceState !== '') {
        params.priceState = priceState;
      }
      if (options?.isCurrentPageOnly) {
        params.page = options.page || 1;
        params.limit = options.pageSize || 50;
      }

      const res = await apiClient.post('/api/admin/vpa/plates/export/jobs', null, { params });
      const jobId = res?.jobId || res?.data?.jobId;
      if (jobId) {
        registerExportJob(jobId);
        toast.success('Tiến trình xuất file đã được khởi chạy ngầm! Bạn có thể theo dõi % ở góc màn hình.');
      }
    } catch (err) {
      toast.error('Không thể khởi chạy xuất file: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setExporting(false);
    }
  };

  const vpaSubTabs = [
    { key: 'inventory', label: 'Tổng quan Kho & Vận hành' },
    { key: 'pricing', label: 'Quản trị Giá & Tiến độ duyệt' },
    { key: 'geography', label: 'Cơ cấu Tỉnh & Loại biển' },
    { key: 'market', label: 'Phân tích Thị trường & Dự báo' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 1. Phần Tab Chung & Thanh Tác Vụ Chung (Header & Unified Actions) */}
      <div
        style={{
          background: 'var(--white, #ffffff)',
          borderRadius: 'var(--radius-card, 12px)',
          padding: 'var(--space-4, 16px) var(--space-5, 20px)',
          boxShadow: 'var(--shadow-inset-hairline, 0 1px 3px rgba(0,0,0,0.05))',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4, 16px)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
        }}
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(241, 151, 32, 0.1)',
                  color: 'var(--action-primary, #F19720)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <BarChart3 size={13} />
                <span>Trung tâm dữ liệu &amp; Báo cáo</span>
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-strong, #0f172a)' }}>
              Thống Kê &amp; Báo Cáo Biển Số
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted, #64748b)' }}>
              Hệ thống phân tích toàn diện kho biển số hệ thống và dữ liệu đấu giá VPA toàn quốc
            </p>
          </div>

          {/* Cụm Tác Vụ Chung (Common Actions) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Nút Xuất dữ liệu biển số Full chức năng chuyển từ VPA sang */}
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={exporting}
              title="Xuất dữ liệu biển số ra Excel, Word hoặc CSV (xử lý ngầm, không giới hạn số lượng biển)"
              onClick={() => setExportModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                fontWeight: 700,
              }}
            >
              <Download size={15} />
              <span>Xuất dữ liệu biển số</span>
            </Button>

            {/* Nút Lịch sử xuất file 30 ngày */}
            <Button
              type="button"
              variant="outline"
              size="md"
              title="Xem và tải lại các file đã xuất trong vòng 30 ngày qua"
              onClick={go ? go('aexporthistory') : () => setHistoryModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
              }}
            >
              <Clock size={14} />
              <span>Lịch sử xuất (30 ngày)</span>
            </Button>

            {/* Chuyển trang nhanh: Quản lý Biển VPA */}
            <Button
              type="button"
              variant="outline"
              size="md"
              title="Chuyển đến màn hình quản lý chi tiết biển đấu giá VPA"
              onClick={go ? go('avpa') : null}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            >
              <Landmark size={14} color="var(--action-primary, #F19720)" />
              <span>Quản lý Biển VPA</span>
            </Button>

            {/* Chuyển trang nhanh: Quản lý Biển số Shop */}
            <Button
              type="button"
              variant="outline"
              size="md"
              title="Chuyển đến màn hình quản lý kho biển số của hệ thống"
              onClick={go ? go('aplates') : null}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            >
              <CarFront size={14} color="var(--action-primary, #F19720)" />
              <span>Kho Biển Số Shop</span>
            </Button>
          </div>
        </div>

        {/* Unified Quick Summary Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            padding: '12px 14px',
            background: 'var(--surface-sunken, #f8fafc)',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--border-subtle, #f1f5f9)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>Tổng kho biển VPA</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <strong style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-strong)' }}>{num(totalVpa)}</strong>
              <span style={{ fontSize: 11, color: 'var(--action-primary, #F19720)', fontWeight: 600 }}>Đấu giá VPA</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>Biển VPA đã duyệt giá</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <strong style={{ fontSize: 17, fontWeight: 800, color: 'var(--status-success-ink, #16a34a)' }}>{num(approvedVpa)}</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {totalVpa > 0 ? `(${Math.round((approvedVpa / totalVpa) * 100)}%)` : ''}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>Kho biển số hệ thống</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <strong style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-strong)' }}>{num(totalShop)}</strong>
              <span style={{ fontSize: 11, color: 'var(--action-primary, #F19720)', fontWeight: 600 }}>Cửa hàng</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>Biển Shop sẵn sàng bán</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <strong style={{ fontSize: 17, fontWeight: 800, color: 'var(--status-success-ink, #16a34a)' }}>{num(availableShop)}</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {totalShop > 0 ? `(${Math.round((availableShop / totalShop) * 100)}%)` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Main Tabs: [Dashboard Tổng Hợp & So Sánh Tỉ Lệ] vs [Biển đấu giá VPA] vs [Kho biển số hệ thống] */}
        <div
          role="tablist"
          aria-label="Phân hệ thống kê biển số"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderBottom: '2px solid var(--border-subtle, #e2e8f0)',
            paddingBottom: 0,
            marginTop: 4,
          }}
        >
          {/* Tab 1: Dashboard Tổng Hợp & So Sánh Tỉ Lệ */}
          <button
            type="button"
            role="tab"
            aria-selected={activeMainTab === 'overview'}
            onClick={() => setActiveMainTab('overview')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeMainTab === 'overview' ? 700 : 500,
              color: activeMainTab === 'overview' ? 'var(--action-primary, #F19720)' : 'var(--text-muted, #64748b)',
              borderBottom: `2.5px solid ${activeMainTab === 'overview' ? 'var(--action-primary, #F19720)' : 'transparent'}`,
              marginBottom: -2,
              transition: 'all 0.15s ease',
            }}
          >
            <BarChart3 size={16} />
            <span>1. Dashboard Tổng Hợp &amp; So Sánh Tỉ Lệ</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 9999,
                background: activeMainTab === 'overview' ? 'rgba(241,151,32,0.15)' : 'var(--surface-sunken)',
                color: activeMainTab === 'overview' ? 'var(--action-primary)' : 'var(--text-muted)',
              }}
            >
              {num(totalVpa + totalShop)}
            </span>
          </button>

          {/* Tab 2: Thống kê Biển đấu giá VPA */}
          <button
            type="button"
            role="tab"
            aria-selected={activeMainTab === 'vpa'}
            onClick={() => setActiveMainTab('vpa')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeMainTab === 'vpa' ? 700 : 500,
              color: activeMainTab === 'vpa' ? 'var(--action-primary, #F19720)' : 'var(--text-muted, #64748b)',
              borderBottom: `2.5px solid ${activeMainTab === 'vpa' ? 'var(--action-primary, #F19720)' : 'transparent'}`,
              marginBottom: -2,
              transition: 'all 0.15s ease',
            }}
          >
            <Landmark size={16} />
            <span>2. Thống kê Biển đấu giá VPA</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 9999,
                background: activeMainTab === 'vpa' ? 'rgba(241,151,32,0.15)' : 'var(--surface-sunken)',
                color: activeMainTab === 'vpa' ? 'var(--action-primary)' : 'var(--text-muted)',
              }}
            >
              {num(totalVpa)}
            </span>
          </button>

          {/* Tab 3: Kho biển số của chúng ta hiện tại */}
          <button
            type="button"
            role="tab"
            aria-selected={activeMainTab === 'shop'}
            onClick={() => setActiveMainTab('shop')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeMainTab === 'shop' ? 700 : 500,
              color: activeMainTab === 'shop' ? 'var(--action-primary, #F19720)' : 'var(--text-muted, #64748b)',
              borderBottom: `2.5px solid ${activeMainTab === 'shop' ? 'var(--action-primary, #F19720)' : 'transparent'}`,
              marginBottom: -2,
              transition: 'all 0.15s ease',
            }}
          >
            <CarFront size={16} />
            <span>3. Kho biển số của chúng ta hiện tại</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 9999,
                background: activeMainTab === 'shop' ? 'rgba(241,151,32,0.15)' : 'var(--surface-sunken)',
                color: activeMainTab === 'shop' ? 'var(--action-primary)' : 'var(--text-muted)',
              }}
            >
              {num(totalShop)}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Nội dung Tab 1: Dashboard Tổng Hợp & So Sánh Tỉ Lệ (Cross-inventory Benchmark & Comparison) */}
      {activeMainTab === 'overview' && (
        <UnifiedPlatesDashboardTab
          vpaStats={vpaStats}
          vpaCounts={vpaCounts}
          shopTotal={totalShop}
          shopAvailable={availableShop}
          shopHot={hotShop}
          onSwitchTab={(tab) => setActiveMainTab(tab)}
          onOpenExport={() => setExportModalOpen(true)}
          onQuickExport={(options) => handleExportChoice(options)}
          onOpenHistory={() => setHistoryModalOpen(true)}
          go={go}
        />
      )}

      {/* 3. Nội dung Tab 2: Biển đấu giá VPA */}
      {activeMainTab === 'vpa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Thanh chuyển đổi chuyên đề nội bộ VPA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--white, #ffffff)',
              borderRadius: 'var(--radius-pill, 9999px)',
              padding: '4px 6px',
              boxShadow: 'var(--shadow-inset-hairline, 0 1px 2px rgba(0,0,0,0.05))',
              width: 'fit-content',
              border: '1px solid var(--border-subtle, #e2e8f0)',
            }}
          >
            {vpaSubTabs.map((stItem) => {
              const active = vpaSubTab === stItem.key;
              return (
                <button
                  key={stItem.key}
                  type="button"
                  onClick={() => setVpaSubTab(stItem.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill, 9999px)',
                    border: 'none',
                    background: active ? 'var(--action-primary, #F19720)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-muted, #64748b)',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    boxShadow: active ? '0 1px 3px rgba(241,151,32,0.3)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {stItem.label}
                </button>
              );
            })}
          </div>

          {/* Render từng view chuyên đề VPA */}
          {vpaSubTab === 'inventory' && <InventoryOverviewTab go={go} patch={patch} st={st} />}
          {vpaSubTab === 'pricing' && <PricingManagementTab go={go} patch={patch} st={st} />}
          {vpaSubTab === 'geography' && <GeographyAndPlateTypesTab go={go} patch={patch} st={st} />}
          {vpaSubTab === 'market' && <AdminVpaMarket />}
        </div>
      )}

      {/* 4. Nội dung Tab 3: Kho biển số của chúng ta hiện tại */}
      {activeMainTab === 'shop' && <ShopPlatesStatsTab go={go} />}

      {/* 4. Modal Xuất dữ liệu Biển số Toàn diện */}
      <ExportOptionModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExportChoice}
        onOpenHistory={() => setHistoryModalOpen(true)}
        totalCount={totalVpa + totalShop}
        counts={{
          all: totalVpa + totalShop,
          vpa: totalVpa,
          available: approvedVpa + availableShop,
          shop: totalShop,
        }}
      />

      {/* 5. Modal Lịch sử xuất file biển số (Lưu trữ 30 ngày) */}
      <ExportHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  );
}
