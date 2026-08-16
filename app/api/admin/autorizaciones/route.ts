import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  // Traemos todas las autorizaciones con datos de alumno y responsable
  const { data, error } = await supabaseAdmin
    .from('autorizaciones')
    .select(`
      numero,
      alumno_id,
      responsable_id,
      alumnos   ( nombre, apellido, dni, confirmado ),
      responsables ( nombre, apellido, dni, email )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Agrupamos por par alumno+responsable y marcamos qué shows tienen
  const mapa = new Map<string, {
    alumno_nombre: string;
    alumno_apellido: string;
    alumno_dni: string;
    resp_nombre: string;
    resp_apellido: string;
    resp_dni: string;
    email: string;
    show1: boolean;
    show2: boolean;
    confirmado: boolean;
  }>();

  for (const row of data ?? []) {
    const key = `${row.alumno_id}-${row.responsable_id}`;
    const alumno = row.alumnos as unknown as { nombre: string; apellido: string; dni: string; confirmado: boolean };
    const resp   = row.responsables as unknown as { nombre: string; apellido: string; dni: string; email: string };

    if (!mapa.has(key)) {
      mapa.set(key, {
        alumno_nombre:   alumno.nombre,
        alumno_apellido: alumno.apellido,
        alumno_dni:      alumno.dni,
        resp_nombre:     resp.nombre,
        resp_apellido:   resp.apellido,
        resp_dni:        resp.dni,
        email:           resp.email,
        show1:      false,
        show2:      false,
        confirmado: alumno.confirmado ?? false,
      });
    }

    const entry = mapa.get(key)!;
    if (row.numero === 1) entry.show1 = true;
    if (row.numero === 2) entry.show2 = true;
  }

  // Ordenamos por apellido del alumno
  const result = Array.from(mapa.values()).sort((a, b) =>
    a.alumno_apellido.localeCompare(b.alumno_apellido)
  );

  return NextResponse.json(result);
}
