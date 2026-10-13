import { useCallback, useState } from 'react';
import { loadAuth } from '../lib/authStore.js';

const KEY = 'bsd_birth_year';
const KEY_DATE = 'bsd_birth_date';

// Ngày sinh / năm sinh để làm nổi biển hợp mệnh: ưu tiên ngày sinh trong hồ sơ đã đăng nhập; khách chưa có thì nhập nhanh và nhớ trong trình duyệt.
function profileDate() {
  const d = loadAuth()?.user?.birthDate;
  if (!d) return null;
  const iso = String(d).slice(0, 10);
  return iso.length === 10 ? iso : null;
}

function profileYear() {
  const d = profileDate();
  const y = d ? Number(d.slice(0, 4)) : 0;
  return y >= 1900 ? y : null;
}

function localDate() {
  try {
    const d = localStorage.getItem(KEY_DATE);
    if (d && d.length === 10) return d;
    return null;
  } catch { return null; }
}

function localYear() {
  try {
    const d = localDate();
    if (d) {
      const y = Number(d.slice(0, 4));
      if (y >= 1900) return y;
    }
    const y = Number(localStorage.getItem(KEY));
    return y >= 1900 ? y : null;
  } catch { return null; }
}

export function useBirthYear() {
  const [localY, setLocalY] = useState(localYear);
  const [localD, setLocalD] = useState(localDate);
  const profYear = profileYear();
  const profDate = profileDate();

  const setBirth = useCallback((dateIso, yearNum) => {
    try {
      if (dateIso) localStorage.setItem(KEY_DATE, dateIso);
      else localStorage.removeItem(KEY_DATE);

      if (yearNum) localStorage.setItem(KEY, String(yearNum));
      else localStorage.removeItem(KEY);
    } catch { /* storage bị chặn */ }

    setLocalY(yearNum || null);
    setLocalD(dateIso || null);
  }, []);

  const activeDate = profDate || localD;
  const activeYear = profYear || (activeDate ? Number(activeDate.slice(0, 4)) : localY);

  return {
    year: activeYear,
    birthDate: activeDate,
    fromProfile: !!profYear,
    setYear: (y) => setBirth(null, y),
    setBirthDate: (dateIso) => {
      if (!dateIso) {
        setBirth(null, null);
      } else {
        const y = Number(dateIso.slice(0, 4));
        setBirth(dateIso, y);
      }
    },
  };
}
