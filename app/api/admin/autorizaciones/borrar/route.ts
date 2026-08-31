import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  const { alumno_id, responsable_id } = await req.json();
  if (!alumno_id) {
    return NextResponse.json({ error: 'Falta alumno_id.' }, { status: 400 });
  }

  // Alumno sin responsable (agregado manualmente): borrar el alumno directamente
  if (!responsable_id) {
    const { error } = await supabaseAdmin
      .from('alumnos')
      .delete()
      .eq('id', alumno_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Alumno con autorizaciones: borrar las filas de autorizaciones
  const { error } = await supabaseAdmin
    .from('autorizaciones')
    .delete()
    .eq('alumno_id', alumno_id)
    .eq('responsable_id', responsable_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
