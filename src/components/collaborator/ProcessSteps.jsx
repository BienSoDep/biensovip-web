import { motion } from 'framer-motion';
import { PROCESS_STEPS, STEP_ICONS } from './collaboratorConstants.js';

export default function ProcessSteps() {
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
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>Tối thiểu 10% trên số tiền đặt cọc của khách (admin có thể set mức % riêng cao hơn cho từng CTV). Ví dụ: khách đặt cọc 10.000.000đ → bạn nhận 1.000.000đ.</span>
      </div>
    </div>
  );
}
