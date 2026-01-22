import { cookies } from 'next/headers';
import { createServerClient } from './client';

interface SessionData {
  userId: string;
  email: string;
  exp: number;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

/**
 * Parse session from cookie
 */
function parseSession(cookie: string | undefined): SessionData | null {
  if (!cookie) return null;
  
  try {
    const data = JSON.parse(Buffer.from(cookie, 'base64').toString());
    if (data.exp && data.exp > Date.now()) {
      return data as SessionData;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the currently authenticated user from session cookie.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = parseSession(sessionCookie);
  
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
