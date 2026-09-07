/**
 * Prompt templates for the AI decision layer.
 *
 * These are injected into the system/user messages sent to Groq (primary)
 * or OpenRouter (fallback). Each prompt is a plain function returning
 * structured text — no API calls here.
 */

import type { StrategyPreset } from '@/lib/strategy/presets';

export interface MarketContext {
  marketId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  volume24h: number;
  liquidity: number;
  timeToResolution: string;
}

export interface TradeDecisionPrompt {
  market: MarketContext;
  preset: StrategyPreset;
  portfolioValue: number;
  openPositions: number;
  dailyPnl: number;
  recentTrades: string;
}

/**
 * Build the system message that sets the agent's persona and output schema.
 */
export function systemPrompt(): string {
  return `You are PRAGMA, an autonomous trading agent operating on DreamDEX (Somnia Shannon Testnet).

Your role: evaluate prediction and spot markets and output structured trading decisions.

Rules:
- Never exceed the position size, stop-loss, or daily loss cap from the strategy preset.
- Only act when confidence meets or exceeds the preset threshold.
- Every decision must include a concise rationale (1-2 sentences).
- Output ONLY valid JSON matching the response schema. No markdown, no commentary.

Response schema:
{
  "action": "BUY_YES" | "BUY_NO" | "SELL" | "HOLD",
  "confidence": 0.0 to 1.0,
  "positionSize": <number in USDC>,
  "stopLoss": <price>,
  "takeProfit": <price>,
  "rationale": "<string>"
}`;
}

/**
 * Build the user message containing market data and portfolio state.
 */
export function tradeDecisionPrompt(ctx: TradeDecisionPrompt): string {
  return `## Market Data
- Market ID: ${ctx.market.marketId}
- Question: ${ctx.market.question}
- Yes Price: ${ctx.market.yesPrice}
- No Price: ${ctx.market.noPrice}
- 24h Volume: ${ctx.market.volume24h} USDC
- Liquidity: ${ctx.market.liquidity} USDC
- Time to Resolution: ${ctx.market.timeToResolution}

## Strategy Preset: ${ctx.preset.name}
- Max Position Size: ${ctx.preset.maxPositionSize * 100}% of portfolio
- Stop-Loss: ${ctx.preset.stopLoss * 100}%
- Take-Profit: ${ctx.preset.takeProfit * 100}%
- Max Open Positions: ${ctx.preset.maxOpenPositions}
- Min Confidence: ${ctx.preset.minConfidence}

## Portfolio State
- Portfolio Value: ${ctx.portfolioValue} USDC
- Open Positions: ${ctx.openPositions}
- Daily P&L: ${ctx.dailyPnl} USDC

## Recent Trades
${ctx.recentTrades || 'No recent trades.'}

Evaluate this market and return your trading decision as JSON.`;
}
