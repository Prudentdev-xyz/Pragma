import { create } from 'zustand';

export interface Trade {
  id: string;
  marketId: string;
  marketName: string;
  side: 'YES' | 'NO';
  size: number;
  price: number;
  timestamp: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  pnl?: number;
}

export interface Decision {
  id: string;
  marketId: string;
  marketName: string;
  action: 'BUY' | 'SELL';
  side: 'YES' | 'NO';
  size: number;
  confidence: number;
  rationale: string;
  timestamp: number;
}

interface TradeState {
  trades: Trade[];
  decisions: Decision[];
  addTrade: (trade: Trade) => void;
  addDecision: (decision: Decision) => void;
  clearAll: () => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  trades: [],
  decisions: [],

  addTrade: (trade) =>
    set((state) => ({
      trades: [trade, ...state.trades],
    })),

  addDecision: (decision) =>
    set((state) => ({
      decisions: [decision, ...state.decisions],
    })),

  clearAll: () => set({ trades: [], decisions: [] }),
}));
