# Biensovip.com — Frontend Web Application
### Ứng Dụng Web & Cổng Quản Trị Sàn Giao Dịch Biển Số Xe Đẹp
### React 19 | Vite 8 | Vanilla Design Tokens CSS | Lucide Icons

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React Query](https://img.shields.io/badge/TanStack%20Query-5.x-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Icons](https://img.shields.io/badge/Icons-Lucide%20React-F6821F?logo=lucide&logoColor=white)](https://lucide.dev/)
[![E2E](https://img.shields.io/badge/Testing-Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

Frontend Single Page Application (SPA) cho nền tảng thương mại điện tử mua bán biển số xe đẹp **Biensovip.com** (thương hiệu Duy Đinh, Đà Nẵng). Ứng dụng tích hợp đầy đủ trải nghiệm người dùng hiện đại, tốc độ tải trang nhanh, chuẩn SEO & GEO, cùng cổng Quản Trị Viên (Admin Portal) chuyên sâu.

---

## 1. CÔNG NGHỆ CHỦ ĐẠO (TECH STACK)

| Lớp | Công nghệ / Thư viện | Đặc điểm & Lý do sử dụng |
|---|---|---|
| **Core Runtime** | React 19 + Vite 8 | Tối ưu hóa hiệu năng, cập nhật tính năng mới nhất của React 19 |
| **Kiến trúc CSS** | Vanilla Design Tokens (`tokens.css`, `app.css`) | Thiết kế tùy biến cao, nhất quán, không dùng Tailwind CSS |
| **Thư viện Icon** | `lucide-react` | Chuẩn hóa 100% icon toàn ứng dụng, không dùng icon thô/emoji |
| **Quản lý Server State** | `@tanstack/react-query` v5 | Caching thông minh, tự động revalidate và đồng bộ dữ liệu |
| **Thành phần UI** | `@base-ui/react`, `@mantine/hooks` | Accessible, headless primitives cao cấp |
| **Đồ họa & Trực quan** | `recharts`, SVG BCA Plate Visual | Biểu đồ biến động giá VPA và mô phỏng dập nổi phôi biển số |
| **Soạn thảo Văn bản** | `@tiptap/react` | Trình soạn thảo WYSIWYG chuyên nghiệp cho bài viết Blog |
| **Hiệu ứng Chuyển động** | `framer-motion` | Micro-animations mượt mà, tăng trải nghiệm người dùng |
| **Kiểm thử & Chất lượng**| `oxlint`, `@playwright/test` | Linter siêu tốc và bộ kiểm thử End-to-End toàn diện |

---

## 2. TÍNH NĂNG NỔI BẬT

### Trải nghiệm Người Dùng (Public Experience)
- **Bộ lọc chuẩn hóa 4 tiêu chí:** Đồng bộ logic lọc (`Loại biển`, `Loại xe`, `Tỉnh/thành`, `Nổi bật`) trên tất cả các trang Biển số, Biển VPA và Kết quả đấu giá.
- **Phôi biển số dập nổi chuẩn BCA:** Mô phỏng đồ họa chính xác kích thước, màu sắc, font chữ và cờ theo quy định mới nhất của Bộ Công An.
- **Tra cứu phong thủy ngũ hành:** Phân tích cát hung quẻ dịch, số nút may mắn, hỗ trợ tìm biển số xe hợp mệnh.
- **Quy trình giữ chỗ 15 phút:** Tự động tạo mã QR VietQR Napas247 động, xác thực thanh toán tức thì.
- **AI Chatbot tư vấn:** Trợ lý ảo phản hồi 24/7 theo ngữ cảnh kho biển số.

### Cổng Quản Trị Chuyên Sâu (Admin Portal)
- **Quản lý kho biển số shop:**
  - Sửa giá bán trực tiếp trên bảng (inline edit), cấu hình giá khuyến mãi, biển tặng kèm.
  - **Cột "Giá TT tham khảo":** Hiển thị ngay giá thị trường tính toán từ VPA để admin đối chiếu nhanh giá bán của shop.
  - **Popup minh bạch công thức (`PriceReferenceModal`):** Hiển thị phương thức suy luận, công thức chi tiết `TB giá trúng × Hệ số = Giá gợi ý` và danh sách 50 phiên đấu giá mẫu thực tế.
- **Quản lý VPA & Định giá tự động (UC49):**
  - Danh sách biển VPA, phân tích thị trường, biểu đồ thống kê theo tỉnh thành/loại biển.
  - Giám sát tiến độ Crawler, xử lý ngoại lệ (Integrity Panel) và duyệt giá hàng loạt.
- **Quản trị nội dung & Marketing:** Soạn bài viết blog, quản lý danh mục, chính sách, CRM liên hệ và hệ thống cộng tác viên (CTV).

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN

```
biensovip-web/
├── index.html                  # HTML entrypoint, SEO meta, font preloads
├── vite.config.js              # Cấu hình Vite & proxy
├── playwright.config.js        # Cấu hình kiểm thử E2E Playwright
├── src/
│   ├── main.jsx                # Bootstrap React app
│   ├── App.jsx                 # Root component: router, global states & providers
│   ├── components/             # Reusable UI components
│   │   ├── PriceReferenceModal.jsx # Popup minh bạch nguồn & công thức giá gợi ý VPA
│   │   ├── PlateVisual.jsx     # Đồ họa phôi biển dập nổi chuẩn BCA
│   │   └── ...                 # Button, Modal, Skeleton, Badge, etc.
│   ├── pages/                  # Màn hình giao diện
│   │   ├── admin/              # Phân hệ quản trị (AdminPlates, VpaAdminList, etc.)
│   │   └── ...                 # Home, PlateList, PlateDetail, Blog, LuckyPlate, etc.
│   ├── services/               # Tầng giao tiếp API (apiClient, adminVpa, plates, etc.)
│   ├── hooks/                  # Custom hooks (useHashRouter, useSeo, etc.)
│   ├── lib/                    # Utilities: định dạng biển số, phong thủy, ngày tháng
│   └── styles/                 # Hệ thống CSS Design Tokens (tokens.css, app.css)
└── e2e/                        # Test kịch bản Playwright
```

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình Môi trường
Tạo file `.env` tại thư mục gốc `biensovip-web`:
```dotenv
VITE_API_URL=http://localhost:5080
```

### 3. Khởi động Dev Server
```bash
npm run dev
```
Truy cập tại: `http://localhost:5173`

### 4. Build Production & Kiểm tra
```bash
# Build đóng gói vào thư mục dist/
npm run build

# Xem trước bản build
npm run preview

# Kiểm tra cú pháp và code quality
npm run lint
```

### 5. Chạy Kiểm Thử E2E (Playwright)
```bash
# Cài đặt trình duyệt kiểm thử (chỉ cần chạy 1 lần)
npx playwright install chromium

# Chạy kiểm thử tự động
npx playwright test

# Mở giao diện kiểm thử trực quan
npx playwright test --ui
```

---

## 5. DANH SÁCH ROUTES CHÍNH

- **Công khai (`#/`):**
  - `#/` — Trang chủ
  - `#/list` — Kho biển số (tìm kiếm & lọc nâng cao)
  - `#/detail/:id` — Chi tiết biển số xe & đặt giữ chỗ
  - `#/lucky` — Bói phong thủy biển số & tìm biển hợp mệnh
  - `#/compare` — So sánh 2 biển số
  - `#/blog` & `#/blog/:slug` — Cẩm nang & tin tức xe cộ
  - `#/reviews` — Đánh giá khách hàng thực tế
- **Quản trị (`#/admin/`):**
  - `#/admin/dash` — Bảng điều khiển kinh doanh tổng quan
  - `#/admin/plates` — Quản lý kho biển số & giá thị trường tham khảo
  - `#/admin/vpa` — Danh sách biển VPA, Crawler & duyệt giá tự động
  - `#/admin/vpa-stats` — Thống kê & Phân tích thị trường VPA
  - `#/admin/contacts` — Khách hàng & CRM tư vấn

---

© 2026 **Biensovip.vn** — Duy Đinh, Biển Số Đẹp Đà Nẵng.
