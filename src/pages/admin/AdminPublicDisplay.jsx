import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import AdminVanityMetrics from './AdminVanityMetrics.jsx';
import AdminPlateSortSettings from './AdminPlateSortSettings.jsx';

// Gộp Số liệu hiển thị + Thứ tự sắp xếp — cùng là cấu hình HIỂN THỊ trang public, không đổi data thật.
export default function AdminPublicDisplay({ notify }) {
  return (
    <AdminTabbedPage
      tabs={[
        { key: 'metrics', label: 'Số liệu', render: () => <AdminVanityMetrics notify={notify} /> },
        { key: 'sort', label: 'Thứ tự sắp xếp', render: () => <AdminPlateSortSettings notify={notify} /> },
      ]}
    />
  );
}
