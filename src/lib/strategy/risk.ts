/**
 * Risk Manager — enforces strategy preset limits before any trade
 * is placed or any position is held.
 *
 * All checks are pure functions over current state. The AgentEngine
 * calls these before routing a decision to order execution.
 */

import type { StrategyPreset } from './presets';
import type { TradeDecision } from '@/lib/ai/parser';

export interface Position {
  id: string;
  marketId: string;
  side: 'YES' | 'NO';
  entryPrice: number;
  size: number; // USDC committed
  openedAt: number;
}

export interface RiskState {
  portfolioValue: number;
  openPositions: Position[];
  dailyPnl: number;
  lastTradeAt: number | null;
  lastTradeLost: boolean;
}

export interface RiskCheckResult {
  allowed: boolean;
  reason: string;
}

/* ─── Individual guards ─────────────────────────────────────── */

export function withinDailyLossCap(
  dailyPnl: number,
  portfolioValue: number,
  preset: StrategyPreset,
): RiskCheckResult {
  const cap = portfolioValue * preset.dailyLossCap;
  if (dailyPnl <= -cap) {
    return {
      allowed: false,
      reason: `Daily loss cap hit: ${dailyPnl} <= -${cap}`,
    };
  }
  return { allowed: true, reason: 'Daily loss within cap' };
}

export function withinOpenPositionLimit(
  openCount: number,
  preset: StrategyPreset,
): RiskCheckResult {
  if (openCount >= preset.maxOpenPositions) {
    return {
      allowed: false,
      reason: `Open position limit reached (${openCount}/${preset.maxOpenPositions})`,
    };
  }
  return { allowed: true, reason: 'Open position slot available' };
}

export function positionSizeWithinLimit(
  desiredSize: number,
  portfolioValue: number,
  preset: StrategyPreset,
): RiskCheckResult {
  const maxSize = portfolioValue * preset.maxPositionSize;
  if (desiredSize > maxSize) {
    return {
      allowed: false,
      reason: `Position size ${desiredSize} exceeds preset max ${maxSize}`,
    };
  }
  return { allowed: true, reason: 'Position size within limit' };
}

export function confidenceMet(
  decision: TradeDecision,
  preset: StrategyPreset,
): RiskCheckResult {
  if (decision.confidence < preset.minConfidence) {
    return {
      allowed: false,
      reason: `Confidence ${decision.confidence} below threshold ${preset.minConfidence}`,
    };
  }
  return { allowed: true, reason: 'Confidence threshold met' };
}

export function cooldownElapsed(
  state: RiskState,
  preset: StrategyPreset,
): RiskCheckResult {
  // Cooldown only applies after a losing trade
  if (!state.lastTradeLost || state.lastTradeAt === null) {
    return { allowed: true, reason: 'No cooldown active' };
  }
  const elapsed = Date.now() - state.lastTradeAt;
  if (elapsed < preset.cooldownMs) {
    return {
      allowed: false,
      reason: `Cooldown active: ${Math.ceil((preset.cooldownMs - elapsed) / 1000)}s remaining`,
    };
  }
  return { allowed: true, reason: 'Cooldown elapsed' };
}

/* ─── Composite check ───────────────────────────────────────── */

/**
 * Run all risk guards for a proposed decision. Returns the first
 * failing check, or a pass if all clear.
 */
export function evaluateTrade(
  decision: TradeDecision,
  state: RiskState,
  preset: StrategyPreset,
): RiskCheckResult {
  // Skip everything if the model says HOLD — nothing to risk-check
  if (decision.action === 'HOLD') {
    return { allowed: false, reason: 'Model chose HOLD — no trade this cycle' };
  }

  const checks: RiskCheckResult[] = [
    withinDailyLossCap(state.dailyPnl, state.portfolioValue, preset),
    withinOpenPositionLimit(state.openPositions.length, preset),
    positionSizeWithinLimit(decision.positionSize, state.portfolioValue, preset),
    confidenceMet(decision, preset),
    cooldownElapsed(state, preset),
  ];

  for (const check of checks) {
    if (!check.allowed) return check;
  }

  return { allowed: true, reason: 'All risk checks passed' };
}

/**
 * Check whether an open position has hit its stop-loss or take-profit.
 * Returns the side to exit ('stop' | 'target' | null).
 */
export function checkExit(position: Position, currentPrice: number): 'stop' | 'target' | null {
  if (position.side === 'YES') {
    if (currentPrice <= position.entryPrice * (1 - 0.05)) return 'stop';
    if (currentPrice >= position.entryPrice * (1 + 0.12)) return 'target';
  } else {
    if (currentPrice >= position.entryPrice * (1 + 0.05)) return 'stop';
    if (currentPrice <= position.entryPrice * (1 - 0.12)) return 'target';
  }
  return null;
}
