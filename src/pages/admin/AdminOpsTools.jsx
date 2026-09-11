import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import AdminFeatureFlags from './AdminFeatureFlags.jsx';
import AdminMaintenance from './AdminMaintenance.jsx';
import AdminDbConsole from './AdminDbConsole.jsx';

// Gộp 3 công cụ vận hành kỹ thuật khác nhau (Feature flags/Bảo trì/DB console) thành 1 trang 3 tab
// — giảm mục sidebar, chấp nhận chức năng khác biệt nằm chung vì đều là "công cụ dành cho quản trị viên kỹ thuật".
export default function AdminOpsTools({ notify, patch }) {
  return (
    <AdminTabbedPage
      tabs={[
        { key: 'flags', label: 'Feature flags', render: () => <AdminFeatureFlags notify={notify} /> },
        { key: 'maintenance', label: 'Bảo trì', render: () => <AdminMaintenance notify={notify} patch={patch} /> },
        { key: 'db', label: 'DB console', render: () => <AdminDbConsole notify={notify} /> },
      ]}
    />
  );
}
