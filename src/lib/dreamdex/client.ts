// Thin wrapper around the DreamDEX REST API

export const DREAMDEX_REST = process.env.NEXT_PUBLIC_DREAMDEX_REST_URL;

export async function fetchMarkets() {
  const res = await fetch(`${DREAMDEX_REST}/markets`);
  if (!res.ok) throw new Error(`DreamDEX markets fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchOrderBook(marketId: string) {
  const res = await fetch(`${DREAMDEX_REST}/orderbook/${marketId}`);
  if (!res.ok) throw new Error(`Order book fetch failed: ${res.status}`);
  return res.json();
}
