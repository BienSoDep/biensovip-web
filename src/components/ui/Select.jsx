import { ChevronDown } from 'lucide-react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { InfoTip } from './InfoTip.jsx';

export function Select({ label, info, value, options = [], onChange, variant, style, required }) {
  const selected = options.find((o) => o.value === value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }} title={info}>
      {label && (
        <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {label}
          {required && <span style={{ color: 'var(--status-danger)' }}> *</span>}
          {info && <InfoTip text={info} />}
        </span>
      )}
      <BaseSelect.Root value={value ?? ''} onValueChange={(v) => onChange(v)} items={options}>
        <BaseSelect.Trigger
          style={{
            height: 40,
            border: 'none',
            borderRadius: 'var(--radius-field)',
            background: 'var(--surface-sunken)',
            boxShadow: 'var(--shadow-inset-hairline)',
            padding: '0 12px',
            font: 'var(--type-body-sm)',
            color: 'var(--text-strong)',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <BaseSelect.Value>
            {selected ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selected.icon && (
                  <img
                    src={selected.icon}
                    alt=""
                    style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
                  />
                )}
                {selected.label}
              </span>
            ) : (
              ''
            )}
          </BaseSelect.Value>
          <BaseSelect.Icon style={{ display: 'flex', color: 'var(--text-muted)' }}>
            <ChevronDown size={16} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={6} style={{ zIndex: 'var(--z-popover)' }}>
            <BaseSelect.Popup
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-field)',
                boxShadow: 'var(--shadow-3)',
                padding: 4,
                minWidth: 'var(--anchor-width)',
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              {options.map((o) => (
                <BaseSelect.Item
                  key={o.value}
                  value={o.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    font: 'var(--type-body-sm)',
                    color: 'var(--text-strong)',
                    outline: 'none',
                  }}
                  className="select-item"
                >
                  <BaseSelect.ItemText style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {o.icon && (
                      <img
                        src={o.icon}
                        alt=""
                        style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
                      />
                    )}
                    {o.label}
                  </BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator style={{ display: 'flex' }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--action-primary)',
                        flexShrink: 0,
                      }}
                    />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}

export default Select;
