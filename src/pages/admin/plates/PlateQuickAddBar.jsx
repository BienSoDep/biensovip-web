import { Copy } from 'lucide-react';
import Button from '../../../components/Button.jsx';
import Modal from '../../../components/Modal.jsx';
import { Select, Checkbox } from '../../../components/index.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { fmt } from './plateUtils.js';

export default function PlateQuickAddBar({
  quickNum,
  setQuickNum,
  quickPrice,
  setQuickPrice,
  quickStatus,
  setQuickStatus,
  quickVehicleTypeId,
  setQuickVehicleTypeId,
  defaultQuickVehicleTypeId,
  quickAdd,
  bulkMut,
  bulkOpen,
  setBulkOpen,
  bulkText,
  onBulkTextChange,
  bulkRows,
  bulkView,
  setBulkView,
  editBulkRow,
  submitBulk,
  promptModalOpen,
  setPromptModalOpen,
  promptFields,
  setPromptFields,
  copyImportPrompt,
  vehicleTypes,
  plateTypes,
  provinces,
}) {
  const inputCell = (v, setV, ph) => (
    <input
      value={v}
      placeholder={ph}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
      style={{
        height: 36, minWidth: 0, border: 'none', borderRadius: 'var(--radius-field)',
        background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)',
        padding: '0 12px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none', flex: '1 1 150px',
      }}
    />
  );

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
      padding: 'var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', flex: '0 0 auto' }}>Thêm nhanh</span>
        {inputCell(quickNum, setQuickNum, '43A1-999.99')}
        {inputCell(quickPrice, setQuickPrice, 'Giá (VNĐ)')}
        <Select
          value={quickStatus}
          options={[{ value: 'available', label: 'Còn hàng' }, { value: 'sold', label: 'Đã bán' }]}
          onChange={setQuickStatus}
        />
        <Select
          value={quickVehicleTypeId || defaultQuickVehicleTypeId}
          options={vehicleTypes}
          onChange={setQuickVehicleTypeId}
        />
        <Button variant="primary" size="md" onClick={quickAdd} disabled={bulkMut.isPending}>
          {bulkMut.isPending ? 'Đang thêm…' : 'Thêm'}
        </Button>
        <Button variant="ghost" size="md" onClick={() => setBulkOpen(!bulkOpen)}>
          {bulkOpen ? 'Đóng dán nhiều' : 'Dán nhiều / CSV'}
        </Button>
        <Button variant="ghost" size="md" onClick={() => setPromptModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Copy size={14} /> Copy prompt import từ Excel/PDF
        </Button>
      </div>

      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
        Nhập biển số, giá, trạng thái (bắt buộc) rồi bấm Thêm. Loại xe mặc định Xe máy — đổi tay nếu cần. Hệ thống tự nhận tỉnh từ số biển. Dán nhiều hỗ trợ thêm cột 3 &quot;đã bán&quot;, cột 4 &quot;ô tô&quot;/&quot;xe máy&quot; (ghi đè khi hệ thống đoán sai), cột 5 biển số tặng kèm (VD ô tô tặng biển xe máy). Có file Excel/PDF danh sách biển? Bấm &quot;Copy prompt&quot; rồi dán vào ChatGPT/Claude kèm file — AI tự xuất sẵn format dán vào đây.
      </span>

      {/* Copy Prompt Modal */}
      <Modal open={promptModalOpen} onClose={() => setPromptModalOpen(false)} title="Copy prompt import từ Excel/PDF" maxWidth="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Tick đúng các cột file Excel/PDF của bạn ĐANG CÓ — prompt sẽ chỉ dặn AI xử lý đúng những cột đó, tránh AI tự suy đoán sai cột không tồn tại.
          </p>
          <Checkbox label="Giá bán" checked={promptFields.hasPrice} onChange={(v) => setPromptFields((f) => ({ ...f, hasPrice: !!v }))} />
          <Checkbox label="Tình trạng (đã bán / còn hàng)" checked={promptFields.hasStatus} onChange={(v) => setPromptFields((f) => ({ ...f, hasStatus: !!v }))} />
          <Checkbox label="Ghi chú (chỉ đọc tham khảo, không đưa vào output)" checked={promptFields.hasNote} onChange={(v) => setPromptFields((f) => ({ ...f, hasNote: !!v }))} />
          <Checkbox label="Biển số tặng kèm (VD ô tô tặng biển xe máy)" checked={promptFields.hasGifted} onChange={(v) => setPromptFields((f) => ({ ...f, hasGifted: !!v }))} />
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: 'var(--space-3)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Cấu trúc cột output: Số biển
            {promptFields.hasGifted ? ', Giá, Tình trạng, (trống), Biển tặng kèm'
              : promptFields.hasStatus ? ', Giá, Tình trạng'
              : promptFields.hasPrice ? ', Giá'
              : ' (chỉ 1 cột)'}
          </div>
          <Button variant="primary" size="md" onClick={copyImportPrompt} style={{ alignSelf: 'flex-start' }}>Copy prompt</Button>
        </div>
      </Modal>

      {/* Bulk Paste Area */}
      {bulkOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <textarea
            value={bulkText}
            onChange={(e) => onBulkTextChange(e.target.value)}
            rows={5}
            placeholder={'Mỗi dòng 1 biển, cách nhau bằng dấu phẩy / tab:\n43A1-999.99, 350000000\n43A1-666.66, 500000000\n43A1-777.77 (bỏ trống giá = Giá liên hệ)\n43A1-555.55, 45000000, đã bán (nhập lại biển đã bán trước đây)\n43AB-668.88, 39000000, , xe máy (cột 4 ghi rõ loại xe nếu hệ thống đoán sai từ seri)'}
            style={{
              background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)',
              borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body-sm)',
              color: 'var(--text-strong)', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-mono)',
            }}
          />
          {bulkRows.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant={bulkView === 'list' ? 'dark' : 'ghost'} size="sm" onClick={() => setBulkView('list')}>Danh sách</Button>
                <Button variant={bulkView === 'card' ? 'dark' : 'ghost'} size="sm" onClick={() => setBulkView('card')}>Xem biển (UI đầy đủ)</Button>
              </div>

              {bulkView === 'list' ? (
                <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ minWidth: 900 }}>
                      <div style={{
                        display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2) var(--gutter-card)',
                        font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em',
                        textTransform: 'uppercase', color: 'var(--text-muted)',
                      }}>
                        <span style={{ flex: '1 1 120px' }}>Biển số</span>
                        <span style={{ flex: '1 1 88px' }}>Loại biển</span>
                        <span style={{ flex: '1 1 88px' }}>Loại xe</span>
                        <span style={{ flex: '1 1 88px' }}>Tỉnh</span>
                        <span style={{ flex: '1 1 110px' }}>Giá</span>
                        <span style={{ flex: '1 1 100px' }}>Trạng thái</span>
                        <span style={{ flex: '0 0 96px' }}>Kết quả</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflow: 'auto' }}>
                        {bulkRows.map((r) => (
                          <div
                            key={r.key}
                            style={{
                              display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: '4px var(--gutter-card)',
                              borderRadius: 'var(--radius-sm)',
                              background: r.done ? (r.ok ? 'var(--mint-100)' : 'var(--rose-100)') : 'transparent',
                              font: 'var(--type-body-sm)',
                            }}
                          >
                            <span style={{ color: 'var(--text-strong)', flex: '1 1 120px' }}>{r.number || '—'}</span>
                            <select
                              value={r.plateTypeId || ''}
                              disabled={r.done}
                              onChange={(e) => editBulkRow(r.key, 'plateTypeId', e.target.value)}
                              style={{ flex: '1 1 88px', height: 28, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: r.plateTypeId ? 'var(--text-strong)' : 'var(--status-danger)' }}
                            >
                              <option value="">— Loại? —</option>
                              {plateTypes.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            <select
                              value={r.vehicleTypeId || ''}
                              disabled={r.done}
                              onChange={(e) => editBulkRow(r.key, 'vehicleTypeId', e.target.value)}
                              style={{ flex: '1 1 88px', height: 28, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: r.vehicleTypeId ? 'var(--text-strong)' : 'var(--status-danger)' }}
                            >
                              <option value="">— Xe? —</option>
                              {vehicleTypes.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                            </select>
                            <select
                              value={r.provinceId || ''}
                              disabled={r.done}
                              onChange={(e) => editBulkRow(r.key, 'provinceId', e.target.value)}
                              style={{ flex: '1 1 88px', height: 28, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: r.provinceId ? 'var(--text-strong)' : 'var(--status-danger)' }}
                            >
                              <option value="">— Tỉnh? —</option>
                              {provinces.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            <span style={{ color: 'var(--text-muted)', flex: '1 1 110px' }}>{r.priceOnRequest ? 'Liên hệ' : fmt(r.price)}</span>
                            <span style={{ flex: '1 1 100px', color: r.sold ? 'var(--status-danger)' : 'var(--text-muted)' }}>{r.sold ? 'Đã bán' : 'Còn hàng'}</span>
                            <span style={{ color: r.ok ? 'var(--status-success-ink)' : 'var(--status-danger)', flex: '0 0 96px', textAlign: 'right', font: 'var(--type-caption)' }}>
                              {r.done ? (r.ok ? '✓ Đã thêm' : `✗ ${r.reason}`) : (r.ok ? 'Sẵn sàng' : r.reason || 'Bỏ trống')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {bulkRows.some((r) => !r.ok) && (
                    <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>
                      {bulkRows.filter((r) => !r.ok).length} dòng lỗi định dạng không hiện ở đây — xem &quot;Danh sách&quot; để sửa.
                    </span>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)', maxHeight: 560, overflow: 'auto', padding: 8 }}>
                    {bulkRows.filter((r) => r.ok).map((r) => {
                      const { prov, seri, num: plateNum } = parsePlateNumber(r.number);
                      return (
                        <div key={r.key} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 12 }}>
                          <PlateVisual size="md" prov={prov} seri={seri} num={plateNum} shape="short" />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px' }}>
                            <select
                              value={r.plateTypeId || ''}
                              disabled={r.done}
                              onChange={(e) => editBulkRow(r.key, 'plateTypeId', e.target.value)}
                              style={{ height: 26, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: r.plateTypeId ? 'var(--text-strong)' : 'var(--status-danger)' }}
                            >
                              <option value="">— Loại biển? —</option>
                              {plateTypes.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            <select
                              value={r.provinceId || ''}
                              disabled={r.done}
                              onChange={(e) => editBulkRow(r.key, 'provinceId', e.target.value)}
                              style={{ height: 26, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: r.provinceId ? 'var(--text-strong)' : 'var(--status-danger)' }}
                            >
                              <option value="">— Tỉnh? —</option>
                              {provinces.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                              {r.priceOnRequest ? 'Liên hệ' : fmt(r.price)}
                            </span>
                            <span style={{ font: 'var(--type-caption)', color: r.done ? (r.ok ? 'var(--status-success-ink)' : 'var(--status-danger)') : 'var(--text-muted)' }}>
                              {r.sold ? 'Đã bán · ' : ''}{r.done ? (r.ok ? '✓ Đã thêm' : `✗ ${r.reason}`) : 'Sẵn sàng'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button
              variant="primary"
              size="md"
              onClick={submitBulk}
              disabled={bulkMut.isPending || bulkRows.filter((r) => r.ok && !r.done).length === 0}
            >
              {bulkMut.isPending ? 'Đang thêm…' : `Thêm ${bulkRows.filter((r) => r.ok && !r.done).length} biển hợp lệ`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
