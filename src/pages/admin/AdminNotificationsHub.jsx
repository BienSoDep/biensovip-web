import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import AdminNotifications from './AdminNotifications.jsx';
import EmailBuilder from './EmailBuilder.jsx';
import { canPerm } from '../../layout/AdminShell.jsx';

// Gộp Thông báo (gửi thủ công + cấu hình email tự động) + Mẫu email (dựng bố cục) — liên quan trực tiếp.
// Tab "Mẫu email" ẩn nếu user không có quyền email_templates:view (backend RequireResourcePermission("email_templates")).
export default function AdminNotificationsHub({ st, notify }) {
  const templatesAllowed = !st || canPerm(st, 'email_templates:view');
  const tabs = [
    { key: 'send', label: 'Gửi thông báo', render: () => <AdminNotifications notify={notify} st={st} /> },
  ];
  if (templatesAllowed) tabs.push({ key: 'templates', label: 'Mẫu email', render: () => <EmailBuilder notify={notify} /> });
  return <AdminTabbedPage tabs={tabs} />;
}
