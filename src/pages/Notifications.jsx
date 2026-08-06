import Button from '../components/Button.jsx';

export default function Notifications({ st, go }) {
  const list = st.notifications || [];
  const unread = list.filter((n) => !n.read).length;

  return (
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ flex: '1 1 320px' }}>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Thông báo</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{unread ? `${unread} thông báo chưa đọc.` : 'Bạn đã đọc hết thông báo.'}</p>
      </div>

      {list.length === 0 ? (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '72px var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có thông báo nào</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 380 }}>Tin về biển số mới, giá và khuyến mãi sẽ xuất hiện ở đây.</span>
          <Button variant="primary" size="md" onClick={go('list')}>Khám phá kho biển số</Button>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {list.map((n) => (
            <div key={n.id} style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', gap: 'var(--space-3)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <span style={{ width: 8, height: 8, marginTop: 6, borderRadius: '50%', flexShrink: 0, background: n.read ? 'var(--grey-300)' : 'var(--action-primary)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{n.title}</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{n.body}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
