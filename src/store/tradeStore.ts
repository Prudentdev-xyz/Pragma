import { create } from 'zustand';

export interface Trade {
  id: string;
  marketId: string;
  marketName?: string;
  action?: string;
  side: 'YES' | 'NO';
  size: number;
  price: number;
  entryPrice?: number;
  exitPrice?: number;
  timestamp: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired' | 'open' | 'closed' | 'settled';
  pnl?: number;
  aiRationale?: string;
  aiConfidence?: number;
  txHash?: string;
}

export interface Decision {
  id: string;
  marketId: string;
  marketName?: string;
  action: 'BUY' | 'SELL' | 'BUY_YES' | 'BUY_NO' | 'HOLD';
  side?: 'YES' | 'NO';
  size?: number;
  confidence: number;
  rationale: string;
  timestamp: number;
  outcome?: 'executed' | 'skipped' | 'rejected' | 'pending';
}

interface TradeState {
  trades: Trade[];
  decisions: Decision[];
  addTrade: (trade: Trade) => void;
  setTrades: (trades: Trade[]) => void;
  addDecision: (decision: Decision) => void;
  setDecisions: (decisions: Decision[]) => void;
  clearAll: () => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  trades: [],
  decisions: [],

  addTrade: (trade) =>
    set((state) => ({
      trades: [trade, ...state.trades.filter((t) => t.id !== trade.id)],
    })),

  setTrades: (trades) => set({ trades }),

  addDecision: (decision) =>
    set((state) => ({
      decisions: [decision, ...state.decisions.filter((d) => d.id !== decision.id)].slice(0, 50),
    })),

  setDecisions: (decisions) => set({ decisions }),

  clearAll: () => set({ trades: [], decisions: [] }),
}));
