import { supabaseServer } from './supabase';

export interface TradeInsert {
  user_id?: string;
  market_id: string;
  market_type: 'spot' | 'event_contract';
  action: string;
  side?: string;
  size: number;
  entry_price?: number;
  exit_price?: number;
  pnl?: number;
  ai_confidence?: number;
  ai_rationale?: string;
  tx_hash?: string;
}

export interface DecisionInsert {
  user_id?: string;
  market_id: string;
  action: string;
  confidence?: number;
  rationale?: string;
  market_context?: any;
  outcome?: string;
}

export async function insertTrade(trade: TradeInsert) {
  let resolvedUserId: string | null = null;

  if (trade.user_id && trade.user_id.startsWith('0x')) {
    try {
      const { data: user } = await supabaseServer
        .from('users')
        .upsert(
          { wallet_address: trade.user_id, updated_at: new Date().toISOString() },
          { onConflict: 'wallet_address' },
        )
        .select('id')
        .single();
      if (user?.id) resolvedUserId = user.id;
    } catch {
      resolvedUserId = null;
    }
  }

  const { data, error } = await supabaseServer
    .from('trades')
    .insert({
      ...trade,
      user_id: resolvedUserId,
      status: 'open',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertDecision(decision: DecisionInsert) {
  let resolvedUserId: string | null = null;

  if (decision.user_id && decision.user_id.startsWith('0x')) {
    try {
      const { data: user } = await supabaseServer
        .from('users')
        .select('id')
        .eq('wallet_address', decision.user_id)
        .single();
      if (user?.id) resolvedUserId = user.id;
    } catch {
      resolvedUserId = null;
    }
  }

  const { data, error } = await supabaseServer
    .from('ai_decisions')
    .insert({
      ...decision,
      user_id: resolvedUserId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTradesForUser(walletAddress?: string) {
  try {
    let query = supabaseServer
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (walletAddress && walletAddress.startsWith('0x')) {
      const { data: user } = await supabaseServer
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single();

      if (user?.id) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[Trades] getTradesForUser error:', err);
    return [];
  }
}

export async function updateTradeOutcome(
  id: string,
  exitPrice: number,
  pnl: number,
) {
  const { data, error } = await supabaseServer
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
