import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const COOKIE_NAME = 'dya_turnos_dni';

// Se llama cuando el alumno pasa al turnero o confirma su reserva.
// Libera el lugar para que avance el siguiente en la cola.
export async function POST(req: NextRequest) {
  const dni = req.cookies.get(COOKIE_NAME)?.value;
  if (!dni) return NextResponse.json({ ok: true });

  const { data: alumno } = await supabaseAdmin
    .from('alumnos')
    .select('id')
    .eq('dni', dni)
    .single();

  if (!alumno) return NextResponse.json({ ok: true });

  const { data: configData } = await supabaseAdmin
    .from('config')
    .select('valor')
    .eq('clave', 'show_activo')
    .single();

  const showNumero = parseInt(configData?.valor ?? '0');

  await supabaseAdmin
    .from('cola')
    .delete()
    .eq('alumno_id', alumno.id)
    .eq('show_numero', showNumero);

  return NextResponse.json({ ok: true });
}
