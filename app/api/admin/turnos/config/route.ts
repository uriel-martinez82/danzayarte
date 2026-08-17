import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data } = await supabaseAdmin
    .from('config')
    .select('valor')
    .eq('clave', 'show_activo')
    .single();

  return NextResponse.json({ showActivo: data?.valor ?? '0' });
}

export async function PUT(req: NextRequest) {
  const { showActivo } = await req.json();
  if (!['0', '1', '2'].includes(String(showActivo))) {
    return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });
  }
  await supabaseAdmin
    .from('config')
    .upsert({ clave: 'show_activo', valor: String(showActivo) }, { onConflict: 'clave' });
  return NextResponse.json({ ok: true });
}
