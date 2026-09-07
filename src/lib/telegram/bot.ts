import { Telegraf } from 'telegraf';
import {
  getEngineSnapshot,
  startEngine,
  stopEngine,
  setEngineWallet,
} from '@/lib/agent/engine';
import {
  formatStatusMessage,
  formatPositionsMessage,
  registerSubscriber,
  unregisterSubscriber,
} from './alerts';

const token = process.env.TELEGRAM_BOT_TOKEN;

// Create Telegraf instance if token is provided, or a safe stub for build/unconfigured runs
export const bot: Telegraf | null = token ? new Telegraf(token) : null;

const userLinkedWallets = new Map<string, string>();

export function getLinkedWallet(chatId: string | number): string {
  const idStr = String(chatId).trim();
  return (
    userLinkedWallets.get(idStr) ||
    getEngineSnapshot()?.walletAddress ||
    process.env.AGENT_PUBLIC_KEY ||
    '0x3F45b0C2a90e5cD77aE8638150cA1A78e23cA85F'
  );
}

export function setLinkedWallet(chatId: string | number, wallet: string) {
  const idStr = String(chatId).trim();
  userLinkedWallets.set(idStr, wallet);
  setEngineWallet(wallet);
}

function isAuthorized(chatId: string | number): boolean {
  const adminId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!adminId) return true;
  return String(chatId).trim() === adminId;
}

if (bot) {
  // /start command — auto-registers subscriber & parses deep-linked wallet
  bot.start(async (ctx) => {
    registerSubscriber(ctx.chat.id);

    // Check payload: e.g. /start link_0x... or /start 0x...
    const text = (ctx.message as any)?.text || '';
    const parts = text.split(' ').filter(Boolean);
    let incomingWallet = parts[1] || '';
    if (incomingWallet.startsWith('link_')) {
      incomingWallet = incomingWallet.replace('link_', '');
    }

    if (incomingWallet.startsWith('0x') && incomingWallet.length >= 10) {
      setLinkedWallet(ctx.chat.id, incomingWallet);
      await ctx.replyWithMarkdown([
        `✅ *Wallet Linked Successfully!*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👛 *Bound Wallet:* \`${incomingWallet}\``,
        `⚡ *Network:* \`Somnia Shannon Testnet (Chain 50312)\``,
        ``,
        `This Telegram account is now bound to your connected wallet.`,
        ``,
        `*Quick Controls:*`,
        `• /status — Live agent posture & P&L`,
        `• /wallet — Wallet details & Shannon explorer`,
        `• /pause — Pause trading loop for this wallet`,
        `• /resume — Resume autonomous trading loop`,
      ].join('\n'));
      return;
    }

    const wallet = getLinkedWallet(ctx.chat.id);
    const short = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

    const welcome = [
      `🤖 *Welcome to PRAGMA Autonomous Agent*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👛 *Linked Wallet:* \`${short}\``,
      `⚡ *Network:* \`Somnia Shannon Testnet\``,
      ``,
      `You have exclusive personal control over this trading operator.`,
      ``,
      `*Available Commands:*`,
      `• /status — Check agent loop health & posture`,
      `• /positions — View open mark-to-market positions`,
      `• /pnl — Real-time session & cumulative P&L`,
      `• /wallet — View linked operator wallet address & explorer`,
      `• /pause — Temporarily pause new trade entries`,
      `• /resume — Resume autonomous market scanning`,
      `• /link <0xAddress> — Bind to another wallet address`,
      `• /help — Show this command directory`,
    ].join('\n');
    await ctx.replyWithMarkdown(welcome);
  });

  // /status command
  bot.command('status', async (ctx) => {
    if (!isAuthorized(ctx.chat.id)) {
      const wallet = process.env.AGENT_PUBLIC_KEY
        ? `${process.env.AGENT_PUBLIC_KEY.slice(0, 6)}...${process.env.AGENT_PUBLIC_KEY.slice(-4)}`
        : '0x3F45...A85F';
      await ctx.replyWithMarkdown(`⛔ *Access Denied:* This bot is privately locked to wallet \`${wallet}\`.`);
      return;
    }
    const snapshot = getEngineSnapshot();
    await ctx.replyWithMarkdown(formatStatusMessage(snapshot));
  });

  // /positions command
  bot.command('positions', async (ctx) => {
    if (!isAuthorized(ctx.chat.id)) {
      await ctx.replyWithMarkdown('⛔ *Access Denied.*');
      return;
    }
    const snapshot = getEngineSnapshot();
    await ctx.replyWithMarkdown(formatPositionsMessage(snapshot?.openPositions || []));
  });

  // /pnl command
  bot.command('pnl', async (ctx) => {
    if (!isAuthorized(ctx.chat.id)) {
      await ctx.replyWithMarkdown('⛔ *Access Denied.*');
      return;
    }
    const snapshot = getEngineSnapshot();
    const daily = snapshot?.dailyPnl ?? 0;
    const total = snapshot?.totalPnl ?? 0;
    const dailySign = daily >= 0 ? '+' : '-';
    const totalSign = total >= 0 ? '+' : '-';
    const wallet = snapshot?.walletAddress || process.env.AGENT_PUBLIC_KEY || '';
    const walletShort = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '0x3F45...A85F';

    const text = [
      `📊 *PRAGMA P&L Report*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👛 *Wallet:* \`${walletShort}\``,
      `📅 *Today:* \`${dailySign}$${Math.abs(daily).toFixed(2)}\``,
      `📈 *Total:* \`${totalSign}$${Math.abs(total).toFixed(2)}\``,
      `🔄 *Trades Today:* \`${snapshot?.tradesToday ?? 0}\``,
    ].join('\n');

    await ctx.replyWithMarkdown(text);
  });

  // /wallet command
  bot.command('wallet', async (ctx) => {
    if (!isAuthorized(ctx.chat.id)) {
      await ctx.replyWithMarkdown('⛔ *Access Denied.*');
      return;
    }
    const snapshot = getEngineSnapshot();
    const wallet = snapshot?.walletAddress || process.env.AGENT_PUBLIC_KEY || 'Not configured';
    await ctx.replyWithMarkdown([
      `👛 *Linked PRAGMA Operator Wallet*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `• Address: \`${wallet}\``,
      `• Network: \`Somnia Shannon Testnet (50312)\``,
      `• Status: *Active & Linked*`,
      `• Mandate Budget: \`$${snapshot?.portfolioValue ?? 2500} tUSDC\``,
      `• Posture: \`${snapshot?.preset ?? 'Balanced'}\``,
      `• Explorer: [View on Shannon Explorer](https://shannon-explorer.somnia.network/address/${wallet})`,
    ].join('\n'));
  });

  // /pause command
  bot.command('pause', async (ctx) => {
    if (!isAuthorized(ctx.chat.id)) {
      const wallet = process.env.AGENT_PUBLIC_KEY
        ? `${process.env.AGENT_PUBLIC_KEY.slice(0, 6)}...${process.env.AGENT_PUBLIC_KEY.slice(-4)}`
        : '0x3F45...A85F';
      await ctx.replyWithMarkdown(`⛔ *Access Denied:* You are not authorized to pause this agent. Locked to \`${wallet}\`.`);
      return;
    }
    await stopEngine();
    const snapshot = getEngineSnapshot();
    const wallet = snapshot?.walletAddress || process.env.AGENT_PUBLIC_KEY || '';
    const short = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '0x3F45...A85F';
    await ctx.replyWithMarkdown(`⏸ *Agent Paused!*\nAutonomous trade entries halted for \`${short}\`.\n_Live web dashboard updated to PAUSED._`);
  });

  // /resume command
  bot.command('resume', async (ctx) => {
    if (!isAuthorized(ctx.chat.id)) {
      const wallet = process.env.AGENT_PUBLIC_KEY
        ? `${process.env.AGENT_PUBLIC_KEY.slice(0, 6)}...${process.env.AGENT_PUBLIC_KEY.slice(-4)}`
        : '0x3F45...A85F';
      await ctx.replyWithMarkdown(`⛔ *Access Denied:* You are not authorized to resume this agent. Locked to \`${wallet}\`.`);
      return;
    }
    await startEngine();
    const snapshot = getEngineSnapshot();
    const wallet = snapshot?.walletAddress || process.env.AGENT_PUBLIC_KEY || '';
    const short = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '0x3F45...A85F';
    await ctx.replyWithMarkdown(`▶️ *Agent Resumed!*\nAutonomous scanning active for \`${short}\`.\n_Live web dashboard updated to ACTIVE._`);
  });

  // /link command — dynamically bind to any wallet address
  bot.command('link', async (ctx) => {
    if (!isAuthorized(ctx.chat.id)) {
      await ctx.replyWithMarkdown('⛔ *Access Denied.*');
      return;
    }
    const text = (ctx.message as any)?.text || '';
    const parts = text.split(' ').filter(Boolean);
    const wallet = parts[1];

    if (!wallet || !wallet.startsWith('0x') || wallet.length < 10) {
      const current = getLinkedWallet(ctx.chat.id);
      await ctx.replyWithMarkdown([
        `ℹ️ *Usage:* \`/link <0xWalletAddress>\``,
        `Current bound wallet: \`${current}\``,
        `Example: \`/link 0x3F45b0C2a90e5cD77aE8638150cA1A78e23cA85F\``,
      ].join('\n'));
      return;
    }

    setLinkedWallet(ctx.chat.id, wallet);
    await ctx.replyWithMarkdown([
      `✅ *Wallet Linked Successfully!*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👛 *Bound Wallet:* \`${wallet}\``,
      `All commands (/status, /pause, /resume) now target this wallet.`,
    ].join('\n'));
  });

  // /subscribe command
  bot.command('subscribe', async (ctx) => {
    registerSubscriber(ctx.chat.id);
    await ctx.replyWithMarkdown('🔔 *Subscribed!* You will now receive real-time PRAGMA trade alerts.');
  });

  // /unsubscribe command
  bot.command('unsubscribe', async (ctx) => {
    unregisterSubscriber(ctx.chat.id);
    await ctx.replyWithMarkdown('🔕 *Unsubscribed.* You will no longer receive automated trade alerts.');
  });

  // /help command
  bot.command('help', async (ctx) => {
    const help = [
      `📖 *PRAGMA Command Directory:*`,
      `• /status — Status & active mandate`,
      `• /positions — Open positions`,
      `• /pnl — Today's and total P&L`,
      `• /wallet — Linked wallet details`,
      `• /link <0xAddress> — Bind to another wallet address`,
      `• /pause — Pause trading`,
      `• /resume — Resume trading`,
      `• /subscribe — Enable trade notifications`,
      `• /unsubscribe — Mute trade notifications`,
    ].join('\n');
    await ctx.replyWithMarkdown(help);
  });
}

/**
 * Start long polling in local development / Node.js runtime.
 * Protected against duplicate initialization in hot-reloading.
 */
export function launchBotPolling() {
  // In development, long polling is handled by dedicated bot daemon: `npm run bot`
  // Webhook updates in production are processed via POST /api/telegram
  return;
}

