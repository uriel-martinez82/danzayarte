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

function pdfUrl(a: AutorizacionEnsayo) {
  const p = new URLSearchParams({
    alumno_nombre: a.alumno_nombre, alumno_apellido: a.alumno_apellido, alumno_dni: a.alumno_dni,
    responsable_nombre: a.responsable_nombre, responsable_apellido: a.responsable_apellido,
    responsable_dni: a.responsable_dni,
  });
  return `/api/admin/autorizaciones-ensayo/pdf?${p}`;
}

export default function AutorizacionesEnsayoPage() {
  const [datos,     setDatos]     = useState<AutorizacionEnsayo[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [busqueda,  setBusqueda]  = useState('');
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

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => { if (c <= 1) { cargar(); return 30; } return c - 1; });
    }, 1000);
    return () => clearInterval(tick);
  }, [cargar]);

  const filtrados = datos.filter(a => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return [a.alumno_nombre, a.alumno_apellido, a.alumno_dni,
            a.responsable_nombre, a.responsable_apellido, a.responsable_email]
      .some(v => v.toLowerCase().includes(q));
  });

  async function exportarExcel() {
    setExportando(true);
    try {
      if (!(window as any).XLSX) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          s.onload = () => resolve(); s.onerror = () => reject(new Error('No se pudo cargar XLSX.'));
          document.head.appendChild(s);
        });
      }
      const XLSX = (window as any).XLSX;
      const wb = XLSX.utils.book_new();
      const rows = [
        ['#', 'Fecha', 'Apellido Alumno/a', 'Nombre Alumno/a', 'DNI Alumno/a',
         'Apellido Responsable', 'Nombre Responsable', 'DNI Responsable', 'Email Responsable'],
        ...filtrados.map((a, i) => [
          filtrados.length - i,
          new Date(a.created_at).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
          a.alumno_apellido, a.alumno_nombre, a.alumno_dni,
          a.responsable_apellido, a.responsable_nombre, a.responsable_dni, a.responsable_email,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch:5 },{ wch:18 },{ wch:20 },{ wch:20 },{ wch:13 },{ wch:20 },{ wch:20 },{ wch:13 },{ wch:30 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Ensayo General');
      XLSX.writeFile(wb, `autorizaciones-ensayo-${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) {
      alert('Error al exportar: ' + (e instanceof Error ? e.message : 'Error'));
    } finally { setExportando(false); }
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ae-page">
        <div className="ae-orb ae-orb-1" /><div className="ae-orb ae-orb-2" />
        <div className="ae-wrap">

          {/* Header */}
          <div className="ae-header">
            <div>
              <a href="/admin" className="ae-back">← Panel admin</a>
              <h1 className="ae-title">Autorizaciones <span className="ae-hl">Ensayo General</span></h1>
              <p className="ae-sub">Teatro Astral — 14 y/o 15 de noviembre del 2026</p>
            </div>
            <div className="ae-hactions">
              <button onClick={exportarExcel} disabled={exportando || filtrados.length === 0} className="ae-btn ae-btn-xl">
                {exportando ? '⏳' : '📥'} Excel
              </button>
              <button onClick={cargar} disabled={loading} className="ae-btn ae-btn-ref">
                {loading ? '…' : `↻ ${countdown}s`}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="ae-stats">
            <div className="ae-stat"><span className="ae-snum">{datos.length}</span><span className="ae-slbl">Total</span></div>
            <div className="ae-stat"><span className="ae-snum ae-hl">{filtrados.length}</span><span className="ae-slbl">Mostrando</span></div>
          </div>

          {/* Search */}
          <div className="ae-sbox">
            <span className="ae-sicon">🔍</span>
            <input className="ae-sinput" type="text" placeholder="Buscar por nombre, apellido, DNI o email…"
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            {busqueda && <button className="ae-sclear" onClick={() => setBusqueda('')}>✕</button>}
          </div>

          {error && <div className="ae-error">⚠ {error}</div>}

          {/* Tabla */}
          {loading && datos.length === 0 ? (
            <div className="ae-empty">Cargando…</div>
          ) : filtrados.length === 0 ? (
            <div className="ae-empty">{busqueda ? 'Sin resultados.' : 'No hay autorizaciones aún.'}</div>
          ) : (
            <div className="ae-table-wrap">
              <table className="ae-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>Alumno/a</th>
                    <th>DNI alumno/a</th>
                    <th>Responsable</th>
                    <th>DNI resp.</th>
                    <th>Email</th>
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((a, i) => (
                    <tr key={a.id}>
                      <td className="ae-td-num">{filtrados.length - i}</td>
                      <td className="ae-td-fecha">{fmt(a.created_at)}</td>
                      <td><span className="ae-nombre">{a.alumno_apellido}, {a.alumno_nombre}</span></td>
                      <td className="ae-td-dni">{a.alumno_dni}</td>
                      <td><span className="ae-nombre">{a.responsable_apellido}, {a.responsable_nombre}</span></td>
                      <td className="ae-td-dni">{a.responsable_dni}</td>
                      <td className="ae-td-email">{a.responsable_email}</td>
                      <td>
                        <a href={pdfUrl(a)} target="_blank" rel="noopener noreferrer" className="ae-pdf-btn" title="Ver PDF">
                          📄 PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes orb1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(24px,-18px)} }
  @keyframes orb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-18px,14px)} }

  .ae-page {
    min-height:100vh;
    background:linear-gradient(135deg,#0d0b1e 0%,#1a1040 35%,#0f1e3d 65%,#1a0d2e 100%);
    font-family:system-ui,-apple-system,sans-serif;
    padding:clamp(16px,4vw,44px) 12px;
    position:relative; overflow-x:hidden;
  }
  .ae-orb { position:fixed; border-radius:50%; filter:blur(80px); pointer-events:none; z-index:0; }
  .ae-orb-1 { width:500px;height:500px;top:-120px;left:-150px;
    background:radial-gradient(circle,rgba(139,92,246,.18) 0%,transparent 70%);
    animation:orb1 18s ease-in-out infinite; }
  .ae-orb-2 { width:400px;height:400px;bottom:-80px;right:-100px;
    background:radial-gradient(circle,rgba(167,139,250,.14) 0%,transparent 70%);
    animation:orb2 22s ease-in-out infinite; }

  .ae-wrap { width:100%; max-width:1100px; margin:0 auto; position:relative; z-index:1; }

  .ae-header { display:flex; align-items:flex-start; justify-content:space-between;
    gap:14px; margin-bottom:22px; flex-wrap:wrap; animation:fadeUp .5s ease both; }
  .ae-back { display:inline-block; font-size:13px; font-weight:700;
    color:rgba(255,255,255,.4); text-decoration:none; margin-bottom:6px;
    transition:color .15s; }
  .ae-back:hover { color:rgba(255,255,255,.75); }
  .ae-title { margin:0 0 4px; font-size:clamp(18px,4vw,24px); font-weight:900;
    color:#fff; letter-spacing:-.5px; }
  .ae-hl { color:#a78bfa; }
  .ae-sub { margin:0; font-size:13px; color:rgba(255,255,255,.35); }
  .ae-hactions { display:flex; gap:8px; align-items:center; flex-shrink:0; }

  .ae-btn { padding:9px 16px; font-size:13px; font-weight:700; border-radius:10px;
    border:1.5px solid; cursor:pointer; transition:transform .15s,opacity .15s; white-space:nowrap; }
  .ae-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .ae-btn:disabled { opacity:.4; cursor:not-allowed; }
  .ae-btn-xl { background:rgba(5,150,105,.15); color:#34d399; border-color:rgba(52,211,153,.3); }
  .ae-btn-ref { background:rgba(167,139,250,.1); color:#a78bfa; border-color:rgba(167,139,250,.25);
    font-variant-numeric:tabular-nums; }

  .ae-stats { display:flex; gap:10px; margin-bottom:16px; animation:fadeUp .5s .05s ease both; }
  .ae-stat { flex:0 0 auto; background:rgba(255,255,255,.04); border:1.5px solid rgba(255,255,255,.08);
    border-radius:12px; padding:12px 20px; display:flex; align-items:center; gap:10px; }
  .ae-snum { font-size:26px; font-weight:900; color:#fff; }
  .ae-slbl { font-size:11px; color:rgba(255,255,255,.3); }

  .ae-sbox { position:relative; margin-bottom:16px; animation:fadeUp .5s .1s ease both; }
  .ae-sicon { position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none; }
  .ae-sinput { width:100%; padding:11px 36px 11px 38px; background:rgba(255,255,255,.05);
    border:1.5px solid rgba(255,255,255,.1); border-radius:12px; color:#fff; font-size:14px;
    outline:none; box-sizing:border-box; transition:border-color .15s,background .15s; }
  .ae-sinput::placeholder { color:rgba(255,255,255,.25); }
  .ae-sinput:focus { border-color:rgba(167,139,250,.5); background:rgba(167,139,250,.07); }
  .ae-sclear { position:absolute;right:11px;top:50%;transform:translateY(-50%);
    background:none;border:none;color:rgba(255,255,255,.4);font-size:14px;cursor:pointer;padding:4px 6px; }
  .ae-sclear:hover { color:#fff; }

  .ae-error { background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);
    color:#fca5a5;border-radius:10px;padding:12px 16px;font-size:14px;margin-bottom:14px; }
  .ae-empty { text-align:center;color:rgba(255,255,255,.3);font-size:15px;padding:48px 0; }

  /* Tabla */
  .ae-table-wrap {
    overflow-x:auto;
    border-radius:16px;
    border:1.5px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
    backdrop-filter:blur(20px);
    animation:fadeUp .4s .15s ease both;
  }
  .ae-table {
    width:100%; border-collapse:collapse;
    font-size:13px;
  }
  .ae-table thead tr {
    border-bottom:1px solid rgba(255,255,255,.1);
  }
  .ae-table th {
    padding:13px 14px; text-align:left;
    font-size:11px; font-weight:800; letter-spacing:.07em; text-transform:uppercase;
    color:rgba(255,255,255,.35); white-space:nowrap;
  }
  .ae-table tbody tr {
    border-bottom:1px solid rgba(255,255,255,.05);
    transition:background .15s;
  }
  .ae-table tbody tr:last-child { border-bottom:none; }
  .ae-table tbody tr:hover { background:rgba(167,139,250,.07); }
  .ae-table td { padding:12px 14px; vertical-align:middle; }

  .ae-td-num   { color:rgba(167,139,250,.5); font-size:11px; font-weight:800; width:36px; }
  .ae-td-fecha { color:rgba(255,255,255,.4); font-size:11px; white-space:nowrap; }
  .ae-td-dni   { color:rgba(255,255,255,.55); font-size:12px; white-space:nowrap; }
  .ae-td-email { color:#a78bfa; font-size:12px; word-break:break-all; }
  .ae-nombre   { color:#fff; font-weight:600; }

  .ae-pdf-btn {
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700;
    background:rgba(124,58,237,.15); color:#a78bfa;
    border:1px solid rgba(124,58,237,.3);
    text-decoration:none; white-space:nowrap;
    transition:background .15s, transform .15s;
  }
  .ae-pdf-btn:hover { background:rgba(124,58,237,.28); transform:translateY(-1px); }

  @media(max-width:700px) {
    .ae-table th, .ae-table td { padding:10px 10px; }
    .ae-td-email { max-width:120px; }
  }
`;
