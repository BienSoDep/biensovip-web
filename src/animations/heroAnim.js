export function makeHeroAnim(fanDoneRef) {
  return function heroAnim(name, delay) {
    if (fanDoneRef.current) return 'none';
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'none';
    } catch { /* matchMedia unavailable — still animate */ }
    return `${name} 600ms cubic-bezier(0.16,1,0.3,1) ${delay}ms both`;
  };
}
