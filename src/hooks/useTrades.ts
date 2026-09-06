'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/db/supabase';
import { getTradesForUser } from '@/lib/db/trades';
import { useTradeStore } from '@/store/tradeStore';

export function useTrades() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const { trades, addTrade } = useTradeStore();

  useEffect(() => {
    if (!isConnected || !address) {
      setIsLoading(false);
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadTrades() {
      try {
        const dbTrades = await getTradesForUser(address!);

        // Populate Zustand store with existing trades
        dbTrades.forEach((dbTrade) => {
          const trade = {
            id: dbTrade.id,
            marketId: dbTrade.market_id,
            marketName: dbTrade.market_id, // TODO: resolve name from markets
            side: (dbTrade.side?.toUpperCase() || 'YES') as 'YES' | 'NO',
            size: parseFloat(dbTrade.size.toString()),
            price: dbTrade.entry_price ? parseFloat(dbTrade.entry_price.toString()) : 0,
            timestamp: new Date(dbTrade.created_at).getTime(),
            status: (dbTrade.status as any) || 'pending',
            pnl: dbTrade.pnl ? parseFloat(dbTrade.pnl.toString()) : undefined,
          };
          addTrade(trade);
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load trades:', error);
        setIsLoading(false);
      }
    }

    loadTrades();

    // Subscribe to real-time updates on trades table
    channel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
        },
        (payload) => {
          const newTrade = payload.new as any;
          addTrade({
            id: newTrade.id,
            marketId: newTrade.market_id,
            marketName: newTrade.market_id,
            side: (newTrade.side?.toUpperCase() || 'YES') as 'YES' | 'NO',
            size: parseFloat(newTrade.size),
            price: newTrade.entry_price ? parseFloat(newTrade.entry_price) : 0,
            timestamp: new Date(newTrade.created_at).getTime(),
            status: newTrade.status || 'pending',
            pnl: newTrade.pnl ? parseFloat(newTrade.pnl) : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [address, isConnected, addTrade]);

  return { trades, isLoading };
}
