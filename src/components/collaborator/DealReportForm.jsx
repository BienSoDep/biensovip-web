import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@mantine/hooks';
import Button from '../Button.jsx';
import { Input, InfoTip } from '../index.jsx';
import { useSubmitDealReport, useUploadDealReportProof } from '../../services/collaborators.js';
import { usePlates } from '../../services/plates.js';

export default function DealReportForm() {
  const [open, setOpen] = useState(false);
  const [plateQuery, setPlateQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(plateQuery, 300);
  const [plate, setPlate] = useState(null);
  const [buyerFullName, setBuyerFullName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [dealAmount, setDealAmount] = useState('');
  const [note, setNote] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [proofPreview, setProofPreview] = useState('');
  const fileRef = useRef(null);
  const submitDeal = useSubmitDealReport();
  const uploadProof = useUploadDealReportProof();
  const { data: plateResults } = usePlates({ q: debouncedQuery, perPage: 8 }, { enabled: debouncedQuery.length >= 2 && !plate });

  const reset = () => {
    setPlate(null); setPlateQuery(''); setBuyerFullName(''); setBuyerPhone(''); setDealAmount(''); setNote('');
    setProofImageUrl(''); setProofPreview('');
  };

  const onPickProof = async (file) => {
    if (!file) return;
    setProofPreview(URL.createObjectURL(file));
    try {
      const res = await uploadProof.mutateAsync(file);
      setProofImageUrl(res.url);
    } catch (e) {
      toast.error(e.message || 'Tải ảnh thất bại, thử lại');
      setProofPreview('');
    }
  };

  const submit = async () => {
    if (!plate?.id) { toast.error('Chọn biển số'); return; }
    if (!buyerFullName.trim() || !buyerPhone.trim()) { toast.error('Nhập đầy đủ tên và SĐT khách'); return; }
    const amountNum = Number(dealAmount);
    if (!(amountNum > 0)) { toast.error('Số tiền phải lớn hơn 0'); return; }
    try {
      await submitDeal.mutateAsync({
        plateId: plate.id, buyerFullName: buyerFullName.trim(), buyerPhone: buyerPhone.trim(),
        dealAmount: amountNum, note: note.trim() || undefined, proofImageUrl: proofImageUrl || undefined,
      });
      toast.success('Đã gửi báo cáo, chờ admin duyệt');
      reset();
      setOpen(false);
    } catch (e) {
      toast.error(e.message || 'Gửi báo cáo thất bại');
    }
  };

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Báo cáo giao dịch ngoài nền tảng</span>
      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
        Đã tự chốt đơn với khách qua Zalo cá nhân (khách không bấm link giới thiệu)? Báo cáo lại đây để admin duyệt và vẫn được tính hoa hồng.
        Kèm ảnh chuyển khoản hoặc tin nhắn chốt đơn giúp admin đối chiếu nhanh, duyệt sớm hơn.
      </span>
      {!open ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} style={{ alignSelf: 'flex-start' }}>Báo cáo giao dịch</Button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {plate ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)' }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)' }}>{plate.plateNumber}</span>
              <button type="button" onClick={() => setPlate(null)} style={{ border: 'none', background: 'none', color: 'var(--action-primary)', cursor: 'pointer', font: 'var(--type-caption)' }}>Đổi</button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-label)', color: 'var(--text-strong)', marginBottom: 6 }}>
                Tìm biển số
                <InfoTip text="Chọn đúng biển khách đã mua — admin dùng để đối chiếu với biển đang đăng trên hệ thống." />
              </span>
              <Input placeholder="VD: 30A-123.45" value={plateQuery} onChange={(e) => setPlateQuery(e.target.value)} />
              {plateResults?.items?.length > 0 && (
                <div style={{ position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0, background: 'var(--white)', boxShadow: 'var(--shadow-4)', borderRadius: 'var(--radius-field)', maxHeight: 220, overflowY: 'auto' }}>
                  {plateResults.items.map((p) => (
                    <button key={p.id} type="button" onClick={() => { setPlate(p); setPlateQuery(''); }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-body-sm)' }}>
                      {p.plateNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Input label="Tên khách" value={buyerFullName} onChange={(e) => setBuyerFullName(e.target.value)} required />
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-label)', color: 'var(--text-strong)', marginBottom: 6 }}>
              Số điện thoại khách <span style={{ color: 'var(--status-danger)' }}>*</span>
              <InfoTip text="Admin có thể gọi xác minh lại với khách trước khi duyệt hoa hồng." />
            </span>
            <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
          </div>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-label)', color: 'var(--text-strong)', marginBottom: 6 }}>
              Số tiền đã chốt <span style={{ color: 'var(--status-danger)' }}>*</span>
              <InfoTip text="Nhập đúng số tiền khách đã trả — hoa hồng của bạn được tính theo % trên số này." />
            </span>
            <Input type="number" value={dealAmount} onChange={(e) => setDealAmount(e.target.value)} />
          </div>
          <Input label="Ghi chú (không bắt buộc)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-label)', color: 'var(--text-strong)', marginBottom: 6 }}>
              Ảnh minh chứng (không bắt buộc)
              <InfoTip text="Ảnh chuyển khoản hoặc chụp màn hình đoạn tin nhắn chốt đơn với khách — giúp admin đối chiếu và duyệt nhanh hơn." />
            </span>
            {proofPreview ? (
              <div style={{ position: 'relative', width: 140 }}>
                <img src={proofPreview} alt="Ảnh minh chứng" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 'var(--radius-field)' }} />
                {uploadProof.isPending && (
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.7)', borderRadius: 'var(--radius-field)', font: 'var(--type-caption)' }}>Đang tải…</span>
                )}
                <button type="button" onClick={() => { setProofImageUrl(''); setProofPreview(''); }}
                  style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--action-dark)', color: 'var(--white)', cursor: 'pointer', font: 'var(--type-caption)' }}>×</button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} style={{ alignSelf: 'flex-start' }}>Chọn ảnh</Button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onPickProof(e.target.files[0])} style={{ display: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => { setOpen(false); reset(); }}>Hủy</Button>
            <Button variant="primary" size="sm" disabled={submitDeal.isPending || uploadProof.isPending} onClick={submit}>
              {submitDeal.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
