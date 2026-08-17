import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scryptSync, timingSafeEqual } from 'crypto';

const COOKIE_NAME  = 'dya_admin_auth';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'fallback-secret-change-me';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const inputHash = scryptSync(password, salt, 32).toString('hex');
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(inputHash, 'hex'));
  } catch { return false; }
}

function buildCookieValue(email: string, role: string): string {
  return Buffer.from(`${email}|${role}|${ADMIN_SECRET}`).toString('base64');
}

export async function POST(req: NextRequest) {
  const { email, password, from } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos.' }, { status: 400 });
  }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('email, password_hash, role')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !usuario || !verifyPassword(password, usuario.password_hash)) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos.' }, { status: 401 });
  }

  const redirectTo = from && from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin';
  const res = NextResponse.json({ ok: true, redirect: redirectTo });

  res.cookies.set(COOKIE_NAME, buildCookieValue(usuario.email, usuario.role), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
