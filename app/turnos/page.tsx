'use client';

import { useState, FormEvent } from 'react';
import { LOGO_BASE64 } from '@/lib/logo';
import { PUBLIC_CSS } from '@/lib/public-page-css';

export default function TurnosPage() {
  const [dni,      setDni]      = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/turnos/login', {
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
    <>
      <style>{PUBLIC_CSS}</style>
      <div className="pub-page">
        <div className="pub-orb pub-orb-1" />
        <div className="pub-orb pub-orb-2" />
        <div className="pub-orb pub-orb-3" />

        <div className="pub-card">
          <div className="pub-header">
            <div className="pub-logo-ring">
              <div className="pub-logo-wrap">
                <img src={LOGO_BASE64} alt="Danza y Arte" className="pub-logo" />
              </div>
            </div>
            <h1 className="pub-title">Danza y Arte</h1>
            <p className="pub-sub">Agustina Spera — Turnos Show de Fin de Año</p>
          </div>

          <div className="pub-badge-row">
            <span className="pub-badge pub-badge-purple">🎟️ Reserva de turno</span>
            <span className="pub-badge pub-badge-pink">🎭 Show 2026</span>
          </div>

          <div className="pub-info">
            <p>Ingresá con el DNI del alumno/a para elegir el turno para el <strong>Show de Fin de Año</strong>. Necesitás la clave <strong>show2026</strong>.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="pub-field">
              <label className="pub-label">DNI del alumno/a</label>
              <input
                type="text" value={dni}
                onChange={e => setDni(e.target.value)}
                placeholder="Ej: 11222333"
                autoComplete="off" autoFocus
                className="pub-input"
              />
            </div>

            <div className="pub-field">
              <label className="pub-label">Contraseña</label>
              <div className="pub-input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="password"
                  autoComplete="new-password"
                  className="pub-input"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="pub-eye" tabIndex={-1}>
                  {showPass ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            {error && <div className="pub-error"><span>⚠</span>{error}</div>}

            <button type="submit" className="pub-submit" disabled={loading || !dni || !password}>
              {loading ? <><span className="pub-spinner" /> Verificando…</> : 'Ingresar →'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function EyeOn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
