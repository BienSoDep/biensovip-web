import { useEffect, useRef } from 'react';

let scriptPromise = null;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// UC29 — nút "Đăng nhập bằng Google" dùng chung Auth.jsx (khách hàng) + Collaborator.jsx (CTV).
// onCredential nhận id_token (JWT ký bởi Google) — component cha tự quyết gọi endpoint nào.
export default function GoogleSignInButton({ onCredential, disabled }) {
  const ref = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || disabled) return;
    let cancelled = false;
    loadGoogleScript().then(() => {
      if (cancelled || !ref.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: 320 });
    }).catch(() => { /* script load thất bại — nút không hiện, không crash trang */ });
    return () => { cancelled = true; };
  }, [clientId, disabled, onCredential]);

  // TẠM ẨN — redirect URI Google Cloud Console chưa đồng bộ domain production mới (biensovip.com).
  // Bật lại: xoá dòng return null này sau khi đã cập nhật Authorized redirect URIs.
  if (true) return null;
  if (!clientId) return null;
  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center' }} />;
}
