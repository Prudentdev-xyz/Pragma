import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminId = process.env.TELEGRAM_CHAT_ID?.trim();
const defaultWallet = process.env.AGENT_PUBLIC_KEY || '0x3F45b0C2a90e5cD77aE8638150cA1A78e23cA85F';
const NEXT_API = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!token) {
  console.error('[Bot Worker] Missing TELEGRAM_BOT_TOKEN in .env.local');
  process.exit(1);
}

const bot = new Telegraf(token);
let activeWallet = defaultWallet;

function isAuthorized(chatId) {
  if (!adminId) return true;
  return String(chatId).trim() === adminId;
}

function shorten(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Log every incoming message for clear debugging
bot.use(async (ctx, next) => {
  const user = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name || 'User';
  console.log(`📩 [Telegram] From ${user} (Chat ID: ${ctx.chat?.id}): "${ctx.message?.text || ''}"`);
  await next();
});

// /start command
bot.start(async (ctx) => {
  const text = ctx.message?.text || '';
  const parts = text.split(' ').filter(Boolean);
  let incoming = parts[1] || '';
  if (incoming.startsWith('link_')) incoming = incoming.replace('link_', '');

  if (incoming.startsWith('0x') && incoming.length >= 10) {
    activeWallet = incoming;
    await ctx.replyWithMarkdown([
      `✅ *Wallet Linked Successfully!*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👛 *Bound Wallet:* \`${incoming}\``,
      `⚡ *Network:* \`Somnia Shannon Testnet (Chain 50312)\``,
      ``,
      `This Telegram account is now bound to this wallet.`,
      ``,
      `*Available Commands:*`,
      `• /status — Check live loop posture & P&L`,
      `• /wallet — View linked wallet address & explorer`,
      `• /pause — Pause trading for this wallet`,
      `• /resume — Resume autonomous trading loop`,
      `• /link <address> — Switch to another wallet`,
    ].join('\n'));
    return;
  }

  await ctx.replyWithMarkdown([
    `🤖 *Welcome to PRAGMA Autonomous Agent*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👛 *Linked Wallet:* \`${shorten(activeWallet)}\``,
    `⚡ *Network:* \`Somnia Shannon Testnet\``,
    ``,
    `You have exclusive personal control over this trading operator.`,
    ``,
    `*Available Commands:*`,
    `• /status — Check agent loop health & posture`,
    `• /positions — View open mark-to-market positions`,
    `• /pnl — Real-time session & cumulative P&L`,
    `• /wallet — View linked operator wallet address & explorer`,
    `• /link <0xAddress> — Bind to another wallet address`,
    `• /pause — Temporarily pause new trade entries`,
    `• /resume — Resume autonomous market scanning`,
    `• /help — Show this command directory`,
  ].join('\n'));
});

// /status command
bot.command('status', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) {
    await ctx.replyWithMarkdown(`⛔ *Access Denied:* Privately locked to \`${shorten(activeWallet)}\`.`);
    return;
  }

  try {
    const res = await fetch(`${NEXT_API}/api/agent/status`);
    const data = await res.json();
    const snapshot = data?.snapshot;

    const isRunning = data?.running ?? false;
    const statusEmoji = isRunning ? '🟢 ACTIVE' : '⏸ PAUSED';
    const dailyPnl = snapshot?.dailyPnl ?? 0;
    const totalPnl = snapshot?.totalPnl ?? 0;
    const pnlSign = dailyPnl >= 0 ? '+' : '-';

    await ctx.replyWithMarkdown([
      `🤖 *PRAGMA Autonomous Agent Status*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👛 *Linked Wallet:* \`${shorten(snapshot?.walletAddress || activeWallet)}\``,
      `⚡ *State:* ${statusEmoji}`,
      `🛡 *Posture:* \`${snapshot?.preset || 'Balanced'}\``,
      `💰 *Budget:* \`$${snapshot?.portfolioValue ?? 2500} tUSDC\``,
      `🔄 *Cycles Run:* \`${snapshot?.status?.cycles ?? 0}\``,
      `📂 *Open Positions:* \`${snapshot?.openPositions?.length ?? 0}\``,
      `📊 *Daily P&L:* \`${pnlSign}$${Math.abs(dailyPnl).toFixed(2)}\``,
      `📈 *Total P&L:* \`${totalPnl >= 0 ? '+' : '-'}$${Math.abs(totalPnl).toFixed(2)}\``,
      `💬 *Last Log:* _${snapshot?.lastMessage || 'Engine operational'}_`,
    ].join('\n'));
  } catch (err) {
    await ctx.replyWithMarkdown(`⚠️ *PRAGMA Status:* Web app offline or unreachable.\nWallet: \`${shorten(activeWallet)}\``);
  }
});

// /wallet command
bot.command('wallet', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) {
    await ctx.replyWithMarkdown('⛔ *Access Denied.*');
    return;
  }

  await ctx.replyWithMarkdown([
    `👛 *Linked PRAGMA Operator Wallet*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `• Address: \`${activeWallet}\``,
    `• Network: \`Somnia Shannon Testnet (50312)\``,
    `• Status: *Active & Linked*`,
    `• Explorer: [View on Shannon Explorer](https://shannon-explorer.somnia.network/address/${activeWallet})`,
    `• Authorized Chat ID: \`${ctx.chat.id}\``,
  ].join('\n'), { disable_web_page_preview: true });
});

// /link command
bot.command('link', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) {
    await ctx.replyWithMarkdown('⛔ *Access Denied.*');
    return;
  }

  const text = ctx.message?.text || '';
  const parts = text.split(' ').filter(Boolean);
  const newWallet = parts[1];

  if (!newWallet || !newWallet.startsWith('0x') || newWallet.length < 10) {
    await ctx.replyWithMarkdown([
      `ℹ️ *Usage:* \`/link <0xWalletAddress>\``,
      `Current bound wallet: \`${activeWallet}\``,
      `Example: \`/link 0x3F45b0C2a90e5cD77aE8638150cA1A78e23cA85F\``,
    ].join('\n'));
    return;
  }

  activeWallet = newWallet;
  try {
    await fetch(`${NEXT_API}/api/agent/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: newWallet }),
    });
  } catch {}

  await ctx.replyWithMarkdown([
    `✅ *Wallet Linked Successfully!*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👛 *Bound Wallet:* \`${newWallet}\``,
    `All commands (/status, /pause, /resume) now target this wallet.`,
  ].join('\n'));
});

// /pause command
bot.command('pause', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) {
    await ctx.replyWithMarkdown(`⛔ *Access Denied:* Privately locked to \`${shorten(activeWallet)}\`.`);
    return;
  }

  try {
    await fetch(`${NEXT_API}/api/agent/stop`, { method: 'POST' });
  } catch {}

  await ctx.replyWithMarkdown(`⏸ *Agent Paused!*\nAutonomous trade entries halted for \`${shorten(activeWallet)}\`.\n_Live web dashboard updated to PAUSED._`);
});

// /resume command
bot.command('resume', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) {
    await ctx.replyWithMarkdown(`⛔ *Access Denied:* Privately locked to \`${shorten(activeWallet)}\`.`);
    return;
  }

  try {
    await fetch(`${NEXT_API}/api/agent/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: activeWallet }),
    });
  } catch {}

  await ctx.replyWithMarkdown(`▶️ *Agent Resumed!*\nAutonomous scanning active for \`${shorten(activeWallet)}\`.\n_Live web dashboard updated to ACTIVE._`);
});

// /positions command
bot.command('positions', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) {
    await ctx.replyWithMarkdown('⛔ *Access Denied.*');
    return;
  }

  try {
    const res = await fetch(`${NEXT_API}/api/agent/status`);
    const data = await res.json();
    const positions = data?.snapshot?.openPositions || [];

    if (positions.length === 0) {
      await ctx.replyWithMarkdown('📭 *Open Positions:* None currently active. PRAGMA is scanning for new opportunities.');
      return;
    }

    const items = positions.map((p, i) => [
      `*${i + 1}. ${p.marketId}*`,
      `   Side: \`${p.side}\` | Size: \`${p.size} USDC\` | Entry: \`$${p.entryPrice.toFixed(2)}\``,
    ].join('\n'));

    await ctx.replyWithMarkdown([
      `📊 *PRAGMA Active Positions (${positions.length})*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ...items,
    ].join('\n'));
  } catch {
    await ctx.replyWithMarkdown('📭 *Open Positions:* None currently active.');
  }
});

// /pnl command
bot.command('pnl', async (ctx) => {
  if (!isAuthorized(ctx.chat.id)) {
    await ctx.replyWithMarkdown('⛔ *Access Denied.*');
    return;
  }

  try {
    const res = await fetch(`${NEXT_API}/api/agent/status`);
    const data = await res.json();
    const snapshot = data?.snapshot;
    const daily = snapshot?.dailyPnl ?? 0;
    const total = snapshot?.totalPnl ?? 0;
    const dailySign = daily >= 0 ? '+' : '-';
    const totalSign = total >= 0 ? '+' : '-';

    await ctx.replyWithMarkdown([
      `📊 *PRAGMA P&L Report*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👛 *Wallet:* \`${shorten(activeWallet)}\``,
      `📅 *Today:* \`${dailySign}$${Math.abs(daily).toFixed(2)}\``,
      `📈 *Total:* \`${totalSign}$${Math.abs(total).toFixed(2)}\``,
      `🔄 *Trades Today:* \`${snapshot?.tradesToday ?? 0}\``,
    ].join('\n'));
  } catch {
    await ctx.replyWithMarkdown('📊 *PRAGMA P&L:* P&L data unavailable at this moment.');
  }
});

// /help command
bot.command('help', async (ctx) => {
  await ctx.replyWithMarkdown([
    `📖 *PRAGMA Command Directory:*`,
    `• /status — Status & active mandate`,
    `• /positions — Open positions`,
    `• /pnl — Today's and total P&L`,
    `• /wallet — Linked wallet details`,
    `• /link <0xAddress> — Bind to another wallet address`,
    `• /pause — Pause trading`,
    `• /resume — Resume trading`,
  ].join('\n'));
});

// Register command menu with Telegram
bot.telegram
  .setMyCommands([
    { command: 'status', description: 'Check agent loop health & posture' },
    { command: 'positions', description: 'View open mark-to-market positions' },
    { command: 'pnl', description: 'Real-time session & cumulative P&L' },
    { command: 'wallet', description: 'View linked operator wallet & explorer' },
    { command: 'link', description: 'Bind to another wallet address' },
    { command: 'pause', description: 'Pause autonomous trading' },
    { command: 'resume', description: 'Resume autonomous trading' },
    { command: 'help', description: 'Show command directory & instructions' },
  ])
  .catch((err) => console.warn('Command menu registration:', err?.message));

async function startPolling() {
  try {
    console.log('🤖 [PRAGMA Bot Worker] Connecting to Telegram long polling...');
    await bot.launch({ dropPendingUpdates: false });
  } catch (err) {
    console.error('⚠️ [PRAGMA Bot Worker] Polling error:', err.message);
    if (err.message && err.message.includes('409')) {
      console.log('⏳ Waiting 5s for previous connection to clear...');
      setTimeout(startPolling, 5000);
    } else {
      setTimeout(startPolling, 3000);
    }
  }
}

startPolling();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
