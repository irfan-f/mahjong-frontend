import { type ReactNode } from 'react';

export type AnimateExpandProps = {
  open: boolean;
  children: ReactNode;
  /** Extra classes on the grid wrapper */
  className?: string;
};

/**
 * Height animation via CSS grid (0fr → 1fr). Respects prefers-reduced-motion.
 */
export function AnimateExpand({ open, children, className = '' }: AnimateExpandProps) {
  return (
    <div
      className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out motion-reduce:duration-150 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'} ${className}`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
