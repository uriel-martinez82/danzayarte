import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Fusiona responsable_id_duplicado INTO responsable_id_principal:
// - Mueve autorizaciones faltantes al principal
// - Elimina autorizaciones duplicadas (mismo alumno+numero)
// - Elimina el registro duplicado de responsables
export async function POST(req: NextRequest) {
  const { responsable_id_principal, responsable_id_duplicado } = await req.json();
  if (!responsable_id_principal || !responsable_id_duplicado) {
    return NextResponse.json({ error: 'Faltan IDs.' }, { status: 400 });
  }
  if (responsable_id_principal === responsable_id_duplicado) {
    return NextResponse.json({ error: 'IDs iguales.' }, { status: 400 });
  }

  // Autorizaciones del responsable duplicado
  const { data: autsDup, error: e1 } = await supabaseAdmin
    .from('autorizaciones')
    .select('id, alumno_id, numero')
    .eq('responsable_id', responsable_id_duplicado);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  // Autorizaciones del responsable principal (para detectar duplicados por alumno+numero)
  const { data: autsPrinc, error: e2 } = await supabaseAdmin
    .from('autorizaciones')
    .select('alumno_id, numero')
    .eq('responsable_id', responsable_id_principal);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const existentes = new Set((autsPrinc ?? []).map(a => `${a.alumno_id}-${a.numero}`));

  for (const aut of (autsDup ?? [])) {
    const key = `${aut.alumno_id}-${aut.numero}`;
    if (existentes.has(key)) {
      // Ya existe ese alumno+show en el principal → borrar el duplicado
      await supabaseAdmin.from('autorizaciones').delete().eq('id', aut.id);
    } else {
      // No existe → reasignar al principal
      await supabaseAdmin.from('autorizaciones').update({ responsable_id: responsable_id_principal }).eq('id', aut.id);
    }
  }

  // Borrar el responsable duplicado
  await supabaseAdmin.from('responsables').delete().eq('id', responsable_id_duplicado);

  return NextResponse.json({ ok: true });
}
