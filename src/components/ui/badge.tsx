'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── Badge variants ────────────────────────────────────────── */
const badgeVariants = {
  profit: 'bg-[var(--profit)] text-white border border-[var(--profit)]',
  loss: 'bg-[var(--loss)] text-white border border-[var(--loss)]',
  neutral: 'bg-[var(--bg-card)] text-[var(--text)] border border-[var(--border)]',
  active: 'bg-[var(--accent)] text-white border border-[var(--accent)]',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
