import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(req: NextRequest) {
  const {
    alumno_id, responsable_id,
    alumno_nombre, alumno_apellido, alumno_dni,
    resp_nombre, resp_apellido, resp_dni, email,
  } = await req.json();

  if (!alumno_id) {
    return NextResponse.json({ error: 'Falta alumno_id.' }, { status: 400 });
  }

  // Siempre actualizar alumno
  const resAlumno = await supabaseAdmin
    .from('alumnos')
    .update({ nombre: alumno_nombre, apellido: alumno_apellido, dni: alumno_dni })
    .eq('id', alumno_id);

  if (resAlumno.error) return NextResponse.json({ error: resAlumno.error.message }, { status: 500 });

  // Actualizar responsable solo si tiene ID (alumnos manuales no lo tienen)
  if (responsable_id) {
    const resResp = await supabaseAdmin
      .from('responsables')
      .update({ nombre: resp_nombre, apellido: resp_apellido, dni: resp_dni, email })
      .eq('id', responsable_id);

    if (resResp.error) return NextResponse.json({ error: resResp.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
