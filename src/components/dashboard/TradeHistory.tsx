'use client';

import { useState } from 'react';
import { ArrowUpDown, ExternalLink } from 'lucide-react';
import { useTrades } from '@/hooks/useTrades';
import { useMarketStore } from '@/store/marketStore';

function formatTime(timestamp: number) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

function formatPnl(pnl?: number) {
  if (pnl === undefined || pnl === null) return '—';
  const sign = pnl > 0 ? '+' : pnl < 0 ? '-' : '+';
  return `${sign}$${Math.abs(pnl).toFixed(2)}`;
}

export function TradeHistory() {
  const { trades, isLoading } = useTrades();
  const { markets } = useMarketStore();
  const [sortAsc, setSortAsc] = useState(false);

  const getMarketName = (marketId: string) => {
    const found = markets.find((m) => m.id === marketId);
    return found?.name || marketId;
  };

  const sortedTrades = [...trades].sort((a, b) => {
    return sortAsc ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
  });

  return (
    <section className="dash-card trade-card" data-testid="panel-trade-history">
      <div className="card-heading">
        <div>
          <h2>Trade History</h2>
          <p>Real-time log from on-chain executions & Supabase</p>
        </div>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="button button-quiet button-sm"
          style={{ fontSize: '11px', padding: '4px 10px' }}
          title="Toggle sort order"
        >
          <ArrowUpDown size={12} />
          {sortAsc ? 'Oldest first' : 'Newest first'}
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Market</th>
              <th>Action</th>
              <th>Size</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>P&L</th>
              <th>AI Rationale</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && trades.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={8} className="text-center py-6 text-[var(--text-muted)] text-xs">
                  Loading trade history…
                </td>
              </tr>
            ) : sortedTrades.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={8} className="text-center py-8 text-[var(--text-muted)] text-xs">
                  No trades yet. Activate the agent to begin.
                </td>
              </tr>
            ) : (
              sortedTrades.map((t) => {
                const isProfit = (t.pnl ?? 0) >= 0;
                const hasPnl = t.pnl !== undefined && t.pnl !== null;
                const rationale = t.aiRationale || 'Autonomous strategy execution';
                const truncatedRationale =
                  rationale.length > 60 ? `${rationale.slice(0, 60)}…` : rationale;

                return (
                  <tr key={t.id}>
                    <td
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                      className="text-xs text-[var(--text-muted)] whitespace-nowrap"
                      title={formatDate(t.timestamp)}
                    >
                      {formatTime(t.timestamp)}
                    </td>
                    <td>
                      <div className="font-medium text-xs max-w-[140px] truncate" title={getMarketName(t.marketId)}>
                        {getMarketName(t.marketId)}
                      </div>
                      {t.txHash && (
                        <a
                          href={`https://shannon-explorer.somnia.network/tx/${t.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-mono"
                          title="View on Shannon Explorer"
                        >
                          tx: {t.txHash.slice(0, 6)}...
                          <ExternalLink size={9} />
                        </a>
                      )}
                    </td>
                    <td>
                      <span className="font-semibold text-xs text-[var(--text)]">
                        {t.action || (t.side ? `BUY_${t.side}` : 'TRADE')}
                      </span>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }} className="text-xs">
                      {t.size.toFixed(2)} USDC
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }} className="text-xs text-[var(--text-muted)]">
                      {t.entryPrice ? `$${t.entryPrice.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }} className="text-xs text-[var(--text-muted)]">
                      {t.exitPrice ? `$${t.exitPrice.toFixed(2)}` : '—'}
                    </td>
                    <td
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                      className={`text-xs font-semibold ${
                        !hasPnl
                          ? 'text-[var(--text-muted)]'
                          : isProfit
                            ? 'text-[var(--profit)]'
                            : 'text-[var(--loss)]'
                      }`}
                    >
                      {formatPnl(t.pnl)}
                    </td>
                    <td className="text-xs text-[var(--text-muted)] max-w-[220px]">
                      <span
                        className="cursor-help hover:text-[var(--text)] transition-colors inline-block"
                        title={rationale}
                      >
                        {truncatedRationale}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
