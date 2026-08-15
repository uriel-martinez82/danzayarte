import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enviarEmailAutorizacion } from '@/lib/email';
import { AutorizacionPayload } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: AutorizacionPayload = await req.json();
    const { alumno, responsable, numero } = body;

    // --- Validaciones básicas ---
    if (!alumno.nombre || !alumno.apellido || !alumno.dni) {
      return NextResponse.json({ error: 'Faltan datos del alumno.' }, { status: 400 });
    }
    if (!responsable.nombre || !responsable.apellido || !responsable.dni || !responsable.email) {
      return NextResponse.json({ error: 'Faltan datos del responsable.' }, { status: 400 });
    }
    if (![1, 2].includes(numero)) {
      return NextResponse.json({ error: 'Número de autorización inválido.' }, { status: 400 });
    }

    // --- Upsert alumno (si ya existe por DNI, lo trae) ---
    const { data: alumnoData, error: alumnoError } = await supabaseAdmin
      .from('alumnos')
      .upsert({ ...alumno }, { onConflict: 'dni' })
      .select('id')
      .single();

    if (alumnoError) throw new Error(`Error guardando alumno: ${alumnoError.message}`);

    // --- Upsert responsable ---
    const { data: responsableData, error: responsableError } = await supabaseAdmin
      .from('responsables')
      .upsert({ ...responsable }, { onConflict: 'dni' })
      .select('id')
      .single();

    if (responsableError) throw new Error(`Error guardando responsable: ${responsableError.message}`);

    // --- Crear autorización ---
    const { error: autError } = await supabaseAdmin
      .from('autorizaciones')
      .upsert({
        alumno_id: alumnoData.id,
        responsable_id: responsableData.id,
        numero,
      }, { onConflict: 'alumno_id,responsable_id,numero' });

    if (autError) throw new Error(`Error guardando autorización: ${autError.message}`);

    // --- Enviar emails ---
    await enviarEmailAutorizacion(alumno, responsable, numero);

    return NextResponse.json({ success: true, message: 'Autorización registrada y emails enviados.' });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[API /autorizacion]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
