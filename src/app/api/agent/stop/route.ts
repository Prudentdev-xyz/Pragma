import { stopEngine } from '@/lib/agent/engine';

/**
 * POST /api/agent/stop — deactivate the autonomous trading loop.
 */
export async function POST() {
  try {
    const snapshot = await stopEngine();
    return Response.json({ ok: true, snapshot });
  } catch (error: any) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
