# Kế hoạch Lazy Loading + Skeleton — Biensovip.com

> Ngày lập: 2026-08-07 | Toàn bộ custom, không dùng thư viện ngoài (skeleton, spinner tự viết bằng CSS/JSX)

---

## Mục lục
- [Hiện trạng](#hiện-trạng)
- [Phạm vi đã chốt](#phạm-vi-đã-chốt)
- [Kiến trúc chung](#kiến-trúc-chung)
- [Phase 1: Route code-splitting](#phase-1-route-code-splitting)
- [Phase 2: Skeleton components](#phase-2-skeleton-components)
- [Phase 3: Progressive render cho list/grid](#phase-3-progressive-render-cho-listgrid)
- [Phase 4: Ảnh lazy load](#phase-4-ảnh-lazy-load)
- [Phase 5: Modal/Drawer lazy](#phase-5-modaldrawer-lazy)
- [File sẽ đụng đến](#file-sẽ-đụng-đến)
- [Checklist](#checklist)

---

## Hiện trạng

- **Data**: hoàn toàn mock tĩnh trong `src/lib/mockData.js` — không có fetch/API thật, không có độ trễ mạng tự nhiên
- **Routing**: `App.jsx` import eager toàn bộ ~30 page components ở đầu file — bundle 432KB tải hết ngay lần đầu
- **Ảnh**: chỉ xuất hiện ở Blog/Post (`img.src` từ Unsplash) và About (portrait) — đã có `loading="lazy"` native trên Blog, thiếu ở Post/About
- **Biển số (PlateCard, PlateVisual)**: render bằng CSS/div, không phải ảnh — không cần lazy-load ảnh, nhưng render 12+ card cùng lúc vẫn tốn work
- **Modal nặng**: `AiChatbot.jsx`, `Modals.jsx` (buy modal), `Compose.jsx` (admin editor) — luôn nằm trong bundle chính dù nhiều user không bao giờ mở

## Phạm vi đã chốt

| # | Hạng mục | Quyết định |
|---|----------|-----------|
| 1 | Skeleton trigger | Giả lập delay ngắn 200–500ms khi chuyển trang/lọc — mô phỏng cảm giác tải dữ liệu thật |
| 2 | Route/trang | Code-splitting bằng `React.lazy` + `Suspense`, mỗi trang 1 chunk riêng |
| 3 | Ảnh | Lazy load bằng `loading="lazy"` + custom fade-in khi ảnh load xong + skeleton placeholder trong lúc chờ |
| 4 | List/Grid dài | Progressive render — biển số/blog card xuất hiện dần (staggered), không phải render hết 1 lượt |
| 5 | Modal/Drawer nặng | `AiChatbot`, buy `Modal`, admin `Compose` tách lazy chunk riêng, chỉ tải khi user mở |

## Kiến trúc chung

Toàn bộ tự viết, không cài thêm package. 3 khối mới:

```
src/
  components/
    skeletons/
      SkeletonBase.jsx       # primitive: khối bo góc có shimmer animation
      PlateCardSkeleton.jsx  # khung xương đúng layout PlateCard
      PostCardSkeleton.jsx   # khung xương đúng layout blog card
      PageSkeleton.jsx       # full-page skeleton khi route chunk đang tải (Suspense fallback)
      DetailSkeleton.jsx     # khung xương trang chi tiết biển số
    LazyImage.jsx            # <img> custom: skeleton -> fade-in khi load xong, IntersectionObserver
  hooks/
    useDelayedLoading.js     # giả lập độ trễ ngắn khi đổi filter/trang, trả về isLoading
    useStaggeredReveal.js    # progressive reveal cho list/grid (staggered CSS animation qua index)
  styles/
    skeleton.css             # shimmer keyframes + skeleton tokens
```

**Nguyên tắc:**
- Skeleton dùng CSS `@keyframes shimmer` tự viết (gradient sweep), không dùng lib
- `React.lazy` chỉ áp dụng cho page-level components và modal nặng — component nhỏ (Button, Badge...) giữ nguyên eager
- `useDelayedLoading` là hook dùng chung, nhận `deps` (mảng phụ thuộc) + `delay`, trả `{ isLoading }` — mô phỏng data đang "tải" mỗi khi filter/trang đổi
- Không đụng vào state logic hiện có (`st`, `patch`) — chỉ thêm lớp loading UI bên ngoài

---

## Phase 1: Route code-splitting

**Mục tiêu:** Bundle ban đầu chỉ tải Home + layout, các trang khác tải khi điều hướng tới.

### 1.1 — Chuyển toàn bộ `import` page trong App.jsx sang `React.lazy`

**File:** `src/App.jsx`

```jsx
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home.jsx'));
const PlateList = lazy(() => import('./pages/PlateList.jsx'));
const PlateDetail = lazy(() => import('./pages/PlateDetail.jsx'));
const Auth = lazy(() => import('./pages/Auth.jsx'));
// ... toàn bộ ~30 page + admin page
```

Giữ eager: `Header`, `Footer`, `MobileDrawer`, `Breadcrumb`, `ErrorBoundary` — layout luôn cần ngay.

### 1.2 — Bọc route render bằng `<Suspense fallback={<PageSkeleton screen={s} />}>`

**File:** `src/App.jsx` — quanh toàn bộ khối `{s === 'home' && <Home .../>}` v.v.

```jsx
<Suspense fallback={<PageSkeleton screen={s} />}>
  {s === 'home' && <Home ... />}
  {s === 'list' && <PlateList ... />}
  {/* ... */}
</Suspense>
```

`PageSkeleton` nhận `screen` để render đúng hình dạng khung xương (list dùng `PlateCardSkeleton` lặp lại, detail dùng `DetailSkeleton`, còn lại dùng khung generic).

### 1.3 — Admin routes lazy riêng nhóm

**File:** `src/App.jsx`, `src/layout/AdminShell.jsx`

Admin chunk tách hẳn khỏi public chunk — user thường không bao giờ vào `/admin`.

**Kiểm tra:** `npm run build`, xem `dist/assets/` sinh nhiều file `.js` nhỏ thay vì 1 file 432KB. DevTools Network tab: vào Home chỉ tải chunk Home, bấm "Biển số" mới thấy chunk PlateList tải thêm.

---

## Phase 2: Skeleton components

**Mục tiêu:** Khung xương khớp layout thật, có shimmer, dùng chung cho cả Suspense fallback lẫn delay giả lập.

### 2.1 — `SkeletonBase.jsx` — primitive

```jsx
export default function SkeletonBase({ width = '100%', height = 16, radius = 'var(--radius-md)', style }) {
  return <div className="skeleton-shimmer" style={{ width, height, borderRadius: radius, ...style }} />;
}
```

### 2.2 — `skeleton.css` — shimmer animation tự viết

```css
.skeleton-shimmer{
  background: linear-gradient(90deg, var(--surface-sunken) 25%, var(--surface-muted) 37%, var(--surface-sunken) 63%);
  background-size: 400% 100%;
  animation: skeleton-sweep 1.4s ease-in-out infinite;
}
@keyframes skeleton-sweep{
  0%{background-position:100% 50%}
  100%{background-position:0 50%}
}
@media(prefers-reduced-motion:reduce){
  .skeleton-shimmer{animation:none;background:var(--surface-sunken)}
}
```

### 2.3 — `PlateCardSkeleton.jsx` — khớp layout `PlateCard.jsx`

Cùng cấu trúc: badge row → plate visual box → info block → CTA row, toàn bộ bằng `SkeletonBase` với kích thước tương ứng.

### 2.4 — `PostCardSkeleton.jsx` — khớp layout blog card

Ảnh 170px height → badge+date row → title 2 dòng → excerpt 2 dòng.

### 2.5 — `DetailSkeleton.jsx` — khớp `PlateDetail.jsx`

Gallery box lớn → info column (badge, title, price box, CTA, fengshui box, spec grid 2x2).

### 2.6 — `PageSkeleton.jsx` — dispatcher cho Suspense fallback

```jsx
export default function PageSkeleton({ screen }) {
  if (screen === 'list') return <ListSkeletonLayout />; // grid PlateCardSkeleton x8
  if (screen === 'detail') return <DetailSkeleton />;
  if (screen === 'blog') return <BlogSkeletonLayout />; // grid PostCardSkeleton x6
  return <GenericPageSkeleton />; // vài block chung chung: heading + paragraph + card
}
```

**Kiểm tra:** Throttle network (Slow 3G trong DevTools), điều hướng giữa các trang — thấy skeleton đúng hình dạng trang đích trước khi nội dung thật hiện ra.

---

## Phase 3: Progressive render cho list/grid

**Mục tiêu:** Card xuất hiện dần theo thứ tự (staggered), không phải "bụp" hết cùng lúc — cảm giác chuyên nghiệp hơn plain render.

### 3.1 — `useDelayedLoading.js` — giả lập độ trễ khi đổi filter/trang

```jsx
import { useEffect, useState } from 'react';

export function useDelayedLoading(deps, delay = 300) {
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), delay);
    return () => clearTimeout(t);
  }, deps);
  return isLoading;
}
```

Dùng trong `PlateList.jsx`:
```jsx
const isLoading = useDelayedLoading([st.cat, st.q, st.cities, st.catFilters, st.vehicle, st.sort, page], 300);
```
Khi `isLoading`, render `PlateCardSkeleton` × số lượng `pageItems.length` (hoặc cố định 8) thay vì `PlateCard` thật.

### 3.2 — `useStaggeredReveal.js` — animation xuất hiện dần

```jsx
export function useStaggeredReveal(count, stepMs = 40) {
  return (index) => ({ animation: `cardIn 260ms var(--ease-out) both`, animationDelay: `${index * stepMs}ms` });
}
```

CSS mới trong `app.css`:
```css
@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
```

Áp dụng: `PlateList.jsx`, `Home.jsx` (featured grid), `Blog.jsx` — style inline `animationDelay` theo index khi map.

**Kiểm tra:** Đổi filter trên List — skeleton hiện ~300ms rồi card thật xuất hiện lần lượt từ trái qua phải, trên xuống dưới thay vì đồng loạt.

---

## Phase 4: Ảnh lazy load

**Mục tiêu:** Ảnh thật (Blog/Post/About) có skeleton placeholder + fade-in mượt khi tải xong, dùng `IntersectionObserver` tự viết thay vì chỉ dựa `loading="lazy"` browser.

### 4.1 — `LazyImage.jsx` — component dùng chung

```jsx
import { useEffect, useRef, useState } from 'react';

export default function LazyImage({ src, alt, style, imgStyle, skeletonHeight }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setInView(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {!loaded && <SkeletonBase width="100%" height={skeletonHeight || '100%'} radius={0} style={{ position: 'absolute', inset: 0 }} />}
      {inView && (
        <img
          src={src} alt={alt} loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 320ms var(--ease-out)', ...imgStyle }}
        />
      )}
    </div>
  );
}
```

### 4.2 — Áp dụng vào Blog, Post, About

**File:** `src/pages/Blog.jsx` — thay `<img loading="lazy" .../>` bằng `<LazyImage src={p.img} alt={p.imgAlt} skeletonHeight={170} .../>`

**File:** `src/pages/Post.jsx` — ảnh cover bài viết

**File:** `src/pages/About.jsx` — ảnh portrait dòng 63

**Kiểm tra:** Throttle network, cuộn xuống Blog — thấy skeleton từng card, ảnh fade-in khi cuộn tới gần (200px trước viewport, không đợi cuộn hẳn tới).

---

## Phase 5: Modal/Drawer lazy

**Mục tiêu:** Chatbot, buy modal, admin Compose editor không nằm trong bundle chính.

### 5.1 — `AiChatbot.jsx` lazy

**File:** `src/App.jsx`

```jsx
const AiChatbot = lazy(() => import('./components/AiChatbot.jsx'));
```

Bọc `<Suspense fallback={null}>` quanh `<AiChatbot />` — nút FAB không cần skeleton (nó là nút nổi, ẩn hiện không quan trọng để lộ khung xương).

### 5.2 — `Modals.jsx` (buy modal) lazy + skeleton nhẹ

```jsx
const Modals = lazy(() => import('./layout/Modals.jsx'));
```
Suspense fallback: overlay mờ + `SkeletonBase` khung modal — vì đây là hành động user chủ động bấm "Gọi ngay", cần phản hồi thấy được ngay cả khi chunk đang tải.

### 5.3 — `Compose.jsx` (admin editor) lazy

Đã nằm trong nhóm admin lazy ở Phase 1.3, không cần làm riêng.

**Kiểm tra:** Throttle network, bấm "Gọi ngay" trên PlateCard — thấy skeleton modal brief rồi modal thật hiện, không bị "đứng hình" trắng trang.

---

## File sẽ đụng đến

| File | Phase | Loại thay đổi |
|------|-------|---------------|
| `src/App.jsx` | 1, 5 | `React.lazy` toàn bộ page + Suspense wrapper |
| `src/layout/AdminShell.jsx` | 1 | Lazy admin sub-routes |
| `src/components/skeletons/*.jsx` (mới) | 2 | 5 file skeleton components |
| `src/styles/skeleton.css` (mới) | 2 | Shimmer keyframes |
| `src/hooks/useDelayedLoading.js` (mới) | 3 | Hook giả lập delay |
| `src/hooks/useStaggeredReveal.js` (mới) | 3 | Hook stagger animation |
| `src/pages/PlateList.jsx` | 3 | Tích hợp skeleton + stagger |
| `src/pages/Home.jsx` | 3 | Stagger cho featured grid |
| `src/pages/Blog.jsx` | 3, 4 | Stagger + LazyImage |
| `src/components/LazyImage.jsx` (mới) | 4 | Component ảnh lazy dùng chung |
| `src/pages/Post.jsx` | 4 | Dùng LazyImage cho ảnh cover |
| `src/pages/About.jsx` | 4 | Dùng LazyImage cho portrait |
| `src/components/AiChatbot.jsx`, `src/layout/Modals.jsx` | 5 | Lazy import |
| `src/styles/app.css` | 3 | `@keyframes cardIn` |

---

## Checklist

### Trước khi bắt đầu
- [ ] Baseline bundle size hiện tại: 432KB JS / 11KB CSS (đã đo ở lần build gần nhất)
- [ ] `npx playwright test` — 86/86 pass baseline

### Sau Phase 1 (route splitting)
- [ ] `npm run build` — thấy nhiều chunk `.js` nhỏ thay vì 1 file lớn
- [ ] Network tab: vào `/` chỉ tải Home chunk, không tải List/Detail/Admin
- [ ] Chuyển trang thấy `PageSkeleton` brief khi throttle network

### Sau Phase 2 (skeleton components)
- [ ] Mỗi skeleton khớp layout thật (không lệch chiều cao gây "nhảy" layout khi swap sang nội dung thật)
- [ ] `prefers-reduced-motion: reduce` tắt shimmer animation

### Sau Phase 3 (progressive render)
- [ ] Đổi filter trên List: skeleton ~300ms → card thật xuất hiện staggered
- [ ] Không lặp lại tình trạng "giật" layout

### Sau Phase 4 (lazy image)
- [ ] Blog/Post/About: ảnh có skeleton, fade-in khi load, chỉ tải khi gần viewport
- [ ] Ảnh lỗi/404 không crash (giữ nguyên fallback hiện có nếu có)

### Sau Phase 5 (modal lazy)
- [ ] Bấm "Gọi ngay"/mở chatbot: không bị đứng hình, có phản hồi tức thì (skeleton/fallback)

### Cuối cùng
- [ ] `npm run build` — so sánh bundle size trước/sau (kỳ vọng: chunk Home nhỏ hơn nhiều so với 432KB gộp)
- [ ] `npx playwright test` — 86/86 pass, không regression
- [ ] Test tay: throttle Slow 3G, đi qua toàn bộ site — không có màn hình trắng giữa các bước điều hướng

---

## Ghi chú

- **Không cài package mới** — toàn bộ shimmer/skeleton/stagger tự viết bằng CSS + React hook, đúng yêu cầu "custom"
- **`React.lazy` là built-in React**, không tính là thư viện ngoài
- **Giả lập delay chỉ ở Phase 3** (filter/trang) — Phase 1 (route chunk) và Phase 4 (ảnh) dùng độ trễ mạng *thật* (network/parse chunk), không cần giả lập thêm
- **Không đụng animation hero hiện có** (`heroAnim`, `fanLeft/fanRight/fanMain`) — đó là animation xuất hiện ban đầu, khác mục đích với skeleton loading
