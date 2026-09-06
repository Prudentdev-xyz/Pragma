'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import {
  Activity,
  LayoutDashboard,
  Pause,
  Play,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';
import { Logo, ThemeButton } from '@/components/pragma-ui';
import { useTheme } from '@/hooks/use-theme';

/* ─── Placeholder chart (no live data yet) ────────────────────── */
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

/* ─── KPI metric card ────────────────────────────────────────── */
function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <section
      className="dash-card metric-card"
      data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-number">{value}</div>
      <div className="metric-sub">{detail}</div>
    </section>
  );
}

/* ─── Empty panel state ──────────────────────────────────────── */
function EmptyPanel({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <b>{title}</b>
      <p>{copy}</p>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const gridRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(true);

  // Read persisted active state on mount
  useEffect(() => {
    setActive(localStorage.getItem('pragma-active') !== 'false');
  }, []);

  // GSAP stagger entrance for metric cards
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dash-card', {
        opacity: 0,
        y: 24,
        stagger: 0.07,
        duration: 0.55,
        ease: 'power2.out',
        delay: 0.1,
      });
    }, gridRef);
    return () => ctx.revert();
  }, []);

  const toggleAgent = () => {
    const next = !active;
    setActive(next);
    localStorage.setItem('pragma-active', String(next));
  };

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
        <div className="nav-stack">
          <Link
            href="#positions"
            className="nav-item"
            data-testid="link-nav-positions"
          >
            <Activity size={15} /> Positions{' '}
            <span style={{ marginLeft: 'auto', fontSize: 10 }}>0</span>
          </Link>
          <Link
            href="#activity"
            className="nav-item"
            data-testid="link-nav-activity"
          >
            <Activity size={15} /> Activity log
          </Link>
        </div>
        <div className="sidebar-foot">
          <div className="wallet-mini">
            <div className="wallet-avatar">0x</div>
            <div>
              <b>Not connected</b>
              <small>Connect in setup</small>
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
            <small>No active session · dashboard ready</small>
          </div>
          <div className="console-actions">
            <div className="live-pill">
              <i className="pulse" />
              {active ? 'AGENT ACTIVE' : 'AGENT PAUSED'}
            </div>
            <ThemeButton theme={theme} toggle={toggle} />
            <motion.button
              className={`button button-sm ${active ? 'button-quiet' : 'button-primary'}`}
              onClick={toggleAgent}
              data-testid="button-toggle-agent"
              whileTap={{ scale: 0.96 }}
            >
              {active ? (
                <>
                  <Pause size={13} /> Pause
                </>
              ) : (
                <>
                  <Play size={13} /> Resume
                </>
              )}
            </motion.button>
          </div>
        </header>

        <main className="dashboard">
          {/* KPI metrics row */}
          <div className="metric-row" ref={gridRef}>
            <Metric
              icon={<Wallet size={15} />}
              label="Total P&L"
              value="+$0.00"
              detail="No closed trades yet"
            />
            <Metric
              icon={<Activity size={15} />}
              label="Open Pos."
              value="0"
              detail="No open positions"
            />
            <Metric
              icon={<SlidersHorizontal size={15} />}
              label="Win Rate"
              value="0%"
              detail="No completed trades"
            />
          </div>

          <div className="dashboard-grid">
            {/* P&L chart — placeholder */}
            <section className="dash-card chart-card">
              <div className="card-heading">
                <div>
                  <h2>P&L Chart</h2>
                  <p>No trades yet — P&L will appear once the agent acts.</p>
                </div>
              </div>
              <PlaceholderChart />
            </section>

            {/* Open positions — empty state */}
            <section
              className="dash-card table-card"
              id="positions"
            >
              <div className="card-heading">
                <div>
                  <h2>Open Positions</h2>
                  <p>Mark-to-market · nothing entered yet</p>
                </div>
              </div>
              <EmptyPanel
                icon={<Activity size={16} />}
                title="No open positions"
                copy="PRAGMA hasn't entered any positions yet. Set a posture in setup and activate to begin."
              />
            </section>

            {/* Agent activity log — empty state */}
            <section className="dash-card log-card" id="activity">
              <div className="card-heading">
                <div>
                  <h2>Agent Activity Log</h2>
                  <p>Why PRAGMA acts</p>
                </div>
              </div>
              <EmptyPanel
                icon={<Activity size={16} />}
                title="No activity yet"
                copy="Every scan, decision, and execution will be logged here."
              />
            </section>

            {/* Trade history — empty state */}
            <section className="dash-card trade-card">
              <div className="card-heading">
                <div>
                  <h2>Trade History</h2>
                  <p>Closed trades · will populate after the first round trip</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Market</th>
                      <th>Side</th>
                      <th>Size</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="empty-row">
                      <td colSpan={6}>No trades yet</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </section>
    </div>
  );
}