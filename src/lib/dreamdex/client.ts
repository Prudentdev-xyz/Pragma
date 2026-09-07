// DreamDEX SDK client + REST wrapper
import { SomniaMarkets } from '@somnia-chain/markets-sdk';
import { somniaShannon } from '@somnia-chain/markets-sdk/chains';
import { privateKeyToAccount } from 'viem/accounts';

export const DREAMDEX_REST = process.env.NEXT_PUBLIC_DREAMDEX_REST_URL;

// Initialize SDK client for on-chain trading
export function initSDK() {
  if (!process.env.AGENT_PRIVATE_KEY) {
    throw new Error('AGENT_PRIVATE_KEY is required');
  }

  const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`);

  return new SomniaMarkets({
    indexerUrl: process.env.NEXT_PUBLIC_DREAMDEX_INDEXER_URL || '/v1/graphql',
    chain: somniaShannon,
    wsRpcUrl: process.env.NEXT_PUBLIC_DREAMDEX_WS_URL || 'wss://dream-rpc.somnia.network/ws',
    account,
  });
}

// REST API wrappers (for market discovery)
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
