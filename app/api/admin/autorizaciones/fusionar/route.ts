import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Fusiona alumno_id_duplicado INTO alumno_id_principal:
// - Mueve autorizaciones faltantes al principal
// - Elimina autorizaciones duplicadas (mismo numero)
// - Elimina el registro duplicado de alumnos
export async function POST(req: NextRequest) {
  const { alumno_id_principal, alumno_id_duplicado } = await req.json();
  if (!alumno_id_principal || !alumno_id_duplicado) {
    return NextResponse.json({ error: 'Faltan IDs.' }, { status: 400 });
  }
  if (alumno_id_principal === alumno_id_duplicado) {
    return NextResponse.json({ error: 'IDs iguales.' }, { status: 400 });
  }

  // Autorizaciones del duplicado
  const { data: autsDup, error: e1 } = await supabaseAdmin
    .from('autorizaciones')
    .select('id, numero')
    .eq('alumno_id', alumno_id_duplicado);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  // Números ya existentes en el principal
  const { data: autsPrinc, error: e2 } = await supabaseAdmin
    .from('autorizaciones')
    .select('numero')
    .eq('alumno_id', alumno_id_principal);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const numerosExistentes = new Set((autsPrinc ?? []).map(a => a.numero));

  for (const aut of (autsDup ?? [])) {
    if (numerosExistentes.has(aut.numero)) {
      // Ya existe ese show en el principal → borrar el duplicado
      await supabaseAdmin.from('autorizaciones').delete().eq('id', aut.id);
    } else {
      // No existe → reasignar al principal
      await supabaseAdmin.from('autorizaciones').update({ alumno_id: alumno_id_principal }).eq('id', aut.id);
    }
  }

  // Borrar el alumno duplicado
  await supabaseAdmin.from('alumnos').delete().eq('id', alumno_id_duplicado);

  return NextResponse.json({ ok: true });
}
