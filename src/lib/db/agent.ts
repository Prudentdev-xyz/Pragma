import { supabase } from './supabase';

export interface AgentStateUpdate {
  budget?: number;
  daily_pnl?: number;
  total_pnl?: number;
  open_positions?: any[];
  trades_today?: number;
  is_paused?: boolean;
  last_trade_at?: string;
}

export async function upsertUser(walletAddress: string, strategy: string) {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        wallet_address: walletAddress,
        strategy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'wallet_address' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAgentState(walletAddress: string) {
  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!user) return null;

  // Get agent state
  const { data, error } = await supabase
    .from('agent_state')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateAgentState(
  walletAddress: string,
  state: AgentStateUpdate
) {
  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!user) throw new Error('User not found');

  // Upsert agent state
  const { data, error } = await supabase
    .from('agent_state')
    .upsert(
      {
        user_id: user.id,
        ...state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
