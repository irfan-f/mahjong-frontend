/** Inline spinner for buttons and loading states. Use className for size (default w-5 h-5). */
export function Spinner({ className = 'w-5 h-5', ...rest }: React.ComponentPropsWithoutRef<'span'> & { className?: string }) {
  return (
    <span
      className={`inline-block border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin shrink-0 ${className}`}
      aria-hidden
      {...rest}
    />
  );
}
