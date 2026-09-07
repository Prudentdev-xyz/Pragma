import { getTradesForUser } from '@/lib/db/trades';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet') || undefined;

  const trades = await getTradesForUser(wallet);
  return Response.json({ ok: true, trades });
}
