import { fetchMarkets } from '@/lib/dreamdex/client';

export async function GET() {
  try {
    const markets = await fetchMarkets();
    return Response.json(markets);
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}
