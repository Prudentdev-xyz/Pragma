import { create } from 'zustand';
import type { Market } from '@/lib/dreamdex/markets';

export interface MarketPriceUpdate {
  marketId: string;
  price: number;
  timestamp: number;
}

interface MarketState {
  markets: Market[];
  lastUpdate: number | null;
  setMarkets: (markets: Market[]) => void;
  updateMarket: (marketId: string, patch: Partial<Market>) => void;
  getMarket: (marketId: string) => Market | undefined;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  markets: [],
  lastUpdate: null,

  setMarkets: (markets) =>
    set({
      markets,
      lastUpdate: Date.now(),
    }),

  updateMarket: (marketId, patch) =>
    set((state) => ({
      markets: state.markets.map((m) =>
        m.id === marketId ? { ...m, ...patch } : m,
      ),
      lastUpdate: Date.now(),
    })),

  getMarket: (marketId) => get().markets.find((m) => m.id === marketId),
}));
