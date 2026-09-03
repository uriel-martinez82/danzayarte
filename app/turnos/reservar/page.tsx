'use client';

import { useState, useEffect } from 'react';
import { LOGO_BASE64 } from '@/lib/logo';
import { PUBLIC_CSS } from '@/lib/public-page-css';

interface SlotHora { hora: number; disponibles: number; }
interface SlotDia  { fecha: string; dia: string; capacidad: number; horas: SlotHora[]; }
interface DatosSlots {
  showNumero: number;
  alumno: { nombre: string; apellido: string };
  miReserva: { fecha: string; hora: number } | null;
  slots: SlotDia[];
}

function fmtFecha(fecha: string) {
  const [y, m, d] = fecha.split('-').map(Number);
  const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const date = new Date(y, m - 1, d);
  return `${dias[date.getDay()]} ${d} de ${meses[m]}`;
}

export default function TurnosReservarPage() {
  const [datos,    setDatos]    = useState<DatosSlots | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [selected, setSelected] = useState<{ fecha: string; hora: number } | null>(null);
  const [booking,  setBooking]  = useState(false);

  useEffect(() => {
    fetch('/api/turnos/slots')
      .then(async r => {
        if (r.status === 401) { window.location.href = '/turnos'; return null; }
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? `Error ${r.status}`);
        return data;
      })
      .then(data => { if (data) setDatos(data); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error al cargar.'))
      .finally(() => setLoading(false));
  }, []);

  async function refrescarSlots() {
    try {
      const r = await fetch('/api/turnos/slots');
      if (r.ok) {
        const data = await r.json();
        setDatos(data);
      }
    } catch { /* silencioso */ }
  }

  async function confirmarReserva() {
    if (!selected || booking) return;
    setBooking(true);
    setError(null);
    try {
      const res = await fetch('/api/turnos/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selected),
      });
      const data = await res.json();
      if (!res.ok) {
        // Si el slot se llenó justo ahora, refrescamos la lista y limpiamos la selección
        if (data.slotLleno) {
          setSelected(null);
          await refrescarSlots();
        }
        throw new Error(data.error ?? 'Error al reservar.');
      }
      if (datos) setDatos({ ...datos, miReserva: selected });
      // Liberar lugar en la cola para el siguiente
      fetch('/api/cola/salir', { method: 'POST' }).catch(() => {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al reservar.');
    } finally {
      setBooking(false);
    }
  }

  const SLOT_CSS = `
    ${PUBLIC_CSS}
    .slot-btn {
      display: flex; flex-direction: row; align-items: center;
      justify-content: space-between;
      padding: 15px 20px; border-radius: 14px;
      border: 1.5px solid #e2e8f0;
      background: #fff; cursor: pointer; width: 100%;
      transition: all 0.18s ease; text-align: left;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .slot-btn:hover:not(:disabled) {
      border-color: #a78bfa;
      box-shadow: 0 4px 16px rgba(124,58,237,0.12);
      transform: translateY(-1px);
    }
    .slot-btn.selected {
      background: linear-gradient(135deg, #6d28d9, #7c3aed);
      border-color: #7c3aed;
      box-shadow: 0 4px 20px rgba(124,58,237,0.35);
    }
    .slot-btn.full {
      background: #f8fafc; cursor: not-allowed; opacity: 0.5;
    }
    .slot-time { font-size: 16px; font-weight: 800; color: #0f172a; }
    .slot-btn.selected .slot-time { color: #fff; }
    .slot-btn.full .slot-time { color: #94a3b8; }
    .slot-label { font-size: 13px; font-weight: 500; color: #64748b; }
    .slot-btn.selected .slot-label { color: rgba(255,255,255,0.8); }
    .slot-btn.full .slot-label { color: #94a3b8; }

    .dia-section { margin-bottom: 24px; animation: fadeUp 0.4s ease both; }
    .dia-titulo {
      font-size: 11px; font-weight: 800; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 10px;
    }
    .slots-list { display: flex; flex-direction: column; gap: 8px; }

    .alumno-box {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 1.5px solid #86efac; border-radius: 12px;
      padding: 11px 16px; font-size: 14px; font-weight: 700;
      color: #15803d; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }

    .confirm-bar {
      position: sticky; bottom: 12px;
      background: rgba(255,255,255,0.97);
      backdrop-filter: blur(12px);
      border: 1.5px solid #e2e8f0;
      border-radius: 16px; padding: 14px 18px;
      display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15); margin-top: 10px;
    }
    .confirm-btn {
      background: linear-gradient(135deg, #059669, #10b981);
      color: #fff; border: none; border-radius: 12px;
      padding: 11px 24px; font-size: 14px; font-weight: 800;
      cursor: pointer; flex-shrink: 0;
      box-shadow: 0 4px 16px rgba(16,185,129,0.35);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .confirm-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(16,185,129,0.5);
    }
    .confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .confirm-text-main { font-weight: 700; font-size: 15px; color: #0f172a; }
    .confirm-text-sub  { font-size: 13px; color: #64748b; }

    .loading-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #4f1b8e 0%, #6d28d9 25%, #3730a3 55%, #be185d 100%);
      background-size: 300% 300%; animation: gradientShift 12s ease infinite;
      display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif;
    }
    .loading-card {
      background: rgba(255,255,255,0.97); border-radius: 24px;
      padding: 40px 36px; text-align: center;
      box-shadow: 0 24px 60px rgba(0,0,0,0.25);
      animation: fadeUp 0.5s ease both;
    }
    .loading-spinner-lg {
      width: 40px; height: 40px; margin: 0 auto 16px;
      border: 3px solid #e2e8f0; border-top-color: #7c3aed;
      border-radius: 50%; animation: spinnerAnim 0.8s linear infinite;
    }
    .loading-text { color: #475569; font-size: 15px; font-weight: 600; margin: 0; }

    .summary-box {
      background: #f8fafc; border: 1.5px solid #e2e8f0;
      border-radius: 14px; padding: 16px 20px; margin-top: 20px; text-align: left;
    }
    .summary-row { display: flex; gap: 10px; margin-bottom: 8px; font-size: 14px; }
    .summary-row:last-child { margin-bottom: 0; }
    .summary-label { font-weight: 700; color: #64748b; min-width: 80px; }
    .summary-value { color: #0f172a; }
  `;

  /* Loading */
  if (loading) return (
    <>
      <style>{SLOT_CSS}</style>
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner-lg" />
          <p className="loading-text">Cargando turnos…</p>
        </div>
      </div>
    </>
  );

  /* Turno ya reservado */
  if (datos?.miReserva) {
    const r = datos.miReserva;
    const showLabel = datos.showNumero === 1 ? '28 de noviembre' : '6 de diciembre';
    return (
      <>
        <style>{SLOT_CSS}</style>
        <div className="pub-page">
          <div className="pub-orb pub-orb-1" />
          <div className="pub-orb pub-orb-2" />
          <div className="pub-card">
            <div className="pub-header">
              <div className="pub-logo-ring">
                <div className="pub-logo-wrap">
                  <img src={LOGO_BASE64} alt="Danza y Arte" className="pub-logo" />
                </div>
              </div>
              <h1 className="pub-title">Danza y Arte</h1>
            </div>
            <div className="pub-success">
              <span className="pub-success-icon">🎟️</span>
              <h2 className="pub-success-title">¡Turno confirmado!</h2>
              <p className="pub-success-text">
                Tu turno para el Show del <strong>{showLabel}</strong> está reservado.
              </p>
              <div className="summary-box">
                <div className="summary-row">
                  <span className="summary-label">Alumno/a</span>
                  <span className="summary-value">{datos.alumno.nombre} {datos.alumno.apellido}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Fecha</span>
                  <span className="summary-value">{fmtFecha(r.fecha)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Horario</span>
                  <span className="summary-value">{r.hora}:00 hs</span>
                </div>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 20 }}>
                Danza y Arte — Agustina Spera
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const showLabel = datos?.showNumero === 1 ? 'Show 28 de noviembre' : 'Show 6 de diciembre';

  /* Selector de turno */
  return (
    <>
      <style>{SLOT_CSS}</style>
      <div className="pub-page" style={{ alignItems: 'flex-start' }}>
        <div className="pub-orb pub-orb-1" />
        <div className="pub-orb pub-orb-2" />
        <div className="pub-orb pub-orb-3" />

        <div className="pub-card pub-card-wide">
          <div className="pub-header">
            <div className="pub-logo-ring">
              <div className="pub-logo-wrap">
                <img src={LOGO_BASE64} alt="Danza y Arte" className="pub-logo" />
              </div>
            </div>
            <h1 className="pub-title">Reserva de turno</h1>
            <p className="pub-sub">Danza y Arte — {showLabel}</p>
          </div>

          {datos?.alumno && (
            <div className="alumno-box">
              👤 {datos.alumno.nombre} {datos.alumno.apellido}
            </div>
          )}

          <div className="pub-info">
            <p>Elegí un día y horario. Una vez confirmado, el turno <strong>no se puede modificar</strong>.</p>
          </div>

          {error && <div className="pub-error"><span>⚠</span> {error}</div>}

          {datos?.slots.map((dia, i) => (
            <div key={dia.fecha} className="dia-section" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="dia-titulo">📅 {dia.dia}</div>
              <div className="slots-list">
                {dia.horas.map(slot => {
                  const isSelected = selected?.fecha === dia.fecha && selected?.hora === slot.hora;
                  const isFull = slot.disponibles <= 0;
                  return (
                    <button
                      key={slot.hora}
                      onClick={() => { if (!isFull) setSelected({ fecha: dia.fecha, hora: slot.hora }); }}
                      disabled={isFull}
                      className={`slot-btn ${isSelected ? 'selected' : ''} ${isFull ? 'full' : ''}`}
                    >
                      <span className="slot-time">{slot.hora}:00 hs</span>
                      <span className="slot-label">
                        {isFull ? 'Horario completo' : isSelected ? '✓ Seleccionado' : 'Seleccionar →'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {selected && (
            <div className="confirm-bar">
              <div>
                <div className="confirm-text-main">{fmtFecha(selected.fecha)} — {selected.hora}:00 hs</div>
                <div className="confirm-text-sub">¿Confirmás este turno?</div>
              </div>
              <button onClick={confirmarReserva} disabled={booking} className="confirm-btn">
                {booking ? 'Reservando…' : '✓ Confirmar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
