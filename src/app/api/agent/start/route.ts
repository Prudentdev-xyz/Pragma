import { startEngine, getEngineSnapshot } from '@/lib/agent/engine';
import { launchBotPolling } from '@/lib/telegram/bot';

/**
 * POST /api/agent/start — activate the autonomous trading loop.
 *
 * Body: { preset?: 'Conservative' | 'Balanced' | 'Aggressive', budget?: number }
 */
export async function POST(req: Request) {
  try {
    let preset: string | undefined;
    let budget: number | undefined;
    let wallet: string | undefined;

    try {
      const body = await req.json();
      preset = body?.preset;
      budget = body?.budget ? Number(body.budget) : undefined;
      wallet = body?.wallet;
    } catch {
      // no body — use defaults
    }

    if (budget !== undefined && (Number.isNaN(budget) || budget <= 0)) {
      return Response.json({ error: 'budget must be a positive number' }, { status: 400 });
    }

    await startEngine({
      preset: preset as any,
      budget,
      wallet,
    });

    // Start telegram bot polling in dev
    launchBotPolling();

    return Response.json({ ok: true, snapshot: getEngineSnapshot() });
  } catch (error: any) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

