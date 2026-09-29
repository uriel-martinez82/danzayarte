'use client';

import { useEffect, useState, useCallback } from 'react';

interface AutorizacionEnsayo {
  id: number;
  created_at: string;
  alumno_nombre: string;
  alumno_apellido: string;
  alumno_dni: string;
  responsable_nombre: string;
  responsable_apellido: string;
  responsable_dni: string;
  responsable_email: string;
}

export default function AutorizacionesEnsayoPage() {
  const [datos,    setDatos]    = useState<AutorizacionEnsayo[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [exportando, setExportando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/autorizaciones-ensayo');
      if (!res.ok) throw new Error('Error al cargar');
      setDatos(await res.json());
      setCountdown(30);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Auto-refresh countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { cargar(); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [cargar]);

  const filtrados = datos.filter(a => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      a.alumno_nombre.toLowerCase().includes(q) ||
      a.alumno_apellido.toLowerCase().includes(q) ||
      a.alumno_dni.toLowerCase().includes(q) ||
      a.responsable_nombre.toLowerCase().includes(q) ||
      a.responsable_apellido.toLowerCase().includes(q) ||
      a.responsable_email.toLowerCase().includes(q)
    );
  });

  async function exportarExcel() {
    setExportando(true);
    try {
      if (!(window as any).XLSX) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('No se pudo cargar XLSX.'));
          document.head.appendChild(s);
        });
      }
      const XLSX = (window as any).XLSX;
      const wb = XLSX.utils.book_new();

      const rows = [
        ['Fecha', 'Alumno/a Apellido', 'Alumno/a Nombre', 'DNI Alumno/a',
         'Resp. Apellido', 'Resp. Nombre', 'DNI Responsable', 'Email Responsable'],
        ...filtrados.map(a => [
          new Date(a.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          a.alumno_apellido, a.alumno_nombre, a.alumno_dni,
          a.responsable_apellido, a.responsable_nombre, a.responsable_dni, a.responsable_email,
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 14 },
        { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Autorizaciones Ensayo');

      const fecha = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `autorizaciones-ensayo-${fecha}.xlsx`);
    } catch (e) {
      alert('Error al exportar: ' + (e instanceof Error ? e.message : 'Error'));
    } finally {
      setExportando(false);
    }
  }

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ae-page">
        <div className="ae-orb ae-orb-1" />
        <div className="ae-orb ae-orb-2" />

        <div className="ae-container">

          {/* Header */}
          <div className="ae-header">
            <div>
              <a href="/admin" className="ae-back">← Panel</a>
              <h1 className="ae-title">Autorizaciones <span className="ae-accent">Ensayo General</span></h1>
              <p className="ae-sub">Teatro Astral — 14 y/o 15 de noviembre del 2026</p>
            </div>
            <div className="ae-header-actions">
              <button onClick={exportarExcel} disabled={exportando || filtrados.length === 0} className="ae-btn ae-btn-export">
                {exportando ? '⏳' : '📥'} Excel
              </button>
              <button onClick={cargar} disabled={loading} className="ae-btn ae-btn-refresh">
                {loading ? '…' : `↻ ${countdown}s`}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="ae-stats">
            <div className="ae-stat-card">
              <div className="ae-stat-num">{datos.length}</div>
              <div className="ae-stat-label">Total registradas</div>
            </div>
            <div className="ae-stat-card">
              <div className="ae-stat-num ae-accent">{filtrados.length}</div>
              <div className="ae-stat-label">Mostrando</div>
            </div>
          </div>

          {/* Search */}
          <div className="ae-search-wrap">
            <span className="ae-search-icon">🔍</span>
            <input
              className="ae-search"
              type="text"
              placeholder="Buscar por nombre, apellido, DNI o email…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button className="ae-search-clear" onClick={() => setBusqueda('')}>✕</button>
            )}
          </div>

          {/* Error */}
          {error && <div className="ae-error">⚠ {error}</div>}

          {/* Lista */}
          {loading && datos.length === 0 ? (
            <div className="ae-empty">Cargando…</div>
          ) : filtrados.length === 0 ? (
            <div className="ae-empty">{busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay autorizaciones aún.'}</div>
          ) : (
            <div className="ae-list">
              {filtrados.map((a, i) => (
                <div key={a.id} className="ae-card" style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}>
                  <div className="ae-card-top">
                    <div className="ae-num">#{datos.length - datos.findIndex(d => d.id === a.id)}</div>
                    <div className="ae-fecha">{formatFecha(a.created_at)}</div>
                  </div>
                  <div className="ae-card-body">
                    <div className="ae-section">
                      <div className="ae-section-label">👧 Alumno/a</div>
                      <div className="ae-name">{a.alumno_apellido}, {a.alumno_nombre}</div>
                      <div className="ae-dni">DNI {a.alumno_dni}</div>
                    </div>
                    <div className="ae-divider" />
                    <div className="ae-section">
                      <div className="ae-section-label">👤 Responsable</div>
                      <div className="ae-name">{a.responsable_apellido}, {a.responsable_nombre}</div>
                      <div className="ae-dni">DNI {a.responsable_dni}</div>
                      <div className="ae-email">{a.responsable_email}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

const CSS = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes orbFloat {
    0%, 100% { transform: translate(0,0) scale(1); }
    50%       { transform: translate(20px,-15px) scale(1.05); }
  }

  .ae-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0d0b1e 0%, #1a1040 35%, #0f1e3d 65%, #1a0d2e 100%);
    font-family: system-ui, -apple-system, sans-serif;
    padding: clamp(20px, 4vw, 48px) 16px;
    position: relative; overflow-x: hidden;
  }
  .ae-orb {
    position: fixed; border-radius: 50%;
    filter: blur(80px); pointer-events: none; z-index: 0;
  }
  .ae-orb-1 {
    width: 500px; height: 500px; top: -120px; left: -150px;
    background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
    animation: orbFloat 18s ease-in-out infinite;
  }
  .ae-orb-2 {
    width: 400px; height: 400px; bottom: -80px; right: -100px;
    background: radial-gradient(circle, rgba(167,139,250,0.14) 0%, transparent 70%);
    animation: orbFloat 22s ease-in-out infinite reverse;
  }

  .ae-container {
    width: 100%; max-width: 740px; margin: 0 auto;
    position: relative; z-index: 1;
  }

  .ae-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; margin-bottom: 28px; flex-wrap: wrap;
    animation: fadeUp 0.5s ease both;
  }
  .ae-back {
    display: inline-block; font-size: 13px; font-weight: 700;
    color: rgba(255,255,255,0.4); text-decoration: none;
    margin-bottom: 8px; transition: color 0.15s;
  }
  .ae-back:hover { color: rgba(255,255,255,0.75); }
  .ae-title {
    margin: 0 0 4px; font-size: clamp(20px, 4vw, 26px);
    font-weight: 900; color: #fff; letter-spacing: -0.5px;
  }
  .ae-accent { color: #a78bfa; }
  .ae-sub { margin: 0; font-size: 13px; color: rgba(255,255,255,0.35); }

  .ae-header-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }

  .ae-btn {
    padding: 9px 16px; font-size: 13px; font-weight: 700;
    border-radius: 10px; border: 1.5px solid; cursor: pointer;
    transition: transform 0.15s, opacity 0.15s;
    white-space: nowrap;
  }
  .ae-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .ae-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .ae-btn-export {
    background: rgba(5,150,105,0.15); color: #34d399;
    border-color: rgba(52,211,153,0.3);
  }
  .ae-btn-refresh {
    background: rgba(167,139,250,0.1); color: #a78bfa;
    border-color: rgba(167,139,250,0.25);
    font-variant-numeric: tabular-nums;
  }

  .ae-stats {
    display: flex; gap: 12px; margin-bottom: 20px;
    animation: fadeUp 0.5s 0.05s ease both;
  }
  .ae-stat-card {
    flex: 1; background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 14px 18px;
    backdrop-filter: blur(20px);
  }
  .ae-stat-num { font-size: 28px; font-weight: 900; color: #fff; }
  .ae-stat-label { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; }

  .ae-search-wrap {
    position: relative; margin-bottom: 20px;
    animation: fadeUp 0.5s 0.1s ease both;
  }
  .ae-search-icon {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%); font-size: 15px; pointer-events: none;
  }
  .ae-search {
    width: 100%; padding: 12px 40px 12px 40px;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 12px; color: #fff; font-size: 14px;
    outline: none; box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s;
  }
  .ae-search::placeholder { color: rgba(255,255,255,0.25); }
  .ae-search:focus { border-color: rgba(167,139,250,0.5); background: rgba(167,139,250,0.07); }
  .ae-search-clear {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: rgba(255,255,255,0.4);
    font-size: 14px; cursor: pointer; padding: 4px 6px;
  }
  .ae-search-clear:hover { color: #fff; }

  .ae-error {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
    color: #fca5a5; border-radius: 10px; padding: 12px 16px;
    font-size: 14px; margin-bottom: 16px;
  }
  .ae-empty {
    text-align: center; color: rgba(255,255,255,0.3);
    font-size: 15px; padding: 48px 0;
  }

  .ae-list { display: flex; flex-direction: column; gap: 10px; }

  .ae-card {
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 18px 20px;
    backdrop-filter: blur(20px);
    animation: fadeUp 0.4s ease both;
    transition: border-color 0.2s, background 0.2s;
  }
  .ae-card:hover {
    border-color: rgba(167,139,250,0.3);
    background: rgba(167,139,250,0.06);
  }

  .ae-card-top {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 14px;
  }
  .ae-num {
    font-size: 11px; font-weight: 800; letter-spacing: 0.06em;
    color: rgba(167,139,250,0.6);
  }
  .ae-fecha { font-size: 11px; color: rgba(255,255,255,0.3); }

  .ae-card-body { display: flex; gap: 20px; flex-wrap: wrap; }
  .ae-section { flex: 1; min-width: 200px; }
  .ae-section-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: rgba(255,255,255,0.3);
    margin-bottom: 6px;
  }
  .ae-name { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 3px; }
  .ae-dni  { font-size: 12px; color: rgba(255,255,255,0.45); margin-bottom: 2px; }
  .ae-email {
    font-size: 12px; color: #a78bfa; margin-top: 4px;
    word-break: break-all;
  }

  .ae-divider {
    width: 1px; background: rgba(255,255,255,0.08);
    flex-shrink: 0; margin: 0 4px;
  }

  @media (max-width: 600px) {
    .ae-divider { display: none; }
    .ae-section { min-width: 100%; }
    .ae-card-body { gap: 14px; }
    .ae-card { padding: 14px 16px; }
    .ae-stats { gap: 8px; }
    .ae-stat-num { font-size: 24px; }
  }
`;
