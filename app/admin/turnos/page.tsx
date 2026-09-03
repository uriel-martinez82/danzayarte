'use client';

import { useEffect, useState, useCallback } from 'react';

/* ─── Types ─── */
interface Alumno {
  id: string; nombre: string; apellido: string; dni: string; turnoTomado?: boolean;
}
interface Reserva {
  id: string; show_numero: number; fecha: string; hora: number; created_at: string;
  alumnos: { nombre: string; apellido: string; dni: string };
}

/* ─── Constants ─── */
const HORAS_SABADO  = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 9:00 a 18:00 — 12 turnos/hora
const HORAS_DOMINGO = [9, 10, 11, 12, 13];                      // 9:00 a 13:00 — 20 turnos/hora

const SHOW_DATES: Record<string, { fecha: string; dia: string; capacidad: number; horas: number[] }[]> = {
  '1': [
    { fecha: '2026-09-12', dia: 'Sábado 12 de septiembre',  capacidad: 12, horas: HORAS_SABADO  },
    { fecha: '2026-09-13', dia: 'Domingo 13 de septiembre', capacidad: 20, horas: HORAS_DOMINGO },
  ],
  '2': [
    { fecha: '2026-09-19', dia: 'Sábado 19 de septiembre',  capacidad: 12, horas: HORAS_SABADO  },
    { fecha: '2026-09-20', dia: 'Domingo 20 de septiembre', capacidad: 20, horas: HORAS_DOMINGO },
  ],
};

/* ─── Icons ─── */
function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ─── Modal ─── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={ms.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={ms.modal}>
        <div style={ms.modalHead}>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{title}</span>
          <button onClick={onClose} style={ms.closeBtn}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Alumno Picker ─── */
function AlumnoPicker({ alumnos, onSelect, excludeId }: { alumnos: Alumno[]; onSelect: (a: Alumno) => void; excludeId?: string; }) {
  const [q, setQ] = useState('');
  const filtered = alumnos
    .filter(a => a.id !== excludeId)
    .filter(a => `${a.apellido} ${a.nombre} ${a.dni}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 150);

  return (
    <div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o DNI…" style={ms.searchInput} autoFocus autoComplete="off" />
      <div style={{ maxHeight: 260, overflowY: 'auto', marginTop: 6 }}>
        {filtered.length === 0 && <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Sin resultados</p>}
        {filtered.map(a => (
          <button key={a.id} onClick={() => onSelect(a)} style={ms.alumnoRow}>
            <span style={{ fontWeight: 700, color: '#0f172a', flex: 1, textAlign: 'left' }}>{a.apellido}, {a.nombre}</span>
            <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{a.dni}</span>
            {a.turnoTomado && (
              <span style={{ fontSize: 11, background: '#fef9c3', color: '#854d0e', padding: '2px 7px', borderRadius: 6, fontWeight: 600, flexShrink: 0 }}>ya tiene turno</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminTurnosPage() {
  const [reservas,    setReservas]    = useState<Reserva[]>([]);
  const [alumnos,     setAlumnos]     = useState<Alumno[]>([]);
  const [showActivo,  setShowActivo]  = useState('0');
  const [loadingRes,  setLoadingRes]  = useState(true);
  const [loadingConf, setLoadingConf] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [vistaShow,   setVistaShow]   = useState('1');
  const [busqueda,    setBusqueda]    = useState('');
  const [modalDelete,  setModalDelete]  = useState<Reserva | null>(null);
  const [modalEdit,    setModalEdit]    = useState<Reserva | null>(null);
  const [modalCreate,  setModalCreate]  = useState<{ fecha: string; hora: number; dia: string } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError,   setModalError]   = useState<string | null>(null);
  const [modoManual,   setModoManual]   = useState(false);
  const [manualNombre,   setManualNombre]   = useState('');
  const [manualApellido, setManualApellido] = useState('');
  const [manualDni,      setManualDni]      = useState('');

  const cargarDatos = useCallback(async () => {
    setLoadingRes(true); setError(null);
    try {
      const [resRes, confRes, alumnosRes] = await Promise.all([
        fetch('/api/admin/turnos'),
        fetch('/api/admin/turnos/config'),
        fetch('/api/admin/turnos/alumnos'),
      ]);
      const reservasData = await resRes.json();
      const confData     = await confRes.json();
      const alumnosData  = await alumnosRes.json();
      setReservas(Array.isArray(reservasData) ? reservasData : []);
      setShowActivo(confData.showActivo ?? '0');
      setAlumnos(alumnosData.alumnos ?? []);
    } catch { setError('Error al cargar datos.'); }
    finally   { setLoadingRes(false); }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  async function cambiarShow(valor: string) {
    setLoadingConf(true); setError(null);
    try {
      await fetch('/api/admin/turnos/config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showActivo: valor }),
      });
      setShowActivo(valor); await cargarDatos();
    } catch { setError('Error al cambiar configuración.'); }
    finally { setLoadingConf(false); }
  }

  async function confirmarDelete() {
    if (!modalDelete) return;
    setModalLoading(true); setModalError(null);
    try {
      const res = await fetch(`/api/admin/turnos/${modalDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalDelete(null); await cargarDatos();
    } catch (e: unknown) { setModalError(e instanceof Error ? e.message : 'Error al borrar.'); }
    finally { setModalLoading(false); }
  }

  async function confirmarEdit(alumno: Alumno) {
    if (!modalEdit) return;
    setModalLoading(true); setModalError(null);
    try {
      const res = await fetch(`/api/admin/turnos/${modalEdit.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumno_id: alumno.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalEdit(null); await cargarDatos();
    } catch (e: unknown) { setModalError(e instanceof Error ? e.message : 'Error al editar.'); }
    finally { setModalLoading(false); }
  }

  async function confirmarCreateAlumno(alumno: Alumno) {
    if (!modalCreate) return;
    setModalLoading(true); setModalError(null);
    try {
      const res = await fetch('/api/admin/turnos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumno_id: alumno.id, show_numero: parseInt(showActivo), fecha: modalCreate.fecha, hora: modalCreate.hora }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalCreate(null); await cargarDatos();
    } catch (e: unknown) { setModalError(e instanceof Error ? e.message : 'Error al crear turno.'); }
    finally { setModalLoading(false); }
  }

  async function confirmarCreateManual() {
    if (!modalCreate) return;
    if (!manualNombre.trim() || !manualApellido.trim() || !manualDni.trim()) { setModalError('Completá nombre, apellido y DNI.'); return; }
    setModalLoading(true); setModalError(null);
    try {
      const res = await fetch('/api/admin/turnos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: manualNombre.trim(), apellido: manualApellido.trim(), dni: manualDni.trim(), show_numero: parseInt(showActivo), fecha: modalCreate.fecha, hora: modalCreate.hora }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalCreate(null); await cargarDatos();
    } catch (e: unknown) { setModalError(e instanceof Error ? e.message : 'Error al crear turno.'); }
    finally { setModalLoading(false); }
  }

  function openCreate(slot: { fecha: string; hora: number; dia: string }) {
    setModalError(null); setModoManual(false);
    setManualNombre(''); setManualApellido(''); setManualDni('');
    setModalCreate(slot);
  }

  function closeModals() {
    setModalDelete(null); setModalEdit(null); setModalCreate(null);
    setModalError(null); setModalLoading(false); setModoManual(false);
  }

  const dias = SHOW_DATES[vistaShow] ?? [];
  const show1Count = reservas.filter(r => r.show_numero === 1).length;
  const show2Count = reservas.filter(r => r.show_numero === 2).length;

  const OPCIONES_SHOW = [
    { val: '0', label: '⛔ Ninguno',        activeColor: '#64748b', glow: 'rgba(100,116,139,0.3)' },
    { val: '1', label: '🎭 Show 1 — 28 Nov', activeColor: '#0891b2', glow: 'rgba(8,145,178,0.3)' },
    { val: '2', label: '🎭 Show 2 — 6 Dic',  activeColor: '#7c3aed', glow: 'rgba(124,58,237,0.3)' },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="tn-page">
        <div className="tn-orb tn-orb-1" />
        <div className="tn-orb tn-orb-2" />

        {/* Header */}
        <div className="tn-header">
          <div>
            <h1 className="tn-title">🎟️ Turnos</h1>
            <p className="tn-sub">Danza y Arte — Show de Fin de Año</p>
          </div>
          <div className="tn-header-actions">
            <a href="/admin" className="tn-btn tn-btn-ghost" style={{ textDecoration: 'none' }}>← Inicio</a>
            <button onClick={cargarDatos} disabled={loadingRes} className="tn-btn tn-btn-primary">↻ Actualizar</button>
            <button onClick={async () => { await fetch('/api/admin/login', { method: 'DELETE' }); window.location.href = '/admin/login'; }} className="tn-btn tn-btn-danger">Salir</button>
          </div>
        </div>

        {/* Config panel */}
        <div className="tn-config-panel">
          <p className="tn-config-label">Turnos habilitados para:</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {OPCIONES_SHOW.map(opt => (
              <button
                key={opt.val}
                onClick={() => cambiarShow(opt.val)}
                disabled={loadingConf}
                className={`tn-config-btn ${showActivo === opt.val ? 'active' : ''}`}
                style={showActivo === opt.val ? { background: opt.activeColor, borderColor: opt.activeColor, boxShadow: `0 4px 16px ${opt.glow}` } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {loadingConf && <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Guardando…</p>}
        </div>

        {/* Stats */}
        <div className="tn-stats">
          <div className="tn-stat-card" style={{ borderTopColor: '#a78bfa', boxShadow: '0 4px 20px rgba(167,139,250,0.15)' }}>
            <span className="tn-stat-num" style={{ color: '#a78bfa' }}>{reservas.length}</span>
            <span className="tn-stat-label">Total reservas</span>
          </div>
          <div className="tn-stat-card" style={{ borderTopColor: '#22d3ee', boxShadow: '0 4px 20px rgba(34,211,238,0.15)' }}>
            <span className="tn-stat-num" style={{ color: '#22d3ee' }}>{show1Count}</span>
            <span className="tn-stat-label">Show 1 (28 Nov)</span>
          </div>
          <div className="tn-stat-card" style={{ borderTopColor: '#c084fc', boxShadow: '0 4px 20px rgba(192,132,252,0.15)' }}>
            <span className="tn-stat-num" style={{ color: '#c084fc' }}>{show2Count}</span>
            <span className="tn-stat-label">Show 2 (6 Dic)</span>
          </div>
        </div>

        {error && <div className="tn-error">⚠ {error}</div>}

        {/* Vista + Búsqueda */}
        <div className="tn-filtros-bar">
          <div className="tn-vista-tabs">
            {[{ val: '1', label: '🎭 Show 1 — 28 Nov' }, { val: '2', label: '🎭 Show 2 — 6 Dic' }].map(opt => (
              <button key={opt.val}
                onClick={() => { setVistaShow(opt.val); setBusqueda(''); }}
                className={`tn-vista-tab ${vistaShow === opt.val ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="tn-search-wrap">
            <span className="tn-search-icon">🔍</span>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, apellido o DNI…"
              className="tn-search"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Slot list */}
        {showActivo === '0' && vistaShow === showActivo ? (
          <div className="tn-empty-state">
            <div style={{ fontSize: 40, marginBottom: 14 }}>⛔</div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
              No hay turnos habilitados. Seleccioná un show para ver los slots.
            </p>
          </div>
        ) : loadingRes ? (
          <div className="tn-loading">
            <div className="tn-spinner" />
            <p>Cargando slots…</p>
          </div>
        ) : (
          dias.map(diaInfo => {
            const reservasDia = reservas.filter(r => r.fecha === diaInfo.fecha && r.show_numero === parseInt(vistaShow));
            return (
              <div key={diaInfo.fecha} className="tn-dia-section">
                <h2 className="tn-dia-titulo">📅 {diaInfo.dia}</h2>
                <div className="tn-slots-list">
                  {diaInfo.horas.map(hora => {
                    const todasLasReservas = reservasDia.filter(r => r.hora === hora);
                    const slotReservas = todasLasReservas.filter(r => {
                      if (!busqueda.trim()) return true;
                      const q = busqueda.toLowerCase();
                      return `${r.alumnos?.apellido} ${r.alumnos?.nombre} ${r.alumnos?.dni}`.toLowerCase().includes(q);
                    });
                    const ocupados = todasLasReservas.length;
                    const cap      = diaInfo.capacidad;
                    const lleno    = ocupados >= cap;
                    if (busqueda.trim() && slotReservas.length === 0) return null;

                    const borderColor = lleno ? '#f87171' : ocupados > 0 ? '#fbbf24' : '#34d399';

                    return (
                      <div key={hora} className="tn-slot-card" style={{ borderLeftColor: borderColor }}>
                        <div className="tn-slot-head">
                          <span className="tn-slot-hora">{hora}:00 hs</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className={`tn-slot-badge ${lleno ? 'full' : ocupados > 0 ? 'partial' : 'empty'}`}>
                              {ocupados}/{cap}
                            </span>
                            <button className="tn-add-btn" onClick={() => openCreate({ fecha: diaInfo.fecha, hora, dia: diaInfo.dia })}>
                              <IconPlus /> Asignar
                            </button>
                          </div>
                        </div>
                        {slotReservas.length === 0 ? (
                          <p className="tn-slot-empty">— sin reservas —</p>
                        ) : (
                          <div className="tn-reservas-list">
                            {slotReservas.map(r => (
                              <div key={r.id} className="tn-reserva-row">
                                <span className="tn-reserva-nombre">
                                  {r.alumnos?.apellido}, {r.alumnos?.nombre}
                                </span>
                                <span className="tn-reserva-dni" style={{ marginRight: 8 }}>
                                  {r.alumnos?.dni}
                                </span>
                                <button title="Editar titular" onClick={() => { setModalError(null); setModalEdit(r); }} className="tn-icon-btn">
                                  <IconEdit />
                                </button>
                                <button title="Liberar turno" onClick={() => { setModalError(null); setModalDelete(r); }} className="tn-icon-btn danger">
                                  <IconTrash />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Modal: Delete */}
        {modalDelete && (
          <Modal title="Liberar turno" onClose={closeModals}>
            <div style={{ padding: '16px 20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: '#475569' }}>
                ¿Confirmar liberación del turno de{' '}
                <strong>{modalDelete.alumnos?.apellido}, {modalDelete.alumnos?.nombre}</strong>
                {' '}— {modalDelete.hora}:00 hs?
              </p>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#94a3b8' }}>El alumno podrá volver a reservar otro horario.</p>
              {modalError && <div style={ms.error}>{modalError}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={closeModals} style={ms.btnCancel} disabled={modalLoading}>Cancelar</button>
                <button onClick={confirmarDelete} style={ms.btnDanger} disabled={modalLoading}>
                  {modalLoading ? 'Liberando…' : '🗑 Liberar turno'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal: Edit */}
        {modalEdit && (
          <Modal title="Cambiar titular del turno" onClose={closeModals}>
            <div style={{ padding: '16px 20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
                Turno actual: <strong>{modalEdit.alumnos?.apellido}, {modalEdit.alumnos?.nombre}</strong> — {modalEdit.hora}:00 hs
              </p>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Seleccioná el nuevo titular:</p>
              {modalError && <div style={ms.error}>{modalError}</div>}
              {modalLoading
                ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Guardando…</p>
                : <AlumnoPicker alumnos={alumnos} excludeId={undefined} onSelect={confirmarEdit} />
              }
            </div>
          </Modal>
        )}

        {/* Modal: Create */}
        {modalCreate && (
          <Modal title="Asignar turno" onClose={closeModals}>
            <div style={{ padding: '16px 20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>
                {modalCreate.dia} — <strong>{modalCreate.hora}:00 hs</strong>
              </p>
              <div style={ms.tabs}>
                <button style={{ ...ms.tab, ...(modoManual ? {} : ms.tabActive) }} onClick={() => { setModoManual(false); setModalError(null); }}>
                  🔍 Buscar alumno
                </button>
                <button style={{ ...ms.tab, ...(modoManual ? ms.tabActive : {}) }} onClick={() => { setModoManual(true); setModalError(null); }}>
                  ✏️ Ingresar a mano
                </button>
              </div>
              {modalError && <div style={{ ...ms.error, marginTop: 10 }}>{modalError}</div>}
              {modalLoading ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Guardando…</p>
              ) : modoManual ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={ms.label}>Nombre</label>
                      <input value={manualNombre} onChange={e => setManualNombre(e.target.value)} placeholder="Ej: María" style={ms.input} autoComplete="off" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={ms.label}>Apellido</label>
                      <input value={manualApellido} onChange={e => setManualApellido(e.target.value)} placeholder="Ej: García" style={ms.input} autoComplete="off" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={ms.label}>DNI</label>
                    <input value={manualDni} onChange={e => setManualDni(e.target.value)} placeholder="Ej: 11222333" style={ms.input} autoComplete="off" />
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px' }}>
                    Si el DNI ya existe en el sistema, se usará ese alumno. Si no, se creará uno nuevo.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={closeModals} style={ms.btnCancel}>Cancelar</button>
                    <button onClick={confirmarCreateManual} style={ms.btnPrimary}>✓ Asignar turno</button>
                  </div>
                </div>
              ) : (
                alumnos.length === 0
                  ? <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>No hay alumnos confirmados en el sistema.</p>
                  : <AlumnoPicker alumnos={alumnos} onSelect={confirmarCreateAlumno} />
              )}
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}

/* ─── CSS ─── */
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
  @keyframes orbFloat {
    0%, 100% { transform: translate(0,0); }
    50%       { transform: translate(30px,-20px); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  *, *::before, *::after { box-sizing: border-box; }

  .tn-page {
    min-height: 100vh;
    background: linear-gradient(160deg, #0d0b1e 0%, #1a1040 40%, #0f1e3d 100%);
    background-size: 300% 300%; animation: gradientShift 18s ease infinite;
    padding: 24px 20px 48px;
    font-family: system-ui, -apple-system, sans-serif;
    position: relative; overflow-x: hidden;
  }

  .tn-orb { position: fixed; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; }
  .tn-orb-1 { width: 600px; height: 600px; top: -200px; left: -200px; background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%); animation: orbFloat 20s ease-in-out infinite; }
  .tn-orb-2 { width: 500px; height: 500px; bottom: -150px; right: -150px; background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%); animation: orbFloat 25s ease-in-out infinite reverse; }

  /* Header */
  .tn-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    flex-wrap: wrap; gap: 14px; margin-bottom: 20px;
    position: relative; z-index: 1;
    animation: fadeUp 0.5s ease both;
  }
  .tn-title {
    margin: 0 0 4px; font-size: 26px; font-weight: 900;
    background: linear-gradient(135deg, #fff, #c084fc, #f472b6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .tn-sub { margin: 0; font-size: 13px; color: rgba(255,255,255,0.4); }
  .tn-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  /* Buttons */
  .tn-btn {
    padding: 9px 16px; font-size: 13px; font-weight: 700;
    border-radius: 10px; cursor: pointer; border: 1.5px solid;
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
    white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;
  }
  .tn-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .tn-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .tn-btn-primary { background: linear-gradient(135deg, #6d28d9, #7c3aed); color: #fff; border-color: #7c3aed; box-shadow: 0 2px 12px rgba(124,58,237,0.3); }
  .tn-btn-primary:hover:not(:disabled) { box-shadow: 0 4px 20px rgba(124,58,237,0.5); }
  .tn-btn-ghost   { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.12); }
  .tn-btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
  .tn-btn-danger  { background: rgba(220,38,38,0.12); color: #f87171; border-color: rgba(248,113,113,0.25); }
  .tn-btn-danger:hover:not(:disabled) { background: rgba(220,38,38,0.2); }

  /* Config panel */
  .tn-config-panel {
    background: rgba(255,255,255,0.05); backdrop-filter: blur(16px);
    border: 1.5px solid rgba(255,255,255,0.08); border-radius: 16px;
    padding: 18px 20px; margin-bottom: 20px;
    position: relative; z-index: 1;
    animation: fadeUp 0.5s 0.1s ease both;
  }
  .tn-config-label { margin: 0 0 12px; font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.07em; }
  .tn-config-btn {
    padding: 9px 16px; border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.65);
    font-size: 13px; cursor: pointer; transition: all 0.2s ease;
  }
  .tn-config-btn:hover { background: rgba(255,255,255,0.12); }
  .tn-config-btn.active { color: #fff; }
  .tn-config-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Stats */
  .tn-stats {
    display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;
    position: relative; z-index: 1;
    animation: fadeUp 0.5s 0.15s ease both;
  }
  .tn-stat-card {
    flex: 1; min-width: 120px; background: rgba(255,255,255,0.06);
    backdrop-filter: blur(16px); border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 14px 16px;
    border-top: 3px solid; display: flex; flex-direction: column; gap: 4px;
    transition: transform 0.2s ease;
  }
  .tn-stat-card:hover { transform: translateY(-2px); }
  .tn-stat-num   { font-size: 28px; font-weight: 900; line-height: 1; }
  .tn-stat-label { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 600; }

  /* Error */
  .tn-error {
    background: rgba(220,38,38,0.12); border: 1.5px solid rgba(248,113,113,0.25);
    color: #f87171; border-radius: 10px; padding: 11px 16px;
    font-size: 14px; margin-bottom: 16px; position: relative; z-index: 1;
  }

  /* Filtros bar */
  .tn-filtros-bar {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 24px; flex-wrap: wrap;
    position: relative; z-index: 1;
    animation: fadeUp 0.5s 0.2s ease both;
  }
  .tn-vista-tabs {
    display: flex; border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 10px; overflow: hidden; flex-shrink: 0;
  }
  .tn-vista-tab {
    padding: 9px 18px; border: none;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.55);
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.18s ease;
  }
  .tn-vista-tab:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.85); }
  .tn-vista-tab.active {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
    color: #fff; box-shadow: 0 2px 12px rgba(124,58,237,0.3);
  }
  .tn-search-wrap { flex: 1; min-width: 200px; position: relative; }
  .tn-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; pointer-events: none; }
  .tn-search {
    width: 100%; padding: 10px 14px 10px 36px;
    background: rgba(255,255,255,0.07); backdrop-filter: blur(12px);
    border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px;
    font-size: 14px; color: #fff; outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .tn-search::placeholder { color: rgba(255,255,255,0.25); }
  .tn-search:focus { border-color: rgba(167,139,250,0.5); box-shadow: 0 0 0 3px rgba(167,139,250,0.1); }

  /* Empty / Loading */
  .tn-empty-state {
    text-align: center; padding: 60px 20px;
    background: rgba(255,255,255,0.04); backdrop-filter: blur(12px);
    border-radius: 18px; border: 1.5px dashed rgba(255,255,255,0.1);
    position: relative; z-index: 1;
  }
  .tn-loading {
    text-align: center; padding: 48px; color: rgba(255,255,255,0.4);
    font-size: 14px; position: relative; z-index: 1;
  }
  .tn-spinner {
    width: 32px; height: 32px; margin: 0 auto 14px;
    border: 3px solid rgba(255,255,255,0.1); border-top-color: #a78bfa;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }

  /* Dia section */
  .tn-dia-section { margin-bottom: 32px; position: relative; z-index: 1; animation: fadeUp 0.4s ease both; }
  .tn-dia-titulo {
    font-size: 13px; font-weight: 800; letter-spacing: 0.08em;
    text-transform: uppercase; margin: 0 0 12px;
    background: linear-gradient(135deg, #c084fc, #f472b6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .tn-slots-list { display: flex; flex-direction: column; gap: 8px; }

  /* Slot card — dark glass */
  .tn-slot-card {
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-radius: 12px; padding: 13px 16px;
    border: 1.5px solid rgba(255,255,255,0.1); border-left: 4px solid;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }
  .tn-slot-card:hover {
    transform: translateX(2px);
    background: rgba(255,255,255,0.09);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .tn-slot-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .tn-slot-hora { font-size: 15px; font-weight: 800; color: rgba(255,255,255,0.9); }
  .tn-slot-badge {
    font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 8px;
  }
  .tn-slot-badge.full    { background: rgba(220,38,38,0.2);  color: #fca5a5; border: 1px solid rgba(248,113,113,0.3); }
  .tn-slot-badge.partial { background: rgba(217,119,6,0.2);  color: #fcd34d; border: 1px solid rgba(251,191,36,0.3); }
  .tn-slot-badge.empty   { background: rgba(5,150,105,0.2);  color: #6ee7b7; border: 1px solid rgba(52,211,153,0.3); }
  .tn-add-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px; border: 1.5px dashed rgba(255,255,255,0.2);
    border-radius: 7px; background: transparent; color: rgba(255,255,255,0.4);
    font-size: 12px; font-weight: 600; cursor: pointer;
    transition: all 0.15s ease;
  }
  .tn-add-btn:hover {
    border-color: #a78bfa; color: #a78bfa;
    background: rgba(167,139,250,0.1);
  }
  .tn-slot-empty { margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,0.25); }
  .tn-reservas-list { display: flex; flex-direction: column; gap: 6px; }
  .tn-reserva-row {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.05); border-radius: 8px; padding: 7px 10px;
    border: 1px solid rgba(255,255,255,0.07);
    transition: background 0.1s ease;
  }
  .tn-reserva-row:hover { background: rgba(255,255,255,0.09); }
  .tn-reserva-nombre { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 600; flex: 1; }
  .tn-reserva-dni    { font-size: 12px; color: rgba(255,255,255,0.35); font-family: monospace; }
  .tn-icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06); cursor: pointer;
    color: rgba(255,255,255,0.5); flex-shrink: 0; transition: all 0.15s ease;
  }
  .tn-icon-btn:hover { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.9); }
  .tn-icon-btn.danger { color: #f87171; }
  .tn-icon-btn.danger:hover { background: rgba(220,38,38,0.15); border-color: rgba(248,113,113,0.3); }

  /* ── Responsive mobile ── */
  @media (max-width: 700px) {
    .tn-page { padding: 16px 12px 40px; }

    /* Header apilado */
    .tn-header { flex-direction: column; gap: 10px; align-items: flex-start; }
    .tn-title { font-size: 20px; }
    .tn-header-actions {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }
    .tn-btn { justify-content: center; font-size: 12px; padding: 8px 10px; }

    /* Stats en 2 columnas */
    .tn-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .tn-stat-card { min-width: unset; padding: 12px 14px; }
    .tn-stat-num { font-size: 24px; }

    /* Config panel */
    .tn-config-panel > div { display: flex; flex-wrap: wrap; gap: 8px; }
    .tn-config-btn { flex: 1; min-width: 0; text-align: center; font-size: 12px; }

    /* Filtros apilados */
    .tn-filtros-bar { flex-direction: column; gap: 10px; }
    .tn-vista-tabs { width: 100%; }
    .tn-vista-tab { flex: 1; padding: 9px 10px; font-size: 12px; }
    .tn-search-wrap { min-width: unset; width: 100%; }

    /* Slot cards */
    .tn-slot-card { padding: 12px 13px; }
    .tn-slot-hora { font-size: 14px; }

    /* Reserva rows */
    .tn-reserva-row { flex-wrap: wrap; gap: 4px; }
  }

  @media (max-width: 400px) {
    .tn-header-actions { grid-template-columns: 1fr 1fr; }
    .tn-stats { grid-template-columns: repeat(2, 1fr); }
    .tn-stat-num { font-size: 22px; }
    .tn-stat-label { font-size: 10px; }
  }
`;

/* ─── Modal styles ─── */
const ms: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
    boxShadow: '0 32px 80px rgba(0,0,0,0.4)', overflow: 'hidden',
    animation: 'fadeUp 0.25s ease both',
    maxHeight: '92vh', overflowY: 'auto' as const,
  },
  modalHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
  },
  closeBtn: {
    background: '#f1f5f9', border: 'none', fontSize: 14, color: '#64748b',
    cursor: 'pointer', padding: '4px 8px', borderRadius: 8, fontWeight: 700,
  },
  tabs: {
    display: 'flex', border: '1.5px solid #e2e8f0',
    borderRadius: 9, overflow: 'hidden', marginBottom: 4,
  },
  tab: {
    flex: 1, padding: '9px 0', border: 'none', background: '#fff',
    fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer',
  },
  tabActive: { background: '#3730a3', color: '#fff' },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 5 },
  input: {
    width: '100%', padding: '9px 11px', fontSize: 14,
    border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box',
  },
  searchInput: {
    width: '100%', padding: '10px 12px', fontSize: 14,
    border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none', boxSizing: 'border-box',
  },
  alumnoRow: {
    width: '100%', textAlign: 'left', padding: '10px 12px',
    border: 'none', borderBottom: '1px solid #f1f5f9',
    background: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
    transition: 'background 0.1s',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
    borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12,
  },
  btnCancel: {
    padding: '9px 18px', borderRadius: 9, border: '1.5px solid #e2e8f0',
    background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnDanger: {
    padding: '9px 18px', borderRadius: 9, border: 'none',
    background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  btnPrimary: {
    padding: '9px 18px', borderRadius: 9, border: 'none',
    background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
};
