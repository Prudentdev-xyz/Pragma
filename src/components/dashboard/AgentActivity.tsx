'use client';

import { useEffect } from 'react';
import { Bot, CheckCircle2, CircleDot, PauseCircle } from 'lucide-react';
import { useTradeStore, type Decision } from '@/store/tradeStore';
import { useMarketStore } from '@/store/marketStore';

function formatTime(timestamp: number) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AgentActivity() {
  const { decisions, addDecision } = useTradeStore();
  const { markets } = useMarketStore();

  // Also sync engine snapshot's last decision via polling
  useEffect(() => {
    let active = true;

    async function checkLastDecision() {
      try {
        const res = await fetch('/api/agent/status');
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && data.snapshot?.lastDecision && active) {
          const ld = data.snapshot.lastDecision;
          addDecision({
            id: `engine-decision-${data.snapshot.status.cycles}`,
            marketId: 'active-pool',
            marketName: 'Somnia Prediction Pool',
            action: ld.action,
            confidence: ld.confidence ?? 0.8,
            rationale: ld.rationale,
            timestamp: data.snapshot.status.lastCycleAt || Date.now(),
            outcome: ld.action === 'HOLD' ? 'skipped' : 'executed',
          });
        }
      } catch {
        // Silent error
      }
    }

    checkLastDecision();
    const interval = setInterval(checkLastDecision, 6000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [addDecision]);

  const getMarketName = (marketId: string) => {
    const found = markets.find((m) => m.id === marketId);
    return found?.name || marketId;
  };

  const recentDecisions = decisions.slice(0, 10);

  return (
    <section className="dash-card log-card" id="activity" data-testid="panel-agent-activity">
      <div className="card-heading">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-[var(--accent)]" />
          <div>
            <h2>Agent Activity Log</h2>
            <p>Real-time AI reasoning & market decision stream</p>
          </div>
        </div>
        <span className="live-pill" style={{ padding: '2px 8px', fontSize: '11px' }}>
          LIVE FEED
        </span>
      </div>

      {recentDecisions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <CircleDot size={16} />
          </span>
          <b>Waiting for first AI decision...</b>
          <p>Waiting for first AI decision... AI market scans and signals will stream here.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {recentDecisions.map((item: Decision) => {
            const isHold = item.action === 'HOLD';
            const confidencePct = Math.round(item.confidence * 100);

            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all text-xs flex flex-col gap-1.5 ${
                  isHold
                    ? 'bg-[var(--bg)]/40 border-[var(--border)] text-[var(--text-muted)]'
                    : 'bg-[var(--bg-card)] border-[var(--accent)]/30 text-[var(--text)] shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-[var(--text-muted)]">[{formatTime(item.timestamp)}]</span>
                    <span className="font-semibold truncate max-w-[150px] text-[var(--text)]">
                      {getMarketName(item.marketId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                        isHold
                          ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          : 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                      }`}
                    >
                      {item.action}
                    </span>
                    <span
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                      className={`text-[10px] font-medium ${
                        confidencePct >= 70 ? 'text-emerald-400' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {confidencePct}% conf
                    </span>
                  </div>
                </div>

                <p
                  className={`text-[11px] leading-relaxed ${
                    isHold ? 'text-[var(--text-muted)] line-clamp-2' : 'text-[var(--text)] font-normal'
                  }`}
                >
                  {item.rationale}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
