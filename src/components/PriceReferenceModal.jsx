import Modal from "./Modal.jsx";
import Skeleton from "./Skeleton.jsx";
import Button from "./Button.jsx";
import { formatDate } from "../lib/date.js";
import { calculateVpaSuggestedPrice } from "../lib/vpaFormat.js";
import {
  CheckCircle2,
  Layers,
  Sparkles,
  Info,
  ExternalLink,
  Calculator,
  AlertCircle,
} from "lucide-react";

const fmt = (n) => (n == null ? "—" : n.toLocaleString("vi-VN") + "đ");

// UC49 — minh bạch nguồn giá gợi ý VPA.
export default function PriceReferenceModal({
  open,
  onClose,
  data,
  isLoading,
  onOpenPlate,
}) {
  const items = data?.items || [];
  const isSameProvince = data?.isSameProvince || data?.matchType === "same_province" || data?.matchType === "exact_province" || (items.length > 0 && data?.matchType !== "starting_price");
  const matchType = data?.matchType || (isSameProvince ? "same_province" : data?.usedOwnStartingPrice ? "starting_price" : "none");
  const factor = data?.factor ?? 2.5;
  const avgPrice = data?.avgPrice ?? (items.length > 0 ? Math.round(items.reduce((s, x) => s + (x.auctionPrice || 0), 0) / items.length) : null);
  const basePrice = avgPrice || (data?.usedOwnStartingPrice ? data?.ownStartingPrice : null);
  const calculatedPrice = calculateVpaSuggestedPrice(basePrice, factor);

  const renderBadge = () => {
    if (isSameProvince || matchType === "same_province" || matchType === "exact_province") {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: "var(--radius-pill, 9999px)",
          background: "#ecfdf5",
          color: "#059669",
          border: "1px solid #a7f3d0",
          fontSize: "12px",
          fontWeight: "var(--fw-semibold, 600)",
        }}>
          <CheckCircle2 size={13} /> Cùng số đuôi & cùng tỉnh thành
        </span>
      );
    }
    if (matchType === "starting_price" || data?.usedOwnStartingPrice) {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: "var(--radius-pill, 9999px)",
          background: "#fffbeb",
          color: "#d97706",
          border: "1px solid #fde68a",
          fontSize: "12px",
          fontWeight: "var(--fw-semibold, 600)",
        }}>
          <Info size={13} /> Dùng giá khởi điểm × Hệ số
        </span>
      );
    }
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: "var(--radius-pill, 9999px)",
        background: "var(--surface-sunken)",
        color: "var(--text-muted)",
        fontSize: "12px",
        fontWeight: "var(--fw-semibold, 600)",
      }}>
        <AlertCircle size={13} /> Chưa có mẫu
      </span>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nguồn & công thức tính giá gợi ý"
      maxWidth="620px"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {isLoading && <Skeleton variant="table" rows={4} />}

        {!isLoading && (
          <>
            {/* Thẻ tóm tắt căn cứ & công thức */}
            <div
              style={{
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                background: "var(--surface-sunken, #f8fafc)",
                border: "1px solid var(--grey-100, #e2e8f0)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <span style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>Phương thức suy luận:</span>
                {renderBadge()}
              </div>

              {data?.matchDesc && (
                <div style={{ font: "var(--type-body-sm)", color: "var(--text-body)" }}>
                  {data.matchDesc}
                </div>
              )}

              {/* Chi tiết công thức tính */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-3)",
                  background: "var(--white)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px dashed var(--grey-200, #cbd5e1)",
                  font: "var(--type-caption)",
                }}
              >
                <Calculator size={15} style={{ color: "var(--action-primary)" }} />
                <span style={{ fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" }}>Công thức:</span>
                {items.length > 0 && avgPrice != null ? (
                  <span style={{ color: "var(--text-body)" }}>
                    TB giá trúng <strong>({fmt(avgPrice)})</strong> × Hệ số <strong>({factor}x)</strong>
                    {calculatedPrice != null && (
                      <> ≈ <strong style={{ color: "var(--action-primary)" }}>{fmt(calculatedPrice)}</strong></>
                    )}
                  </span>
                ) : data?.usedOwnStartingPrice && data?.ownStartingPrice ? (
                  <span style={{ color: "var(--text-body)" }}>
                    Giá khởi điểm <strong>({fmt(data.ownStartingPrice)})</strong> × Hệ số <strong>({factor}x)</strong>
                    {calculatedPrice != null && (
                      <> ≈ <strong style={{ color: "var(--action-primary)" }}>{fmt(calculatedPrice)}</strong></>
                    )}
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Chưa xác định công thức phù hợp</span>
                )}
              </div>
            </div>

            {/* Danh sách các mẫu kết quả cùng tỉnh hoặc thông báo dùng giá khởi điểm */}
            {items.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ font: "var(--type-caption)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle2 size={13} style={{ color: "#059669" }} />
                    Danh sách {items.length} mẫu đấu giá CÙNG TỈNH trùng khớp số đuôi:
                  </span>
                  <span style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>
                    (Tối đa 50 phiên gần nhất)
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-1)",
                    maxHeight: 280,
                    overflowY: "auto",
                    paddingRight: 2,
                  }}
                >
                  {items.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--grey-100, #e2e8f0)",
                        background: "var(--white)",
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span
                          style={{
                            fontWeight: "var(--fw-bold, 700)",
                            color: "var(--text-strong)",
                            fontFamily: "monospace",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {it.plateNumber}
                        </span>
                        {it.provinceName && (
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "#ecfdf5",
                              color: "#059669",
                              fontWeight: "var(--fw-semibold, 600)",
                            }}
                          >
                            {it.provinceName} (cùng tỉnh)
                          </span>
                        )}
                        {it.plateTypeName && (
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: "var(--surface-sunken)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {it.plateTypeName}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <span
                          style={{
                            fontWeight: "var(--fw-bold, 700)",
                            color: "var(--action-primary, #059669)",
                          }}
                        >
                          {fmt(it.auctionPrice)}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {formatDate(it.auctionStartAt)}
                        </span>
                        {onOpenPlate && it.vpaPlateId && (
                          <button
                            type="button"
                            onClick={() => onOpenPlate(it.plateNumber)}
                            title={`Xem biển ${it.plateNumber} trong danh sách VPA`}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 2,
                              cursor: "pointer",
                              color: "var(--action-primary)",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <ExternalLink size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : data?.usedOwnStartingPrice ? (
              <div
                style={{
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: "var(--fw-semibold)", color: "#b45309" }}>
                  <Info size={16} />
                  Không tìm thấy biển nào cùng tỉnh có đuôi số tương tự
                </div>
                <div>
                  Trong lịch sử đấu giá VPA chưa có kết quả nào cùng tỉnh có dãy số đuôi trùng khớp (khác đầu chữ).
                  Hệ thống tự động sử dụng: <strong>Giá khởi điểm ({fmt(data.ownStartingPrice)}) × Hệ số ({factor}x)</strong> làm mức giá thị trường tham khảo.
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-sunken)",
                  border: "1px solid var(--grey-100)",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                Chưa có kết quả đấu giá cùng tỉnh và chưa có giá khởi điểm làm căn cứ tính giá gợi ý.
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
          <Button variant="ghost" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
