import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('reservas')
    .select(`
      id, show_numero, fecha, hora, created_at,
      alumnos ( nombre, apellido, dni )
    `)
    .order('show_numero', { ascending: true })
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { show_numero, fecha, hora } = body;

  if (!show_numero || !fecha || hora === undefined) {
    return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
  }

  let alumnoId: string;

  if (body.alumno_id) {
    // Alumno registrado — admin puede asignar sin restricción de turno previo
    alumnoId = body.alumno_id;

  } else if (body.nombre && body.apellido && body.dni) {
    // Ingreso manual: buscar por DNI o crear nuevo
    const dni = String(body.dni).trim();
    const { data: existente } = await supabaseAdmin
      .from('alumnos')
      .select('id')
      .eq('dni', dni)
      .maybeSingle();

    if (existente) {
      alumnoId = existente.id;
    } else {
      const { data: nuevo, error: insertErr } = await supabaseAdmin
        .from('alumnos')
        .insert({
          nombre:     String(body.nombre).trim(),
          apellido:   String(body.apellido).trim(),
          dni,
          confirmado: true,
        })
        .select('id')
        .single();

      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
      alumnoId = nuevo.id;
    }

  } else {
    return NextResponse.json({ error: 'Faltan datos del alumno.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('reservas')
    .insert({ alumno_id: alumnoId, show_numero, fecha, hora });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
