import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // No proteger el login ni la API de login
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/login')) {
    return NextResponse.next();
  }

  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const cookie   = request.cookies.get('dya_admin_auth');

  if (cookie && cookie.value === password) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: '/admin/:path*',
};
