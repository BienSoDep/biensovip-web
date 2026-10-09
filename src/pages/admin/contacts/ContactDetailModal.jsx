import { useState } from 'react';
import { Loader2, Phone, MessageSquare, Copy, Check, Trash2, ExternalLink } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import InternalNotesPanel from '../../../components/InternalNotesPanel.jsx';
import { Badge, Select } from '../../../components/index.jsx';
import { formatDateTime } from '../../../lib/date.js';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { routeFor } from '../../../config/routes.js';
import { toZaloUrl } from '../../../lib/zaloMessage.js';
import {
  INTENT_LABEL,
  SOURCE_LABEL,
  STATUS_OPTS,
  STATUS_LABEL,
  STATUS_COLOR,
  STATUS_VAL,
} from './contactUtils.js';

export default function ContactDetailModal({
  selected,
  setSelected,
  updatingId,
  handleStatus,
  openLinkAmountPopup,
  creatingLinkFor,
  setViewingTx,
  setUpgrading,
  setDeleteTarget,
  notify,
}) {
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = (e) => {
    e.stopPropagation();
    if (!selected?.phone) return;
    navigator.clipboard.writeText(selected.phone);
    setCopiedPhone(true);
    notify?.({ type: 'success', message: `Đã sao chép: ${selected.phone}` });
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const zaloUrl = selected?.phone ? toZaloUrl(selected.phone) : null;

  return (
    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.fullName || 'Chi tiết liên hệ'} maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {selected && (
          <>
            {/* Header info & Tags */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Badge tone="blue">{INTENT_LABEL[selected.intent] || selected.intent || 'Liên hệ'}</Badge>
                {selected.source && <Badge tone="neutral">{SOURCE_LABEL[selected.source] || selected.source}</Badge>}
                {selected.assignedTo && <Badge tone="cyan">Phụ trách: {selected.assignedTo}</Badge>}
              </div>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDateTime(selected.createdAt)}</span>
            </div>

            {/* Quick Contact Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              padding: '12px 14px',
              background: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-field)',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 2 }}>Số điện thoại</div>
                <div style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selected.phone}
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    title="Sao chép SĐT"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 2,
                      cursor: 'pointer',
                      color: copiedPhone ? 'var(--intent-success)' : 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    {copiedPhone ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <a
                  href={`tel:${selected.phone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-field)',
                    background: 'var(--action-primary)',
                    color: '#fff',
                    font: 'var(--type-label)',
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={14} /> Gọi điện
                </a>
                {zaloUrl && (
                  <a
                    href={zaloUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-field)',
                      background: 'rgba(0, 104, 255, 0.12)',
                      color: '#0068ff',
                      font: 'var(--type-label)',
                      textDecoration: 'none'
                    }}
                  >
                    <MessageSquare size={14} /> Zalo
                  </a>
                )}
              </div>
            </div>

            {/* Trạng thái xử lý */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Trạng thái xử lý quy trình</span>
              {updatingId === selected.id ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                  <Loader2 size={16} className="bsd-spin" />
                  <span style={{ color: STATUS_COLOR[selected.status] || 'var(--text-strong)' }}>{STATUS_LABEL[selected.status] || selected.status}</span>
                </span>
              ) : (
                <Select
                  value={STATUS_LABEL[selected.status] || selected.status}
                  options={STATUS_OPTS.map((o) => ({ value: o, label: o }))}
                  onChange={(v) => { handleStatus(selected.id, v); setSelected((s) => ({ ...s, status: STATUS_VAL[v] })); }}
                  variant="pill"
                  style={{ color: STATUS_COLOR[selected.status] || 'var(--text-strong)', fontWeight: 600 }}
                />
              )}
            </div>

            {/* Biển quan tâm */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Biển số quan tâm</span>
              {selected.plateNumber ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <PlateVisual size="sm" {...(parsePlateNumber(selected.plateNumber) || {})} />
                    <span style={{ font: 'var(--type-title-sm)', color: 'var(--text-strong)' }}>{selected.plateNumber}</span>
                  </div>
                  {selected.plateId && (
                    <a href={routeFor('detail', selected.plateId)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: 'var(--type-body-sm)', color: 'var(--text-link)', textDecoration: 'none' }}>
                      Xem chi tiết biển <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              ) : (
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-faint)', fontStyle: 'italic' }}>Khách hỏi chung, chưa chỉ định biển số cụ thể</span>
              )}
            </div>

            {/* Ghi chú của khách */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Nội dung yêu cầu / Ghi chú</span>
              <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap', maxHeight: 120, overflowY: 'auto', border: '1px solid var(--border-subtle)' }}>
                {selected.note || <span style={{ color: 'var(--text-faint)' }}>Không có ghi chú từ khách hàng</span>}
              </div>
            </div>

            {/* Hành động liên quan: Link ZaloPay & Giao dịch */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {selected.plateId && (
                <div style={{ flex: '1 1 200px' }}>
                  {selected.paymentLink?.paymentUrl ? (
                    <a
                      href={selected.paymentLink.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        background: 'rgba(0, 104, 255, 0.1)',
                        border: '1px solid rgba(0, 104, 255, 0.25)',
                        borderRadius: 'var(--radius-field)',
                        color: 'var(--brand-primary)',
                        font: 'var(--type-label)',
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={14} /> Mở link ZaloPay đã tạo
                    </a>
                  ) : (
                    <Button variant="outline" size="sm" style={{ width: '100%' }} disabled={creatingLinkFor === selected.id} onClick={() => openLinkAmountPopup(selected)}>
                      {creatingLinkFor === selected.id ? 'Đang tạo link…' : 'Tạo link cọc ZaloPay'}
                    </Button>
                  )}
                </div>
              )}

              <div style={{ flex: '1 1 200px' }}>
                {selected.transactionId ? (
                  <Button variant="secondary" size="sm" style={{ width: '100%' }} onClick={() => setViewingTx(selected)}>
                    Xem giao dịch liên kết →
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" style={{ width: '100%' }} onClick={() => setUpgrading(selected)}>
                    Chuyển thành Giao dịch chính thức
                  </Button>
                )}
              </div>
            </div>

            {/* Trao đổi nội bộ */}
            <InternalNotesPanel entityType="contact_request" entityId={selected.id} notify={notify} />

            {/* Vùng nguy hiểm: Xóa liên hệ ở chân trang */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => { setDeleteTarget(selected); setSelected(null); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  color: 'var(--intent-danger)',
                  font: 'var(--type-caption)',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-field)'
                }}
              >
                <Trash2 size={13} /> Xóa liên hệ này
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
