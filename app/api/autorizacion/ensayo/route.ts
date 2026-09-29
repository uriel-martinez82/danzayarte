import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enviarEmailAutorizacionEnsayo } from '@/lib/email-ensayo';

interface AlumnoInput      { nombre: string; apellido: string; dni: string; }
interface ResponsableInput { nombre: string; apellido: string; dni: string; email: string; }

export async function POST(req: NextRequest) {
  try {
    const body: { alumno: AlumnoInput; responsable: ResponsableInput } = await req.json();
    const { alumno, responsable } = body;

    if (!alumno?.nombre || !alumno?.apellido || !alumno?.dni) {
      return NextResponse.json({ error: 'Faltan datos del alumno/a.' }, { status: 400 });
    }
    if (!responsable?.nombre || !responsable?.apellido || !responsable?.dni || !responsable?.email) {
      return NextResponse.json({ error: 'Faltan datos del responsable.' }, { status: 400 });
    }

    const { error: insertError } = await supabaseAdmin
      .from('autorizaciones_ensayo')
      .insert({
        alumno_nombre:        alumno.nombre.trim(),
        alumno_apellido:      alumno.apellido.trim(),
        alumno_dni:           alumno.dni.trim(),
        responsable_nombre:   responsable.nombre.trim(),
        responsable_apellido: responsable.apellido.trim(),
        responsable_dni:      responsable.dni.trim(),
        responsable_email:    responsable.email.trim().toLowerCase(),
      });

    if (insertError) throw new Error(`Error al guardar: ${insertError.message}`);

    // Enviar emails con PDF adjunto (no bloquea la respuesta si falla)
    await enviarEmailAutorizacionEnsayo(
      { nombre: alumno.nombre.trim(), apellido: alumno.apellido.trim(), dni: alumno.dni.trim() },
      { nombre: responsable.nombre.trim(), apellido: responsable.apellido.trim(), dni: responsable.dni.trim(), email: responsable.email.trim().toLowerCase() },
    );

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[API /autorizacion/ensayo]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
