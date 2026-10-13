import { motion } from 'framer-motion';
import { Badge } from '../index.jsx';
import { CTV_TOOLS_FEATURED, CTV_TOOLS_REST } from './collaboratorConstants.js';

export default function CtvTools() {
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
