/**
 * AgentEngine — the autonomous trading loop.
 *
 * On a fixed cycle it:
 *   1. Pulls markets from DreamDEX.
 *   2. For each candidate market, builds a prompt and asks the AI for a
 *      decision (Groq, falling back to OpenRouter).
 *   3. Runs every risk guard against the current state.
 *   4. Executes approved orders through the SDK, then persists the trade.
 *   5. On a slower cadence, redeems settled positions (settlement).
 *
 * The engine is a process-singleton keyed by a start call — safe to call
 * `start()` more than once (idempotent).
 */

import { getTradeDecision } from '@/lib/ai/parser';
import { getPreset, STRATEGY_PRESETS, type RiskProfile } from '@/lib/strategy/presets';
import {
  evaluateTrade,
  checkExit,
  type Position,
  type RiskState,
} from '@/lib/strategy/risk';
import { executeTradeOrder } from '@/lib/dreamdex/orders';
import { settleAll } from '@/lib/dreamdex/settlement';
import { fetchMarkets, initSDK } from '@/lib/dreamdex/client';
import { insertTrade, getTradesForUser } from '@/lib/db/trades';
import { updateAgentState } from '@/lib/db/agent';
import type { TradeDecision } from '@/lib/ai/parser';

/* ─── Config ────────────────────────────────────────────────── */

export const CYCLE_MS = 60_000;         // main trading cycle
export const SETTLEMENT_EVERY = 10;      // run settlement every N cycles

/* ─── Engine state ──────────────────────────────────────────── */

export type EngineStatus =
  | { running: true; startedAt: number; cycles: number; lastCycleAt: number | null; preset: RiskProfile }
  | { running: false; stoppedAt: number | null; cycles: number; lastCycleAt: number | null; preset: RiskProfile };

export interface EngineSnapshot {
  status: EngineStatus;
  openPositions: Position[];
  dailyPnl: number;
  totalPnl: number;
  tradesToday: number;
  lastDecision?: TradeDecision;
  lastMessage: string;
}

interface EngineCore {
  status: EngineStatus;
  preset: RiskProfile;
  portfolioValue: number;
  openPositions: Position[];
  dailyPnl: number;
  totalPnl: number;
  tradesToday: number;
  dayKey: string;
  lastDecision?: TradeDecision;
  lastMessage: string;
  walletAddress: string;
}

/* ─── Singleton ─────────────────────────────────────────────── */

let engine: EngineCore | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let settleCount = 0;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get a snapshot of the current engine state (safe from API routes / UI).
 */
export function getEngineSnapshot(): EngineSnapshot | null {
  if (!engine) return null;
  const { status, openPositions, dailyPnl, totalPnl, tradesToday, lastDecision, lastMessage } = engine;
  return { status, openPositions, dailyPnl, totalPnl, tradesToday, lastDecision, lastMessage };
}

export function isEngineRunning(): boolean {
  return engine?.status.running === true;
}

/**
 * Start the autonomous loop. Idempotent — calling while running is a no-op.
 * Returns the fresh snapshot.
 */
export async function startEngine(
  opts: { preset?: RiskProfile; budget?: number } = {},
): Promise<EngineSnapshot> {
  const preset = opts.preset ?? (engine?.preset ?? 'Balanced');
  const budget = opts.budget ?? (engine?.portfolioValue ?? 2500);

  // Keep existing positions if restarting
  const existingPositions = engine?.openPositions ?? [];

  engine = {
    status: { running: true, startedAt: Date.now(), cycles: 0, lastCycleAt: null, preset },
    preset,
    portfolioValue: budget,
    openPositions: existingPositions,
    dailyPnl: engine?.dailyPnl ?? 0,
    totalPnl: engine?.totalPnl ?? 0,
    tradesToday: engine?.tradesToday ?? 0,
    dayKey: todayKey(),
    lastMessage: 'Agent started',
    walletAddress: resolveWalletAddress(),
  };

  if (timer) clearInterval(timer);
  timer = setInterval(runCycle, CYCLE_MS);
  // Fire once immediately
  runCycle();

  return getEngineSnapshot()!;
}

/**
 * Stop the loop and clear the timer.
 */
export async function stopEngine(): Promise<EngineSnapshot | null> {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (engine) {
    engine.status = {
      running: false,
      stoppedAt: Date.now(),
      cycles: engine.status.cycles,
      lastCycleAt: engine.status.lastCycleAt,
      preset: engine.preset,
    };
    engine.lastMessage = 'Agent stopped';
  }
  return getEngineSnapshot();
}

/* ─── Helpers ───────────────────────────────────────────────── */

function resolveWalletAddress(): string {
  try {
    return initSDK().walletAddress ?? '';
  } catch {
    return '';
  }
}

function formatTrades(trades: any[]): string {
  if (!trades?.length) return '';
  return trades
    .slice(0, 5)
    .map(
      (t) =>
        `${t.created_at}: ${t.action} ${t.market_id?.slice(0, 8)} size=${t.size}`,
    )
    .join('\n');
}

/* ─── Cycle ─────────────────────────────────────────────────── */

async function runCycle() {
  if (!engine || !engine.status.running) return;

  try {
    engine.status.cycles += 1;
    engine.status.lastCycleAt = Date.now();

    // Reset daily P&L on a new day
    const key = todayKey();
    if (engine.dayKey !== key) {
      engine.dayKey = key;
      engine.dailyPnl = 0;
      engine.tradesToday = 0;
    }

    // ── Settlement (periodic) ──
    settleCount += 1;
    if (settleCount >= SETTLEMENT_EVERY) {
      settleCount = 0;
      try {
        const res = await settleAll();
        if (res.success && res.claimed.length > 0) {
          engine.lastMessage = `Redeemed ${res.claimed.length} settled position(s)`;
          console.log('[Engine] settlement:', res.txHash);
        }
      } catch (e) {
        console.warn('[Engine] settlement skipped:', (e as Error).message);
      }
    }

    // ── Check existing positions for exits ──
    await evaluateExits();

    // ── Discover markets ──
    const raw = await fetchMarkets();
    const markets = Array.isArray(raw) ? raw : raw.markets ?? [];
    if (!markets.length) {
      engine.lastMessage = 'No markets available';
      return;
    }

    const preset = getPreset(engine.preset);

    // Build risk state
    const riskState: RiskState = {
      portfolioValue: engine.portfolioValue,
      openPositions: engine.openPositions,
      dailyPnl: engine.dailyPnl,
      lastTradeAt: engine.openPositions.at(-1)?.openedAt ?? null,
      lastTradeLost: engine.dailyPnl < 0,
    };

    const trades = await getTradesForUser(engine.walletAddress).catch(() => []);

    // Evaluate a bounded set of markets this cycle
    const candidates = markets.slice(0, 5);
    let acted = false;

    for (const m of candidates) {
      const market = normalizeMarket(m);
      if (!market) continue;

      const prompt = {
        market: {
          marketId: market.id,
          question: market.name,
          yesPrice: market.yesPrice,
          noPrice: market.noPrice,
          volume24h: market.volume24h ?? 0,
          liquidity: market.liquidity ?? 0,
          timeToResolution: market.expiry ? new Date(market.expiry).toISOString() : 'unknown',
        },
        preset,
        portfolioValue: engine.portfolioValue,
        openPositions: engine.openPositions.length,
        dailyPnl: engine.dailyPnl,
        recentTrades: formatTrades(trades),
      };

      const decision = await getTradeDecision(prompt);
      if (!decision) {
        engine.lastMessage = 'AI provider unavailable this cycle';
        continue;
      }
      engine.lastDecision = decision;

      const risk = evaluateTrade(decision, riskState, preset);
      if (!risk.allowed) {
        engine.lastMessage = risk.reason;
        console.log(`[Engine] ${market.id}: rejected — ${risk.reason}`);
        continue;
      }

      // HOLD is a deliberate non-trade
      if (decision.action === 'HOLD') continue;

      const side = decision.action === 'BUY_YES' ? 'YES' : 'NO';

      const exec = await executeTradeOrder({
        decision,
        poolAddress: market.pool,
        marketId: market.id,
        side,
        currentPrice: decision.action === 'BUY_YES' ? market.yesPrice : market.noPrice,
      });

      if (!exec.success) {
        engine.lastMessage = `Order failed: ${exec.error}`;
        console.error(`[Engine] ${market.id}: order failed — ${exec.error}`);
        continue;
      }

      // Record position for exit management
      const position: Position = {
        id: `${market.id}-${Date.now()}`,
        marketId: market.id,
        side,
        entryPrice: decision.action === 'BUY_YES' ? market.yesPrice : market.noPrice,
        size: decision.positionSize,
        openedAt: Date.now(),
      };
      engine.openPositions.push(position);
      engine.tradesToday += 1;

      // Persist to Supabase
      await insertTrade({
        user_id: engine.walletAddress,
        market_id: market.id,
        market_type: 'event_contract',
        action: decision.action as any,
        side,
        size: decision.positionSize,
        entry_price: position.entryPrice,
        ai_confidence: decision.confidence,
        ai_rationale: decision.rationale,
        tx_hash: exec.txHash,
      }).catch((e) => console.warn('[Engine] trade persist failed:', (e as Error).message));

      engine.lastMessage = `Executed ${decision.action} on ${market.name} (${exec.txHash})`;
      console.log(`[Engine] ${market.id}: ${decision.action} size=${decision.positionSize} tx=${exec.txHash}`);
      acted = true;
      break; // one trade per cycle keeps risk bounded
    }

    if (!acted) {
      engine.lastMessage = 'Cycle complete — no trade placed';
    }

    // Persist agent state
    persistState().catch((e) => console.warn('[Engine] state persist failed:', (e as Error).message));
  } catch (err) {
    engine.lastMessage = `Cycle error: ${(err as Error).message}`;
    console.error('[Engine] cycle error:', err);
  }
}

/* ─── Exit management ───────────────────────────────────────── */

async function evaluateExits() {
  if (!engine || !engine.openPositions.length) return;

  const remaining: Position[] = [];
  for (const pos of engine.openPositions) {
    // Fetch latest price for the position's market
    const price = await fetchCurrentPrice(pos.marketId).catch(() => null);
    if (price === null) {
      remaining.push(pos);
      continue;
    }

    const exit = checkExit(pos, price);
    if (exit === null) {
      remaining.push(pos);
      continue;
    }

    const pnl = exit === 'target'
      ? pos.size * (1 + 0.12)
      : pos.size * (1 - 0.05);
    const delta = exit === 'target' ? pos.size * 0.12 : -pos.size * 0.05;
    engine.dailyPnl += delta;
    engine.totalPnl += delta;

    engine.lastMessage = `Exited ${pos.marketId} (${exit})`;
    console.log(`[Engine] exit ${pos.marketId}: ${exit}`);
  }
  engine.openPositions = remaining;
}

/* ─── Persistence ───────────────────────────────────────────── */

async function persistState() {
  if (!engine || !engine.walletAddress) return;
  await updateAgentState(engine.walletAddress, {
    budget: engine.portfolioValue,
    daily_pnl: engine.dailyPnl,
    total_pnl: engine.totalPnl,
    open_positions: engine.openPositions,
    trades_today: engine.tradesToday,
    is_paused: !engine.status.running,
    last_trade_at: engine.openPositions.at(-1)?.openedAt
      ? new Date(engine.openPositions.at(-1)!.openedAt!).toISOString()
      : undefined,
  });
}

/* ─── Market helpers ────────────────────────────────────────── */

interface NormalizedMarket {
  id: string;
  name: string;
  pool: string;
  yesPrice: number;
  noPrice: number;
  volume24h?: number;
  liquidity?: number;
  expiry?: number;
}

function normalizeMarket(raw: any): NormalizedMarket | null {
  const id = raw.id ?? raw.marketId;
  if (!id) return null;
  const yesPrice = Number(raw.yesPrice ?? raw.yes ?? raw.bid ?? 0.5);
  const noPrice = Number(raw.noPrice ?? raw.no ?? 1 - yesPrice);
  return {
    id,
    name: raw.name ?? raw.title ?? `Market ${id.slice(0, 8)}`,
    pool: raw.pool ?? raw.poolAddress ?? raw.address,
    yesPrice: clamp(yesPrice, 0.01, 0.99),
    noPrice: clamp(noPrice, 0.01, 0.99),
    volume24h: raw.volume24h ?? raw.volume,
    liquidity: raw.liquidity ?? raw.tvl,
    expiry: raw.expiry ?? raw.expiryTimestamp,
  };
}

async function fetchCurrentPrice(marketId: string): Promise<number | null> {
  // Lightweight: reuse the market fetch to read the current book. In a fuller
  // integration this would hit getBinaryOrderBook for the live mid price.
  const raw = await fetchMarkets();
  const markets = Array.isArray(raw) ? raw : raw.markets ?? [];
  const m = markets.find((x: any) => (x.id ?? x.marketId) === marketId);
  if (!m) return null;
  return Number(m.yesPrice ?? m.yes ?? m.bid) || null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
