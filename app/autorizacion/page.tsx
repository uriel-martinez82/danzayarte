import { redirect } from 'next/navigation';

// Redirigir a /autorizacion/1 por defecto
export default function AutorizacionPage() {
  redirect('/autorizacion/1');
}
