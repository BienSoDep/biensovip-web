import { useEffect, useState } from 'react';

export function useDelayedLoading(deps, delay = 300) {
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return isLoading;
}
