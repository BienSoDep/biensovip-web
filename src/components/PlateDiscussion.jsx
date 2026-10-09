import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MessageSquare,
  Send,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  Sparkles,
  Phone,
  User as UserIcon,
  MessageCircle,
  CornerDownRight,
  Heart,
  BadgeCheck,
  X,
  Flame,
  Diamond,
  MessageSquarePlus,
} from "lucide-react";
import Button from "./Button.jsx";
import { useSubmitContact } from "../services/contactService.js";
import { toZaloUrl } from "../lib/zaloMessage.js";
import { generatePlateDiscussions } from "../lib/plateDiscussionBank.js";
import { loadAuth } from "../lib/authStore.js";

/* ─────────────────────────────────────────────────────────
   REACTION CONFIG — 6 cảm xúc chuẩn Facebook
──────────────────────────────────────────────────────────── */
const REACTION_CONFIG = {
  like: {
    key: "like",
    emoji: "👍",
    label: "Thích",
    color: "#1877F2",
    bg: "rgba(24,119,242,.12)",
  },
  love: {
    key: "love",
    emoji: "❤️",
    label: "Yêu thích",
    color: "#E11D48",
    bg: "rgba(225,29,72,.12)",
  },
  haha: {
    key: "haha",
    emoji: "😂",
    label: "Haha",
    color: "#F59E0B",
    bg: "rgba(245,158,11,.12)",
  },
  wow: {
    key: "wow",
    emoji: "😮",
    label: "Wow",
    color: "#F59E0B",
    bg: "rgba(245,158,11,.12)",
  },
  sad: {
    key: "sad",
    emoji: "😢",
    label: "Buồn",
    color: "#F59E0B",
    bg: "rgba(245,158,11,.12)",
  },
  angry: {
    key: "angry",
    emoji: "😡",
    label: "Phẫn nộ",
    color: "#EA580C",
    bg: "rgba(234,88,12,.12)",
  },
};
const REACTION_LIST = Object.values(REACTION_CONFIG);

/* ─────────────────────────────────────────────────────────
   QUICK QUESTIONS
──────────────────────────────────────────────────────────── */
const QUICK_QUESTIONS = [
  "Biển này đã bao gồm trọn gói thuế phí sang tên định danh chưa shop?",
  "Mình ở tỉnh khác có gắn vào xe đăng ký ở tỉnh mình được không anh?",
  "Biển này hợp với người mệnh nào và xe màu gì vậy anh Duy?",
  "Bên mình có văn bản trúng đấu giá gốc của Cục CSGT kèm theo không?",
  "Biển này chốt nhanh trong ngày có bớt thêm chút lộc may mắn không anh?",
  "Quy trình đặt cọc và bao lâu thì nhận được giấy hẹn/biển số cứng?",
];

/* ─────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────────── */
function getAvatarColor(name = "") {
  const palettes = [
    { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
    { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
    { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
    { bg: "#FDF2F8", text: "#BE185D", border: "#FBCFE8" },
    { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
    { bg: "#ECFEFF", text: "#0E7490", border: "#A5F3FC" },
  ];
  let s = 0;
  for (let i = 0; i < name.length; i++) s += name.charCodeAt(i);
  return palettes[s % palettes.length];
}

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
──────────────────────────────────────────────────────────── */
/** Avatar tròn hiển thị chữ cái đầu của tên */
function Avatar({ name, size = 40 }) {
  const c = getAvatarColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: c.bg,
        color: c.text,
        border: `1.5px solid ${c.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "var(--fw-bold)",
        fontSize: size * 0.38,
      }}
    >
      {(name || "K").charAt(0).toUpperCase()}
    </div>
  );
}

/** Thanh action dưới mỗi bình luận: React Facebook + Bình luận/Trả lời */
function CommentActions({
  targetId,
  baseReactions,
  currentReact,
  totalReacts,
  onToggleReaction,
  onReply,
  replyLabel = "Trả lời",
  isReplyOpen,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredEmojiKey, setHoveredEmojiKey] = useState(null);
  const closeTimerRef = useRef(null);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setShowPicker(true);
  };

  const handleMouseLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setShowPicker(false);
      setHoveredEmojiKey(null);
    }, 240);
  };

  const handleSelectReaction = (key) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setShowPicker(false);
    setHoveredEmojiKey(null);
    onToggleReaction(targetId, key);
  };

  const activeReaction = REACTION_CONFIG[currentReact] || null;

  // Lấy đầy đủ danh sách các emotion có lượt tương tác
  const activeBreakdown = REACTION_LIST.map((r) => {
    const base = baseReactions?.[r.key] || 0;
    const count = currentReact === r.key ? base + 1 : base;
    return { ...r, count };
  }).filter((r) => r.count > 0);

  const reactionBtnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid transparent",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "var(--fw-semibold)",
    transition: "all 140ms var(--ease-standard)",
    background: activeReaction ? activeReaction.bg : "var(--surface-sunken)",
    color: activeReaction ? activeReaction.color : "var(--text-muted)",
    borderColor: activeReaction ? "transparent" : "var(--border-hairline)",
  };

  const replyBtnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-hairline)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "var(--fw-semibold)",
    background: isReplyOpen ? "var(--brand-50)" : "var(--surface-sunken)",
    color: isReplyOpen ? "var(--action-primary)" : "var(--text-muted)",
    transition: "all 140ms var(--ease-standard)",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
        flexWrap: "wrap",
        position: "relative",
      }}
    >
      {/* Reaction trigger wrapper */}
      <div
        style={{ position: "relative" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          style={reactionBtnStyle}
          onClick={() =>
            handleSelectReaction(currentReact ? currentReact : "like")
          }
          onMouseEnter={(e) => {
            if (!activeReaction) {
              e.currentTarget.style.background = "rgba(24,119,242,.08)";
              e.currentTarget.style.borderColor = "rgba(24,119,242,.25)";
              e.currentTarget.style.color = "#1877F2";
            }
          }}
          onMouseLeave={(e) => {
            if (!activeReaction) {
              e.currentTarget.style.background = "var(--surface-sunken)";
              e.currentTarget.style.borderColor = "var(--border-hairline)";
              e.currentTarget.style.color = "var(--text-muted)";
            }
          }}
        >
          <span style={{ fontSize: 15 }}>
            {activeReaction ? activeReaction.emoji : "👍"}
          </span>
          <span>{activeReaction ? activeReaction.label : "Thích"}</span>
        </button>

        {/* Floating Facebook Reaction Dock */}
        {showPicker && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 0,
              zIndex: 100,
              background: "#ffffff",
              borderRadius: 9999,
              padding: "4px 6px",
              display: "flex",
              alignItems: "center",
              gap: 3,
              boxShadow:
                "0 6px 20px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.08)",
              whiteSpace: "nowrap",
              animation: "fadeIn 120ms ease-out",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Invisible hover bridge to eliminate gap between button and dock */}
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                height: 12,
                background: "transparent",
              }}
            />

            {REACTION_LIST.map((r) => {
              const isHovered = hoveredEmojiKey === r.key;
              const isCurrent = currentReact === r.key;
              return (
                <div
                  key={r.key}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={() => setHoveredEmojiKey(r.key)}
                  onMouseLeave={() => setHoveredEmojiKey(null)}
                >
                  {/* Tooltip on hover like Facebook */}
                  {isHovered && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 6px)",
                        background: "rgba(0, 0, 0, 0.85)",
                        color: "#ffffff",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 9999,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        zIndex: 110,
                      }}
                    >
                      {r.label}
                    </div>
                  )}

                  <button
                    type="button"
                    aria-label={r.label}
                    onClick={() => handleSelectReaction(r.key)}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      lineHeight: 1,
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isHovered ? 26 : isCurrent ? 22 : 20,
                      background: isCurrent
                        ? r.bg
                        : isHovered
                          ? "rgba(0,0,0,0.04)"
                          : "transparent",
                      transform: isHovered
                        ? "scale(1.35) translateY(-5px)"
                        : "scale(1) translateY(0)",
                      transition:
                        "transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1), font-size 140ms ease-out, background 140ms ease-out",
                      flexShrink: 0,
                    }}
                  >
                    {r.emoji}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply / Comment button */}
      <button
        type="button"
        style={replyBtnStyle}
        onClick={onReply}
        onMouseEnter={(e) => {
          if (!isReplyOpen) {
            e.currentTarget.style.background = "var(--brand-50)";
            e.currentTarget.style.color = "var(--action-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isReplyOpen) {
            e.currentTarget.style.background = "var(--surface-sunken)";
            e.currentTarget.style.color = "var(--text-muted)";
          }
        }}
      >
        <CornerDownRight size={13} />
        <span>{replyLabel}</span>
      </button>

      {/* Hiển thị đầy đủ tất cả các emotion có lượt tương tác */}
      {activeBreakdown.length > 0 && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {activeBreakdown.map((r) => {
            const isUserReact = currentReact === r.key;
            return (
              <button
                key={r.key}
                type="button"
                title={`${r.label}: ${r.count} lượt tương tác (nhấn để ${isUserReact ? "bỏ chọn" : "thả " + r.label})`}
                onClick={() => handleSelectReaction(r.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: "var(--radius-xs)",
                  border: isUserReact
                    ? `1.5px solid ${r.color}`
                    : "1px solid var(--border-hairline)",
                  background: isUserReact ? r.bg : "var(--white)",
                  color: isUserReact ? r.color : "var(--text-body)",
                  fontSize: 12,
                  fontWeight: isUserReact
                    ? "var(--fw-bold)"
                    : "var(--fw-medium)",
                  cursor: "pointer",
                  boxShadow: isUserReact
                    ? `0 0 0 1px ${r.color}33, 0 1px 3px rgba(0,0,0,0.06)`
                    : "0 1px 2px rgba(0,0,0,0.04)",
                  transition: "all 120ms var(--ease-standard)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.borderColor = r.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  if (!isUserReact)
                    e.currentTarget.style.borderColor =
                      "var(--border-hairline)";
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>{r.emoji}</span>
                <span
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: "var(--fw-semibold)",
                    fontSize: 12,
                  }}
                >
                  {r.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────── */
export default function PlateDiscussion({ plate, notify, user }) {
  // Auth
  const [currentUser, setCurrentUser] = useState(user || null);
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      return;
    }
    const auth = loadAuth();
    if (auth?.user) setCurrentUser(auth.user);
  }, [user]);

  const isLoggedIn = Boolean(
    currentUser &&
    (currentUser.fullName || currentUser.phone || currentUser.email),
  );
  const userDisplayName =
    currentUser?.fullName ||
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "Thành viên Biensovip";
  const userPhone = currentUser?.phone || "";

  // Discussion state
  const [questions, setQuestions] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [phoneContact, setPhoneContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reaction state
  const [userReactions, setUserReactions] = useState({});

  // Reply state
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyAuthorName, setReplyAuthorName] = useState("");
  const [replyPhone, setReplyPhone] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const inputRef = useRef(null);
  const replyInputRef = useRef(null);
  const submitContact = useSubmitContact();

  const storageKey = `plate_qa_${plate?.id || "general"}`;
  const reactsStorageKey = `plate_reacts_${plate?.id || "general"}`;
  const guestProfileKey = "bsd_guest_profile";

  const initialQuestions = useMemo(
    () => generatePlateDiscussions(plate),
    [plate?.id, plate?.plateNumber],
  );

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setQuestions(
        saved ? [...JSON.parse(saved), ...initialQuestions] : initialQuestions,
      );
    } catch {
      setQuestions(initialQuestions);
    }

    try {
      const savedReacts = localStorage.getItem(reactsStorageKey);
      if (savedReacts) setUserReactions(JSON.parse(savedReacts));
    } catch {
      /* ignore */
    }

    if (!isLoggedIn) {
      try {
        const guest = JSON.parse(localStorage.getItem(guestProfileKey) || "{}");
        if (guest.name && !authorName) setAuthorName(guest.name);
        if (guest.phone && !phoneContact) setPhoneContact(guest.phone);
        if (guest.name && !replyAuthorName) setReplyAuthorName(guest.name);
        if (guest.phone && !replyPhone) setReplyPhone(guest.phone);
      } catch {
        /* ignore */
      }
    }
  }, [plate?.id, storageKey, reactsStorageKey, initialQuestions, isLoggedIn]);

  // Reaction handlers
  const handleToggleReaction = (targetId, reactionKey) => {
    setUserReactions((prev) => {
      const current = prev[targetId];
      const updated = { ...prev };
      if (current === reactionKey) delete updated[targetId];
      else updated[targetId] = reactionKey;
      try {
        localStorage.setItem(reactsStorageKey, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  };

  const getReactionCount = (targetId, baseReactions = {}, reactionKey) => {
    const base = baseReactions?.[reactionKey] || 0;
    return userReactions[targetId] === reactionKey ? base + 1 : base;
  };

  const getTotalReactions = (targetId, baseReactions = {}) =>
    REACTION_LIST.reduce(
      (sum, r) => sum + getReactionCount(targetId, baseReactions, r.key),
      0,
    );

  // Quick chips
  const handleSelectQuickChip = (text) => {
    setCommentText(text);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  // Reply
  const handleOpenReply = (targetId, name) => {
    setReplyTarget({ targetId, replyToName: name });
    setReplyText(`@${name} `);
    setTimeout(() => {
      replyInputRef.current?.focus();
      replyInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };
  const handleCancelReply = () => {
    setReplyTarget(null);
    setReplyText("");
  };

  // Submit main comment
  const handleSubmitMain = async (e) => {
    e.preventDefault();
    const cleanText = commentText.trim();
    if (!cleanText) {
      notify?.("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    let finalName, finalPhone;
    if (isLoggedIn) {
      finalName = userDisplayName;
      finalPhone = userPhone || "";
    } else {
      finalName = authorName.trim() || "Khách hàng quan tâm";
      finalPhone = phoneContact.trim();
      if (!finalPhone) {
        notify?.("Vui lòng nhập Số điện thoại / Zalo để nhận phản hồi");
        return;
      }
      try {
        localStorage.setItem(
          guestProfileKey,
          JSON.stringify({ name: finalName, phone: finalPhone }),
        );
      } catch {
        /* ignore */
      }
    }

    setSubmitting(true);
    const newQaId = `local-qa-${Date.now()}`;
    const newQa = {
      id: newQaId,
      author: finalName,
      location: isLoggedIn ? "Thành viên Biensovip" : "Khách hàng quan tâm",
      date: "Vừa xong",
      content: cleanText,
      reactions: { like: 1, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
      isPending: true,
      reply: {
        id: `reply-${newQaId}`,
        author: "Duy Đinh",
        verified: true,
        date: "Đang phản hồi",
        content: `Cảm ơn ${finalName} đã gửi câu hỏi về biển số ${plate?.plateNumber}! Duy Đinh đã ghi nhận và sẽ phản hồi chi tiết về phong thủy, giá lộc và thủ tục định danh qua ${finalPhone ? `SĐT/Zalo ${finalPhone}` : "hệ thống"} ngay nhé!`,
        reactions: { like: 2, love: 1, haha: 0, wow: 1, sad: 0, angry: 0 },
      },
      communityReplies: [],
    };

    try {
      if (finalPhone) {
        await submitContact.mutateAsync({
          name: finalName,
          phone: finalPhone,
          intent: "inquiry",
          plateId: plate?.id,
          message: `[Hỏi đáp biển ${plate?.plateNumber}]: ${cleanText}`,
        });
      }
    } catch {
      /* optimistic */
    }

    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      localStorage.setItem(storageKey, JSON.stringify([newQa, ...existing]));
    } catch {
      /* ignore */
    }

    setQuestions((prev) => [newQa, ...prev]);
    setCommentText("");
    if (!isLoggedIn) setPhoneContact("");
    setSubmitting(false);
    notify?.(
      "Đã gửi câu hỏi! Chuyên gia Duy Đinh và cộng đồng sẽ phản hồi bạn ngay.",
    );
  };

  // Submit reply
  const handleSubmitReply = async (e, mainQuestionId) => {
    e.preventDefault();
    const cleanText = replyText.trim();
    if (!cleanText) {
      notify?.("Vui lòng nhập nội dung phản hồi");
      return;
    }

    let finalName, finalPhone;
    if (isLoggedIn) {
      finalName = userDisplayName;
      finalPhone = userPhone || "";
    } else {
      finalName =
        replyAuthorName.trim() || authorName.trim() || "Thành viên cộng đồng";
      finalPhone = replyPhone.trim() || phoneContact.trim();
      try {
        localStorage.setItem(
          guestProfileKey,
          JSON.stringify({ name: finalName, phone: finalPhone }),
        );
      } catch {
        /* ignore */
      }
    }

    setReplySubmitting(true);
    const newReply = {
      id: `comm-local-${Date.now()}`,
      author: finalName,
      badge: isLoggedIn ? "Thành viên xác thực" : "Khách thảo luận",
      location: isLoggedIn ? "Đã đăng nhập" : "Cộng đồng Biensovip",
      date: "Vừa xong",
      content: cleanText,
      replyTo: replyTarget?.replyToName,
      reactions: { like: 1, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
    };

    setQuestions((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== mainQuestionId) return item;
        return {
          ...item,
          communityReplies: [...(item.communityReplies || []), newReply],
        };
      });
      try {
        const localList = updated.filter((q) => q.id.startsWith("local-qa-"));
        localStorage.setItem(storageKey, JSON.stringify(localList));
      } catch {
        /* ignore */
      }
      return updated;
    });

    if (finalPhone) {
      try {
        submitContact.mutateAsync({
          name: finalName,
          phone: finalPhone,
          intent: "inquiry",
          plateId: plate?.id,
          message: `[Bình luận biển ${plate?.plateNumber}] @${replyTarget?.replyToName}: ${cleanText}`,
        });
      } catch {
        /* ignore */
      }
    }

    setReplySubmitting(false);
    setReplyTarget(null);
    setReplyText("");
    notify?.("Đã đăng phản hồi thành công!");
  };

  /* ──────────────────── RENDER ──────────────────── */
  return (
    <section
      aria-label="Hỏi đáp và thảo luận cộng đồng biển số"
      style={{
        background: "var(--white)",
        borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--border-hairline)",
        boxShadow: "var(--shadow-2)",
        padding: "var(--space-6)",
        margin: "var(--space-6) 0",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
      }}
    >
      {/* ── 1. HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                flexShrink: 0,
                background: "var(--brand-50)",
                color: "var(--action-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageSquare size={18} />
            </span>
            <h3
              style={{
                margin: 0,
                font: "var(--type-title-2)",
                color: "var(--text-strong)",
              }}
            >
              Hỏi đáp &amp; Thảo luận cộng đồng về biển số {plate?.plateNumber}
            </h3>
          </div>
          <p
            style={{
              margin: "6px 0 0 46px",
              font: "var(--type-body-sm)",
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            Diễn đàn tương tác đa chiều — được Chuyên gia{" "}
            <strong>Duy Đinh</strong> trực tiếp giải đáp pháp lý Thông tư 24
            &amp; phong thủy tài lộc.
          </p>
        </div>

        {plate?.seller?.zalo && (
          <a
            href={toZaloUrl(plate.seller.zalo)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#0068FF",
              color: "#FFF",
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              fontWeight: "var(--fw-semibold)",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,104,255,.25)",
              flexShrink: 0,
            }}
          >
            <MessageCircle size={14} /> Hỏi nhanh qua Zalo
          </a>
        )}
      </div>

      {/* ── 2. QUICK CHIPS ── */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <Sparkles size={13} style={{ color: "var(--action-primary)" }} />
          <span
            style={{
              font: "var(--type-caption)",
              color: "var(--text-strong)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Câu hỏi thường gặp — bấm để chọn nhanh:
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectQuickChip(q)}
              style={{
                background: "var(--surface-sunken)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "var(--radius-sm)",
                padding: "5px 12px",
                fontSize: 12.5,
                color: "var(--text-body)",
                cursor: "pointer",
                lineHeight: 1.4,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                transition: "all 140ms var(--ease-standard)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--brand-50)";
                e.currentTarget.style.borderColor = "var(--action-primary)";
                e.currentTarget.style.color = "var(--action-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface-sunken)";
                e.currentTarget.style.borderColor = "var(--border-hairline)";
                e.currentTarget.style.color = "var(--text-body)";
              }}
            >
              <HelpCircle
                size={12}
                style={{ color: "var(--action-primary)", flexShrink: 0 }}
              />
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. COMMENT FORM ── */}
      <form
        onSubmit={handleSubmitMain}
        style={{
          background:
            "linear-gradient(135deg,rgba(217,119,6,.04) 0%,rgba(15,23,42,.02) 100%)",
          border: "1px solid rgba(217,119,6,.22)",
          borderRadius: "var(--radius-2xl)",
          padding: "var(--gutter-card)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Identity banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {isLoggedIn ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(16,185,129,.1)",
                color: "#065F46",
                padding: "4px 10px",
                borderRadius: "var(--radius-pill)",
                font: "var(--type-caption)",
                border: "1px solid rgba(16,185,129,.25)",
              }}
            >
              <BadgeCheck size={14} style={{ color: "#059669" }} />
              Đang bình luận với tài khoản: <strong>{userDisplayName}</strong>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                font: "var(--type-caption)",
                color: "var(--text-muted)",
              }}
            >
              <UserIcon size={13} />
              <span>Chưa đăng nhập — nhập tên &amp; SĐT để bình luận</span>
            </div>
          )}
          {!isLoggedIn && (
            <span
              style={{
                font: "var(--type-caption)",
                color: "var(--action-primary)",
                fontWeight: "var(--fw-semibold)",
              }}
            >
              💡 SĐT được bảo mật tuyệt đối 100%
            </span>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={inputRef}
          rows={3}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={`Nhập câu hỏi hoặc băn khoăn về biển số ${plate?.plateNumber || ""} (VD: thủ tục sang tên, hợp mệnh gì, giá có bớt lộc không...)`}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid var(--border-hairline)",
            borderRadius: "var(--radius-xl)",
            padding: "10px 12px",
            font: "var(--type-body-sm)",
            lineHeight: 1.55,
            resize: "vertical",
            outline: "none",
            background: "var(--white)",
            color: "var(--text-body)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--action-primary)";
            e.target.style.boxShadow = "0 0 0 3px rgba(217,119,6,.12)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--border-hairline)";
            e.target.style.boxShadow = "none";
          }}
        />

        {/* Footer: guest fields + submit */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {!isLoggedIn ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: "1 1 320px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  position: "relative",
                  flex: "1 1 140px",
                  minWidth: 120,
                }}
              >
                <UserIcon
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: 11,
                    color: "var(--text-faint)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Tên của bạn"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 10px 8px 30px",
                    borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--border-hairline)",
                    fontSize: 13,
                    background: "var(--white)",
                  }}
                />
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "1 1 160px",
                  minWidth: 140,
                }}
              >
                <Phone
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: 11,
                    color: "var(--text-faint)",
                  }}
                />
                <input
                  type="tel"
                  placeholder="SĐT / Zalo *"
                  value={phoneContact}
                  required
                  onChange={(e) => setPhoneContact(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 10px 8px 30px",
                    borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--border-hairline)",
                    fontSize: 13,
                    background: "var(--white)",
                  }}
                />
              </div>
            </div>
          ) : (
            <span
              style={{
                font: "var(--type-body-sm)",
                color: "var(--text-muted)",
              }}
            >
              Đăng với tài khoản <strong>{userDisplayName}</strong>
            </span>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-md"
            style={{
              gap: 8,
              display: "inline-flex",
              alignItems: "center",
              paddingLeft: 20,
              paddingRight: 20,
              flexShrink: 0,
            }}
          >
            <MessageSquarePlus size={16} />
            {submitting ? "Đang gửi..." : "Đăng bình luận"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            font: "var(--type-caption)",
            color: "var(--text-muted)",
          }}
        >
          <ShieldCheck
            size={13}
            style={{ color: "var(--status-success)", flexShrink: 0 }}
          />
          <span>
            Thông tin SĐT/Zalo được mã hóa bảo mật — chỉ công khai nội dung thảo
            luận.
          </span>
        </div>
      </form>

      {/* ── 4. DISCUSSION LIST ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
        }}
      >
        {/* List header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{ font: "var(--type-label)", color: "var(--text-strong)" }}
            >
              Hỏi đáp &amp; Bình luận sôi nổi ({questions.length})
            </span>
            <span
              style={{
                background: "rgba(217,119,6,.1)",
                color: "var(--action-primary)",
                font: "var(--type-caption)",
                fontWeight: "var(--fw-bold)",
                padding: "2px 8px",
                borderRadius: "var(--radius-pill)",
              }}
            >
              Cộng đồng tương tác thật
            </span>
          </div>
          <span
            style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}
          >
            Tất cả phản hồi đều được kiểm duyệt &amp; giải đáp chuẩn luật TT24
          </span>
        </div>

        {/* Question cards */}
        {questions.map((item) => {
          const totalReacts = getTotalReactions(item.id, item.reactions);
          const currentReact = userReactions[item.id];
          const isReplyingThis = replyTarget?.targetId === item.id;

          return (
            <div
              key={item.id}
              style={{
                background: "var(--surface-sunken)",
                borderRadius: "var(--radius-2xl)",
                padding: "var(--gutter-card)",
                border: "1px solid var(--border-hairline)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              {/* Question author row */}
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <Avatar name={item.author} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          font: "var(--type-label)",
                          color: "var(--text-strong)",
                        }}
                      >
                        {item.author}
                      </span>
                      {item.location && (
                        <span
                          style={{
                            font: "var(--type-caption)",
                            color: "var(--text-muted)",
                          }}
                        >
                          ({item.location})
                        </span>
                      )}
                      {item.isPending && (
                        <span
                          style={{
                            background: "var(--amber-100)",
                            color: "var(--status-warning-ink)",
                            font: "var(--type-caption)",
                            fontWeight: "var(--fw-semibold)",
                            padding: "1px 8px",
                            borderRadius: "var(--radius-pill)",
                          }}
                        >
                          ⏳ Đang chờ phản hồi
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        font: "var(--type-caption)",
                        color: "var(--text-faint)",
                        flexShrink: 0,
                      }}
                    >
                      {item.date}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      font: "var(--type-body)",
                      color: "var(--text-body)",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.content}
                  </p>

                  <CommentActions
                    targetId={item.id}
                    baseReactions={item.reactions}
                    currentReact={currentReact}
                    totalReacts={totalReacts}
                    onToggleReaction={handleToggleReaction}
                    onReply={() => handleOpenReply(item.id, item.author)}
                    replyLabel="Trả lời"
                    isReplyOpen={isReplyingThis}
                  />
                </div>
              </div>

              {/* Expert reply (Duy Đinh) */}
              {item.reply && (
                <div
                  style={{
                    marginLeft: 52,
                    background: "var(--white)",
                    borderRadius: "var(--radius-xl)",
                    padding: "14px 16px",
                    border: "1px solid rgba(217,119,6,.2)",
                    borderLeft: "4px solid var(--action-primary)",
                    boxShadow: "0 2px 8px rgba(217,119,6,.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <img
                        src="/assets/logo-mark.png"
                        alt="Duy Đinh"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "1.5px solid var(--action-primary)",
                          objectFit: "cover",
                        }}
                      />
                      <span
                        style={{
                          font: "var(--type-label)",
                          color: "var(--text-strong)",
                        }}
                      >
                        {item.reply.author}
                      </span>
                    </div>
                    <span
                      style={{
                        font: "var(--type-caption)",
                        color: "var(--text-faint)",
                      }}
                    >
                      {item.reply.date}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      font: "var(--type-body-sm)",
                      color: "var(--text-body)",
                      lineHeight: 1.65,
                    }}
                  >
                    {item.reply.content}
                  </p>

                  {/* Expert reply actions */}
                  <CommentActions
                    targetId={item.reply.id || `reply-${item.id}`}
                    baseReactions={item.reply.reactions}
                    currentReact={
                      userReactions[item.reply.id || `reply-${item.id}`]
                    }
                    totalReacts={getTotalReactions(
                      item.reply.id || `reply-${item.id}`,
                      item.reply.reactions,
                    )}
                    onToggleReaction={handleToggleReaction}
                    onReply={() => handleOpenReply(item.id, "Duy Đinh")}
                    replyLabel="Hỏi thêm chuyên gia"
                    isReplyOpen={
                      replyTarget?.targetId === item.id &&
                      replyTarget?.replyToName === "Duy Đinh"
                    }
                  />
                </div>
              )}

              {/* Community peer replies */}
              {item.communityReplies && item.communityReplies.length > 0 && (
                <div
                  style={{
                    marginLeft: 52,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {item.communityReplies.map((cReply) => {
                    const cCurrentReact = userReactions[cReply.id];
                    const cTotalReacts = getTotalReactions(
                      cReply.id,
                      cReply.reactions,
                    );
                    return (
                      <div
                        key={cReply.id}
                        style={{
                          background: "var(--white)",
                          borderRadius: "var(--radius-xl)",
                          padding: "12px 14px",
                          border: "1px solid var(--border-hairline)",
                          borderLeft: "3px solid #3B82F6",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              flexWrap: "wrap",
                            }}
                          >
                            <Avatar name={cReply.author} size={26} />
                            <span
                              style={{
                                font: "var(--type-caption)",
                                fontWeight: "var(--fw-bold)",
                                color: "var(--text-strong)",
                              }}
                            >
                              {cReply.author}
                            </span>
                            {cReply.badge && (
                              <span
                                style={{
                                  background: "rgba(59,130,246,.1)",
                                  color: "#2563EB",
                                  font: "var(--type-caption)",
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                {cReply.badge}
                              </span>
                            )}
                            {cReply.location && (
                              <span
                                style={{
                                  font: "var(--type-caption)",
                                  color: "var(--text-muted)",
                                }}
                              >
                                ({cReply.location})
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              font: "var(--type-caption)",
                              color: "var(--text-faint)",
                            }}
                          >
                            {cReply.date}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: 0,
                            font: "var(--type-body-sm)",
                            color: "var(--text-body)",
                            lineHeight: 1.55,
                          }}
                        >
                          {cReply.content}
                        </p>

                        <CommentActions
                          targetId={cReply.id}
                          baseReactions={cReply.reactions}
                          currentReact={cCurrentReact}
                          totalReacts={cTotalReacts}
                          onToggleReaction={handleToggleReaction}
                          onReply={() =>
                            handleOpenReply(item.id, cReply.author)
                          }
                          replyLabel="Trả lời"
                          isReplyOpen={
                            replyTarget?.targetId === item.id &&
                            replyTarget?.replyToName === cReply.author
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inline reply form */}
              {isReplyingThis && (
                <form
                  onSubmit={(e) => handleSubmitReply(e, item.id)}
                  style={{
                    marginLeft: 52,
                    background: "var(--white)",
                    borderRadius: "var(--radius-xl)",
                    padding: "14px 16px",
                    border: "1.5px solid var(--action-primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    boxShadow: "0 4px 14px rgba(217,119,6,.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        font: "var(--type-caption)",
                        fontWeight: "var(--fw-bold)",
                        color: "var(--action-primary)",
                      }}
                    >
                      💬 Đang phản hồi tới {replyTarget.replyToName}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelReply}
                      style={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "var(--text-faint)",
                        padding: 2,
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <textarea
                    ref={replyInputRef}
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Viết chia sẻ, ý kiến hoặc câu hỏi của bạn..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: "1px solid var(--border-hairline)",
                      borderRadius: "var(--radius-xl)",
                      padding: "8px 10px",
                      font: "var(--type-body-sm)",
                      lineHeight: 1.55,
                      resize: "vertical",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--action-primary)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border-hairline)";
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {!isLoggedIn ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          flex: "1 1 260px",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Tên của bạn"
                          value={replyAuthorName}
                          onChange={(e) => setReplyAuthorName(e.target.value)}
                          style={{
                            flex: "1 1 110px",
                            padding: "6px 10px",
                            borderRadius: "var(--radius-xl)",
                            border: "1px solid var(--border-hairline)",
                            fontSize: 13,
                          }}
                        />
                        <input
                          type="tel"
                          placeholder="SĐT/Zalo (tùy chọn)"
                          value={replyPhone}
                          onChange={(e) => setReplyPhone(e.target.value)}
                          style={{
                            flex: "1 1 130px",
                            padding: "6px 10px",
                            borderRadius: "var(--radius-xl)",
                            border: "1px solid var(--border-hairline)",
                            fontSize: 13,
                          }}
                        />
                      </div>
                    ) : (
                      <span
                        style={{
                          font: "var(--type-caption)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Đăng với tên: <strong>{userDisplayName}</strong>
                      </span>
                    )}

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={handleCancelReply}
                        className="btn btn-outline btn-sm"
                        style={{ paddingLeft: 14, paddingRight: 14 }}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={replySubmitting}
                        className="btn btn-primary btn-sm"
                        style={{
                          gap: 6,
                          display: "inline-flex",
                          alignItems: "center",
                          paddingLeft: 14,
                          paddingRight: 14,
                        }}
                      >
                        <Send size={13} />
                        {replySubmitting ? "Đang gửi..." : "Gửi phản hồi"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
