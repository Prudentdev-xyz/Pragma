// Parse markets from REST response, separate spot vs event contracts

export interface Market {
  id: string;
  name: string;
  type: 'spot' | 'event';
  category?: string;
  expiry?: number;
  volume24h?: number;
  liquidity?: number;
}

export function parseMarkets(raw: unknown[]): Market[] {
  if (!Array.isArray(raw)) {
    throw new Error('Markets response must be an array');
  }

  return raw.map((item: any) => ({
    id: item.id ?? item.marketId ?? '',
    name: item.name ?? item.title ?? '',
    type: isEventContract(item) ? 'event' : 'spot',
    category: item.category,
    expiry: item.expiry ?? item.expiryTimestamp,
    volume24h: item.volume24h ?? item.volume,
    liquidity: item.liquidity ?? item.tvl,
  }));
}

export function isEventContract(market: any): boolean {
  // Event contracts typically have:
  // - expiry timestamp
  // - category/type field indicating prediction/event
  // - binary outcomes (YES/NO)
  return !!(
    market.expiry ||
    market.expiryTimestamp ||
    market.type === 'event' ||
    market.type === 'prediction' ||
    market.category === 'event' ||
    market.outcomes?.length === 2
  );
}
