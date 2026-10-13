import { useState } from 'react';
import Button from '../components/Button.jsx';
import { Badge } from '../components/index.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';
import { useCollaboratorLogout } from '../services/collaboratorAuth.js';
import { useCollaboratorContacts, useLeaderboard } from '../services/collaborators.js';
import { loadAuth } from '../lib/authStore.js';
import { routeFor } from '../config/routes.js';
import { money, contactStageInfo } from '../components/collaborator/collaboratorUtils.js';
import ProcessSteps from '../components/collaborator/ProcessSteps.jsx';
import BenefitLanding from '../components/collaborator/BenefitLanding.jsx';
import Dashboard from '../components/collaborator/CtvDashboard.jsx';

// Trang riêng — chi tiết đầy đủ mọi khách CTV đã giới thiệu
export function CollaboratorCustomers({ go }) {
  const contacts = useCollaboratorContacts(true);
  const items = contacts.data?.contacts || [];

  return (
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <span style={{ display: 'block', font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>Khách hàng của tôi</span>
        <span style={{ display: 'block', marginTop: 4, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Toàn bộ khách đã liên hệ qua link/mã giới thiệu của bạn, kèm tiến độ và số tiền giao dịch.</span>
      </div>

      {contacts.isLoading && <SkeletonCard height={200} />}
      {!contacts.isLoading && contacts.isError && (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tải được danh sách khách.</span>
      )}
      {!contacts.isLoading && !contacts.isError && items.length === 0 && (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có khách nào liên hệ qua link/mã giới thiệu của bạn.</span>
      )}

      {items.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((c, i) => {
            const stage = contactStageInfo(c);
            return (
              <div key={c.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--gutter-card)', borderTop: i > 0 ? '1px solid var(--grey-100)' : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{c.fullName || '—'}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{c.phone || '—'}</span>
                  {c.email && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{c.email}</span>}
                  {c.plateNumber && (
                    c.plateId
                      ? <a href={routeFor('detail', c.plateId)} style={{ font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{c.plateNumber}</a>
                      : <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{c.plateNumber}</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  {c.transactionAmount != null && <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{money(c.transactionAmount)}</span>}
                  <Badge tone={stage.tone}>{stage.label}</Badge>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={() => go('collab')()}>← Quay lại trang Cộng tác viên</Button>
    </section>
  );
}

// Trang riêng bảng xếp hạng CTV tháng hiện tại
export function CollaboratorLeaderboard({ go }) {
  const { data, isLoading } = useLeaderboard();
  const items = data?.items || [];
  const me = data?.me;

  return (
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <span style={{ display: 'block', font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>Bảng xếp hạng CTV tháng này</span>
        <span style={{ display: 'block', marginTop: 4, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Xếp theo tổng hoa hồng đã duyệt/đã trả — không hiển thị số tiền cụ thể.</span>
      </div>
      {me && (
        <div style={{ background: 'var(--surface-inverse)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--white)' }}>Vị trí của bạn</span>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--white)' }}>#{me.rank} · {me.successfulDeals} giao dịch</span>
        </div>
      )}
      {isLoading ? (
        <SkeletonCard height={200} />
      ) : items.length === 0 ? (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có CTV nào có giao dịch trong tháng này.</span>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((it) => (
            <div key={it.rank} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px var(--gutter-card)', borderTop: it.rank > 1 ? '1px solid var(--grey-100)' : 'none' }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: it.rank <= 3 ? 'var(--action-primary)' : 'var(--text-strong)' }}>#{it.rank} {it.displayName}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{it.successfulDeals} giao dịch</span>
            </div>
          ))}
        </div>
      )}
      <Button variant="ghost" size="sm" onClick={() => go('collab')()}>← Quay lại trang Cộng tác viên</Button>
    </section>
  );
}

// Trang riêng cho quy trình nhận hoa hồng
export function CollaboratorProcess({ go }) {
  return (
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <ProcessSteps />
      <Button variant="ghost" size="sm" onClick={() => go('collab')()} style={{ marginTop: 'var(--space-6)' }}>← Quay lại trang Cộng tác viên</Button>
    </section>
  );
}

// Trang chính Cộng tác viên (Router điều phối)
export default function Collaborator({ go }) {
  const isCtv = () => Boolean(loadAuth()?.accessToken) && Boolean(loadAuth()?.user?.isCollaborator);
  const [loggedIn, setLoggedIn] = useState(() => isCtv());
  const collaboratorLogout = useCollaboratorLogout();

  const logout = () => { collaboratorLogout.mutate(undefined, { onSettled: () => setLoggedIn(false) }); };

  if (loggedIn) return <Dashboard onReset={logout} go={go} />;

  return <BenefitLanding go={go} onActivated={() => setLoggedIn(true)} />;
}
