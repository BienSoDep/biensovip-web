export function useStaggeredReveal(stepMs = 40) {
  return (index) => ({ animation: 'cardIn 260ms var(--ease-out) both', animationDelay: (index * stepMs) + 'ms' });
}
