import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import AdminFeatureFlags from './AdminFeatureFlags.jsx';
import AdminMaintenance from './AdminMaintenance.jsx';
import AdminDbConsole from './AdminDbConsole.jsx';
import AdminServerMonitoring from './servers/AdminServerMonitoring.jsx';

// Gộp các công cụ vận hành kỹ thuật (Hạ tầng máy chủ/Feature flags/Bảo trì/DB console)
export default function AdminOpsTools({ notify, patch }) {
  return (
    <AdminTabbedPage
      subtabParam="subtab"
      tabs={[
        { key: 'servers', label: 'Máy chủ & Hạ tầng', render: () => <AdminServerMonitoring notify={notify} /> },
        { key: 'flags', label: 'Feature flags', render: () => <AdminFeatureFlags notify={notify} /> },
        { key: 'maintenance', label: 'Bảo trì', render: () => <AdminMaintenance notify={notify} patch={patch} /> },
        { key: 'db', label: 'DB console', render: () => <AdminDbConsole notify={notify} /> },
      ]}
    />
  );
}
