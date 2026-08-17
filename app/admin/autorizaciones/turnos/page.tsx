'use client';

import { useEffect, useState, useCallback } from 'react';

interface Reserva {
  id: string;
  show_numero: number;
  fecha: string;
  hora: number;
  created_at: string;
  alumnos: { nombre: string; apellido: string; dni: string };
}

function fmtFecha(fecha: string) {
  const [, m, d] = fecha.split('-').map(Number);
  const meses = ['','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d} ${meses[m]}`;
}

export default function AdminTurnosPage() {
  const [reservas,    setReservas]    = useState<Reserva[]>([]);
  const [showActivo,  setShowActivo]  = useState('0');
  const [loadingRes,  setLoadingRes]  = useState(true);
  const [loadingConf, setLoadingConf] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [filtroShow,  setFiltroShow]  = useState<number | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoadingRes(true);
    try {
      const [resRes, confRes] = await Promise.all([
        fetch('/api/admin/turnos'),
        fetch('/api/admin/turnos/config'),
      ]);
      const reservasData = await resRes.json();
      const confData = await confRes.json();
      setReservas(Array.isArray(reservasData) ? reservasData : []);
      setShowActivo(confData.showActivo ?? '0');
    } catch {
      setError('Error al cargar datos.');
    } finally {
      setLoadingRes(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  async function cambiarShow(valor: string) {
    setLoadingConf(true);
    setError(null);
    try {
      await fetch('/api/admin/turnos/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showActivo: valor }),
      });
      setShowActivo(valor);
    } catch {
      setError('Error al cambiar configuración.');
    } finally {
      setLoadingConf(false);
    }
  }

  const reservasFiltradas = filtroShow !== null
    ? reservas.filter(r => r.show_numero === filtroShow)
    : reservas;

  const show1Count = reservas.filter(r => r.show_numero === 1).length;
  const show2Count = reservas.filter(r => r.show_numero === 2).length;

  const OPCIONES_SHOW = [
    { val: '0', label: '⛔ Ninguno',               color: '#64748b' },
    { val: '1', label: '🎭 Show 1 — 28 Nov',        color: '#0891b2' },
    { val: '2', label: '🎭 Show 2 — 6 Dic',         color: '#7c3aed' },
  ];

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.title}>Turnos</h1>
          <p style={s.sub}>Danza y Arte — Show de Fin de Año</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/admin/autorizaciones" style={s.btnBack}>← Autorizaciones</a>
          <button onClick={cargarDatos} disabled={loadingRes} style={s.btnRefresh}>
            ↻ Actualizar
          </button>
          <button onClick={async () => { await fetch('/api/admin/login', { method: 'DELETE' }); window.location.href = '/admin/login'; }} style={s.btnSalir}>
            Salir
          </button>
        </div>
      </div>

      {/* Panel de configuración */}
      <div style={s.configPanel}>
        <p style={s.configLabel}>Turnos habilitados para:</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {OPCIONES_SHOW.map(opt => (
            <button
              key={opt.val}
              onClick={() => cambiarShow(opt.val)}
              disabled={loadingConf}
              style={{
                ...s.configBtn,
                background:  showActivo === opt.val ? opt.color : '#fff',
                color:       showActivo === opt.val ? '#fff'    : '#475569',
                borderColor: showActivo === opt.val ? opt.color : '#e2e8f0',
                fontWeight:  showActivo === opt.val ? 700       : 500,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {loadingConf && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#94a3b8' }}>Guardando…</p>}
      </div>

      {/* Contadores */}
      <div style={s.stats}>
        <div style={{ ...s.stat, borderTopColor: '#3730a3' }}>
          <span style={{ ...s.statNum, color: '#3730a3' }}>{reservas.length}</span>
          <span style={s.statLabel}>Total reservas</span>
        </div>
        <div style={{ ...s.stat, borderTopColor: '#0891b2' }}>
          <span style={{ ...s.statNum, color: '#0891b2' }}>{show1Count}</span>
          <span style={s.statLabel}>Show 1 (28 Nov)</span>
        </div>
        <div style={{ ...s.stat, borderTopColor: '#7c3aed' }}>
          <span style={{ ...s.statNum, color: '#7c3aed' }}>{show2Count}</span>
          <span style={s.statLabel}>Show 2 (6 Dic)</span>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { val: null, label: 'Todos', color: '#3730a3' },
          { val: 1,    label: 'Show 1 (12/13 sep)', color: '#0891b2' },
          { val: 2,    label: 'Show 2 (19/20 sep)', color: '#7c3aed' },
        ].map(f => (
          <button
            key={String(f.val)}
            onClick={() => setFiltroShow(f.val)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              border: '1.5px solid',
              background:  filtroShow === f.val ? f.color : '#fff',
              color:       filtroShow === f.val ? '#fff'  : '#475569',
              borderColor: filtroShow === f.val ? f.color : '#e2e8f0',
              fontWeight:  filtroShow === f.val ? 700     : 500,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div style={s.errorBox}>⚠ {error}</div>}

      {/* Tabla */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>#</th>
              <th style={s.th}>Alumno/a</th>
              <th style={s.th}>DNI</th>
              <th style={{ ...s.th, textAlign: 'center' }}>Show</th>
              <th style={{ ...s.th, textAlign: 'center' }}>Fecha</th>
              <th style={{ ...s.th, textAlign: 'center' }}>Horario</th>
            </tr>
          </thead>
          <tbody>
            {loadingRes && (
              <tr><td colSpan={6} style={s.empty}>Cargando…</td></tr>
            )}
            {!loadingRes && reservasFiltradas.length === 0 && (
              <tr><td colSpan={6} style={s.empty}>No hay reservas todavía.</td></tr>
            )}
            {reservasFiltradas.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ ...s.td, color: '#94a3b8' }}>{i + 1}</td>
                <td style={{ ...s.td, fontWeight: 700 }}>
                  {r.alumnos?.apellido}, {r.alumnos?.nombre}
                </td>
                <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 13 }}>
                  {r.alumnos?.dni}
                </td>
                <td style={{ ...s.td, textAlign: 'center' }}>
                  <span style={{
                    background: r.show_numero === 1 ? '#e0f2fe' : '#ede9fe',
                    color:      r.show_numero === 1 ? '#0369a1' : '#6d28d9',
                    padding: '2px 10px', borderRadius: 12,
                    fontSize: 12, fontWeight: 700,
                  }}>
                    Show {r.show_numero}
                  </span>
                </td>
                <td style={{ ...s.td, textAlign: 'center' }}>{fmtFecha(r.fecha)}</td>
                <td style={{ ...s.td, textAlign: 'center', fontWeight: 700 }}>
                  {r.hora}:00 hs
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loadingRes && reservasFiltradas.length > 0 && (
        <p style={{ textAlign: 'right', fontSize: 13, color: '#94a3b8', marginTop: 10 }}>
          {reservasFiltradas.length} reserva{reservasFiltradas.length !== 1 ? 's' : ''}
        </p>
      )}

    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: '#f8fafc',
    padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20, flexWrap: 'wrap', gap: 12,
  },
  title: { margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: '#0f172a' },
  sub:   { margin: 0, fontSize: 13, color: '#64748b' },
  btnBack: {
    padding: '9px 16px', background: '#fff', color: '#475569',
    border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 700,
    textDecoration: 'none', display: 'inline-block',
  },
  btnRefresh: {
    padding: '9px 16px', background: '#3730a3', color: '#fff',
    border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  btnSalir: {
    padding: '9px 16px', background: '#fef2f2', color: '#b91c1c',
    border: '1.5px solid #fca5a5', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  configPanel: {
    background: '#fff', borderRadius: 14, padding: '18px 20px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 20, border: '1px solid #e2e8f0',
  },
  configLabel: { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#475569' },
  configBtn: {
    padding: '9px 16px', borderRadius: 9, border: '1.5px solid',
    fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
  },
  stats: { display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' },
  stat: {
    flex: 1, minWidth: 120, background: '#fff', borderRadius: 12,
    padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    borderTop: '3px solid', display: 'flex', flexDirection: 'column', gap: 4,
  },
  statNum:   { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: 600 },
  tableWrap: {
    overflowX: 'auto', borderRadius: 14,
    boxShadow: '0 1px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', background: '#fff',
  },
  table:  { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    padding: '11px 14px', background: '#f1f5f9', color: '#475569',
    fontWeight: 700, fontSize: 11, letterSpacing: 0.5, textAlign: 'left',
    textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
  },
  td:    { padding: '11px 14px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' },
  empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
    borderRadius: 10, padding: '11px 16px', fontSize: 14, marginBottom: 12,
  },
};
