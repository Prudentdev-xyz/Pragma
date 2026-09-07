import { create } from 'zustand';

export type Strategy = 'conservative' | 'balanced' | 'aggressive';

export interface Position {
  id: string;
  marketId: string;
  marketName?: string;
  side: 'YES' | 'NO' | 'BUY' | 'SELL' | 'UP' | 'DOWN';
  entryPrice: number;
  currentPrice?: number;
  size: number;
  openedAt: number;
  unrealizedPnl?: number;
}

interface AgentState {
  isActive: boolean;
  strategy: Strategy;
  budget: number;
  openPositions: Position[];
  dailyPnL: number;
  totalPnL: number;
  // Actions
  activate: (strategy: Strategy, budget: number) => void;
  deactivate: () => void;
  updatePnL: (daily: number, total: number) => void;
  setOpenPositions: (positionsOrCount: Position[] | number) => void;
  addPosition: (position: Position) => void;
  removePosition: (id: string) => void;
  setStrategy: (strategy: Strategy) => void;
  setBudget: (budget: number) => void;
  setIsActive: (active: boolean) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  isActive: false,
  strategy: 'balanced',
  budget: 0,
  openPositions: [],
  dailyPnL: 0,
  totalPnL: 0,

  activate: (strategy, budget) =>
    set({
      isActive: true,
      strategy,
      budget,
      openPositions: [],
      dailyPnL: 0,
      totalPnL: 0,
    }),

  deactivate: () =>
    set({
      isActive: false,
    }),

  updatePnL: (daily, total) => set({ dailyPnL: daily, totalPnL: total }),

  setOpenPositions: (positionsOrCount) =>
    set({
      openPositions: Array.isArray(positionsOrCount)
        ? positionsOrCount
        : [],
    }),

  addPosition: (position) =>
    set((state) => ({
      openPositions: [position, ...state.openPositions.filter((p) => p.id !== position.id)],
    })),

  removePosition: (id) =>
    set((state) => ({
      openPositions: state.openPositions.filter((p) => p.id !== id),
    })),

  setStrategy: (strategy) => set({ strategy }),
  setBudget: (budget) => set({ budget }),
  setIsActive: (isActive) => set({ isActive }),
}));
