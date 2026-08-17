'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LOGO_BASE64 } from '@/lib/logo';

function LoginForm() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/admin';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, from }),
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
    <form onSubmit={handleSubmit} className="dya-form">
      <div className="dya-field">
        <label className="dya-label">Email</label>
        <input
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com" autoFocus
          className="dya-input"
        />
      </div>
      <div className="dya-field">
        <label className="dya-label">Contraseña</label>
        <input
          type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="dya-input"
        />
      </div>
      {error && (
        <div className="dya-error">
          <span>⚠</span> {error}
        </div>
      )}
      <button
        type="submit"
        className={`dya-submit ${loading ? 'loading' : ''}`}
        disabled={loading || !email || !password}
      >
        {loading
          ? <><span className="dya-spinner" /> Verificando…</>
          : 'Ingresar →'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <>
      <style>{CSS}</style>
      <div className="dya-page">

        {/* Orbs */}
        <div className="dya-orb dya-orb-1" />
        <div className="dya-orb dya-orb-2" />
        <div className="dya-orb dya-orb-3" />

        <div className="dya-card">
          {/* Header */}
          <div className="dya-header">
            <div className="dya-logo-ring">
              <div className="dya-logo-wrap">
                <img src={LOGO_BASE64} alt="Danza y Arte" className="dya-logo" />
              </div>
            </div>
            <h1 className="dya-title">Panel Admin</h1>
            <p className="dya-sub">Danza y Arte — Agustina Spera</p>
          </div>

          <Suspense fallback={<p className="dya-loading-text">Cargando…</p>}>
            <LoginForm />
          </Suspense>
        </div>

      </div>
    </>
  );
}

/* ─── CSS ──────────────────────────────────────────────────── */
const CSS = `
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes ringPulse {
    0%, 100% { box-shadow: 0 0 30px rgba(139,92,246,0.3); }
    50%       { box-shadow: 0 0 60px rgba(139,92,246,0.6), 0 0 100px rgba(236,72,153,0.2); }
  }
  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0,0); }
    50%       { transform: translate(40px,-30px); }
  }
  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0,0); }
    50%       { transform: translate(-30px,25px); }
  }
  @keyframes spinnerAnim {
    to { transform: rotate(360deg); }
  }
  @keyframes borderGlow {
    0%, 100% { border-color: rgba(255,255,255,0.08); }
    50%       { border-color: rgba(139,92,246,0.3); }
  }
  @keyframes inputFocus {
    from { box-shadow: 0 0 0 0 rgba(139,92,246,0); }
    to   { box-shadow: 0 0 0 3px rgba(139,92,246,0.25); }
  }

  *, *::before, *::after { box-sizing: border-box; }

  .dya-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0d0b1e 0%, #1a1040 35%, #0f1e3d 65%, #1a0d2e 100%);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    display: flex; align-items: center; justify-content: center;
    padding: 24px 16px;
    font-family: system-ui, -apple-system, sans-serif;
    position: relative; overflow: hidden;
  }

  .dya-orb {
    position: fixed; border-radius: 50%;
    filter: blur(90px); pointer-events: none; z-index: 0;
  }
  .dya-orb-1 {
    width: 550px; height: 550px; top: -180px; left: -180px;
    background: radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%);
    animation: orbFloat1 20s ease-in-out infinite;
  }
  .dya-orb-2 {
    width: 450px; height: 450px; bottom: -120px; right: -120px;
    background: radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%);
    animation: orbFloat2 24s ease-in-out infinite;
  }
  .dya-orb-3 {
    width: 300px; height: 300px; top: 50%; left: 50%; transform: translate(-50%,-50%);
    background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
    animation: orbFloat1 30s ease-in-out infinite reverse;
  }

  .dya-card {
    width: 100%; max-width: 400px;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 28px;
    padding: 44px 36px 40px;
    box-shadow:
      0 32px 80px rgba(0,0,0,0.5),
      0 0 0 1px rgba(255,255,255,0.04) inset,
      inset 0 1px 0 rgba(255,255,255,0.1);
    position: relative; z-index: 1;
    animation: fadeUp 0.6s ease both, borderGlow 4s ease infinite;
  }

  .dya-header { text-align: center; margin-bottom: 36px; }

  .dya-logo-ring {
    display: inline-block; margin-bottom: 18px;
    padding: 5px; border-radius: 28px;
    background: linear-gradient(135deg, rgba(139,92,246,0.6), rgba(236,72,153,0.6));
    animation: ringPulse 3s ease-in-out infinite;
  }
  .dya-logo-wrap {
    width: 80px; height: 80px; border-radius: 23px;
    background: #ffffff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    animation: float 4s ease-in-out infinite;
  }
  .dya-logo { height: 52px; width: auto; }

  .dya-title {
    margin: 0 0 6px; font-size: 24px; font-weight: 900; letter-spacing: -0.3px;
    background: linear-gradient(135deg, #ffffff 0%, #c084fc 50%, #f472b6 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .dya-sub {
    margin: 0; font-size: 13px; color: rgba(255,255,255,0.35); font-weight: 500;
  }

  .dya-form { display: flex; flex-direction: column; gap: 0; }
  .dya-field { margin-bottom: 18px; }

  .dya-label {
    display: block; font-size: 12px; font-weight: 800;
    color: rgba(255,255,255,0.45); letter-spacing: 0.05em;
    text-transform: uppercase; margin-bottom: 8px;
  }

  .dya-input {
    width: 100%; padding: 13px 16px;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 12px; font-size: 15px; color: #fff;
    outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }
  .dya-input::placeholder { color: rgba(255,255,255,0.2); }
  .dya-input:focus {
    border-color: rgba(139,92,246,0.6);
    background: rgba(139,92,246,0.08);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
  }

  .dya-error {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
    color: #fca5a5; border-radius: 10px; padding: 11px 14px;
    font-size: 13px; font-weight: 600; margin-bottom: 18px;
    display: flex; align-items: center; gap: 8px;
  }

  .dya-submit {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #7c3aed, #a855f7, #ec4899);
    background-size: 200% 200%; animation: gradientShift 4s ease infinite;
    color: #fff; border: none; border-radius: 14px;
    font-size: 16px; font-weight: 800; cursor: pointer;
    box-shadow: 0 4px 20px rgba(139,92,246,0.4);
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    letter-spacing: 0.2px;
  }
  .dya-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(139,92,246,0.55);
  }
  .dya-submit:active:not(:disabled) { transform: translateY(0); }
  .dya-submit:disabled {
    opacity: 0.4; cursor: not-allowed;
  }

  .dya-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spinnerAnim 0.7s linear infinite;
    display: inline-block;
  }

  .dya-loading-text { text-align: center; color: rgba(255,255,255,0.3); font-size: 14px; }

  /* ── Responsive mobile ── */
  @media (max-width: 480px) {
    .dya-page { padding: 16px 12px; }
    .dya-card {
      padding: 30px 18px 26px;
      border-radius: 22px;
      max-width: 100%;
    }
    .dya-logo-wrap { width: 68px; height: 68px; border-radius: 19px; }
    .dya-logo { height: 44px; }
    .dya-title { font-size: 20px; }
    .dya-header { margin-bottom: 26px; }
    .dya-input { font-size: 14px; padding: 11px 14px; }
    .dya-submit { font-size: 15px; padding: 13px; }
  }
`;
