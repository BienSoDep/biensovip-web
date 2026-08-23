import { Component, Fragment } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, retryKey: 0 };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // Audit P1: surface the failure instead of swallowing it.
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error);
      return (
        <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-5)', padding: 'var(--pad-page)', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--rose-100)', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>!</div>
          <div>
            <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>Đã xảy ra lỗi</h1>
            <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>Vui lòng thử lại trang. Nếu vẫn gặp lỗi, liên hệ admin.</p>
          </div>
          <button onClick={() => this.setState((s) => ({ error: null, retryKey: s.retryKey + 1 }))} style={{ border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', padding: '10px 24px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}>Thử lại</button>
        </div>
      );
    }
    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>;
  }
}
