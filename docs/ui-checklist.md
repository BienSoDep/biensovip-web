# Biensovip — UI/UX Checklist & Process

Tài liệu này mô tả quy trình làm UI 5 bước cho solo developer, áp dụng cụ thể cho dự án Biensovip.com. Mỗi bước có checklist chi tiết, cách kiểm tra, và công cụ hỗ trợ.

---

## Tổng quan quy trình

```
Screen Inventory → Component Audit → State Machine → Visual QA → Keyboard & Screen Reader
     (Bước 1)          (Bước 2)         (Bước 3)        (Bước 4)          (Bước 5)
```

---

## Bước 1: Screen Inventory (Kiểm kê màn hình)

### Mục tiêu
Liệt kê **tất cả** màn hình thành danh sách phẳng. Mỗi màn hình phải ghi rõ các state mà nó có thể rơi vào. Không được bỏ sót màn hình nào.

### Checklist

- [ ] **Liệt kê route**: mỗi route trong `routes.js` → 1 dòng. Ghi rõ hash path, tên màn hình, component render.
- [ ] **Admin screens**: liệt kê tất cả sub-screen trong `AdminShell`. Mỗi sub-screen là 1 màn hình riêng.
- [ ] **Modal/overlay**: modal nào mở từ đâu? Ghi nguồn gốc (vd: PlateDetail → contact modal).
- [ ] **Các state cơ bản của mỗi màn hình**:
  - **Loading**: render gì khi chưa có data?
  - **Empty**: render gì khi data = [] hoặc null?
  - **Data**: render gì khi có data?
  - **Error**: render gì khi fetch fail, timeout, network error?
  - **Edge cases**: data quá dài, tên quá ngắn, ảnh không load được, v.v.
- [ ] **Auth state**: màn hình này public hay yêu cầu login? Nếu login rồi thì hiển thị khác gì?

### Output
1 file `docs/screen-inventory.md` hoặc section trong file này — bảng tổng tất cả màn hình + state.

### Biensovip Screen Inventory

#### Public Screens

| # | Screen | Hash | Component | Loading | Empty | Error | Edge Cases |
|---|--------|------|-----------|---------|-------|-------|------------|
| 1 | Home | `#/` | `Home.jsx` | Hero skeleton / shimmer | Featured grid trống (không render gì) | Hero image fail → fallback gradient | Search input rỗng → submit không làm gì |
| 2 | Plate List | `#/danh-sach-bien-so` | `PlateList.jsx` | Skeleton cards (6 cái) | "Không tìm thấy biển số phù hợp" + nút reset filter | Fetch fail → toast error + giữ data cũ | Filter quá nhiều điều kiện → 0 results |
| 3 | Plate Detail | `#/bien-so/:id` | `PlateDetail.jsx` | Skeleton detail | 404: "Biển số không tồn tại" + nút về list | Fetch fail → toast error | Gallery ảnh trống, giá "Liên hệ", biển đã bán |
| 4 | Blog | `#/tin-tuc` | `Blog.jsx` | Skeleton cards | "Chưa có bài viết trong danh mục này" | Fetch fail → toast error | Category không có bài nào, bài quá dài (truncate) |
| 5 | Blog Detail | `#/tin-tuc/:slug` | `BlogDetail.jsx` | Skeleton article | 404: "Bài viết không tồn tại" | Fetch fail → toast error | Hình banner fail, nội dung có HTML lạ |
| 6 | About | `#/gioi-thieu` | `About.jsx` | Static content → không cần loading | N/A (tĩnh) | N/A | N/A |
| 7 | Lucky/Fengshui | `#/xem-phong-thuy` | `Lucky.jsx` | Form loading khi submit | Kết quả rỗng: "Không tìm thấy biển phù hợp" | API fail → toast error | Năm sinh không hợp lệ, input sai format |
| 8 | Chat | `#/lien-he` | `Chat.jsx` | Loading chat history | "Chưa có tin nhắn nào" | Gửi fail → retry + toast error | Tin nhắn quá dài, gửi ảnh/file |
| 9 | Compare | `#/so-sanh` | `Compare.jsx` | Placeholder "Chọn biển để so sánh" | Chưa chọn biển nào → hướng dẫn chọn | N/A (so sánh local) | So sánh > 3 biển → scroll ngang |
| 10 | Saved Searches | `#/thong-bao` | `SavedSearches.jsx` | Loading list | "Chưa có tìm kiếm đã lưu" | Fetch fail → toast error | Quá nhiều saved search → pagination? |
| 11 | Favorites | `#/yeu-thich` | `Fav.jsx` | Loading list | Empty state: "Chưa có biển yêu thích" + nút CTA khám phá | Fetch fail → toast error | localStorage hết hạn / bị xóa |
| 12 | Reviews | `#/danh-gia` | `Reviews.jsx` | Skeleton reviews | "Chưa có đánh giá nào" | Fetch fail → toast error | Review không có avatar, review quá dài |
| 13 | Notifications | `#/thong-bao-moi` | `Notifications.jsx` | Loading list | "Chưa có thông báo nào" | Fetch fail → toast error | Notification quá cũ → group by date |
| 14 | Collaborators | `#/cong-tac-vien` | `Collaborators.jsx` | Loading list | "Chưa có cộng tác viên" | Fetch fail → toast error | N/A |

#### Auth Screens

| # | Screen | Hash | Component | Loading | Empty | Error | Edge Cases |
|---|--------|------|-----------|---------|-------|-------|------------|
| 15 | Register | `#/dang-ky` | `Auth.jsx` (mode=register) | Nút submit → spinner | N/A | Validation error trên từng field | Email đã tồn tại, password không khớp, SĐT sai format |
| 16 | Login | `#/dang-nhap` | `Auth.jsx` (mode=login) | Nút submit → spinner | N/A | "Sai tài khoản hoặc mật khẩu" | Quên mật khẩu → chuyển sang forgot |
| 17 | Forgot Password | `#/quen-mat-khau` | `Auth.jsx` (mode=forgot) | 3-step flow: email → OTP → new password | N/A | Email không tồn tại, OTP sai, OTP hết hạn | Resend OTP sau 60s |
| 18 | Admin Login | `#/quan-tri` | `Auth.jsx` (mode=adminLogin) | Nút submit → spinner | N/A | "Tài khoản không tồn tại" / "Mật khẩu không chính xác" | Rate limit sau 5 lần sai |

#### Admin Screens (sau Admin Login)

| # | Screen | Sub-route | Component | Loading | Empty | Error | Edge Cases |
|---|--------|-----------|-----------|---------|-------|-------|------------|
| 19 | Dashboard | `dash` | `Dashboard.jsx` | Stats skeleton | Số 0 hiển thị bình thường | Fetch fail → toast error | N/A |
| 20 | Plates | `plates` | `AdminPlates.jsx` | Table skeleton | "Chưa có biển số nào" + nút thêm | Fetch fail → toast error | Xóa biển cuối cùng của page, search không có kết quả |
| 21 | Categories | `cats` | `AdminCats.jsx` | Table skeleton | "Chưa có danh mục nào" + nút thêm | Fetch fail → toast error | Xóa category đang có biển → warning |
| 22 | Contacts | `contacts` | `AdminContacts.jsx` | Table skeleton | "Chưa có yêu cầu tư vấn nào" | Fetch fail → toast error | Status filter: pending/processing/done |
| 23 | Posts | `posts` | `AdminPosts.jsx` | Table skeleton | "Chưa có bài viết nào" + nút viết bài | Fetch fail → toast error | Xóa bài viết đã publish |
| 24 | Staff | `staff` | `AdminStaff.jsx` | Table skeleton | "Chưa có nhân viên nào" + nút thêm | Fetch fail → toast error | Xóa chính mình → không cho |
| 25 | Customers | `customers` | `AdminCustomers.jsx` | Table skeleton | "Chưa có khách hàng nào" | Fetch fail → toast error | Customer có nhiều đơn hàng |
| 26 | Videos | `videos` | `AdminVideos.jsx` | Table skeleton | "Chưa có video nào" + nút thêm | Fetch fail → toast error | Video URL sai format |
| 27 | Notifications | `notifications` | `AdminNotifications.jsx` | Table skeleton | "Chưa có thông báo nào" + nút tạo | Fetch fail → toast error | Gửi notification hàng loạt → progress bar |
| 28 | Collaborators | `collaborators` | `AdminCollaborators.jsx` | Table skeleton | "Chưa có cộng tác viên nào" | Fetch fail → toast error | Commission rate > 100% hoặc < 0% |
| 29 | Compose Post | `compose` | `Compose.jsx` | Đang load draft... | Form trống để viết bài mới | Lưu draft fail → toast error | Auto-save mỗi 30s, chèn plate vào nội dung |

#### Modals

| # | Modal | Mở từ đâu | Component | State | Edge Cases |
|---|-------|-----------|-----------|-------|------------|
| 30 | Add/Edit Plate | AdminPlates | `Modals.jsx` (addOpen) | Form: empty (thêm) / filled (sửa) | Validation: mã tỉnh sai, giá âm, số trùng |
| 31 | Confirm Delete | AdminPlates, AdminCats, AdminPosts, AdminStaff, v.v. | `Modals.jsx` (confirm) | Show text + 2 nút | Text dài → không truncate |
| 32 | Contact/Tư vấn | PlateDetail, SearchResults | `Modals.jsx` (modal) | Form → Success view (cảm ơn + bank info) | SĐT sai format, đóng modal khi đang gửi |
| 33 | Mobile Menu | Header hamburger | `MobileDrawer.jsx` | Nav links + user info | Menu mở → scroll body bị lock? (hiện tại không lock) |
| 34 | Chatbot | Float button góc phải dưới | `AiChatbot.jsx` | Icon → Chat window expand | Chatbot gửi message fail, chatbot trả lời rỗng |

---

## Bước 2: Component Audit (Kiểm toán component)

### Mục tiêu
Kiểm tra từng component trong `src/components/` và các component page — component nào cần gộp, xóa, hoặc cải thiện.

### Checklist

- [ ] **Component có thực sự cần là file riêng không?** Component dùng đúng 1 lần → có thể không cần tách. Component dùng 0 lần → xóa.
- [ ] **Props interface rõ ràng?** Props truyền qua ≥ 3 tầng không cần thiết → prop drilling. Có prop nào luôn nhận cùng 1 giá trị không? → hardcode.
- [ ] **Inline style lặp lại?** Pattern giống nhau xuất hiện ≥ 2 lần → gộp vào CSS class hoặc token trong `tokens.css` hoặc `app.css`.
- [ ] **Component chết (dead code)?** Search toàn project: import của component đó có ở đâu không? Nếu không import ở đâu → xóa.
- [ ] **Component quá to?** File > 200 dòng → cân nhắc tách. Hàm render > 100 dòng → chắc chắn tách.
- [ ] **Tên component rõ ràng không?** Tên thể hiện nó làm gì, không cần đọc code mới hiểu.

### Biensovip Component Inventory

#### Shared Components (`src/components/index.jsx`)

| Component | Dùng ở đâu | Đánh giá | Hành động |
|-----------|-----------|----------|-----------|
| `Input` | Auth, Modals, Admin forms, Search | Tốt. Thiếu `aria-describedby` link tới error | Thêm `aria-invalid` + `aria-describedby` khi có error |
| `SearchField` | Header, AdminPlates, AdminPosts, v.v. | Tốt. Thiếu `aria-label` khi không có label text | Thêm `aria-label` prop |
| `Select` | AdminPlates, Filters, Auth | Tốt | Giữ nguyên |
| `Checkbox` | Filters (city checkboxes) | Tốt | Giữ nguyên |
| `Radio` | Filters (vehicle type) | Tốt | Giữ nguyên |
| `Switch` | AdminContacts (status toggle) | Thiếu `aria-label` và `aria-checked` | Thêm accessibility attributes |
| `Badge` | PlateCard, AdminTables, v.v. | Tốt | Giữ nguyên |
| `Eyebrow` | Home sections | Dùng ít, cân nhắc không cần là component | Giữ, dùng trong design system |
| `Icon` | Wrapper cho lucide-react | Tốt | Giữ nguyên |
| `IconButton` | Modals, AdminShell, Header | Tốt | Giữ nguyên |
| `Card` | Home, Blog, List | Tốt | Giữ nguyên |
| `Avatar` | Reviews, Chat, Collaborators | Tốt | Giữ nguyên |
| `Toast` | **Không dùng ở đâu** (app dùng react-hot-toast) | Component chết → cân nhắc xóa hoặc giữ làm backup | Giữ lại làm design reference, nhưng không import |

#### Page Components

| Page | Số dòng (xấp xỉ) | Đánh giá |
|------|------------------|----------|
| `App.jsx` | ~350 | Quá to. Chứa state của toàn bộ app + all handlers + routing. |
| `Home.jsx` | ~200 | OK. Có thể tách SearchField + hero section |
| `PlateList.jsx` | ~180 | OK |
| `PlateDetail.jsx` | ~200 | OK |
| `Auth.jsx` | ~250 | OK cho 4 mode trong 1 file |
| `Blog.jsx` | ~150 | OK |
| `AdminContacts.jsx` | ~180 | OK |
| `AdminPlates.jsx` | ~220 | Cân nhắc tách modal form ra |
| `Compose.jsx` | ~250 | Cân nhắc tách editor toolbar |

#### Inline Style Audit

Các pattern xuất hiện ≥ 3 lần trong codebase:
- `display: 'flex', alignItems: 'center', gap: 'var(--space-3)'` — có thể làm CSS class `.flex-row`?
- `font: 'var(--type-body-sm)', color: 'var(--text-muted)'` — có thể làm CSS class `.text-muted-sm`
- `borderRadius: 'var(--radius-pill)'` — đã có trong token, dùng OK
- `background: 'var(--surface-sunken)'` — đã có token, dùng OK

→ **Đề xuất**: không vội tạo class abstraction. Inline style với CSS variables đang nhất quán. Chỉ gộp khi thấy pattern lặp > 5 lần và giá trị giống hệt nhau.

---

## Bước 3: State Machine (Máy trạng thái)

### Mục tiêu
Mỗi màn hình phải xử lý đủ các state: **loading → empty | error | data**. Vẽ sơ đồ chuyển trạng thái, sau đó check vào code xem đã có UI cho tất cả state chưa.

### Checklist

- [ ] **Vẽ diagram cho từng màn hình** — ít nhất ghi ra các state và arrow chuyển giữa chúng
- [ ] **Check code**: mỗi state có UI tương ứng chưa? `st.loading`, `st.error`, data rỗng, v.v.
- [ ] **Transition animation**: chuyển state có animation mượt không? Hay bị flash/giật?
- [ ] **Error recovery**: từ error state, user làm gì để thoát? Có nút Retry không? Hay phải reload trình duyệt?
- [ ] **Empty state CTA**: empty state có hướng dẫn user làm gì tiếp theo không? Hay chỉ hiện text "Không có dữ liệu"?

### State Machine Patterns

#### Pattern 1: List Page (PlateList, Blog, Admin*)

```
                 ┌──────────────────────────┐
                 │     Initial Load          │
                 └──────────┬────────────────┘
                            │
                            ▼
                 ┌──────────────────────────┐
                 │       Loading            │
                 │   (skeleton cards/rows)  │
                 └──────────┬────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │   Empty    │  │   Data     │  │   Error    │
    │ (no results│  │ (cards/    │  │ (toast +   │
    │  message)  │  │  table)    │  │  retry?)   │
    └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
           │               │               │
           │               │ filter/search │
           │               ▼               │
           │        ┌────────────┐         │
           └───────→│ Filter → 0 │←────────┘
                    │ results    │
                    └────────────┘
```

#### Pattern 2: Form Page (Auth, Modals, Compose)

```
                 ┌──────────────────────────┐
                 │     Form Idle            │
                 └──────────┬────────────────┘
                            │
                            │ user types
                            ▼
                 ┌──────────────────────────┐
                 │   Validation Errors      │
                 │   (per-field red text)   │
                 └──────────┬────────────────┘
                            │
                            │ submit (valid)
                            ▼
                 ┌──────────────────────────┐
                 │     Submitting           │
                 │  (button spinner/disable)│
                 └──────────┬────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Success   │  │ 422/400   │  │  Network   │
    │ (redirect  │  │ (server    │  │ Error      │
    │  / toast)  │  │  errors)  │  │ (toast +   │
    │            │  │           │  │  stay on   │
    │            │  │           │  │  form)     │
    └────────────┘  └────────────┘  └────────────┘
```

#### Pattern 3: Detail Page (PlateDetail, BlogDetail)

```
                 ┌──────────────────────────┐
                 │     Loading              │
                 │   (skeleton page)        │
                 └──────────┬────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │   404      │  │   Data     │  │   Error    │
    │ (not found │  │ (full page │  │ (toast +   │
    │  message)  │  │  render)   │  │  go back?) │
    └────────────┘  └──────┬─────┘  └────────────┘
                           │
                           │ user clicks CTA
                           ▼
                    ┌────────────┐
                    │   Modal    │
                    │ (tư vấn/   │
                    │  contact)  │
                    └──────┬─────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
    ┌────────────┐            ┌────────────┐
    │  Submitted │            │ Validation │
    │ (thank you │            │  Errors    │
    │  + bank)   │            │            │
    └────────────┘            └────────────┘
```

### Biensovip State Gap Analysis

| # | Screen | Missing State | Mức độ |
|---|--------|---------------|--------|
| 1 | **Home** | Empty state khi featured plates = [] | P2 — mock data luôn có ≥ 4 plates, nhưng nếu production API trả [] thì trắng trang |
| 2 | **PlateList** | Loading state — chưa có skeleton, đang dùng text "Đang tải..." | P2 |
| 3 | **PlateDetail** | Không có 404 state riêng — nếu plate không tồn tại, hiện gì? | P1 |
| 4 | **Blog** | Loading state — chưa có skeleton | P2 |
| 5 | **BlogDetail** | Không có 404 state | P1 |
| 6 | **Auth** | Submit loading — nút đổi sang spinner/disable chưa rõ | P2 |
| 7 | **Fav** | Empty state render CTA "Khám phá ngay" → OK | - |
| 8 | **AdminPlates** | Search không có kết quả → render table trống nhưng không có message | P3 |
| 9 | **Compare** | Chưa chọn biển → placeholder hướng dẫn có, OK | - |
| 10 | **SavedSearches** | Loading + empty state chưa kiểm tra | P3 |
| 11 | **Reviews** | Loading + empty state chưa kiểm tra | P3 |
| 12 | **Notifications** | Loading + empty state chưa kiểm tra | P3 |
| 13 | **Collaborators** | Loading + empty state chưa kiểm tra | P3 |

---

## Bước 4: Visual QA (Kiểm tra trực quan)

### Mục tiêu
Kiểm tra từng yếu tố visual: typography, spacing, color, interactive states, layout. Làm tuần tự, không nhảy cóc.

### 4.1 Typography

- [ ] **Font đã load chưa?** Mở DevTools → Network → Fonts → Be Vietnam Pro đã tải? Có fallback font `sans-serif` không?
- [ ] **Font weight render đúng?** 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold) — tất cả đều có glyph và render đúng?
- [ ] **Heading hierarchy**: Mỗi page chỉ có 1 `<h1>`. Các heading dưới theo thứ tự h1 → h2 → h3. Không skip level.
- [ ] **Line-height**: Body text line-height ≥ 1.5. Heading line-height ≤ 1.3. Token `--type-body` đã set đúng `line-height` chưa?
- [ ] **Font size scale**: Mobile có giảm font-size không? Hay giữ nguyên desktop?
- [ ] **Text truncation**: Text quá dài thì truncate (ellipsis) hay wrap? Đã test với text dài gấp 2-3 lần bình thường chưa?
- [ ] **Vietnamese characters**: ĂÂÊÔƠƯĐ — render đúng? Không bị fallback sang font khác?

#### Biensovip Typography Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| T1 | Font weight 400 chưa test kỹ — Google Fonts link chỉ load weight 400, nhưng tokens.css dùng `--fw-regular: 400` → OK | toàn site | - |
| T2 | Heading hierarchy: Home dùng `<h2>` cho section titles nhưng không có `<h1>` cho page title | `Home.jsx` | P2 |
| T3 | Text dài trong Badge không truncate → badge bể width | `Badge` component | P3 |
| T4 | Mobile font size không giảm — `--type-title-1` vẫn 24px trên mobile → quá to | toàn site | P3 |

### 4.2 Spacing

- [ ] **Padding/margin nhất quán**: Dùng đúng token `--space-*` không? Có chỗ nào hardcode `padding: 15px` hoặc `margin: 13px`?
- [ ] **Mobile spacing**: Padding page giảm trên mobile chưa? `--pad-page` có media query không?
- [ ] **Touch targets**: Nút bấm ≥ 44x44px trên mobile? (WCAG 2.5.5)
- [ ] **Content density**: Desktop rộng → content không bị dàn quá mỏng. Mobile hẹp → content không bị nhét quá chật.

#### Biensovip Spacing Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| S1 | `--pad-page` = `var(--space-5)` (20px) — không giảm trên mobile | `tokens.css` | P2 |
| S2 | SearchField fixed width gây overflow ở viewport 375px | `PlateList.jsx` filter bar | P0 |
| S3 | IconButton size `sm` = 28px < 44px — quá nhỏ cho mobile touch target | `IconButton` component | P2 |
| S4 | Detail CTA buttons overflow ở viewport 375px | `PlateDetail.jsx` | P0 |

### 4.3 Color & Contrast

- [ ] **WCAG AA contrast**: Text body (14-16px) contrast ≥ 4.5:1 với background. Text large (≥18px bold hoặc ≥24px) contrast ≥ 3:1.
- [ ] **Không chỉ dùng màu để truyền đạt thông tin**: Icon + text (không chỉ icon màu đỏ = lỗi).
- [ ] **Color blindness**: Test với protanopia/deuteranopia/tritanopia simulator. Các thành phần quan trọng còn phân biệt được không?
- [ ] **Dark mode**: Có hỗ trợ không? Nếu chưa → có plan không?
- [ ] **Focus visible**: Focus ring có contrast ≥ 3:1 với background xung quanh?

#### Biensovip Color Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| C1 | White text on `--brand-500` (#D4650A) — contrast ~3.9:1. Đạt AA cho large text (14px bold+), không đạt cho small text | Buttons, Badge | P2 (đã cải thiện từ #E8790A) |
| C2 | `--text-muted` contrast với white background cần kiểm tra. Token dùng `--grey-600` (#6B7280) → ~5.2:1 trên white → OK | toàn site | - |
| C3 | Không hỗ trợ dark mode | toàn site | P4 (future) |
| C4 | `--shadow-inset-hairline` có đủ visible không? Hay quá mờ? | Input, Select, Card | P3 |

### 4.4 Interactive States

Mỗi interactive element phải có đủ **4 state**:

- [ ] **Rest** (mặc định): hiển thị bình thường
- [ ] **Hover**: cursor pointer + visual feedback (brightness/color/shadow change)
- [ ] **Active/Press**: scale hoặc brightness thay đổi rõ ràng
- [ ] **Focus-visible**: outline ring visible khi focus bằng keyboard
- [ ] **Disabled**: cursor not-allowed + opacity giảm + không có hover effect

#### Biensovip Interactive State Audit

| Element | Rest | Hover | Active | Focus | Disabled | Đánh giá |
|---------|------|-------|--------|-------|----------|----------|
| `Button primary` | ✓ | ✓ | ✓ | ✓ | ✗ (chưa có style disabled) | Thêm `opacity: 0.6` + `cursor: not-allowed` |
| `Button outline` | ✓ | ✓ | ✓ | ✓ | ✗ | Thêm disabled style |
| `Button ghost` | ✓ | ✓ | ✓ | ✓ | ✗ | Thêm disabled style |
| `Button dark` | ✓ | ✓ | ✓ | ✓ | ✗ | Thêm disabled style |
| `Pill button` | ✓ | ✓ | ✓ | ? | ✗ | Focus ring cần test với keyboard |
| `Input` | ✓ | ✗ | ✓ | ✓ | ✗ | Không có hover khác biệt |
| `Select` | ✓ | ✗ | ✓ | ✓ | ✗ | Không có hover khác biệt |
| `PlateCard` | ✓ | ✓ (brightness) | ✓ (brightness) | ✗ | N/A | Thiếu focus ring — không focus được bằng keyboard |
| `BlogCard` | ✓ | ✓ (brightness) | ✓ (brightness) | ✗ | N/A | Thiếu focus ring |
| `IconButton` | ✓ | ✗ | ✓ (global) | ✓ | ✗ | Không có hover state riêng |

### 4.5 Layout & Responsive

- [ ] **Breakpoints**: Có định nghĩa rõ không? Hay responsive ad-hoc?
- [ ] **Mobile first hay desktop first?** Code theo hướng nào?
- [ ] **Container max-width**: Nội dung có max-width không? Desktop 1440px có bị dàn quá rộng không?
- [ ] **Grid**: Cột có responsive không? 4 cột → 2 cột → 1 cột?
- [ ] **Overflow**: Có chỗ nào scroll ngang không mong muốn không?

#### Biensovip Layout Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| L1 | Không có breakpoint chuẩn. Responsive bằng ad-hoc media query rải rác | toàn site | P3 |
| L2 | Admin sidebar ở 1024px collapse về 56px — ổn | `app.css` | - |
| L3 | Mobile menu nút hiện `display:flex!important` ở ≤768px — OK | `app.css` | - |
| L4 | Desktop nav ẩn ở mobile — OK | `app.css` | - |
| L5 | Không có container max-width. Trên màn 2560px nội dung dàn quá rộng | toàn site | P3 |
| L6 | Header auth buttons hiện cả trên mobile (khi đã có hamburger menu) — UI trùng lặp | `Header.jsx` | P1 |

---

## Bước 5: Keyboard & Screen Reader

### Mục tiêu
Đảm bảo ứng dụng dùng được bằng **chỉ bàn phím** và đọc được bằng **screen reader** (NVDA/JAWS/VoiceOver).

### 5.1 Keyboard Navigation

- [ ] **Tab order**: Tab từ trên xuống dưới có theo thứ tự logical không? Không bị nhảy lung tung?
- [ ] **Skip link**: Có "Skip to main content" link không? (Admin có, public không)
- [ ] **Focus trap**: Modal mở → focus bị trap trong modal. Đóng modal → focus quay lại nút mở modal.
- [ ] **Escape key**: Modal đóng bằng Escape. Dropdown/menu đóng bằng Escape.
- [ ] **Enter/Space**: Mọi nút bấm và link hoạt động với Enter và/hoặc Space.
- [ ] **Arrow keys**: Tab, carousel, select — dùng được arrow keys không?
- [ ] **No keyboard traps**: Không chỗ nào focus bị kẹt không thoát ra được.

#### Biensovip Keyboard Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| K1 | **Header logo** là `<div>` onClick — không focus được, không Enter/Space được | `Header.jsx` logo | P1 |
| K2 | **PlateCard** là `<div>` với `data-pressable` — không focus được bằng keyboard | `PlateCard` (PlateList, Home) | P1 |
| K3 | **Similar plates** trong PlateDetail — không focus được | `PlateDetail.jsx` | P2 |
| K4 | **BlogCard** — không focus được bằng keyboard | `Blog.jsx` | P2 |
| K5 | **Modal không có focus trap** — focus đi ra ngoài modal khi tab | `Modals.jsx` | P2 |
| K6 | **Modal không đóng bằng Escape** | `Modals.jsx` | P2 |
| K7 | **Hamburger menu** — tab vào menu mobile không hoạt động đúng? | `MobileDrawer.jsx` | P2 |
| K8 | **Pagination** — nút phân trang là `<button>` → OK. Nhưng chưa có `aria-current="page"` cho page đang active | `PlateList.jsx` | P3 |

### 5.2 Screen Reader

- [ ] **Landmarks**: Có semantic HTML landmarks không?
  - `<header>` hoặc `role="banner"`
  - `<main>` hoặc `role="main"`
  - `<nav>` hoặc `role="navigation"`
  - `<footer>` hoặc `role="contentinfo"`
- [ ] **Heading hierarchy**: Screen reader có thể navigate bằng heading. h1 → h2 → h3 đúng thứ tự không skip?
- [ ] **Image alt text**: Ảnh có `alt` không? Ảnh trang trí có `alt=""` không? PlateVisual có alt không?
- [ ] **Form labels**: Mọi input có `<label>` linked không? Placeholder không thay thế label.
- [ ] **Error messages**: Error text có được link với input qua `aria-describedby` không?
- [ ] **Live regions**: Toast notification có `role="alert"` hoặc `aria-live="polite"` không?
- [ ] **Loading state**: Screen reader có được thông báo khi đang load không? `aria-busy="true"`?
- [ ] **Modal dialogs**: Có `role="dialog"` + `aria-modal="true"` + `aria-labelledby` không?

#### Biensovip Screen Reader Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| SR1 | Thiếu semantic HTML landmarks: không có `<header>`, `<main>`, `<footer>` tag | toàn site (toàn `<div>`) | P2 |
| SR2 | Modal thiếu `role="dialog"`, `aria-modal`, `aria-labelledby` | `Modals.jsx` | P2 |
| SR3 | Form input không có `aria-describedby` link tới error message | `Input` component | P2 |
| SR4 | Form submit error không có `aria-invalid="true"` trên field bị lỗi | `Input` component | P3 |
| SR5 | Switch component thiếu `aria-label` + `role="switch"` + `aria-checked` | `Switch` component | P2 |
| SR6 | SearchField không có `aria-label` — nhất là search trên Home không có label visible | `SearchField` component | P2 |
| SR7 | Toast notification (react-hot-toast) không có `role="alert"` — cần config | App setup | P3 |
| SR8 | PlateVisual (biển số SVG/div) không có `alt` text mô tả | `PlateVisual.jsx` | P3 |
| SR9 | Skeleton/loading không có `aria-busy="true"` | các loading state | P3 |
| SR10 | MobileDrawer backdrop không có `aria-hidden` khi đóng | `MobileDrawer.jsx` | P3 |

---

## Bảng tổng ưu tiên sửa chữa

### P0 — Sửa ngay (ảnh hưởng trực tiếp user thật)

| # | Issue | File | Effort |
|---|-------|------|--------|
| P0-1 | SearchField fixed-width overflow ở 375px | `PlateList.jsx` filter bar | Nhỏ |
| P0-2 | Detail CTA row overflow ở viewport hẹp | `PlateDetail.jsx` | Nhỏ |

### P1 — Sửa sớm (trải nghiệm cơ bản)

| # | Issue | File | Effort |
|---|-------|------|--------|
| P1-1 | Header logo không focus được bằng keyboard | `Header.jsx` | Nhỏ: đổi `<div>` → `<button>` hoặc thêm `role`+`tabIndex`+`onKeyDown` |
| P1-2 | PlateCard không focus được bằng keyboard | `PlateCard` (PlateList, Home) | Nhỏ |
| P1-3 | Header auth buttons hiện trùng lặp trên mobile | `Header.jsx` | Nhỏ: ẩn auth buttons ở mobile breakpoint |
| P1-4 | PlateDetail không có 404 state | `PlateDetail.jsx` | Trung bình |
| P1-5 | BlogDetail không có 404 state | `BlogDetail.jsx` | Trung bình |

### P2 — Accessibility cơ bản

| # | Issue | File | Effort |
|---|-------|------|--------|
| P2-1 | Modal thiếu role, aria-modal, aria-labelledby | `Modals.jsx` | Nhỏ |
| P2-2 | Modal không có focus trap | `Modals.jsx` | Trung bình |
| P2-3 | Modal không đóng bằng Escape | `Modals.jsx` | Nhỏ |
| P2-4 | Switch thiếu `aria-label` + `role="switch"` + `aria-checked` | `Switch` component | Nhỏ |
| P2-5 | SearchField không có `aria-label` prop | `SearchField` component | Nhỏ |
| P2-6 | Input không có `aria-invalid` + `aria-describedby` khi có error | `Input` component | Nhỏ |
| P2-7 | Thiếu semantic HTML landmarks (`<header>`, `<main>`, `<footer>`) | Layout components | Trung bình |
| P2-8 | BlogCard không focus được bằng keyboard | `Blog.jsx` | Nhỏ |
| P2-9 | Home empty state khi featured plates = [] | `Home.jsx` | Nhỏ |
| P2-10 | `--pad-page` không giảm trên mobile | `tokens.css` | Nhỏ |
| P2-11 | IconButton size `sm` = 28px < 44px touch target | `IconButton` component | Nhỏ |

### P3 — Cải thiện trải nghiệm

| # | Issue | File | Effort |
|---|-------|------|--------|
| P3-1 | Toast notification chưa có `role="alert"` | App setup (react-hot-toast config) | Nhỏ |
| P3-2 | PlateVisual không có alt text | `PlateVisual.jsx` | Nhỏ |
| P3-3 | Skeleton/loading không có `aria-busy` | Các loading state | Nhỏ |
| P3-4 | Badge không truncate khi text quá dài | `Badge` component | Nhỏ |
| P3-5 | Mobile font size không giảm | `tokens.css` + page styles | Trung bình |
| P3-6 | Không có container max-width cho màn lớn (1440px+) | Layout | Nhỏ |
| P3-7 | MobileDrawer backdrop không có `aria-hidden` khi đóng | `MobileDrawer.jsx` | Nhỏ |
| P3-8 | Pagination không có `aria-current="page"` | `PlateList.jsx` | Nhỏ |
| P3-9 | Button disabled state chưa có style | `Button.jsx` | Nhỏ |
| P3-10 | `--shadow-inset-hairline` có thể quá mờ | `tokens.css` | Nhỏ (tinh chỉnh giá trị) |

### P4 — Future / Nice to have

| # | Issue | File | Effort |
|---|-------|------|--------|
| P4-1 | Dark mode support | Toàn site | Lớn |
| P4-2 | Route path conflict: `saved` vs `notifications` naming | `routes.js` | Nhỏ (nhưng ảnh hưởng SEO) |
| P4-3 | Footer Zalo OA link `href="#"` — dead link | `Footer.jsx` | Nhỏ |
| P4-4 | App.jsx monolithic state → cần refactor sau này | `App.jsx` | Lớn |
| P4-5 | Container max-width cho desktop 2560px | Layout | Nhỏ |

---

## Công cụ kiểm tra

### Tự động (nên chạy mỗi lần deploy)

| Công cụ | Kiểm tra gì | Câu lệnh |
|---------|------------|----------|
| **Lighthouse** (DevTools) | Performance, Accessibility, Best Practices, SEO | Mở DevTools → Lighthouse → Generate report |
| **axe DevTools** | Accessibility violations (WCAG) | Cài extension → Analyze |
| **WAVE** | Accessibility + contrast | [wave.webaim.org](https://wave.webaim.org/) |
| **Playwright** (đã có) | E2E functional tests | `npx playwright test` |
| **polypane** hoặc **Responsively** | Multi-viewport test cùng lúc | Tải app |

### Thủ công (nên làm 1 lần/tuần)

| Công cụ | Kiểm tra gì | Cách làm |
|---------|------------|----------|
| **Tab key** | Keyboard navigation | Mở site → chỉ dùng Tab/Shift+Tab/Enter/Escape đi hết toàn bộ flow |
| **NVDA (Windows)** | Screen reader miễn phí | [nvaccess.org](https://www.nvaccess.org/download/) |
| **Color contrast checker** | WCAG AA/AAA | [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/) |
| **375px viewport** | Mobile nhỏ nhất (iPhone SE) | DevTools → Device toolbar → 375×812 |
| **200% zoom** | WCAG 1.4.4 Resize text | Ctrl+Plus đến 200% → layout có bể không? |

---

## Quy trình kiểm tra định kỳ (cho solo dev)

### Trước mỗi lần deploy

```
[ ] Build không lỗi (npm run build)
[ ] 86 Playwright tests pass (npx playwright test)
[ ] Tab qua toàn bộ flow chính (Home → List → Detail → Contact)
[ ] Check 1 màn hình mobile 375px
[ ] Check 1 màn hình desktop 1440px
```

### Mỗi tuần 1 lần (thứ 6)

```
[ ] Chạy Lighthouse audit cho Home + PlateList + PlateDetail
[ ] Keyboard test toàn bộ admin flow (login → plates → categories → logout)
[ ] Check console error (không có lỗi đỏ nào)
[ ] Review 1 component bất kỳ theo checklist Bước 2
```

### Mỗi tháng 1 lần

```
[ ] Full screen reader test (NVDA) cho 3 flow chính
[ ] Review lại screen inventory — có màn hình mới không?
[ ] Check tất cả route có empty state chưa
[ ] Cập nhật file này với issue mới phát hiện
```

---

## Ghi chú

- File này là **living document** — mỗi lần thêm màn hình mới, cập nhật Screen Inventory (Bước 1) và State Machine (Bước 3)
- Các issue đã sửa → đánh dấu `~~strikethrough~~` hoặc ghi "ĐÃ SỬA: ngày/tháng"
- P0 và P1 nên được sửa trước khi launch production
- P2 nên hoàn thành trong tháng đầu sau launch
- P3 có thể làm dần trong quá trình maintain
- P4 cân nhắc khi có thời gian hoặc user yêu cầu
