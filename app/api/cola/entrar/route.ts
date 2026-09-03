import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const COOKIE_NAME      = 'dya_turnos_dni';
const ACTIVE_LIMIT     = 50;
const CLEANUP_INTERVAL = 2 * 60 * 1000;
let   ultimaLimpieza   = 0;

export async function POST(req: NextRequest) {
  const dni = req.cookies.get(COOKIE_NAME)?.value;
  if (!dni) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  // Buscar alumno
  const { data: alumno } = await supabaseAdmin
    .from('alumnos')
    .select('id, nombre, apellido')
    .eq('dni', dni)
    .single();

  if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado.' }, { status: 404 });

  // Leer show activo
  const { data: configData } = await supabaseAdmin
    .from('config')
    .select('valor')
    .eq('clave', 'show_activo')
    .single();

  const showNumero = parseInt(configData?.valor ?? '0');
  if (showNumero === 0) {
    return NextResponse.json({ error: 'El turnero no está activo.' }, { status: 403 });
  }

  // Si ya tiene turno reservado para este show, ir directo
  const { data: reserva } = await supabaseAdmin
    .from('reservas')
    .select('id')
    .eq('alumno_id', alumno.id)
    .eq('show_numero', showNumero)
    .maybeSingle();

  if (reserva) {
    return NextResponse.json({ redirect: '/turnos/reservar' });
  }

  // Limpiar entradas inactivas — máximo una vez cada 2 min por instancia
  const ahora = Date.now();
  if (ahora - ultimaLimpieza > CLEANUP_INTERVAL) {
    ultimaLimpieza = ahora;
    await supabaseAdmin
      .from('cola')
      .delete()
      .eq('show_numero', showNumero)
      .lt('ultimo_ping', new Date(ahora - 5 * 60 * 1000).toISOString());
  }

  // Insertar en la cola (si ya está, no reemplaza created_at)
  const { error: insertError } = await supabaseAdmin
    .from('cola')
    .insert({ alumno_id: alumno.id, show_numero: showNumero });

  if (insertError && insertError.code !== '23505') {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Si ya estaba en la cola (duplicate key), solo actualizar el ping
  if (insertError?.code === '23505') {
    await supabaseAdmin
      .from('cola')
      .update({ ultimo_ping: new Date().toISOString() })
      .eq('alumno_id', alumno.id)
      .eq('show_numero', showNumero);
  }

  // Obtener su posición
  const { data: myEntry } = await supabaseAdmin
    .from('cola')
    .select('created_at')
    .eq('alumno_id', alumno.id)
    .eq('show_numero', showNumero)
    .single();

  const { count: ahead } = await supabaseAdmin
    .from('cola')
    .select('*', { count: 'exact', head: true })
    .eq('show_numero', showNumero)
    .lt('created_at', myEntry!.created_at);

  const posicion    = (ahead ?? 0) + 1;
  const puedeEntrar = posicion <= ACTIVE_LIMIT;

  return NextResponse.json({
    posicion,
    puedeEntrar,
    alumno: { nombre: alumno.nombre, apellido: alumno.apellido },
    showNumero,
  });
}
