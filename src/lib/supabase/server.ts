import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Create a Supabase client for server-side use with cookie-based auth.
 * This respects RLS policies based on the authenticated user.
 */
export async function createAuthenticatedClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Get the currently authenticated user from cookies.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createAuthenticatedClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the currently authenticated user, throwing an error if not authenticated.
 * Use this in protected API routes.
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
