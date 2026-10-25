import { useState } from 'react';
import Drawer from '../../../components/Drawer.jsx';
import Button from '../../../components/Button.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import { Badge, Checkbox, Input, Select, InfoTip } from '../../../components/index.jsx';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { formatDate } from '../../../lib/date.js';
import { Calculator, CheckCircle2, Info, AlertCircle, Sparkles, Image as ImageIcon, X, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { useUpdateVpaPlate, useCreateVpaPlate, useSetVpaPrice, useUnlockVpaFields, useVpaPlatePriceReference } from '../../../services/adminVpa.js';
import { useUploadImage } from '../../../services/adminPlates.js';
import { generateOneImage } from '../../../services/plateImages.js';
import { composeFengShuiMeaning } from '../plates/plateUtils.js';
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
  const uploadMut = useUploadImage();
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
    description: plate?.description || '',
    fengShuiMeaning: plate?.fengShuiMeaning || '',
    images: plate?.images || [],
  }));
  const [lockedFields, setLockedFields] = useState(plate?.lockedFields || 0);
  const [uploading, setUploading] = useState(false);
  const [genPreviewLoading, setGenPreviewLoading] = useState(false);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e && e.target ? e.target.value : e }));
  const parsed = parsePlateNumber(f.plateNumber || '');
  const state = plate ? VPA_PRICE_STATES[plate.priceState] : null;
  const busy = create.isPending || update.isPending || setPrice.isPending || uploading || genPreviewLoading;

  // Tự động phân tích phong thủy từ số biển
  const handleAutoFengShui = () => {
    const raw = (f.plateNumber || '').trim();
    if (!raw) return;
    const meaning = composeFengShuiMeaning(raw);
    if (meaning) {
      setF((prev) => ({ ...prev, fengShuiMeaning: meaning }));
      notify?.('Đã tạo phân tích phong thủy tự động');
    } else {
      notify?.('Không nhận diện được phong thủy từ biển này');
    }
  };

  // Tự động tạo mô tả VPA chuẩn SEO
  const handleAutoDescription = () => {
    const raw = (f.plateNumber || '').trim();
    if (!raw) return;
    const isOto = f.vehicle === 'Car';
    const autoDesc = `Biển số ${raw} thuộc kho đấu giá VPA (${isOto ? 'Ô tô' : 'Xe máy'}), phiên đấu giá chính thức theo quy định Bộ Công an. Hỗ trợ trọn gói thủ tục sang tên, thu hồi và đăng ký định danh chính chủ theo Thông tư 24/2023/TT-BCA.`;
    setF((prev) => ({ ...prev, description: autoDesc }));
    notify?.('Đã tạo mô tả VPA chuẩn SEO tự động');
  };

  // Tải ảnh lên Cloudinary
  const handleUpload = async (e) => {
    const files = e?.target?.files;
    if (!files?.length) return;
    const list = Array.from(files);
    e.target.value = '';
    const remaining = 8 - (f.images?.length || 0);
    if (list.length > remaining) { notify?.(`Tối đa 8 ảnh (còn ${remaining} ảnh)`); return; }
    if (list.some((fl) => fl.size > 5 * 1024 * 1024)) { notify?.('Ảnh vượt quá 5MB'); return; }
    setUploading(true);
    try {
      const results = await Promise.all(list.map((fl) => uploadMut.mutateAsync(fl)));
      setF((prev) => ({ ...prev, images: [...prev.images, ...results.map((r) => r.url)] }));
      notify?.(`Đã tải ${results.length} ảnh lên`);
    } catch (err) {
      notify?.(err?.message || 'Lỗi tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => setF((prev) => ({ ...prev, images: (prev.images || []).filter((u) => u !== url) }));
  const moveImage = (i, dir) => {
    const arr = [...(f.images || [])];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setF((prev) => ({ ...prev, images: arr }));
  };

  // Sinh ảnh mockup đại diện tự động
  const targetPlateId = plate?.linkedPlateId || plate?.plateId;
  const handleGenerateImage = async () => {
    if (!targetPlateId) {
      notify?.('Vui lòng lưu thông tin trước để hệ thống liên kết biển, sau đó bấm sinh ảnh');
      return;
    }
    setGenPreviewLoading(true);
    try {
      const res = await generateOneImage(targetPlateId);
      if (res?.url) {
        const rest = (f.images || []).filter((u) => u !== res.url);
        setF((prev) => ({ ...prev, images: [res.url, ...rest] }));
        notify?.('Đã sinh ảnh đại diện mockup thành công!');
      }
    } catch (err) {
      notify?.('Không thể sinh ảnh: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setGenPreviewLoading(false);
    }
  };

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
            description: f.description || null,
            fengShuiMeaning: f.fengShuiMeaning || null,
            images: f.images || [],
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

        {/* Khối Mô tả giới thiệu & Ý nghĩa phong thủy phục vụ SEO & Trải nghiệm khách */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--border-subtle, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Wand2 size={14} color="var(--action-primary)" />
              <span>Mô tả &amp; Giới thiệu biển số VPA (SEO)</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleAutoDescription}
              title="Tự động tạo câu giới thiệu chuẩn SEO theo Thông tư 24"
              style={{ fontSize: 11.5, padding: '3px 8px', gap: 4 }}
            >
              <Sparkles size={12} color="var(--action-primary)" />
              <span>Tạo mô tả tự động</span>
            </Button>
          </div>
          <textarea
            rows={2}
            placeholder="Mô tả biển số VPA, xuất xứ, tính pháp lý định danh chính chủ theo Thông tư 24..."
            value={f.description}
            onChange={(e) => setF((x) => ({ ...x, description: e.target.value }))}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-field)',
              padding: '8px 12px',
              font: 'var(--type-body)',
              color: 'var(--text-strong)',
              resize: 'vertical',
              outline: 'none',
              fontSize: 13,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#f59e0b" />
              <span>Ý nghĩa phong thủy &amp; Thế số đẹp (SEO)</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleAutoFengShui}
              title="Tự động phân tích thế số, ngũ hành và quẻ may mắn từ dãy số biển"
              style={{ fontSize: 11.5, padding: '3px 8px', gap: 4 }}
            >
              <Wand2 size={12} color="#f59e0b" />
              <span>Tự động luận giải</span>
            </Button>
          </div>
          <textarea
            rows={2}
            placeholder="Phân tích phong thủy, ngũ hành, đuôi số tài lộc..."
            value={f.fengShuiMeaning}
            onChange={(e) => setF((x) => ({ ...x, fengShuiMeaning: e.target.value }))}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-field)',
              padding: '8px 12px',
              font: 'var(--type-body)',
              color: 'var(--text-strong)',
              resize: 'vertical',
              outline: 'none',
              fontSize: 13,
            }}
          />
        </div>

        {/* Khối Quản lý Album Ảnh & Mockup Đại Diện */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={14} color="var(--action-primary)" />
              <span>Ảnh biển số &amp; Ảnh đại diện (SEO / OpenGraph)</span>
            </span>
            {targetPlateId && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={genPreviewLoading}
                onClick={handleGenerateImage}
                style={{ fontSize: 11.5, padding: '3px 8px', gap: 4 }}
              >
                <Sparkles size={12} color="var(--action-primary)" />
                <span>{genPreviewLoading ? 'Đang sinh ảnh…' : 'Sinh ảnh mockup tự động'}</span>
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {(f.images || []).map((url, i) => (
              <div
                key={url}
                style={{
                  position: 'relative',
                  width: 76,
                  height: 76,
                  borderRadius: 'var(--radius-md, 8px)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-sunken)',
                }}
              >
                <img
                  src={url}
                  alt={`Ảnh ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {i === 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,0.65)',
                      color: 'var(--white)',
                      fontSize: 9.5,
                      fontWeight: 700,
                      textAlign: 'center',
                      padding: '1px 0',
                    }}
                  >
                    Ảnh bìa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  aria-label="Xóa ảnh"
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,0.65)',
                    color: 'var(--white)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>
                <div style={{ position: 'absolute', top: 2, left: 2, display: 'flex', gap: 2 }}>
                  <button
                    type="button"
                    disabled={i === 0}
                    aria-label="Chuyển lên trước"
                    onClick={() => moveImage(i, -1)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.65)',
                      color: 'var(--white)',
                      cursor: i === 0 ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: i === 0 ? 0.4 : 1,
                    }}
                  >
                    <ChevronLeft size={11} />
                  </button>
                  <button
                    type="button"
                    disabled={i === (f.images || []).length - 1}
                    aria-label="Chuyển xuống sau"
                    onClick={() => moveImage(i, 1)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.65)',
                      color: 'var(--white)',
                      cursor: i === (f.images || []).length - 1 ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: i === (f.images || []).length - 1 ? 0.4 : 1,
                    }}
                  >
                    <ChevronRight size={11} />
                  </button>
                </div>
              </div>
            ))}

            <label
              style={{
                width: 76,
                height: 76,
                borderRadius: 'var(--radius-md, 8px)',
                border: '2px dashed var(--border-subtle, #cbd5e1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 11,
                gap: 2,
                background: 'var(--surface-sunken)',
                transition: 'border-color 0.15s ease',
              }}
            >
              <ImageIcon size={16} />
              <span>{uploading ? 'Đang tải…' : '+ Tải ảnh'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={handleUpload}
              />
            </label>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 11 }}>
            Tối đa 8 ảnh, ≤5MB/ảnh. Ảnh đầu tiên tự động làm ảnh bìa khi share link Facebook/Zalo và hiển thị trên Google Search.
          </span>
        </div>

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
