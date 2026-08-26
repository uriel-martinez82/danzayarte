'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Fila {
  alumno_id:       string;
  responsable_id:  string;
  alumno_nombre:   string;
  alumno_apellido: string;
  alumno_dni:      string;
  resp_nombre:     string;
  resp_apellido:   string;
  resp_dni:        string;
  email:           string;
  show1:           boolean;
  show2:           boolean;
  confirmado:      boolean;
}

type Filtro = 'todos' | 'completos' | 'incompletos' | 'ninguno' | 'show1' | 'show2';

const REFRESH_SEG = 30;

export default function AdminAutorizacionesPage() {
  const [filas,        setFilas]        = useState<Fila[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [buscar,       setBuscar]       = useState('');
  const [filtro,       setFiltro]       = useState<Filtro>('todos');
  const [countdown,    setCountdown]    = useState(REFRESH_SEG);
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null);
  const [editando,     setEditando]     = useState<Fila | null>(null);
  const [editForm,     setEditForm]     = useState<Fila | null>(null);
  const [guardando,    setGuardando]    = useState(false);
  const [editError,    setEditError]    = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/autorizaciones');
      if (!res.ok) throw new Error('Error al cargar datos');
      setFilas(await res.json());
      setLastUpdate(new Date());
      setCountdown(REFRESH_SEG);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { cargar(true); return REFRESH_SEG; }
        return c - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cargar]);

  const porFiltro = (f: Fila) => {
    if (filtro === 'completos')   return f.show1 && f.show2;
    if (filtro === 'incompletos') return (f.show1 && !f.show2) || (!f.show1 && f.show2);
    if (filtro === 'ninguno')     return !f.show1 && !f.show2;
    if (filtro === 'show1')       return f.show1;
    if (filtro === 'show2')       return f.show2;
    return true;
  };

  const filtradas = filas.filter(f => {
    const q = buscar.toLowerCase();
    const matchBuscar =
      f.alumno_apellido.toLowerCase().includes(q) ||
      f.alumno_nombre.toLowerCase().includes(q)   ||
      f.alumno_dni.includes(q)                    ||
      f.resp_apellido.toLowerCase().includes(q)   ||
      f.email.toLowerCase().includes(q);
    return matchBuscar && porFiltro(f);
  });

  const totalCompletos   = filas.filter(f => f.show1 && f.show2).length;
  const totalIncompletos = filas.filter(f => (f.show1 && !f.show2) || (!f.show1 && f.show2)).length;
  const totalNinguno     = filas.filter(f => !f.show1 && !f.show2).length;
  const totalShow1       = filas.filter(f => f.show1).length;
  const totalShow2       = filas.filter(f => f.show2).length;
  const totalConfirmados = filas.filter(f => f.confirmado).length;

  function abrirEditar(f: Fila) {
    setEditando(f);
    setEditForm({ ...f });
    setEditError(null);
  }

  function cerrarEditar() {
    setEditando(null);
    setEditForm(null);
    setEditError(null);
  }

  async function guardarEdicion() {
    if (!editForm) return;
    setGuardando(true);
    setEditError(null);
    try {
      const res = await fetch('/api/admin/autorizaciones/editar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumno_id:      editForm.alumno_id,
          responsable_id: editForm.responsable_id,
          alumno_nombre:   editForm.alumno_nombre,
          alumno_apellido: editForm.alumno_apellido,
          alumno_dni:      editForm.alumno_dni,
          resp_nombre:     editForm.resp_nombre,
          resp_apellido:   editForm.resp_apellido,
          resp_dni:        editForm.resp_dni,
          email:           editForm.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar');
      cerrarEditar();
      cargar(true);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  }

  function imprimir() { window.print(); }

  function exportarCSV() {
    const encabezado = ['Apellido alumna','Nombre alumna','DNI alumna','Apellido responsable','Nombre responsable','DNI responsable','Email','Show 28 Nov','Show 6 Dic'];
    const filas_csv = filtradas.map(f => [
      f.alumno_apellido, f.alumno_nombre, f.alumno_dni,
      f.resp_apellido, f.resp_nombre, f.resp_dni,
      f.email, f.show1 ? 'SÍ' : 'NO', f.show2 ? 'SÍ' : 'NO',
    ]);
    const contenido = [encabezado, ...filas_csv].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `autorizaciones_danzayarte.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const estadoFila = (f: Fila) => {
    if (f.show1 && f.show2)   return 'completo';
    if (!f.show1 && !f.show2) return 'ninguno';
    return 'incompleto';
  };

  const bgFila = (f: Fila, i: number) => {
    const e = estadoFila(f);
    if (e === 'incompleto') return '#fffbeb';
    if (e === 'ninguno')    return '#fef2f2';
    return i % 2 === 0 ? '#fff' : '#f8fafc';
  };

  const TABS: { key: Filtro; label: string; count: number; color: string; glow: string }[] = [
    { key: 'todos',       label: 'Todos',          count: filas.length,     color: '#6d28d9', glow: 'rgba(109,40,217,0.3)' },
    { key: 'show1',       label: '📅 Show 28 Nov', count: totalShow1,       color: '#0891b2', glow: 'rgba(8,145,178,0.3)' },
    { key: 'show2',       label: '📅 Show 6 Dic',  count: totalShow2,       color: '#7c3aed', glow: 'rgba(124,58,237,0.3)' },
    { key: 'completos',   label: '✓ Ambos shows',  count: totalCompletos,   color: '#059669', glow: 'rgba(5,150,105,0.3)' },
    { key: 'incompletos', label: '⚠ Incompletos',  count: totalIncompletos, color: '#d97706', glow: 'rgba(217,119,6,0.3)' },
    { key: 'ninguno',     label: '✗ Sin firmar',   count: totalNinguno,     color: '#dc2626', glow: 'rgba(220,38,38,0.3)' },
  ];

  const pct = filas.length > 0 ? Math.round((totalCompletos / filas.length) * 100) : 0;

  return (
    <>
      <style>{CSS}</style>
      <div className="az-page">

        {/* Orbs fondo */}
        <div className="az-orb az-orb-1" />
        <div className="az-orb az-orb-2" />

        {/* ── Header ── */}
        <div className="az-header no-print">
          <div>
            <h1 className="az-title">📋 Autorizaciones</h1>
            <p className="az-sub">Danza y Arte — Show de Fin de Año</p>
          </div>
          <div className="az-header-actions">
            <span className="az-refresh-badge">
              {loading ? '↻ Actualizando…' : `↻ en ${countdown}s`}
            </span>
            <button onClick={() => cargar(false)} className="az-btn az-btn-primary" disabled={loading}>Actualizar</button>
            <button onClick={exportarCSV} className="az-btn az-btn-green" disabled={loading || filtradas.length === 0}>↓ CSV</button>
            <button onClick={imprimir}   className="az-btn az-btn-ghost" disabled={loading || filtradas.length === 0}>🖨 Imprimir</button>
            <a href="/admin" className="az-btn az-btn-ghost" style={{ textDecoration: 'none' }}>← Inicio</a>
            <button onClick={async () => { await fetch('/api/admin/login', { method: 'DELETE' }); window.location.href = '/admin/login'; }} className="az-btn az-btn-danger">Salir</button>
          </div>
        </div>

        {lastUpdate && (
          <p className="az-last-update no-print">
            Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
          </p>
        )}

        {/* ── Stats cards ── */}
        <div className="az-stats no-print">
          <StatCard label="Total alumnos"  value={filas.length}     color="#a78bfa" glow="rgba(167,139,250,0.2)" />
          <StatCard label="Show 28 Nov"    value={totalShow1}       color="#22d3ee" glow="rgba(34,211,238,0.2)" />
          <StatCard label="Show 6 Dic"     value={totalShow2}       color="#c084fc" glow="rgba(192,132,252,0.2)" />
          <StatCard label="Ambos ✓"        value={totalCompletos}   color="#34d399" glow="rgba(52,211,153,0.2)" />
          <StatCard label="Incompletos ⚠"  value={totalIncompletos} color="#fbbf24" glow="rgba(251,191,36,0.2)" />
          <StatCard label="Sin firmar ✗"   value={totalNinguno}     color="#f87171" glow="rgba(248,113,113,0.2)" />
          <StatCard label="Confirmados ✓"  value={totalConfirmados} color="#6ee7b7" glow="rgba(110,231,183,0.2)" />
        </div>

        {/* ── Progreso ── */}
        {filas.length > 0 && (
          <div className="az-progress-card no-print">
            <div className="az-progress-header">
              <span>Progreso de autorizaciones completas</span>
              <strong className="az-progress-pct">{pct}%</strong>
            </div>
            <div className="az-progress-bg">
              <div className="az-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* ── Filtros ── */}
        <div className="az-tabs no-print">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFiltro(t.key)}
              className={`az-tab ${filtro === t.key ? 'active' : ''}`}
              style={filtro === t.key ? { background: t.color, borderColor: t.color, boxShadow: `0 4px 16px ${t.glow}` } : {}}
            >
              {t.label}
              <span className={`az-tab-count ${filtro === t.key ? 'active' : ''}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── Buscador ── */}
        <div className="az-search-wrap no-print">
          <span className="az-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, DNI o email…"
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            className="az-search"
          />
        </div>

        {error && <div className="az-error">⚠ {error}</div>}

        {/* ── Leyenda ── */}
        <div className="az-leyenda no-print">
          <LeyendaItem color="#fff"    border="#e2e8f0" label="Ambos shows firmados" />
          <LeyendaItem color="#fffbeb" border="#fde68a" label="⚠ Falta un show" />
          <LeyendaItem color="#fef2f2" border="#fca5a5" label="✗ Sin ningún show" />
        </div>

        {/* ── Tabla ── */}
        <div className="az-table-wrap">
          <table className="az-table">
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Apellido y nombre (alumna)</Th>
                <Th>DNI alumna</Th>
                <Th>Apellido y nombre (responsable)</Th>
                <Th>DNI responsable</Th>
                <Th>Email</Th>
                <Th center>Show 28 Nov</Th>
                <Th center>Show 6 Dic</Th>
                <Th center>Confirmado</Th>
                <Th center>Editar</Th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="az-empty">Cargando…</td></tr>}
              {!loading && filtradas.length === 0 && (
                <tr><td colSpan={10} className="az-empty">
                  {buscar ? 'Sin resultados para esa búsqueda.' : 'No hay registros para este filtro.'}
                </td></tr>
              )}
              {filtradas.map((f, i) => (
                <tr key={i} style={{ background: bgFila(f, i) }}>
                  <Td muted>{i + 1}</Td>
                  <Td bold>{f.alumno_apellido}, {f.alumno_nombre}</Td>
                  <Td mono>{f.alumno_dni}</Td>
                  <Td>{f.resp_apellido}, {f.resp_nombre}</Td>
                  <Td mono>{f.resp_dni}</Td>
                  <Td muted small>{f.email}</Td>
                  <Td center><Check ok={f.show1} /></Td>
                  <Td center><Check ok={f.show2} /></Td>
                  <Td center><Check ok={f.confirmado} /></Td>
                  <Td center>
                    <button className="az-edit-btn" onClick={() => abrirEditar(f)}>✏️</button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtradas.length > 0 && (
          <p className="az-footer">
            Mostrando {filtradas.length} de {filas.length} registros
            {buscar && ` · búsqueda: "${buscar}"`}
          </p>
        )}
      </div>

      {/* ── Modal de edición ── */}
      {editando && editForm && (
        <div className="az-modal-overlay" onClick={cerrarEditar}>
          <div className="az-modal" onClick={e => e.stopPropagation()}>
            <div className="az-modal-header">
              <h2 className="az-modal-title">✏️ Editar registro</h2>
              <button className="az-modal-close" onClick={cerrarEditar}>✕</button>
            </div>

            <div className="az-modal-section">
              <p className="az-modal-section-label">Alumna</p>
              <div className="az-modal-row">
                <EditField label="Nombre" value={editForm.alumno_nombre}    onChange={v => setEditForm(f => f ? { ...f, alumno_nombre: v }    : f)} />
                <EditField label="Apellido" value={editForm.alumno_apellido} onChange={v => setEditForm(f => f ? { ...f, alumno_apellido: v } : f)} />
                <EditField label="DNI (sin puntos)" value={editForm.alumno_dni} onChange={v => setEditForm(f => f ? { ...f, alumno_dni: v.replace(/\./g, '') } : f)} highlight />
              </div>
            </div>

            <div className="az-modal-section">
              <p className="az-modal-section-label">Responsable</p>
              <div className="az-modal-row">
                <EditField label="Nombre" value={editForm.resp_nombre}    onChange={v => setEditForm(f => f ? { ...f, resp_nombre: v }    : f)} />
                <EditField label="Apellido" value={editForm.resp_apellido} onChange={v => setEditForm(f => f ? { ...f, resp_apellido: v } : f)} />
                <EditField label="DNI (sin puntos)" value={editForm.resp_dni} onChange={v => setEditForm(f => f ? { ...f, resp_dni: v.replace(/\./g, '') } : f)} highlight />
              </div>
              <div className="az-modal-row" style={{ marginTop: 10 }}>
                <EditField label="Email" value={editForm.email} onChange={v => setEditForm(f => f ? { ...f, email: v } : f)} wide />
              </div>
            </div>

            {editError && <div className="az-modal-error">⚠ {editError}</div>}

            <div className="az-modal-actions">
              <button className="az-btn az-btn-ghost" onClick={cerrarEditar} disabled={guardando}>Cancelar</button>
              <button className="az-btn az-btn-primary" onClick={guardarEdicion} disabled={guardando}>
                {guardando ? 'Guardando…' : '✓ Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Sub-componentes ── */
function StatCard({ label, value, color, glow }: { label: string; value: number; color: string; glow: string }) {
  return (
    <div className="az-stat-card" style={{ borderTop: `3px solid ${color}`, boxShadow: `0 4px 20px ${glow}, 0 1px 4px rgba(0,0,0,0.1)` }}>
      <span className="az-stat-num" style={{ color }}>{value}</span>
      <span className="az-stat-label">{label}</span>
    </div>
  );
}

function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return <th className="az-th" style={{ textAlign: center ? 'center' : 'left' }}>{children}</th>;
}

function Td({ children, bold, muted, mono, center, small }: {
  children: React.ReactNode;
  bold?: boolean; muted?: boolean; mono?: boolean; center?: boolean; small?: boolean;
}) {
  return (
    <td className="az-td" style={{
      fontWeight:  bold ? 700 : 400,
      color:       muted ? '#64748b' : '#0f172a',
      fontFamily:  mono ? 'monospace' : 'inherit',
      textAlign:   center ? 'center' : 'left',
      fontSize:    small ? 12 : 14,
    }}>
      {children}
    </td>
  );
}

function Check({ ok }: { ok: boolean }) {
  return ok
    ? <span className="az-check-yes">✓</span>
    : <span className="az-check-no">—</span>;
}

function EditField({ label, value, onChange, highlight, wide }: {
  label: string; value: string;
  onChange: (v: string) => void;
  highlight?: boolean; wide?: boolean;
}) {
  return (
    <div style={{ flex: wide ? '1 1 100%' : '1 1 140px', minWidth: 120 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px',
          background: highlight ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.07)',
          border: `1.5px solid ${highlight ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 9, fontSize: 14, color: '#fff', outline: 'none',
          fontFamily: 'monospace', boxSizing: 'border-box' as const,
        }}
      />
    </div>
  );
}

function LeyendaItem({ color, border, label }: { color: string; border: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
      <span style={{ width: 14, height: 14, borderRadius: 3, background: color, border: `1px solid ${border}`, display: 'inline-block' }} />
      {label}
    </div>
  );
}

/* ── CSS ── */
const CSS = `
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes progressAnim {
    from { width: 0; }
  }
  @keyframes orbFloat {
    0%, 100% { transform: translate(0,0); }
    50%       { transform: translate(30px,-20px); }
  }

  *, *::before, *::after { box-sizing: border-box; }

  .az-page {
    min-height: 100vh;
    background: linear-gradient(160deg, #0d0b1e 0%, #1a1040 40%, #0f1e3d 100%);
    background-size: 300% 300%; animation: gradientShift 18s ease infinite;
    padding: 24px 20px 40px;
    font-family: system-ui, -apple-system, sans-serif;
    position: relative; overflow-x: hidden;
  }

  .az-orb {
    position: fixed; border-radius: 50%;
    filter: blur(100px); pointer-events: none; z-index: 0;
  }
  .az-orb-1 {
    width: 600px; height: 600px; top: -200px; left: -200px;
    background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
    animation: orbFloat 20s ease-in-out infinite;
  }
  .az-orb-2 {
    width: 500px; height: 500px; bottom: -150px; right: -150px;
    background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%);
    animation: orbFloat 25s ease-in-out infinite reverse;
  }

  /* Header */
  .az-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    flex-wrap: wrap; gap: 14px; margin-bottom: 6px;
    position: relative; z-index: 1;
    animation: fadeUp 0.5s ease both;
  }
  .az-title {
    margin: 0 0 4px; font-size: 26px; font-weight: 900;
    background: linear-gradient(135deg, #fff, #c084fc, #f472b6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .az-sub { margin: 0; font-size: 13px; color: rgba(255,255,255,0.4); }
  .az-header-actions {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .az-last-update {
    font-size: 12px; color: rgba(255,255,255,0.25);
    margin: 0 0 18px; position: relative; z-index: 1;
  }

  /* Buttons */
  .az-btn {
    padding: 9px 16px; font-size: 13px; font-weight: 700;
    border-radius: 10px; cursor: pointer; border: 1.5px solid;
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
    white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;
  }
  .az-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .az-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .az-btn-primary {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
    color: #fff; border-color: #7c3aed;
    box-shadow: 0 2px 12px rgba(124,58,237,0.3);
  }
  .az-btn-primary:hover:not(:disabled) { box-shadow: 0 4px 20px rgba(124,58,237,0.5); }

  .az-btn-green {
    background: rgba(5,150,105,0.15); color: #34d399; border-color: rgba(52,211,153,0.3);
  }
  .az-btn-green:hover:not(:disabled) { background: rgba(5,150,105,0.25); }

  .az-btn-ghost {
    background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7);
    border-color: rgba(255,255,255,0.12);
  }
  .az-btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.12); }

  .az-btn-danger {
    background: rgba(220,38,38,0.12); color: #f87171; border-color: rgba(248,113,113,0.25);
  }
  .az-btn-danger:hover:not(:disabled) { background: rgba(220,38,38,0.2); }

  .az-refresh-badge {
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.4);
    background: rgba(255,255,255,0.06);
    padding: 6px 12px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
  }

  /* Stats */
  .az-stats {
    display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;
    position: relative; z-index: 1;
    animation: fadeUp 0.5s 0.1s ease both;
  }
  .az-stat-card {
    flex: 1; min-width: 100px;
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-radius: 14px; padding: 14px 16px;
    border: 1.5px solid rgba(255,255,255,0.08);
    display: flex; flex-direction: column; gap: 4px;
    transition: transform 0.2s ease;
  }
  .az-stat-card:hover { transform: translateY(-2px); }
  .az-stat-num   { font-size: 28px; font-weight: 900; line-height: 1; }
  .az-stat-label { font-size: 11px; color: rgba(255,255,255,0.45); font-weight: 600; }

  /* Progress */
  .az-progress-card {
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 16px 20px;
    margin-bottom: 16px; position: relative; z-index: 1;
    animation: fadeUp 0.5s 0.15s ease both;
  }
  .az-progress-header {
    display: flex; justify-content: space-between;
    font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 10px;
  }
  .az-progress-pct { color: #a78bfa; }
  .az-progress-bg {
    background: rgba(255,255,255,0.1); border-radius: 99px; height: 8px; overflow: hidden;
  }
  .az-progress-fill {
    background: linear-gradient(90deg, #7c3aed, #34d399);
    height: 100%; border-radius: 99px;
    transition: width 0.8s ease;
    animation: progressAnim 1s ease both;
  }

  /* Tabs */
  .az-tabs {
    display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;
    position: relative; z-index: 1;
    animation: fadeUp 0.5s 0.2s ease both;
  }
  .az-tab {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 14px; border-radius: 10px;
    border: 1.5px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.65); font-size: 13px; font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
  }
  .az-tab:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .az-tab.active { color: #fff; }
  .az-tab-count {
    display: inline-block; padding: 1px 7px;
    border-radius: 20px; font-size: 12px; font-weight: 700;
    background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.8);
  }
  .az-tab-count.active { background: rgba(255,255,255,0.25); color: #fff; }

  /* Search */
  .az-search-wrap {
    position: relative; margin-bottom: 10px;
    position: relative; z-index: 1;
    animation: fadeUp 0.5s 0.25s ease both;
  }
  .az-search-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    font-size: 14px; pointer-events: none;
  }
  .az-search {
    width: 100%; padding: 12px 16px 12px 40px;
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 12px; font-size: 14px; color: #fff; outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .az-search::placeholder { color: rgba(255,255,255,0.3); }
  .az-search:focus {
    border-color: rgba(167,139,250,0.5);
    box-shadow: 0 0 0 3px rgba(167,139,250,0.12);
  }

  /* Error */
  .az-error {
    background: rgba(220,38,38,0.12); border: 1.5px solid rgba(248,113,113,0.25);
    color: #f87171; border-radius: 10px; padding: 11px 16px;
    font-size: 14px; margin-bottom: 12px; position: relative; z-index: 1;
  }

  /* Leyenda */
  .az-leyenda {
    display: flex; gap: 16px; margin-bottom: 12px; flex-wrap: wrap;
    position: relative; z-index: 1;
  }

  /* Table */
  .az-table-wrap {
    overflow-x: auto; border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    border: 1.5px solid rgba(255,255,255,0.08);
    background: #fff;
    position: relative; z-index: 1;
    animation: fadeUp 0.5s 0.3s ease both;
  }
  .az-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .az-th {
    padding: 12px 14px; background: #f1f5f9; color: #475569;
    font-weight: 700; font-size: 11px; letter-spacing: 0.5px;
    text-transform: uppercase; border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
  }
  .az-td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
  .az-empty { padding: 48px; text-align: center; color: #94a3b8; font-size: 14px; }
  .az-check-yes {
    display: inline-flex; align-items: center; justify-content: center;
    background: #dcfce7; color: #16a34a;
    font-weight: 800; font-size: 13px;
    width: 26px; height: 26px; border-radius: 50%;
  }
  .az-check-no {
    display: inline-flex; align-items: center; justify-content: center;
    color: #cbd5e1; font-weight: 600; font-size: 18px;
    width: 26px; height: 26px;
  }

  .az-footer {
    text-align: right; font-size: 13px;
    color: rgba(255,255,255,0.3); margin-top: 12px;
    position: relative; z-index: 1;
  }

  /* Edit button */
  .az-edit-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: #94a3b8; border-radius: 7px;
    padding: 4px 10px; cursor: pointer; font-size: 14px;
    transition: background 0.15s, color 0.15s;
  }
  .az-edit-btn:hover { background: rgba(124,58,237,0.2); color: #a78bfa; border-color: rgba(124,58,237,0.4); }

  /* Modal */
  .az-modal-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeUp 0.2s ease both;
  }
  .az-modal {
    background: #1a1040; border: 1.5px solid rgba(255,255,255,0.12);
    border-radius: 20px; padding: 28px; width: 100%; max-width: 580px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  }
  .az-modal-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
  }
  .az-modal-title { margin: 0; font-size: 18px; font-weight: 800; color: #fff; }
  .az-modal-close {
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.5); border-radius: 8px;
    width: 32px; height: 32px; cursor: pointer; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
  }
  .az-modal-close:hover { background: rgba(220,38,38,0.2); color: #f87171; }
  .az-modal-section { margin-bottom: 20px; }
  .az-modal-section-label {
    font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35);
    text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px;
  }
  .az-modal-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .az-modal-error {
    background: rgba(220,38,38,0.12); border: 1.5px solid rgba(248,113,113,0.25);
    color: #f87171; border-radius: 10px; padding: 10px 14px;
    font-size: 13px; margin-bottom: 16px;
  }
  .az-modal-actions {
    display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;
  }

  @media print {
    .no-print { display: none !important; }
    .az-page { background: #fff !important; padding: 0 !important; }
    .az-table-wrap { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
  }

  /* ── Responsive mobile ── */
  @media (max-width: 700px) {
    .az-page { padding: 16px 12px 32px; }

    /* Header apilado */
    .az-header { flex-direction: column; gap: 10px; align-items: flex-start; }
    .az-title { font-size: 20px; }
    .az-header-actions {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }
    .az-btn { justify-content: center; font-size: 12px; padding: 8px 10px; }
    .az-refresh-badge { display: none; }

    /* Stats en 2 columnas */
    .az-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .az-stat-card { min-width: unset; padding: 12px 14px; }
    .az-stat-num { font-size: 24px; }

    /* Tabs con scroll horizontal */
    .az-tabs {
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding-bottom: 6px;
      gap: 6px;
    }
    .az-tabs::-webkit-scrollbar { display: none; }
    .az-tab { flex-shrink: 0; font-size: 12px; padding: 7px 11px; }

    /* Tabla con scroll horizontal suave */
    .az-table-wrap {
      border-radius: 12px;
      -webkit-overflow-scrolling: touch;
    }
    .az-th { font-size: 10px; padding: 10px 10px; }
    .az-td { font-size: 13px; padding: 9px 10px; }

    /* Leyenda */
    .az-leyenda { gap: 8px; }

    /* Buscador */
    .az-search { font-size: 13px; }
  }

  @media (max-width: 400px) {
    .az-header-actions { grid-template-columns: 1fr 1fr; }
    .az-stats { grid-template-columns: repeat(2, 1fr); }
    .az-stat-num { font-size: 22px; }
    .az-stat-label { font-size: 10px; }
  }
`;
