import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Share2, Link2, HandCoins, Wallet, UserPlus } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Badge } from '../components/index.jsx';
import { useCollaboratorDashboard, useCollaboratorCustomers, useCollaboratorBenefitContent } from '../services/collaborators.js';
import { useCollaboratorLogout } from '../services/collaboratorAuth.js';
import { loadAuth } from '../lib/authStore.js';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { useGmailStatus, useGmailOAuthUrl, useUnlinkGmail } from '../services/gmailLink.js';
import { SkeletonCard } from '../components/Skeleton.jsx';
import CounterStat from '../components/CounterStat.jsx';
import CollaboratorIllustration from '../components/CollaboratorIllustration.jsx';

// Số liệu minh họa — CHƯA có API thống kê public tổng CTV/hoa hồng đã trả, dùng số tĩnh tạm.
// TODO: thay bằng API thật khi backend có endpoint /api/collaborators/stats.
const STATS = [
  { icon: UserPlus, value: 50, suffix: '+', label: 'CTV đang hoạt động' },
  { icon: Wallet, value: 100, suffix: 'tr+', label: 'Đã chi trả hoa hồng' },
  { icon: HandCoins, value: 5, suffix: '%', label: 'Hoa hồng mặc định' },
];

const STEP_ICONS = [UserPlus, Share2, Link2, HandCoins];

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

function DashboardBody({ data, onReset, go }) {
  const [copied, setCopied] = useState(false);
  const customers = useCollaboratorCustomers(data.status === 'active');
  const copyLink = () => {
    const onOk = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(data.referralUrl).then(onOk).catch(() => fallbackCopy(data.referralUrl, onOk));
    } else {
      fallbackCopy(data.referralUrl, onOk);
    }
  };

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
        </div>
        <Badge tone="mint">{data.referralCode}</Badge>
      </div>

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

      <ProcessSteps />

      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', minWidth: 0 }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Link giới thiệu của bạn</span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{data.referralUrl}</span>
        </div>
        <Button variant="primary" size="md" onClick={copyLink}>{copied ? 'Đã sao chép' : 'Sao chép link'}</Button>
        <Button variant="outline" size="md" onClick={() => { window.location.hash = 'become-ctv'; go('profile')(); }}>Sửa thông tin ngân hàng</Button>
      </div>

      {data.recent?.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Giao dịch gần đây</span>
          {data.recent.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '8px 0', borderTop: '1px solid var(--grey-100)' }}>
              <span style={{ font: 'var(--type-body-sm)' }}>{r.plateNumber || '—'}</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{money(r.amount)}</span>
              <Badge tone={r.status === 'paid' ? 'mint' : r.status === 'approved' ? 'blue' : 'amber'}>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--gutter-section)' }}>
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

// Trang ưu đãi — user đã đăng nhập chưa là CTV, hoặc chưa đăng nhập. Nội dung admin chỉnh.
function BenefitLanding({ go }) {
  const { data, isLoading } = useCollaboratorBenefitContent();
  const isLoggedIn = Boolean(loadAuth()?.accessToken);
  const title = data?.titleHtml || 'Cộng tác viên';
  const body = data?.bodyHtml || '';

  return (
    <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-7)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {isLoading && <SkeletonCard height={120} />}

      {/* Hero — nội dung + minh họa SVG song song, illustration tự vẽ tay bằng token màu site */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6)', background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-8) var(--gutter-card)', overflow: 'hidden' }}>
        <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', minWidth: 0 }}>
          <h1 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }} dangerouslySetInnerHTML={{ __html: title }} />
          {body && <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', font: 'var(--type-body)', color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: body }} />}
        </div>
        <div style={{ flex: '1 1 260px', maxWidth: 320, minWidth: 220 }}>
          <CollaboratorIllustration />
        </div>
      </div>

      {/* Số liệu thuyết phục — counter đếm dần khi cuộn tới. Số minh họa, cập nhật khi có API thật. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--gutter-section)' }}>
        {STATS.map((s, i) => {
          const StatIcon = s.icon;
          return (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
            >
              <StatIcon size={22} color="var(--action-primary)" />
              <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>
                <CounterStat value={s.value} suffix={s.suffix} />
              </span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{s.label}</span>
            </motion.div>
          );
        })}
      </div>

      <ProcessSteps />

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-8) var(--gutter-card)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {isLoggedIn ? (
            <Button variant="primary" size="lg" onClick={() => { window.location.hash = 'become-ctv'; go('profile')(); }}>Trở thành CTV</Button>
          ) : (
            <>
              <Button variant="primary" size="lg" onClick={() => go('login')()}>Đăng nhập để trở thành CTV</Button>
              <Button variant="ghost" size="md" onClick={() => go('register')()}>Chưa có tài khoản? Đăng ký ngay</Button>
            </>
          )}
        </div>
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

  // Chưa là CTV (đăng nhập hay không) → trang ưu đãi + nút đưa qua profile/login.
  return <BenefitLanding go={go} />;
}
