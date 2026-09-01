import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.FORENSIC_SESSION_SECRET;
  const session = request.cookies.get('forensic_session')?.value;
  const authenticated = Boolean(expectedSecret && session && session === expectedSecret);
  return NextResponse.json({ authenticated });
}
