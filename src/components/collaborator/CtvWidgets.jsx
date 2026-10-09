import { useState } from 'react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Button from '../Button.jsx';
import { InfoTip } from '../index.jsx';
import PlateVisual from '../PlateVisual.jsx';
import { useHotPlates, useClickStats, useSetLeaderboardVisibility, useTopPlates } from '../../services/collaborators.js';
import { buildCtvPlateInviteMessage } from '../../lib/zaloMessage.js';
import { splitPlateNumber, formatPrice } from '../../lib/plateFormat.js';
import { routeFor } from '../../config/routes.js';
import { CLICK_SOURCE_LABEL, CLICK_RANGE_OPTS } from './collaboratorConstants.js';
import { fallbackCopy } from './collaboratorUtils.js';

export function HotPlatesWidget({ referralUrl }) {
  const { data, isLoading } = useHotPlates(5);
  const items = data || [];
  const [copiedId, setCopiedId] = useState(null);

  const copyForPlate = (p) => {
    const message = buildCtvPlateInviteMessage({ plateNumber: p.plateNumber, referralUrl });
    const onOk = () => { setCopiedId(p.plateId); setTimeout(() => setCopiedId(null), 2000); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(message).then(onOk).catch(() => fallbackCopy(message, onOk));
    } else {
      fallbackCopy(message, onOk);
    }
  };

  if (isLoading || items.length === 0) return null;

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Biển đang được quan tâm</span>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Ưu tiên giới thiệu các biển này — khách đang hỏi nhiều nhất.</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 'var(--gutter-section)' }}>
        {items.map((p) => {
          const sp = splitPlateNumber(p.plateNumber);
          return (
            <div key={p.plateId} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <PlateVisual size="sm" prov={sp.prov} seri={sp.seri} num={sp.num} />
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{p.plateNumber}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{formatPrice(p.price)}</span>
              {p.pendingContactCount > 0 && (
                <span style={{ font: 'var(--type-caption)', color: 'var(--status-warning)' }}>{p.pendingContactCount} khách đang hỏi</span>
              )}
              <Button variant="outline" size="sm" onClick={() => copyForPlate(p)}>{copiedId === p.plateId ? 'Đã sao chép' : 'Copy link biển này'}</Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClickTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-3)', padding: '8px 12px' }}>
      <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{label}</span>
      <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{payload[0].value} lượt click</span>
    </div>
  );
}

export function ClickStatsSection() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useClickStats(days);
  const byDay = data?.byDay || [];
  const bySource = data?.bySource || [];
  const totalSource = bySource.reduce((s, x) => s + x.count, 0);
  const totalClicks = byDay.reduce((s, x) => s + x.count, 0);

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Lượt click
            <InfoTip text="Biểu đồ số lần khách bấm link/mã giới thiệu của bạn theo ngày. Nguồn (Zalo, Facebook, trực tiếp…) tính theo nơi khách bấm vào." />
          </span>
          {!isLoading && totalClicks > 0 && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{totalClicks} lượt trong {days} ngày</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-xs)' }}>
          {CLICK_RANGE_OPTS.map((o) => (
            <button key={o.value} type="button" onClick={() => setDays(o.value)}
              style={{ height: 28, padding: '0 12px', border: 'none', borderRadius: 'var(--radius-xs)', cursor: 'pointer', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)',
                background: days === o.value ? 'var(--action-primary)' : 'transparent', color: days === o.value ? 'var(--white)' : 'var(--text-muted)' }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div style={{ height: 180 }} />
      ) : byDay.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', height: 180, textAlign: 'center' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có lượt click nào trong {days} ngày — chia sẻ link giới thiệu để bắt đầu theo dõi.</span>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byDay.map((d) => ({ date: d.date.slice(5), count: d.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={days > 30 ? Math.ceil(days / 15) : 'preserveStartEnd'} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<ClickTooltip />} />
              <Line type="monotone" dataKey="count" name="Lượt click" stroke="var(--action-primary)" strokeWidth={2} dot={byDay.length <= 31} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          {totalSource > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              {bySource.map((s) => (
                <div key={s.source} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 90 }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{CLICK_SOURCE_LABEL[s.source] || s.source}</span>
                  <div style={{ height: 6, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((s.count / totalSource) * 100)}%`, background: 'var(--action-primary)' }} />
                  </div>
                  <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{s.count} ({Math.round((s.count / totalSource) * 100)}%)</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function LeaderboardVisibilityToggle({ go }) {
  const setVisibility = useSetLeaderboardVisibility();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      <a href={routeFor('collabLeaderboard')} onClick={(e) => { e.preventDefault(); go('collabLeaderboard')(); }} style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Xem bảng xếp hạng →</a>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <input type="checkbox" onChange={(e) => setVisibility.mutate(e.target.checked, { onError: (err) => toast.error(err.message || 'Cập nhật thất bại') })} />
        Hiện tên trên bảng xếp hạng
      </label>
    </div>
  );
}

export function TopReferredPlates() {
  const { data, isLoading } = useTopPlates(5);
  const items = data || [];
  if (isLoading || items.length === 0) return null;
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Biển hay giới thiệu nhất</span>
      {items.map((p) => (
        <div key={p.plateId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--grey-100)' }}>
          <span style={{ font: 'var(--type-body-sm)' }}>{p.plateNumber}</span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{p.clickCount} lượt click</span>
        </div>
      ))}
    </div>
  );
}
