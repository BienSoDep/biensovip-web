import Button from './Button.jsx';

/**
 * RollingTextButton - Staggered rolling text button component inspired by motion.dev/ui/buttons
 * Shortcut component with rollingText={true} enabled by default.
 */
export default function RollingTextButton({ children, ...props }) {
  return (
    <Button rollingText {...props}>
      {children}
    </Button>
  );
}
