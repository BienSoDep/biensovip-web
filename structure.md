# Cấu trúc thư mục — biensovip-web

Tài liệu mô tả cấu trúc thư mục hiện tại của `src/`, đã tái cấu trúc theo mẫu 13-thư mục (animations/common/components/config/contexts/controllers/hooks/layout/lib/locales/pages/services/store). Một số thư mục còn rỗng vì dự án chưa có nội dung thật cần đặt vào đó (không tạo component/logic giả cho đủ bộ) — xem mục 2.

## 1. Cấu trúc hiện tại

```
src/
├── App.jsx              # Root component — state (st/patch), render theo screen
├── main.jsx              # Entry point (ReactDOM.render)
├── index.css              # Global reset/base
├── App.css
│
├── animations/
│   └── heroAnim.js         # makeHeroAnim(fanDoneRef) — hiệu ứng fan-in ảnh hero trang chủ
│
├── assets/                 # Ảnh tĩnh (logo, hero...)
│
├── common/
│   └── constants.js         # NAV, ADMIN_NAV, TONES, STATUS_FG, PER_PAGE — hằng số UI dùng chung
│
├── components/              # Component dùng chung, không gắn nghiệp vụ cụ thể (trước đây là ui/)
│   ├── Button.jsx
│   ├── NavBtn.jsx
│   ├── Breadcrumb.jsx
│   ├── PlateCard.jsx
│   ├── PlateVisual.jsx
│   └── index.jsx             # Re-export (Input, Select, Badge, IconButton, Avatar, Toast...)
│
├── config/
│   └── routes.js             # SCREENS, ROUTE_MAP, parseRoute, routeFor, ADMIN_SCREENS, PUBLIC_SCREENS
│
├── contexts/
│   └── .gitkeep               # Rỗng — chưa cần Context, state của App.jsx còn đủ nhỏ để prop-drilling
│
├── controllers/
│   └── .gitkeep               # Rỗng — chưa có business logic đủ phức tạp để tách khỏi hooks/component
│
├── hooks/
│   ├── useSeo.js               # Set document.title/meta/OG/JSON-LD theo screen hiện tại
│   └── useHashRouter.js         # Đồng bộ URL hash ↔ state.screen (2 chiều)
│
├── layout/                    # Khung giao diện dùng chung, bao toàn bộ page (trước đây nằm trong pages/)
│   ├── Header.jsx               # Nav công khai
│   ├── Footer.jsx               # Footer công khai
│   ├── Modals.jsx                # Modal dùng chung (thêm/sửa biển, xác nhận xóa, liên hệ, toast)
│   └── AdminShell.jsx             # Khung sidebar + breadcrumb cho toàn bộ trang quản trị
│
├── lib/
│   └── mockData.js              # Mock data (PLATES, POSTS, CONTACTS, CATS...) + helper thuần (priceNum, opts, validatePhone)
│
├── locales/
│   └── .gitkeep                  # Rỗng — chưa làm đa ngôn ngữ (toàn bộ copy đang tiếng Việt inline)
│
├── pages/                       # Từng màn hình (screen), tương ứng 1 SCREEN trong config/routes.js
│   ├── Home.jsx
│   ├── PlateList.jsx
│   ├── PlateDetail.jsx
│   ├── Auth.jsx                   # Đăng nhập/đăng ký/quên mật khẩu (+ đăng nhập quản trị)
│   ├── Fav.jsx
│   ├── LuckyPlate.jsx
│   ├── About.jsx
│   ├── Blog.jsx
│   ├── Post.jsx
│   ├── AdminLogin.jsx              # (không dùng trong App.jsx hiện tại — Auth.jsx đảm nhiệm luôn)
│   └── admin/                       # Nhóm màn hình quản trị (render trong layout/AdminShell.jsx)
│       ├── Dashboard.jsx
│       ├── AdminPlates.jsx
│       ├── AdminCats.jsx
│       ├── AdminContacts.jsx
│       ├── AdminPosts.jsx
│       └── Compose.jsx
│
├── services/
│   └── .gitkeep                 # Rỗng — chưa có API thật, dữ liệu lấy từ lib/mockData.js
│
└── styles/
    ├── tokens.css                 # Design tokens (màu, spacing, typography — biến CSS)
    └── app.css                     # Style dùng chung (pill-btn, keyframes...)
```

## 2. Vì sao một số thư mục còn rỗng

`contexts/`, `controllers/`, `services/`, `locales/` được tạo theo đúng cấu trúc yêu cầu nhưng chưa có file thật — mỗi thư mục có 1 file `.gitkeep` ghi chú lý do rỗng và điều kiện để bắt đầu dùng:

| Thư mục | Khi nào bắt đầu dùng |
|---|---|
| `contexts/` | Khi state global (user, theme...) cần thoát khỏi prop-drilling ở `App.jsx` |
| `controllers/` | Khi có logic điều phối nghiệp vụ phức tạp, tách khỏi `hooks/`/`components/` |
| `services/` | Khi có API thật thay cho `lib/mockData.js` — đặt API client/endpoint wrapper theo domain (`plateService.js`...) |
| `locales/` | Khi làm đa ngôn ngữ (i18n) — hiện toàn bộ copy tiếng Việt viết inline trong component |

`store/` (Zustand/Redux) chưa tạo vì `App.jsx` vẫn dùng `useState` nội bộ đủ đáp ứng — chỉ thêm khi cần state management ngoài Context.

## 3. Quy ước

- `App.jsx` là single source of truth cho `state` (`st`), điều hướng (`go`, `s`) — chưa dùng React Router, tự quản lý hash routing qua `hooks/useHashRouter.js` + `config/routes.js`.
- `layout/` chứa khung giao diện bao toàn trang (Header/Footer/Modals/AdminShell); `pages/` chứa nội dung riêng từng screen. Phân biệt: đổi `layout/` ảnh hưởng mọi trang cùng lúc, đổi 1 file trong `pages/` chỉ ảnh hưởng 1 screen.
- `components/` chỉ chứa component thuần trình bày (button, card, breadcrumb, input...), không chứa logic nghiệp vụ hay gọi API.
- `common/constants.js` chứa hằng số UI tĩnh (nav, tone màu badge); `lib/mockData.js` chứa dữ liệu mẫu + hàm thuần không phụ thuộc React — tách hai nơi để khi thay mock data bằng API thật, không đụng tới hằng số UI.
- `config/routes.js` là nơi duy nhất định nghĩa ánh xạ screen ↔ URL — không lặp lại `ROUTE_MAP` ở nơi khác.

## 4. Còn lại cần cân nhắc

- `App.jsx` vẫn còn lớn (~330 dòng) do gộp toàn bộ state + handler nghiệp vụ (CRUD biển số, auth, contact...). Đã tách phần routing/SEO/animation ra `config/`, `hooks/`, `animations/` — bước tiếp theo nếu cần gọn hơn: tách các nhóm handler (`adminSignIn`, `authSubmit`, `savePlate`...) vào `controllers/` khi logic phức tạp hơn (gọi API thật, validate nhiều bước).
- `pages/AdminLogin.jsx` hiện không được `App.jsx` sử dụng (màn hình `adminLogin` render qua `Auth.jsx` với prop `admin`) — giữ nguyên vì đã tồn tại trước khi tái cấu trúc, không thuộc phạm vi thay đổi lần này.
