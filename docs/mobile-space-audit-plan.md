# Kế hoạch tối ưu giao diện mobile — Biensovip.com

> Audit: 2026-08-07 | Target: 375–428px | Tổng tiết kiệm: ~1,500–2,000px dọc

---

## Mục lục
- [Tổng quan](#tổng-quan)
- [Round 1: Bug + cắt thừa (P0+P1)](#round-1-bug--cắt-thừa-p0p1)
- [Round 2: Tinh chỉnh spacing (P2)](#round-2-tinh-chỉnh-spacing-p2)
- [Round 3: Refine nếu cần (P2 còn lại)](#round-3-refine-nếu-cần-p2-còn-lại)
- [Checklist trước/sau](#checklist-trướcsau)

---

## Tổng quan

### Vấn đề gốc
Mobile 375px hiển thị nhiều element không cần thiết, gây cuộn dài. Có 2 bug responsive thực sự (P0) + nhiều nội dung trùng lặp/thừa (P1) + spacing chưa tối ưu (P2).

### Nguyên tắc
- **Xóa trước, ẩn sau, chỉnh cuối** — cắt nội dung thừa rồi mới tinh chỉnh pixel
- **Mỗi thay đổi có CSS class/media query rõ ràng** — không hardcode inline style mobile
- **Không đụng desktop** — mọi thay đổi nằm trong `@media (max-width: 768px)`
- **Kiểm tra 86 E2E tests sau mỗi round**

### File sẽ đụng đến

| File | Round | Loại thay đổi |
|------|-------|---------------|
| `src/styles/app.css` | 1, 2 | Thêm CSS rules mobile |
| `src/layout/Header.jsx` | 1 | Thêm className cho nav pills |
| `src/pages/Home.jsx` | 1 | Ẩn section, className |
| `src/pages/PlateList.jsx` | 1 | Collapse sidebar mobile |
| `src/components/Breadcrumb.jsx` | 1 | Ẩn trên mobile |
| `src/components/PlateCard.jsx` | 1 | Gộp 2 nút CTA |
| `src/pages/PlateDetail.jsx` | 1 | Gộp CTA, ẩn gallery thừa |
| `src/layout/Footer.jsx` | 2 | Rút gọn mobile |
| `src/pages/About.jsx` | 2 | Ẩn contact grid, FAQ accordion |
| `src/styles/tokens.css` | 2 | Thêm mobile spacing vars |

---

## Round 1: Bug + cắt thừa (P0+P1)

> Tiết kiệm dự kiến: ~1,100px+ mỗi trang
> Thời gian: 30-45 phút

### 1.1 — Header: Ẩn 5 nav pills trên mobile

**File:** `src/layout/Header.jsx` dòng 18-22, `src/styles/app.css`

**Hiện trạng:** `<nav>` chứa 5 pill (Biển số, Hợp mệnh, Yêu thích, Tin phong thủy, Về chúng tôi) không có class ẩn mobile. Kết quả: header sticky cao 100-115px thay vì ~66px. MobileDrawer đã có sẵn 5 mục y hệt.

**Cách làm:**
1. Thêm `className="header-nav-pills"` vào `<nav>` trong Header.jsx:18
2. Thêm CSS trong `@media(max-width:768px)`:
```css
.header-nav-pills{display:none!important}
```
3. Giữ hamburger + logo + heart icon

**Kiểm tra:** Mở mobile viewport, header chỉ còn logo + hamburger + heart. Bấm hamburger thấy drawer có đủ 5 mục.

**Tiết kiệm:** ~68–102px sticky (header không còn wrap)

---

### 1.2 — PlateList: Collapse filter sidebar trên mobile

**File:** `src/pages/PlateList.jsx` dòng 17-47, `src/styles/app.css`

**Hiện trạng:** `<aside>` filter 272px rộng với tất cả checkbox (categories, cities, vehicle) hiển thị đầy đủ trên mobile. Không có toggle/collapse. User phải cuộn qua 450-500px filter mới thấy biển số.

**Cách làm:**
1. Wrap `<aside>` trong `<details>` element với `<summary>` "🔍 Bộ lọc" — chỉ render trên mobile
2. Hoặc: dùng stateful toggle đơn giản hơn:
```jsx
// Thêm state trong PlateList
const [showFilter, setShowFilter] = useState(false)
// Trên mobile: nút "Bộ lọc (N đang chọn)" + aside collapse
// Trên desktop: aside luôn hiển thị (giữ nguyên)
```
3. CSS:
```css
@media(max-width:768px){
  .list-filter-aside{display:none}
  .list-filter-aside.open{display:block;flex:1 1 100%;position:static;min-width:0}
  .list-filter-toggle{display:inline-flex!important}
}
```
4. Thêm `className="list-filter-aside"` + `className="list-filter-toggle"` (mặc định `display:none`)

**Kiểm tra:** Mở /danh-sach trên mobile. Filter ẩn, nút "Bộ lọc" hiện. Bấm vào → filter mở ra. Đóng lại → grid biển số chiếm full width.

**Tiết kiệm:** ~450–500px scroll

---

### 1.3 — Home: Ẩn video placeholder section

**File:** `src/pages/Home.jsx` dòng 74-89, `src/styles/app.css`

**Hiện trạng:** 2 box dashed rỗng (TikTok `aspectRatio:9/14` ~600px + Facebook `16/9` ~193px) với text "Chèn link/embed video tại đây". Chưa có video thật, không có giá trị với user.

**Cách làm:**
1. Thêm prop hoặc check config: nếu không có URL video → return null cả section
2. Đơn giản nhất hiện tại: thêm `className="home-video-section"` và CSS:
```css
@media(max-width:768px){
  .home-video-section{display:none}
}
```
3. Khi có video thật: bỏ `display:none`, thay placeholder bằng embed thật

**Kiểm tra:** Home mobile không còn section video. Desktop vẫn hiện placeholder (để nhắc nhở thêm content).

**Tiết kiệm:** ~800px

---

### 1.4 — Breadcrumb: Ẩn trên mobile trừ trang detail/post

**File:** `src/components/Breadcrumb.jsx`, `src/App.jsx`

**Hiện trạng:** Breadcrumb render 12px padding top+bottom = 24px + text trên TẤT CẢ public screen. 12/17 màn hình chỉ có 1 item ("Trang chủ › X"), vô nghĩa vì heading trang đã nói rõ.

**Cách làm:**
1. Thêm `className="page-breadcrumb"` vào Breadcrumb component
2. CSS:
```css
@media(max-width:768px){
  .page-breadcrumb{display:none}
  .page-breadcrumb.keep-mobile{display:flex;padding:8px var(--pad-page)} /* giữ cho detail/post */
}
```
3. Trong App.jsx, thêm class condition: `s === 'detail' || s === 'post'` → thêm `keep-mobile`

**Kiểm tra:** Home, List, About, Fav, Blog... không có breadcrumb. Detail/Post vẫn có breadcrumb rút gọn.

**Tiết kiệm:** ~48px/trang × 15 trang

---

### 1.5 — Home: Gộp eyebrow + bỏ trùng lặp trong hero

**File:** `src/pages/Home.jsx` dòng 12, 19-23

**Hiện trạng:** Eyebrow "3.240 biển số đang chờ chủ mới" → stats row "3.240 biển số hiện có". Cùng 1 con số.

**Cách làm:**
1. Ẩn Eyebrow trên mobile (giữ stats row):
```css
@media(max-width:768px){
  .hero-eyebrow{display:none}
}
```
2. Thêm `className="hero-eyebrow"` vào Eyebrow dòng 12
3. Stats row vẫn hiện nhưng giảm xuống 2 stat (bỏ 1): "4,9/5 khách hài lòng" + "15 phút phản hồi" (bỏ "3.240 biển số hiện có" vì tiêu đề đã nói "3.240 biển số")
4. Hoặc giữ stats row 3 cột nguyên, nhưng ẩn Eyebrow — đơn giản hơn

**Kiểm tra:** Hero mobile: không có eyebrow, heading H1 → description ngắn → CTA buttons → stats 3 cột.

**Tiết kiệm:** ~28px

---

### 1.6 — PlateCard: Gộp 2 nút CTA thành 1

**File:** `src/components/PlateCard.jsx` dòng 39-40 (ước lượng)

**Hiện trạng:** "Gọi ngay" + "Nhắn Zalo" đều gọi `onBuy` → mở cùng 1 modal. 2 nút 34px trên mobile là thừa.

**Cách làm:**
1. Trên desktop: giữ 2 nút
2. Trên mobile: gộp thành 1 nút "Liên hệ ngay" full-width
```css
@media(max-width:768px){
  .plate-card-cta-secondary{display:none}
  .plate-card-cta-primary{flex:1}
}
```
3. Thêm className cho 2 nút (`plate-card-cta-primary` cho nút đầu, `plate-card-cta-secondary` cho nút thứ hai)

**Kiểm tra:** Card trên mobile chỉ có 1 nút. Desktop vẫn 2 nút.

**Tiết kiệm:** ~34px/card × 4 card trên Home = 136px

---

### 1.7 — PlateDetail: Gộp CTA + ẩn gallery thumbnails

**File:** `src/pages/PlateDetail.jsx` dòng 30-43, 70-71

**Hiện trạng:** 
- "Gọi ngay" + "Nhắn Zalo" cùng gọi `openBuy`
- 3 "thumbnail" chỉ đổi màu nền — không có ảnh thật

**Cách làm:**
1. Gộp CTA giống PlateCard: thêm class, ẩn nút thứ 2 trên mobile
2. Ẩn gallery row trên mobile:
```css
@media(max-width:768px){
  .detail-gallery-thumbs{display:none}
  .detail-cta-secondary{display:none}
}
```

**Kiểm tra:** Detail mobile: ảnh chính → thẳng phần info, không có thumbnail row. 1 nút liên hệ.

**Tiết kiệm:** ~80px

---

### 1.8 — Home: Ẩn nút "Tìm biển số" thừa trong search bar

**File:** `src/pages/Home.jsx` dòng 48

**Hiện trạng:** Nút "Tìm biển số" gọi `go('list')`. Search field đã điều hướng tới List khi gõ Enter. Nút thừa.

**Cách làm:**
```css
@media(max-width:768px){
  .home-search-btn{display:none}
}
```

**Kiểm tra:** Search bar mobile chỉ có input + pills. Không có nút "Tìm biển số".

**Tiết kiệm:** ~48px

---

## Round 2: Tinh chỉnh spacing (P2)

> Tiết kiệm dự kiến: ~200–300px
> Thời gian: 20-30 phút

### 2.1 — CSS variables: Scale spacing trên mobile

**File:** `src/styles/app.css` — thêm vào `@media(max-width:768px)`

**Hiện trạng:** `--pad-section-y:48px`, `--gutter-card:20px`, `--space-6..10` không đổi trên mobile.

**Cách làm:**
```css
@media(max-width:768px){
  :root{
    --pad-page:16px;
    --gutter-section:16px;
    --pad-section-y:36px;       /* was 48px */
    --gutter-card:14px;          /* was 20px */
    --space-6:18px;              /* was 24px */
    --space-7:24px;              /* was 32px */
    --space-8:28px;              /* was 40px */
    --space-9:36px;              /* was 56px */
    --space-10:48px;             /* was 72px */
    /* giữ font scale */
    --fs-display-1:36px;--fs-display-2:28px;--fs-display-3:24px;
    --fs-title-1:22px;--fs-title-2:18px;
  }
  /* ... existing mobile rules ... */
}
```

**Kiểm tra:** Build không lỗi. So sánh ảnh chụp trước/sau — spacing đồng đều hơn.

---

### 2.2 — Footer: Rút gọn mobile

**File:** `src/layout/Footer.jsx`, `src/styles/app.css`

**Hiện trạng:** Logo + desc + 4-col grid + separator + copyright + legal = ~290px.

**Cách làm:**
1. Ẩn dòng description trên mobile: `className="footer-desc"`
2. Grid 4-col → 2-col: đã tự động với `repeat(auto-fit,minmax(150px,1fr))` ✅
3. Gộp copyright + legal vào 1 dòng: đã làm ✅
4. Giảm padding: `clamp(28px,4vw,52px)` → `clamp(20px,4vw,36px)` trên mobile

```css
@media(max-width:768px){
  .footer-desc{display:none}
  .footer-inner{padding:clamp(20px,4vw,36px)!important}
}
```

**Kiểm tra:** Footer mobile gọn: logo → 2×2 grid → copyright+legal 1 dòng.

**Tiết kiệm:** ~80px

---

### 2.3 — About: Ẩn contact grid + FAQ accordion

**File:** `src/pages/About.jsx`

**Hiện trạng:** Contact grid trùng Footer hoàn toàn. FAQ 4 card expand hết.

**Cách làm:**
1. Contact grid: thêm `className="about-contact"` → CSS `display:none` mobile
2. FAQ: chuyển 4 card thành accordion (giống Faq.jsx pattern):
```jsx
const [openFaq, setOpenFaq] = useState(null)
// map faq items → clickable rows, chỉ expand item được chọn
```

**Kiểm tra:** About mobile không có contact grid, FAQ accordion hoạt động.

**Tiết kiệm:** ~250px

---

### 2.4 — Home: Bỏ Eyebrow thừa trong section headings

**File:** `src/pages/Home.jsx` dòng 54, 76

**Hiện trạng:** Mỗi section có Eyebrow + H2 + paragraph. Eyebrow thường nói y hệt H2 ("Nổi bật" / "Biển số nổi bật").

**Cách làm:**
1. Thêm class `section-eyebrow` cho các Eyebrow
2. CSS mobile: ẩn eyebrow, giữ heading
```css
@media(max-width:768px){
  .section-eyebrow{display:none}
}
```

**Kiểm tra:** Home sections: H2 → grid cards. Không có eyebrow lặp.

**Tiết kiệm:** ~30px × 2 sections = 60px

---

### 2.5 — Home: Giảm hero plate container max-width

**File:** `src/pages/Home.jsx` dòng 26, `src/styles/app.css`

**Hiện trạng:** `maxWidth: 520` với aspectRatio `1.42/1`.

**Cách làm:**
```css
@media(max-width:768px){
  .hero-plate-container{max-width:320px!important} /* was 400px, desktop 520px */
}
```

**Kiểm tra:** Plate container nhỏ hơn, biển vẫn vừa.

---

## Round 3: Refine nếu cần (P2 còn lại)

> Chỉ làm nếu sau Round 1+2 vẫn thấy dài

### 3.1 — About: Cắt timeline 6→3 mobile
```css
@media(max-width:768px){.timeline-item:nth-child(n+4){display:none}}
```
Thêm nút "Xem toàn bộ hành trình" expand.

### 3.2 — Hero description: rút gọn 1 dòng mobile
```css
@media(max-width:768px){
  .hero-desc{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
}
```

### 3.3 — Detail similar plates: 4→2 trên mobile
```css
@media(max-width:768px){.similar-plate:nth-child(n+3){display:none}}
```

### 3.4 — Chat page: rút gọn 3 card → tabs
Giữ Zalo card full, Phone + Form collapse vào tab switcher.

---

## Checklist trước/sau

### Trước khi bắt đầu
- [ ] Chụp screenshot mobile 375px: Home, List, Detail, About, Footer
- [ ] Đo tổng chiều cao page (pixels) mỗi trang trên
- [ ] Chạy `npm run build` — xác nhận build sạch
- [ ] Chạy `npx playwright test` — 86/86 pass baseline

### Sau mỗi round
- [ ] `npm run build` — không lỗi
- [ ] `npx playwright test` — không regression
- [ ] Visual check mobile 375px: Home, List, Detail, About
- [ ] Visual check desktop 1280px: không thay đổi

### Sau Round 1
- [ ] Header mobile chỉ còn 1 hàng (~66px)
- [ ] PlateList mobile có nút "Bộ lọc", mặc định ẩn sidebar
- [ ] Home không có video placeholder
- [ ] Các trang không có breadcrumb (trừ detail/post)
- [ ] PlateCard 1 nút CTA trên mobile
- [ ] Home không có nút "Tìm biển số"
- [ ] Detail không có gallery thumbnails

### Sau Round 2
- [ ] Spacing mobile đồng đều, không quá thưa
- [ ] Footer gọn (không desc, padding ít hơn)
- [ ] About không có contact grid trùng Footer
- [ ] About FAQ accordion
- [ ] Home section headings không có Eyebrow

---

## Ghi chú

- **Không xóa code** — chỉ thêm class + CSS ẩn. Khi cần có thể bật lại dễ dàng.
- **Desktop untouched** — mọi CSS đều trong `@media(max-width:768px)`.
- **Props mới tối thiểu** — dùng className là chính, không thêm config phức tạp.
- **Tests giữ nguyên** — E2E test dùng desktop viewport (1280px), không bị ảnh hưởng.
