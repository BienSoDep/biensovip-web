# Biensovip.com — biensovip-web

Frontend cho website mua bán biển số xe đẹp **Biensovip.com** (thương hiệu Duy Đinh, Đà Nẵng). React 19 SPA, đã nối API backend thật (biển số, danh mục, blog, liên hệ) qua `React Query`.

## Công nghệ

| Layer | Công nghệ |
|-------|-----------|
| Runtime | React 19 + Vite 8 |
| Language | JavaScript (JSX) — không TypeScript |
| Routing | Hash-based router tự viết (`useHashRouter`) |
| State | `useState` trong `App.jsx`, không dùng Redux/Context |
| Server state | `@tanstack/react-query` |
| Data | API backend qua `services/` + `VITE_API_URL` |
| UI | `@base-ui/react` + CSS design tokens (`tokens.css`) |
| Animation | `framer-motion` |
| Editor | `@tiptap/react` (soạn bài blog) |
| Charts | `recharts` (dashboard quản trị) |
| Lint | `oxlint` |
| Test | `@playwright/test` (E2E) |

## Cài đặt & chạy

```bash
npm install
npm run dev         # dev server (Vite) — mặc định http://localhost:5173
npm run build       # build production vào dist/
npm run preview     # xem thử bản build
npm run lint        # oxlint
npm run validate:content  # kiểm tra file content JSON
```

### Kết nối backend

Frontend gọi API qua `services/apiClient.js`, URL lấy từ `VITE_API_URL`. Tạo file `.env`:

```dotenv
VITE_API_URL=http://localhost:5028   # trỏ tới biensovip-backend
```

Backend mặc định chạy tại `http://localhost:5028`. Hướng dẫn backend: [biensovip-backend/README.md](../biensovip-backend/README.md).

## Test E2E (Playwright)

```bash
npx playwright install chromium       # chỉ cần chạy 1 lần
npx playwright test                   # chạy toàn bộ test, tự khởi động server
npx playwright test --ui              # chế độ UI để debug
npx playwright show-report            # xem báo cáo HTML
```

Cấu hình: `playwright.config.js`. Bao phủ luồng công khai (trang chủ, danh sách/lọc biển, chi tiết, yêu thích, đăng ký/đăng nhập/quên mật khẩu, blog, tư vấn, giới thiệu), luồng quản trị (đăng nhập demo → dashboard → quản lý biển số/danh mục/liên hệ/bài viết → soạn bài), và chuyển đổi Desktop/Mobile.

## Cấu trúc thư mục

```
src/
├── main.jsx                 # Entry — StrictMode
├── App.jsx                  # Root — toàn bộ state + routing
├── animations/
├── common/                  # constants
├── components/              # UI components chia sẻ (barrel index.jsx)
├── config/routes.js         # Định nghĩa route (PUBLIC_SCREENS, ADMIN_SCREENS)
├── contexts/                # .gitkeep — reserve React Context
├── controllers/             # .gitkeep — reserve business logic
├── hooks/                   # useHashRouter, useSeo, useStaggeredReveal, ...
├── layout/                  # Header, Footer, MobileDrawer, AdminShell, Modals
├── lib/                     # mockData.js (fallback), authStore.js, content/vi/*.json
├── pages/                   # trang công khai + admin/
├── services/                # API client + từng tài nguyên (plates, blog, categories...)
└── styles/                  # app.css, tokens.css, skeleton.css
```

Chi tiết đầy đủ từng thư mục: [`structure.md`](./structure.md) và [`CLAUDE.md`](./CLAUDE.md).

## Kiến trúc

- **State cục bộ:** mọi state trong `App.jsx` qua `useState` + helper `patch()`. Không Redux/Zustand/Context (thư mục `contexts/` đang rỗng, dành khi cần).
- **Routing:** hash-based, tự viết. Cấu hình tại `config/routes.js`. Dạng `#/screen` hoặc `#/screen/param`, điều hướng qua `go('screen')()`.
- **Dữ liệu server:** `services/` gọi backend; `@tanstack/react-query` quản lý cache/server state.
- **Code splitting:** mọi trang tải qua `React.lazy` + `Suspense`, fallback `<PageSkeleton/>`.
- **Content:** nội dung tiếng Việt trong `lib/content/vi/*.json`, truy cập qua `contentGet('common.breadcrumb.home')`.
- **Error:** `ErrorBoundary` bọc toàn app, `NotFound` (404) / `ServerError` (500).

## Screens

- **Public (21 route):** `home, list, detail, register, login, forgot, fav, lucky, about, blog, post, chat, compare, saved, reviews, notifications, collab, terms, privacy, transfer, faq`
- **Admin (12 route):** `dash, adminLogin, aplates, acats, acontacts, aposts, compose, acustomers, astaff, avideos, anotifications, acollabs`
- **Error:** `notfound, servererror`

## Tài liệu liên quan

- Thiết kế database & API: [`docs/database/schema.dbml`](../biensodep-infrastructure/docs/database/schema.dbml), [`docs/api/API-REQUIREMENTS.md`](../biensodep-infrastructure/docs/api/API-REQUIREMENTS.md)
- Đề xuất công nghệ: [`docs/architecture/TECH-STACK-PROPOSAL.md`](../biensodep-infrastructure/docs/architecture/TECH-STACK-PROPOSAL.md)
- Screen specs (21 màn): [`docs/specs/screens/INDEX.md`](../biensodep-infrastructure/docs/specs/screens/INDEX.md)
