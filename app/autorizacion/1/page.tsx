import AuthorizationForm from '@/components/autorizacion/AuthorizationForm';

export const metadata = { title: 'Autorización N° 1 — Danza y Arte' };

export default function Autorizacion1Page() {
  return <AuthorizationForm numero={1} />;
}
