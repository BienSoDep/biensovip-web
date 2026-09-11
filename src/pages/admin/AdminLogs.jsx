import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import AdminAuditLog from './AdminAuditLog.jsx';
import AdminErrorLogs from './AdminErrorLogs.jsx';
import AdminRiskLog from './AdminRiskLog.jsx';
import { canPerm } from '../../layout/AdminShell.jsx';

// Gộp 3 trang log/audit thành 1 trang 3 tab — cùng dạng xem-lại-lịch-sử (bảng list + filter).
// Rủi ro CTV chỉ super-admin thấy (giữ đúng gate cũ ở AdminShell.canSee); tab Lỗi theo quyền error_logs:view.
export default function AdminLogs({ st, notify }) {
  const isSuperAdmin = st.user?.role === 'super-admin';
  const tabs = [
    { key: 'audit', label: 'Hệ thống', render: () => <AdminAuditLog /> },
  ];
  if (canPerm(st, 'error_logs:view')) {
    tabs.push({ key: 'errors', label: 'Lỗi', render: () => <AdminErrorLogs /> });
  }
  if (isSuperAdmin) {
    tabs.push({ key: 'risk', label: 'Rủi ro CTV', render: () => <AdminRiskLog notify={notify} /> });
  }
  return <AdminTabbedPage tabs={tabs} />;
}
