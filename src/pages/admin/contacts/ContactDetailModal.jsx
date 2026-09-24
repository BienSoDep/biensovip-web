import { Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import InternalNotesPanel from '../../../components/InternalNotesPanel.jsx';
import { Badge, Select } from '../../../components/index.jsx';
import { formatDateTime } from '../../../lib/date.js';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { routeFor } from '../../../config/routes.js';
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
  return (
    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.fullName || ''} maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {selected && (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{INTENT_LABEL[selected.intent] || selected.intent}</span>
              {selected.source && <Badge tone="blue">{SOURCE_LABEL[selected.source] || selected.source}</Badge>}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Điện thoại</span>
              <a href={`tel:${selected.phone}`} style={{ font: 'var(--type-body)', color: 'var(--text-link)', textDecoration: 'none' }}>{selected.phone}</a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Biển quan tâm</span>
              {selected.plateNumber ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <PlateVisual size="sm" {...(parsePlateNumber(selected.plateNumber) || {})} />
                  {selected.plateId
                    ? <a href={routeFor('detail', selected.plateId)} target="_blank" rel="noreferrer" style={{ font: 'var(--type-body-sm)', color: 'var(--text-link)', textDecoration: 'none' }}>Xem biển {selected.plateNumber} →</a>
                    : <span style={{ font: 'var(--type-body)', color: 'var(--text-strong)' }}>{selected.plateNumber}</span>}
                </span>
              ) : (
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-faint)' }}>Khách hỏi chung, không có biển cụ thể</span>
              )}
            </div>

            {selected.plateId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Thanh toán ZaloPay</span>
                {selected.paymentLink?.paymentUrl ? (
                  <a href={selected.paymentLink.paymentUrl} target="_blank" rel="noreferrer" style={{ font: 'var(--type-body-sm)', color: 'var(--text-link)' }}>
                    Mở link đã tạo — gửi cho khách qua Zalo OA →
                  </a>
                ) : (
                  <Button variant="outline" size="sm" disabled={creatingLinkFor === selected.id} onClick={() => openLinkAmountPopup(selected)}>
                    {creatingLinkFor === selected.id ? 'Đang tạo…' : 'Tạo link ZaloPay'}
                  </Button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Giao dịch</span>
              {selected.transactionId ? (
                <Button variant="outline" size="sm" onClick={() => setViewingTx(selected)}>Xem giao dịch →</Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setUpgrading(selected)}>Tạo giao dịch từ liên hệ này</Button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Thùng rác</span>
              <Button variant="outline" size="sm" onClick={() => { setDeleteTarget(selected); setSelected(null); }}>Xóa liên hệ này</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Ghi chú yêu cầu</span>
              <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>
                {selected.note || <span style={{ color: 'var(--text-faint)' }}>Không có ghi chú</span>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Thời gian gửi</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{formatDateTime(selected.createdAt)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Trạng thái xử lý</span>
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
                  style={{ color: STATUS_COLOR[selected.status] || 'var(--text-strong)' }}
                />
              )}
            </div>

            <InternalNotesPanel entityType="contact_request" entityId={selected.id} notify={notify} />
          </>
        )}
      </div>
    </Modal>
  );
}
