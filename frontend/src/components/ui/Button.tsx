import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400',
  secondary:
    'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
};

export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}