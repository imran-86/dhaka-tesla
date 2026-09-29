import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type Variant = 'error' | 'success' | 'info';

interface AlertProps {
  variant?: Variant;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export function Alert({ variant = 'info', children }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={clsx('rounded-md border px-3 py-2 text-sm', variantClasses[variant])}
    >
      {children}
    </div>
  );
}