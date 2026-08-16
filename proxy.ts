import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // No proteger el login ni la API de login
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/login')) {
    return NextResponse.next();
  }

  const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'fallback-secret-change-me';
  const cookie = request.cookies.get('dya_admin_auth');

  if (cookie?.value) {
    try {
      const decoded = Buffer.from(cookie.value, 'base64').toString('utf8');
      const parts   = decoded.split('|');
      if (parts.length === 3 && parts[2] === ADMIN_SECRET) {
        return NextResponse.next();
      }
    } catch { /* cookie inválida */ }
  }

  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: '/admin/:path*',
};
