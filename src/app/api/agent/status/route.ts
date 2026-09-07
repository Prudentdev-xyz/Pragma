import { getEngineSnapshot } from '@/lib/agent/engine';

/**
 * GET /api/agent/status — read current engine snapshot.
 */
export async function GET() {
  const snapshot = getEngineSnapshot();
  return Response.json({
    ok: true,
    running: snapshot?.status.running ?? false,
    snapshot,
  });
}
