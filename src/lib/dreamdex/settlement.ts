/**
 * Settlement & redemption helper — claims winnings from settled (resolved or
 * voided) prediction markets back into the agent's wallet as USDC.
 *
 * Wraps the SDK's `getClaimable` read (which shapes every redeemable position
 * for `redeemMany`) and the Trader's `redeem` / `redeemMany` writes.
 */

import { initSDK } from './client';

export interface ClaimSummary {
  marketId: string;
  pool: string;
  outcomeIdx: 0 | 1;
  amount: string;      // raw outcome-token amount
  estPayout: string;   // raw estimated collateral payout
  status: string;
}

export interface SettlementResult {
  success: boolean;
  claimed: ClaimSummary[];
  txHash?: string;
  totalPayout?: string;
  error?: string;
}

/**
 * List every position across settled binary markets that the agent can
 * currently redeem. Pure read — no transaction.
 */
export async function getClaimablePositions(): Promise<ClaimSummary[]> {
  const sdk = initSDK();
  const address = sdk.walletAddress;

  if (!address) {
    throw new Error('No authenticated wallet address (AGENT_PRIVATE_KEY missing)');
  }

  const claimable = await sdk.client.getClaimable(address);

  return claimable.map((c) => ({
    marketId: c.marketId,
    pool: c.pool,
    outcomeIdx: c.outcomeIdx,
    amount: c.amount.toString(),
    estPayout: c.estPayout.toString(),
    status: c.status,
  }));
}

/**
 * Redeem all winning positions in ONE transaction via `redeemMany`.
 * Returns a per-market claim summary plus the tx hash.
 */
export async function settleAll(): Promise<SettlementResult> {
  try {
    const sdk = initSDK();
    const address = sdk.walletAddress;
    if (!address) throw new Error('No authenticated wallet address (AGENT_PRIVATE_KEY missing)');

    const claimable = await sdk.client.getClaimable(address);
    if (claimable.length === 0) {
      return { success: true, claimed: [] };
    }

    const trader = sdk.trader;
    const result = await trader.redeemMany({
      entries: claimable.map((c) => ({
        marketId: c.marketId as `0x${string}`,
        outcomeIdx: c.outcomeIdx,
        amount: c.amount,
      })),
    });

    const claimed = claimable.map((c) => ({
      marketId: c.marketId,
      pool: c.pool,
      outcomeIdx: c.outcomeIdx,
      amount: c.amount.toString(),
      estPayout: c.estPayout.toString(),
      status: c.status,
    }));

    const totalPayout = claimable
      .reduce((sum, c) => sum + c.estPayout, BigInt(0))
      .toString();

    return { success: true, claimed, txHash: result.hash, totalPayout };
  } catch (err) {
    const error = err as Error;
    console.error('[Settlement] settleAll failed:', error.message);
    return { success: false, claimed: [], error: error.message };
  }
}

/**
 * Redeem a single market's winning position (module-routed `redeem`).
 */
export async function settleMarket(
  marketId: string,
  amount: string,
  outcomeIdx: 0 | 1,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const sdk = initSDK();
    const trader = sdk.trader;

    const result = await trader.redeem({
      marketId: marketId as `0x${string}`,
      amount: BigInt(amount),
      outcomeIdx,
    });

    return { success: true, txHash: result.hash };
  } catch (err) {
    const error = err as Error;
    console.error('[Settlement] settleMarket failed:', error.message);
    return { success: false, error: error.message };
  }
}
