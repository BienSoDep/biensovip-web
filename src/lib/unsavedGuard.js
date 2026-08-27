// Cờ "có thay đổi chưa lưu" của màn Compose — dùng cho route-guard trong-SPA.
// Compose ghi trạng thái mỗi render; App/usePathRouter đọc để chặn rời trang khi dirty.
let composeDirty = false;

export const setComposeDirty = (v) => { composeDirty = !!v; };
export const isComposeDirty = () => composeDirty;
export const resetComposeDirty = () => { composeDirty = false; };
