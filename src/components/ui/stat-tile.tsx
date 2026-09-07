'use client';

import * as React from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

/* ─── StatTile: label + big number + optional colour + GSAP counter ─── */
export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  variant?: 'profit' | 'loss' | 'neutral';
  detail?: string;
}

function parseNumber(val: string | number): number | null {
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
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

  const numRef = React.useRef<HTMLSpanElement>(null);
  const currentNum = parseNumber(value);
  const prevNumRef = React.useRef<number | null>(currentNum);

  React.useEffect(() => {
    if (currentNum === null || !numRef.current) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || prevNumRef.current === null) {
      prevNumRef.current = currentNum;
      return;
    }

    const startVal = prevNumRef.current;
    const targetVal = currentNum;
    prevNumRef.current = targetVal;

    if (startVal === targetVal) return;

    const proxy = { val: startVal };
    const tween = gsap.to(proxy, {
      val: targetVal,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        if (!numRef.current) return;
        if (typeof value === 'string' && value.includes('$')) {
          const sign = proxy.val > 0 ? '+' : proxy.val < 0 ? '-' : '+';
          numRef.current.textContent = `${sign}$${Math.abs(proxy.val).toFixed(2)}`;
        } else if (typeof value === 'string' && value.includes('%')) {
          numRef.current.textContent = `${Math.round(proxy.val)}%`;
        } else {
          numRef.current.textContent = String(Math.round(proxy.val));
        }
      },
      onComplete: () => {
        if (numRef.current) {
          numRef.current.textContent = String(value);
        }
      },
    });

    return () => {
      tween.kill();
    };
  }, [currentNum, value]);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl transition-colors duration-200',
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
        <span ref={numRef}>{value}</span>
      </div>
      {detail && (
        <div className="text-xs text-[var(--text-muted)]">{detail}</div>
      )}
    </div>
  );
}

export { StatTile };

