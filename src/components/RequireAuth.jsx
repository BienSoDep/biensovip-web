export default function RequireAuth({ st, go, children }) {
  // ponytail: guard checks st.isAdmin (admin-only). Full token-based auth when backend ready.
  if (!st.isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-5)', padding: 'var(--pad-page)', textAlign: 'center' }}>
        <h1 style={{ margin: 0, font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>Yêu cầu đăng nhập</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>Vui lòng đăng nhập để truy cập trang quản trị.</p>
        <button onClick={go('adminLogin')} style={{ border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', padding: '10px 24px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}>Đăng nhập</button>
      </div>
    );
  }
  return children;
}
