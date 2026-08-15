'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LOGO_BASE64 } from '@/lib/logo';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/admin/autorizaciones';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, from }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      window.location.href = data.redirect;
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label style={s.label}>Contraseña</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Ingresá la contraseña"
        autoFocus
        style={s.input}
      />
      {error && <div style={s.error}>⚠ {error}</div>}
      <button type="submit" style={s.btn} disabled={loading || !password}>
        {loading ? 'Verificando…' : 'Ingresar →'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <img src={LOGO_BASE64} alt="Danza y Arte" style={s.logo} />
          <h1 style={s.title}>Panel Admin</h1>
          <p style={s.sub}>Danza y Arte</p>
        </div>
        <Suspense fallback={<p style={{ textAlign: 'center', color: '#94a3b8' }}>Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fdf4ff 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16, fontFamily: 'system-ui, sans-serif',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '40px 36px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)', width: '100%', maxWidth: 380,
  },
  header: { textAlign: 'center', marginBottom: 32 },
  logo:   { height: 64, width: 'auto', marginBottom: 12 },
  title:  { margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#0f172a' },
  sub:    { margin: 0, fontSize: 13, color: '#64748b' },
  label:  { display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 },
  input:  {
    width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    marginBottom: 16,
  },
  btn: {
    width: '100%', padding: '13px 0', background: '#3730a3', color: '#fff',
    border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
    borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 14,
  },
};
