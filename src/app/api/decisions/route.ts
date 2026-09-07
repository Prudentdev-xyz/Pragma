import { supabaseServer } from '@/lib/db/supabase';

export async function GET() {
  try {
    const { data: decisions, error } = await supabaseServer
      .from('ai_decisions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return Response.json({ ok: true, decisions: decisions || [] });
  } catch (err) {
    console.warn('[/api/decisions] fetch failed:', err);
    return Response.json({ ok: false, decisions: [] });
  }
}
