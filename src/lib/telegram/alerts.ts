import type { TradeDecision } from '@/lib/ai/parser';
import type { EngineSnapshot } from '@/lib/agent/engine';
import type { Position } from '@/lib/strategy/risk';

/**
 * Format a rich trade execution alert for Telegram
 */
export function formatTradeAlert(
  decision: TradeDecision,
  marketName: string,
  result: { txHash?: string },
): string {
  const confidencePct = Math.round(decision.confidence * 100);
  const hashShort = result.txHash ? `${result.txHash.slice(0, 10)}...` : 'Simulated Fill';

  return [
    `🤖 *PRAGMA Trade Executed*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🎯 *Action:* \`${decision.action}\``,
    `📊 *Market:* ${marketName}`,
    `💰 *Size:* \`${decision.positionSize} tUSDC\``,
    `📈 *Confidence:* \`${confidencePct}%\``,
    `🛑 *Stop-Loss:* \`${decision.stopLoss}\``,
    `🎯 *Take-Profit:* \`${decision.takeProfit}\``,
    `💡 *AI Rationale:*`,
    `_${decision.rationale}_`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🔗 *Tx Hash:* \`${hashShort}\``,
  ].join('\n');
}

/**
 * Format an exit / position closure alert
 */
export function formatExitAlert(
  pos: Position,
  exitType: string,
  pnl: number,
): string {
  const isProfit = pnl >= 0;
  const emoji = isProfit ? '🟢' : '🔴';
  const sign = isProfit ? '+' : '-';

  return [
    `${emoji} *PRAGMA Position Closed*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📊 *Market:* \`${pos.marketId}\``,
    `⚖️ *Exit Reason:* \`${exitType.toUpperCase()}\``,
    `💵 *Entry Size:* \`${pos.size} tUSDC\``,
    `📈 *Realized P&L:* \`${sign}$${Math.abs(pnl).toFixed(2)}\``,
  ].join('\n');
}

/**
 * Format agent status message for /status command
 */
export function formatStatusMessage(snapshot: EngineSnapshot | null): string {
  const defaultWallet = process.env.AGENT_PUBLIC_KEY
    ? `${process.env.AGENT_PUBLIC_KEY.slice(0, 6)}...${process.env.AGENT_PUBLIC_KEY.slice(-4)}`
    : 'Not configured';

  if (!snapshot) {
    return [
      `⚠️ *PRAGMA Status:* Engine is currently idle / uninitialized.`,
      `👛 *Linked Wallet:* \`${defaultWallet}\``,
      `Visit /setup on your dashboard to activate your mandate.`,
    ].join('\n');
  }

  const isRunning = snapshot.status.running;
  const statusEmoji = isRunning ? '🟢 ACTIVE' : '⏸ PAUSED';
  const pnlSign = snapshot.dailyPnl >= 0 ? '+' : '-';
  const wallet = snapshot.walletAddress || process.env.AGENT_PUBLIC_KEY || '';
  const walletShort = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : defaultWallet;

  return [
    `🤖 *PRAGMA Autonomous Agent Status*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👛 *Linked Wallet:* \`${walletShort}\``,
    `⚡ *State:* ${statusEmoji}`,
    `🛡 *Posture:* \`${snapshot.status.preset}\``,
    `💰 *Budget:* \`$${snapshot.portfolioValue} tUSDC\``,
    `🔄 *Cycles Run:* \`${snapshot.status.cycles}\``,
    `📂 *Open Positions:* \`${snapshot.openPositions.length}\``,
    `📊 *Daily P&L:* \`${pnlSign}$${Math.abs(snapshot.dailyPnl).toFixed(2)}\``,
    `📈 *Total P&L:* \`${snapshot.totalPnl >= 0 ? '+' : '-'}$${Math.abs(snapshot.totalPnl).toFixed(2)}\``,
    `💬 *Last Log:* _${snapshot.lastMessage || 'Engine operational'}_`,
  ].join('\n');
}

/**
 * Format open positions message for /positions command
 */
export function formatPositionsMessage(positions: Position[]): string {
  if (!positions || positions.length === 0) {
    return '📭 *Open Positions:* None currently active. PRAGMA is scanning for new opportunities.';
  }

  const items = positions.map((p, i) => {
    return [
      `*${i + 1}. ${p.marketId}*`,
      `   Side: \`${p.side}\` | Size: \`${p.size} USDC\` | Entry: \`$${p.entryPrice.toFixed(2)}\``,
    ].join('\n');
  });

  return [
    `📊 *PRAGMA Active Positions (${positions.length})*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ...items,
  ].join('\n');
}

/**
 * Format daily morning briefing summary
 */
export function formatMorningSummary(
  snapshot: EngineSnapshot | null,
  recentTrades: any[],
): string {
  const dailyPnl = snapshot?.dailyPnl ?? 0;
  const totalPnl = snapshot?.totalPnl ?? 0;
  const openCount = snapshot?.openPositions.length ?? 0;

  return [
    `☀️ *PRAGMA Daily Morning Briefing*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📅 *Date:* ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    `💼 *Active Positions:* \`${openCount}\``,
    `📊 *Daily P&L:* \`${dailyPnl >= 0 ? '+' : '-'}$${Math.abs(dailyPnl).toFixed(2)}\``,
    `📈 *Cumulative P&L:* \`${totalPnl >= 0 ? '+' : '-'}$${Math.abs(totalPnl).toFixed(2)}\``,
    `⚡ *Trades (24h):* \`${recentTrades.length}\``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `_PRAGMA continues autonomous execution on Somnia Testnet._`,
  ].join('\n');
}

// In-memory subscriber registry (initialized with default TELEGRAM_CHAT_ID)
const subscribers = new Set<string>();

if (process.env.TELEGRAM_CHAT_ID) {
  subscribers.add(process.env.TELEGRAM_CHAT_ID.trim());
}

export function registerSubscriber(chatId: string | number) {
  const idStr = String(chatId).trim();
  if (idStr) subscribers.add(idStr);
}

export function unregisterSubscriber(chatId: string | number) {
  const idStr = String(chatId).trim();
  if (idStr) subscribers.delete(idStr);
}

export function getSubscribers(): string[] {
  if (process.env.TELEGRAM_CHAT_ID) {
    subscribers.add(process.env.TELEGRAM_CHAT_ID.trim());
  }
  return Array.from(subscribers);
}

/**
 * Send a notification message to all subscribed Telegram chats
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChats = getSubscribers();

  if (!token || targetChats.length === 0) {
    console.log('[Telegram] Notification skipped: TELEGRAM_BOT_TOKEN or subscribers not set');
    return false;
  }

  let anySuccess = false;

  await Promise.all(
    targetChats.map(async (chatId) => {
      try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
          }),
        });

        if (res.ok) {
          anySuccess = true;
        } else {
          const err = await res.text();
          console.warn(`[Telegram] Send failed for chat ${chatId}:`, err);
        }
      } catch (err) {
        console.warn(`[Telegram] Network error sending alert to ${chatId}:`, (err as Error).message);
      }
    }),
  );

  return anySuccess;
}

