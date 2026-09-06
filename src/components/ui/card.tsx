'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── Card (design-token compliant) ──────────────────────────── */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5',
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export { Card };
