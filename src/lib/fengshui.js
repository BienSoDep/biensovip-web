// UI per-element cho trang hợp mệnh. Chấm điểm chạy server-side (POST /fengshui/lookup → ranked);
// file này chỉ giữ dữ liệu hiển thị (màu/icon/desc) + map mục đích. Không có logic chấm điểm client.

export const ELEMENTS = {
  Kim:  { icon: 'zap',      color: 'var(--grey-300)', label: 'Kim',  desc: 'Kim loại — sắc bén, quyết đoán, hợp người lãnh đạo, giao thương lớn.' },
  Mộc:  { icon: 'wind',     color: 'var(--mint-500)', label: 'Mộc',  desc: 'Cây cối — sinh sôi, phát triển, hợp người làm việc theo đam mê, khởi nghiệp.' },
  Thủy: { icon: 'droplets', color: 'var(--blue-500)', label: 'Thủy', desc: 'Nước — linh hoạt, trí tuệ, hợp người làm truyền thông, nghệ thuật, tài chính.' },
  Hỏa:  { icon: 'flame',    color: 'var(--rose-500)', label: 'Hỏa',  desc: 'Lửa — nhiệt huyết, danh tiếng, hợp người kinh doanh, sáng tạo, trình diễn.' },
  Thổ:  { icon: 'mountain', color: 'var(--amber-500)', label: 'Thổ',  desc: 'Đất — vững vàng, giữ của, hợp người làm bất động sản, nông nghiệp, kho vận.' },
};

// Mục đích (nhãn UI → key backend). Key trùng enum FengShuiPurpose.
export const PURPOSES = [
  { label: 'Kinh doanh', key: 'kinh_doanh' },
  { label: 'Đi lại cá nhân', key: 'ca_nhan' },
  { label: 'Xe gia đình', key: 'xe_gia_dinh' },
  { label: 'Xe dịch vụ (taxi/công nghệ)', key: 'xe_dich_vu' },
  { label: 'Sang tên / sưu tầm', key: 'sua_tam' },
];

// Ngành kinh doanh (chỉ hỏi khi Purpose=kinh_doanh) — ảnh hưởng trọng số chấm điểm backend.
export const INDUSTRIES = [
  { label: 'Bán lẻ / thương mại', key: 'ban_le' },
  { label: 'Vận tải / logistics', key: 'van_tai' },
  { label: 'Dịch vụ', key: 'dich_vu' },
  { label: 'Bất động sản / xây dựng', key: 'bat_dong_san' },
];

export const VEHICLES = ['Ô tô', 'Xe máy'];

// Bậc thang cho slider ngân sách (kéo chọn ngưỡng tối đa) — bậc cuối = không giới hạn (cap: null).
export const BUDGET_STEPS = [
  5_000_000, 100_000_000, 150_000_000, 200_000_000, 300_000_000,
  500_000_000, 700_000_000, 1_000_000_000, 1_500_000_000, 2_000_000_000, null,
];

export const formatBudget = (cap) => {
  if (cap == null) return 'Không giới hạn';
  if (cap >= 1_000_000_000) return `${(cap / 1_000_000_000).toFixed(cap % 1_000_000_000 ? 1 : 0)} tỷ`;
  return `${(cap / 1_000_000).toFixed(0)} triệu`;
};

// Màu thanh điểm theo mức (spec 16 §7): >=80 mint, 60–79 primary, <60 warning.
export const scoreColor = (score) => {
  if (score >= 80) return 'var(--status-success)';
  if (score >= 60) return 'var(--action-primary)';
  return 'var(--status-warning)';
};

export const NUT_MEANING = {
  1: 'Đứng đầu, có chí', 2: 'Tài vận cân bằng', 3: 'Phát triển, nhiều cơ hội', 4: 'Vững chắc',
  5: 'Danh lợi song toàn', 6: 'Thuận tài lộc', 7: 'Quyền uy, khí chất', 8: 'Phát đạt', 9: 'Viên mãn', 0: 'Đỉnh cao đã qua',
};
