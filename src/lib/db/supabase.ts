import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireConfig(server: boolean) {
  if (!supabaseUrl) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL in your environment.',
    );
  }
  if (server && !supabaseServiceKey) {
    throw new Error(
      'Supabase is not configured for the server. Set SUPABASE_SERVICE_ROLE_KEY in your environment.',
    );
  }
  if (!server && !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.',
    );
  }
}

function lazyClient(server: boolean): SupabaseClient {
  let client: SupabaseClient | null = null;

  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (!client) {
        requireConfig(server);
        client = createClient(
          supabaseUrl!,
          server ? (supabaseServiceKey || supabaseAnonKey)! : supabaseAnonKey!,
          server
            ? {
                auth: {
                  persistSession: false,
                  autoRefreshToken: false,
                },
              }
            : undefined,
        );
      }
      const value = (client as unknown as Record<PropertyKey, unknown>)[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  });
}

// Browser client (for client components & real-time subscriptions)
// Lazily initialized so importing this module never throws at build time
// when env vars are missing — it only errors if actually used.
export const supabase = lazyClient(false);

// Server admin client (bypasses RLS on server so engine can always read/write)
export const supabaseServer = lazyClient(true);
