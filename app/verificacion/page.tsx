'use client';

import { useState, FormEvent } from 'react';
import { LOGO_BASE64 } from '@/lib/logo';

export default function VerificacionPage() {
  const [dni,        setDni]        = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch('/api/verificacion/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: dni.trim(), password }),
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
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <img src={LOGO_BASE64} alt="Danza y Arte" style={s.logo} />
          <h1 style={s.title}>Danza y Arte</h1>
          <p style={s.sub}>Agustina Spera — Show de Fin de Año</p>
        </div>

        {/* Intro */}
        <div style={s.infoBox}>
          <p style={s.infoText}>
            Verificá y confirmá los datos personales de tu hija/o para el Show de Fin de Año en el <strong>Teatro Astral</strong>.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={s.label}>DNI del alumno/a</label>
          <input
            type="text"
            value={dni}
            onChange={e => setDni(e.target.value)}
            placeholder="Ej: 11222333"
            autoComplete="off"
            autoFocus
            style={s.input}
          />

          <label style={s.label}>Contraseña</label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Ingresá la contraseña"
              autoComplete="new-password"
              style={{ ...s.input, marginBottom: 0, paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              style={s.eyeBtn}
              tabIndex={-1}
            >
              {showPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && <div style={s.error}>⚠ {error}</div>}

          <button type="submit" style={s.btn} disabled={loading || !dni || !password}>
            {loading ? 'Verificando…' : 'Ingresar →'}
          </button>
        </form>

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
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)', width: '100%', maxWidth: 420,
  },
  header: { textAlign: 'center', marginBottom: 24 },
  logo:   { height: 70, width: 'auto', marginBottom: 12 },
  title:  { margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: '#0f172a' },
  sub:    { margin: 0, fontSize: 13, color: '#64748b' },
  infoBox: {
    background: '#f0f4ff', borderRadius: 12, padding: '14px 18px',
    marginBottom: 24, border: '1px solid #e0e7ff',
  },
  infoText: { margin: 0, fontSize: 14, color: '#3730a3', lineHeight: 1.6 },
  label: { display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 },
  input: {
    width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 16,
  },
  btn: {
    width: '100%', padding: '13px 0', background: '#3730a3', color: '#fff',
    border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
    display: 'flex', alignItems: 'center', padding: 0,
  },
  error: {
    background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
    borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 14,
  },
};
