import { createBrowserClient } from '@supabase/ssr'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
  }
  return key;
}

function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return key;
}

// Browser client using @supabase/ssr for cookie support
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      getSupabaseUrl(),
      getSupabaseAnonKey()
    );
  }
  return supabaseClient;
}

// Admin client with service role (bypass RLS)
// Note: This should ONLY be used in server environments (API routes, Server Actions)
export function getAdminClient(): SupabaseClient {
  if (!serverClient) {
    serverClient = createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serverClient;
}

// Legacy exports for compatibility
export function createServerClient() {
  return getAdminClient();
}

export const supabase = {
  get client() {
    return getSupabase();
  }
};
