import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const COOKIE_NAME = 'dya_veri_dni';

async function getDniFromCookie(req: NextRequest) {
  return req.cookies.get(COOKIE_NAME)?.value ?? null;
}

export async function GET(req: NextRequest) {
  const dni = await getDniFromCookie(req);
  if (!dni) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const { data: alumno, error: alumnoError } = await supabaseAdmin
    .from('alumnos')
    .select('id, nombre, apellido, dni, confirmado')
    .eq('dni', dni)
    .single();

  if (alumnoError || !alumno) {
    return NextResponse.json({ error: 'Alumno no encontrado.' }, { status: 404 });
  }

  // Buscar responsable más reciente vinculado a este alumno
  const { data: autorizacion } = await supabaseAdmin
    .from('autorizaciones')
    .select('responsable_id')
    .eq('alumno_id', alumno.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let responsable = null;
  if (autorizacion?.responsable_id) {
    const { data: resp } = await supabaseAdmin
      .from('responsables')
      .select('id, nombre, apellido, dni, email')
      .eq('id', autorizacion.responsable_id)
      .single();
    responsable = resp;
  }

  return NextResponse.json({ alumno, responsable });
}

export async function PUT(req: NextRequest) {
  const dni = await getDniFromCookie(req);
  if (!dni) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const { alumno: alumnoData, responsable: respData } = await req.json();

  // Actualizar alumno
  const { error: alumnoError } = await supabaseAdmin
    .from('alumnos')
    .update({
      nombre:     alumnoData.nombre,
      apellido:   alumnoData.apellido,
      confirmado: true,
    })
    .eq('dni', dni);

  if (alumnoError) {
    return NextResponse.json({ error: 'Error actualizando alumno.' }, { status: 500 });
  }

  // Actualizar responsable si existe
  if (respData?.id) {
    await supabaseAdmin
      .from('responsables')
      .update({
        nombre:   respData.nombre,
        apellido: respData.apellido,
        dni:      respData.dni,
        email:    respData.email,
      })
      .eq('id', respData.id);
  }

  return NextResponse.json({ ok: true });
}
