import { useEffect, type ReactNode } from 'react';

type MobileMenuShellProps = {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
};

export function MobileMenuShell({ open, onClose, titleId, children }: MobileMenuShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default border-0 bg-black/40 p-0"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 z-50 flex h-[100dvh] w-[min(20rem,calc(100vw-0.5rem))] flex-col border-l border-border bg-(--color-bg-header) shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {children}
      </div>
    </>
  );
}
