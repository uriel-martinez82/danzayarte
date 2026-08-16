'use client';

import { useState, useEffect, FormEvent } from 'react';
import { LOGO_BASE64 } from '@/lib/logo';

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

export default function VerificacionDatosPage() {
  const [alumno,      setAlumno]      = useState<Alumno | null>(null);
  const [responsable, setResponsable] = useState<Responsable | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [confirmado,  setConfirmado]  = useState(false);

  useEffect(() => {
    fetch('/api/verificacion/datos')
      .then(r => {
        if (r.status === 401) { window.location.href = '/verificacion'; return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setAlumno(data.alumno);
        setResponsable(data.responsable);
        setConfirmado(data.alumno.confirmado);
      })
      .catch(() => setError('Error al cargar los datos.'))
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

  if (loading) return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Cargando datos…</p>
      </div>
    </div>
  );

  /* ── ÉXITO ── */
  if (confirmado) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <img src={LOGO_BASE64} alt="Danza y Arte" style={s.logo} />
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 56 }}>✅</div>
          <h2 style={s.successTitle}>¡Datos confirmados!</h2>
          <p style={{ color: '#475569', fontSize: 15 }}>
            Los datos fueron verificados y guardados correctamente.
          </p>
          {alumno && (
            <div style={s.summaryBox}>
              <Row label="Alumno/a"    value={`${alumno.nombre} ${alumno.apellido}`} />
              <Row label="DNI"         value={alumno.dni} />
              {responsable && <>
                <Row label="Responsable" value={`${responsable.nombre} ${responsable.apellido}`} />
                <Row label="Email"       value={responsable.email} />
              </>}
            </div>
          )}
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 20 }}>
            Danza y Arte - Agustina Spera
          </p>
        </div>
      </div>
    </div>
  );

  /* ── FORMULARIO ── */
  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.header}>
          <img src={LOGO_BASE64} alt="Danza y Arte" style={s.logo} />
          <h1 style={s.title}>Verificación de datos</h1>
          <p style={s.sub}>Danza y Arte - Agustina Spera</p>
        </div>

        <div style={s.infoBox}>
          <p style={s.infoText}>
            Revisá tus datos. Si algo no es correcto, modificalo antes de confirmar.
          </p>
        </div>

        <form onSubmit={handleConfirmar}>

          {/* Alumno */}
          <div style={s.section}>
            <h3 style={s.sectionTitle}>👤 Alumno/a</h3>
            <div style={s.row2}>
              <Field label="Nombre" value={alumno?.nombre ?? ''} onChange={v => setAlumno(a => a ? { ...a, nombre: v } : a)} />
              <Field label="Apellido" value={alumno?.apellido ?? ''} onChange={v => setAlumno(a => a ? { ...a, apellido: v } : a)} />
            </div>
            <Field label="DNI" value={alumno?.dni ?? ''} onChange={() => {}} disabled />
          </div>

          {/* Responsable */}
          {responsable && (
            <div style={s.section}>
              <h3 style={s.sectionTitle}>👨‍👩‍👧 Adulto responsable</h3>
              <div style={s.row2}>
                <Field label="Nombre" value={responsable.nombre} onChange={v => setResponsable(r => r ? { ...r, nombre: v } : r)} />
                <Field label="Apellido" value={responsable.apellido} onChange={v => setResponsable(r => r ? { ...r, apellido: v } : r)} />
              </div>
              <div style={s.row2}>
                <Field label="DNI" value={responsable.dni} onChange={v => setResponsable(r => r ? { ...r, dni: v } : r)} />
                <Field label="Email" value={responsable.email} onChange={v => setResponsable(r => r ? { ...r, email: v } : r)} />
              </div>
            </div>
          )}

          {error && <div style={s.error}>⚠ {error}</div>}

          <button type="submit" style={s.btn} disabled={saving}>
            {saving ? 'Guardando…' : '✓ Confirmar datos'}
          </button>

        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled }: {
  label: string; value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={s.label}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{ ...s.input, background: disabled ? '#f1f5f9' : '#fff', color: disabled ? '#94a3b8' : '#0f172a' }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14 }}>
      <span style={{ fontWeight: 700, color: '#64748b', minWidth: 100 }}>{label}</span>
      <span style={{ color: '#0f172a' }}>{value}</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fdf4ff 100%)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: 'clamp(16px, 4vw, 40px) 16px', fontFamily: 'system-ui, sans-serif',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: 'clamp(24px, 5vw, 40px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)', width: '100%', maxWidth: 560,
  },
  header: { textAlign: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' },
  logo:   { height: 64, width: 'auto', marginBottom: 10 },
  title:  { margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#0f172a' },
  sub:    { margin: 0, fontSize: 13, color: '#64748b' },
  infoBox: {
    background: '#f0f4ff', borderRadius: 12, padding: '12px 16px',
    marginBottom: 24, border: '1px solid #e0e7ff',
  },
  infoText: { margin: 0, fontSize: 14, color: '#3730a3', lineHeight: 1.6 },
  section: {
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 12, padding: '18px 20px', marginBottom: 16,
  },
  sectionTitle: { margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#475569' },
  row2:  { display: 'flex', gap: 12, marginBottom: 0 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 9, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    marginBottom: 12, fontFamily: 'inherit',
  },
  btn: {
    width: '100%', padding: '14px 0', background: '#16a34a', color: '#fff',
    border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
    marginTop: 8,
  },
  error: {
    background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
    borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 14,
  },
  successTitle: { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '12px 0 8px' },
  summaryBox: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
    padding: '14px 20px', marginTop: 20, textAlign: 'left',
  },
};
