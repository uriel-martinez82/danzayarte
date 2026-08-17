import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/admin/turnos/alumnos
// Returns all confirmados with their reservation status for the active show
export async function GET() {
  // Get active show
  const { data: configData } = await supabaseAdmin
    .from('config')
    .select('valor')
    .eq('clave', 'show_activo')
    .single();

  const showActivo = configData?.valor ?? '0';

  // Get all confirmed alumnos
  const { data: alumnos, error } = await supabaseAdmin
    .from('alumnos')
    .select('id, nombre, apellido, dni')
    .eq('confirmado', true)
    .order('apellido', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (showActivo === '0') {
    return NextResponse.json({ showActivo, alumnos: alumnos ?? [], reservas: [] });
  }

  // Get all reservations for the active show
  const { data: reservas } = await supabaseAdmin
    .from('reservas')
    .select('alumno_id')
    .eq('show_numero', parseInt(showActivo));

  const reservadosSet = new Set((reservas ?? []).map(r => r.alumno_id));

  // Mark each alumno with turnoTomado
  const alumnosConEstado = (alumnos ?? []).map(a => ({
    ...a,
    turnoTomado: reservadosSet.has(a.id),
  }));

  return NextResponse.json({ showActivo, alumnos: alumnosConEstado });
}
