import { useState, useMemo } from 'react';
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon } from '../../services/adminCoupons.js';
import { Switch, Input, TableColumnMenu, TableSortHeader, useTableColumns, sortTableItems } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import { Plus, Search, Tag, X } from 'lucide-react';

const COUPON_COLUMNS = [
  { key: 'code', label: 'Mã giảm giá', default: true },
  { key: 'discount', label: '% giảm', default: true },
  { key: 'usage', label: 'Đã dùng / Tối đa', default: true },
  { key: 'expiresAt', label: 'Hết hạn', default: true },
  { key: 'status', label: 'Trạng thái', default: true },
];

const EMPTY = { code: '', discountPercent: '', maxUses: '', expiresAt: '' };

export default function AdminCoupons({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminCoupons();
  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState(null);

  // Bộ lọc & Sắp xếp
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive | expired
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState({ key: 'code', dir: 'asc' });

  const { isVisible, colMenuProps } = useTableColumns({
    storageKey: 'bsv.admin.couponsCols',
    columns: COUPON_COLUMNS,
  });

  const rawItems = data?.items || [];

  // Lọc theo keyword & trạng thái
  const filteredItems = useMemo(() => {
    let res = rawItems;
    const now = new Date();

    if (statusFilter === 'active') {
      res = res.filter((c) => c.active && (!c.expiresAt || new Date(c.expiresAt) > now));
    } else if (statusFilter === 'inactive') {
      res = res.filter((c) => !c.active);
    } else if (statusFilter === 'expired') {
      res = res.filter((c) => c.expiresAt && new Date(c.expiresAt) <= now);
    }

    const q = keyword.trim().toLowerCase();
    if (q) {
      res = res.filter((c) => (c.code || '').toLowerCase().includes(q));
    }

    return sortTableItems(res, sort.key, sort.dir, {
      code: (c) => (c.code || '').toLowerCase(),
      discount: (c) => Number(c.discountPercent) || 0,
      usage: (c) => Number(c.usedCount) || 0,
      expiresAt: (c) => (c.expiresAt ? new Date(c.expiresAt).getTime() : 0),
      status: (c) => (c.active ? 1 : 0),
    });
  }, [rawItems, statusFilter, keyword, sort]);

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e && e.target ? e.target.value : e }));

  const submit = async () => {
    setErr(null);
    if (!form.code.trim()) return setErr('Vui lòng nhập mã');
    const pct = Number(form.discountPercent);
    if (!pct || pct < 1 || pct > 100) return setErr('% giảm phải từ 1 đến 100');
    try {
      await createMut.mutateAsync({
        code: form.code.trim(),
        discountPercent: pct,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      notify('Đã tạo mã giảm giá');
      setOpen(false);
      setForm(EMPTY);
    } catch (e) {
      notify(e.message || 'Lỗi tạo mã');
    }
  };

  const toggleActive = async (c) => {
    try {
      await updateMut.mutateAsync({ id: c.id, body: { active: !c.active } });
    } catch (e) {
      notify(e.message || 'Lỗi cập nhật');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Toolbar: Bộ lọc trạng thái, tìm kiếm, TableColumnMenu & Nút Tạo mới */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Tất cả mã' },
            { key: 'active', label: 'Đang hoạt động' },
            { key: 'inactive', label: 'Đã tắt' },
            { key: 'expired', label: 'Hết hạn' },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                title={`Lọc mã giảm giá: ${tab.label}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: isActive ? '1px solid var(--action-primary)' : '1px solid var(--border-hairline)',
                  background: isActive ? 'var(--action-primary)' : 'var(--white)',
                  color: isActive ? 'var(--white)' : 'var(--text-body)',
                  font: 'var(--type-body-sm)',
                  fontWeight: isActive ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  cursor: 'pointer',
                  transition: 'all 120ms ease-out',
                  boxShadow: isActive ? '0 1px 4px rgba(217,119,6,.25)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search, Column Toggle, Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm theo mã coupon…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 28px 0 30px',
                borderRadius: 'var(--radius-field)',
                border: 'none',
                background: 'var(--white)',
                boxShadow: 'var(--shadow-inset-hairline)',
                font: 'var(--type-body-sm)',
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                title="Xóa từ khóa tìm kiếm"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <TableColumnMenu {...colMenuProps} />

          <Button
            variant="primary"
            size="md"
            onClick={() => setOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36 }}
          >
            <Plus size={16} />
            <span>Tạo mã mới</span>
          </Button>
        </div>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'var(--shadow-inset-hairline)' }}>
        {/* Table Header với TableSortHeader */}
        <div style={{
          display: 'flex',
          padding: '12px 18px',
          background: 'var(--surface-sunken)',
          font: 'var(--type-caption)',
          fontWeight: 'var(--fw-bold)',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border-hairline)',
          alignItems: 'center',
        }}>
          {isVisible('code') && (
            <span style={{ flex: '1 1 140px' }}>
              <TableSortHeader label="Mã giảm giá" sortKey="code" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            </span>
          )}
          {isVisible('discount') && (
            <span style={{ flex: '0 0 110px' }}>
              <TableSortHeader label="% giảm" sortKey="discount" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            </span>
          )}
          {isVisible('usage') && (
            <span style={{ flex: '0 0 130px' }}>
              <TableSortHeader label="Đã dùng / Tối đa" sortKey="usage" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            </span>
          )}
          {isVisible('expiresAt') && (
            <span style={{ flex: '0 0 150px' }}>
              <TableSortHeader label="Hết hạn" sortKey="expiresAt" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            </span>
          )}
          {isVisible('status') && (
            <span style={{ flex: '0 0 110px' }}>
              <TableSortHeader label="Trạng thái" sortKey="status" currentSort={sort} onSort={(k, d) => setSort({ key: k, dir: d })} />
            </span>
          )}
        </div>

        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--status-danger)' }}>
            Lỗi tải danh sách mã giảm giá.{' '}
            <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Thử lại</button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Tag size={32} style={{ color: 'var(--text-faint)' }} />
            <span>{keyword ? 'Không tìm thấy mã giảm giá nào khớp từ khóa.' : 'Chưa có mã giảm giá nào ở bộ lọc này.'}</span>
          </div>
        ) : filteredItems.map((c) => {
          const isExpired = c.expiresAt && new Date(c.expiresAt) <= new Date();

          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--border-hairline)', font: 'var(--type-body-sm)' }}>
              {isVisible('code') && (
                <span style={{ flex: '1 1 140px', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)', letterSpacing: '0.04em' }}>
                  {c.code}
                </span>
              )}
              {isVisible('discount') && (
                <span style={{ flex: '0 0 110px', fontWeight: 'var(--fw-semibold)' }}>
                  {c.discountPercent}%
                </span>
              )}
              {isVisible('usage') && (
                <span style={{ flex: '0 0 130px', color: 'var(--text-muted)' }}>
                  <strong>{c.usedCount}</strong>{c.maxUses ? ` / ${c.maxUses}` : ' / ∞'}
                </span>
              )}
              {isVisible('expiresAt') && (
                <span style={{ flex: '0 0 150px', color: isExpired ? 'var(--status-danger)' : 'var(--text-muted)', fontWeight: isExpired ? 600 : 400 }}>
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                  {isExpired && <span style={{ fontSize: 11, marginLeft: 4 }}>(Hết hạn)</span>}
                </span>
              )}
              {isVisible('status') && (
                <span style={{ flex: '0 0 110px' }}>
                  <Switch checked={c.active} onChange={() => toggleActive(c)} label={c.active ? 'Hoạt động' : 'Tắt'} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Tạo mã giảm giá" maxWidth="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input label="Mã" value={form.code} onChange={setF('code')} placeholder="SALE10" required />
          <Input label="% giảm" type="number" min="1" max="100" value={form.discountPercent} onChange={setF('discountPercent')} placeholder="10" required />
          <Input label="Số lần dùng tối đa (để trống = không giới hạn)" type="number" min="1" value={form.maxUses} onChange={setF('maxUses')} placeholder="100" />
          <Input label="Ngày hết hạn (để trống = không hết hạn)" type="date" value={form.expiresAt} onChange={setF('expiresAt')} />
          {err && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={submit} loading={createMut.isPending}>Tạo</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
