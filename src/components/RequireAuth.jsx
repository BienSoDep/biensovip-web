import { useEffect } from 'react';
import { loadAuth } from '../lib/authStore.js';

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
  const authed = !!st.isAdmin && !!auth?.accessToken && !tokenExpired(auth.accessToken);

  useEffect(() => {
    if (!authed) go('adminLogin')();
  }, [authed, go]);

  return authed ? children : null;
}
