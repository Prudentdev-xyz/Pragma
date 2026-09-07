'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/db/supabase';
import { useTradeStore, type Trade, type Decision } from '@/store/tradeStore';

export function useTrades() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const { trades, decisions, addTrade, setTrades, addDecision, setDecisions } =
    useTradeStore();

  const fetchLiveApiData = useCallback(async () => {
    try {
      const activeAddress =
        address ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('pragma-wallet')
          : null);

      const [tradesRes, decisionsRes] = await Promise.all([
        fetch(`/api/trades${activeAddress ? `?wallet=${activeAddress}` : ''}`),
        fetch('/api/decisions'),
      ]);

      if (tradesRes.ok) {
        const tData = await tradesRes.json();
        if (Array.isArray(tData.trades) && tData.trades.length > 0) {
          const parsedTrades: Trade[] = tData.trades.map((dbTrade: any) => ({
            id: dbTrade.id,
            marketId: dbTrade.market_id,
            marketName: dbTrade.market_id,
            action: dbTrade.action || 'BUY',
            side: (dbTrade.side?.toUpperCase() || 'YES') as 'YES' | 'NO',
            size: parseFloat(dbTrade.size?.toString() || '0'),
            price: dbTrade.entry_price
              ? parseFloat(dbTrade.entry_price.toString())
              : 0,
            entryPrice: dbTrade.entry_price
              ? parseFloat(dbTrade.entry_price.toString())
              : undefined,
            exitPrice: dbTrade.exit_price
              ? parseFloat(dbTrade.exit_price.toString())
              : undefined,
            timestamp: new Date(dbTrade.created_at).getTime(),
            status: dbTrade.status || 'open',
            pnl:
              dbTrade.pnl !== null && dbTrade.pnl !== undefined
                ? parseFloat(dbTrade.pnl.toString())
                : undefined,
            aiRationale: dbTrade.ai_rationale || undefined,
            aiConfidence: dbTrade.ai_confidence
              ? parseFloat(dbTrade.ai_confidence.toString())
              : undefined,
            txHash: dbTrade.tx_hash || undefined,
          }));
          setTrades(parsedTrades);
        }
      }

      if (decisionsRes.ok) {
        const dData = await decisionsRes.json();
        if (Array.isArray(dData.decisions) && dData.decisions.length > 0) {
          const parsedDecisions: Decision[] = dData.decisions.map((d: any) => ({
            id: d.id,
            marketId: d.market_id,
            marketName: d.market_id,
            action: d.action,
            confidence: d.confidence
              ? parseFloat(d.confidence.toString())
              : 0.5,
            rationale: d.rationale || '',
            timestamp: new Date(d.created_at).getTime(),
            outcome: d.outcome,
          }));
          setDecisions(parsedDecisions);
        }
      }
    } catch (err) {
      console.warn('[useTrades] fetchLiveApiData error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, setTrades, setDecisions]);

  useEffect(() => {
    fetchLiveApiData();
    const interval = setInterval(fetchLiveApiData, 4000);

    // Optional Supabase Real-time listener
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel('public-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trades' },
          () => fetchLiveApiData(),
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'ai_decisions' },
          () => fetchLiveApiData(),
        )
        .subscribe();
    } catch {
      // Polling handles updates
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchLiveApiData]);

  return { trades, decisions, isLoading };
}
