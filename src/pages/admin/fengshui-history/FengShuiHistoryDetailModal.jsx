import { ExternalLink, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import { Badge } from '../../../components/index.jsx';
import { useAdminFengShuiHistoryDetail, useMarkFengShuiHistoryFollowedUp } from '../../../services/adminFengShuiHistory.js';
import { formatDateTime } from '../../../lib/date.js';

function scoreTone(tier) {
  if (!tier) return 'neutral';
  if (tier.includes('Cực Phẩm') || tier.includes('Đại Cát')) return 'mint';
  if (tier.includes('Cát')) return 'blue';
  if (tier.includes('Cải Thiện')) return 'rose';
  return 'amber';
}

function parseResultJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function FengShuiHistoryDetailModal({ id, onClose }) {
  const { data, isLoading } = useAdminFengShuiHistoryDetail(id);
  const markFollowedUp = useMarkFengShuiHistoryFollowedUp();

  const result = data ? parseResultJson(data.resultJson) : null;

  const toggleFollowedUp = () => {
    if (!data) return;
    markFollowedUp.mutate({ id: data.id, followedUp: !data.followedUp }, {
      onSuccess: () => toast.success(data.followedUp ? 'Đã bỏ đánh dấu' : 'Đã đánh dấu liên hệ'),
      onError: (e) => toast.error(e.message || 'Thao tác thất bại'),
    });
  };

  return (
    <Modal open={!!id} onClose={onClose} title="Chi tiết luận giải biển số" maxWidth="560px">
      {isLoading && (
        <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
          <Loader2 size={24} className="bsd-spin" />
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '0.04em' }}>
              {data.plateNumberRaw}
            </span>
            <Badge tone={scoreTone(data.scoreTier)}>{data.score} điểm · {data.scoreTier}</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', font: 'var(--type-body-sm)' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Khách hàng: </span>{data.fullName || 'Khách vãng lai'}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Tài khoản: </span>{data.hasUserAccount ? 'Đã đăng ký' : 'Chưa đăng ký'}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Mục đích: </span>{data.purpose || '—'}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Ngành nghề: </span>{data.industry || '—'}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Loại xe: </span>{data.vehicleType}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Mệnh: </span>{data.elementResult || '—'}</div>
            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Thời gian: </span>{formatDateTime(data.createdAt)}</div>
          </div>

          {result && (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: 'var(--space-3)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>Kết quả phân tích</div>
              {result.element && <div>Mệnh chủ: {result.element}</div>}
              {Array.isArray(result.improvementPoints) && result.improvementPoints.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {result.improvementPoints.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              )}
              {!result.improvementPoints && <div>{result.note || 'Không có gợi ý cải thiện bổ sung.'}</div>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-hairline)' }}>
            {data.matchedPlateId && (
              <a href={`/bien-so/${data.matchedPlateSlug}`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ExternalLink size={14} /> Xem biển trong kho
                </Button>
              </a>
            )}
            <Button
              variant={data.followedUp ? 'outline' : 'primary'}
              size="sm"
              disabled={markFollowedUp.isPending}
              onClick={toggleFollowedUp}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {data.followedUp ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
              {data.followedUp ? 'Bỏ đánh dấu đã liên hệ' : 'Đánh dấu đã liên hệ'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
