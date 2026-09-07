/**
 * Strategy Presets — Conservative / Balanced / Aggressive
 *
 * Each preset defines risk parameters the AgentEngine and Risk Manager
 * use to size positions, set stop-losses, and throttle exposure.
 */

export type RiskProfile = 'Conservative' | 'Balanced' | 'Aggressive';

export interface StrategyPreset {
  name: RiskProfile;
  /** Maximum single-position size as fraction of portfolio */
  maxPositionSize: number;
  /** Daily loss cap as fraction of portfolio (0.05 = 5%) */
  dailyLossCap: number;
  /** Stop-loss threshold per position (0.03 = 3%) */
  stopLoss: number;
  /** Take-profit target per position (0.10 = 10%) */
  takeProfit: number;
  /** Maximum concurrent open positions */
  maxOpenPositions: number;
  /** Cooldown in ms after a losing trade */
  cooldownMs: number;
  /** Confidence threshold for AI to act (0–1) */
  minConfidence: number;
  /** Allowed market categories */
  allowedMarkets: ('prediction' | 'spot' | 'all')[];
  /** Human-readable description */
  description: string;
}

export const STRATEGY_PRESETS: Record<RiskProfile, StrategyPreset> = {
  Conservative: {
    name: 'Conservative',
    maxPositionSize: 0.2,
    dailyLossCap: 0.03,
    stopLoss: 0.03,
    takeProfit: 0.08,
    maxOpenPositions: 2,
    cooldownMs: 5 * 60_000, // 5 min
    minConfidence: 0.75,
    allowedMarkets: ['prediction'],
    description:
      'Lower exposure. Wider confirmation. Targets prediction markets only with tight loss controls.',
  },
  Balanced: {
    name: 'Balanced',
    maxPositionSize: 0.4,
    dailyLossCap: 0.05,
    stopLoss: 0.05,
    takeProfit: 0.12,
    maxOpenPositions: 3,
    cooldownMs: 3 * 60_000, // 3 min
    minConfidence: 0.6,
    allowedMarkets: ['prediction', 'spot'],
    description:
      'Measured conviction. Default posture. Balances risk across prediction and spot markets.',
  },
  Aggressive: {
    name: 'Aggressive',
    maxPositionSize: 0.65,
    dailyLossCap: 0.08,
    stopLoss: 0.08,
    takeProfit: 0.2,
    maxOpenPositions: 5,
    cooldownMs: 1 * 60_000, // 1 min
    minConfidence: 0.45,
    allowedMarkets: ['all'],
    description:
      'Faster entries. Higher variance. Deploys across all available markets with higher risk tolerance.',
  },
};

/** Safely retrieve a preset by name, falling back to Balanced */
export function getPreset(name: string): StrategyPreset {
  return STRATEGY_PRESETS[name as RiskProfile] ?? STRATEGY_PRESETS.Balanced;
}
