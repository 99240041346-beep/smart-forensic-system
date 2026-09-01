import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === '/login' || pathname === '/logout' || pathname.startsWith('/api/auth/');
  if (isPublic) return NextResponse.next();

  const expectedSecret = process.env.FORENSIC_SESSION_SECRET;
  const session = request.cookies.get('forensic_session')?.value;

  if (!expectedSecret || session !== expectedSecret) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
