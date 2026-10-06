import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import VpaPlatesTable from './vpa/VpaPlatesTable.jsx';
import VpaOverview from './vpa/VpaOverview.jsx';

// Quản trị biển đấu giá VPA (UC49): hàng đợi duyệt giá, danh sách biển (kể cả hết hạn nội bộ), cấu hình đồng bộ (super-admin).
export default function AdminVpa({ notify, isSuperAdmin }) {
  const tabs = [
    { key: 'queue', label: 'Duyệt giá', render: () => <VpaPlatesTable key="queue" queue notify={notify} /> },
    { key: 'plates', label: 'Biển VPA', render: () => <VpaPlatesTable key="plates" notify={notify} /> },
    { key: 'sync', label: 'Đồng bộ & cấu hình', render: () => <VpaOverview notify={notify} isSuperAdmin={isSuperAdmin} /> },
  ];
  return <AdminTabbedPage tabs={tabs} initialTab="queue" />;
}
