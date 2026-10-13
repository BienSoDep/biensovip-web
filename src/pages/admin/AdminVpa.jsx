import { useState } from 'react';
import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import VpaAdminList from './vpa/VpaAdminList.jsx';
import VpaOverview from './vpa/VpaOverview.jsx';
import VpaAuctionResults from './vpa/VpaAuctionResults.jsx';
import VpaWorkflowGuide from './vpa/VpaWorkflowGuide.jsx';

// Quản trị biển đấu giá VPA (UC49): cùng giao diện/công cụ với trang Biển số. Tab: danh sách (kể cả hết hạn nội bộ),
// hàng đợi duyệt giá, kết quả đấu giá (bảng riêng, cào cả Ô tô/Xe máy), cấu hình đồng bộ (super-admin), hướng dẫn nút bấm.
export default function AdminVpa({ notify, isSuperAdmin, go }) {
  const [tabKey, setTabKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') || 'plates';
    }
    return 'plates';
  });

  const tabs = [
    { key: 'plates', label: 'Danh sách biển VPA', info: 'Danh sách toàn bộ biển đấu giá VPA (công bố, chính thức, sắp đấu giá hoặc hết hạn)', render: () => <VpaAdminList key="plates" notify={notify} onOpenGuide={() => setTabKey('guide')} /> },
    { key: 'queue', label: 'Duyệt giá', info: 'Hàng đợi duyệt giá: các biển có mức giá gợi ý AI chờ admin phê duyệt trước khi công khai', render: () => <VpaAdminList key="queue" queue notify={notify} onOpenGuide={() => setTabKey('guide')} /> },
    { key: 'auction-results', label: 'Kết quả đấu giá', info: 'Kho dữ liệu kết quả các phiên đấu giá đã kết thúc, dùng phân tích thị trường và định giá', render: () => <VpaAuctionResults /> },
    { key: 'sync', label: 'Đồng bộ & cấu hình', info: 'Cấu hình lịch trình tự động cào dữ liệu VPA, kiểm tra nguồn crawler và tính liêm chính', render: () => <VpaOverview notify={notify} isSuperAdmin={isSuperAdmin} /> },
    { key: 'guide', label: 'Hướng dẫn quy trình & nút bấm', info: 'Cẩm nang hướng dẫn chi tiết quy trình duyệt giá, mã màu trạng thái và chức năng nút bấm', render: () => <VpaWorkflowGuide onNavigateTab={(k) => setTabKey(k)} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <AdminTabbedPage activeTab={tabKey} tabs={tabs} onTabChange={setTabKey} />
    </div>
  );
}
