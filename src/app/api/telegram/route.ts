import { bot, launchBotPolling } from '@/lib/telegram/bot';
import { sendTelegramMessage } from '@/lib/telegram/alerts';

/**
 * POST /api/telegram — Telegram Webhook Handler
 */
export async function POST(req: Request) {
  if (!bot) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('[/api/telegram] update error:', err);
    return new Response('error', { status: 500 });
  }
}

/**
 * GET /api/telegram — Health check, polling launcher, and optional test dispatch (?test=1)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isTest = searchParams.get('test') === '1' || searchParams.get('test') === 'true';

  const configured = Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID,
  );

  // In local dev, launch long polling so bot responds to commands directly in Telegram
  if (configured) {
    launchBotPolling();
  }

  if (isTest) {
    if (!configured) {
      return Response.json({
        ok: false,
        error: 'Cannot send test: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing from .env.local',
      });
    }

    const sent = await sendTelegramMessage(
      '🚀 *PRAGMA Connected!*\nYour Telegram alerts are active and ready to receive real-time trade signals.',
    );

    return Response.json({
      ok: sent,
      message: sent
        ? 'Test notification sent to Telegram'
        : 'Failed to send message. Verify your bot token and chat ID.',
      pollingActive: Boolean((globalThis as any).__pragma_telegram_polling),
    });
  }

  return Response.json({
    ok: true,
    configured,
    hasToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    hasChatId: Boolean(process.env.TELEGRAM_CHAT_ID),
    pollingActive: Boolean((globalThis as any).__pragma_telegram_polling),
  });
}

