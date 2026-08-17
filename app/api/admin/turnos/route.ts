import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enviarEmailTurno } from '@/lib/email-turno';

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
  let alumnoNombre: string;
  let alumnoApellido: string;

  if (body.alumno_id) {
    // Alumno registrado — buscar nombre/apellido para el email
    const { data: alumno } = await supabaseAdmin
      .from('alumnos')
      .select('id, nombre, apellido')
      .eq('id', body.alumno_id)
      .single();

    if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado.' }, { status: 404 });
    alumnoId       = alumno.id;
    alumnoNombre   = alumno.nombre;
    alumnoApellido = alumno.apellido;

  } else if (body.nombre && body.apellido && body.dni) {
    // Ingreso manual: buscar por DNI o crear nuevo
    const dni = String(body.dni).trim();
    alumnoNombre   = String(body.nombre).trim();
    alumnoApellido = String(body.apellido).trim();

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
        .insert({ nombre: alumnoNombre, apellido: alumnoApellido, dni, confirmado: true })
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

  // Enviar email (no bloqueante)
  try {
    const { data: autorizacion } = await supabaseAdmin
      .from('autorizaciones')
      .select('responsable_id')
      .eq('alumno_id', alumnoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let emailDestinatario: string | null = null;
    if (autorizacion?.responsable_id) {
      const { data: responsable } = await supabaseAdmin
        .from('responsables')
        .select('email')
        .eq('id', autorizacion.responsable_id)
        .single();
      emailDestinatario = responsable?.email ?? null;
    }

    enviarEmailTurno({
      emailDestinatario,
      alumnoNombre,
      alumnoApellido,
      showNumero: show_numero,
      fecha,
      hora,
    }).catch(err => console.error('Error enviando email turno (admin):', err));
  } catch (err) {
    console.error('Error preparando email turno (admin):', err);
  }

  return NextResponse.json({ ok: true });
}
