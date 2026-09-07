/**
 * AI response parser — validates raw LLM output against the
 * expected trade-decision schema using Zod.
 */

import { z } from 'zod';
import { callGroq } from './groq';
import { callOpenRouter } from './openrouter';
import type { TradeDecisionPrompt } from './prompts';

/* ─── Schema ────────────────────────────────────────────────── */

export const TradeDecisionSchema = z.object({
  action: z.enum(['BUY_YES', 'BUY_NO', 'SELL', 'HOLD']),
  confidence: z.number().min(0).max(1),
  positionSize: z.number().positive(),
  stopLoss: z.number().positive(),
  takeProfit: z.number().positive(),
  rationale: z.string().min(1),
});

export type TradeDecision = z.infer<typeof TradeDecisionSchema>;

/* ─── Safe parse helper ─────────────────────────────────────── */

function safeParse(raw: string): TradeDecision | null {
  try {
    // Strip potential markdown fences the model may wrap around JSON
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(cleaned);
    const result = TradeDecisionSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/* ─── Public API ────────────────────────────────────────────── */

/**
 * Get a validated trade decision. Tries Groq first, falls back to
 * OpenRouter if Groq fails or returns unparseable output.
 *
 * Returns null if both providers fail or produce invalid JSON.
 */
export async function getTradeDecision(
  ctx: TradeDecisionPrompt,
): Promise<TradeDecision | null> {
  // Primary: Groq
  try {
    const raw = await callGroq(ctx);
    const parsed = safeParse(raw);
    if (parsed) return parsed;
    console.warn('[AI] Groq returned unparseable response, trying OpenRouter');
  } catch (err) {
    console.warn('[AI] Groq failed:', (err as Error).message, '— falling back to OpenRouter');
  }

  // Fallback: OpenRouter
  try {
    const raw = await callOpenRouter(ctx);
    return safeParse(raw);
  } catch (err) {
    console.error('[AI] OpenRouter also failed:', (err as Error).message);
    return null;
  }
}
