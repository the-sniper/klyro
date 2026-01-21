import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// Browser client (lazy initialization)
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return supabaseClient;
}

// Server-side client with service role for admin operations (lazy initialization)
export function createServerClient(): SupabaseClient {
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

// Legacy export for compatibility
export const supabase = {
  get client() {
    return getSupabase();
  }
};
