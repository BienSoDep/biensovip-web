import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

/**
 * MotionAccordion - Smooth expanding accordion inspired by Motion UI (motion.dev/ui/components/accordion)
 * Supports single-select or multi-select, animated height, spring chevron, and accessible ARIA attributes.
 */
export default function MotionAccordion({
  items = [],
  allowMultiple = false,
  defaultOpenIndex = null,
  className = '',
  itemClassName = '',
  style = {},
}) {
  const [openIndices, setOpenIndices] = useState(() => {
    if (defaultOpenIndex === null || defaultOpenIndex === undefined) return [];
    return Array.isArray(defaultOpenIndex) ? defaultOpenIndex : [defaultOpenIndex];
  });

  const toggleItem = (idx) => {
    if (allowMultiple) {
      setOpenIndices((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    } else {
      setOpenIndices((prev) => (prev.includes(idx) ? [] : [idx]));
    }
  };

  return (
    <div
      className={`motion-accordion ${className}`.trim()}
      style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}
    >
      {items.map((item, idx) => {
        const isOpen = openIndices.includes(idx);
        const title = item.title || item.q || item.question || '';
        const content = item.content || item.a || item.answer || null;
        const itemId = item.id || `accordion-item-${idx}`;

        return (
          <motion.div
            key={itemId}
            className={`motion-accordion-item ${itemClassName}`.trim()}
            initial={false}
            animate={{
              borderColor: isOpen ? 'rgba(241, 151, 32, 0.45)' : 'var(--border-hairline)',
              boxShadow: isOpen
                ? '0 6px 20px -4px rgba(241, 151, 32, 0.10), 0 1px 3px rgba(0,0,0,0.04)'
                : 'var(--shadow-1)',
            }}
            transition={{ duration: 0.22 }}
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card, 12px)',
              border: '1px solid var(--border-hairline)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              id={`motion-acc-header-${idx}`}
              aria-expanded={isOpen}
              aria-controls={`motion-acc-panel-${idx}`}
              onClick={() => toggleItem(idx)}
              style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                font: 'var(--type-title-3)',
                fontWeight: 700,
                color: 'var(--text-strong)',
                transition: 'background-color 140ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-sunken)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ flex: 1, lineHeight: 1.45 }}>{title}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isOpen ? 'var(--brand-600, #a3610a)' : 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                <ChevronDown size={19} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`motion-acc-panel-${idx}`}
                  role="region"
                  aria-labelledby={`motion-acc-header-${idx}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                    transition: {
                      height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                      opacity: { duration: 0.2, delay: 0.05 },
                    },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: {
                      height: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                      opacity: { duration: 0.15 },
                    },
                  }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      padding: '12px 20px 18px',
                      borderTop: '1px solid var(--border-hairline)',
                      font: 'var(--type-body-sm)',
                      color: 'var(--text-body)',
                      lineHeight: 1.75,
                    }}
                  >
                    {content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

