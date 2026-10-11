import Modal from "./Modal.jsx";
import Skeleton from "./Skeleton.jsx";
import Button from "./Button.jsx";
import { formatDate } from "../lib/date.js";
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
  const matchType = data?.matchType || (items.length > 0 ? "exact" : data?.usedOwnStartingPrice ? "starting_price" : "none");
  const factor = data?.factor ?? 2.5;
  const avgPrice = data?.avgPrice ?? (items.length > 0 ? Math.round(items.reduce((s, x) => s + (x.auctionPrice || 0), 0) / items.length) : null);
  const calculatedPrice = avgPrice ? Math.round(avgPrice * factor) : data?.usedOwnStartingPrice && data?.ownStartingPrice ? Math.round(data.ownStartingPrice * factor) : null;

  const renderBadge = () => {
    switch (matchType) {
      case "exact":
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: "var(--radius-pill, 9999px)",
            background: "#ecfdf5",
            color: "#059669",
            fontSize: "12px",
            fontWeight: "var(--fw-semibold, 600)",
          }}>
            <CheckCircle2 size={13} /> Trùng đuôi số thực tế
          </span>
        );
      case "province":
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: "var(--radius-pill, 9999px)",
            background: "#eff6ff",
            color: "#2563eb",
            fontSize: "12px",
            fontWeight: "var(--fw-semibold, 600)",
          }}>
            <Layers size={13} /> Cùng loại biển & cùng tỉnh
          </span>
        );
      case "national":
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: "var(--radius-pill, 9999px)",
            background: "#faf5ff",
            color: "#7e22ce",
            fontSize: "12px",
            fontWeight: "var(--fw-semibold, 600)",
          }}>
            <Sparkles size={13} /> Toàn quốc (fallback)
          </span>
        );
      case "starting_price":
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: "var(--radius-pill, 9999px)",
            background: "#fffbeb",
            color: "#d97706",
            fontSize: "12px",
            fontWeight: "var(--fw-semibold, 600)",
          }}>
            <Info size={13} /> Giá khởi điểm gốc
          </span>
        );
      default:
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: "var(--radius-pill, 9999px)",
            background: "var(--surface-sunken)",
            color: "var(--text-muted)",
            fontSize: "12px",
            fontWeight: "var(--fw-semibold, 600)",
          }}>
            <AlertCircle size={13} /> Chưa có mẫu
          </span>
        );
    }
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

            {/* Danh sách các mẫu kết quả */}
            {items.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ font: "var(--type-caption)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" }}>
                    Danh sách {items.length} mẫu đấu giá được áp dụng:
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
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: "var(--surface-sunken)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {it.provinceName}
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
                            fontWeight: "var(--fw-semibold)",
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
                }}
              >
                Chưa có kết quả đấu giá nào trong lịch sử tương đồng với biển này — giá gợi ý được tính suy luận trực tiếp từ <strong>giá khởi điểm của chính biển</strong> ({fmt(data.ownStartingPrice)}) × hệ số {factor}x.
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
                Chưa có kết quả đấu giá tương đồng và chưa có giá khởi điểm làm căn cứ tính giá gợi ý.
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
