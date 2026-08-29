import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Crea un alumno manualmente (sin autorización de show).
// Campos obligatorios: alumno_nombre, alumno_apellido, alumno_dni.
// El alumno aparece en la tabla de autorizaciones con show1=show2=false
// y en la lista de turnos.
export async function POST(req: NextRequest) {
  const { alumno_nombre, alumno_apellido, alumno_dni } = await req.json();

  const nombre   = alumno_nombre?.trim()   ?? '';
  const apellido = alumno_apellido?.trim()  ?? '';
  const dni      = alumno_dni?.trim()       ?? '';

  if (!nombre || !apellido || !dni) {
    return NextResponse.json(
      { error: 'Nombre, apellido y DNI del alumno son obligatorios.' },
      { status: 400 }
    );
  }

  // ¿Ya existe un alumno con ese DNI?
  const { data: existente } = await supabaseAdmin
    .from('alumnos')
    .select('id')
    .eq('dni', dni)
    .maybeSingle();

  if (existente) {
    // Actualizar nombre/apellido por si hubo un typo
    await supabaseAdmin
      .from('alumnos')
      .update({ nombre, apellido })
      .eq('id', existente.id);
    return NextResponse.json({ ok: true, alumno_id: existente.id, existia: true });
  }

  // Crear alumno nuevo (confirmado=false por defecto)
  const { data: nuevo, error } = await supabaseAdmin
    .from('alumnos')
    .insert({ nombre, apellido, dni, confirmado: false })
    .select('id')
    .single();

  if (error || !nuevo) {
    return NextResponse.json(
      { error: error?.message ?? 'Error al crear alumno.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, alumno_id: nuevo.id });
}
