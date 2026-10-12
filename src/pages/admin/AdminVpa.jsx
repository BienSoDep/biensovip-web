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
    { key: 'plates', label: 'Danh sách biển VPA', render: () => <VpaAdminList key="plates" notify={notify} onOpenGuide={() => setTabKey('guide')} /> },
    { key: 'queue', label: 'Duyệt giá', render: () => <VpaAdminList key="queue" queue notify={notify} onOpenGuide={() => setTabKey('guide')} /> },
    { key: 'auction-results', label: 'Kết quả đấu giá', render: () => <VpaAuctionResults /> },
    { key: 'sync', label: 'Đồng bộ & cấu hình', render: () => <VpaOverview notify={notify} isSuperAdmin={isSuperAdmin} /> },
    { key: 'guide', label: 'Hướng dẫn quy trình & nút bấm', render: () => <VpaWorkflowGuide onNavigateTab={(k) => setTabKey(k)} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <AdminTabbedPage key={tabKey} tabs={tabs} initialTab={tabKey} onTabChange={setTabKey} />
    </div>
  );
}
