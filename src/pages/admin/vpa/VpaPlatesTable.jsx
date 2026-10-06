import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { Badge, Checkbox, Input, Select, SearchField } from '../../../components/index.jsx';
import Button from '../../../components/Button.jsx';
import Modal from '../../../components/Modal.jsx';
import Pagination from '../../../components/Pagination.jsx';
import {
  useVpaAdminPlates, useSetVpaPrice, useApproveVpaSuggested, useRejectVpaPrice, useApproveVpaGroup, useHideVpaPlate, usePinVpaPlate,
} from '../../../services/adminVpa.js';
import { VPA_TAB_LABELS, VPA_PRICE_STATES, formatDateTime, isCar } from '../../../lib/vpaFormat.js';

const LIMIT = 50;
const MAX_BULK = 500;
const money = (v) => (v == null ? '—' : new Intl.NumberFormat('vi-VN').format(v));
const TAB_OPTS = [{ value: '', label: 'Mọi tab' }, ...Object.entries(VPA_TAB_LABELS).map(([value, label]) => ({ value, label }))];
const VEHICLE_OPTS = [{ value: '', label: 'Mọi loại xe' }, { value: 'Car', label: 'Ô tô' }, { value: 'MotorBike', label: 'Xe máy' }];
const STATE_OPTS = [{ value: '', label: 'Mọi trạng thái giá' }, ...Object.entries(VPA_PRICE_STATES).map(([value, s]) => ({ value, label: s.label }))];
const COLS = '36px minmax(120px,1.1fr) 120px 110px 150px 110px 130px minmax(190px,1.6fr)';

// Bảng biển VPA cho Admin. queue = hàng đợi Duyệt giá (chỉ biển Có gợi ý / Đề xuất đổi giá, ưu tiên cao trước);
// ngược lại là danh sách đầy đủ (kể cả tab Hết hạn nội bộ) với bộ lọc.
export default function VpaPlatesTable({ queue = false, notify }) {
  const [f, setF] = useState({ tab: '', vehicle: '', priceState: '', hidden: '' });
  const [q, setQ] = useState('');
  const [dq] = useDebouncedValue(q, 350);
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState(() => new Set());
  const [edit, setEdit] = useState(null);

  const { data, isLoading, isError, refetch, isFetching } = useVpaAdminPlates({ queue: queue || undefined, ...f, q: dq, page, limit: LIMIT });
  const setPrice = useSetVpaPrice();
  const approve = useApproveVpaSuggested();
  const reject = useRejectVpaPrice();
  const approveGroup = useApproveVpaGroup();
  const hide = useHideVpaPlate();
  const pin = usePinVpaPlate();

  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / LIMIT));
  const setFilter = (k) => (v) => { setF((x) => ({ ...x, [k]: v })); setPage(1); setSel(new Set()); };
  const toggle = (id) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allOnPage = items.length > 0 && items.every((i) => sel.has(i.id));
  const toggleAll = () => setSel(allOnPage ? new Set() : new Set(items.map((i) => i.id)));

  const run = async (fn, okMsg) => {
    try {
      const r = await fn();
      notify?.(typeof okMsg === 'function' ? okMsg(r) : okMsg);
      setSel(new Set());
      return true;
    } catch (e) {
      notify?.(e.message || 'Thao tác thất bại');
      return false;
    }
  };
  const bulkIds = [...sel].slice(0, MAX_BULK);
  const bulkMsg = (verb) => (r) => `${verb} ${r.affected} biển${r.skipped ? ` (bỏ qua ${r.skipped})` : ''}`;

  const saveEdit = async () => {
    const price = Number(edit.price);
    if (!price || price <= 0) return notify?.('Giá phải lớn hơn 0');
    if (await run(() => setPrice.mutateAsync({ id: edit.id, price }), 'Đã lưu giá')) setEdit(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchField placeholder="Tìm số biển" value={q} onChange={(e) => { setQ(e && e.target ? e.target.value : e); setPage(1); }} width="min(220px,100%)" ariaLabel="Tìm số biển" />
        {!queue && <Select value={f.tab} options={TAB_OPTS} onChange={setFilter('tab')} variant="pill" />}
        <Select value={f.vehicle} options={VEHICLE_OPTS} onChange={setFilter('vehicle')} variant="pill" />
        {!queue && <Select value={f.priceState} options={STATE_OPTS} onChange={setFilter('priceState')} variant="pill" />}
        {!queue && <Select value={f.hidden} options={[{ value: '', label: 'Ẩn + hiện' }, { value: 'false', label: 'Đang hiện' }, { value: 'true', label: 'Đang ẩn' }]} onChange={setFilter('hidden')} variant="pill" />}
        <span style={{ marginLeft: 'auto', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{data ? `${money(data.total)} biển` : ''}</span>
      </div>

      {sel.size > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--space-2) var(--space-3)' }}>
          <span style={{ font: 'var(--type-label)' }}>Đã chọn {sel.size}{sel.size > MAX_BULK ? ` (chỉ xử lý ${MAX_BULK} đầu)` : ''}</span>
          <Button variant="primary" size="sm" loading={approve.isPending} onClick={() => run(() => approve.mutateAsync(bulkIds), bulkMsg('Đã đồng ý giá gợi ý cho'))}>Đồng ý giá gợi ý</Button>
          <Button variant="outline" size="sm" loading={reject.isPending} onClick={() => run(() => reject.mutateAsync(bulkIds), bulkMsg('Đã từ chối'))}>Từ chối</Button>
          <Button variant="ghost" size="sm" onClick={() => setSel(new Set())}>Bỏ chọn</Button>
        </div>
      )}

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', overflowX: 'auto', opacity: isFetching ? 0.75 : 1 }}>
        <div className="vpa-table" style={{ minWidth: 980 }}>
          <div className="vpa-head" style={{ display: 'grid', gridTemplateColumns: COLS, gap: 8, alignItems: 'center', padding: '10px 16px', font: 'var(--type-label)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-hairline)' }}>
            <Checkbox checked={allOnPage} onChange={toggleAll} label="" />
            <span>Biển</span><span>Tab / Phiên</span><span>Giá khởi điểm</span><span>Giá gợi ý (mẫu)</span><span>Giá duyệt</span><span>Trạng thái</span><span>Thao tác</span>
          </div>
          {isLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>
          ) : isError ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--status-danger)' }}>Lỗi tải danh sách. <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Thử lại</button></div>
          ) : items.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>{queue ? 'Không còn biển nào chờ duyệt giá.' : 'Không có biển phù hợp.'}</div>
          ) : items.map((p) => {
            const st = VPA_PRICE_STATES[p.priceState] || VPA_PRICE_STATES[0];
            const pending = p.priceState === 1 || p.priceState === 4;
            return (
              <div key={p.id} className="vpa-row" style={{ display: 'grid', gridTemplateColumns: COLS, gap: 8, alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-hairline)', font: 'var(--type-body-sm)', background: p.isHidden ? 'var(--surface-sunken)' : undefined }}>
                <Checkbox checked={sel.has(p.id)} onChange={() => toggle(p.id)} label="" />
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontWeight: 'var(--fw-semibold)' }}>{p.isPinned ? '📌 ' : ''}{p.plateNumber}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{isCar(p.vehicle) ? 'Ô tô' : 'Xe máy'} · {p.plateTypeName || '—'}{p.isHidden ? ' · đã ẩn' : ''}</span>
                </span>
                <span data-label="Tab / Phiên" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{VPA_TAB_LABELS[p.tab]}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDateTime(p.auctionStartAt)}</span>
                </span>
                <span data-label="Giá khởi điểm">{money(p.startingPrice)}</span>
                <span data-label="Giá gợi ý">{p.suggestedPrice ? `${money(p.suggestedPrice)} (${p.sampleCount})` : `— (${p.sampleCount ?? 0} mẫu)`}</span>
                <span data-label="Giá duyệt" style={{ fontWeight: 'var(--fw-semibold)' }}>{money(p.approvedPrice)}</span>
                <span data-label="Trạng thái"><Badge tone={st.tone}>{st.label}</Badge></span>
                <span className="vpa-actions" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {p.suggestedPrice && p.priceState !== 2 && <Button variant="primary" size="sm" onClick={() => run(() => approve.mutateAsync([p.id]), 'Đã đồng ý giá gợi ý')}>Đồng ý</Button>}
                  {pending && <Button variant="outline" size="sm" onClick={() => run(() => reject.mutateAsync([p.id]), 'Đã từ chối')}>Từ chối</Button>}
                  <Button variant="ghost" size="sm" onClick={() => setEdit({ id: p.id, plateNumber: p.plateNumber, price: p.approvedPrice || p.suggestedPrice || '' })}>Sửa giá</Button>
                  {p.priceGroupId && p.suggestedPrice && pending && <Button variant="ghost" size="sm" onClick={() => run(() => approveGroup.mutateAsync(p.priceGroupId), bulkMsg('Đã đồng ý cả nhóm:'))}>Cả nhóm</Button>}
                  {!queue && <Button variant="ghost" size="sm" onClick={() => run(() => hide.mutateAsync({ id: p.id, value: !p.isHidden }), p.isHidden ? 'Đã hiện biển' : 'Đã ẩn biển')}>{p.isHidden ? 'Hiện' : 'Ẩn'}</Button>}
                  {!queue && <Button variant="ghost" size="sm" onClick={() => run(() => pin.mutateAsync({ id: p.id, value: !p.isPinned }), p.isPinned ? 'Đã bỏ ghim' : 'Đã ghim')}>{p.isPinned ? 'Bỏ ghim' : 'Ghim'}</Button>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); setSel(new Set()); }} />}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={`Sửa giá — ${edit?.plateNumber || ''}`} maxWidth="400px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input label="Giá hiển thị cho khách (đ)" type="number" min="1" value={edit?.price ?? ''} onChange={(e) => setEdit((x) => ({ ...x, price: e.target.value }))} />
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Khách chỉ thấy giá này sau khi lưu; chưa duyệt thì hiện "Liên hệ báo giá".</span>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setEdit(null)}>Hủy</Button>
            <Button variant="primary" size="md" loading={setPrice.isPending} onClick={saveEdit}>Lưu giá</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
