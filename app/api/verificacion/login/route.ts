import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const VERI_PASSWORD = process.env.VERIFICATION_PASSWORD ?? 'danzayarte';
const COOKIE_NAME   = 'dya_veri_dni';

export async function POST(req: NextRequest) {
  const { dni, password } = await req.json();

  if (!dni || !password) {
    return NextResponse.json({ error: 'DNI y contraseña requeridos.' }, { status: 400 });
  }

  if (password !== VERI_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  // Verificar que el alumno existe
  const { data: alumno, error } = await supabaseAdmin
    .from('alumnos')
    .select('id, nombre, apellido, dni')
    .eq('dni', dni.trim())
    .single();

  if (error || !alumno) {
    return NextResponse.json({ error: 'No se encontró ningún alumno con ese DNI.' }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true, redirect: '/verificacion/datos' });
  res.cookies.set(COOKIE_NAME, dni.trim(), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 2, // 2 horas
    path: '/',
  });

  return res;
}
