import { getEngineSnapshot } from '@/lib/agent/engine';
import { getTradesForUser } from '@/lib/db/trades';
import { formatMorningSummary, sendTelegramMessage } from '@/lib/telegram/alerts';

/**
 * GET /api/cron/morning-summary
 * Triggered daily (e.g. 08:00 UTC) or manually to dispatch the morning performance briefing.
 */
export async function GET() {
  try {
    const snapshot = getEngineSnapshot();
    const trades = await getTradesForUser(snapshot?.status ? undefined : undefined);
    const summary = formatMorningSummary(snapshot, trades);

    const sent = await sendTelegramMessage(summary);

    return Response.json({
      ok: true,
      delivered: sent,
      summary,
    });
  } catch (err) {
    console.error('[/api/cron/morning-summary] error:', err);
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
