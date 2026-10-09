import { useState } from 'react';
import Drawer from '../../../components/Drawer.jsx';
import Button from '../../../components/Button.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import { Badge, Checkbox, Input, Select, InfoTip } from '../../../components/index.jsx';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { useUpdateVpaPlate, useCreateVpaPlate, useSetVpaPrice, useUnlockVpaFields } from '../../../services/adminVpa.js';
import { VPA_TAB_LABELS, VPA_PRICE_STATES, VPA_LOCK_FLAGS, VPA_HELP, formatDateTime, isCar } from '../../../lib/vpaFormat.js';

const money = (v) => (v == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(v)}đ`);
const TAB_FULL_LABELS = {
  1: 'Biển số tháng (công bố)',
  2: 'Biển số tuần (chính thức)',
  3: 'Biển hết hạn',
  4: 'Hết hạn nội bộ',
};
const TAB_ADD = [1, 2, 3].map((v) => ({ value: String(v), label: TAB_FULL_LABELS[v] || VPA_TAB_LABELS[v] }));
const TAB_EDIT = [1, 2, 3, 4].map((v) => ({ value: String(v), label: TAB_FULL_LABELS[v] || VPA_TAB_LABELS[v] }));
const VEHICLES = [{ value: 'Car', label: 'Ô tô' }, { value: 'MotorBike', label: 'Xe máy' }];
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (v) => (v ? new Date(v).toISOString() : null);
const none = { value: '', label: 'Tự nhận theo số biển' };

// Ngăn kéo thêm tay / sửa chi tiết biển VPA. Trường sửa tay bị khóa (crawl không ghi đè); biển thêm tay chọn được giờ phiên.
export default function VpaPlateDrawer({ plate, plateTypes, provinces, onClose, notify }) {
  const editing = !!plate;
  const isManual = !editing || plate.isManual;
  const create = useCreateVpaPlate();
  const update = useUpdateVpaPlate();
  const setPrice = useSetVpaPrice();
  const unlock = useUnlockVpaFields();
  const [f, setF] = useState(() => ({
    plateNumber: plate?.plateNumber || '',
    vehicle: plate ? (isCar(plate.vehicle) ? 'Car' : 'MotorBike') : 'Car',
    tab: String(plate?.tab || 1),
    plateTypeId: plate?.plateTypeId || '',
    provinceId: plate?.provinceId || '',
    isFeatured: !!plate?.isFeatured,
    price: plate?.approvedPrice ? String(plate.approvedPrice) : '',
    start: toLocalInput(plate?.auctionStartAt),
    end: toLocalInput(plate?.auctionEndAt),
  }));
  const [lockedFields, setLockedFields] = useState(plate?.lockedFields || 0);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e && e.target ? e.target.value : e }));
  const parsed = parsePlateNumber(f.plateNumber || '');
  const state = plate ? VPA_PRICE_STATES[plate.priceState] : null;
  const busy = create.isPending || update.isPending || setPrice.isPending;

  const save = async () => {
    const price = f.price === '' ? null : Number(f.price);
    if (price != null && (!Number.isFinite(price) || price <= 0)) { notify?.('Giá phải lớn hơn 0'); return; }
    try {
      if (!editing) {
        await create.mutateAsync({
          plateNumber: f.plateNumber.trim(), vehicle: f.vehicle, tab: Number(f.tab), plateTypeId: f.plateTypeId || null, provinceId: f.provinceId || null,
          isFeatured: f.isFeatured, approvedPrice: price, auctionStartAt: toIso(f.start), auctionEndAt: toIso(f.end),
        });
        notify?.('Đã thêm biển VPA');
      } else {
        await update.mutateAsync({
          id: plate.id,
          body: {
            plateTypeId: f.plateTypeId || null, provinceId: f.provinceId || null, tab: Number(f.tab), isFeatured: f.isFeatured,
            ...(isManual ? { auctionStartAt: toIso(f.start), auctionEndAt: toIso(f.end) } : {}),
          },
        });
        if (price != null && price !== plate.approvedPrice) await setPrice.mutateAsync({ id: plate.id, price });
        notify?.('Đã lưu biển VPA');
      }
      onClose();
    } catch (e) {
      notify?.(e.message || 'Không lưu được');
    }
  };

  const release = async (flag) => {
    try {
      const r = await unlock.mutateAsync({ id: plate.id, fields: flag });
      setLockedFields(r.lockedFields);
      notify?.('Đã bỏ khóa — lần crawl tới sẽ cập nhật lại theo VPA');
    } catch (e) { notify?.(e.message || 'Không bỏ khóa được'); }
  };

  const label = (text, tip) => (
    <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {text}{tip && <InfoTip size={12} text={tip} />}
    </span>
  );
  const dateInput = (value, onChange, disabled) => (
    <input type="datetime-local" value={value} onChange={onChange} disabled={disabled}
      style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 12px', font: 'var(--type-body)', color: 'var(--text-strong)', opacity: disabled ? 0.6 : 1 }} />
  );

  return (
    <Drawer open onClose={onClose} title={editing ? 'Sửa biển VPA' : 'Thêm biển VPA'} width="min(52%, 720px)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          {editing
            ? 'Trường bạn sửa sẽ được khóa: lần crawl VPA sau không ghi đè. Giá khởi điểm và giá gợi ý do hệ thống tính, không sửa tay.'
            : 'Biển thêm tay không có trong dữ liệu VPA: crawl không đổi tab hay đánh dấu biến mất. Loại biển và tỉnh tự nhận theo số biển nếu để trống.'}
        </p>

        {editing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ width: 120 }}><PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{plate.plateNumber}</span>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {plate.isManual && <Badge tone="blue">Thêm tay</Badge>}
                {state && <Badge tone={state.tone}>{state.label}</Badge>}
                {plate.isHidden && <Badge tone="neutral">Đang ẩn</Badge>}
                {plate.isPinned && <Badge tone="amber">Đã ghim</Badge>}
              </span>
            </div>
          </div>
        )}

        {!editing && (
          <>
            <Input label="Biển số" placeholder="30A-567.89" value={f.plateNumber} onChange={set('plateNumber')} />
            <Select label="Loại xe" value={f.vehicle} options={VEHICLES} onChange={set('vehicle')} />
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--space-3)' }}>
          <Select label="Tab" value={f.tab} options={editing ? TAB_EDIT : TAB_ADD} onChange={set('tab')} />
          <Select label="Loại biển" value={f.plateTypeId} options={[editing ? { value: '', label: 'Giữ nguyên' } : none, ...plateTypes]} onChange={set('plateTypeId')} />
          <Select label="Tỉnh/thành (theo đầu số)" value={f.provinceId} options={[editing ? { value: '', label: 'Giữ nguyên' } : none, ...provinces]} onChange={set('provinceId')} />
        </div>

        <Checkbox checked={f.isFeatured} onChange={(v) => setF((x) => ({ ...x, isFeatured: v }))} label="Biển nổi bật" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--space-3)' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label('Phiên bắt đầu')}
            {dateInput(f.start, set('start'), !isManual)}
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label('Phiên kết thúc')}
            {dateInput(f.end, set('end'), !isManual)}
          </label>
        </div>
        {editing && !isManual && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giờ phiên của biển đồng bộ từ VPA do VPA quyết định, không sửa tay.</span>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Input label="Giá hiển thị cho khách (đ)" type="number" min="1" placeholder="Để trống = Giá liên hệ" value={f.price} onChange={set('price')} />
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{VPA_HELP.approved}</span>
        </div>

        {editing && (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 6, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
            <span>Giá khởi điểm VPA: <b>{money(plate.startingPrice)}</b> {label('', VPA_HELP.startingPrice)}</span>
            <span>Giá gợi ý: <b>{plate.suggestedPrice ? money(plate.suggestedPrice) : '—'}</b> ({plate.sampleCount ?? 0} mẫu) {label('', VPA_HELP.suggested)}</span>
            <span>Phiên: {formatDateTime(plate.auctionStartAt)} → {formatDateTime(plate.auctionEndAt)}</span>
          </div>
        )}

        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {label('Trường đã sửa tay (bị khóa)', VPA_HELP.lock)}
            {VPA_LOCK_FLAGS.filter((l) => lockedFields & l.flag).length === 0
              ? <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chưa có — mọi trường đang theo VPA.</span>
              : VPA_LOCK_FLAGS.filter((l) => lockedFields & l.flag).map((l) => (
                <span key={l.flag} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge tone="amber">{l.label}</Badge>
                  <Button variant="ghost" size="sm" loading={unlock.isPending} onClick={() => release(l.flag)}>Trả về theo VPA</Button>
                </span>
              ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" onClick={onClose}>Hủy</Button>
          <Button variant="primary" size="md" loading={busy} onClick={save}>{editing ? 'Lưu' : 'Thêm biển'}</Button>
        </div>
      </div>
    </Drawer>
  );
}
