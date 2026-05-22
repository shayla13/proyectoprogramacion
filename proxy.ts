import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify', '/forgot-password', '/reset-password', '/ranking'];
const ADMIN_ROUTES = ['/admin'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes and professor profiles, and API routes
  if (
    PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith('/professors')) ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;
  const session = token ? await verifyToken(token) : null;

  // Redirect to login if not authenticated
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin routes require admin role
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r)) && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
