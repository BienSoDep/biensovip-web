import { useState, useEffect } from 'react';

/**
 * useDebounce - Delays updating state until after `delay` ms of silence.
 * @param {any} value The value to debounce.
 * @param {number} delay Delay in milliseconds (default 300).
 * @returns {any} Debounced value.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
