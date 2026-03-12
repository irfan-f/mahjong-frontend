interface IconProps {
  src: string;
  className?: string;
  'aria-hidden'?: boolean;
}

export function Icon({
  src,
  className,
  'aria-hidden': ariaHidden = true,
}: IconProps) {
  return (
    <span
      className={className}
      aria-hidden={ariaHidden}
      dangerouslySetInnerHTML={{ __html: src }}
    />
  );
}
