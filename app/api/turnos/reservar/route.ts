import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enviarEmailTurno } from '@/lib/email-turno';

const COOKIE_NAME = 'dya_turnos_dni';

const SHOW_DATES: Record<string, { fecha: string; capacidad: number }[]> = {
  '1': [
    { fecha: '2026-09-12', capacidad: 10 },
    { fecha: '2026-09-13', capacidad: 20 },
  ],
  '2': [
    { fecha: '2026-09-19', capacidad: 10 },
    { fecha: '2026-09-20', capacidad: 20 },
  ],
};

export async function POST(req: NextRequest) {
  const dni = req.cookies.get(COOKIE_NAME)?.value;
  if (!dni) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const { fecha, hora } = await req.json();

  const { data: configData } = await supabaseAdmin
    .from('config')
    .select('valor')
    .eq('clave', 'show_activo')
    .single();

  const showActivo = configData?.valor ?? '0';
  if (showActivo === '0') return NextResponse.json({ error: 'Turnos no habilitados.' }, { status: 403 });

  const showNumero = parseInt(showActivo);
  const diaInfo = SHOW_DATES[showActivo]?.find(d => d.fecha === fecha);
  if (!diaInfo) return NextResponse.json({ error: 'Fecha inválida para este show.' }, { status: 400 });
  if (hora < 8 || hora > 17) return NextResponse.json({ error: 'Hora inválida.' }, { status: 400 });

  const { data: alumno } = await supabaseAdmin
    .from('alumnos')
    .select('id, nombre, apellido')
    .eq('dni', dni)
    .single();

  if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado.' }, { status: 404 });

  // Verificar que no tenga ya turno para este show (el admin puede asignar más de uno, el usuario no)
  const { data: existingRows } = await supabaseAdmin
    .from('reservas')
    .select('id')
    .eq('alumno_id', alumno.id)
    .eq('show_numero', showNumero)
    .limit(1);

  if (existingRows && existingRows.length > 0) {
    return NextResponse.json({ error: 'Ya tenés un turno reservado para este show.' }, { status: 409 });
  }

  // Verificar disponibilidad del slot
  const { count } = await supabaseAdmin
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .eq('fecha', fecha)
    .eq('hora', hora)
    .eq('show_numero', showNumero);

  if ((count ?? 0) >= diaInfo.capacidad) {
    return NextResponse.json({ error: 'Este turno ya no tiene lugares. Elegí otro horario.' }, { status: 409 });
  }

  // Insertar reserva
  const { error: insertError } = await supabaseAdmin
    .from('reservas')
    .insert({ alumno_id: alumno.id, show_numero: showNumero, fecha, hora });

  if (insertError) {
    return NextResponse.json({ error: 'Error al reservar. Intentá de nuevo.' }, { status: 500 });
  }

  // Enviar email con PDF (no bloqueante — no falla la reserva si falla el mail)
  try {
    // Buscar email del responsable
    const { data: autorizacion } = await supabaseAdmin
      .from('autorizaciones')
      .select('responsable_id')
      .eq('alumno_id', alumno.id)
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

    // Siempre enviamos — si no hay email de responsable, emailDestinatario queda null
    // y en ese caso email-turno solo envía la copia interna
    enviarEmailTurno({
      emailDestinatario,
      alumnoNombre:   alumno.nombre,
      alumnoApellido: alumno.apellido,
      showNumero,
      fecha,
      hora,
    }).catch(err => console.error('Error enviando email turno:', err));
  } catch (err) {
    console.error('Error preparando email turno:', err);
  }

  return NextResponse.json({ ok: true });
}
