// Biển khách đang xem (trang chi tiết) — AiChatbot.jsx đọc để truyền currentPlateNumber lên backend,
// cho câu hỏi kiểu "biển này có hợp mệnh tôi không" có dữ liệu thật mà không cần khách gõ lại số biển.
// Module-level thay vì Context API: AiChatbot mount ở App.jsx cấp cao, PlateDetail mount/unmount theo route —
// tránh phải luồn prop qua nhiều lớp chỉ cho 1 giá trị đơn giản, không cần re-render khi đổi.
let current = null;

export function setCurrentPlateNumber(plateNumber) {
  current = plateNumber || null;
}

export function getCurrentPlateNumber() {
  return current;
}
