import { Component, Fragment } from 'react';
import ContactChannelList from './ContactChannelList.jsx';

function isDynamicImportError(error) {
  const msg = String(error?.message || '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    error?.name === 'ChunkLoadError'
  );
}

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

    // Khi người dùng đang mở tab từ trước lúc deploy bản mới, các chunk hash cũ sẽ trả về 404
    // → Tự động reload để nạp index.html mới nhất có hash chunk cập nhật (chặn vòng lặp 10s).
    if (isDynamicImportError(error) && typeof window !== 'undefined') {
      const storageKey = 'last_chunk_reload';
      const lastReload = Number(sessionStorage.getItem(storageKey) || 0);
      if (Date.now() - lastReload > 10000) {
        sessionStorage.setItem(storageKey, String(Date.now()));
        window.location.reload();
      }
    }
  }

  handleRetry = () => {
    if (isDynamicImportError(this.state.error) && typeof window !== 'undefined') {
      window.location.reload();
      return;
    }
    this.setState((s) => ({ error: null, retryKey: s.retryKey + 1 }));
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error);
      const isChunk = isDynamicImportError(this.state.error);
      return (
        <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-8)', padding: 'var(--pad-page)', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--rose-100)', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>!</div>
            <div>
              <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>
                {isChunk ? 'Phiên bản mới đã sẵn sàng' : 'Đã xảy ra lỗi'}
              </h1>
              <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>
                {isChunk
                  ? 'Hệ thống vừa cập nhật phiên bản mới. Vui lòng tải lại trang để tiếp tục.'
                  : 'Vui lòng thử lại trang. Nếu vẫn gặp lỗi, liên hệ admin.'}
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{ border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', padding: '10px 24px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}
            >
              {isChunk ? 'Tải lại trang' : 'Thử lại'}
            </button>
          </div>
          {/* Không truyền `notify` — boundary bọc ngoài App, không có access tới hàm toast của App.
              ContactChannelList tự bỏ qua notify nếu thiếu (notify?.()). */}
          <div style={{ width: '100%', maxWidth: 560 }}>
            <p style={{ margin: '0 0 var(--space-3)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Trong lúc chờ khắc phục, bạn có thể liên hệ shop trực tiếp:</p>
            <ContactChannelList zaloSource="crash_fallback" />
          </div>
        </div>
      );
    }
    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>;
  }
}
