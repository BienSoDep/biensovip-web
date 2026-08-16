import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@mantine/hooks';
import { useAdminContacts, useUpdateContactStatus } from '../../services/adminContacts.js';
import { Select } from '../../components/index.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';

const INTENT_LABEL = { inquiry: 'Hỏi chung', deposit_request: 'Đặt cọc', buy: 'Mua đứt', hunting: 'Săn hộ' };
const INTENT_COLOR = { inquiry: 'var(--text-muted)', deposit_request: '#C75B00', buy: 'var(--blue-700)', hunting: '#7B2D8B' };
const STATUS_OPTS = ['Mới', 'Đang tư vấn', 'Đã chốt', 'Đã tìm thấy'];
const STATUS_VAL = { 'Mới': 'new', 'Đang tư vấn': 'consulting', 'Đã chốt': 'closed', 'Đã tìm thấy': 'found' };
const STATUS_LABEL = { new: 'Mới', consulting: 'Đang tư vấn', closed: 'Đã chốt', found: 'Đã tìm thấy' };
const STATUS_COLOR = { new: 'var(--blue-700)', consulting: '#8A6100', closed: '#1B7A5A', found: '#7B2D8B' };
const INTENT_OPTS = ['Tất cả', 'Hỏi chung', 'Đặt cọc', 'Mua đứt', 'Săn hộ'];
const INTENT_VAL = { 'Hỏi chung': 'inquiry', 'Đặt cọc': 'deposit_request', 'Mua đứt': 'buy', 'Săn hộ': 'hunting' };

function parsePlateNumber(raw) {
  if (!raw) return null;
  const idx = Math.max(raw.lastIndexOf('-'), raw.lastIndexOf(' '));
  if (idx < 0) return null;
  const front = raw.substring(0, idx);
  const num = raw.substring(idx + 1);
  const m = front.match(/^(\d{1,2})(\D.*)$/);
  if (!m) return null;
  return { prov: m[1], seri: m[2], num };
}

export default function AdminContacts({ notify }) {
  const [status, setStatus] = useState('all');
  const [intent, setIntent] = useState('all');
  const [search, setSearch] = useState('');
  const [q] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminContacts({ status, intent, q, page, perPage: 20 });
  const updateStatus = useUpdateContactStatus();

  const result = data ?? { items: [], total: 0, page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  const handleStatus = (id, label) => {
    updateStatus.mutate({ id, status: STATUS_VAL[label] }, {
      onSuccess: () => toast.success('Đã cập nhật trạng thái'),
      onError: () => toast.error('Lỗi cập nhật trạng thái'),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm tên / SĐT..."
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)', color: 'var(--text-body)', background: 'var(--white)', minWidth: 200 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Trạng thái:</span>
          <Select value={status === 'all' ? 'Tất cả' : STATUS_LABEL[status]} options={['Tất cả', ...STATUS_OPTS].map((o) => ({ value: o, label: o }))} onChange={(v) => { setStatus(v === 'Tất cả' ? 'all' : STATUS_VAL[v]); setPage(1); }} variant="pill" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Mục đích:</span>
          <Select value={intent === 'all' ? 'Tất cả' : INTENT_LABEL[intent]} options={INTENT_OPTS.map((o) => ({ value: o, label: o }))} onChange={(v) => { setIntent(v === 'Tất cả' ? 'all' : INTENT_VAL[v]); setPage(1); }} variant="pill" />
        </div>
        <span style={{ flex: 1, font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'right' }}>{result.total} yêu cầu</span>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 820 }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '1 1 96px' }}>Khách hàng</span>
          <span style={{ flex: '1 1 88px' }}>Điện thoại</span>
          <span style={{ flex: '1 1 100px' }}>Biển quan tâm</span>
          <span style={{ flex: '1 1 72px' }}>Mục đích</span>
          <span style={{ flex: '1 1 120px' }}>Ghi chú</span>
          <span style={{ flex: '1 1 80px' }}>Đặt cọc</span>
          <span style={{ flex: '1 1 64px' }}>Thời gian</span>
          <span style={{ flex: '1 1 160px' }}>Trạng thái</span>
        </div>

        {isLoading && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>}

        {!isLoading && result.items.map((c) => {
          const parsed = parsePlateNumber(c.plateNumber);
          return (
            <div key={c.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <span style={{ flex: '1 1 96px', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{c.fullName}</span>
              <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{c.phone}</span>
              <span style={{ flex: '1 1 100px' }}>
                {parsed ? <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} /> : <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>—</span>}
              </span>
              <span style={{ flex: '1 1 72px' }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', background: INTENT_COLOR[c.intent] + '18', color: INTENT_COLOR[c.intent] }}>
                  {INTENT_LABEL[c.intent] || c.intent}
                </span>
              </span>
              <span style={{ flex: '1 1 120px', font: 'var(--type-caption)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.note}>{c.note || '—'}</span>
              <span style={{ flex: '1 1 80px', font: 'var(--type-caption)', color: 'var(--text-strong)' }}>{c.depositAmount != null ? new Intl.NumberFormat('vi-VN').format(c.depositAmount) + ' đ' : '—'}</span>
              <span style={{ flex: '1 1 64px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                {new Date(c.createdAt).toLocaleDateString('vi-VN')}
              </span>
              <span style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <Select
                  value={STATUS_LABEL[c.status] || c.status}
                  options={STATUS_OPTS.map((o) => ({ value: o, label: o }))}
                  onChange={(v) => handleStatus(c.id, v)}
                  variant="pill"
                  style={{ color: STATUS_COLOR[c.status] || 'var(--text-strong)' }}
                />
              </span>
            </div>
          );
        })}
        </div>
        </div>

        {!isLoading && result.items.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có yêu cầu nào.</div>}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} style={{
              minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)',
              background: p === page ? 'var(--action-primary)' : 'var(--white)',
              color: p === page ? 'var(--white)' : 'var(--text-body)',
              font: 'var(--type-body-sm)', fontWeight: p === page ? 'var(--fw-bold)' : 'var(--fw-medium)',
              cursor: 'pointer', boxShadow: 'var(--shadow-inset-hairline)',
            }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
