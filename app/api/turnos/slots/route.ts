import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const COOKIE_NAME = 'dya_turnos_dni';

// Horas por tipo de día
const HORAS_SABADO  = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 9:00 a 18:00 — 12 turnos/hora
const HORAS_DOMINGO = [9, 10, 11, 12, 13];                      // 9:00 a 13:00 — 20 turnos/hora

const SHOW_DATES: Record<string, { fecha: string; dia: string; capacidad: number; horas: number[] }[]> = {
  '1': [
    { fecha: '2026-09-12', dia: 'Sábado 12 de septiembre',  capacidad: 12, horas: HORAS_SABADO  },
    { fecha: '2026-09-13', dia: 'Domingo 13 de septiembre', capacidad: 20, horas: HORAS_DOMINGO },
  ],
  '2': [
    { fecha: '2026-09-19', dia: 'Sábado 19 de septiembre',  capacidad: 12, horas: HORAS_SABADO  },
    { fecha: '2026-09-20', dia: 'Domingo 20 de septiembre', capacidad: 20, horas: HORAS_DOMINGO },
  ],
};

export async function GET(req: NextRequest) {
  const dni = req.cookies.get(COOKIE_NAME)?.value;
  if (!dni) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const { data: alumno } = await supabaseAdmin
    .from('alumnos')
    .select('id, nombre, apellido')
    .eq('dni', dni)
    .single();

  if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado.' }, { status: 404 });

  const { data: configData } = await supabaseAdmin
    .from('config')
    .select('valor')
    .eq('clave', 'show_activo')
    .single();

  const showActivo = configData?.valor ?? '0';
  if (showActivo === '0') {
    return NextResponse.json({ error: 'Los turnos no están habilitados en este momento.' }, { status: 403 });
  }

  const showNumero = parseInt(showActivo);

  const { data: miReservaRows } = await supabaseAdmin
    .from('reservas')
    .select('fecha, hora')
    .eq('alumno_id', alumno.id)
    .eq('show_numero', showNumero)
    .limit(1);
  const miReserva = miReservaRows?.[0] ?? null;

  const dias = SHOW_DATES[showActivo];
  const fechas = dias.map(d => d.fecha);

  const { data: reservas } = await supabaseAdmin
    .from('reservas')
    .select('fecha, hora')
    .in('fecha', fechas)
    .eq('show_numero', showNumero);

  const conteo: Record<string, number> = {};
  for (const r of reservas ?? []) {
    const key = `${r.fecha}|${r.hora}`;
    conteo[key] = (conteo[key] ?? 0) + 1;
  }

  const slots = dias.map(dia => ({
    fecha:    dia.fecha,
    dia:      dia.dia,
    capacidad: dia.capacidad,
    horas:    dia.horas.map(hora => ({
      hora,
      disponibles: Math.max(0, dia.capacidad - (conteo[`${dia.fecha}|${hora}`] ?? 0)),
    })),
  }));

  return NextResponse.json({
    showNumero,
    alumno: { nombre: alumno.nombre, apellido: alumno.apellido },
    miReserva: miReserva ?? null,
    slots,
  });
}
