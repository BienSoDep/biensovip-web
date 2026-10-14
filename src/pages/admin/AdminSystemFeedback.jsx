import { useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Select } from '../../components/index.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useAdminFeedback, useUpdateFeedbackStatus } from '../../services/systemFeedback.js';

// Filter theo status gửi dạng TÊN chuỗi qua query param ("?status=New") — service backend tự
// Enum.TryParse tên này, khác với body PATCH (JSON) phải gửi số theo enum mặc định của backend.
const STATUS_FILTER_OPTS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'New', label: 'Mới' },
  { value: 'InProgress', label: 'Đang xử lý' },
  { value: 'Resolved', label: 'Đã xử lý' },
  { value: 'Rejected', label: 'Từ chối' },
];

// Đổi trạng thái qua body JSON (PATCH) — backend serialize enum C# mặc định dạng số, value ở đây
// PHẢI khớp thứ tự khai báo SystemFeedbackStatus { New, InProgress, Resolved, Rejected }.
const STATUS_OPTS = [
  { value: 0, label: 'Mới' },
  { value: 1, label: 'Đang xử lý' },
  { value: 2, label: 'Đã xử lý' },
  { value: 3, label: 'Từ chối' },
];

const CATEGORY_LABEL = { 0: 'Lỗi hệ thống', 1: 'Góp ý', 2: 'Khác' };
const STATUS_TONE = { 0: 'blue', 1: 'amber', 2: 'mint', 3: 'rose' };

export default function AdminSystemFeedback({ notify }) {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const { data, isLoading, isError } = useAdminFeedback(status === 'all' ? undefined : status, page, perPage);
  const updateStatus = useUpdateFeedbackStatus();

  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / perPage));

  const changeStatus = (id, newStatus) => {
    updateStatus.mutate({ id, status: newStatus }, {
      onSuccess: () => (notify ? notify('Đã cập nhật trạng thái') : toast.success('Đã cập nhật trạng thái')),
      onError: (e) => (notify ? notify(e.message || 'Cập nhật thất bại') : toast.error(e.message || 'Cập nhật thất bại')),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ width: 200 }}>
          <Select label="Trạng thái" value={STATUS_FILTER_OPTS.find((o) => o.value === status)?.label}
            options={STATUS_FILTER_OPTS.map((o) => ({ value: o.label, label: o.label }))}
            onChange={(label) => { setStatus(STATUS_FILTER_OPTS.find((o) => o.label === label)?.value || 'all'); setPage(1); }} />
        </div>
      </div>

      {isLoading && <SkeletonTable rows={6} cols={5} />}
      {!isLoading && isError && (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tải được danh sách báo cáo.</span>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có báo cáo nào.</span>
      )}

      {items.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((f, i) => (
            <div key={f.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--gutter-card)', borderTop: i > 0 ? '1px solid var(--grey-100)' : 'none' }}>
              <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Badge tone="neutral">{CATEGORY_LABEL[f.category] || f.category}</Badge>
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{f.title}</span>
                </div>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{f.description}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  {f.fullName}{f.email ? ` · ${f.email}` : ''} · {new Date(f.createdAt).toLocaleString('vi-VN')}
                </span>
                {f.pageUrl && (
                  <a href={f.pageUrl} target="_blank" rel="noreferrer" style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', wordBreak: 'break-all' }}>{f.pageUrl}</a>
                )}
              </div>
              <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Badge tone={STATUS_TONE[f.status] || 'neutral'}>{STATUS_OPTS.find((o) => o.value === f.status)?.label ?? f.status}</Badge>
                <div style={{ width: 180 }}>
                  <Select value={STATUS_OPTS.find((o) => o.value === f.status)?.label}
                    options={STATUS_OPTS.map((o) => ({ value: o.label, label: o.label }))}
                    onChange={(label) => changeStatus(f.id, STATUS_OPTS.find((o) => o.label === label)?.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
}
