import { useState, useMemo } from 'react';
import {
  MessageSquare, Clock, CheckCircle2, XCircle, RotateCw,
  Search, X, User, FileText, ChevronRight, Filter, AlertCircle
} from 'lucide-react';
import { useAdminBlogComments, useModerateBlogComment } from '../../services/adminBlogComments.js';
import { Badge, Select } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';

const STATUS_OPTS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Đang chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
];

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', tone: 'amber', bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)', icon: Clock },
  approved: { label: 'Đã duyệt', tone: 'mint', bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)', icon: CheckCircle2 },
  rejected: { label: 'Đã từ chối', tone: 'danger', bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: 'rgba(239, 68, 68, 0.25)', icon: XCircle },
};

function formatVNTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  } catch {
    return iso;
  }
}

// Lấy chữ cái đầu làm avatar
function getAvatarInitial(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].charAt(0).toUpperCase() || 'U';
}

export default function AdminBlogComments({ notify }) {
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmReject, setConfirmReject] = useState(null);

  const { data, isLoading, isError, refetch } = useAdminBlogComments(status);
  const moderate = useModerateBlogComment();

  const allItems = data?.items || [];

  // Lọc theo từ khóa tìm kiếm (nội dung hoặc tên người dùng hoặc tiêu đề bài viết)
  const items = useMemo(() => {
    if (!searchTerm.trim()) return allItems;
    const term = searchTerm.toLowerCase().trim();
    return allItems.filter((c) =>
      (c.content || '').toLowerCase().includes(term) ||
      (c.userName || '').toLowerCase().includes(term) ||
      (c.blogPostTitle || '').toLowerCase().includes(term)
    );
  }, [allItems, searchTerm]);

  // Thống kê đếm trạng thái
  const stats = useMemo(() => {
    const total = allItems.length;
    const pending = allItems.filter((c) => c.status === 'pending').length;
    const approved = allItems.filter((c) => c.status === 'approved').length;
    const rejected = allItems.filter((c) => c.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [allItems]);

  const act = (id, next) => {
    moderate.mutate({ id, status: next }, {
      onSuccess: () => {
        setConfirmReject(null);
        notify(next === 'approved' ? 'Đã duyệt bình luận' : next === 'rejected' ? 'Đã từ chối bình luận' : 'Đã cập nhật trạng thái');
      },
      onError: (e) => notify(e.message || 'Lỗi xử lý bình luận'),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 4 Thẻ KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        {/* KPI: Tất cả */}
        <div
          onClick={() => setStatus('')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: status === '' ? '2px solid var(--action-primary)' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng bình luận</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.total}</div>
          </div>
        </div>

        {/* KPI: Chờ duyệt */}
        <div
          onClick={() => setStatus('pending')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: status === 'pending' ? '2px solid #d97706' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang chờ duyệt</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#d97706' }}>
              {stats.pending}
            </div>
          </div>
        </div>

        {/* KPI: Đã duyệt */}
        <div
          onClick={() => setStatus('approved')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: status === 'approved' ? '2px solid #059669' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đã phê duyệt</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#059669' }}>{stats.approved}</div>
          </div>
        </div>

        {/* KPI: Đã từ chối */}
        <div
          onClick={() => setStatus('rejected')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: status === 'rejected' ? '2px solid #dc2626' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đã từ chối</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#dc2626' }}>{stats.rejected}</div>
          </div>
        </div>
      </div>

      {/* Bộ lọc Tab Pills & Tìm kiếm */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        padding: '14px 18px',
        boxShadow: 'var(--shadow-inset-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}>
        {/* Tab Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: '', label: 'Tất cả', count: stats.total },
            { id: 'pending', label: 'Chờ duyệt', count: stats.pending, alert: stats.pending > 0 },
            { id: 'approved', label: 'Đã duyệt', count: stats.approved },
            { id: 'rejected', label: 'Đã từ chối', count: stats.rejected },
          ].map((t) => {
            const active = status === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatus(t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--action-dark)' : 'var(--surface-sunken)',
                  color: active ? 'var(--white)' : 'var(--text-body)',
                  font: 'var(--type-body-sm)',
                  fontWeight: active ? 600 : 500,
                  transition: 'all 120ms ease',
                }}
              >
                <span>{t.label}</span>
                <span style={{
                  padding: '1px 7px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  background: active ? 'rgba(255, 255, 255, 0.22)' : t.alert ? '#fef3c7' : 'var(--border-hairline)',
                  color: active ? 'var(--white)' : t.alert ? '#b45309' : 'var(--text-muted)',
                }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tìm kiếm & Nút Làm mới */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm theo nội dung, tên tác giả…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 30px 0 32px',
                borderRadius: 'var(--radius-field)',
                border: 'none',
                background: 'var(--surface-sunken)',
                boxShadow: 'var(--shadow-inset-hairline)',
                font: 'var(--type-body-sm)',
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            title="Làm mới"
            style={{
              height: 36,
              width: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--border-hairline)',
              background: 'var(--white)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Danh sách bình luận */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <RotateCw size={24} className="animate-spin" style={{ color: 'var(--action-primary)' }} />
            <span>Đang tải danh sách bình luận…</span>
          </div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <AlertCircle size={28} />
            <span>Lỗi tải danh sách bình luận.</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <MessageSquare size={36} style={{ color: 'var(--text-faint)' }} />
            <div style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)' }}>
              Không có bình luận nào
            </div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              {searchTerm ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'Hiện tại chưa có bình luận nào trong danh mục này.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((c, idx) => {
              const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const initial = getAvatarInitial(c.userName);
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '18px 22px',
                    borderBottom: idx < items.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-sunken)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* User Avatar Circle */}
                  <div style={{
                    flex: '0 0 auto',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 15,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}>
                    {initial}
                  </div>

                  {/* Comment Details */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)' }}>
                          {c.userName || 'Khách vãng lai'}
                        </span>
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                          {formatVNTime(c.createdAt)}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: 12,
                        fontWeight: 600,
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                      }}>
                        <StatusIcon size={13} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Associated Blog Post Title */}
                    {c.blogPostTitle && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        font: 'var(--type-caption)',
                        color: 'var(--action-primary)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(59, 130, 246, 0.08)',
                        width: 'fit-content',
                      }}>
                        <FileText size={12} />
                        <span>Bài viết: <strong>{c.blogPostTitle}</strong></span>
                      </div>
                    )}

                    {/* Comment Content */}
                    <div style={{
                      font: 'var(--type-body)',
                      color: 'var(--text-body)',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-line',
                      background: 'var(--surface-sunken)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-field)',
                      marginTop: 2,
                    }}>
                      {c.content}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      {c.status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => act(c.id, 'approved')}
                            disabled={moderate.isPending}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#059669', borderColor: '#059669' }}
                          >
                            <CheckCircle2 size={14} /> Duyệt hiển thị
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmReject(c)}
                            disabled={moderate.isPending}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#dc2626' }}
                          >
                            <XCircle size={14} /> Từ chối
                          </Button>
                        </>
                      )}

                      {c.status === 'rejected' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => act(c.id, 'approved')}
                          disabled={moderate.isPending}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#059669' }}
                        >
                          <CheckCircle2 size={14} /> Khôi phục & Duyệt lại
                        </Button>
                      )}

                      {c.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => act(c.id, 'rejected')}
                          disabled={moderate.isPending}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
                        >
                          <XCircle size={14} /> Gỡ bỏ (Ẩn khỏi web)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Reject Modal */}
      {!!confirmReject && (
        <ConfirmModal
          open
          title="Xác nhận từ chối bình luận"
          danger
          confirmLabel="Từ chối"
          message={`Từ chối bình luận của "${confirmReject.userName || 'Người dùng'}"? Bình luận này sẽ không được hiển thị công khai trên website.`}
          onClose={() => setConfirmReject(null)}
          onConfirm={() => act(confirmReject.id, 'rejected')}
        />
      )}
    </div>
  );
}
