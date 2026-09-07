'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pause, Play, Square, SlidersHorizontal, Wallet, Send } from 'lucide-react';
import { useAgentStore, type Strategy } from '@/store/agentStore';

export function AgentControls() {
  const router = useRouter();
  const { isActive, strategy, budget, setIsActive, setStrategy, setBudget } = useAgentStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<string>('');

  // Sync from localStorage & engine state on mount
  useEffect(() => {
    setMounted(true);
    const savedActive = localStorage.getItem('pragma-active') === 'true';
    const savedRisk = (localStorage.getItem('pragma-risk') as Strategy) || 'balanced';
    const savedBudget = Number(localStorage.getItem('pragma-budget')) || 2500;
    const savedWallet = localStorage.getItem('pragma-wallet') || '';

    setIsActive(savedActive);
    setStrategy(savedRisk);
    setBudget(savedBudget);
    setWallet(savedWallet);

    async function checkEngineStatus() {
      try {
        const res = await fetch('/api/agent/status');
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && typeof data.running === 'boolean') {
          setIsActive(data.running);
          localStorage.setItem('pragma-active', String(data.running));
        }
      } catch {
        // Fall back to localStorage
      }
    }

    checkEngineStatus();
    const interval = setInterval(checkEngineStatus, 3000);
    return () => clearInterval(interval);
  }, [setIsActive, setStrategy, setBudget]);

  const handleToggle = async () => {
    setLoading(true);
    const next = !isActive;

    try {
      const endpoint = next ? '/api/agent/start' : '/api/agent/stop';
      const body = next
        ? {
            preset: localStorage.getItem('pragma-risk') || 'Balanced',
            budget: Number(localStorage.getItem('pragma-budget')) || 2500,
            wallet: localStorage.getItem('pragma-wallet') || '',
          }
        : {};

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsActive(next);
        localStorage.setItem('pragma-active', String(next));
      }
    } catch (err) {
      console.error('Failed to toggle agent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await fetch('/api/agent/stop', { method: 'POST' });
    } catch {
      // Proceed
    }
    setIsActive(false);
    localStorage.setItem('pragma-active', 'false');
    setLoading(false);
    router.push('/setup');
  };

  return (
    <div
      className="agent-controls-bar flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl mb-4 gap-4 flex-wrap"
      data-testid="panel-agent-controls"
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Status:
          </span>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold"
            suppressHydrationWarning
          >
            {mounted && isActive ? (
              <>
                <i className="pulse" />
                <span className="text-blue-500 font-bold">ACTIVE</span>
              </>
            ) : (
              <>
                <i className="pulse paused" />
                <span className="text-neutral-400">PAUSED</span>
              </>
            )}
          </div>
        </div>

        <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />

        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <SlidersHorizontal size={13} className="text-[var(--accent)]" />
          <span>Strategy:</span>
          <strong className="text-[var(--text)] capitalize" suppressHydrationWarning>
            {strategy}
          </strong>
        </div>

        <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />

        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Wallet size={13} className="text-[var(--accent)]" />
          <span>Budget:</span>
          <strong
            className="text-[var(--text)]"
            style={{ fontVariantNumeric: 'tabular-nums' }}
            suppressHydrationWarning
          >
            {budget} tUSDC
          </strong>
        </div>

        <div className="h-4 w-px bg-[var(--border)] hidden md:block" />

        <a
          href={wallet ? `https://t.me/PragmaAgent_Bot?start=link_${wallet}` : 'https://t.me/PragmaAgent_Bot'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#26A5E4]/10 border border-[#26A5E4]/30 text-xs font-semibold text-[#26A5E4] hover:bg-[#26A5E4]/20 transition-colors"
          title={wallet ? `Link Telegram to wallet ${wallet.slice(0, 6)}...` : 'Remote control via Telegram: @PragmaAgent_Bot'}
        >
          <Send size={11} className="text-[#26A5E4]" />
          <span>Telegram Linked</span>
        </a>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          className={`button button-sm ${isActive ? 'button-quiet' : 'button-primary'}`}
          onClick={handleToggle}
          disabled={loading}
          data-testid="button-agent-pause-resume"
          whileTap={{ scale: 0.96 }}
        >
          {isActive ? (
            <>
              <Pause size={13} />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play size={13} />
              <span>Resume</span>
            </>
          )}
        </motion.button>

        <motion.button
          className="button button-quiet button-sm text-[var(--loss)] hover:border-red-500/40"
          onClick={handleStop}
          disabled={loading}
          data-testid="button-agent-stop"
          whileTap={{ scale: 0.96 }}
          title="Stop agent and reconfigure mandate"
        >
          <Square size={12} className="fill-current" />
          <span>Stop</span>
        </motion.button>
      </div>
    </div>
  );
}
