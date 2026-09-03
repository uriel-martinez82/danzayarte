'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LOGO_BASE64 } from '@/lib/logo';
import { PUBLIC_CSS } from '@/lib/public-page-css';

const COLA_CSS = `
  ${PUBLIC_CSS}

  /* ── Sala de espera ── */
  .cola-wrap {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; gap: 0; width: 100%;
  }

  /* Anillo animado */
  .cola-ring {
    width: 88px; height: 88px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #be185d);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    box-shadow: 0 0 0 0 rgba(124,58,237,0.4);
    animation: colaRing 2.2s ease-in-out infinite;
    flex-shrink: 0;
  }
  .cola-ring.pasando {
    background: linear-gradient(135deg, #059669, #10b981);
    animation: colaRingGreen 1s ease-in-out infinite;
  }
  @keyframes colaRing {
    0%   { box-shadow: 0 0 0 0   rgba(124,58,237,0.45); }
    60%  { box-shadow: 0 0 0 22px rgba(124,58,237,0); }
    100% { box-shadow: 0 0 0 0   rgba(124,58,237,0); }
  }
  @keyframes colaRingGreen {
    0%   { box-shadow: 0 0 0 0   rgba(5,150,105,0.5); }
    60%  { box-shadow: 0 0 0 22px rgba(5,150,105,0); }
    100% { box-shadow: 0 0 0 0   rgba(5,150,105,0); }
  }
  .cola-emoji { font-size: 38px; line-height: 1; }

  /* Nombre */
  .cola-nombre {
    font-size: 13px; font-weight: 600; color: #7c3aed;
    text-transform: uppercase; letter-spacing: 0.08em;
    margin-bottom: 6px;
  }

  /* Títulos */
  .cola-title {
    font-size: 22px; font-weight: 800; color: #0f172a;
    margin: 0 0 8px; line-height: 1.25;
  }
  .cola-sub {
    font-size: 14px; color: #64748b; margin: 0 0 24px;
    line-height: 1.6;
  }

  /* Caja de posición */
  .cola-pos-box {
    background: linear-gradient(135deg, #f5f3ff, #fdf2f8);
    border: 2px solid #ddd6fe;
    border-radius: 18px; padding: 20px 28px;
    margin-bottom: 20px; width: 100%; box-sizing: border-box;
    animation: fadeUp 0.4s ease both;
  }
  .cola-pos-label {
    font-size: 12px; font-weight: 700; color: #7c3aed;
    text-transform: uppercase; letter-spacing: 0.1em;
    margin-bottom: 4px;
  }
  .cola-pos-num {
    font-size: 52px; font-weight: 900; color: #6d28d9;
    line-height: 1; margin-bottom: 4px;
  }
  .cola-pos-desc {
    font-size: 13px; color: #8b5cf6; font-weight: 500;
  }

  /* Estimación de tiempo */
  .cola-eta {
    background: #f8fafc; border: 1.5px solid #e2e8f0;
    border-radius: 12px; padding: 12px 18px;
    font-size: 13px; color: #64748b; font-weight: 500;
    width: 100%; box-sizing: border-box;
    margin-bottom: 16px; text-align: center;
  }
  .cola-eta strong { color: #0f172a; }

  /* Dot pulsante */
  .cola-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #f59e0b; flex-shrink: 0; display: inline-block;
    animation: colaDot 1.5s ease-in-out infinite;
    margin-right: 6px; vertical-align: middle;
  }
  @keyframes colaDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.8); }
  }

  /* Refresh hint */
  .cola-hint {
    font-size: 11px; color: #cbd5e1; margin-top: 8px;
  }

  /* Mensaje de ¡Es tu turno! */
  .cola-go-banner {
    background: linear-gradient(135deg, #059669, #10b981);
    border-radius: 16px; padding: 20px 24px; width: 100%;
    box-sizing: border-box; text-align: center;
    animation: fadeUp 0.4s ease both;
  }
  .cola-go-title {
    color: #fff; font-size: 18px; font-weight: 800; margin: 0 0 4px;
  }
  .cola-go-sub {
    color: rgba(255,255,255,0.85); font-size: 13px; margin: 0;
  }

  /* Estado de carga */
  .cola-spinner {
    width: 36px; height: 36px; border-radius: 50%;
    border: 3px solid #e2e8f0; border-top-color: #7c3aed;
    animation: spin 0.8s linear infinite; margin: 16px auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

type Estado = 'cargando' | 'esperando' | 'pasando' | 'error';

interface DatosCola {
  posicion: number;
  puedeEntrar: boolean;
  alumno: { nombre: string; apellido: string };
}

const ACTIVE_LIMIT   = 50;
const POLL_SEGUNDOS  = 20;
const MIN_POR_PUESTO = 1.5; // minutos promedio por familia en el turnero

function estimarMinutos(posicion: number): number {
  const detras = Math.max(0, posicion - ACTIVE_LIMIT);
  return Math.ceil(detras * (MIN_POR_PUESTO / ACTIVE_LIMIT));
}

export default function ColaPage() {
  const [estado,   setEstado]   = useState<Estado>('cargando');
  const [datos,    setDatos]    = useState<DatosCola | null>(null);
  const [errMsg,   setErrMsg]   = useState<string | null>(null);
  const [segundos, setSegundos] = useState(POLL_SEGUNDOS);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const limpiarIntervals = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countRef.current)    clearInterval(countRef.current);
  };

  const irAlTurnero = useCallback(async () => {
    // Salir de la cola libera el lugar para el siguiente
    try { await fetch('/api/cola/salir', { method: 'POST' }); } catch { /* silencioso */ }
    window.location.href = '/turnos/reservar';
  }, []);

  const procesarRespuesta = useCallback((data: DatosCola & { redirect?: string }) => {
    if (data.redirect) { window.location.href = data.redirect; return; }
    setDatos(data);
    setSegundos(POLL_SEGUNDOS);
    if (data.puedeEntrar) {
      setEstado('pasando');
      limpiarIntervals();
      setTimeout(irAlTurnero, 2500);
    } else {
      setEstado('esperando');
    }
  }, [irAlTurnero]);

  // Entrada inicial a la cola
  const entrar = useCallback(async () => {
    try {
      const res = await fetch('/api/cola/entrar', { method: 'POST' });
      if (res.status === 401) { window.location.href = '/turnos'; return; }
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? 'Error al unirse a la cola.'); setEstado('error'); return; }
      procesarRespuesta(data);
    } catch {
      setErrMsg('Error de conexión. Intentá de nuevo.');
      setEstado('error');
    }
  }, [procesarRespuesta]);

  // Poll periódico
  const actualizarPosicion = useCallback(async () => {
    try {
      const res = await fetch('/api/cola/posicion');
      if (res.status === 401) { window.location.href = '/turnos'; return; }
      const data = await res.json();
      if (res.status === 404) {
        // Entrada vencida: volver a entrar
        entrar();
        return;
      }
      if (!res.ok) return; // silencioso, reintenta en el próximo ciclo
      procesarRespuesta(data);
    } catch { /* silencioso */ }
  }, [entrar, procesarRespuesta]);

  // Montar: entrar a la cola
  useEffect(() => {
    entrar();
    return limpiarIntervals;
  }, [entrar]);

  // Arrancar polling cuando está esperando
  useEffect(() => {
    if (estado !== 'esperando') { limpiarIntervals(); return; }
    intervalRef.current = setInterval(actualizarPosicion, POLL_SEGUNDOS * 1000);
    countRef.current    = setInterval(() => {
      setSegundos(s => (s <= 1 ? POLL_SEGUNDOS : s - 1));
    }, 1000);
    return limpiarIntervals;
  }, [estado, actualizarPosicion]);

  /* ── Render ── */
  return (
    <>
      <style>{COLA_CSS}</style>
      <div className="pub-page">
        <div className="pub-orb pub-orb-1" />
        <div className="pub-orb pub-orb-2" />
        <div className="pub-orb pub-orb-3" />

        <div className="pub-card">
          {/* Header */}
          <div className="pub-header">
            <div className="pub-logo-ring">
              <div className="pub-logo-wrap">
                <img src={LOGO_BASE64} alt="Danza y Arte" className="pub-logo" />
              </div>
            </div>
            <h1 className="pub-title">Danza y Arte</h1>
            <p className="pub-sub">Agustina Spera — Turnos Show de Fin de Año</p>
          </div>

          <div className="cola-wrap">

            {/* ── Cargando ── */}
            {estado === 'cargando' && (
              <>
                <div className="cola-ring">
                  <span className="cola-emoji">🎟️</span>
                </div>
                <h2 className="cola-title">Reservando tu lugar…</h2>
                <p className="cola-sub">Estamos preparando todo para vos.</p>
                <div className="cola-spinner" />
              </>
            )}

            {/* ── Esperando ── */}
            {estado === 'esperando' && datos && (
              <>
                <div className="cola-ring">
                  <span className="cola-emoji">🎟️</span>
                </div>

                <p className="cola-nombre">
                  {datos.alumno.apellido}, {datos.alumno.nombre}
                </p>

                <h2 className="cola-title">
                  {datos.posicion <= 10
                    ? '¡Ya casi es tu turno!'
                    : 'Estás en la fila 🎭'}
                </h2>
                <p className="cola-sub">
                  Tu lugar está guardado. Esta pantalla se actualiza sola,<br />
                  <strong>no hace falta recargar ni tocar nada.</strong>
                </p>

                {/* Número de posición */}
                <div className="cola-pos-box">
                  <p className="cola-pos-label">Tu posición en la fila</p>
                  <p className="cola-pos-num">#{datos.posicion}</p>
                  <p className="cola-pos-desc">
                    {datos.posicion === 1
                      ? 'Próximo a ingresar'
                      : `${datos.posicion - 1} ${datos.posicion === 2 ? 'persona' : 'personas'} adelante tuyo`}
                  </p>
                </div>

                {/* Estimación */}
                {datos.posicion > ACTIVE_LIMIT && (
                  <div className="cola-eta">
                    ⏱ Tiempo estimado de espera:{' '}
                    <strong>~{estimarMinutos(datos.posicion)} min</strong>
                  </div>
                )}
                {datos.posicion <= ACTIVE_LIMIT && (
                  <div className="cola-eta" style={{ borderColor: '#bbf7d0', background: '#f0fdf4', color: '#166534' }}>
                    ✅ Estás entre los primeros — entrás en instantes
                  </div>
                )}

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  <span className="cola-dot" />
                  Actualizando posición…
                </div>
                <p className="cola-hint">Próxima actualización en {segundos}s</p>
              </>
            )}

            {/* ── ¡Es tu turno! ── */}
            {estado === 'pasando' && (
              <>
                <div className="cola-ring pasando">
                  <span className="cola-emoji">🎉</span>
                </div>
                <h2 className="cola-title">¡Es tu turno!</h2>
                <p className="cola-sub">Te estamos llevando al selector de horarios…</p>
                <div className="cola-go-banner">
                  <p className="cola-go-title">✓ Ingresando al turnero</p>
                  <p className="cola-go-sub">Ya podés elegir el horario que más te conviene</p>
                </div>
                <div className="cola-spinner" style={{ borderTopColor: '#059669', marginTop: 16 }} />
              </>
            )}

            {/* ── Error ── */}
            {estado === 'error' && (
              <>
                <div className="cola-ring" style={{ background: 'linear-gradient(135deg,#dc2626,#f87171)' }}>
                  <span className="cola-emoji">⚠️</span>
                </div>
                <h2 className="cola-title">Algo salió mal</h2>
                <p className="cola-sub">{errMsg}</p>
                <button
                  className="pub-submit"
                  onClick={() => { setEstado('cargando'); setErrMsg(null); entrar(); }}
                  style={{ marginTop: 8 }}
                >
                  Reintentar
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
