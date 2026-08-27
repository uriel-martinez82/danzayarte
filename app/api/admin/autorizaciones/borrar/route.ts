import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  const { alumno_id, responsable_id } = await req.json();
  if (!alumno_id || !responsable_id) {
    return NextResponse.json({ error: 'Faltan IDs.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('autorizaciones')
    .delete()
    .eq('alumno_id', alumno_id)
    .eq('responsable_id', responsable_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
