import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../Button.jsx';
import { Badge, InfoTip } from '../index.jsx';
import { SkeletonCard } from '../Skeleton.jsx';
import { useCollaboratorDashboard, useCollaboratorContacts } from '../../services/collaborators.js';
import { useExportCsv } from '../../hooks/useExportCsv.js';
import { buildCtvInviteMessage } from '../../lib/zaloMessage.js';
import { CTV_TABS } from './collaboratorConstants.js';
import { money, fallbackCopy } from './collaboratorUtils.js';
import { BankInfoEditor, MessagingProfileEditor } from './BankInfoEditor.jsx';
import { LeaderboardVisibilityToggle, HotPlatesWidget, ClickStatsSection, TopReferredPlates } from './CtvWidgets.jsx';
import CommissionChart from './CommissionChart.jsx';
import ContactPipelineSection from './ContactPipelineSection.jsx';
import DealReportForm from './DealReportForm.jsx';
import GmailLinkSection from './GmailLinkSection.jsx';
import ProcessSteps from './ProcessSteps.jsx';
import MessageTemplatesSection from './MessageTemplatesSection.jsx';

export function DashboardBody({ data, onReset, go }) {
  const [tab, setTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
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
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--surface-inverse)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--white)' }}>Xin chào, {data.fullName}</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'rgba(255,255,255,.66)' }}>Mã giới thiệu của bạn</span>
          {data.joinedAt && (
            <span style={{ font: 'var(--type-caption)', color: 'rgba(255,255,255,.5)' }}>Tham gia từ {new Date(data.joinedAt).toLocaleDateString('vi-VN')}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button type="button" onClick={() => copyText(data.referralCode, () => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); })}
            title="Bấm để sao chép mã" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
            <Badge tone="mint">{codeCopied ? 'Đã sao chép' : data.referralCode}</Badge>
          </button>
          {data.commissionRate != null && (
            <span style={{ font: 'var(--type-caption)', color: 'rgba(255,255,255,.7)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Hệ số hoa hồng: {(data.commissionRate * 100).toFixed(1)}%
              <InfoTip text="Phần trăm bạn nhận trên số tiền khách đặt cọc/thanh toán qua link giới thiệu của bạn. Admin có thể set riêng cao hơn mức mặc định cho từng CTV." style={{ color: 'rgba(255,255,255,.7)' }} />
            </span>
          )}
        </div>
      </div>

      <div role="tablist" aria-label="Mục quản lý CTV" style={{ display: 'flex', gap: 4, background: 'var(--surface-sunken)', padding: 4, borderRadius: 'var(--radius-sm)', overflowX: 'auto' }}>
        {CTV_TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            style={{ flex: '1 1 0', minWidth: 'max-content', height: 40, padding: '0 18px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)',
              background: tab === t.key ? 'var(--white)' : 'transparent', color: tab === t.key ? 'var(--action-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.key ? 'var(--shadow-3)' : 'none', transition: 'var(--transition-control)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter-section)' }}>
            {[
              ['Lượt click', String(data.clicks), 'var(--text-strong)', 'Số lần khách bấm vào link/mã giới thiệu của bạn, tính cả khách chưa để lại thông tin gì.'],
              ['Khách đã giới thiệu', String(data.referredUserCount ?? 0), 'var(--status-success)', 'Số khách đã đăng ký tài khoản hoặc để lại liên hệ qua link của bạn — chưa chắc đã mua.'],
              ['Giao dịch thành công', String(data.successfulDeals), 'var(--status-success)', 'Số đơn khách đã đặt cọc/mua thành công qua link của bạn, admin đã xác nhận thanh toán.'],
              ['Tỷ lệ chuyển đổi', data.clicks > 0 ? `${((data.successfulDeals / data.clicks) * 100).toFixed(1)}%` : '—', 'var(--text-strong)', 'Giao dịch thành công chia cho lượt click — % khách bấm link rồi thực sự mua.'],
              ['Chờ duyệt', money(data.pending), 'var(--status-warning)', 'Tổng hoa hồng của các giao dịch đang chờ admin xác nhận đã nhận tiền — chưa được chuyển khoản.'],
              ['Đã duyệt / đã chi trả', money(data.approved + data.paid), 'var(--status-success)', 'Tổng hoa hồng admin đã duyệt (sắp chuyển) cộng với phần đã chuyển khoản vào tài khoản ngân hàng của bạn.'],
              ['Tổng hoa hồng tích lũy', money(data.pending + data.approved + data.paid), 'var(--text-strong)', 'Toàn bộ hoa hồng bạn từng được tính — cộng cả 3 trạng thái Chờ duyệt, Đã duyệt và Đã chi trả.'],
              ['Hoa hồng TB/giao dịch', data.successfulDeals > 0 ? money((data.pending + data.approved + data.paid) / data.successfulDeals) : '—', 'var(--text-strong)', 'Tổng hoa hồng tích lũy chia cho số giao dịch thành công — mức trung bình bạn nhận mỗi đơn.'],
            ].map(([label, value, color, tip]) => (
              <div key={label} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 0, containerType: 'inline-size' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {label}
                  <InfoTip text={tip} />
                </span>
                <span style={{ font: 'var(--fw-semibold) clamp(18px,9cqi,28px)/var(--lh-title) var(--font-display)', letterSpacing: 'var(--ls-title)', color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
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

          <ContactPipelineSection contacts={contacts} go={go} />

          <GmailLinkSection />

          <ProcessSteps />
        </>
      )}

      {tab === 'commission' && (
        <>
          <CommissionChart recent={data.recent} />

          {data.recent?.length > 0 && (
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Lịch sử hoa hồng ({data.recent.length} gần nhất)
                  <InfoTip text="Chờ duyệt: giao dịch mới, admin chưa xác nhận đã nhận tiền. Đã duyệt: admin đã xác nhận, chờ chuyển khoản. Đã trả: đã chuyển vào tài khoản ngân hàng bạn đăng ký." />
                </span>
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

      <Button variant="ghost" size="sm" onClick={onReset}>Đăng xuất</Button>
    </section>
  );
}

export default function Dashboard({ onReset, go }) {
  const { data, isLoading, isError } = useCollaboratorDashboard(true);

  if (isLoading) {
    return (
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
