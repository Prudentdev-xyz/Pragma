import { supabaseServer } from '@/lib/db/supabase';

async function pingDreamDEX(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://stg.api.dreamdex.io/v0/markets', {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function pingSupabase(): Promise<boolean> {
  try {
    const { error } = await supabaseServer.from('users').select('id').limit(1);
    return !error || error.code === 'PGRST116';
  } catch {
    return false;
  }
}

async function pingGroq(): Promise<boolean> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function pingTelegram(): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const json = await res.json();
    return json.ok === true;
  } catch {
    return false;
  }
}

/**
 * GET /api/health — System health check route for demo & judge review
 */
export async function GET() {
  const [dreamdex, supabase, groq, telegram] = await Promise.all([
    pingDreamDEX(),
    pingSupabase(),
    pingGroq(),
    pingTelegram(),
  ]);

  const checks = {
    dreamdex,
    supabase,
    groq,
    telegram,
  };

  const healthy = Object.values(checks).every(Boolean);

  return Response.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 },
  );
}
