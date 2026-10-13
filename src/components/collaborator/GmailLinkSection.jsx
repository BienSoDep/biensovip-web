import toast from 'react-hot-toast';
import Button from '../Button.jsx';
import { useGmailStatus, useGmailOAuthUrl, useUnlinkGmail } from '../../services/gmailLink.js';
import { loadAuth } from '../../lib/authStore.js';

export default function GmailLinkSection() {
  const isLoggedIn = Boolean(loadAuth()?.accessToken);
  const { data: status, isLoading } = useGmailStatus();
  const oauthUrl = useGmailOAuthUrl();
  const unlink = useUnlinkGmail();

  if (!isLoggedIn) {
    return (
      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-5) var(--gutter-card)' }}>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Đăng nhập bằng tài khoản CTV để liên kết Gmail gửi email cho khách.
        </span>
      </div>
    );
  }

  const startLink = () => {
    oauthUrl.mutate(undefined, {
      onSuccess: (data) => { window.location.href = data.url; },
      onError: (err) => toast.error(err.message || 'Không lấy được link liên kết Google, thử lại.'),
    });
  };

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Liên kết Gmail để gửi email</span>
      {isLoading ? (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>
      ) : status?.linked ? (
        <>
          {status.needsRelink && (
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-field)', background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning)' }}>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-warning-ink)' }}>
                Liên kết Gmail đã hết hạn hoặc bị thu hồi. Vui lòng liên kết lại để tiếp tục gửi email từ địa chỉ cá nhân.
              </span>
            </div>
          )}
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Đã liên kết: <b style={{ color: 'var(--text-strong)' }}>{status.email}</b>
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {status.needsRelink && <Button variant="primary" size="sm" onClick={startLink} loading={oauthUrl.isPending}>Liên kết lại</Button>}
            <Button variant="ghost" size="sm" onClick={() => unlink.mutate(undefined, { onError: (err) => toast.error(err.message || 'Hủy liên kết thất bại, thử lại.') })} loading={unlink.isPending}>Hủy liên kết</Button>
          </div>
        </>
      ) : (
        <>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa liên kết Gmail — soạn email cho khách sẽ dùng địa chỉ mặc định của hệ thống.</span>
          <Button variant="primary" size="sm" onClick={startLink} loading={oauthUrl.isPending}>Liên kết Google để gửi email</Button>
        </>
      )}
    </div>
  );
}
