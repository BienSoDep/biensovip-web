// Ghi song song vào DB Biensovip (khác GA4) — cùng interface { name, track(eventName, params) } nên
// đăng ký thêm ở TrackingService.js mà không phải sửa 25 chỗ gọi trackXxx() hiện có.
// Session/page-view do usePathRouter.js gọi initSession()/trackPageView() riêng (không qua track()
// generic vì cần biết SessionId để gắn PageViewId cho event) — xem docs kế hoạch zazzy-finding-spark.

const BASE_URL = import.meta.env.VITE_API_URL || '';
const ANON_ID_KEY = 'bsd_anon_id';
const SESSION_KEY = 'bsd_analytics_session'; // sessionStorage — { sessionId, pageViewId, expiresAt }
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 phút không hoạt động = phiên mới, giống hành vi GA4 mặc định

function getAnonId() {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.sessionId || Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* ignore */ }
}

function detectDevice() {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua) || window.matchMedia?.('(max-width: 768px)').matches) return 'mobile';
  return 'desktop';
}

function detectBrowser() {
  const ua = navigator.userAgent || '';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/')) return 'Safari';
  return 'Unknown';
}

async function postJson(path, body) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return json?.data ?? null;
  } catch {
    return null; // Lỗi tracking không được chặn luồng nghiệp vụ chính.
  }
}

async function ensureSession() {
  const existing = loadSession();
  if (existing) return existing;

  const params = new URLSearchParams(window.location.search);
  const data = await postJson('/api/analytics/session/start', {
    anonId: getAnonId(),
    entryScreen: window.__bsdCurrentScreen || 'home',
    entryUrl: window.location.pathname + window.location.search,
    referrer: document.referrer || null,
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    device: detectDevice(),
    browser: detectBrowser(),
    screenWidth: window.screen?.width || null,
    screenHeight: window.screen?.height || null,
  });
  if (!data?.sessionId) return null;

  const session = { sessionId: data.sessionId, pageViewId: null, expiresAt: Date.now() + SESSION_TTL_MS };
  saveSession(session);
  return session;
}

// Gọi từ usePathRouter.js mỗi lần đổi screen (bỏ qua màn admin — caller tự lọc ADMIN_SCREENS).
export async function trackPageView(screen, url) {
  const session = await ensureSession();
  if (!session) return;

  const data = await postJson('/api/analytics/pageview', { sessionId: session.sessionId, screen, url });
  if (!data?.pageViewId) return;

  saveSession({ ...session, pageViewId: data.pageViewId, expiresAt: Date.now() + SESSION_TTL_MS });
}

export function updateScrollDepth(pct) {
  const session = loadSession();
  if (!session?.pageViewId) return;
  const url = `${BASE_URL}/api/analytics/pageview/${session.pageViewId}/scroll`;
  const body = JSON.stringify({ pct });
  // sendBeacon không cho set Content-Type JSON trực tiếp nhưng backend chỉ đọc body — đủ dùng, không cần retry.
  if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
  else fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

// Đóng phiên khi tab đóng/ẩn đột ngột — sendBeacon không bị hủy khi trang unload (khác fetch thường).
export function closeSessionBeacon(exitScreen) {
  const session = loadSession();
  if (!session) return;
  const url = `${BASE_URL}/api/analytics/session/${session.sessionId}/heartbeat`;
  const body = JSON.stringify({ exitScreen });
  if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
}

export const biensovipDbProvider = {
  name: 'biensovip-db',
  track(eventName, params) {
    // Fire-and-forget — không await trong track() vì TrackingService.track() đồng bộ.
    ensureSession().then((session) => {
      if (!session) return;
      postJson('/api/analytics/event', {
        sessionId: session.sessionId,
        pageViewId: session.pageViewId || null,
        eventName,
        eventData: params && Object.keys(params).length ? JSON.stringify(params) : null,
      });
    });
  },
};
