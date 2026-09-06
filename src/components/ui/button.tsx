'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

/* ─── Button variants ───────────────────────────────────────── */
const buttonVariants = {
  variant: {
    primary:
      'bg-[var(--accent)] text-white border border-[var(--accent)] hover:bg-[var(--accent-hover)]',
    secondary:
      'bg-transparent text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg-card)]',
    ghost:
      'bg-transparent text-[var(--text)] border border-transparent hover:bg-[var(--bg-card)]',
  },
  size: {
    sm: 'px-3 py-1.5 text-xs min-h-[28px]',
    md: 'px-4 py-2 text-sm min-h-[36px]',
    lg: 'px-6 py-2.5 text-base min-h-[44px]',
  },
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:pointer-events-none',
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
