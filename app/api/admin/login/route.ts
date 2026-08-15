import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';
const COOKIE_NAME    = 'dya_admin_auth';

export async function POST(req: NextRequest) {
  const { password, from } = await req.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  const redirectTo = from && from.startsWith('/admin') ? from : '/admin/autorizaciones';
  const res = NextResponse.json({ ok: true, redirect: redirectTo });

  res.cookies.set(COOKIE_NAME, ADMIN_PASSWORD, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('dya_admin_auth');
  return res;
}
