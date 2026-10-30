import { useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, ExternalLink, MessageSquareWarning, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Badge, Select, Button } from '../../components/index.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useAdminFeedback, useUpdateFeedbackStatus } from '../../services/systemFeedback.js';

// Filter theo status gửi dạng TÊN chuỗi qua query param ("?status=New") — service backend tự
// Enum.TryParse tên này, khác với body PATCH (JSON) phải gửi số theo enum mặc định của backend.
const STATUS_FILTER_OPTS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'New', label: 'Mới' },
  { value: 'InProgress', label: 'Đang xử lý' },
  { value: 'Resolved', label: 'Đã xử lý' },
  { value: 'Rejected', label: 'Từ chối' },
];

// Đổi trạng thái qua body JSON (PATCH) — backend serialize enum C# mặc định dạng số, value ở đây
// PHẢI khớp thứ tự khai báo SystemFeedbackStatus { New = 0, InProgress = 1, Resolved = 2, Rejected = 3 }.
const STATUS_OPTS = [
  { value: 0, key: 'New', label: 'Mới' },
  { value: 1, key: 'InProgress', label: 'Đang xử lý' },
  { value: 2, key: 'Resolved', label: 'Đã xử lý' },
  { value: 3, key: 'Rejected', label: 'Từ chối' },
];

const CATEGORY_LABEL = {
  0: 'Lỗi hệ thống',
  1: 'Góp ý cải tiến',
  2: 'Khác',
  Bug: 'Lỗi hệ thống',
  Suggestion: 'Góp ý cải tiến',
  Other: 'Khác',
};

const CATEGORY_TONE = {
  0: 'rose',
  1: 'blue',
  2: 'neutral',
  Bug: 'rose',
  Suggestion: 'blue',
  Other: 'neutral',
};

const STATUS_TONE = {
  0: 'blue',
  1: 'amber',
  2: 'mint',
  3: 'rose',
  New: 'blue',
  InProgress: 'amber',
  Resolved: 'mint',
  Rejected: 'rose',
};

function resolveStatusOpt(rawStatus) {
  return STATUS_OPTS.find((o) => o.value === rawStatus || o.key === rawStatus) || STATUS_OPTS[0];
}

export default function AdminSystemFeedback({ notify }) {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const perPage = 20;

  const { data, isLoading, isError, refetch, isFetching } = useAdminFeedback(
    status === 'all' ? undefined : status,
    page,
    perPage
  );
  const updateStatus = useUpdateFeedbackStatus();

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const changeStatus = (item, newStatusValue, customNote) => {
    const adminNote = customNote !== undefined ? customNote : (item.adminNote || null);
    updateStatus.mutate(
      { id: item.id, status: newStatusValue, adminNote },
      {
        onSuccess: () => {
          setEditingNoteId(null);
          if (notify) notify('Đã cập nhật báo cáo hệ thống');
          else toast.success('Đã cập nhật báo cáo hệ thống');
        },
        onError: (e) => {
          const msg = e?.message || 'Cập nhật thất bại';
          if (notify) notify(msg);
          else toast.error(msg);
        },
      }
    );
  };

  const startEditNote = (item) => {
    setEditingNoteId(item.id);
    setNoteDraft(item.adminNote || '');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Thanh công cụ lọc & làm mới */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
        background: 'var(--white)',
        padding: 'var(--space-3) var(--gutter-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ width: 220 }}>
            <Select
              label="Lọc theo trạng thái"
              value={STATUS_FILTER_OPTS.find((o) => o.value === status)?.label}
              options={STATUS_FILTER_OPTS.map((o) => ({ value: o.label, label: o.label }))}
              onChange={(label) => {
                setStatus(STATUS_FILTER_OPTS.find((o) => o.label === label)?.value || 'all');
                setPage(1);
              }}
            />
          </div>
          <div style={{ paddingBottom: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Tổng cộng: <b style={{ color: 'var(--text-strong)' }}>{total}</b> báo cáo
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'Đang tải…' : 'Làm mới'}
          </span>
        </Button>
      </div>

      {isLoading && <SkeletonTable rows={6} cols={5} />}

      {!isLoading && isError && (
        <div style={{
          background: 'var(--white)',
          padding: 'var(--gutter-card)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>
            <AlertCircle size={16} /> Không tải được danh sách báo cáo hệ thống.
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div style={{
          background: 'var(--white)',
          padding: 'var(--space-8) var(--gutter-card)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          <MessageSquareWarning size={28} style={{ color: 'var(--text-faint)' }} />
          <div style={{ font: 'var(--type-body-md)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
            Chưa có báo cáo hệ thống nào
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Các báo cáo lỗi hoặc góp ý từ người dùng gửi tại trang Hồ sơ sẽ hiển thị tại đây.
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((f, i) => {
            const stOpt = resolveStatusOpt(f.status);
            const isEditingNote = editingNoteId === f.id;

            return (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  padding: 'var(--gutter-card)',
                  borderTop: i > 0 ? '1px solid var(--grey-100)' : 'none',
                }}
              >
                <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Badge tone={CATEGORY_TONE[f.category] || 'neutral'}>
                      {CATEGORY_LABEL[f.category] || f.category}
                    </Badge>
                    <span style={{ font: 'var(--type-body-md)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                      {f.title}
                    </span>
                  </div>

                  <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {f.description}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
                    <span>Người gửi: <b style={{ color: 'var(--text-strong)' }}>{f.fullName || '—'}</b>{f.email ? ` (${f.email})` : ''}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {f.createdAt ? new Date(f.createdAt).toLocaleString('vi-VN') : '—'}
                    </span>
                    {f.resolvedAt && (
                      <>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--status-success-ink)' }}>
                          <CheckCircle2 size={12} /> Xử lý lúc: {new Date(f.resolvedAt).toLocaleString('vi-VN')}
                        </span>
                      </>
                    )}
                  </div>

                  {f.pageUrl && (
                    <a
                      href={f.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        font: 'var(--type-caption)',
                        color: 'var(--action-primary)',
                        wordBreak: 'break-all',
                        width: 'fit-content',
                      }}
                    >
                      <ExternalLink size={12} /> {f.pageUrl}
                    </a>
                  )}

                  {/* Ghi chú nội bộ của Admin */}
                  {isEditingNote ? (
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 520 }}>
                      <textarea
                        rows={2}
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Nhập ghi chú xử lý nội bộ của Admin…"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-default)',
                          font: 'var(--type-body-sm)',
                          resize: 'vertical',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => changeStatus(f, stOpt.value, noteDraft.trim() || null)}
                          disabled={updateStatus.isPending}
                        >
                          Lưu ghi chú
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingNoteId(null)}>
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {f.adminNote ? (
                        <span style={{
                          font: 'var(--type-caption)',
                          background: 'var(--surface-sunken)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-body)',
                        }}>
                          <b>Ghi chú Admin:</b> {f.adminNote}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => startEditNote(f)}
                        style={{
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          font: 'var(--type-caption)',
                          color: 'var(--action-primary)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {f.adminNote ? 'Sửa ghi chú' : '+ Thêm ghi chú xử lý'}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <Badge tone={STATUS_TONE[f.status] || 'neutral'}>
                    {stOpt.label}
                  </Badge>
                  <div style={{ width: 180 }}>
                    <Select
                      value={stOpt.label}
                      options={STATUS_OPTS.map((o) => ({ value: o.label, label: o.label }))}
                      onChange={(label) => {
                        const target = STATUS_OPTS.find((o) => o.label === label);
                        if (target) changeStatus(f, target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
}
