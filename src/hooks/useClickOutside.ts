import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  isActive: boolean
): void {
  useEffect(() => {
    if (!isActive) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, handler, isActive]);
}
