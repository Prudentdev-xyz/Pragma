import { supabase } from './supabase';

export interface TradeInsert {
  user_id: string;
  market_id: string;
  market_type: 'spot' | 'event_contract';
  action: 'BUY' | 'SELL' | 'BUY_UP' | 'BUY_DOWN' | 'EXIT';
  side?: string;
  size: number;
  entry_price?: number;
  ai_confidence?: number;
  ai_rationale?: string;
  tx_hash?: string;
}

export async function insertTrade(trade: TradeInsert) {
  const { data, error } = await supabase
    .from('trades')
    .insert(trade)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTradesForUser(walletAddress: string) {
  // First get the user_id
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!user) return [];

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateTradeOutcome(
  id: string,
  exitPrice: number,
  pnl: number
) {
  const { data, error } = await supabase
    .from('trades')
    .update({
      exit_price: exitPrice,
      pnl,
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
