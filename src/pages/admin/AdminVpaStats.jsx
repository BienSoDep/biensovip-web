import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import AdminVpaMarket from './AdminVpaMarket.jsx';
import InventoryOverviewTab from './vpaStats/InventoryOverviewTab.jsx';
import PricingManagementTab from './vpaStats/PricingManagementTab.jsx';
import GeographyAndPlateTypesTab from './vpaStats/GeographyAndPlateTypesTab.jsx';

export default function AdminVpaStats({ go, patch, st }) {
  const tabs = [
    {
      key: 'inventory',
      label: 'Tổng quan Kho & Vận hành',
      render: () => <InventoryOverviewTab go={go} patch={patch} st={st} />
    },
    {
      key: 'pricing',
      label: 'Quản trị Giá & Tiến độ duyệt',
      render: () => <PricingManagementTab go={go} patch={patch} st={st} />
    },
    {
      key: 'geography',
      label: 'Cơ cấu Tỉnh & Loại biển',
      render: () => <GeographyAndPlateTypesTab go={go} patch={patch} st={st} />
    },
    {
      key: 'market',
      label: 'Phân tích Thị trường & Dự báo',
      render: () => <AdminVpaMarket />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <AdminTabbedPage tabs={tabs} initialTab="inventory" />
    </div>
  );
}
