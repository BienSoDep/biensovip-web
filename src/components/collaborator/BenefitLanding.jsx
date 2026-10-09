import { motion } from 'framer-motion';
import Button from '../Button.jsx';
import { SkeletonCard } from '../Skeleton.jsx';
import CounterStat from '../CounterStat.jsx';
import CollaboratorIllustration from '../CollaboratorIllustration.jsx';
import { useCollaboratorBenefitContent } from '../../services/collaborators.js';
import { loadAuth } from '../../lib/authStore.js';
import { sanitizeHtml } from '../../lib/sanitizeHtml.js';
import { STATS } from './collaboratorConstants.js';
import CtvTools from './CtvTools.jsx';
import ProcessSteps from './ProcessSteps.jsx';
import ActivateCtvForm from './ActivateCtvForm.jsx';

export default function BenefitLanding({ go, onActivated }) {
  const { data, isLoading } = useCollaboratorBenefitContent();
  const isLoggedIn = Boolean(loadAuth()?.accessToken);
  const title = data?.titleHtml || 'Cộng tác viên';
  const body = data?.bodyHtml || '';

  return (
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-7)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {isLoading && <SkeletonCard height={120} />}

      {/* Hero — nội dung + minh họa song song trên, máy tính hoa hồng full-width dưới */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-8) var(--gutter-card)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)' }}>
          <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', minWidth: 0 }}>
            <h1 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)', textWrap: 'balance' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} />
            {body && <div className="ctv-benefit-prose" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', font: 'var(--type-body)', color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }} />}
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
