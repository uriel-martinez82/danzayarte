'use client';

import { useEffect, useState } from 'react';
import { LOGO_BASE64 } from '@/lib/logo';

interface Stats { totalReservas: number; showActivo: string; }

/* ─── Share button ─────────────────────────────────────────── */
function ShareButton({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function compartir(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const full = `${window.location.origin}${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: label, url: full }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(full);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  }

  function abrirWsp(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    window.open(`https://wa.me/?text=${encodeURIComponent(`${window.location.origin}${url}`)}`, '_blank');
  }

  return (
    <>
      <button onClick={compartir} className="dya-btn dya-btn-share">
        {copied ? '✅ Copiado' : '🔗 Compartir'}
      </button>
      <button onClick={abrirWsp} className="dya-btn dya-btn-wsp">
        📲 WhatsApp
      </button>
    </>
  );
}

/* ─── Main page ────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/turnos').then(r => r.json()),
      fetch('/api/admin/turnos/config').then(r => r.json()),
    ]).then(([reservas, conf]) => {
      setStats({ totalReservas: Array.isArray(reservas) ? reservas.length : 0, showActivo: conf.showActivo ?? '0' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function salir() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    window.location.href = '/admin/login';
  }

  const showLabel: Record<string, string> = {
    '0': 'Sin show activo',
    '1': 'Show 1 — 28 de noviembre',
    '2': 'Show 2 — 6 de diciembre',
  };

  const MODULOS = [
    {
      href: '/admin/autorizaciones', emoji: '📋', title: 'Autorizaciones',
      desc: 'Revisá y confirmá las autorizaciones enviadas por los responsables.',
      accent: 'cyan', stat: null as string | null,
    },
    {
      href: '/admin/turnos', emoji: '🎟️', title: 'Turnos',
      desc: 'Gestioná los slots del show: asigná, editá y liberá turnos.',
      accent: 'violet',
      stat: loading ? '…' : `${stats?.totalReservas ?? 0} reservas · ${showLabel[stats?.showActivo ?? '0']}`,
    },
  ];

  const PAGINAS = [
    {
      url: '/autorizacion/1', emoji: '📝', title: 'Autorización — Show 1 (28 Nov)', accent: 'green',
      desc: 'Formulario de autorización para el Show del 28 de noviembre.',
    },
    {
      url: '/autorizacion/2', emoji: '📝', title: 'Autorización — Show 2 (6 Dic)', accent: 'teal',
      desc: 'Formulario de autorización para el Show del 6 de diciembre.',
    },
    {
      url: '/verificacion', emoji: '✅', title: 'Confirmación de datos', accent: 'amber',
      desc: 'Los responsables ingresan con el DNI del alumno y la clave "danzayarte" para confirmar los datos registrados.',
    },
    {
      url: '/turnos', emoji: '📅', title: 'Reserva de turnos', accent: 'purple',
      desc: 'Los alumnos confirmados eligen su turno para el show ingresando con su DNI y la clave "show2026".',
    },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="dya-page">

        {/* Orbs decorativos */}
        <div className="dya-orb dya-orb-1" />
        <div className="dya-orb dya-orb-2" />
        <div className="dya-orb dya-orb-3" />

        <div className="dya-container">

          {/* Hero */}
          <div className="dya-hero">
            <div className="dya-logo-ring">
              <div className="dya-logo-wrap">
                <img src={LOGO_BASE64} alt="Danza y Arte" className="dya-logo" />
              </div>
            </div>
            <h1 className="dya-title">Panel de administración</h1>
            <p className="dya-sub">Danza y Arte — Agustina Spera</p>
          </div>

          {/* Módulos */}
          <p className="dya-section-label">🛠 Módulos de administración</p>
          <div className="dya-grid">
            {MODULOS.map(m => (
              <a key={m.href} href={m.href} className={`dya-mod-card accent-${m.accent}`}>
                <div className="dya-emoji">{m.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={`dya-card-title color-${m.accent}`}>{m.title}</div>
                  <div className="dya-card-desc">{m.desc}</div>
                  {m.stat && <div className={`dya-stat color-${m.accent}`}>{m.stat}</div>}
                </div>
                <div className="dya-arrow">→</div>
              </a>
            ))}
          </div>

          {/* Páginas públicas */}
          <p className="dya-section-label">🔗 Páginas para compartir</p>
          <div className="dya-grid">
            {PAGINAS.map(p => (
              <div key={p.url} className={`dya-share-card accent-${p.accent}`}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div className="dya-emoji">{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={`dya-card-title color-${p.accent}`}>{p.title}</div>
                    <div className="dya-card-desc">{p.desc}</div>
                    <div className="dya-url-pill">{p.url}</div>
                    <div className="dya-btns">
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className={`dya-btn dya-btn-ver ver-${p.accent}`}>
                        👁 Ver
                      </a>
                      <ShareButton url={p.url} label={p.title} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingBottom: 32 }}>
            <button onClick={salir} className="dya-logout">Cerrar sesión</button>
          </div>

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
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(30px, -20px) scale(1.05); }
    66%       { transform: translate(-20px, 15px) scale(0.95); }
  }
  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(-25px, 20px) scale(1.08); }
    66%       { transform: translate(20px, -15px) scale(0.92); }
  }
  @keyframes ringPulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50%       { opacity: 0.9; transform: scale(1.06); }
  }
  @keyframes shimmerBtn {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .dya-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0d0b1e 0%, #1a1040 35%, #0f1e3d 65%, #1a0d2e 100%);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    display: flex; align-items: flex-start; justify-content: center;
    padding: clamp(24px, 5vw, 60px) 16px;
    font-family: system-ui, -apple-system, sans-serif;
    position: relative; overflow-x: hidden;
  }

  /* Orbs de fondo */
  .dya-orb {
    position: fixed; border-radius: 50%;
    filter: blur(80px); pointer-events: none; z-index: 0;
  }
  .dya-orb-1 {
    width: 500px; height: 500px; top: -100px; left: -150px;
    background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
    animation: orbFloat1 18s ease-in-out infinite;
  }
  .dya-orb-2 {
    width: 400px; height: 400px; bottom: -80px; right: -100px;
    background: radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%);
    animation: orbFloat2 22s ease-in-out infinite;
  }
  .dya-orb-3 {
    width: 300px; height: 300px; top: 40%; left: 50%; transform: translate(-50%,-50%);
    background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
    animation: orbFloat1 25s ease-in-out infinite reverse;
  }

  .dya-container {
    width: 100%; max-width: 680px;
    position: relative; z-index: 1;
  }

  /* Hero */
  .dya-hero {
    text-align: center; margin-bottom: 40px;
    animation: fadeUp 0.7s ease both;
  }
  .dya-logo-ring {
    display: inline-block; margin-bottom: 20px;
    padding: 6px; border-radius: 32px;
    background: linear-gradient(135deg, rgba(139,92,246,0.5), rgba(236,72,153,0.5));
    animation: ringPulse 3s ease-in-out infinite;
    box-shadow: 0 0 40px rgba(139,92,246,0.3);
  }
  .dya-logo-wrap {
    width: 90px; height: 90px; border-radius: 26px;
    background: #ffffff;
    display: flex; align-items: center; justify-content: center;
    animation: float 4.5s ease-in-out infinite;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  }
  .dya-logo { height: 60px; width: auto; }
  .dya-title {
    margin: 0 0 8px; font-size: clamp(22px, 5vw, 30px); font-weight: 900;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #ffffff 0%, #c084fc 45%, #f472b6 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .dya-sub {
    margin: 0; font-size: 14px; color: rgba(255,255,255,0.4);
    font-weight: 500; letter-spacing: 0.3px;
  }

  /* Section label */
  .dya-section-label {
    font-size: 11px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: rgba(255,255,255,0.3);
    margin: 0 0 12px;
    animation: fadeUp 0.5s ease both;
  }

  /* Grid */
  .dya-grid {
    display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px;
  }
  .dya-grid > *:nth-child(1) { animation: fadeUp 0.5s 0.05s ease both; }
  .dya-grid > *:nth-child(2) { animation: fadeUp 0.5s 0.15s ease both; }
  .dya-grid > *:nth-child(3) { animation: fadeUp 0.5s 0.25s ease both; }

  /* Mod card */
  .dya-mod-card {
    display: flex; align-items: center; gap: 18px;
    padding: 20px 22px; border-radius: 20px;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid rgba(255,255,255,0.08);
    text-decoration: none;
    box-shadow: 0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
    position: relative; overflow: hidden;
  }
  .dya-mod-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 55%);
    pointer-events: none;
  }
  .dya-mod-card:hover {
    transform: translateY(-4px) scale(1.005);
    background: rgba(255,255,255,0.07);
  }
  .dya-mod-card.accent-cyan:hover  { border-color: rgba(34,211,238,0.4); box-shadow: 0 16px 48px rgba(34,211,238,0.15), 0 4px 24px rgba(0,0,0,0.3); }
  .dya-mod-card.accent-violet:hover { border-color: rgba(167,139,250,0.4); box-shadow: 0 16px 48px rgba(167,139,250,0.15), 0 4px 24px rgba(0,0,0,0.3); }

  /* Share card */
  .dya-share-card {
    padding: 22px; border-radius: 20px;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid rgba(255,255,255,0.08);
    box-shadow: 0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    position: relative; overflow: hidden;
  }
  .dya-share-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 55%);
    pointer-events: none;
  }
  .dya-share-card:hover { transform: translateY(-3px); }
  .dya-share-card.accent-green:hover  { border-color: rgba(52,211,153,0.35);  box-shadow: 0 14px 40px rgba(52,211,153,0.12),  0 4px 24px rgba(0,0,0,0.25); }
  .dya-share-card.accent-teal:hover   { border-color: rgba(45,212,191,0.35);  box-shadow: 0 14px 40px rgba(45,212,191,0.12),  0 4px 24px rgba(0,0,0,0.25); }
  .dya-share-card.accent-amber:hover  { border-color: rgba(251,191,36,0.35);  box-shadow: 0 14px 40px rgba(251,191,36,0.12),  0 4px 24px rgba(0,0,0,0.25); }
  .dya-share-card.accent-purple:hover { border-color: rgba(192,132,252,0.35); box-shadow: 0 14px 40px rgba(192,132,252,0.12), 0 4px 24px rgba(0,0,0,0.25); }

  /* Typography */
  .dya-card-title { font-size: 16px; font-weight: 800; margin-bottom: 6px; }
  .dya-card-desc  { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin-bottom: 10px; }
  .dya-stat       { font-size: 12px; font-weight: 700; opacity: 0.6; margin-top: 4px; }
  .dya-emoji      { font-size: 34px; flex-shrink: 0; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4)); }
  .dya-arrow      {
    font-size: 18px; color: rgba(255,255,255,0.25); flex-shrink: 0;
    transition: transform 0.2s ease, color 0.2s ease;
  }
  .dya-mod-card:hover .dya-arrow { transform: translateX(5px); color: rgba(255,255,255,0.8); }

  /* Colors */
  .color-cyan   { color: #22d3ee; }
  .color-violet { color: #a78bfa; }
  .color-green  { color: #34d399; }
  .color-teal   { color: #2dd4bf; }
  .color-amber  { color: #fbbf24; }
  .color-purple { color: #c084fc; }

  /* URL pill */
  .dya-url-pill {
    display: inline-block; margin-bottom: 12px;
    font-size: 11px; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace;
    color: rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px; padding: 3px 10px;
  }

  /* Buttons row */
  .dya-btns { display: flex; gap: 8px; flex-wrap: wrap; }

  .dya-btn {
    padding: 8px 16px; font-size: 13px; font-weight: 700;
    border-radius: 10px; cursor: pointer; border: none;
    display: inline-flex; align-items: center; gap: 5px;
    text-decoration: none; white-space: nowrap;
    transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  }
  .dya-btn:hover { transform: translateY(-2px); opacity: 0.9; }
  .dya-btn:active { transform: translateY(0); }

  .dya-btn-ver {
    color: #fff;
    background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
    border: 1.5px solid rgba(255,255,255,0.18);
  }
  .ver-green  { background: linear-gradient(135deg, rgba(52,211,153,0.25),  rgba(52,211,153,0.1));  border-color: rgba(52,211,153,0.3); }
  .ver-teal   { background: linear-gradient(135deg, rgba(45,212,191,0.25),  rgba(45,212,191,0.1));  border-color: rgba(45,212,191,0.3); }
  .ver-amber  { background: linear-gradient(135deg, rgba(251,191,36,0.25),  rgba(251,191,36,0.1));  border-color: rgba(251,191,36,0.3); }
  .ver-purple { background: linear-gradient(135deg, rgba(192,132,252,0.25), rgba(192,132,252,0.1)); border-color: rgba(192,132,252,0.3); }
  .dya-btn-ver:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.3); }

  .dya-btn-share {
    background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7);
    border: 1.5px solid rgba(255,255,255,0.12);
  }
  .dya-btn-share:hover { background: rgba(255,255,255,0.1); }

  .dya-btn-wsp {
    background: linear-gradient(135deg, #25d366, #128c7e);
    color: #fff;
    box-shadow: 0 2px 12px rgba(37,211,102,0.25);
  }
  .dya-btn-wsp:hover { box-shadow: 0 4px 20px rgba(37,211,102,0.4); }

  /* Logout */
  .dya-logout {
    padding: 11px 30px; font-size: 14px; font-weight: 700;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);
    border: 1.5px solid rgba(255,255,255,0.08); border-radius: 12px;
    cursor: pointer; transition: all 0.2s ease;
  }
  .dya-logout:hover {
    background: rgba(239,68,68,0.12); color: #fca5a5;
    border-color: rgba(239,68,68,0.25);
    transform: translateY(-1px);
  }

  /* ── Responsive mobile ── */
  @media (max-width: 640px) {
    .dya-page { padding: 16px 12px; }
    .dya-logo-wrap { width: 72px; height: 72px; border-radius: 22px; }
    .dya-logo { height: 48px; }
    .dya-hero { margin-bottom: 28px; }
    .dya-title { font-size: clamp(20px, 6vw, 28px); }
    .dya-mod-card { padding: 16px; gap: 14px; }
    .dya-share-card { padding: 16px; }
    .dya-emoji { font-size: 28px; }
    .dya-btns { flex-direction: column; gap: 7px; }
    .dya-btn { justify-content: center; width: 100%; padding: 10px 14px; }
    .dya-card-title { font-size: 15px; }
    .dya-card-desc { font-size: 12px; margin-bottom: 8px; }
    .dya-url-pill { display: block; margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; }
    .dya-logout { width: 100%; }
  }
  @media (max-width: 400px) {
    .dya-title { font-size: 19px; }
    .dya-emoji { font-size: 24px; }
  }
`;
