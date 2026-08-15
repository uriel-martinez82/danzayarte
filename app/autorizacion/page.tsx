import AuthorizationForm from '@/components/autorizacion/AuthorizationForm';

export const metadata = { title: 'Autorización – Danza y Arte' };

export default function AutorizacionPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f5f3ff', padding: '20px 0' }}>
      <AuthorizationForm />
    </main>
  );
}
