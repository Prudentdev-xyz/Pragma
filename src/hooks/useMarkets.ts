'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMarketStore } from '@/store/marketStore';
import type { Market } from '@/lib/dreamdex/markets';

const WS_URL =
  process.env.NEXT_PUBLIC_DREAMDEX_WS_URL || 'wss://stg.api.dreamdex.io/v0/ws/public';

export function useMarkets() {
  const { markets, lastUpdate, setMarkets, updateMarket } = useMarketStore();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  // REST fallback to ensure immediate initial market data
  const fetchRestMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/markets');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setMarkets(data);
      }
    } catch (err) {
      console.warn('[useMarkets] REST markets fallback error:', err);
    }
  }, [setMarkets]);

  // Connect WebSocket with exponential backoff reconnect
  const connectWs = useCallback(() => {
    if (typeof window === 'undefined' || !isMountedRef.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setIsConnected(true);
        retryCountRef.current = 0;

        // Subscribe to public market streams
        try {
          ws.send(
            JSON.stringify({
              action: 'subscribe',
              channels: ['markets', 'orderbook', 'trades'],
            }),
          );
        } catch {
          // Send failed, will reconnect
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);

          // Handle full markets payload or singular market update
          if (Array.isArray(data)) {
            setMarkets(data);
          } else if (data && typeof data === 'object') {
            if (data.type === 'markets' && Array.isArray(data.data)) {
              setMarkets(data.data);
            } else if (data.marketId || data.id) {
              const id = data.marketId || data.id;
              updateMarket(id, {
                volume24h: data.volume ?? data.volume24h,
                liquidity: data.tvl ?? data.liquidity,
              });
            }
          }
        } catch {
          // Non-JSON or ping message
        }
      };

      ws.onerror = () => {
        // Handled in onclose
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;

        // Exponential backoff: base 1s, max 30s
        const delay = Math.min(30000, 1000 * Math.pow(1.5, retryCountRef.current));
        retryCountRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          connectWs();
        }, delay);
      };
    } catch (e) {
      console.warn('[useMarkets] WebSocket connection error:', e);
      // Fallback: retry after delay
      const delay = Math.min(30000, 1000 * Math.pow(1.5, retryCountRef.current));
      retryCountRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connectWs, delay);
    }
  }, [setMarkets, updateMarket]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchRestMarkets();
    connectWs();

    // Fallback polling interval every 15s to keep markets fresh even if WS is quiet
    const pollInterval = setInterval(fetchRestMarkets, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [fetchRestMarkets, connectWs]);

  return { markets, isConnected, lastUpdate, refresh: fetchRestMarkets };
}
