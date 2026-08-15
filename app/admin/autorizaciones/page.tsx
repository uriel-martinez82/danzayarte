'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Fila {
  alumno_nombre:   string;
  alumno_apellido: string;
  alumno_dni:      string;
  resp_nombre:     string;
  resp_apellido:   string;
  resp_dni:        string;
  email:           string;
  show1:           boolean;
  show2:           boolean;
}

type Filtro = 'todos' | 'completos' | 'incompletos' | 'ninguno' | 'show1' | 'show2';

const REFRESH_SEG = 30;

export default function AdminAutorizacionesPage() {
  const [filas,    setFilas]    = useState<Fila[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [buscar,   setBuscar]   = useState('');
  const [filtro,   setFiltro]   = useState<Filtro>('todos');
  const [countdown, setCountdown] = useState(REFRESH_SEG);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
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

  // Auto-refresh
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

  // Filtros
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

  // Imprimir
  function imprimir() { window.print(); }

  // Exportar CSV
  function exportarCSV() {
    const encabezado = ['Apellido alumna','Nombre alumna','DNI alumna','Apellido responsable','Nombre responsable','DNI responsable','Email','Show 28 Nov','Show 6 Dic'];
    const filas_csv = filtradas.map(f => [
      f.alumno_apellido, f.alumno_nombre, f.alumno_dni,
      f.resp_apellido, f.resp_nombre, f.resp_dni,
      f.email,
      f.show1 ? 'SÍ' : 'NO',
      f.show2 ? 'SÍ' : 'NO',
    ]);
    const contenido = [encabezado, ...filas_csv]
      .map(r => r.map(c => `"${c}"`).join(','))
      .join('\n');
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

  const TABS: { key: Filtro; label: string; count: number; color: string }[] = [
    { key: 'todos',       label: 'Todos',          count: filas.length,     color: '#3730a3' },
    { key: 'show1',       label: '📅 Show 28 Nov', count: totalShow1,       color: '#0891b2' },
    { key: 'show2',       label: '📅 Show 6 Dic',  count: totalShow2,       color: '#7c3aed' },
    { key: 'completos',   label: '✓ Ambos shows',  count: totalCompletos,   color: '#16a34a' },
    { key: 'incompletos', label: '⚠ Incompletos',  count: totalIncompletos, color: '#d97706' },
    { key: 'ninguno',     label: '✗ Sin firmar',   count: totalNinguno,     color: '#dc2626' },
  ];

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.title}>Autorizaciones</h1>
          <p style={s.sub}>Danza y Arte — Show de Fin de Año</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={s.refreshBadge}>
            {loading ? '↻ Actualizando…' : `↻ en ${countdown}s`}
          </span>
          <button onClick={() => cargar(false)} style={s.btnRefresh} disabled={loading}>
            Actualizar ahora
          </button>
          <button onClick={exportarCSV} style={s.btnExport} disabled={loading || filtradas.length === 0}>
            ↓ Exportar CSV
          </button>
          <button onClick={imprimir} style={s.btnPrint} disabled={loading || filtradas.length === 0} className="no-print">
            🖨 Imprimir
          </button>
        </div>
      </div>

      {lastUpdate && (
        <p style={s.lastUpdate}>
          Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
        </p>
      )}

      {/* ── Contadores ── */}
      <div style={s.counters}>
        <Counter label="Total alumnos"  value={filas.length}    color="#3730a3" />
        <Counter label="Show 28 Nov"    value={totalShow1}      color="#0891b2" />
        <Counter label="Show 6 Dic"     value={totalShow2}      color="#7c3aed" />
        <Counter label="Ambos shows ✓"  value={totalCompletos}  color="#16a34a" />
        <Counter label="Incompletos ⚠"  value={totalIncompletos} color="#d97706" />
        <Counter label="Sin firmar ✗"   value={totalNinguno}    color="#dc2626" />
      </div>

      {/* ── Barra de progreso ── */}
      {filas.length > 0 && (
        <div style={s.progressWrap}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#475569' }}>
            <span>Progreso de autorizaciones completas</span>
            <strong>{Math.round((totalCompletos / filas.length) * 100)}%</strong>
          </div>
          <div style={s.progressBg}>
            <div style={{ ...s.progressFill, width: `${(totalCompletos / filas.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* ── Filtros ── */}
      <div style={s.tabs} className="no-print">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setFiltro(t.key)}
            style={{
              ...s.tab,
              background:   filtro === t.key ? t.color : '#fff',
              color:        filtro === t.key ? '#fff'  : '#475569',
              borderColor:  filtro === t.key ? t.color : '#e2e8f0',
              fontWeight:   filtro === t.key ? 700     : 500,
            }}
          >
            {t.label}
            <span style={{
              ...s.tabCount,
              background: filtro === t.key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
              color:      filtro === t.key ? '#fff' : '#64748b',
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Buscador ── */}
      <input className="no-print"
        type="text"
        placeholder="Buscar por nombre, apellido, DNI o email…"
        value={buscar}
        onChange={e => setBuscar(e.target.value)}
        style={s.search}
      />

      {error && <div style={s.errorBox}>⚠ {error}</div>}

      {/* ── Referencias de color ── */}
      <div style={s.leyenda} className="no-print">
        <LeyendaItem color="#fff"    border="#e2e8f0" label="Ambos shows firmados" />
        <LeyendaItem color="#fffbeb" border="#fde68a" label="⚠ Falta un show" />
        <LeyendaItem color="#fef2f2" border="#fca5a5" label="✗ Sin ningún show" />
      </div>

      {/* ── Tabla ── */}
      <div style={s.tableWrap}>
        <table style={s.table}>
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
              <Th center>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} style={s.empty}>Cargando…</td></tr>
            )}
            {!loading && filtradas.length === 0 && (
              <tr><td colSpan={9} style={s.empty}>
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
                <Td center><EstadoBadge estado={estadoFila(f)} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && filtradas.length > 0 && (
        <p style={s.footer}>
          Mostrando {filtradas.length} de {filas.length} registros
          {buscar && ` · búsqueda: "${buscar}"`}
        </p>
      )}
    </div>
  );
}

/* ── Sub-componentes ──────────────────────────────────────────── */

function Counter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ ...s.counter, borderTop: `3px solid ${color}` }}>
      <span style={{ ...s.counterNum, color }}>{value}</span>
      <span style={s.counterLabel}>{label}</span>
    </div>
  );
}

function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return <th style={{ ...s.th, textAlign: center ? 'center' : 'left' }}>{children}</th>;
}

function Td({ children, bold, muted, mono, center, small }: {
  children: React.ReactNode;
  bold?: boolean; muted?: boolean; mono?: boolean; center?: boolean; small?: boolean;
}) {
  return (
    <td style={{
      ...s.td,
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
    ? <span style={s.checkYes}>✓</span>
    : <span style={s.checkNo}>—</span>;
}

function EstadoBadge({ estado }: { estado: 'completo' | 'incompleto' | 'ninguno' }) {
  const map = {
    completo:   { bg: '#dcfce7', color: '#16a34a', label: 'Completo' },
    incompleto: { bg: '#fef3c7', color: '#d97706', label: 'Incompleto' },
    ninguno:    { bg: '#fee2e2', color: '#dc2626', label: 'Sin firmar' },
  };
  const { bg, color, label } = map[estado];
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 700,
      padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {label}
    </span>
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

/* ── Estilos ──────────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '28px 24px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: '#0f172a' },
  sub:   { margin: 0, fontSize: 13, color: '#64748b' },
  lastUpdate: { margin: '0 0 20px', fontSize: 12, color: '#94a3b8' },
  refreshBadge: {
    fontSize: 12, color: '#64748b',
    background: '#f1f5f9', padding: '6px 12px',
    borderRadius: 8, fontWeight: 600,
  },
  btnRefresh: {
    padding: '9px 16px', background: '#3730a3', color: '#fff',
    border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  btnExport: {
    padding: '9px 16px', background: '#fff', color: '#16a34a',
    border: '1.5px solid #16a34a', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  btnPrint: {
    padding: '9px 16px', background: '#fff', color: '#475569',
    border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  counters: {
    display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap',
  },
  counter: {
    flex: 1, minWidth: 100, background: '#fff', borderRadius: 12,
    padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  counterNum:   { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  counterLabel: { fontSize: 11, color: '#64748b', fontWeight: 600 },
  progressWrap: {
    background: '#fff', borderRadius: 12, padding: '14px 18px',
    marginBottom: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
  progressBg: {
    background: '#e2e8f0', borderRadius: 99, height: 10, overflow: 'hidden',
  },
  progressFill: {
    background: 'linear-gradient(90deg, #3730a3, #16a34a)',
    height: '100%', borderRadius: 99,
    transition: 'width 0.6s ease',
  },
  tabs: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  tab: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 14px', borderRadius: 9, border: '1.5px solid',
    fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
  },
  tabCount: {
    display: 'inline-block', padding: '1px 7px',
    borderRadius: 20, fontSize: 12, fontWeight: 700,
  },
  search: {
    width: '100%', padding: '11px 16px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, outline: 'none',
    marginBottom: 10, boxSizing: 'border-box', background: '#fff',
  },
  leyenda: {
    display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap',
  },
  tableWrap: {
    overflowX: 'auto', borderRadius: 14,
    boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0', background: '#fff',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    padding: '11px 14px', background: '#f1f5f9', color: '#475569',
    fontWeight: 700, fontSize: 11, letterSpacing: 0.5,
    textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
  },
  td: { padding: '11px 14px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' },
  checkYes: {
    display: 'inline-block', background: '#dcfce7', color: '#16a34a',
    fontWeight: 800, fontSize: 14, width: 26, height: 26,
    lineHeight: '26px', borderRadius: '50%', textAlign: 'center',
  },
  checkNo: {
    display: 'inline-block', color: '#cbd5e1', fontWeight: 600,
    fontSize: 18, width: 26, height: 26, lineHeight: '26px', textAlign: 'center',
  },
  empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 },
  footer: { textAlign: 'right', fontSize: 13, color: '#94a3b8', marginTop: 10 },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fca5a5',
    color: '#b91c1c', borderRadius: 10, padding: '11px 16px',
    fontSize: 14, marginBottom: 12,
  },
};
