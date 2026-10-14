# Biensovip Web — React 19 + Vite Frontend

Frontend cho Biensovip.com — nền tảng mua bán biển số xe đẹp.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Runtime | React 19, Vite 8 |
| Language | JavaScript (JSX) — NO TypeScript |
| Routing | Custom path router (`usePathRouter` — dựa trên `window.location.pathname`) |
| UI | `@base-ui/react`, custom CSS tokens |
| Animation | `framer-motion` |
| Icons | `lucide-react` |
| Editor | `@tiptap/react` (rich text, blog compose) |
| Charts | `recharts` (admin dashboard) |
| Toast | `react-hot-toast` |
| Hooks | `@mantine/hooks` |
| Lint | `oxlint` |
| Test | `@playwright/test` |
| Dates | `date-fns` |

## Project structure

```
biensovip-web/
├── vite.config.js
├── package.json
├── .oxlintrc.json
├── playwright.config.js
├── index.html
└── src/
    ├── main.jsx                    # Entry — StrictMode
    ├── App.jsx                     # Root — state + routing + data orchestration
    ├── animations/
    │   └── heroAnim.js             # Hero section animations
    ├── assets/                     # Static images
    ├── common/
    │   └── constants.js            # PER_PAGE, shared constants
    ├── components/
    │   ├── index.jsx               # Barrel: Input, Select, Button, Badge, Icon*, Card, InfoTip, ImageUrlInput…
    │   ├── AdminTabbedPage.jsx     # Component tab ngang chuẩn mực (Pure Derived State, URL ?tab=..., popstate)
    │   ├── FloatingActionBar.jsx   # Thanh công cụ thao tác hàng loạt nổi (bỏ ẩn, ẩn, duyệt giá, copy, export)
    │   ├── PriceReferenceModal.jsx # Popup minh bạch nguồn gốc & công thức định giá gợi ý VPA
    │   ├── Modal.jsx / Drawer.jsx  # Overlay + body scroll-lock (bù scrollbar để không nhích layout)
    │   ├── ConfirmModal.jsx        # Xác nhận thao tác (xoá, bulk…)
    │   ├── GlobalSearch.jsx        # Tìm kiếm toàn site
    │   ├── LandingBody.jsx         # Nội dung landing tỉnh/loại biển + khối liên kết bài viết blog
    │   ├── RichTextEditor.jsx      # Tiptap wrapper (blog compose)
    │   ├── PlateCard.jsx / PlateVisual.jsx
    │   ├── LazyImage.jsx           # Lazy-load ảnh
    │   ├── BackToTop.jsx, CompareBar.jsx, PromoRails.jsx, TikTokEmbed.jsx
    │   ├── InternalNotesPanel.jsx, AuditHistoryButton.jsx, EmailCapture.jsx
    │   ├── GoogleSignInButton.jsx, TwoFactorSettingsModal.jsx
    │   ├── AiChatbot.jsx           # AI chatbot floating widget
    │   ├── RequireAuth.jsx         # Auth guard
    │   ├── Breadcrumb.jsx, NavBtn.jsx, Button.jsx, ErrorBoundary.jsx, Skeleton.jsx
    │   └── skeletons/              # Skeleton primitives per pattern
    ├── config/
    │   └── routes.js               # PUBLIC_SCREENS, ADMIN_SCREENS, parseRoute, routeFor, PROVINCE_LANDINGS, PLATE_TYPE_LANDINGS
    ├── contexts/                   # React Context (nếu cần)
    ├── controllers/                # Logic phức tạp/không-UI
    ├── hooks/
    │   ├── usePathRouter.js        # Path-based routing (parse pathname → screen)
    │   ├── useDelayedLoading.js, useStaggeredReveal.js, useExportCsv.js, useSeo.js
    ├── layout/
    │   ├── AdminShell.jsx          # Admin layout wrapper (7 nhóm phân hệ, 24 màn hình, user chip)
    │   ├── Footer.jsx              # Footer — link tỉnh/loại-biển trỏ thẳng `/bai-viet/{slug}`
    │   ├── Header.jsx, MobileDrawer.jsx, Modals.jsx
    ├── lib/
    │   ├── authStore.js            # JWT/auth localStorage
    │   ├── cloudinary.js           # Upload ảnh → Cloudinary
    │   ├── plateFormat.js, phone.js, date.js, fengshui.js, compareInsights.js, unsavedGuard.js
    │   ├── mockData.js             # LEGACY — chỉ còn import trong App.jsx và lib/phone.js. KHÔNG dùng cho dữ liệu chính.
    │   └── content/vi/*.json       # Nội dung tiếng Việt tĩnh
    ├── pages/
    │   ├── Auth.jsx                # register/login/forgot/adminLogin + OTP + Google (2 cột info/form)
    │   ├── Home.jsx, Blog.jsx (phân trang 12/bài), Post.jsx, PlateList.jsx, PlateDetail.jsx
    │   ├── ProvinceLandingPage.jsx, PlateTypeLandingPage.jsx   # Landing tỉnh/loại biển
    │   ├── Profile.jsx, VerifyEmail.jsx, GmailCallback.jsx
    │   ├── LuckyPlate.jsx, Compare.jsx, Fav.jsx, SavedSearches.jsx, Reviews.jsx, Notifications.jsx
    │   ├── ChatZaloContact.jsx, Collaborator.jsx, TransferGuide.jsx
    │   ├── About.jsx, Faq.jsx, Terms.jsx, Privacy.jsx
    │   ├── NotFound.jsx, ServerError.jsx
    │   └── admin/
    │       ├── Dashboard.jsx, AdminPlates.jsx, AdminCats.jsx, AdminContacts.jsx, AdminCustomers.jsx
    │       ├── AdminStaff.jsx (RBAC 30 resources + presets Dev/Vận hành + đổi MK), AdminPosts.jsx, Compose.jsx
    │       ├── AdminVpa.jsx (5 tab ngang qua AdminTabbedPage), AdminVpaStats.jsx, AdminSettings.jsx
    │       ├── AdminMeanings.jsx, AdminVideos.jsx, AdminReviews.jsx, AdminNotifications.jsx
    │       ├── AdminCollaborators.jsx, AdminChatbot.jsx, AdminAuditLog.jsx, EmailBuilder.jsx
    │       ├── AdminFengShuiHistory.jsx  # Lịch sử luận giải biển (thống kê + danh sách + chi tiết + đánh dấu đã follow-up)
    │       ├── dashboard/          # Widget/chart tách khỏi Dashboard.jsx (DashboardWidgets, DashboardAdvancedCharts)
    │       ├── fengshui-history/   # Component con của AdminFengShuiHistory (vd. FengShuiHistoryDetailModal)
    │       ├── customers/, plates/, contacts/, insights/, notifications/, servers/, vpaStats/ # Thư mục con theo màn hình lớn
    │       └── vpa/                # VpaAdminList, VpaPriceQueue, VpaAuctionResults, VpaCrawlAdmin, VpaWorkflowGuide
    ├── services/                    # API clients — mỗi domain 1 file (dùng `apiClient`)
    │   ├── apiClient.js             # fetch wrapper (JWT, ApiResponse<T>, upload)
    │   ├── authService.js, plates.js, plateDetail.js, blog.js, categories.js, landing.js
    │   ├── adminStaff.js, adminPlates.js, adminVpa.js, adminDashboard.js, adminAuditLog.js, …
    │   └── (40+ file — xem thư mục)
    └── styles/
        ├── app.css                 # Main stylesheet (gồm @media mobile: FAB, plate-grid 1 cột…)
        ├── skeleton.css
        └── tokens.css              # Design tokens CSS (màu/spacing/radius — KHÔNG hardcode)
```

## Architecture patterns

### State management
- **No global state library.** State trong `App.jsx` (`useState` + `patch()` partial update).
- `patch()`: cập nhật một phần state — `patch({ screen: 'home' })` hoặc functional.
- State truyền xuống qua props. Auth persist qua `lib/authStore.js` (JWT).

### Routing
- **Path-based.** `usePathRouter` parse `window.location.pathname` → screen + params.
- Route config trong `config/routes.js`: `PUBLIC_SCREENS`, `ADMIN_SCREENS`, `parseRoute()`, `routeFor()`, `PROVINCE_LANDINGS`, `PLATE_TYPE_LANDINGS`.
- Điều hướng qua `go('screen')()`.

### Data layer — REAL API (đã tích hợp backend)
- **Mọi dữ liệu chính qua API.** `services/apiClient.js` bọc `fetch` (tự gắn JWT, unwrap `ApiResponse<T>`, hàm `upload`).
- Mỗi domain một service file trong `services/` (authService, plates, blog, categories, adminStaff…).
- Các page gọi service hook/function, KHÔNG dùng `lib/mockData.js` cho dữ liệu chính. `mockData.js` còn import trong `App.jsx` và `lib/phone.js` (legacy, không phải data source).

### Code splitting
- Page component load qua `React.lazy(() => import(...))` + `<Suspense>` fallback `<PageSkeleton>`.
- Admin shell, modals, AI chatbot cũng lazy-load.

### CSS
- Design tokens trong `tokens.css` — CSS custom properties. KHÔNG hardcode màu/spacing/radius (xem FRONTEND-DESIGN-RULES.md).
- `app.css` — mọi style component + responsive mobile.
- Không CSS modules, không Tailwind, không CSS-in-JS.

### Skeleton loading
- `useDelayedLoading` tránh flash spinner. `useStaggeredReveal` cho list. `LazyImage` placeholder khi ảnh chưa load.

### Error handling
- `ErrorBoundary` bọc toàn app. `ServerError` cho lỗi nghiêm trọng. `NotFound` 404.

## Key dependencies

| Package | Usage |
|---------|-------|
| `@base-ui/react` | Unstyled accessible UI primitives (Select…) |
| `@mantine/hooks` | `useDebouncedValue`, utility hooks |
| `@tiptap/react` | Rich text editor (blog compose) |
| `framer-motion` | Page transitions, hero animations, staggered lists |
| `lucide-react` | Icon library |
| `recharts` | Admin dashboard charts |
| `react-hot-toast` | Toast notifications |
| `date-fns` | Date formatting |

## How to run

```bash
npm install
npm run dev           # Vite dev server
npm run build         # Production build
npm run lint          # oxlint
npm run preview       # Preview production build
npm run validate:content  # Validate content JSON files
```

Backend phải chạy song song (`dotnet run --project src/Biensovip.Api`) — frontend gọi API trực tiếp.

## Conventions

### Naming
- **Components:** PascalCase `.jsx`. **Hooks:** camelCase `use` prefix `.js`.
- **Lib/utils:** camelCase `.js`. **Pages:** PascalCase `.jsx`. **Folders:** lowercase kebab-case.
- **Service files:** camelCase `.js` trong `services/`.

### Component patterns
- Functional components only. Destructure props trong signature. Không PropTypes (plain JS).
- Export default cho page, named export cho shared component.
- One component per file (trừ barrel `index.jsx`).

### Input password — eye toggle (TOÀN CỤC)
- `Input` (`components/index.jsx`) tự hiện nút 👁 hiện/ẩn khi `type === 'password'` — áp dụng mọi form mật khẩu (register/login/admin). Button toggle có `e.preventDefault()` tránh trigger label-default.
- KHÔNG thêm eye riêng từng nơi — đã nằm trong `Input`.

## Screens

### Public
`home, list, detail, register, login, forgot, fav, profile, lucky, about, blog, post, chat, compare, saved, reviews, notifications, collab, terms, privacy, transfer, faq, gmailCallback, provinceLanding, plateTypeLanding, notfound`

### Admin
`dash, adminLogin, aplates, avpa, avpastats, acats, acontacts, aposts, compose, acustomers, astaff, avideos, anotifications, aemailtpl, acollabs, areviews, ameanings, achatbot, aauditlog, asettings, apolicies, asubscribers, amaintenance, avanity, aerrorlog, adbconsole, aflags, apaylinks, acoupons, arisks`

### Error
`notfound, servererror`

## Tính năng đã triển khai (mới — theo đúng code hiện tại)

### Admin đổi mật khẩu nhân viên
- Backend: `PATCH /api/admin/staff/{id}/password` (`StaffService.ResetPasswordAsync`) — validate ≥6, hash BCrypt, revoke sessions, ghi audit (action `update` + changes marker `reset_password` — do DB check constraint chỉ cho phép action whitelist).
- Frontend: `services/adminStaff.js` `useResetStaffPassword()` + nút "Đổi mật khẩu" mỗi hàng trong `AdminStaff.jsx` → modal nhập mật khẩu mới.
- Khi nhân viên quên mật khẩu: admin đổi rồi gửi lại cho nhân viên.

### Blog phân trang
- `Blog.jsx`: 12 bài/trang, nút Trước/Sau. Khi lọc (category/tìm kiếm) load limit 100 client-side. Đổi filter reset về trang 1.

### Footer link → bài viết blog
- `Footer.jsx`: link loại biển & tỉnh trỏ thẳng `/bai-viet/{slug}` (bài blog), không trỏ landing tỉnh — đúng kiểu bài blog hệ thống.

### Mobile responsive fixes
- `app.css`: FAB (chatbot/zalo/back-to-top) thu về 44px ≤768px; `plate-grid` 1 cột ≤480px; hero-desc `text-overflow:ellipsis`; hero badge/price `flexWrap:wrap`.
- `Modal.jsx`/`Drawer.jsx`: scroll-lock bù scrollbar (`paddingRight = scrollbarWidth`) — không làm layout nhích ngang khi mở overlay.

### Phân hệ Biển VPA & Thao tác hàng loạt (UC49)
- **Bỏ ẩn hàng loạt (`isHidden: false`):** Kích hoạt API `POST /api/admin/vpa/plates/bulk-edit`, tự động đồng bộ bật hiển thị công khai `plates.visible = true`.
- **Ẩn hàng loạt (`isHidden: true`):** Đánh dấu ẩn khỏi khách hàng `plates.visible = false`.
- **Thanh công cụ nổi (`FloatingActionBar`):** Duyệt giá gợi ý, từ chối giá, đổi tab, đổi loại/tỉnh, ghim, nổi bật, sao chép số biển vào clipboard, xuất CSV các biển đã chọn.
- **Chọn thông minh:** Bộ chọn nhanh các biển đang ẩn, biển chưa duyệt giá trên trang hiện tại.
- **Hướng dẫn quy trình (`VpaWorkflowGuide`):** Modal và tab hướng dẫn chi tiết quy trình duyệt giá, mã màu nhãn trạng thái và vòng đời biển VPA.

### Thành phần Tab chuẩn hóa (`AdminTabbedPage.jsx`)
- Pure Derived State pattern: Loại bỏ cascading re-renders, render mượt mà không cảnh báo linter.
- Tự động đồng bộ URL search param (`?tab=...`), hỗ trợ lịch sử trình duyệt Back/Forward qua sự kiện `popstate`.

### Phân quyền Nhân viên đa tầng (`AdminStaff.jsx`)
- Hỗ trợ đầy đủ 30 resources trong `PermissionCatalog` (bao gồm `analytics:view`, `vpa_prices:view/update`).
- Presets phân quyền: "Preset Dev", "Nhân viên vận hành", chọn hết / bỏ chọn theo từng nhóm danh mục.

## Integration with backend

- **Đã tích hợp real API.** Backend URL qua `VITE_API_URL`. Response dùng `ApiResponse<T>`.
- Auth: JWT access/refresh, login/register/OTP/Google. Admin riêng (`AdminOnly`/`SuperAdminOnly`).
- Admin RBAC: quản lý staff + phân quyền resource×action (xem ROLES-PERMISSIONS.md).
- All docs: [../biensodep-infrastructure/docs/](../biensodep-infrastructure/docs/)
