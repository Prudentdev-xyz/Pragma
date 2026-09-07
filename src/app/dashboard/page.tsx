'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useAccount } from 'wagmi';
import {
  Activity,
  LayoutDashboard,
  SlidersHorizontal,
  Send,
} from 'lucide-react';
import { Logo, ThemeButton } from '@/components/pragma-ui';
import { useTheme } from '@/hooks/use-theme';
import { useMarkets } from '@/hooks/useMarkets';
import { useAgentStore } from '@/store/agentStore';

import { AgentControls } from '@/components/dashboard/AgentControls';
import { PnLStats } from '@/components/dashboard/PnLStats';
import { PositionsPanel } from '@/components/dashboard/PositionsPanel';
import { AgentActivity } from '@/components/dashboard/AgentActivity';
import { TradeHistory } from '@/components/dashboard/TradeHistory';

/* ─── Placeholder chart ──────────────────────────────────────── */
const FLAT_POINTS = '0,168 100,168 200,168 300,168 400,168 500,168 600,168 700,168';

function PlaceholderChart() {
  return (
    <>
      <svg
        className="big-chart"
        viewBox="0 0 700 210"
        preserveAspectRatio="none"
        aria-label="P&L chart placeholder"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2563eb" stopOpacity=".18" />
            <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[35, 80, 125, 170].map((y) => (
          <line key={y} className="grid-line" x1="0" x2="700" y1={y} y2={y} />
        ))}
        <polyline className="area" points={`${FLAT_POINTS} 700,210 0,210`} />
        <polyline className="line" points={FLAT_POINTS} />
      </svg>
      <div className="chart-labels">
        <span>09:00</span>
        <span>12:00</span>
        <span>15:00</span>
        <span>18:00</span>
        <span>Now</span>
      </div>
    </>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { theme, toggle } = useTheme();
  const gridRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { address: walletAddress, isConnected } = useAccount();
  const { openPositions, isActive } = useAgentStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize WebSocket & REST market data feed
  const { isConnected: isWsConnected } = useMarkets();

  // GSAP stagger entrance for metric cards (50ms per panel)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const ctx = gsap.context(() => {
      gsap.from('.dash-card', {
        opacity: 0,
        y: 16,
        stagger: 0.05,
        duration: 0.45,
        ease: 'power2.out',
        delay: 0.05,
      });
    }, gridRef);
    return () => ctx.revert();
  }, []);

  const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const displayAddress = mounted
    ? isConnected && walletAddress
      ? walletAddress
      : typeof window !== 'undefined'
        ? localStorage.getItem('pragma-wallet')
        : null
    : null;

  return (
    <div className="app-frame console">
      {/* Sidebar */}
      <aside className="sidebar">
        <Link href="/" className="brand" data-testid="link-dashboard-home">
          <Logo />
        </Link>
        <div className="nav-label">Workspace</div>
        <nav className="nav-stack">
          <Link
            href="/dashboard"
            className="nav-item active"
            data-testid="link-nav-command"
          >
            <LayoutDashboard size={15} /> Command center
          </Link>
          <Link
            href="/setup"
            className="nav-item"
            data-testid="link-nav-strategy"
          >
            <SlidersHorizontal size={15} /> Strategy setup
          </Link>
        </nav>
        <div className="nav-label" style={{ marginTop: 30 }}>
          Agent
        </div>
        <nav className="nav-stack">
          <Link
            href="#positions"
            className="nav-item"
            data-testid="link-nav-positions"
          >
            <Activity size={15} /> Positions{' '}
            <span
              style={{ marginLeft: 'auto', fontSize: 10 }}
              suppressHydrationWarning
            >
              {mounted ? openPositions.length : 0}
            </span>
          </Link>
          <Link
            href="#activity"
            className="nav-item"
            data-testid="link-nav-activity"
          >
            <Activity size={15} /> Activity log
          </Link>
          <a
            href={displayAddress ? `https://t.me/PragmaAgent_Bot?start=link_${displayAddress}` : 'https://t.me/PragmaAgent_Bot'}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item text-[#26A5E4] hover:text-[#26A5E4]"
            title={displayAddress ? `Link Telegram to ${displayAddress.slice(0, 6)}...` : 'Open Telegram Bot (@PragmaAgent_Bot)'}
          >
            <Send size={15} /> Telegram bot
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 9,
                padding: '2px 6px',
                borderRadius: 999,
                background: 'rgba(38, 165, 228, 0.15)',
                color: '#26A5E4',
                fontWeight: 600,
              }}
            >
              LINKED
            </span>
          </a>
        </nav>
        <div className="sidebar-foot">
          <div className="wallet-mini">
            <div className="wallet-avatar">0x</div>
            <div>
              <b suppressHydrationWarning>
                {displayAddress ? shorten(displayAddress) : 'Not connected'}
              </b>
              <small suppressHydrationWarning>
                {displayAddress ? 'Connected' : 'Connect in setup'}
              </small>
            </div>
          </div>
          <Link
            href="/setup"
            className="nav-item"
            data-testid="button-edit-mandate"
          >
            <SlidersHorizontal size={15} /> Edit mandate
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="mobile-nav">
        <Link
          href="/dashboard"
          className="nav-item active"
          data-testid="link-mobile-command"
        >
          <LayoutDashboard size={16} /> Command
        </Link>
        <Link
          href="/setup"
          className="nav-item"
          data-testid="link-mobile-setup"
        >
          <SlidersHorizontal size={16} /> Setup
        </Link>
        <Link
          href="#activity"
          className="nav-item"
          data-testid="button-mobile-log"
        >
          <Activity size={16} /> Log
        </Link>
      </nav>

      {/* Main console area */}
      <section className="console-main">
        <header className="console-header">
          <div className="console-title">
            Command center
            <small>
              {isWsConnected ? 'Market stream live (WebSocket)' : 'Market feed active (REST fallback)'}
            </small>
          </div>
          <div className="console-actions">
            <div className="live-pill">
              <i className="pulse" />
              {isActive ? 'AGENT ACTIVE' : 'AGENT PAUSED'}
            </div>
            <ThemeButton theme={theme} toggle={toggle} />
          </div>
        </header>

        <motion.main
          className="dashboard"
          ref={gridRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Task 4.6 — Live Agent Controls Panel */}
          <AgentControls />

          {/* Task 4.2 — Live P&L Stat Tiles */}
          <PnLStats />

          <div className="dashboard-grid">
            {/* P&L chart */}
            <section className="dash-card chart-card">
              <div className="card-heading">
                <div>
                  <h2>P&L Chart</h2>
                  <p>Performance trajectory · updates with closed cycles</p>
                </div>
              </div>
              <PlaceholderChart />
            </section>

            {/* Task 4.3 — Live Open Positions Panel */}
            <PositionsPanel />

            {/* Task 4.5 — Live Agent Activity Log */}
            <AgentActivity />

            {/* Task 4.4 — Live Trade History Table */}
            <TradeHistory />
          </div>
        </motion.main>
      </section>
    </div>
  );
}
