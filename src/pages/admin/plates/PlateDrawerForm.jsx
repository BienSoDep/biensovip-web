import { useState, useEffect } from 'react';
import Drawer from '../../../components/Drawer.jsx';
import Button from '../../../components/Button.jsx';
import { Select, InfoTip } from '../../../components/index.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import GiftedPlateField from './GiftedPlateField.jsx';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { generateOneImage } from '../../../services/plateImages.js';
import {
  CAND_FIELDS,
  detectPlateTypeId,
  detectVehicleTypeId,
  composeFengShuiMeaning,
  num,
} from './plateUtils.js';

export default function PlateDrawerForm({
  form,
  setF,
  setForm,
  formErr,
  blurValidateField,
  saving,
  uploading,
  showCost,
  notify,
  plateTypes,
  provinces,
  vehicleTypes,
  editDetail,
  onPlateNumberChange,
  onSave,
  onUpload,
  onRemoveImage,
  onClose,
  setPreviewImageUrl,
}) {
  const fileRef = (e) => {
    if (e?.target?.files?.length) {
      onUpload(e.target.files);
      e.target.value = '';
    }
  };

  // Auto-fill: candidates sinh từ biển số; mỗi field có toggle thêm/xóa riêng + "Thêm tất cả".
  const [candidates, setCandidates] = useState(null);
  const [candOn, setCandOn] = useState({});
  const generateCandidates = () => {
    const raw = (form.plateNumber || '').trim();
    const { prov, seri, num: parsedNum } = parsePlateNumber(raw);
    const serial = parsedNum.replace(/\D/g, '');
    const provinceId = (provinces.find((o) => (o.code || '').trim() === (prov || '').trim()) || {}).value || '';
    const cand = {
      provinceId,
      plateTypeId: detectPlateTypeId(serial, plateTypes),
      vehicleTypeId: detectVehicleTypeId(seri, vehicleTypes),
      fengShuiMeaning: composeFengShuiMeaning(raw),
    };
    setCandidates(cand);
    const on = {};
    CAND_FIELDS.forEach((f) => { on[f.key] = !!cand[f.key]; });
    setCandOn(on);
    if (!Object.values(cand).some(Boolean)) notify?.('Không tự nhận diện được thông tin từ biển số này — vui lòng chọn tay.');
  };

  const toggleCandidate = (key) => {
    const next = !candOn[key];
    setCandOn((prev) => ({ ...prev, [key]: next }));
    setF(key)(next ? candidates[key] : '');
  };

  const applyAll = () => {
    const on = {};
    CAND_FIELDS.forEach((f) => {
      const v = candidates?.[f.key];
      if (v) { on[f.key] = true; setF(f.key)(v); } else { on[f.key] = false; }
    });
    setCandOn(on);
  };

  const candRows = candidates ? CAND_FIELDS.filter((f) => candidates[f.key]) : [];
  // Hiển thị tên thật (label) thay vì id category cho các field trong panel gợi ý.
  const candidateLabel = (key, value) => {
    const map = { provinceId: provinces, plateTypeId: plateTypes, vehicleTypeId: vehicleTypes }[key];
    if (map) return (map.find((o) => o.value === value) || {}).label || value;
    return value;
  };

  const moveImage = (i, dir) => {
    const arr = [...(form.images || [])];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setF('images')(arr);
  };

  // Preview ảnh renderer (SkiaSharp, cùng ảnh dùng cho "Sinh ảnh hàng loạt") — chỉ dùng được khi biển
  // đã tồn tại (editDetail.id), vì generateOneImage cần plateId thật đã lưu DB.
  const [genPreviewUrl, setGenPreviewUrl] = useState(null);
  const [genPreviewLoading, setGenPreviewLoading] = useState(false);
  useEffect(() => {
    if (!editDetail?.id) { setGenPreviewUrl(null); return; }
    let cancelled = false;
    setGenPreviewLoading(true);
    generateOneImage(editDetail.id)
      .then((res) => { if (!cancelled) setGenPreviewUrl(res.url); })
      .catch(() => { if (!cancelled) setGenPreviewUrl(null); })
      .finally(() => { if (!cancelled) setGenPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [editDetail?.id]);

  const useGenPreviewAsCover = () => {
    if (!genPreviewUrl) return;
    const rest = (form.images || []).filter((u) => u !== genPreviewUrl);
    setF('images')([genPreviewUrl, ...rest]);
  };

  const parsed = (() => {
    const s = (form.plateNumber || '').trim();
    const idx = Math.max(s.lastIndexOf('-'), s.lastIndexOf(' '));
    if (idx < 0) return { prov: '43', seri: 'A1', num: '000.00' };
    const left = s.slice(0, idx).replace(/[\s-]/g, '');
    const numPart = s.slice(idx + 1).trim() || '000.00';
    const prov = left.match(/^\d{1,2}/)?.[0] || '43';
    const seri = left.slice(prov.length) || 'A1';
    return { prov, seri, num: numPart };
  })();

  return (
    <Drawer open onClose={onClose} title={editDetail ? 'Sửa biển số' : 'Thêm biển số'} width="min(52%, 720px)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          {editDetail ? 'Cập nhật thông tin biển đang bán.' : 'Biển sẽ xuất hiện ở đầu bảng và trang chủ.'}
        </p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Biển số</span>
          <span style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
            <input
              type="text" placeholder="43A1-999.99" value={form.plateNumber ?? ''}
              onChange={(e) => onPlateNumberChange(e.target.value)}
              onBlur={blurValidateField('plateNumber')}
              style={{
                height: 40, flex: '1 1 auto', border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)',
                boxShadow: formErr.plateNumber ? 'inset 0 0 0 1.5px var(--status-danger)' : 'var(--shadow-inset-hairline)',
                padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none',
              }}
            />
            <Button variant="outline" size="sm" onClick={generateCandidates} disabled={!(form.plateNumber || '').trim()} style={{ whiteSpace: 'nowrap' }}>Tự động điền</Button>
          </span>
          {formErr.plateNumber && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{formErr.plateNumber}</span>}
        </label>

        {candRows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Gợi ý từ biển số</span>
              <Button variant="primary" size="sm" onClick={applyAll} style={{ whiteSpace: 'nowrap' }}>Thêm tất cả</Button>
            </div>
            {candRows.map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!candOn[key]} onChange={() => toggleCandidate(key)} style={{ width: 16, height: 16, accentColor: 'var(--action-primary)' }} />
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', flex: '0 0 140px' }}>{label}</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{candidateLabel(key, candidates[key])}</span>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Select label="Loại biển" value={form.plateTypeId} options={plateTypes} onChange={(v) => { setF('plateTypeId')(v); blurValidateField('plateTypeId', v)(); }} style={{ flex: '1 1 140px' }} required />
          <Select label="Tỉnh/thành" value={form.provinceId} options={provinces} onChange={(v) => { setF('provinceId')(v); blurValidateField('provinceId', v)(); }} style={{ flex: '1 1 140px' }} required />
          <Select label="Loại xe" value={form.vehicleTypeId} options={vehicleTypes} onChange={(v) => { setF('vehicleTypeId')(v); blurValidateField('vehicleTypeId', v)(); }} style={{ flex: '1 1 140px' }} required />
        </div>
        {(formErr.plateTypeId || formErr.provinceId || formErr.vehicleTypeId) && (
          <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>
            {[formErr.plateTypeId, formErr.provinceId, formErr.vehicleTypeId].filter(Boolean).join(' · ')}
          </span>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Giá</span>
              <input
                type="text" placeholder="2.150.000.000" value={form.price ?? ''}
                onChange={setF('price')} disabled={form.priceOnRequest}
                style={{
                  height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: form.priceOnRequest ? 'var(--grey-100)' : 'var(--surface-sunken)',
                  boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)',
                  outline: 'none', opacity: form.priceOnRequest ? 0.6 : 1,
                }}
              />
            </label>
          </div>
          {showCost && (
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Giá vốn<InfoTip size={12} text="Chỉ hiện với người có quyền xem giá vốn — không công khai, dùng tính lợi nhuận nội bộ." /></span>
                <input
                  type="text" placeholder="1.500.000.000" value={form.costPrice ?? ''}
                  onChange={setF('costPrice')}
                  style={{
                    height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)',
                    boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none',
                  }}
                />
              </label>
            </div>
          )}
          {!form.priceOnRequest && (
            <>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>% giảm</span>
                  <input
                    type="text" placeholder="10" value={form.saleDiscountPercent ?? ''}
                    onChange={(e) => {
                      const pct = e.target.value.replace(/[^\d]/g, '');
                      setForm((f) => ({
                        ...f, saleDiscountPercent: pct,
                        salePrice: pct && num(f.price) > 0 ? String(Math.round(num(f.price) * (1 - Number(pct) / 100))) : '',
                      }));
                    }}
                    style={{
                      height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)',
                      boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none',
                    }}
                  />
                </label>
              </div>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Giá sau giảm</span>
                  <input
                    type="text" placeholder="Để trống nếu không giảm" value={form.salePrice ?? ''}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, '');
                      setForm((f) => ({
                        ...f, salePrice: v,
                        saleDiscountPercent: v && num(f.price) > 0 ? String(Math.round((1 - Number(v) / num(f.price)) * 100)) : '',
                      }));
                    }}
                    style={{
                      height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)',
                      boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none',
                    }}
                  />
                </label>
              </div>
            </>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.priceOnRequest} onChange={(e) => setF('priceOnRequest')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Giá liên hệ<InfoTip size={12} text="Không hiện giá công khai — khách phải gọi/Zalo để hỏi giá. Thường dùng cho biển đắt, giá nhạy cảm." /></span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isHot} onChange={(e) => setF('isHot')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Biển HOT<InfoTip size={12} text="Đánh dấu biển đẹp/bán chạy để ưu tiên hiện lên đầu trang chủ và danh sách, gắn nhãn HOT." /></span>
          </label>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 240px' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mô tả</span>
            <textarea rows={2} placeholder="Mô tả ngắn về biển số" value={form.description} onChange={setF('description')}
              style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '10px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 240px' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ý nghĩa phong thủy</span>
            <textarea rows={2} placeholder="Phân tích phong thủy của biển" value={form.fengShuiMeaning} onChange={setF('fengShuiMeaning')}
              style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '10px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
          </label>
        </div>

        <GiftedPlateField value={form.giftedPlateNumber} onChange={setF('giftedPlateNumber')} excludeId={editDetail?.id} />

        {/* Images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
            Ảnh biển số
            {formErr.images && <span style={{ color: 'var(--status-danger)', font: 'var(--type-caption)' }}> — {formErr.images}</span>}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {editDetail?.id && (
              <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-inset-hairline)', background: 'var(--surface-sunken)' }}>
                {genPreviewLoading ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-caption)', color: 'var(--text-faint)' }}>…</div>
                ) : genPreviewUrl ? (
                  <button type="button" onClick={useGenPreviewAsCover} title="Bấm để dùng làm ảnh đại diện"
                    style={{ all: 'unset', display: 'block', width: '100%', height: '100%', cursor: 'pointer', position: 'relative' }}>
                    <img src={genPreviewUrl} alt="Ảnh sinh sẵn" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(genPreviewUrl); }} />
                    <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.55)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 9, textAlign: 'center', padding: '1px 0' }}>Ảnh sinh — bấm dùng</span>
                  </button>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'center', padding: 4 }}>Không sinh được</div>
                )}
              </div>
            )}
            {(form.images || []).map((url, i) => (
              <div key={url} style={{ position: 'relative', width: 72, height: 72, borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-inset-hairline)' }}>
                <img src={url} alt={`Ảnh ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => setPreviewImageUrl(url)} />
                {i === 0 && (
                  <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.55)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 10, textAlign: 'center', padding: '1px 0' }}>Đại diện</span>
                )}
                <button type="button" onClick={() => onRemoveImage(url)}
                  style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.55)', color: 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✕</button>
                <div style={{ position: 'absolute', top: 2, left: 2, display: 'flex', gap: 2 }}>
                  <button type="button" disabled={i === 0} aria-label="Chuyển ảnh lên trước" onClick={() => moveImage(i, -1)}
                    style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.55)', color: 'var(--white)', cursor: i === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, opacity: i === 0 ? 0.4 : 1 }}>‹</button>
                  <button type="button" disabled={i === (form.images || []).length - 1} aria-label="Chuyển ảnh xuống sau" onClick={() => moveImage(i, 1)}
                    style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.55)', color: 'var(--white)', cursor: i === (form.images || []).length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, opacity: i === (form.images || []).length - 1 ? 0.4 : 1 }}>›</button>
                </div>
              </div>
            ))}
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer?.files?.length) onUpload(e.dataTransfer.files); }}
              style={{ width: 72, height: 72, borderRadius: 'var(--radius-md)', border: '2px dashed var(--grey-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>
              {uploading ? '…' : '+ Ảnh'}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={fileRef} />
            </label>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Tối đa 8 ảnh, ≤5MB/ảnh. Ảnh đầu tiên là ảnh đại diện.</span>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: 1 }}>Xem trước</span>
          <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" onClick={onClose}>Hủy</Button>
          <Button variant="primary" size="md" onClick={onSave} disabled={saving || uploading}>
            {saving ? 'Đang lưu…' : 'Lưu biển số'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
