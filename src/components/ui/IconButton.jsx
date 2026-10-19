import {
  Heart,
  X,
  Pencil,
  Trash2,
  Check,
  PlusCircle,
  CheckCircle2,
  GitCompareArrows,
  Flame,
  Droplets,
  Mountain,
  Wind,
  Zap,
  Sparkles,
  Copy,
  Download,
  Share2,
  History,
  KeyRound,
  Image,
} from 'lucide-react';

const ICONS = {
  heart: Heart,
  x: X,
  pencil: Pencil,
  'trash-2': Trash2,
  check: Check,
  'plus-circle': PlusCircle,
  'check-circle': CheckCircle2,
  scale: GitCompareArrows,
  flame: Flame,
  droplets: Droplets,
  mountain: Mountain,
  wind: Wind,
  zap: Zap,
  sparkles: Sparkles,
  copy: Copy,
  download: Download,
  share: Share2,
  history: History,
  key: KeyRound,
  image: Image,
};

export function Icon({ name, size = 18 }) {
  const I = ICONS[name];
  return I ? <I size={size} /> : null;
}

export function IconButton({ name, label, title, onClick, size = 'md', style, disabled, className }) {
  const px = size === 'lg' ? 48 : size === 'sm' ? 36 : 44;
  return (
    <button
      type="button"
      aria-label={label}
      title={title || label}
      onClick={onClick}
      disabled={disabled}
      className={`icon-btn pressable ${className || ''}`}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        border: 'none',
        background: 'var(--surface-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-body)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <Icon name={name} size={Math.round(px * 0.5)} />
    </button>
  );
}

export default Icon;
