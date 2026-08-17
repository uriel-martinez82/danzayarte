import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// DELETE /api/admin/turnos/[id] — liberar turno
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('reservas')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PUT /api/admin/turnos/[id] — cambiar titular del turno (admin puede asignar a cualquiera)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { alumno_id } = await req.json();

  if (!alumno_id) {
    return NextResponse.json({ error: 'Falta alumno_id.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('reservas')
    .update({ alumno_id })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
