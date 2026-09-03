import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const COOKIE_NAME  = 'dya_turnos_dni';
const ACTIVE_LIMIT = 50;

export async function GET(req: NextRequest) {
  const dni = req.cookies.get(COOKIE_NAME)?.value;
  if (!dni) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const { data: alumno } = await supabaseAdmin
    .from('alumnos')
    .select('id, nombre, apellido')
    .eq('dni', dni)
    .single();

  if (!alumno) return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });

  const { data: configData } = await supabaseAdmin
    .from('config')
    .select('valor')
    .eq('clave', 'show_activo')
    .single();

  const showNumero = parseInt(configData?.valor ?? '0');

  // Si ya tiene turno reservado, redirigir
  const { data: reserva } = await supabaseAdmin
    .from('reservas')
    .select('id')
    .eq('alumno_id', alumno.id)
    .eq('show_numero', showNumero)
    .maybeSingle();

  if (reserva) return NextResponse.json({ redirect: '/turnos/reservar' });

  // Limpiar inactivos
  await supabaseAdmin
    .from('cola')
    .delete()
    .eq('show_numero', showNumero)
    .lt('ultimo_ping', new Date(Date.now() - 5 * 60 * 1000).toISOString());

  // Actualizar propio ping (esto es el heartbeat)
  await supabaseAdmin
    .from('cola')
    .update({ ultimo_ping: new Date().toISOString() })
    .eq('alumno_id', alumno.id)
    .eq('show_numero', showNumero);

  // Verificar que siga en la cola
  const { data: myEntry } = await supabaseAdmin
    .from('cola')
    .select('created_at')
    .eq('alumno_id', alumno.id)
    .eq('show_numero', showNumero)
    .maybeSingle();

  if (!myEntry) {
    // La entrada expiró (no debería pasar si el ping funciona bien)
    return NextResponse.json({ error: 'Entrada vencida.' }, { status: 404 });
  }

  const { count: ahead } = await supabaseAdmin
    .from('cola')
    .select('*', { count: 'exact', head: true })
    .eq('show_numero', showNumero)
    .lt('created_at', myEntry.created_at);

  const posicion    = (ahead ?? 0) + 1;
  const puedeEntrar = posicion <= ACTIVE_LIMIT;

  return NextResponse.json({
    posicion,
    puedeEntrar,
    alumno: { nombre: alumno.nombre, apellido: alumno.apellido },
  });
}
