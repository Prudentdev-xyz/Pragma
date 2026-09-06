import { create } from 'zustand';

export type Strategy = 'conservative' | 'balanced' | 'aggressive';

interface AgentState {
  isActive: boolean;
  strategy: Strategy;
  budget: number;
  openPositions: number;
  dailyPnL: number;
  totalPnL: number;
  // Actions
  activate: (strategy: Strategy, budget: number) => void;
  deactivate: () => void;
  updatePnL: (daily: number, total: number) => void;
  setOpenPositions: (count: number) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  isActive: false,
  strategy: 'balanced',
  budget: 0,
  openPositions: 0,
  dailyPnL: 0,
  totalPnL: 0,

  activate: (strategy, budget) =>
    set({
      isActive: true,
      strategy,
      budget,
      openPositions: 0,
      dailyPnL: 0,
      totalPnL: 0,
    }),

  deactivate: () =>
    set({
      isActive: false,
      openPositions: 0,
    }),

  updatePnL: (daily, total) => set({ dailyPnL: daily, totalPnL: total }),

  setOpenPositions: (count) => set({ openPositions: count }),
}));
