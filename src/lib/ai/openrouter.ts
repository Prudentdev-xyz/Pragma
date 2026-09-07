/**
 * OpenRouter API client — fallback AI provider.
 *
 * Activates when Groq is rate-limited or unavailable.
 * Uses the same prompt structure via prompts.ts.
 */

import { systemPrompt, tradeDecisionPrompt, type TradeDecisionPrompt } from './prompts';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

function openrouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is not set');
  return key;
}

/**
 * Call OpenRouter for a trade decision.
 * Returns the raw JSON string from the model.
 */
export async function callOpenRouter(ctx: TradeDecisionPrompt): Promise<string> {
  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openrouterApiKey()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://pragma-trading.app',
      'X-Title': 'PRAGMA Trading Agent',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: tradeDecisionPrompt(ctx) },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
