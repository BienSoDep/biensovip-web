import { useEffect, useState } from 'react';
import { loadAuth } from '../lib/authStore.js';
import { tryRefreshToken } from '../services/apiClient.js';

// Kiểm tra hết hạn JWT client-side (payload exp, giây). Không verify chữ ký — server làm việc đó.
function tokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !payload.exp || payload.exp * 1000 < Date.now();
  } catch { return true; }
}

export default function RequireAuth({ st, go, children }) {
  // UC08 — guard cần token hợp lệ, không chỉ cờ client st.isAdmin (có thể bị cũ/giả).
  const auth = loadAuth();
  const accessExpired = !auth?.accessToken || tokenExpired(auth.accessToken);
  // Access token sống ngắn (15 phút) — mở lại tab sau khi để lâu gần như luôn thấy hết hạn dù vẫn còn
  // phiên hợp lệ. Trước đây đá thẳng về /login ngay khi accessExpired, trong lúc các request dở dang
  // của trang cũ vẫn tự 401→refresh qua apiClient — hai luồng đua nhau gây nháy/giật khi mở lại tab.
  // Giờ thử refresh ở đây trước, chỉ coi là "chưa đăng nhập" khi refresh cũng thất bại.
  const [checking, setChecking] = useState(() => !!st.isAdmin && accessExpired && !!auth?.refreshToken);
  const [refreshed, setRefreshed] = useState(false);

  useEffect(() => {
    if (!st.isAdmin || !accessExpired || !auth?.refreshToken) { setChecking(false); return; }
    let cancelled = false;
    setChecking(true);
    tryRefreshToken().then((token) => {
      if (cancelled) return;
      setRefreshed(!!token);
      setChecking(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lại khi accessExpired đổi, không theo auth object mới mỗi render
  }, [accessExpired, st.isAdmin]);

  const authed = !!st.isAdmin && !checking && (!accessExpired || refreshed);

  useEffect(() => {
    if (!checking && !authed) go('login')();
  }, [checking, authed, go]);

  return authed ? children : null;
}
