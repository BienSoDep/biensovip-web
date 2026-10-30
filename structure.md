# Cấu trúc thư mục & Kiến trúc — biensovip-web

Tài liệu mô tả chi tiết kiến trúc hiện tại của dự án `biensovip-web` (React 19, Vite 8, TanStack Query v5, Path Router, Design Tokens CSS).

---

## 1. Cấu trúc thư mục tổng thể

```
src/
├── App.jsx                     # Root component: Path Router, Session Restore, QueryClientProvider
├── main.jsx                    # Entry point (React 19 createRoot)
├── index.css                   # Global reset, typography, base layout
├── App.css                     # App container & global layout utilities
│
├── animations/
│   └── heroAnim.js             # Hiệu ứng chuyển động (hero visual, fan-in)
│
├── assets/                     # Tài nguyên tĩnh: SVG BCA flag, logo, placeholder images
│
├── common/
│   └── constants.js            # Hằng số giao diện: TONES, STATUS_FG, PER_PAGE, v.v.
│
├── components/                 # UI components dùng chung (nghiệp vụ & trình bày)
│   ├── AdminTabbedPage.jsx     # Component gộp tab ngang chuẩn mực (Pure Derived State, URL ?tab=..., popstate)
│   ├── Button.jsx              # Button component đa dạng variant (primary, outline, ghost, danger)
│   ├── NavBtn.jsx              # Nút navigation
│   ├── Breadcrumb.jsx          # Thanh điều hướng phân cấp breadcrumbs
│   ├── PlateCard.jsx           # Card hiển thị biển số ngoài sàn (tag, giá, ảnh mô phỏng)
│   ├── PlateVisual.jsx         # Mô phỏng phôi biển dập nổi chuẩn BCA bằng SVG/CSS
│   ├── TikTokEmbed.jsx         # Component Facade nhúng video TikTok tối ưu (0 iframe ban đầu, click-to-play)
│   ├── TikTokIcon.jsx          # Icon SVG nốt nhạc TikTok chuẩn nhận diện
│   ├── PriceReferenceModal.jsx # Modal minh bạch nguồn gốc & công thức định giá gợi ý VPA
│   ├── FloatingActionBar.jsx   # Thanh công cụ thao tác hàng loạt nổi (khi chọn nhiều biển)
│   └── index.jsx               # Re-export các primitives (Input, Select, Badge, Switch, Toast...)
│
├── config/
│   ├── routes.js               # Định nghĩa SCREENS, ROUTE_MAP, helper parseRoute / routeFor
│   └── siteConfig.js           # Cấu hình website: thương hiệu, hotline, địa chỉ, social links
│
├── hooks/
│   ├── usePathRouter.js        # Điều hướng theo đường dẫn chuẩn (HTML5 History API)
│   ├── useSeo.js               # Quản lý SEO meta tags, title, OG và JSON-LD Schema
│   └── useDebounce.js          # Hook debounce cho tìm kiếm và lọc thời gian thực
│
├── layout/                     # Khung bao bọc layout dùng chung
│   ├── Header.jsx              # Header công khai (menu, tìm kiếm nhanh, giỏ/yêu thích)
│   ├── Footer.jsx              # Footer chân trang
│   ├── Modals.jsx              # Modal toàn cục (liên hệ, xác thực, thông báo)
│   └── AdminShell.jsx          # Khung giao diện quản trị: Sidebar 7 nhóm, 24 màn hình, breadcrumbs, user chip
│
├── lib/                        # Thư viện tiện ích thuần (Pure utilities)
│   ├── plateFormat.js          # Chuẩn hóa & format biển số (30A-123.45 -> 30A12345)
│   ├── fengshui.js             # Thuật toán tính nút, quẻ dịch và ngũ hành biển số
│   ├── dateUtils.js            # Format ngày giờ Việt Nam
│   └── sanitizeHtml.js         # Làm sạch mã HTML cho bài viết Blog
│
├── pages/                      # Các trang giao diện chính
│   ├── Home.jsx                # Trang chủ: Hero, tìm kiếm, biển nổi bật, cam kết
│   ├── PlateList.jsx           # Danh sách biển số (Bộ lọc 4 tiêu chí: Loại biển, Loại xe, Tỉnh/thành, Nổi bật)
│   ├── PlateDetail.jsx         # Chi tiết biển số, giữ chỗ 15 phút, QR VietQR Napas247
│   ├── Auth.jsx                # Đăng nhập / Đăng ký / Quên mật khẩu
│   ├── Fav.jsx                 # Danh sách biển yêu thích
│   ├── LuckyPlate.jsx          # Tra cứu phong thủy biển số hợp tuổi/mệnh
│   ├── About.jsx               # Giới thiệu thương hiệu Duy Đinh
│   ├── Blog.jsx                # Danh sách bài viết & tin tức
│   ├── Post.jsx                # Xem bài viết chi tiết
│   ├── Compare.jsx             # So sánh 2 biển số
│   └── admin/                  # Phân hệ Quản trị viên (Admin Portal)
│       ├── Dashboard.jsx       # Bảng điều khiển kinh doanh tổng quan
│       ├── AdminPlates.jsx     # Quản lý kho biển shop & giá thị trường tham khảo VPA
│       ├── AdminLiveMode.jsx   # Bàn điều khiển Trợ lý Livestream TikTok/Facebook (tra cứu <20ms, giá đáy, ghim OBS)
│       ├── AdminCats.jsx       # Quản lý danh mục (loại biển, tỉnh thành, loại xe)
│       ├── AdminStaff.jsx      # Quản lý nhân viên & phân quyền theo ma trận 28 module chi tiết
│       ├── AdminVpa.jsx        # Trang VPA chính tích hợp 5 tab ngang qua AdminTabbedPage
│       ├── AdminVpaStats.jsx   # Báo cáo & Phân tích thị trường VPA
│       ├── AdminContacts.jsx   # Khách hàng & CRM tư vấn
│       ├── AdminPosts.jsx      # Quản trị bài viết Blog
│       ├── AdminReviews.jsx    # Quản trị đánh giá khách hàng
│       ├── AdminCollaborators.jsx # Quản lý mạng lưới cộng tác viên (CTV)
│       ├── AdminSettings.jsx   # Cài đặt hệ thống toàn cục
│       └── vpa/                # Các tab chức năng chuyên sâu của phân hệ Biển VPA
│           ├── VpaAdminList.jsx      # Bảng danh sách biển VPA, thao tác hàng loạt, lọc facets
│           ├── VpaPriceQueue.jsx     # Hàng đợi duyệt giá VPA (duyệt đơn/hàng loạt)
│           ├── VpaAuctionResults.jsx # Kết quả đấu giá chính thức từ VPA
│           ├── VpaCrawlAdmin.jsx     # Giám sát & cấu hình crawler VPA
│           └── VpaWorkflowGuide.jsx  # Hướng dẫn chi tiết vòng đời biển & quy trình nút bấm
│
├── services/                   # Tầng giao tiếp Backend API (TanStack Query / Fetch)
│   ├── apiClient.js            # Axios/Fetch client chung, interceptor gắn token & refresh token
│   ├── adminVpa.js             # API VPA: danh sách, duyệt giá, bulk-edit, crawl, export
│   ├── adminPlates.js          # API kho biển shop
│   ├── adminStaff.js           # API nhân viên & phân quyền
│   ├── authService.js          # API xác thực, đăng nhập, phân quyền người dùng
│   ├── plates.js               # API công khai danh sách biển & chi tiết biển
│   └── ...                     # Các services nghiệp vụ khác (categories, contacts, v.v.)
│
└── styles/
    ├── tokens.css              # Design tokens chuẩn (Color palettes, Radius, Shadows, Spacing)
    └── app.css                 # Style toàn cục & các class tiện ích
```

---

## 2. Luồng Điều Hướng & Quản Lý Trạng Thái Tab

- **Routing Chính (`usePathRouter.js`):** Điều hướng theo URL path thật (`/danh-sach`, `/bien/:id`, `/admin/vpa`).
- **Tabbed Pages (`AdminTabbedPage.jsx`):**
  - Gộp các màn hình có liên quan chặt chẽ thành tab ngang (như Biển VPA gộp 5 tab: Danh sách, Duyệt giá, Kết quả, Đồng bộ crawler, Hướng dẫn nút bấm).
  - Sử dụng mô hình **Pure Derived State** để tính toán tab hiện tại ngay trong render, loại bỏ hoàn toàn cảnh báo `set-state-in-effect`.
  - Tự động phản hồi sự kiện `popstate` khi người dùng bấm nút **Back / Forward** trên trình duyệt.
  - Hỗ trợ cả 2 chế độ: Uncontrolled (tự quản lý tab theo URL query `?tab=...`) và Controlled (nhận `activeTab` từ component cha).

---

## 3. Phân Hệ VPA & Thao Tác Hàng Loạt (Bulk Operations)

- **Thanh công cụ nổi (`FloatingActionBar`):**
  - Tự động hiển thị khi admin chọn từ 1 biển số trở lên trên bảng danh sách VPA.
  - Cung cấp các tác vụ hàng loạt:
    - **Bỏ ẩn hàng loạt:** Gửi `isHidden = false` lên API, đồng thời kích hoạt đồng bộ bật hiển thị công khai `plates.visible = true`.
    - **Ẩn hàng loạt:** Gửi `isHidden = true`, tự động ẩn khỏi khách hàng `plates.visible = false`.
    - **Duyệt / Từ chối giá gợi ý:** Áp dụng giá gợi ý hàng loạt cho các biển đủ điều kiện.
    - **Đổi Tab:** Chuyển biển sang tab Tháng, Tuần hoặc Hết hạn.
    - **Sao chép số biển:** Sao chép toàn bộ số biển đã chọn vào clipboard (cách nhau bởi dấu phẩy) để phục vụ tư vấn nhanh qua Zalo.
    - **Xuất CSV:** Tải file CSV chỉ chứa các biển đã được tích chọn.
  - **Bộ chọn nhanh thông minh:** Nút chọn nhanh "Chọn tất cả biển đang ẩn", "Chọn tất cả biển chưa duyệt", hoặc "Bỏ chọn toàn bộ".

---

## 4. Kiểm Thử (Testing)

Dự án trang bị hệ thống kiểm thử tự động toàn diện:
- **Kiểm tra cú pháp & Best Practices:** `npm run lint` (Oxlint)
- **Kiểm tra tính nhất quán nội dung:** `npm run validate:content`
- **Kiểm thử E2E (Playwright):**
  - `npx playwright test e2e/admin-vpa.spec.js`: Kiểm tra phân hệ Biển VPA (5 tab, điều hướng URL, thao tác hàng loạt, mở hướng dẫn quy trình).
  - `npx playwright test e2e/admin-staff-videos-notifications.spec.js`: Kiểm tra phân hệ Nhân viên & Phân quyền.
  - `npx playwright test`: Chạy toàn bộ 23 test suites E2E trên các thiết bị Desktop, Tablet và Mobile.


---

## 5. Phân Hệ Livestream & Tối Ưu Hiệu Năng Mạng

- **Bàn điều khiển Trợ lý Livestream (`AdminLiveMode.jsx`):**
  - Hỗ trợ streamer & trợ lý phòng livestream tra cứu biển số trong 20ms bằng phím tắt.
  - Hiển thị song song **Giá niêm yết** và **Giá đáy bí mật** để kiểm soát biên độ chốt giá.
  - Chế độ **Thẻ Phóng To (Showcase Mode)** giơ biển trước camera.
  - Ghim biển số thời gian thực lên màn hình Livestream thông qua `BroadcastChannel`.
  - Lưu ý: Nút "Khóa cọc live" đã được loại bỏ theo yêu cầu nghiệp vụ để giữ quy trình đơn giản, tránh nhầm lẫn.
- **Tối ưu hóa Video Facade (`TikTokEmbed.jsx`):**
  - Thay thế toàn bộ việc render `<iframe>` trực tiếp trên các trang (`Home`, `PromoRails`, `About`, `PlateDetail`, `Post`).
  - Ban đầu nạp 0 iframe — triệt tiêu 886 request telemetry rác của TikTok, tránh lỗi 403 Forbidden và 1.180 console errors.
- **Chống lãng phí tài nguyên mạng (Network Hygiene):**
  - `useSiteSettings`: Dùng TanStack Query cache thay vì `fetch('/api/settings')` thô, loại bỏ request trùng lặp khi khởi động ứng dụng.
  - `PromoRails.jsx`: Đồng bộ cache key `useFeaturedPlates(8)` với Trang chủ.
  - `useScrollDepthTracking`: Debounce 300ms / 250ms cho sự kiện cuộn trang, gộp các mốc cuộn thành 1 beacon tracking duy nhất.

---

## 6. Bảo Mật Nâng Cao & Ma Trận Phân Quyền (RBAC & MFA)

- **Xác thực Đa yếu tố Admin (MFA Email OTP):**
  - Tự động kích hoạt khi đăng nhập tài khoản quản trị.
  - Cho phép người dùng chọn nhận OTP qua Email đăng nhập hoặc Email khôi phục dự phòng.
  - Hỗ trợ **Thiết bị tin cậy (Trusted Device)** trong 30 ngày qua HTTP-only Secure Token, giúp nhân viên không phải nhập lại OTP liên tục trên máy làm việc quen thuộc.
- **Ma trận Phân quyền 28 Module (`AdminStaff.jsx`):**
  - Phân quyền chi tiết dạng ma trận cột (Xem, Thêm, Sửa, Xóa, Toàn quyền).
  - Tích hợp bộ cấu hình nhanh (Presets): *Kinh doanh / CSKH*, *Biên tập Nội dung*, *Quản trị Kỹ thuật*, *Thực tập sinh*.
  - Cơ chế Super Admin Guardrail: ngăn chặn việc vô hiệu hóa hoặc hạ quyền nhầm Super Admin.
