import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-5)', padding: 'var(--pad-page)', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--rose-100)', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>!</div>
          <div>
            <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>Đã xảy ra lỗi</h1>
            <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>Vui lòng thử tải lại trang. Nếu vẫn gặp lỗi, liên hệ admin.</p>
          </div>
          <button onClick={() => { this.setState({ error: null }); window.location.hash = '#/'; }} style={{ border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', padding: '10px 24px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}>Thử lại</button>
        </div>
      );
    }
    return this.props.children;
  }
}
