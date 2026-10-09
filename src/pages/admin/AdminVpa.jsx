import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import VpaAdminList from './vpa/VpaAdminList.jsx';
import VpaOverview from './vpa/VpaOverview.jsx';
import VpaAuctionResults from './vpa/VpaAuctionResults.jsx';

// Quản trị biển đấu giá VPA (UC49): cùng giao diện/công cụ với trang Biển số. Tab: danh sách (kể cả hết hạn nội bộ),
// hàng đợi duyệt giá, kết quả đấu giá (bảng riêng, cào cả Ô tô/Xe máy), cấu hình đồng bộ (super-admin).
export default function AdminVpa({ notify, isSuperAdmin, go }) {
  const tabs = [
    { key: 'plates', label: 'Danh sách biển VPA', render: () => <VpaAdminList key="plates" notify={notify} /> },
    { key: 'queue', label: 'Duyệt giá', render: () => <VpaAdminList key="queue" queue notify={notify} /> },
    { key: 'auction-results', label: 'Kết quả đấu giá', render: () => <VpaAuctionResults /> },
    { key: 'sync', label: 'Đồng bộ & cấu hình', render: () => <VpaOverview notify={notify} isSuperAdmin={isSuperAdmin} /> },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <AdminTabbedPage tabs={tabs} initialTab="plates" />
    </div>
  );
}
