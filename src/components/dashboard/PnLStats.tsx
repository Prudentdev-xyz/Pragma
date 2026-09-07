'use client';

import { useEffect } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useTradeStore } from '@/store/tradeStore';
import { StatTile } from '@/components/ui/stat-tile';

function formatPnl(amount: number) {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '+';
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

export function PnLStats() {
  const { dailyPnL, totalPnL, openPositions, updatePnL, setOpenPositions } = useAgentStore();
  const { trades } = useTradeStore();

  // Periodically poll /api/agent/status to sync engine P&L & positions to agentStore
  useEffect(() => {
    let active = true;

    async function syncStatus() {
      try {
        const res = await fetch('/api/agent/status');
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && data.snapshot && active) {
          updatePnL(data.snapshot.dailyPnl ?? 0, data.snapshot.totalPnl ?? 0);
          if (Array.isArray(data.snapshot.openPositions)) {
            setOpenPositions(data.snapshot.openPositions);
          }
        }
      } catch {
        // Network offline or error
      }
    }

    syncStatus();
    const interval = setInterval(syncStatus, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [updatePnL, setOpenPositions]);

  // Calculate Win Rate from closed trades
  const closedTrades = trades.filter((t) => t.status === 'closed' || t.pnl !== undefined);
  const closedWins = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate =
    closedTrades.length > 0
      ? Math.round((closedWins / closedTrades.length) * 100)
      : 0;

  const totalVariant = totalPnL > 0 ? 'profit' : totalPnL < 0 ? 'loss' : 'neutral';
  const dailyVariant = dailyPnL > 0 ? 'profit' : dailyPnL < 0 ? 'loss' : 'neutral';
  const openCount =
    openPositions.length > 0
      ? openPositions.length
      : trades.filter((t) => t.status === 'open').length;

  return (
    <div className="metric-row">
      <StatTile
        label="Total P&L"
        value={formatPnl(totalPnL)}
        variant={totalVariant}
        detail={closedTrades.length > 0 ? `${closedTrades.length} trades closed` : 'No closed trades yet'}
        data-testid="metric-total-pnl"
      />
      <StatTile
        label="Daily P&L"
        value={formatPnl(dailyPnL)}
        variant={dailyVariant}
        detail="Current session P&L"
        data-testid="metric-daily-pnl"
      />
      <StatTile
        label="Open Pos."
        value={openCount}
        variant="neutral"
        detail={openCount === 0 ? 'No active positions' : `${openCount} active`}
        data-testid="metric-open-pos"
      />
      <StatTile
        label="Win Rate"
        value={`${winRate}%`}
        variant={winRate >= 50 ? 'profit' : winRate > 0 ? 'loss' : 'neutral'}
        detail={closedTrades.length > 0 ? `${closedWins} of ${closedTrades.length} won` : 'No closed trades'}
        data-testid="metric-win-rate"
      />
    </div>
  );
}
