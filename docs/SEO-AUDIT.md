# SEO Audit & Optimization Plan — Biensovip.com

Ngày: 2026-08-07
Đối tượng: `biensovip-web` — SPA React 19 + Vite, hash routing, custom CSS, nội dung VI đã tách ra JSON.
Mục đích: tối ưu để Google thuật toán đưa website lên đầu khi tìm kiếm "biển số đẹp Đà Nẵng" và cụm từ liên quan.

> Tài liệu này là tổng hợp đầy đủ (phần tổng quan + phân tích sâu từng gốc rễ). Mỗi vấn đề kèm chứng cứ `file:dòng` và code trước/sau.

---

## 1. Tóm tắt mức độ ưu tiên

| Ưu tiên | Hạng mục | Ảnh hưởng |
|---|---|---|
| 🔴 CỰC KỲ QUAN TRỌNG | Chuyển hash-routing SPA → crawlable HTML | Google không index được nội dung như hiện tại |
| 🔴 CỰC KỲ QUAN TRỌNG | `robots.txt` + `sitemap.xml` | Google không biết có những trang nào |
| 🔴 CỰC KỲ QUAN TRỌNG | Product/Offer schema cho trang biển | Không có rich result, thua đối thủ |
| 🔴 CỰC KỲ QUAN TRỌNG | Bug: meta tĩnh không đổi khi chuyển biển | Title/desc/canonical sai trên trang sản phẩm |
| 🟠 Quan trọng | Meta title/desc/OG chuẩn + `og:image` | Click rate khi hiển thị trên Google |
| 🟠 Quan trọng | Sửa canonical cho khớp URL thật | Tránh Google báo canonical sai |
| 🟠 Quan trọng | `noindex` admin/auth | Không để trang nội bộ vào Google |
| 🟢 Nên làm | Tối ưu ảnh, lazy-load chuẩn, sitemap động, URL danh mục, E-E-A-T | Trải nghiệm + theo dõi + tín hiệu tin cậy |

---

## 2. VẤN ĐỀ GỐC — Hash routing + client-render (phải quyết định trước)

### Chuyện gì đang xảy ra
- Mọi URL dạng hash: `#/bien/p1`, `#/danh-sach`, `#/bai-viet/a1` (`src/config/routes.js`).
- `biensovip-web/index.html:13` — `<div id="root"></div>` **trống**. Content dựng sau khi JS chạy (`src/main.jsx:8-9`).
- `src/App.jsx:23-45` + `:365` — toàn bộ trang `lazy()` + `<Suspense>`.
- `title`/meta/OG chèn bằng JS trong `src/hooks/useSeo.js` sau khi load.

### Vì sao kẻ thù SEO #1
Google thấy `<div id="root">` trống (lấy `curl` URL biển → không có từ khóa, không Product schema). Googlebot render JS chậm, tốn ngân sách crawl, không đảm bảo đọc nổi từng biển — mà trang bán biển cần **mỗi biển một URL riêng** để index. Kết quả: ít nội dung, E-E-A-T thấp, không cạnh tranh nổi với đối thủ server-render/pre-render.

### 3 lựa chọn (bạn cần chốt)
1. **Giữ SPA + pre-render** (`vite-plugin-prerender` / `vite-react-ssg`) — tạo HTML tĩnh mỗi route public lúc build (`/`, `/danh-sach/`, `/bien/p1/`, `/bai-viet/a1/`). Không cần máy chủ SSR. Khớp kiến trúc hiện tại, chi phí thấp nhất. **Khuyến nghị.**
2. **Next.js (SSR/SSG)** — chuẩn nhất, thêm `metadata` API (title đổi tự động, hết bug mục 4), next/image (WebP + chống CLS), robots/sitemap cài sẵn. Nhưng **viết lại phần lớn**: `src/pages/*`, `useHashRouter`, `useSeo`, `App.jsx`, lazy chunking, test Playwright. Rủi ro cao. Dùng khi site mở rộng nhiều.
3. **Giữ nguyên (hash + CSR)** — không lên Google được. Không khả thi theo mục tiêu.

**So sánh nhanh:**

| Tiêu chí | React + pre-render | Next.js |
| --- | --- | --- |
| Google đọc được nội dung | ✅ HTML tĩnh khi build | ✅ SSR/SSG chuẩn |
| Công sức chuyển | Thấp (plugin + bỏ hash) | Cao (viết lại phần lớn) |
| Title/desc đổi đúng khi chuyển biển | Sửa dep `useSeo.js:67` (mục 4) | Free (`metadata`) |
| Image WebP + chống CLS | Thêm thủ công (mục 8) | Free (`next/image`) |
| robots.txt - sitemap | Tự viết (mục 3) | Hỗ trợ sẵn |
| Giữ code hiện tại | ✅ Giữ | Chuyển hướng |

> **Kết luận:** mục tiêu SEO đơn thuần → **React + pre-render là đủ**, đạt ~90% lợi ích của Next với 1/10 công sức, giữ nguyên kiến trúc + dữ liệu `content/*.json`. Next chỉ đáng trả giá khi site scale lớn (nhiều biển/bài + cần tốc độ). Với Biensovip hiện tại → **chọn 1**. (Có thể đổi sang Next sau nếu cần.)

**Cách chuyển (nếu chọn 1):**
- Thêm plugin pre-render vào `vite.config.js`.
- Hash → history: `src/hooks/useHashRouter.js` bỏ `window.location.hash`, dùng `history.pushState` + `popstate`; `src/config/routes.js` `routeFor` trả `/bien/p1` thay `#/bien/p1`.
- Fallback server trỏ mọi `/` về `index.html`.

> ⚠️ Quyết định này ảnh hưởng toàn bộ mục 4–7 dưới. Nếu giữ hash, chúng chỉ "vá" được một phần. Chốt hướng **trước** khi triển khai 4–7.

---

## 3. robots.txt + sitemap.xml (thêm ngay, bất kể hướng routing)

`public/` hiện chỉ có favicon/icons/assets — **không có** robots, sitemap.

### `public/robots.txt`
```
User-agent: *
Allow: /
Disallow: /#/admin
Sitemap: https://biensovip.com/sitemap.xml
```

### `public/sitemap.xml` — sinh động từ nội dung (không viết tay)
Nội dung biển + bài nằm `src/lib/content/vi/plates.json` + `posts.json` + `src/lib/mockData.js`. Script chạy trước build (`scripts/gen-sitemap.mjs`):
- Đọc `PLATES` (id/city/price) + `POSTS` (slug) → xuất `public/sitemap.xml`:
```
https://biensovip.com/bien/p1
https://biensovip.com/bien/p2
...
https://biensovip.com/bai-viet/ngu-quy-99999-dat-nhat-thi-truong
```
- `lastmod` cho bài viết, `priority="0.8"` cho trang bán hàng.

---

## 4. 🔴 Bug — Meta tĩnh không đổi khi chuyển biển

### Chứng cứ
`src/hooks/useSeo.js:67`:
```js
}, [st.screen, st.postId]);
```
Chuyển biển `p1 → p2` trên trang chi tiết chỉ đổi `st.curId`, `screen`/`postId` không đổi → **useSeo không chạy lại** → title/desc/canonical/JSON-LD **giữ nguyên biển cũ**. (`App.jsx:90 openPlate` chỉ `patch({ screen:'detail', curId:id })`.) Blog may mắn đúng vì dep có `postId`.

### Sửa
```js
}, [st.screen, st.curId, st.postId]);
```

---

## 5. Product/Offer schema cho trang biển + giá máy-đọc

### Chứng cứ
- `useSeo.js:24-30` — JSON-LD chỉ có `BlogPosting`. `screen === 'detail'` (line 15) không tạo `Product`/`Offer`.
- `src/pages/PlateDetail.jsx:106` — giá text `"2.150.000.000đ"`, không phải số cho schema.

### Sửa — dùng `priceNum()` (`src/lib/mockData.js:71`)
```js
else if (scr === 'detail' && cur) {
  const n = priceNum(cur.price);            // 2150000000
  ld = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: cur.title,
    description: (cur.fengshui || '') + ' Biển ' + cur.vehicle + ' ' + cur.city,
    image: site + '/assets/hero-plate-main.png',
    brand: { '@type': 'Brand', name: 'Biensovip' },
    offers: {
      '@type': 'Offer',
      price: n ? String(n) : undefined,     // bỏ nếu "Giá liên hệ"
      priceCurrency: 'VND',
      availability: cur.status === 'Còn hàng' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      url: canonical,
    },
  };
}
```
- "Giá liên hệ" (`priceNum` = 0) → **không** xuất `offers.price`, tránh schema lỗi.
- Thêm `BreadcrumbList` cho `detail`, `FAQPage` cho `faq` (tựa đề/đáp án đã ở `src/lib/content/vi/faq.json`, sẵn để xuất).

---

## 6. Chuẩn hóa meta + OG + Twitter + canonical

### Chứng cứ
- `useSeo.js:15-22` — canonical `/danh-sach`, `/bien/{id}`, `/bai-viet/{slug}` nhưng URL thật là hash → **canonical sai / không tồn tại**.
- `useSeo.js:49-56` — set `og:title/desc/type/url/site_name` nhưng **thiếu `og:image`**, `twitter:image` cũng không.

### Sửa (sau khi chuyển history ở mục 2)
- `canonical = window.location.origin + routeFor(screen, id)` — dùng chung hàm route, không lệch.
- Thêm hình mặc định + cá nhân hóa theo biển/bài:
```js
const img = cur?.image || post0?.img || site + '/assets/hero-plate-main.png';
setMeta('property', 'og:image', img);
setMeta('name', 'twitter:image', img);
```
- Title mỗi trang chứa từ khóa: "Biển số đẹp Đà Nẵng", "Biển ngũ quý/tứ quý/lộc phát/thần tài".

---

## 7. noindex admin/auth

### Chứng cứ
`useSeo.js:57` — set `index, follow` **luôn**, mọi screen. Admin (`ADMIN_SCREENS`) + login/auth vào Google.

### Sửa
```js
const noindex = ADMIN_SCREENS.includes(scr) || ['login','register','forgot','adminLogin'].includes(scr);
setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
```
(import `ADMIN_SCREENS` từ `src/config/routes.js`.)

---

## 8. Hiệu năng (Core Web Vitals) — ảnh hero

### Chứng cứ
`src/pages/Home.jsx:31-33` — 3 ảnh `/assets/hero-plate-*.png` load ngay (không lazy), không `fetchpriority="high"` trên ảnh LCP `hero-plate-main.png`. Không `width/height` cố định + `position:absolute` → nguy cơ layout shift. `LazyImage.jsx` lazy tốt nhưng `img` không nằm trong HTML gốc (JS-render).

### Sửa
- `fetchpriority="high"` cho `hero-plate-main.png`.
- Nếu mỗi PNG > 150KB → convert WebP/AVIF, thêm `width/height` chặn CLS.
- Sau pre-render (mục 2), ảnh vào HTML → Google đọc alt + tính LCP thật.

---

## 9. URL danh mục crawlable

### Chứng cứ
`src/pages/Home.jsx:48-50` — pill danh mục gọi `patch({ cat })`, không phải `<a href>`. Google không theo được `onClick` → không có URL riêng cho "biển ngũ quý Đà Nẵng", "biển lộc phát ô tô" (từ khóa dài, CTR cao).

### Sửa
- Biến pill thành `<a href={routeFor('list') + '?cat=Ngũ-quý'}>` (hoặc `/danh-sach/ngu-quy`), dùng chung `routeFor`.
- Làm chung đợt history router.

---

## 10. Tín hiệu tin cậy (E-E-A-T)

Google xếp cao cho trang "tư vấn phong thủy biển số" khi có **người thật** đứng sau.
- Trang `about` đã có (externalize). Cần: ảnh + tên + facebook/zalo + SĐT + địa chỉ (đã ở `common.json` footer) → schema `LocalBusiness`:
```json
{
  "@context":"https://schema.org","@type":"LocalBusiness",
  "name":"Biensovip","telephone":"...","address":"Đà Nẵng",
  "sameAs":["https://facebook.com/...","https://zalo.me/..."]
}
```
- Trang `Reviews` đã có → schema `Review`/`AggregateRating` nếu có đánh giá thật.

---

## 11. Đang làm tốt (giữ)

- `lang="vi"` + `<meta viewport>` đúng (`index.html`).
- Title động theo screen, từ khóa cơ bản ở `useSeo.js`.
- Bài viết có h2/quote/`<time>`, tiêu đề structured.
- Nội dung đã tách JSON → partner dễ bổ sung từ khóa dài.

---

## 12. Thêm (chưa có, nên bổ sung)

- `apple-touch-icon` + favicon nhiều size (mobile).
- `hreflang="vi"`/`"en"` khi làm bản EN (đang hoãn).
- **Google Search Console** + **Bing Webmaster** — khai sitemap, xem lỗi index. Đầu tiên sau khi đổi routing.
- GA4/gtag analytics.
- Breadcrumb JSON-LD.

---

## 13. Tóm tắt đường dẫn code cần sửa

| Hạng mục | File:dòng |
|---|---|
| Pre-render / history router | `index.html`, `src/main.jsx`, `src/hooks/useHashRouter.js:4-19`, `src/config/routes.js:13-18`, `vite.config.js` |
| 🔴 Meta stale khi đổi biển | `src/hooks/useSeo.js:67` |
| og:image + canonical đúng | `src/hooks/useSeo.js:49-58, 15-22` |
| Product/Offer schema | `src/hooks/useSeo.js:15`, `src/lib/mockData.js:71` |
| noindex admin | `src/hooks/useSeo.js:57` |
| Sitemap/robots | `public/` + `scripts/gen-sitemap.mjs` |
| URL danh mục | `src/pages/Home.jsx:48-50`, `src/config/routes.js` |
| Ảnh hero (LCP/CLS) | `src/pages/Home.jsx:31-33` |
| E-E-A-T / LocalBusiness | `src/content/vi/about.json`, `common.json` |

---

## 14. Thứ tự triển khai

1. **Chốt hướng routing** (mục 2). *(quan trọng nhất)*
2. Sửa bug meta khi đổi biển (mục 4) + noindex admin (mục 7) — làm ngay, rủi ro thấp, không đụng routing.
3. Chuyển hash → history; sửa canonical/og:url khớp URL thật (mục 6).
4. Thêm `robots.txt` + `sitemap.xml` (tĩnh rồi sinh động, mục 3).
5. Thêm Product/Offer + BreadcrumbList + FAQPage schema (mục 5).
6. Thêm `og:image`/`twitter:image` (mục 6), noindex (nếu chưa ở bước 2).
7. Tối ưu ảnh WebP, size, CLS (mục 8), URL danh mục (mục 9).
8. Khai báo Search Console, đo lường (mục 12).

---

## 15. Ghi chú công việc — MỐC CHỜ BACKEND API (đang chạy bây giờ)

**Hiện tại:** chỉ cài đặt sẵn quy trình + đọc hiểu vấn đề. **KHÔNG triển khai code SEO** còn nữa cho đến khi backend fetch được API về.

### Vì sao dừng ở đây

- SEO audit này chạy trên **dữ liệu tĩnh** (`src/lib/mockData.js` + `src/lib/content/vi/*.json` — 12 biển, 6 bài).
- Khi backend có API thật, biển hằng trăm/nghìn → **sitemap, URL mỗi biển, schema Product/Offer** phải sinh từ API, không phải từ mock.
- Làm SEO bây giờ trên mock = làm lại khi API vào. Phí công.

### Chờ xong backend rồi mới làm (đầy đủ)

1. Quét lại bằng **claude-seo** plugin (đã biết). Chạy sub-skill: `seo-schema`, `seo-geo`, `seo-technical`. (Audit toàn bộ tốn token → chạy phân mảnh.)
2. Áp theo thứ tự mục 14. Việc nào không phụ thuộc API thì làm trước.

### Việc KHÔNG cần chờ backend — làm được ngay, rủi ro thấp

- **Mục 4:** bug meta không đổi khi chuyển biển (`useSeo.js:67` dep thiếu `curId`) — 1 dòng.
  - Lưu ý: **title động mỗi biển ĐÃ có sẵn** (`useSeo.js:15` — nối prov+seri+num+giá; blog bài riêng ở `:20`). Vấn đề chỉ là không re-run khi đổi biển ngoài màn hình detail — không phải thiếu tính năng, chỉ cần sửa dep.
- **Mục 7:** `noindex` admin/auth (`useSeo.js:57`).
- **Mục 8:** `fetchpriority="high"` + width/height ảnh hero (`Home.jsx:31-33`, chống CLS).

> Hai việc trên độc lập dữ liệu, không làm lại khi API vào. Muốn thì làm ngay.

### Mốc quyết định routing (mục 2) — chưa chốt, cần bạn xem khi tới

Hash-route (SPA) → Google không crawl được nội dung. Chờ API + đổi sang history/pre-render rồi hãy chạy audit đầy đủ.
