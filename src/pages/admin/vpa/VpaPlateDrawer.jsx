import { useState } from 'react';
import Drawer from '../../../components/Drawer.jsx';
import Button from '../../../components/Button.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import { Badge, Checkbox, Input, Select, InfoTip } from '../../../components/index.jsx';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { formatDate } from '../../../lib/date.js';
import { Calculator, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { useUpdateVpaPlate, useCreateVpaPlate, useSetVpaPrice, useUnlockVpaFields, useVpaPlatePriceReference } from '../../../services/adminVpa.js';
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
  const { data: priceRef, isLoading: refLoading } = useVpaPlatePriceReference(plate?.id, !!editing && !!plate?.id);
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
      <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
          <Select label="Tab" info="Trạng thái biển trong 4 tab VPA: Tháng (công bố) → Tuần (sắp đấu chính thức) → Hết hạn (đã qua phiên)." value={f.tab} options={editing ? TAB_EDIT : TAB_ADD} onChange={set('tab')} />
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
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 8, font: 'var(--type-body-sm)', color: 'var(--text-body)', border: '1px solid var(--border-hairline, #e2e8f0)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Giá khởi điểm VPA: <b>{money(plate.startingPrice)}</b> {label('', VPA_HELP.startingPrice)}</span>
              <span>Phiên: {formatDateTime(plate.auctionStartAt)} → {formatDateTime(plate.auctionEndAt)}</span>
            </div>

            <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-hairline, #e2e8f0)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 'var(--fw-semibold)' }}>
                  <Calculator size={14} color="var(--action-primary)" />
                  Giá gợi ý: <b style={{ color: 'var(--action-primary)' }}>{plate.suggestedPrice ? money(plate.suggestedPrice) : '—'}</b>
                </span>
                {priceRef?.items?.length > 0 && (
                  <span style={{ fontSize: '11px', color: '#3FBF8F', fontWeight: 600, background: '#F0FAF6', padding: '2px 8px', borderRadius: '10px', border: '1px solid #D6F0E5' }}>
                    {priceRef.items.length} mẫu trúng đấu giá cùng tỉnh
                  </span>
                )}
              </div>

              {refLoading ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Đang tra cứu mẫu đấu giá đối chiếu...</span>
              ) : priceRef?.items?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.4 }}>
                    Công thức: <strong>TB {priceRef.items.length} mẫu ({money(priceRef.avgPrice)})</strong> × Hệ số <strong>{priceRef.factor}x</strong> ≈ <strong style={{ color: 'var(--action-primary)' }}>{money(Math.round(priceRef.avgPrice * priceRef.factor))}</strong>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Trùng đuôi số <strong>{priceRef.tailNumber || '—'}</strong> trong kết quả đấu giá thực tế:
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto', background: 'var(--white)', padding: 6, borderRadius: '6px', border: '1px solid var(--grey-100, #e2e8f0)' }}>
                    {priceRef.items.map((it) => (
                      <div
                        key={it.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          background: 'var(--surface-sunken)',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '0.5px' }}>
                            {it.plateNumber}
                          </span>
                          {it.provinceName && (
                            <span style={{ fontSize: '10.5px', padding: '1px 5px', borderRadius: '8px', background: '#F0FAF6', color: '#3FBF8F', fontWeight: 600 }}>
                              {it.provinceName}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#3FBF8F' }}>
                            {money(it.auctionPrice)}
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {formatDate(it.auctionStartAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Info size={12} color="#d97706" />
                  <span>
                    {priceRef?.usedOwnStartingPrice || priceRef?.matchType === 'starting_price'
                      ? `Không có mẫu cùng tỉnh trùng đuôi số (${priceRef?.tailNumber || '—'}) → Tính từ Giá sàn (${money(plate.startingPrice)}) × ${priceRef?.factor || 2.5}x`
                      : (plate.startingPrice > 0 ? `Tính từ Giá sàn (${money(plate.startingPrice)}) × 2.5 (chưa có mẫu)` : 'Chưa có mẫu đối chiếu')}
                  </span>
                </div>
              )}
            </div>
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
          <Button variant="ghost" size="md" type="button" onClick={onClose}>Hủy</Button>
          <Button variant="primary" size="md" type="submit" loading={busy}>{editing ? 'Lưu' : 'Thêm biển'}</Button>
        </div>
      </form>
    </Drawer>
  );
}
