import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const TURNOS_PASSWORD = process.env.TURNOS_PASSWORD ?? 'show2026';
const COOKIE_NAME = 'dya_turnos_dni';

export async function POST(req: NextRequest) {
  const { dni, password } = await req.json();

  if (!dni || !password) {
    return NextResponse.json({ error: 'DNI y contraseña requeridos.' }, { status: 400 });
  }

  if (password !== TURNOS_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  const { data: alumno, error } = await supabaseAdmin
    .from('alumnos')
    .select('id, confirmado')
    .eq('dni', dni.trim())
    .single();

  if (error || !alumno) {
    return NextResponse.json({ error: 'No se encontró ningún alumno con ese DNI.' }, { status: 404 });
  }

  if (!alumno.confirmado) {
    return NextResponse.json({
      error: 'Primero debés confirmar tus datos personales en /verificacion.',
    }, { status: 403 });
  }

  const { data: configData } = await supabaseAdmin
    .from('config')
    .select('valor')
    .eq('clave', 'show_activo')
    .single();

  const showActivo = configData?.valor ?? '0';
  if (showActivo === '0') {
    return NextResponse.json({
      error: 'La reserva de turnos aún no está habilitada. Intentá más tarde.',
    }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, redirect: '/cola' });
  res.cookies.set(COOKIE_NAME, dni.trim(), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 2,
    path: '/',
  });
  return res;
}
