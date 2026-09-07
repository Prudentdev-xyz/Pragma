/**
 * Groq API client — primary AI provider for trade decisions.
 *
 * Uses llama-3.3-70b-versatile with temperature 0.2 for structured output.
 * Returns raw string response; parsing is handled by parser.ts.
 */

import { systemPrompt, tradeDecisionPrompt, type TradeDecisionPrompt } from './prompts';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function groqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set');
  return key;
}

/**
 * Call Groq for a trade decision.
 * Returns the raw JSON string from the model.
 */
export async function callGroq(ctx: TradeDecisionPrompt): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
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
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
