import { NextResponse, type NextRequest } from 'next/server'

interface SessionData {
  userId: string;
  email: string;
  exp: number;
}

function parseSession(cookie: string | undefined): SessionData | null {
  if (!cookie) return null;
  
  try {
    const data = JSON.parse(Buffer.from(cookie, 'base64').toString());
    if (data.exp && data.exp > Date.now()) {
      return data as SessionData;
    }
    return null; // Expired
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const session = parseSession(sessionCookie);

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup');
  
  const isPublicRoute = isAuthPage || 
                        request.nextUrl.pathname.startsWith('/api/widget') ||
                        request.nextUrl.pathname.startsWith('/api/chat') ||
                        request.nextUrl.pathname.startsWith('/api/auth');

  // Redirect unauthenticated users to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect logged-in users away from auth pages
  if (session && (isAuthPage || request.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
