import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente para uso en el browser (componentes cliente)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente con service role para operaciones del servidor (API routes)
// NUNCA exponer SUPABASE_SERVICE_ROLE_KEY al browser
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
