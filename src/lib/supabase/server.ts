import { cookies } from 'next/headers';
import { createServerClient } from './client';
import { parseSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

/**
 * Get the currently authenticated user from session cookie.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await parseSession(sessionCookie);
  
  if (!session) return null;
  
  const adminClient = createServerClient();
  const { data: user } = await adminClient
    .from('users')
    .select('id, email, full_name')
    .eq('id', session.userId)
    .single();
  
  return user;
}

/**
 * Get authenticated user or throw error. Use in protected API routes.
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}
