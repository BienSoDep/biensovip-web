import { TriangleAlert } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import ConfirmBulkModal from '../../../components/ConfirmBulkModal.jsx';
import Button from '../../../components/Button.jsx';
import { DATA_ISSUE_LABELS } from './plateUtils.js';

export default function PlateBulkModals({
  // Single delete
  confirmDelete,
  setConfirmDelete,
  pendingCount,
  handleDelete,
  hideInsteadOfDelete,
  deleteMut,

  // Image preview
  previewImageUrl,
  setPreviewImageUrl,

  // Missing info modal
  missingInfoPlates,
  closeMissingInfoModal,
  infoProgress,
  selectedInfoIds,
  setSelectedInfoIds,
  toggleInfoSelected,
  confirmBulkSeedInfo,

  // Missing image modal
  missingImagePlates,
  closeMissingImageModal,
  genProgress,
  selectedGenIds,
  setSelectedGenIds,
  toggleGenSelected,
  confirmBulkGenerateImages,

  // Purge image modal
  generatedImagePlates,
  closePurgeImageModal,
  purgeProgress,
  selectedPurgeIds,
  setSelectedPurgeIds,
  togglePurgeSelected,
  confirmPurgeGeneratedImages,

  // Bulk delete
  confirmBulkDelete,
  setConfirmBulkDelete,
  bulkDelete,
  selectedCount,
}) {
  return (
    <>
      {/* Confirm delete — shared Modal, blocks hard delete while contacts pending */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Xác nhận xóa" maxWidth="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {pendingCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
              padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
              background: 'var(--amber-100)', color: 'var(--status-warning-ink)', font: 'var(--type-body-sm)',
            }}>
              <span aria-hidden style={{ display: 'inline-flex' }}><TriangleAlert size={16} /></span>
              <span>Biển này đang có <b>{pendingCount}</b> yêu cầu chưa xử lý. Hãy <b>Ẩn thay vì xóa</b> để giữ lịch sử giao dịch.</span>
            </div>
          )}
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Biển số này sẽ được ẩn khỏi hệ thống. Bạn có thể khôi phục lại sau nếu cần.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="md" onClick={() => setConfirmDelete(null)}>Hủy</Button>
            {pendingCount > 0 ? (
              <Button variant="ghost" size="md" onClick={hideInsteadOfDelete}>Ẩn thay vì xóa</Button>
            ) : (
              <Button variant="danger" size="md" onClick={handleDelete} loading={deleteMut.isPending}>Xóa</Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Preview ảnh phóng to — bấm vào ảnh bất kỳ trong form sửa biển */}
      <Modal open={!!previewImageUrl} onClose={() => setPreviewImageUrl(null)} title="Xem ảnh" maxWidth="640px">
        {previewImageUrl && (
          <img src={previewImageUrl} alt="Xem trước" style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-md)', display: 'block' }} />
        )}
      </Modal>

      {/* Sinh thông tin hàng loạt */}
      <Modal open={missingInfoPlates !== null} onClose={closeMissingInfoModal} title="Sinh thông tin hàng loạt" maxWidth="520px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {missingInfoPlates?.length ? (
            <>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                <b>{missingInfoPlates.length}</b> biển đang thiếu ít nhất 1 trong 3: ý nghĩa phong thủy, ảnh đại diện, mô tả ngắn. Bấm sinh để hệ thống tự điền phần còn thiếu — biển không khớp mẫu ý nghĩa nào (số thường) chỉ được sinh ảnh + mô tả.
              </p>
              {!infoProgress && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đã chọn {selectedInfoIds.size}/{missingInfoPlates.length}</span>
                  <button type="button" onClick={() => setSelectedInfoIds(new Set(missingInfoPlates.map((p) => p.id)))} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Chọn tất cả</button>
                  <button type="button" onClick={() => setSelectedInfoIds(new Set())} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Bỏ chọn hết</button>
                </div>
              )}
              {infoProgress && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(infoProgress.done / infoProgress.total) * 100}%`, background: 'var(--action-primary)', transition: 'width 150ms var(--ease-out)' }} />
                  </div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Đã xử lý {infoProgress.done}/{infoProgress.total}{infoProgress.errors.length ? ` — ${infoProgress.errors.length} lỗi` : ''}
                  </span>
                </div>
              )}
              <div style={{ maxHeight: 260, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                {missingInfoPlates.map((p) => {
                  const runList = infoProgress ? missingInfoPlates.filter((x) => selectedInfoIds.has(x.id)) : null;
                  const runIdx = runList ? runList.findIndex((x) => x.id === p.id) : -1;
                  const inRun = runIdx >= 0;
                  const done = infoProgress && inRun && runIdx < infoProgress.done;
                  const failed = infoProgress?.errors.includes(p.plateNumber);
                  const selected = selectedInfoIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      role={infoProgress ? undefined : 'button'}
                      tabIndex={infoProgress ? undefined : 0}
                      onClick={infoProgress ? undefined : () => toggleInfoSelected(p.id)}
                      onKeyDown={infoProgress ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleInfoSelected(p.id); } }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', cursor: infoProgress ? 'default' : 'pointer',
                        borderRadius: 'var(--radius-sm)', padding: '2px 4px',
                        border: !infoProgress && !selected ? '1px dashed var(--grey-300)' : '1px solid transparent',
                        opacity: !infoProgress && !selected ? 0.5 : 1,
                      }}
                    >
                      <span style={{
                        font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                        background: failed ? 'var(--status-danger-bg)' : done ? 'var(--status-success-bg)' : 'var(--white)',
                        color: failed ? 'var(--status-danger)' : done ? 'var(--status-success)' : 'var(--text-strong)',
                      }}>
                        {p.plateNumber}
                      </span>
                      {p.missing.map((code) => (
                        <span key={code} style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{DATA_ISSUE_LABELS[code] || code}</span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Mọi biển đã đủ ý nghĩa, ảnh và mô tả.</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="md" onClick={closeMissingInfoModal}>{infoProgress ? 'Đóng' : 'Hủy'}</Button>
            {!!missingInfoPlates?.length && !infoProgress && (
              <Button variant="primary" size="md" disabled={selectedInfoIds.size === 0} onClick={confirmBulkSeedInfo}>
                Sinh thông tin cho {selectedInfoIds.size} biển
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Sinh ảnh hàng loạt */}
      <Modal open={missingImagePlates !== null} onClose={closeMissingImageModal} title="Sinh ảnh hàng loạt" maxWidth="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {missingImagePlates?.length ? (
            <>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                <b>{missingImagePlates.length}</b> biển chưa có ảnh. Hệ thống sẽ tự vẽ ảnh biển số làm ảnh đại diện tạm, có thể thay bằng ảnh thật sau.
              </p>
              {!genProgress && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đã chọn {selectedGenIds.size}/{missingImagePlates.length}</span>
                  <button type="button" onClick={() => setSelectedGenIds(new Set(missingImagePlates.map((p) => p.id)))} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Chọn tất cả</button>
                  <button type="button" onClick={() => setSelectedGenIds(new Set())} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Bỏ chọn hết</button>
                </div>
              )}
              {genProgress && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(genProgress.done / genProgress.total) * 100}%`, background: 'var(--action-primary)', transition: 'width 150ms var(--ease-out)' }} />
                  </div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Đã sinh {genProgress.done}/{genProgress.total}{genProgress.errors.length ? ` — ${genProgress.errors.length} lỗi` : ''}
                  </span>
                </div>
              )}
              <div style={{ maxHeight: 220, overflow: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                {missingImagePlates.map((p) => {
                  const runList = genProgress ? missingImagePlates.filter((x) => selectedGenIds.has(x.id)) : null;
                  const runIdx = runList ? runList.findIndex((x) => x.id === p.id) : -1;
                  const inRun = runIdx >= 0;
                  const done = genProgress && inRun && runIdx < genProgress.done;
                  const failed = genProgress?.errors.includes(p.plateNumber);
                  const selected = selectedGenIds.has(p.id);
                  return (
                    <span
                      key={p.id}
                      role={genProgress ? undefined : 'button'}
                      tabIndex={genProgress ? undefined : 0}
                      onClick={genProgress ? undefined : () => toggleGenSelected(p.id)}
                      onKeyDown={genProgress ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGenSelected(p.id); } }}
                      style={{
                        font: 'var(--type-caption)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', cursor: genProgress ? 'default' : 'pointer',
                        border: !genProgress && !selected ? '1px dashed var(--grey-300)' : '1px solid transparent',
                        opacity: !genProgress && !selected ? 0.5 : 1,
                        background: failed ? 'var(--status-danger-bg)' : done ? 'var(--status-success-bg)' : 'var(--white)',
                        color: failed ? 'var(--status-danger)' : done ? 'var(--status-success)' : 'var(--text-strong)',
                      }}
                    >
                      {p.plateNumber}
                    </span>
                  );
                })}
              </div>
            </>
          ) : (
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Mọi biển đã có ảnh.</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="md" onClick={closeMissingImageModal}>{genProgress ? 'Đóng' : 'Hủy'}</Button>
            {!!missingImagePlates?.length && !genProgress && (
              <Button variant="primary" size="md" disabled={selectedGenIds.size === 0} onClick={confirmBulkGenerateImages}>
                Sinh ảnh cho {selectedGenIds.size} biển
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Xóa ảnh sinh cũ */}
      <Modal open={generatedImagePlates !== null} onClose={closePurgeImageModal} title="Xóa ảnh sinh cũ" maxWidth="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {generatedImagePlates?.length ? (
            <>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                <b>{generatedImagePlates.length}</b> biển đang dùng ảnh do hệ thống tự vẽ. Xóa xong dùng &quot;Sinh ảnh hàng loạt&quot; để tạo lại bằng renderer mới (đã fix font). Ảnh admin upload tay không bị đụng.
              </p>
              {!purgeProgress && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đã chọn {selectedPurgeIds.size}/{generatedImagePlates.length}</span>
                  <button type="button" onClick={() => setSelectedPurgeIds(new Set(generatedImagePlates.map((p) => p.id)))} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Chọn tất cả</button>
                  <button type="button" onClick={() => setSelectedPurgeIds(new Set())} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Bỏ chọn hết</button>
                </div>
              )}
              {purgeProgress && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(purgeProgress.done / purgeProgress.total) * 100}%`, background: 'var(--action-primary)', transition: 'width 150ms var(--ease-out)' }} />
                  </div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Đã xóa {purgeProgress.done}/{purgeProgress.total}{purgeProgress.errors.length ? ` — ${purgeProgress.errors.length} lỗi` : ''}
                  </span>
                </div>
              )}
              <div style={{ maxHeight: 220, overflow: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                {generatedImagePlates.map((p) => {
                  const runList = purgeProgress ? generatedImagePlates.filter((x) => selectedPurgeIds.has(x.id)) : null;
                  const runIdx = runList ? runList.findIndex((x) => x.id === p.id) : -1;
                  const inRun = runIdx >= 0;
                  const done = purgeProgress && inRun && runIdx < purgeProgress.done;
                  const failed = purgeProgress?.errors.includes(p.plateNumber);
                  const selected = selectedPurgeIds.has(p.id);
                  return (
                    <span
                      key={p.id}
                      role={purgeProgress ? undefined : 'button'}
                      tabIndex={purgeProgress ? undefined : 0}
                      onClick={purgeProgress ? undefined : () => togglePurgeSelected(p.id)}
                      onKeyDown={purgeProgress ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePurgeSelected(p.id); } }}
                      style={{
                        font: 'var(--type-caption)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', cursor: purgeProgress ? 'default' : 'pointer',
                        border: !purgeProgress && !selected ? '1px dashed var(--grey-300)' : '1px solid transparent',
                        opacity: !purgeProgress && !selected ? 0.5 : 1,
                        background: failed ? 'var(--status-danger-bg)' : done ? 'var(--status-success-bg)' : 'var(--white)',
                        color: failed ? 'var(--status-danger)' : done ? 'var(--status-success)' : 'var(--text-strong)',
                      }}
                    >
                      {p.plateNumber}
                    </span>
                  );
                })}
              </div>
            </>
          ) : (
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có ảnh sinh tự động nào.</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="md" onClick={closePurgeImageModal}>{purgeProgress ? 'Đóng' : 'Hủy'}</Button>
            {!!generatedImagePlates?.length && !purgeProgress && (
              <Button variant="danger" size="md" disabled={selectedPurgeIds.size === 0} onClick={confirmPurgeGeneratedImages}>
                Xóa ảnh cho {selectedPurgeIds.size} biển
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmBulkModal
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={bulkDelete}
        count={selectedCount}
        actionLabel="xóa"
        itemLabel="biển số"
        danger
        loading={deleteMut.isPending}
      />
    </>
  );
}
