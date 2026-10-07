import { useCallback, useState } from 'react';
import { loadAuth } from '../lib/authStore.js';

const KEY = 'bsd_birth_year';

// Nam sinh de lam noi bien hop menh: uu tien ngay sinh trong ho so da dang nhap; khach chua co thi nhap nhanh va nho trong trinh duyet.
function profileYear() {
  const d = loadAuth()?.user?.birthDate;
  const y = d ? Number(String(d).slice(0, 4)) : 0;
  return y >= 1900 ? y : null;
}

function localYear() {
  try { const y = Number(localStorage.getItem(KEY)); return y >= 1900 ? y : null; } catch { return null; }
}

export function useBirthYear() {
  const [local, setLocal] = useState(localYear);
  const profile = profileYear();
  const set = useCallback((y) => {
    try { if (y) localStorage.setItem(KEY, String(y)); else localStorage.removeItem(KEY); } catch { /* storage bi chan: chi giu trong phien */ }
    setLocal(y || null);
  }, []);
  return { year: profile || local, fromProfile: !!profile, setYear: set };
}
