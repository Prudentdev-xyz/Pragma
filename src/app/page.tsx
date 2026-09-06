'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { gsap } from 'gsap';
import { Activity, ArrowRight, Bot, Gauge, ScanLine, ShieldCheck, Zap } from 'lucide-react';
import { ThemeButton, Logo } from '@/components/pragma-ui';
import { useTheme } from '@/hooks/use-theme';

/* ─── Landing Hero chart paths ─────────────────────────────── */
const CHART_D =
  'M0,77 L38,70 L72,73 L108,60 L145,66 L180,43 L218,51 L252,39 L290,42 L328,25 L365,35 L400,23 L438,28 L500,8 L500,95 L0,95Z';
const CHART_POLY =
  '0,77 38,70 72,73 108,60 145,66 180,43 218,51 252,39 290,42 328,25 365,35 400,23 438,28 500,8';

/* ─── Framer Motion variants ─────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const featureVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: 0.1 + i * 0.1, ease: 'easeOut' },
  }),
};

/* ─── Sub-components ────────────────────────────────────────── */
function Feature({
  icon,
  title,
  copy,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
  index: number;
}) {
  return (
    <motion.article
      className="feature-item"
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={featureVariants}
    >
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{copy}</p>
    </motion.article>
  );
}

function AgentPreview() {
  const numberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP counter animation on the PnL number
    const ctx = gsap.context(() => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: 84.17,
        duration: 1.6,
        delay: 0.8,
        ease: 'power2.out',
        onUpdate() {
          if (numberRef.current) {
            numberRef.current.textContent = `+$${obj.val.toFixed(2)}`;
          }
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <motion.div
      className="preview-wrap"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="preview-kicker">Live agent preview / 14:32:08 UTC</div>
      <div className="preview-shell">
        <div className="preview-top">
          <span className="preview-brand">PRAGMA / COMMAND</span>
          <span className="preview-state">
            <i className="pulse" /> LOOP ACTIVE
          </span>
        </div>
        <div className="preview-main">
          <div className="preview-caption">Session return</div>
          <div className="preview-number" ref={numberRef}>
            +$0.00
          </div>
          <div className="preview-positive">+2.41% since activation</div>
          <svg
            className="mini-chart"
            viewBox="0 0 500 95"
            preserveAspectRatio="none"
            aria-label="Preview performance chart"
          >
            <defs>
              <linearGradient id="chartFade" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#2563eb" stopOpacity=".28" />
                <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="chart-fill" d={CHART_D} />
            <polyline points={CHART_POLY} />
          </svg>
          <div className="preview-grid">
            <div className="preview-metric">
              <small>Confidence</small>
              <b>87.4%</b>
            </div>
            <div className="preview-metric">
              <small>Positions</small>
              <b>03</b>
            </div>
            <div className="preview-metric">
              <small>Guardrail</small>
              <b>Clear</b>
            </div>
          </div>
          <div className="preview-line">
            <i />
            <span>
              14:31:52&nbsp;&nbsp;Increased YES exposure on ETH above $3,240.
              Momentum held with 87% confidence.
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);

  // GSAP: subtle parallax on the hero section
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger entrance for hero copy children
      gsap.from('.hero-copy > *', {
        opacity: 0,
        y: 30,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.1,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: <ScanLine size={17} />,
      title: 'Scan with a point of view',
      copy: 'PRAGMA ranks liquidity, volatility, and signal quality before it ever proposes an order.',
    },
    {
      icon: <Bot size={17} />,
      title: 'Reasoning in plain sight',
      copy: 'Every action carries a short rationale. No black-box fills. No unexplained conviction.',
    },
    {
      icon: <Gauge size={17} />,
      title: 'Risk is a hard boundary',
      copy: 'Budget, exposure, and drawdown limits stay active while the agent is running.',
    },
    {
      icon: <Zap size={17} />,
      title: 'One activation',
      copy: 'Choose a posture. Fund a budget. Let the loop run until you decide otherwise.',
    },
  ];

  return (
    <div className="app-frame landing">
      <header className="site-header">
        <Link href="/" className="brand" data-testid="link-home">
          <Logo />
        </Link>
        <div className="header-actions">
          <ThemeButton theme={theme} toggle={toggle} />
          <Link
            href="/setup"
            className="button button-primary button-sm"
            data-testid="link-header-setup"
          >
            Open console <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="landing-hero" ref={heroRef}>
          <div className="landing-glow" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow">Autonomous trading / 01</div>
            <h1 className="hero-title">
              Don't predict.
              <br />
              <span>Act.</span>
            </h1>
            <p className="hero-deck">
              PRAGMA is the calm operator for DreamDEX. Set a risk posture once.
              It scans the market, explains every decision, and executes without
              the chart-watching ritual.
            </p>
            <div className="hero-actions">
              <Link
                href="/setup"
                className="button button-primary"
                data-testid="link-start-setup"
              >
                Launch App <ArrowRight size={15} />
              </Link>
            </div>
            <div className="hero-note">
              <span className="blue-dot" /> Demo environment · DreamDEX
              connected
            </div>
          </div>

          <AgentPreview />
        </section>

        {/* Strip */}
        <motion.div
          className="landing-strip"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          data-testid="status-integrations"
        >
          <span>
            <span className="blue-dot" /> DreamDEX markets
          </span>
          <span>
            <ShieldCheck size={13} /> non-custodial controls
          </span>
          <span>
            <Activity size={13} /> decision trail
          </span>
        </motion.div>

        {/* Feature band */}
        <section className="feature-band" id="method">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="eyebrow">The operator, not the oracle</div>
            <h2>
              Quietly watching
              <br />
              the right things.
            </h2>
          </motion.div>

          <div className="feature-list">
            {features.map((f, i) => (
              <Feature key={f.title} {...f} index={i} />
            ))}
          </div>
        </section>
      </main>

      <footer className="landing-footer" data-testid="landing-footer">
        Built on Somnia Shannon Testnet · DreamDEX Event Contracts
      </footer>
    </div>
  );
}
