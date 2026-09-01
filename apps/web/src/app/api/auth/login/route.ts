import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { username, password } = await request.json().catch(() => ({}));
  const expectedUsername = process.env.FORENSIC_LOGIN_USERNAME;
  const expectedPassword = process.env.FORENSIC_LOGIN_PASSWORD;
  const sessionSecret = process.env.FORENSIC_SESSION_SECRET;

  if (!expectedUsername || !expectedPassword || !sessionSecret) {
    return NextResponse.json({ error: 'Authentication is not configured on the server.' }, { status: 503 });
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('forensic_session', sessionSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}
