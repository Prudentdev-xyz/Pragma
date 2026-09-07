/**
 * Trade execution helper — routes trade decisions to DreamDEX SDK orders.
 *
 * Handles binary pool orders (prediction markets) and spot orders via the
 * Trader client from SomniaMarkets SDK.
 */

import { initSDK } from './client';
import type { TradeDecision } from '@/lib/ai/parser';

/* ─── Types ────────────────────────────────────────────────── */

export interface ExecuteTradeParams {
  decision: TradeDecision;
  poolAddress: string;        // BinaryPool or SpotPool address
  marketId: string;
  side: 'YES' | 'NO';
  currentPrice: number;       // Current market price for price calculation
  collateralDecimals?: number; // Default 6 (USDC)
}

export interface TradeExecutionResult {
  success: boolean;
  orderId?: string;
  txHash?: string;
  error?: string;
  fills: Array<{
    price: number;
    quantity: number;
    side: string;
  }>;
}

/* ─── Helpers ──────────────────────────────────────────────── */

/**
 * Convert a human-readable price to raw bigint units (price × 10^decimals).
 * DreamDEX expects raw collateral units per whole outcome token.
 */
function priceToRaw(price: number, decimals: number = 6): bigint {
  return BigInt(Math.round(price * 10 ** decimals));
}

/**
 * Convert a position size (USDC) to raw token quantity.
 * Quantity = positionSize / currentPrice (tokens received)
 */
function sizeToQuantity(positionSize: number, currentPrice: number, decimals: number = 6): bigint {
  const tokens = positionSize / currentPrice;
  return BigInt(Math.round(tokens * 10 ** decimals));
}

/**
 * Map decision.action + side to SDK BinarySide.
 */
function mapSide(
  action: TradeDecision['action'],
  side: 'YES' | 'NO',
): 'BUY_YES' | 'BUY_NO' | 'SELL_YES' | 'SELL_NO' {
  if (action === 'BUY_YES') return 'BUY_YES';
  if (action === 'BUY_NO') return 'BUY_NO';
  // For SELL action, determine based on which side we're closing
  return side === 'YES' ? 'SELL_YES' : 'SELL_NO';
}

/* ─── Main execution function ──────────────────────────────── */

/**
 * Execute a trade order on DreamDEX.
 *
 * Maps the AI decision to SDK PlaceOrderParams and submits via Trader.
 * Returns structured result with tx status and fills.
 */
export async function executeTradeOrder(
  params: ExecuteTradeParams,
): Promise<TradeExecutionResult> {
  const {
    decision,
    poolAddress,
    side,
    currentPrice,
    collateralDecimals = 6,
  } = params;

  try {
    // Initialize SDK client
    const sdk = initSDK();
    const trader = sdk.trader;

    // Skip HOLD — nothing to execute
    if (decision.action === 'HOLD') {
      return {
        success: true,
        fills: [],
      };
    }

    // Calculate order parameters
    const priceRaw = priceToRaw(currentPrice, collateralDecimals);
    const quantityRaw = sizeToQuantity(decision.positionSize, currentPrice, collateralDecimals);

    // Map to SDK side format
    const sdkSide = mapSide(decision.action, side);

    // Build order params
    const orderParams = {
      pool: poolAddress as `0x${string}`,
      side: sdkSide,
      price: priceRaw,
      quantity: quantityRaw,
      autoApprove: true,
    };

    // Execute via SDK Trader
    const result = await trader.placeOrder(orderParams);

    // Parse fills
    const fills = result.fills.map((fill) => ({
      price: Number(fill.fillPrice) / 10 ** collateralDecimals,
      quantity: Number(fill.quantityFilled) / 10 ** collateralDecimals,
      side: sdkSide,
    }));

    return {
      success: true,
      orderId: result.orderId?.toString(),
      txHash: result.hash,
      fills,
    };
  } catch (err) {
    const error = err as Error;
    console.error('[Orders] Execution failed:', error.message);
    return {
      success: false,
      error: error.message,
      fills: [],
    };
  }
}

/**
 * Cancel a resting order on DreamDEX.
 */
export async function cancelOrder(
  poolAddress: string,
  orderId: string,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const sdk = initSDK();
    const trader = sdk.trader;

    const result = await trader.cancelOrder({
      pool: poolAddress as `0x${string}`,
      orderId: BigInt(orderId),
    });

    return {
      success: true,
      txHash: result.hash,
    };
  } catch (err) {
    const error = err as Error;
    console.error('[Orders] Cancel failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
