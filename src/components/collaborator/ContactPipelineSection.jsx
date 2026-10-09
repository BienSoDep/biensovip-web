import Button from '../Button.jsx';
import { Badge } from '../index.jsx';
import { money, contactStageInfo } from './collaboratorUtils.js';

export default function ContactPipelineSection({ contacts, go }) {
  const items = contacts.data?.contacts || [];
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Tiến độ khách đã liên hệ</span>
        {go && <Button variant="ghost" size="sm" onClick={go('collabCustomers')}>Xem chi tiết →</Button>}
      </div>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Mới liên hệ → Đang tư vấn → Đã cọc → Đã bán. "Đã bán" đối chiếu đúng trạng thái thật của biển số.</span>
      {contacts.isLoading && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>}
      {!contacts.isLoading && contacts.isError && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tải được tiến độ khách.</span>}
      {!contacts.isLoading && !contacts.isError && items.length === 0 && (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có khách nào liên hệ qua link/mã giới thiệu của bạn.</span>
      )}
      {items.slice(0, 5).map((c) => {
        const stage = contactStageInfo(c);
        return (
          <div key={c.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '10px 0', borderTop: '1px solid var(--grey-100)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)' }}>{c.fullName || '—'}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{c.phone || '—'}{c.plateNumber ? ` · ${c.plateNumber}` : ''}</span>
              {c.email && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {c.transactionAmount != null && <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{money(c.transactionAmount)}</span>}
              <Badge tone={stage.tone}>{stage.label}</Badge>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        );
      })}
      {items.length > 5 && go && (
        <Button variant="ghost" size="sm" onClick={go('collabCustomers')} fullWidth>Xem tất cả {items.length} khách →</Button>
      )}
    </div>
  );
}
