import { NextResponse, type NextRequest } from 'next/server'
import { parseSession, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await parseSession(sessionCookie);

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup');
  
  const isPublicRoute = isAuthPage || 
                        request.nextUrl.pathname === '/' ||
                        request.nextUrl.pathname.startsWith('/api/widget') ||
                        request.nextUrl.pathname.startsWith('/api/chat') ||
                        request.nextUrl.pathname.startsWith('/api/auth');

  if (!session && !isPublicRoute) {
    // An API client fetching with a bad cookie should get a status it can act
    // on, not a 307 to an HTML login page.
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect logged-in users away from auth pages
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|html)$).*)',
  ],
}
