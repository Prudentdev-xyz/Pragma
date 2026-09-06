'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── StatTile: label + big number + optional colour ───────── */
export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  variant?: 'profit' | 'loss' | 'neutral';
  detail?: string;
}

function StatTile({
  className,
  label,
  value,
  variant = 'neutral',
  detail,
  ...props
}: StatTileProps) {
  const colorClass =
    variant === 'profit'
      ? 'text-[var(--profit)]'
      : variant === 'loss'
        ? 'text-[var(--loss)]'
        : 'text-[var(--text)]';

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl',
        className,
      )}
      {...props}
    >
      <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
        {label}
      </div>
      <div
        className={cn('text-3xl font-bold font-variant-numeric-tabular', colorClass)}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
      {detail && (
        <div className="text-xs text-[var(--text-muted)]">{detail}</div>
      )}
    </div>
  );
}

export { StatTile };
