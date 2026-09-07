'use client';

import { Activity } from 'lucide-react';
import { useAgentStore, type Position } from '@/store/agentStore';
import { useTradeStore } from '@/store/tradeStore';
import { useMarketStore } from '@/store/marketStore';

function formatPnl(pnl: number) {
  const sign = pnl > 0 ? '+' : pnl < 0 ? '-' : '+';
  return `${sign}$${Math.abs(pnl).toFixed(2)}`;
}

export function PositionsPanel() {
  const { openPositions } = useAgentStore();
  const { trades } = useTradeStore();
  const { markets } = useMarketStore();

  const getMarketName = (marketId: string) => {
    const found = markets.find((m) => m.id === marketId);
    return found?.name || marketId;
  };

  // Derive active positions from store or open trades
  const displayPositions: Position[] =
    openPositions.length > 0
      ? openPositions
      : trades
          .filter((t) => t.status === 'open')
          .map((t) => ({
            id: t.id,
            marketId: t.marketId,
            marketName: t.marketName,
            side: t.side,
            size: t.size,
            entryPrice: t.entryPrice ?? t.price ?? 0.01,
            currentPrice: t.price ?? 0.01,
            openedAt: t.timestamp,
          }));

  return (
    <section className="dash-card table-card" id="positions" data-testid="panel-positions">
      <div className="card-heading">
        <div>
          <h2>Open Positions</h2>
          <p>Mark-to-market · active exposure</p>
        </div>
        {displayPositions.length > 0 && (
          <span className="live-pill" style={{ padding: '2px 8px', fontSize: '11px' }}>
            {displayPositions.length} active
          </span>
        )}
      </div>

      {displayPositions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Activity size={16} />
          </span>
          <b>No active positions</b>
          <p>No active positions. Agent is scanning markets.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Side</th>
                <th>Size</th>
                <th>Entry</th>
                <th>Current</th>
                <th>Unrealised P&L</th>
              </tr>
            </thead>
            <tbody>
              {displayPositions.map((pos: Position) => {
                const currentPrice = pos.currentPrice ?? pos.entryPrice;
                const pnl =
                  pos.unrealizedPnl ??
                  (pos.entryPrice > 0
                    ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * pos.size
                    : 0);
                const isProfit = pnl >= 0;

                return (
                  <tr key={pos.id || `${pos.marketId}-${pos.openedAt}`}>
                    <td>
                      <div className="font-medium text-xs max-w-[180px] truncate" title={getMarketName(pos.marketId)}>
                        {getMarketName(pos.marketId)}
                      </div>
                      <small className="text-[var(--text-muted)] text-[10px] block font-mono">
                        {pos.marketId.slice(0, 10)}...
                      </small>
                    </td>
                    <td>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                          pos.side === 'YES' || pos.side === 'UP' || pos.side === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {pos.side}
                      </span>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {pos.size.toFixed(2)} USDC
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }} className="text-[var(--text-muted)]">
                      ${pos.entryPrice.toFixed(2)}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      ${currentPrice.toFixed(2)}
                    </td>
                    <td
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                      className={`font-semibold ${isProfit ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}
                    >
                      {formatPnl(pnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
