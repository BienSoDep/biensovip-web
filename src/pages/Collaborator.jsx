import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useDebouncedValue } from '@mantine/hooks';
import { Share2, Link2, HandCoins, Wallet, UserPlus, BarChart3 as BarChartIcon, Mail, FileWarning, Users, QrCode, Bell, Trophy, MessageSquareText, TrendingUp, Download, Flame, ArrowRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Button from '../components/Button.jsx';
import { Badge, Input, Select, InfoTip } from '../components/index.jsx';
import { useBecomeCollaborator, useUpdateBankInfo, useUpdateMessagingProfile, useCollaboratorDashboard, useCollaboratorCustomers, useCollaboratorContacts, useCollaboratorMessageTemplates, useCollaboratorBenefitContent, useSubmitDealReport, useUploadDealReportProof, useHotPlates, useLeaderboard, useSetLeaderboardVisibility, useClickStats, useTopPlates, useAllCommissions } from '../services/collaborators.js';
import { usePlates } from '../services/plates.js';
import { useCollaboratorLogout } from '../services/collaboratorAuth.js';
import { loadAuth } from '../lib/authStore.js';
import { refreshToken, requestEmailVerifyOtp, confirmEmailVerifyOtp } from '../services/authService.js';
import { fetchVietQrBanks, vietQrImageUrl } from '../lib/vietqr.js';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { useGmailStatus, useGmailOAuthUrl, useUnlinkGmail } from '../services/gmailLink.js';
import { SkeletonCard } from '../components/Skeleton.jsx';
import CounterStat from '../components/CounterStat.jsx';
import CollaboratorIllustration from '../components/CollaboratorIllustration.jsx';
import { routeFor } from '../config/routes.js';
import { buildCtvInviteMessage, buildCtvPlateInviteMessage } from '../lib/zaloMessage.js';
import PlateVisual from '../components/PlateVisual.jsx';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { useExportCsv } from '../hooks/useExportCsv.js';

// Số liệu minh họa — CHƯA có API thống kê public tổng CTV/hoa hồng đã trả, dùng số tĩnh tạm.
// TODO: thay bằng API thật khi backend có endpoint /api/collaborators/stats.
const STATS = [
  { icon: UserPlus, value: 50, suffix: '+', label: 'CTV đang hoạt động' },
  { icon: Wallet, value: 100, suffix: 'tr+', label: 'Đã chi trả hoa hồng' },
  { icon: HandCoins, value: 5, suffix: '%', label: 'Hoa hồng mặc định' },
];

const STEP_ICONS = [UserPlus, Share2, Link2, HandCoins];

// Mốc trượt tiêu biểu — từ cọc nhỏ tới biển tiền tỷ, người xem thấy ngay hoa hồng tăng theo giá trị thật.
const CALC_STEPS = [3_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000, 100_000_000, 300_000_000];
const CALC_RATE = 0.05;

// Máy tính hoa hồng — biến "nhận % hoa hồng" trừu tượng thành con số cụ thể ngay trong hero,
// kéo trượt số tiền khách đặt cọc để thấy hoa hồng đổi theo thời gian thực (không gọi API, tính tại chỗ).
function CommissionCalculator() {
  const [step, setStep] = useState(2);
  const deposit = CALC_STEPS[step];
  const commission = Math.round(deposit * CALC_RATE);

  return (
    <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <HandCoins size={16} color="var(--action-primary)" /> Thử tính hoa hồng của bạn
      </span>
      <input
        type="range" min={0} max={CALC_STEPS.length - 1} step={1} value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        aria-label="Chọn số tiền khách đặt cọc"
        className="ctv-calc-slider"
      />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Khách đặt cọc</span>
          <span style={{ display: 'block', font: 'var(--type-title-2)', color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>{money(deposit)}</span>
        </div>
        <ArrowRight size={20} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        <div>
          <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bạn nhận (5%)</span>
          <motion.span
            key={commission}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'block', font: 'var(--type-display-3)', color: 'var(--action-primary)', fontVariantNumeric: 'tabular-nums' }}
          >
            {money(commission)}
          </motion.span>
        </div>
      </div>
    </div>
  );
}

const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

// Fallback copy cho trình duyệt không có Clipboard API (HTTP không HTTPS).
function fallbackCopy(text, onOk) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) onOk();
  } catch { /* không hỗ trợ — bỏ qua */ }
}

// UC30 — liên kết/hủy liên kết Gmail cá nhân để gửi email cho khách.
// Chỉ hiện khi CTV đăng nhập bằng JWT (loadAuth có token).
function GmailLinkSection() {
  const isLoggedIn = Boolean(loadAuth()?.accessToken);
  const { data: status, isLoading } = useGmailStatus();
  const oauthUrl = useGmailOAuthUrl();
  const unlink = useUnlinkGmail();

  if (!isLoggedIn) {
    return (
      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-5) var(--gutter-card)' }}>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Đăng nhập bằng tài khoản CTV để liên kết Gmail gửi email cho khách.
        </span>
      </div>
    );
  }

  const startLink = () => {
    oauthUrl.mutate(undefined, {
      onSuccess: (data) => { window.location.href = data.url; },
      onError: (err) => toast.error(err.message || 'Không lấy được link liên kết Google, thử lại.'),
    });
  };

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Liên kết Gmail để gửi email</span>
      {isLoading ? (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>
      ) : status?.linked ? (
        <>
          {status.needsRelink && (
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-field)', background: 'var(--status-warning-bg, #FFF7ED)', border: '1px solid var(--status-warning, #F59E0B)' }}>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-warning-ink, #B45309)' }}>
                Liên kết Gmail đã hết hạn hoặc bị thu hồi. Vui lòng liên kết lại để tiếp tục gửi email từ địa chỉ cá nhân.
              </span>
            </div>
          )}
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Đã liên kết: <b style={{ color: 'var(--text-strong)' }}>{status.email}</b>
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {status.needsRelink && <Button variant="primary" size="sm" onClick={startLink} loading={oauthUrl.isPending}>Liên kết lại</Button>}
            <Button variant="ghost" size="sm" onClick={() => unlink.mutate(undefined, { onError: (err) => toast.error(err.message || 'Hủy liên kết thất bại, thử lại.') })} loading={unlink.isPending}>Hủy liên kết</Button>
          </div>
        </>
      ) : (
        <>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa liên kết Gmail — soạn email cho khách sẽ dùng địa chỉ mặc định của hệ thống.</span>
          <Button variant="primary" size="sm" onClick={startLink} loading={oauthUrl.isPending}>Liên kết Google để gửi email</Button>
        </>
      )}
    </div>
  );
}

// UC40 §3.7 — gợi ý 3-5 biển đang có khách hỏi nhiều (PendingContactCount thật) để CTV ưu tiên
// giới thiệu, kèm nút copy nhanh tin nhắn mời khách theo đúng biển đó (§3.4).
function HotPlatesWidget({ referralUrl }) {
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

// UC40 §3.5 — lịch sử click theo ngày (line chart) + breakdown nguồn (danh sách %).
const CLICK_SOURCE_LABEL = { zalo: 'Zalo', facebook: 'Facebook', other: 'Khác/Trực tiếp' };
const CLICK_RANGE_OPTS = [
  { value: 7, label: '7 ngày' },
  { value: 30, label: '30 ngày' },
  { value: 90, label: '90 ngày' },
];

function ClickTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-elevated)', padding: '8px 12px' }}>
      <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{label}</span>
      <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{payload[0].value} lượt click</span>
    </div>
  );
}

function ClickStatsSection() {
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
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Lượt click</span>
          {!isLoading && totalClicks > 0 && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{totalClicks} lượt trong {days} ngày</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-pill)' }}>
          {CLICK_RANGE_OPTS.map((o) => (
            <button key={o.value} type="button" onClick={() => setDays(o.value)}
              style={{ height: 28, padding: '0 12px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)',
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

// UC40 §3.2 — toggle hiện tên trên bảng xếp hạng, đặt cạnh khối link giới thiệu.
function LeaderboardVisibilityToggle({ go }) {
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

// Trang riêng bảng xếp hạng CTV tháng hiện tại — không hiện số tiền, chỉ rank + số giao dịch thành công.
export function CollaboratorLeaderboard({ go }) {
  const { data, isLoading } = useLeaderboard();
  const items = data?.items || [];
  const me = data?.me;

  return (
    <section style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <span style={{ display: 'block', font: 'var(--type-display-3)', color: 'var(--text-strong)' }}>Bảng xếp hạng CTV tháng này</span>
        <span style={{ display: 'block', marginTop: 4, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Xếp theo tổng hoa hồng đã duyệt/đã trả — không hiển thị số tiền cụ thể.</span>
      </div>
      {me && (
        <div style={{ background: 'var(--surface-inverse)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--white)' }}>Vị trí của bạn</span>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--white)' }}>#{me.rank} · {me.successfulDeals} giao dịch</span>
        </div>
      )}
      {isLoading ? (
        <SkeletonCard height={200} />
      ) : items.length === 0 ? (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có CTV nào có giao dịch trong tháng này.</span>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((it) => (
            <div key={it.rank} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px var(--gutter-card)', borderTop: it.rank > 1 ? '1px solid var(--grey-100)' : 'none' }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: it.rank <= 3 ? 'var(--action-primary)' : 'var(--text-strong)' }}>#{it.rank} {it.displayName}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{it.successfulDeals} giao dịch</span>
            </div>
          ))}
        </div>
      )}
      <Button variant="ghost" size="sm" onClick={() => go('collab')()}>← Quay lại trang Cộng tác viên</Button>
    </section>
  );
}

// UC40 §3.3 — top 5 biển CTV hay giới thiệu nhất, theo số click gắn PlateId.
function TopReferredPlates() {
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

// CTV tự chốt đơn hoàn toàn qua Zalo cá nhân (khách không click link giới thiệu) — báo cho admin
// duyệt để vẫn được tính hoa hồng. Tái dùng đúng pattern plate-search picker của CreateTransactionForm
// (AdminTransactions.jsx) nhưng không import chéo trang admin sang trang public.
function DealReportForm() {
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
                <div style={{ position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0, background: 'var(--white)', boxShadow: 'var(--shadow-elevated)', borderRadius: 'var(--radius-field)', maxHeight: 220, overflowY: 'auto' }}>
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
          <Input label="Tên khách" value={buyerFullName} onChange={(e) => setBuyerFullName(e.target.value)} />
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-label)', color: 'var(--text-strong)', marginBottom: 6 }}>
              Số điện thoại khách
              <InfoTip text="Admin có thể gọi xác minh lại với khách trước khi duyệt hoa hồng." />
            </span>
            <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
          </div>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-label)', color: 'var(--text-strong)', marginBottom: 6 }}>
              Số tiền đã chốt
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

// Sửa ngân hàng ngay tại dashboard — không đá qua Profile. Tách riêng khỏi ActivateCtvForm
// vì ngữ cảnh khác (đã là CTV, chỉ đổi bank, không cần bước OTP email).
function BankInfoEditor({ onDone }) {
  const updateBank = useUpdateBankInfo();
  const [bankAccount, setBankAccount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [banks, setBanks] = useState([]);

  useEffect(() => { fetchVietQrBanks().then(setBanks); }, []);

  const save = async () => {
    if (!bankAccount.trim()) { toast.error('Nhập số tài khoản.'); return; }
    if (!bankCode) { toast.error('Chọn ngân hàng.'); return; }
    try {
      await updateBank.mutateAsync({ bankAccount: bankAccount.trim(), bankCode, bankAccountHolder: bankAccountHolder.trim() || undefined });
      await refreshToken();
      toast.success('Đã cập nhật thông tin ngân hàng.');
      onDone();
    } catch (e) {
      toast.error(e?.message || 'Cập nhật thất bại, thử lại sau.');
    }
  };

  const qrPreviewUrl = vietQrImageUrl(bankCode, bankAccount.trim());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Select label="Ngân hàng" value={bankCode} options={banks} onChange={setBankCode} />
      <Input label="Số tài khoản" placeholder="Số tài khoản ngân hàng" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
      <Input label="Tên chủ tài khoản (không bắt buộc)" placeholder="NGUYEN VAN A" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} />
      {qrPreviewUrl && (
        <img src={qrPreviewUrl} alt="QR chuyển khoản" style={{ width: 140, height: 140, borderRadius: 'var(--radius-field)', alignSelf: 'flex-start' }} />
      )}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="primary" size="md" onClick={save} disabled={updateBank.isPending}>{updateBank.isPending ? 'Đang lưu...' : 'Lưu'}</Button>
        <Button variant="ghost" size="md" onClick={onDone} disabled={updateBank.isPending}>Hủy</Button>
      </div>
    </div>
  );
}

// P2 — CTV tự khai chức danh + link Zalo riêng, dùng làm placeholder {ctvTitle}/{ctvZaloLink} khi
// copy tin nhắn mẫu gửi khách (tách khỏi BankInfoEditor — không liên quan tiền, cùng khu vực "Sửa hồ sơ").
function MessagingProfileEditor({ initialTitle, initialZaloLink, onDone }) {
  const updateProfile = useUpdateMessagingProfile();
  const [ctvTitle, setCtvTitle] = useState(initialTitle || '');
  const [ctvZaloLink, setCtvZaloLink] = useState(initialZaloLink || '');

  const save = async () => {
    try {
      await updateProfile.mutateAsync({ ctvTitle: ctvTitle.trim() || undefined, ctvZaloLink: ctvZaloLink.trim() || undefined });
      toast.success('Đã cập nhật hồ sơ nhắn tin.');
      onDone();
    } catch (e) {
      toast.error(e?.message || 'Cập nhật thất bại, thử lại sau.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Input label="Chức danh tự đặt (không bắt buộc)" placeholder="VD: Tư vấn viên biển số phong thủy" value={ctvTitle} onChange={(e) => setCtvTitle(e.target.value)} />
      <Input label="Link Zalo cá nhân (không bắt buộc)" placeholder="VD: zalo.me/0912xxxxxx" value={ctvZaloLink} onChange={(e) => setCtvZaloLink(e.target.value)} />
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="primary" size="md" onClick={save} disabled={updateProfile.isPending}>{updateProfile.isPending ? 'Đang lưu...' : 'Lưu'}</Button>
        <Button variant="ghost" size="md" onClick={onDone} disabled={updateProfile.isPending}>Hủy</Button>
      </div>
    </div>
  );
}

// Nhãn tiến độ hiển thị cho CTV — ưu tiên tín hiệu Transaction/Plate thật hơn ContactRequest.Status
// (Status chỉ có New/Consulting/Closed, không có "Đã cọc"/"Đã bán" — 2 mốc này suy ra từ
// depositStatus + plateSold do ContactRequestMappers/AdminPlateService quyết định, không tự động nối).
function contactStageInfo(c) {
  if (c.plateSold) return { label: 'Đã bán', tone: 'mint' };
  if (c.depositStatus === 'payment_confirmed') return { label: 'Đã cọc', tone: 'blue' };
  if (c.depositStatus === 'pending') return { label: 'Đã cọc (chờ xác nhận)', tone: 'amber' };
  if (c.status === 'closed') return { label: 'Đã chốt', tone: 'mint' };
  if (c.status === 'consulting') return { label: 'Đang tư vấn', tone: 'amber' };
  return { label: 'Mới liên hệ', tone: 'neutral' };
}

function ContactPipelineSection({ contacts }) {
  const items = contacts.data?.contacts || [];
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Tiến độ khách đã liên hệ</span>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Mới liên hệ → Đang tư vấn → Đã cọc → Đã bán. "Đã bán" đối chiếu đúng trạng thái thật của biển số.</span>
      {contacts.isLoading && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>}
      {!contacts.isLoading && contacts.isError && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tải được tiến độ khách.</span>}
      {!contacts.isLoading && !contacts.isError && items.length === 0 && (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có khách nào liên hệ qua link/mã giới thiệu của bạn.</span>
      )}
      {items.map((c) => {
        const stage = contactStageInfo(c);
        return (
          <div key={c.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '10px 0', borderTop: '1px solid var(--grey-100)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)' }}>{c.fullName || '—'}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{c.phone || '—'}{c.plateNumber ? ` · ${c.plateNumber}` : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {c.depositAmount != null && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{money(c.depositAmount)}</span>}
              <Badge tone={stage.tone}>{stage.label}</Badge>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const CTV_TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'commission', label: 'Hoa hồng' },
  { key: 'referral', label: 'Mã giới thiệu' },
  { key: 'messages', label: 'Tin nhắn' },
];

// Mẫu tin nhắn admin soạn sẵn — CTV bung placeholder {plateNumber}/{referralUrl} rồi copy nguyên văn.
function MessageTemplatesSection({ referralUrl, ctvName, ctvPhone, ctvTitle, ctvZaloLink }) {
  const { data, isLoading, isError } = useCollaboratorMessageTemplates(true);
  const [copiedId, setCopiedId] = useState(null);
  const [plateNumber, setPlateNumber] = useState('');
  const items = data || [];
  const categories = [...new Set(items.map((t) => t.category).filter(Boolean))];
  const [filterCategory, setFilterCategory] = useState('');
  const filtered = filterCategory ? items.filter((t) => t.category === filterCategory) : items;

  const copyTemplate = (t) => {
    const filled = t.bodyTemplate
      .replaceAll('{referralUrl}', referralUrl || '')
      .replaceAll('{plateNumber}', plateNumber || '(chưa nhập số biển)')
      .replaceAll('{ctvName}', ctvName || '')
      .replaceAll('{ctvPhone}', ctvPhone || '')
      .replaceAll('{ctvTitle}', ctvTitle || '')
      .replaceAll('{ctvZaloLink}', ctvZaloLink || '');
    const done = () => { setCopiedId(t.id); toast.success('Đã sao chép tin nhắn'); setTimeout(() => setCopiedId(null), 2000); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(filled).then(done).catch(() => fallbackCopy(filled, done));
    else fallbackCopy(filled, done);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <div style={{ flex: '1 1 220px' }}>
          <Input label="Số biển đang muốn giới thiệu (tùy chọn)" placeholder="VD: 43A1-999.99" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
        </div>
        {categories.length > 0 && (
          <Select label="Lọc danh mục" value={filterCategory} options={[{ value: '', label: 'Tất cả' }, ...categories.map((c) => ({ value: c, label: c }))]} onChange={setFilterCategory} />
        )}
      </div>

      {isLoading && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>}
      {!isLoading && isError && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tải được mẫu tin nhắn.</span>}
      {!isLoading && !isError && filtered.length === 0 && (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có mẫu tin nhắn nào — admin sẽ soạn sẵn để bạn dùng.</span>
      )}
      {filtered.map((t) => (
        <div key={t.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', flex: 1 }}>{t.title}</span>
            {t.category && <Badge tone="blue">{t.category}</Badge>}
            {t.channel && <Badge tone="amber">{t.channel}</Badge>}
          </div>
          {t.description && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{t.description}</span>}
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{t.bodyTemplate}</p>
          <Button variant="outline" size="sm" onClick={() => copyTemplate(t)} style={{ alignSelf: 'flex-start' }}>{copiedId === t.id ? 'Đã sao chép' : 'Copy tin nhắn'}</Button>
        </div>
      ))}
    </div>
  );
}

function DashboardBody({ data, onReset, go }) {
  const [tab, setTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const customers = useCollaboratorCustomers(data.status === 'active');
  const contacts = useCollaboratorContacts(data.status === 'active');
  const { exportCsv: exportCommissions, loading: exportingCommissions } = useExportCsv('/api/collaborators/commissions/export');
  const copyText = (text, onDone) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(onDone).catch(() => fallbackCopy(text, onDone));
    } else {
      fallbackCopy(text, onDone);
    }
  };
  const copyLink = () => copyText(data.referralUrl, () => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  const copyInviteMessage = () => copyText(buildCtvInviteMessage({ referralUrl: data.referralUrl }), () => { setMessageCopied(true); setTimeout(() => setMessageCopied(false), 2000); });

  if (data.status === 'locked') {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Badge tone="rose">Bị khóa</Badge>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Tài khoản CTV đã bị khóa. Liên hệ admin để biết thêm.
        </span>
        <Button variant="ghost" size="sm" onClick={onReset}>Đăng xuất</Button>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--surface-inverse)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--white)' }}>Xin chào, {data.fullName}</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'rgba(255,255,255,.66)' }}>Mã giới thiệu của bạn</span>
          {data.joinedAt && (
            <span style={{ font: 'var(--type-caption)', color: 'rgba(255,255,255,.5)' }}>Tham gia từ {new Date(data.joinedAt).toLocaleDateString('vi-VN')}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <Badge tone="mint">{data.referralCode}</Badge>
          {data.commissionRate != null && (
            <span style={{ font: 'var(--type-caption)', color: 'rgba(255,255,255,.7)' }}>Hệ số hoa hồng: {(data.commissionRate * 100).toFixed(1)}%</span>
          )}
        </div>
      </div>

      <div role="tablist" aria-label="Mục quản lý CTV" style={{ display: 'flex', gap: 4, background: 'var(--surface-sunken)', padding: 4, borderRadius: 'var(--radius-pill)', overflowX: 'auto' }}>
        {CTV_TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            style={{ flex: '1 1 0', minWidth: 'max-content', height: 40, padding: '0 18px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)',
              background: tab === t.key ? 'var(--action-primary)' : 'transparent', color: tab === t.key ? 'var(--white)' : 'var(--text-muted)', transition: 'var(--transition-control)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter-section)' }}>
            {[
              ['Lượt click', String(data.clicks), 'var(--text-strong)'],
              ['Khách đã giới thiệu', String(data.referredUserCount ?? 0), 'var(--status-success)'],
              ['Giao dịch thành công', String(data.successfulDeals), 'var(--status-success)'],
              ['Chờ duyệt', money(data.pending), 'var(--status-warning)'],
              ['Đã duyệt / đã chi trả', money(data.approved + data.paid), 'var(--status-success)'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', minWidth: 0 }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Link giới thiệu của bạn</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{data.referralUrl}</span>
              </div>
              <Button variant="primary" size="md" onClick={copyLink}>{copied ? 'Đã sao chép' : 'Sao chép link'}</Button>
              {!editingBank && <Button variant="outline" size="md" onClick={() => setEditingBank(true)}>Sửa thông tin ngân hàng</Button>}
              {!editingProfile && <Button variant="outline" size="md" onClick={() => setEditingProfile(true)}>Sửa hồ sơ nhắn tin</Button>}
            </div>
            {editingBank && <BankInfoEditor onDone={() => setEditingBank(false)} />}
            {editingProfile && (
              <MessagingProfileEditor initialTitle={data.ctvTitle} initialZaloLink={data.ctvZaloLink} onDone={() => setEditingProfile(false)} />
            )}
            <LeaderboardVisibilityToggle go={go} />
          </div>

          <DealReportForm />

          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Khách hàng đã giới thiệu</span>
            {customers.isLoading && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>}
            {!customers.isLoading && customers.isError && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tải được danh sách khách.</span>}
            {!customers.isLoading && !customers.isError && customers.data?.users?.length === 0 && (
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có khách nào đăng ký bằng mã giới thiệu của bạn.</span>
            )}
            {customers.data?.users?.map((u) => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '8px 0', borderTop: '1px solid var(--grey-100)' }}>
                <span style={{ font: 'var(--type-body-sm)' }}>{u.fullName || '—'}</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{u.phone || '—'}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            ))}
          </div>

          <GmailLinkSection />
        </>
      )}

      {tab === 'commission' && (
        <>
          <CommissionChart recent={data.recent} />

          {data.recent?.length > 0 && (
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Lịch sử hoa hồng ({data.recent.length} gần nhất)</span>
                <Button variant="ghost" size="sm" disabled={exportingCommissions} onClick={() => exportCommissions().catch((e) => toast.error(e.message))}>
                  {exportingCommissions ? 'Đang xuất…' : 'Xuất CSV'}
                </Button>
              </div>
              {data.recent.map((r) => (
                <div key={r.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', padding: '8px 0', borderTop: '1px solid var(--grey-100)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ font: 'var(--type-body-sm)' }}>{r.plateNumber || '—'}</span>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{money(r.amount)}</span>
                  <Badge tone={r.status === 'paid' ? 'mint' : r.status === 'approved' ? 'blue' : r.status === 'cancelled' ? 'rose' : 'amber'}>
                    {{ paid: 'Đã trả', approved: 'Đã duyệt', pending: 'Chờ duyệt', cancelled: 'Đã hủy' }[r.status] || r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <ContactPipelineSection contacts={contacts} />
        </>
      )}

      {tab === 'referral' && (
        <>
          <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', minWidth: 0 }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Link giới thiệu của bạn</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{data.referralUrl}</span>
              </div>
              <Button variant="primary" size="md" onClick={copyLink}>{copied ? 'Đã sao chép' : 'Sao chép link'}</Button>
              <Button variant="outline" size="md" onClick={copyInviteMessage}>{messageCopied ? 'Đã sao chép' : 'Copy tin nhắn mời khách'}</Button>
            </div>
          </div>

          <ClickStatsSection />

          <HotPlatesWidget referralUrl={data.referralUrl} />

          <TopReferredPlates />
        </>
      )}

      {tab === 'messages' && (
        <MessageTemplatesSection referralUrl={data.referralUrl} ctvName={data.fullName} ctvPhone={data.ctvPhone} ctvTitle={data.ctvTitle} ctvZaloLink={data.ctvZaloLink} />
      )}

      <a href={routeFor('collabProcess')} onClick={(e) => { e.preventDefault(); go('collabProcess')(); }} style={{ alignSelf: 'flex-start', font: 'var(--type-caption)', color: 'var(--action-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Xem quy trình nhận hoa hồng →</a>
      <Button variant="ghost" size="sm" onClick={onReset}>Đăng xuất</Button>
    </section>
  );
}

function Dashboard({ onReset, go }) {
  const { data, isLoading, isError } = useCollaboratorDashboard(true);

  if (isLoading) {
    return (
      <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <SkeletonCard height={120} /><SkeletonCard height={200} />
      </section>
    );
  }
  if (isError || !data) {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tải được hồ sơ CTV. Vui lòng đăng nhập lại.</span>
        <Button variant="ghost" size="sm" onClick={onReset}>Đăng nhập lại</Button>
      </section>
    );
  }
  return <DashboardBody data={data} onReset={onReset} go={go} />;
}

// Biểu đồ hoa hồng theo tháng — gộp data.recent (tối đa 20 dòng gần nhất) theo tháng, tách theo trạng thái.
// Trục/tooltip tiền dạng gọn: 1.500.000 -> "1,5tr", dưới 1 triệu giữ nguyên số.
function formatMoneyAxis(v) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1).replace('.', ',')}tr`;
  return v.toLocaleString('vi-VN');
}

// Tooltip riêng — hiện đủ 3 trạng thái + tổng cộng, thay vì mặc định recharts chỉ liệt kê series có giá trị.
function CommissionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));
  const total = (byKey.paid || 0) + (byKey.approved || 0) + (byKey.pending || 0);
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-elevated)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
      <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{label}</span>
      <span style={{ font: 'var(--type-caption)', color: '#16a34a' }}>Đã trả: {money(byKey.paid || 0)}</span>
      <span style={{ font: 'var(--type-caption)', color: '#2563eb' }}>Đã duyệt: {money(byKey.approved || 0)}</span>
      <span style={{ font: 'var(--type-caption)', color: '#ca8a04' }}>Chờ duyệt: {money(byKey.pending || 0)}</span>
      <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', borderTop: '1px solid var(--grey-100)', paddingTop: 4, marginTop: 2 }}>Tổng: {money(total)}</span>
    </div>
  );
}

const CHART_RANGE_OPTS = [
  { value: 3, label: '3 tháng' },
  { value: 6, label: '6 tháng' },
  { value: 12, label: '12 tháng' },
];

// Dùng data.recent (20 dòng gần nhất, có sẵn từ dashboard, không tốn thêm request) làm mặc định;
// chỉ gọi useAllCommissions (tối đa 500 dòng) khi CTV đổi sang khoảng > phạm vi 20 dòng đã có.
function CommissionChart({ recent }) {
  const [rangeMonths, setRangeMonths] = useState(6);
  const { data: allCommissions } = useAllCommissions();
  const source = allCommissions || recent;

  const chartData = useMemo(() => {
    if (!source?.length) return [];
    const since = new Date();
    since.setMonth(since.getMonth() - (rangeMonths - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const byMonth = {};
    for (const r of source) {
      const d = new Date(r.createdAt);
      if (d < since) continue;
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      if (!byMonth[key]) byMonth[key] = { month: key, paid: 0, approved: 0, pending: 0, sortKey: d.getFullYear() * 12 + d.getMonth() };
      if (r.status === 'paid') byMonth[key].paid += r.amount;
      else if (r.status === 'approved') byMonth[key].approved += r.amount;
      else if (r.status === 'pending') byMonth[key].pending += r.amount;
    }
    return Object.values(byMonth).sort((a, b) => a.sortKey - b.sortKey);
  }, [source, rangeMonths]);

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Hoa hồng theo tháng</span>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-pill)' }}>
          {CHART_RANGE_OPTS.map((o) => (
            <button key={o.value} type="button" onClick={() => setRangeMonths(o.value)}
              style={{ height: 28, padding: '0 12px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)',
                background: rangeMonths === o.value ? 'var(--action-primary)' : 'transparent', color: rangeMonths === o.value ? 'var(--white)' : 'var(--text-muted)' }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {chartData.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', height: 200, textAlign: 'center' }}>
          <BarChartIcon size={28} style={{ color: 'var(--text-faint)' }} />
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có giao dịch nào trong {rangeMonths} tháng gần đây — chia sẻ link giới thiệu ngay để bắt đầu nhận hoa hồng.</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-200)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatMoneyAxis} />
            <Tooltip content={<CommissionTooltip />} />
            <Legend />
            <Bar dataKey="paid" name="Đã trả" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="approved" name="Đã duyệt" stackId="a" fill="#2563eb" />
            <Bar dataKey="pending" name="Chờ duyệt" stackId="a" fill="#ca8a04" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Quy trình 4 bước — cố định, không qua admin chỉnh (khác nội dung ưu đãi bodyHtml).
// Dùng chung cho cả trang ưu đãi (trước khi thành CTV) và dashboard (đã là CTV).
const PROCESS_STEPS = [
  { n: 1, title: 'Đăng ký làm CTV', desc: 'Đăng nhập tài khoản, xác thực email, nhập số tài khoản ngân hàng nhận tiền. Kích hoạt ngay, không cần chờ admin duyệt.' },
  { n: 2, title: 'Chia sẻ link giới thiệu', desc: 'Mỗi CTV có 1 mã/link riêng. Gửi link cho khách qua Zalo, Facebook, tin nhắn… — khách bấm vào là hệ thống tự nhớ bạn là người giới thiệu.' },
  { n: 3, title: 'Khách đặt cọc / mua biển', desc: 'Khi khách qua link của bạn để lại yêu cầu đặt cọc hoặc mua biển, hệ thống tự tính hoa hồng theo % trên số tiền đặt cọc — không cần bạn thao tác gì thêm.' },
  { n: 4, title: 'Nhận hoa hồng', desc: 'Hoa hồng ở trạng thái "Chờ duyệt" cho tới khi admin xác nhận giao dịch và chuyển khoản vào đúng số tài khoản bạn đăng ký — khi đó chuyển sang "Đã thanh toán".' },
];

function ProcessSteps() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Quy trình nhận hoa hồng — 4 bước đơn giản</span>
      <div className="ctv-process-steps" style={{ display: 'grid', gap: 'var(--gutter-section)' }}>
        {PROCESS_STEPS.map((s, i) => {
          const StepIcon = STEP_ICONS[i];
          return (
            <motion.div key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 'var(--radius-pill)', background: 'var(--surface-tint-cream)', color: 'var(--action-primary)' }}>
                <StepIcon size={20} />
              </span>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{s.n}. {s.title}</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</span>
            </motion.div>
          );
        })}
      </div>
      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Cách tính hoa hồng</span>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>Mặc định 5% trên số tiền đặt cọc của khách (admin có thể set mức % riêng cao hơn cho từng CTV). Ví dụ: khách đặt cọc 10.000.000đ → bạn nhận 500.000đ.</span>
      </div>
    </div>
  );
}

// Công cụ CTV thực tế đang có trong dashboard (không phải quảng cáo suông) — liệt kê để khách hiểu
// rõ khi thành CTV sẽ được hỗ trợ gì ngoài % hoa hồng, trước khi bấm kích hoạt.
// 3 mục đầu (mới nhất, UC40) nổi bật thành thẻ lớn; 9 mục còn lại rút gọn thành chip — tránh
// cảm giác "tường thông tin" khi liệt kê phẳng 12 mục ngang hàng nhau.
const CTV_TOOLS_FEATURED = [
  { icon: Bell, title: 'Thông báo ngay khi có khách đặt cọc', desc: 'Không cần tự vào dashboard kiểm tra — hệ thống báo ngay khi có khách đặt cọc/mua qua link của bạn.', badge: 'Mới' },
  { icon: BarChartIcon, title: 'Biểu đồ hoa hồng theo tháng', desc: 'Theo dõi trực quan hoa hồng chờ duyệt/đã duyệt/đã trả, lọc theo 3/6/12 tháng gần nhất.', badge: 'Mới' },
  { icon: Trophy, title: 'Bảng xếp hạng CTV', desc: 'So sánh số giao dịch thành công trong tháng với CTV khác — tùy chọn ẩn danh, không lộ số tiền.', badge: 'Mới' },
];
const CTV_TOOLS_REST = [
  { icon: Link2, title: 'Link/QR riêng theo từng biển' },
  { icon: MessageSquareText, title: 'Mẫu tin nhắn mời khách soạn sẵn' },
  { icon: TrendingUp, title: 'Lịch sử click chi tiết' },
  { icon: Download, title: 'Xuất CSV lịch sử hoa hồng' },
  { icon: Flame, title: 'Gợi ý biển đang được quan tâm' },
  { icon: Mail, title: 'Liên kết Gmail cá nhân' },
  { icon: FileWarning, title: 'Báo cáo giao dịch ngoài nền tảng' },
  { icon: Users, title: 'Danh sách khách đã giới thiệu' },
  { icon: QrCode, title: 'QR chuyển khoản tự sinh' },
];

function CtvTools() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <span style={{ display: 'block', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Công cụ hỗ trợ Cộng tác viên</span>
        <span style={{ display: 'block', marginTop: 4, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không chỉ trả hoa hồng — bạn còn được hỗ trợ những công cụ này để làm việc thuận tiện hơn.</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 'var(--gutter-section)' }}>
        {CTV_TOOLS_FEATURED.map((t, i) => {
          const ToolIcon = t.icon;
          return (
            <motion.div key={t.title} className="ctv-tool-featured"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 'var(--radius-pill)', background: 'var(--surface-tint-cream)', color: 'var(--action-primary)' }}>
                  <ToolIcon size={18} />
                </span>
                <Badge tone="amber">{t.badge}</Badge>
              </div>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{t.title}</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>{t.desc}</span>
            </motion.div>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {CTV_TOOLS_REST.map((t, i) => {
          const ToolIcon = t.icon;
          return (
            <motion.span key={t.title} className="ctv-tool-chip"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
            >
              <ToolIcon size={14} color="var(--action-primary)" />
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-body)' }}>{t.title}</span>
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

// Trang ưu đãi — user đã đăng nhập chưa là CTV, hoặc chưa đăng nhập. Nội dung admin chỉnh.
// Form kích hoạt CTV ngay tại trang giới thiệu — không đá qua Profile. Liệt kê đúng thông tin
// còn thiếu theo điều kiện backend (POST /api/collaborators/become): email phải verified nếu
// tài khoản đăng ký bằng email, và bắt buộc ngân hàng nhận hoa hồng.
function ActivateCtvForm({ onActivated }) {
  const user = loadAuth()?.user;
  const become = useBecomeCollaborator();
  const [bankAccount, setBankAccount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [banks, setBanks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [emailVerified, setEmailVerified] = useState(Boolean(user?.verified));
  const needsEmailVerify = user?.identifierType === 'email' && !emailVerified;

  useEffect(() => { fetchVietQrBanks().then(setBanks); }, []);

  const sendOtp = async () => {
    setOtpBusy(true);
    try {
      await requestEmailVerifyOtp();
      setOtpSent(true);
      toast.success('Đã gửi mã xác thực tới email của bạn.');
    } catch (e) {
      toast.error(e?.message || 'Gửi mã thất bại, thử lại sau.');
    } finally {
      setOtpBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (otpCode.trim().length !== 6) { toast.error('Nhập đủ 6 số của mã xác thực.'); return; }
    setOtpBusy(true);
    try {
      await confirmEmailVerifyOtp(otpCode.trim());
      await refreshToken();
      setEmailVerified(true);
      toast.success('Xác thực email thành công.');
      setOtpSent(false);
      setOtpCode('');
    } catch (e) {
      toast.error(e?.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
    } finally {
      setOtpBusy(false);
    }
  };

  const activate = async () => {
    if (!bankAccount.trim()) { toast.error('Nhập số tài khoản nhận hoa hồng trước khi kích hoạt.'); return; }
    if (!bankCode) { toast.error('Chọn ngân hàng trước khi kích hoạt.'); return; }
    setBusy(true);
    try {
      await become.mutateAsync({ bankAccount: bankAccount.trim(), bankCode, bankAccountHolder: bankAccountHolder.trim() || undefined });
      await refreshToken();
      toast.success('Bạn đã trở thành Cộng tác viên');
      onActivated();
    } catch (e) {
      const code = e?.code;
      if (code === 'EMAIL_NOT_VERIFIED') toast.error('Xác thực email trước khi trở thành CTV.');
      else toast.error(e?.message || 'Kích hoạt thất bại, thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  const qrPreviewUrl = vietQrImageUrl(bankCode, bankAccount.trim());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Trở thành Cộng tác viên</h3>
      <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
        {needsEmailVerify
          ? 'Còn thiếu: xác thực email. Điền mã gửi tới email của bạn để kích hoạt.'
          : 'Còn thiếu: thông tin ngân hàng nhận hoa hồng. Điền nhanh bên dưới để kích hoạt ngay.'}
      </p>

      {needsEmailVerify && (
        !otpSent ? (
          <Button variant="outline" size="md" style={{ alignSelf: 'flex-start' }} onClick={sendOtp} disabled={otpBusy}>
            {otpBusy ? 'Đang gửi...' : 'Gửi mã xác thực email'}
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Input label="Mã xác thực (6 số)" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <Button variant="primary" size="md" onClick={confirmOtp} disabled={otpBusy}>{otpBusy ? 'Đang xác nhận...' : 'Xác nhận'}</Button>
            <Button variant="ghost" size="md" onClick={sendOtp} disabled={otpBusy}>Gửi lại mã</Button>
          </div>
        )
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', opacity: needsEmailVerify ? 0.5 : 1, pointerEvents: needsEmailVerify ? 'none' : 'auto' }}>
        <Select label="Ngân hàng" value={bankCode} options={banks} onChange={setBankCode} />
        <Input label="Số tài khoản nhận hoa hồng" placeholder="Số tài khoản ngân hàng" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
        <Input label="Tên chủ tài khoản (không bắt buộc)" placeholder="NGUYEN VAN A" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} />
        {qrPreviewUrl && (
          <img src={qrPreviewUrl} alt="QR chuyển khoản" style={{ width: 140, height: 140, borderRadius: 'var(--radius-field)', alignSelf: 'flex-start' }} />
        )}
        <Button variant="primary" size="lg" onClick={activate} disabled={busy} style={{ alignSelf: 'flex-start' }}>
          {busy ? 'Đang kích hoạt...' : 'Kích hoạt CTV'}
        </Button>
      </div>
    </div>
  );
}

function BenefitLanding({ go, onActivated }) {
  const { data, isLoading } = useCollaboratorBenefitContent();
  const isLoggedIn = Boolean(loadAuth()?.accessToken);
  const title = data?.titleHtml || 'Cộng tác viên';
  const body = data?.bodyHtml || '';

  return (
    <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-7)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {isLoading && <SkeletonCard height={120} />}

      {/* Hero — nội dung + minh họa song song trên, máy tính hoa hồng full-width dưới (điểm nhấn tương
          tác chính: biến "% hoa hồng" trừu tượng thành con số cụ thể ngay khi vừa vào trang). */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-8) var(--gutter-card)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6)' }}>
          <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', minWidth: 0 }}>
            <h1 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)', textWrap: 'balance' }} dangerouslySetInnerHTML={{ __html: title }} />
            {body && <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', font: 'var(--type-body)', color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: body }} />}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
              {STATS.map((s) => {
                const StatIcon = s.icon;
                return (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatIcon size={18} color="var(--action-primary)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}><CounterStat value={s.value} suffix={s.suffix} /></span>
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ flex: '1 1 260px', maxWidth: 320, minWidth: 220 }}>
            <CollaboratorIllustration />
          </div>
        </div>
        <CommissionCalculator />
      </motion.div>

      <CtvTools />

      <div>
        <div className="ctv-process-line">
          <ProcessSteps />
        </div>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-8) var(--gutter-card)' }}>
        {isLoggedIn ? (
          <ActivateCtvForm onActivated={onActivated} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Button variant="primary" size="lg" onClick={() => go('login')()}>Đăng nhập để trở thành CTV</Button>
            <Button variant="ghost" size="md" onClick={() => go('register')()}>Chưa có tài khoản? Đăng ký ngay</Button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Collaborator({ go }) {
  // P2 — CTV gộp vào User: "đã là CTV" = token User + user này is_collaborator.
  const isCtv = () => Boolean(loadAuth()?.accessToken) && Boolean(loadAuth()?.user?.isCollaborator);
  const [loggedIn, setLoggedIn] = useState(() => isCtv());
  const collaboratorLogout = useCollaboratorLogout();

  const logout = () => { collaboratorLogout.mutate(undefined, { onSettled: () => setLoggedIn(false) }); };

  if (loggedIn) return <Dashboard onReset={logout} go={go} />;

  // Chưa là CTV (đăng nhập hay không) → trang ưu đãi + form kích hoạt CTV ngay tại chỗ.
  return <BenefitLanding go={go} onActivated={() => setLoggedIn(true)} />;
}

// Trang riêng cho quy trình nhận hoa hồng — tách khỏi dashboard chính (trước gộp collapse ở đó,
// giờ chỉ 1 link nhỏ dẫn sang đây) để dashboard gọn, tập trung số liệu thay vì lặp nội dung tĩnh.
export function CollaboratorProcess({ go }) {
  return (
    <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <ProcessSteps />
      <Button variant="ghost" size="sm" onClick={() => go('collab')()} style={{ marginTop: 'var(--space-6)' }}>← Quay lại trang Cộng tác viên</Button>
    </section>
  );
}
