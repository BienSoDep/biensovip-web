# Biensovip.com — biensovip-web

Website bán biển số đẹp (thương hiệu Duy Đinh, Đà Nẵng). React SPA, hiện **chưa có backend** — toàn bộ dữ liệu là mock data tĩnh, chưa có xác thực thật.

## Công nghệ

- **React 19 + Vite** — SPA, không dùng React Router (routing tự viết qua hash: `src/config/routes.js` + `src/hooks/useHashRouter.js`).
- **State**: một object `st` duy nhất trong `src/App.jsx` (`useState`), không dùng Redux/Zustand/Context — xem lý do ở `structure.md` mục 2.
- **Style**: inline style + design token CSS (`src/styles/tokens.css`), không dùng Tailwind/CSS Modules.
- **Dữ liệu**: mock trong `src/lib/mockData.js` (biển số, danh mục, bài viết, liên hệ) — chưa có API thật. Kế hoạch tích hợp backend: xem `docs/API-REQUIREMENTS.md`.
- **Test**: Playwright (E2E), thư mục `e2e/`.

## Cài đặt & chạy

```bash
npm install
npm run dev       # chạy dev server (Vite), mặc định http://localhost:5173
npm run build     # build production vào dist/
npm run preview   # xem thử bản build
npm run lint      # oxlint
```

## Chạy test E2E (Playwright)

```bash
npx playwright install chromium   # chỉ cần chạy 1 lần
npx playwright test               # chạy toàn bộ test, tự khởi động dev server
npx playwright test --ui          # chạy ở chế độ UI để debug
npx playwright show-report        # xem báo cáo HTML sau khi chạy
```

Test bao phủ luồng công khai (trang chủ, danh sách/lọc biển số, chi tiết, yêu thích, đăng ký/đăng nhập/quên mật khẩu, blog, tư vấn hợp mệnh, giới thiệu), luồng quản trị (đăng nhập demo → dashboard → quản lý biển số/danh mục/liên hệ/bài viết → soạn bài), và chuyển đổi Desktop/Mobile. Cấu hình: `playwright.config.js`.

## Cấu trúc thư mục

Xem chi tiết tại [`structure.md`](./structure.md) — mô tả đầy đủ `src/` (animations, common, components, config, hooks, layout, lib, pages, styles) và lý do một số thư mục (`contexts/`, `controllers/`, `services/`, `locales/`) hiện còn rỗng.

## Kế hoạch tích hợp backend

Dự án hiện chạy hoàn toàn trên mock data (`src/lib/mockData.js`, `src/common/constants.js`). Toàn bộ REST API cần xây dựng để thay thế — theo từng tài nguyên (biển số, danh mục, bài viết, liên hệ, người dùng/xác thực, yêu thích), kèm đối chiếu với thiết kế database — xem [`docs/API-REQUIREMENTS.md`](../docs/API-REQUIREMENTS.md).

Tài liệu liên quan khác:
- [`docs/TECH-STACK-PROPOSAL.md`](../docs/TECH-STACK-PROPOSAL.md) — đề xuất công nghệ tổng thể (backend, database, hạ tầng).
- [`docs/database/DATABASE-SCHEMA.md`](../docs/database/DATABASE-SCHEMA.md) và [`docs/database/schema.dbml`](../docs/database/schema.dbml) — thiết kế database chi tiết.
