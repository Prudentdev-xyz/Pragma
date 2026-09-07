'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useAccount } from 'wagmi';
import {
  ArrowRight,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Logo, ThemeButton } from '@/components/pragma-ui';
import { useTheme } from '@/hooks/use-theme';
import { WalletModal } from '@/components/wallet/WalletModal';
import { BalanceDisplay } from '@/components/wallet/BalanceDisplay';

/* ─── Types ─────────────────────────────────────────────────── */
type RiskProfile = 'Conservative' | 'Balanced' | 'Aggressive';

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/* ─── Framer Motion variants ─────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

type StrategySpec = {
  name: RiskProfile;
  copy: string;
  level: number;
  positionSize: string;
  stopLoss: string;
  markets: string;
};

const profiles: StrategySpec[] = [
  {
    name: 'Conservative',
    copy: 'Lower exposure. Wider confirmation.',
    level: 1,
    positionSize: '20%',
    stopLoss: '3%',
    markets: 'Prediction markets',
  },
  {
    name: 'Balanced',
    copy: 'Measured conviction. Default posture.',
    level: 2,
    positionSize: '40%',
    stopLoss: '5%',
    markets: 'Prediction + spot',
  },
  {
    name: 'Aggressive',
    copy: 'Faster entries. Higher variance.',
    level: 3,
    positionSize: '65%',
    stopLoss: '8%',
    markets: 'All markets',
  },
];

/* ─── Page ──────────────────────────────────────────────────── */
export default function SetupPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const mainRef = useRef<HTMLDivElement>(null);

  const [risk, setRisk] = useState<RiskProfile>('Balanced');
  const [budget, setBudget] = useState('2500');
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Wallet state from wagmi
  const { address: walletAddress, isConnected } = useAccount();

  // Persist wallet in localStorage for page reloads
  useEffect(() => {
    if (walletAddress) localStorage.setItem('pragma-wallet', walletAddress);
    else localStorage.removeItem('pragma-wallet');
  }, [walletAddress]);

  // GSAP stagger entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.setup-card', {
        opacity: 0,
        y: 32,
        stagger: 0.12,
        duration: 0.65,
        ease: 'power3.out',
        delay: 0.15,
      });
    }, mainRef);
    return () => ctx.revert();
  }, []);

  const [activating, setActivating] = useState(false);

  const activate = async () => {
    if (!walletAddress) {
      return;
    }
    setActivating(true);
    localStorage.setItem('pragma-active', 'true');
    localStorage.setItem('pragma-risk', risk);
    localStorage.setItem('pragma-budget', budget);

    try {
      // Kick off the autonomous loop on the server
      const res = await fetch('/api/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: risk,
          budget: Number(budget),
          wallet: walletAddress,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.warn('Agent start failed:', body.error);
      }
    } catch (err) {
      console.warn('Agent start request failed:', err);
    } finally {
      setActivating(false);
      router.push('/dashboard');
    }
  };

  const maxDrawdown =
    risk === 'Conservative' ? '3.0%' : risk === 'Aggressive' ? '8.0%' : '5.0%';

  return (
    <div className="app-frame">
      <header className="site-header">
        <Link href="/" className="brand" data-testid="link-setup-home">
          <Logo />
        </Link>
        <div className="header-actions">
          <ThemeButton theme={theme} toggle={toggle} />
          <Link
            href="/dashboard"
            className="button button-quiet button-sm"
            data-testid="link-preview-dashboard"
          >
            Preview dashboard <ChevronRight size={14} />
          </Link>
        </div>
      </header>

      <main className="setup-page" ref={mainRef}>
        {/* Heading */}
        <motion.div
          className="setup-head"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <div className="eyebrow">Activation sequence / 02</div>
            <h1>Give PRAGMA a mandate.</h1>
          </div>
          <p>
            No API keys. No custody handoff. Configure the boundaries, then keep
            a clear view of every move.
          </p>
        </motion.div>

        <div className="setup-layout">
          {/* Main card */}
          <section className="setup-card">
            {/* Step 1 — Wallet */}
            <div>
              <h2 className="card-title">
                <span>Connect a wallet</span>
                <span className="step-label">STEP 01 / 03</span>
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {isConnected && walletAddress ? (
                <motion.div
                  key="connected"
                  className="wallet-connected"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="wallet-left">
                    <div className="wallet-avatar">0x</div>
                    <div>
                      <div className="wallet-name">Operator wallet</div>
                      <div className="wallet-address">
                        {shortenAddress(walletAddress)}
                      </div>
                    </div>
                  </div>
                  <div className="connected-label">
                    <Check size={13} /> Connected
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="disconnected"
                  className="wallet-connect-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <div>
                    <div className="wallet-name">No wallet connected</div>
                    <p>
                      Connect MetaMask, Zerion, Phantom, Rabby, or another EVM wallet.
                    </p>
                  </div>
                  <button
                    className="button button-primary button-sm"
                    onClick={() => setWalletModalOpen(true)}
                    data-testid="button-connect-wallet"
                  >
                    Connect wallet
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="balance-line">
              <div>
                <small>Available balance</small>
                <BalanceDisplay />
              </div>
            </div>

            {/* Step 2 — Risk */}
            <div>
              <h2 className="card-title">
                <span>Choose a risk posture</span>
                <span className="step-label">STEP 02 / 03</span>
              </h2>
            </div>

            <div className="profile-grid">
              {profiles.map((profile) => (
                <motion.button
                  key={profile.name}
                  className={`profile-option ${risk === profile.name ? 'selected' : ''}`}
                  onClick={() => setRisk(profile.name)}
                  data-testid={`button-risk-${profile.name.toLowerCase()}`}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  <b>{profile.name}</b>
                  <span>{profile.copy}</span>
                  <dl className="profile-spec">
                    <div>
                      <dt>Position size</dt>
                      <dd>{profile.positionSize}</dd>
                    </div>
                    <div>
                      <dt>Stop-loss</dt>
                      <dd>{profile.stopLoss}</dd>
                    </div>
                    <div>
                      <dt>Markets</dt>
                      <dd>{profile.markets}</dd>
                    </div>
                  </dl>
                  <div className="profile-meter">
                    {[1, 2, 3].map((item) => (
                      <i key={item} className={item <= profile.level ? 'active' : ''} />
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Step 3 — Budget */}
            <div className="budget-block">
              <div className="label-row">
                <label htmlFor="budget">Trading budget</label>
                <span>tUSDC</span>
              </div>
              <input
                id="budget"
                className="budget-input"
                inputMode="decimal"
                placeholder="0"
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value.replace(/[^\d.]/g, ''))
                }
                data-testid="input-trading-budget"
              />
              <div className="budget-hint">
                Up to 65% of available balance. You can change this later.
              </div>
            </div>

            <div className="activate-row">
              <p>PRAGMA will only act within the posture and budget you set.</p>
              <motion.button
                className="button button-primary"
                onClick={activate}
                disabled={!walletAddress || !budget || Number(budget) <= 0 || activating}
                data-testid="button-activate-agent"
                whileTap={{ scale: 0.97 }}
              >
                {activating ? 'Starting…' : <>Activate Agent <ArrowRight size={15} /></>}
              </motion.button>
            </div>
          </section>

          {/* Summary aside */}
          <aside className="setup-card summary-card">
            <div className="summary-heading">Activation summary</div>
            <p className="summary-copy">
              A balanced mandate for the next trading loop.
            </p>
            <div className="summary-row">
              <span>Wallet</span>
              <b>
                {walletAddress ? shortenAddress(walletAddress) : 'Not connected'}
              </b>
            </div>
            <div className="summary-row">
              <span>Risk posture</span>
              <b className="summary-risk">{risk}</b>
            </div>
            <div className="summary-row">
              <span>Budget</span>
              <b>{budget || '0'} USDC</b>
            </div>
            <div className="summary-row">
              <span>Max drawdown</span>
              <b>{maxDrawdown}</b>
            </div>
            <div className="summary-guard">
              <ShieldCheck size={15} color="#60a5fa" />
              <span>
                Funds stay in your wallet. PRAGMA requests permission to execute
                within these limits.
              </span>
            </div>
          </aside>
        </div>
      </main>

      {/* Wallet selector modal */}
      <WalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
}
