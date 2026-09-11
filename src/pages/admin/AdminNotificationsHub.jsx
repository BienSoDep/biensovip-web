import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import AdminNotifications from './AdminNotifications.jsx';
import EmailBuilder from './EmailBuilder.jsx';

// Gộp Thông báo (gửi thủ công + cấu hình email tự động) + Mẫu email (dựng bố cục) — liên quan trực tiếp.
export default function AdminNotificationsHub({ st, notify }) {
  return (
    <AdminTabbedPage
      tabs={[
        { key: 'send', label: 'Gửi thông báo', render: () => <AdminNotifications notify={notify} st={st} /> },
        { key: 'templates', label: 'Mẫu email', render: () => <EmailBuilder notify={notify} /> },
      ]}
    />
  );
}
