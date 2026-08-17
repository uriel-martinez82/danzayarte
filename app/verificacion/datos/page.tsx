'use client';

import { useState, useEffect, FormEvent } from 'react';
import { LOGO_BASE64 } from '@/lib/logo';
import { PUBLIC_CSS } from '@/lib/public-page-css';

interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  confirmado: boolean;
}

interface Responsable {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
}

const DATOS_CSS = `
  ${PUBLIC_CSS}

  .datos-section {
    background: rgba(255,255,255,0.6);
    border: 1.5px solid rgba(124,58,237,0.12);
    border-radius: 16px;
    padding: 20px 22px;
    margin-bottom: 14px;
    backdrop-filter: blur(8px);
    transition: box-shadow 0.2s ease;
  }
  .datos-section:hover {
    box-shadow: 0 4px 20px rgba(124,58,237,0.10);
  }
  .datos-section-title {
    margin: 0 0 16px;
    font-size: 13px;
    font-weight: 800;
    color: #6d28d9;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .datos-row2 {
    display: flex;
    gap: 12px;
    margin-bottom: 0;
  }
  .datos-field {
    flex: 1;
    min-width: 0;
  }
  .datos-label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 6px;
  }
  .datos-input {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    margin-bottom: 12px;
    font-family: inherit;
    background: #fff;
    color: #0f172a;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }
  .datos-input:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
  }
  .datos-input:disabled {
    background: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
  }
  .datos-submit {
    width: 100%;
    padding: 15px 0;
    background: linear-gradient(135deg, #059669, #10b981, #059669);
    background-size: 200% 200%;
    color: #fff;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    margin-top: 8px;
    letter-spacing: 0.02em;
    box-shadow: 0 4px 20px rgba(16,185,129,0.35);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    animation: gradientShift 6s ease infinite;
  }
  .datos-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(16,185,129,0.5);
  }
  .datos-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .datos-error {
    background: rgba(254,242,242,0.9);
    border: 1.5px solid #fca5a5;
    color: #b91c1c;
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .loading-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #4f1b8e 0%, #6d28d9 25%, #3730a3 55%, #be185d 100%);
    background-size: 300% 300%;
    animation: gradientShift 12s ease infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, sans-serif;
  }
  .loading-card {
    background: rgba(255,255,255,0.97);
    border-radius: 24px;
    padding: 40px 36px;
    text-align: center;
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
    background: rgba(240,253,244,0.8);
    border: 1.5px solid #86efac;
    border-radius: 14px;
    padding: 16px 20px;
    margin-top: 20px;
    text-align: left;
    backdrop-filter: blur(8px);
  }
  .summary-row {
    display: flex; gap: 10px; margin-bottom: 8px; font-size: 14px;
  }
  .summary-row:last-child { margin-bottom: 0; }
  .summary-label { font-weight: 700; color: #15803d; min-width: 100px; }
  .summary-value { color: #0f172a; }

  /* ── Responsive mobile ── */
  @media (max-width: 520px) {
    .datos-row2 {
      flex-direction: column;
      gap: 0;
    }
    .datos-field { width: 100%; }
    .datos-section { padding: 16px 16px; }
    .datos-submit { font-size: 14px; padding: 13px; }
  }
`;

export default function VerificacionDatosPage() {
  const [alumno,      setAlumno]      = useState<Alumno | null>(null);
  const [responsable, setResponsable] = useState<Responsable | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [confirmado,  setConfirmado]  = useState(false);

  useEffect(() => {
    fetch('/api/verificacion/datos')
      .then(async r => {
        if (r.status === 401) { window.location.href = '/verificacion'; return null; }
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? `Error ${r.status}`);
        return data;
      })
      .then(data => {
        if (!data) return;
        setAlumno(data.alumno);
        setResponsable(data.responsable);
        setConfirmado(data.alumno?.confirmado ?? false);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error al cargar los datos.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleConfirmar(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/verificacion/datos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumno, responsable }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfirmado(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  /* Loading */
  if (loading) return (
    <>
      <style>{DATOS_CSS}</style>
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner-lg" />
          <p className="loading-text">Cargando datos…</p>
        </div>
      </div>
    </>
  );

  /* Confirmado */
  if (confirmado) return (
    <>
      <style>{DATOS_CSS}</style>
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
            <span className="pub-success-icon">✅</span>
            <h2 className="pub-success-title">¡Datos confirmados!</h2>
            <p className="pub-success-text">
              Los datos fueron verificados y guardados correctamente.
            </p>
            {alumno && (
              <div className="summary-box">
                <div className="summary-row">
                  <span className="summary-label">Alumno/a</span>
                  <span className="summary-value">{alumno.nombre} {alumno.apellido}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">DNI</span>
                  <span className="summary-value">{alumno.dni}</span>
                </div>
                {responsable && <>
                  <div className="summary-row">
                    <span className="summary-label">Responsable</span>
                    <span className="summary-value">{responsable.nombre} {responsable.apellido}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Email</span>
                    <span className="summary-value">{responsable.email}</span>
                  </div>
                </>}
              </div>
            )}
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 20 }}>
              Danza y Arte — Agustina Spera
            </p>
          </div>
        </div>
      </div>
    </>
  );

  /* Formulario */
  return (
    <>
      <style>{DATOS_CSS}</style>
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
            <h1 className="pub-title">Verificación de datos</h1>
            <p className="pub-sub">Danza y Arte — Agustina Spera</p>
          </div>

          <div className="pub-badge-row">
            <span className="pub-badge pub-badge-purple">🎭 Teatro Astral</span>
            <span className="pub-badge pub-badge-pink">✨ Show de Fin de Año</span>
          </div>

          <div className="pub-info">
            <p>Revisá los datos. Si algo no es correcto, modificalo antes de confirmar. Los cambios quedarán guardados.</p>
          </div>

          <form onSubmit={handleConfirmar}>

            {/* Alumno */}
            <div className="datos-section">
              <h3 className="datos-section-title">👤 Alumno/a</h3>
              <div className="datos-row2">
                <Field label="Nombre"   value={alumno?.nombre   ?? ''} onChange={v => setAlumno(a => a ? { ...a, nombre: v }   : a)} />
                <Field label="Apellido" value={alumno?.apellido ?? ''} onChange={v => setAlumno(a => a ? { ...a, apellido: v } : a)} />
              </div>
              <Field label="DNI" value={alumno?.dni ?? ''} onChange={() => {}} disabled />
            </div>

            {/* Responsable */}
            {responsable && (
              <div className="datos-section">
                <h3 className="datos-section-title">👨‍👩‍👧 Adulto responsable</h3>
                <div className="datos-row2">
                  <Field label="Nombre"   value={responsable.nombre}   onChange={v => setResponsable(r => r ? { ...r, nombre: v }   : r)} />
                  <Field label="Apellido" value={responsable.apellido} onChange={v => setResponsable(r => r ? { ...r, apellido: v } : r)} />
                </div>
                <div className="datos-row2">
                  <Field label="DNI"   value={responsable.dni}   onChange={v => setResponsable(r => r ? { ...r, dni: v }   : r)} />
                  <Field label="Email" value={responsable.email} onChange={v => setResponsable(r => r ? { ...r, email: v } : r)} />
                </div>
              </div>
            )}

            {error && (
              <div className="datos-error">
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" className="datos-submit" disabled={saving}>
              {saving ? <><span className="pub-spinner" /> Guardando…</> : '✓ Confirmar datos'}
            </button>

          </form>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, onChange, disabled }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="datos-field">
      <label className="datos-label">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="datos-input"
      />
    </div>
  );
}
