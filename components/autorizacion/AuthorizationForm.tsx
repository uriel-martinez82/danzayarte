'use client';

import { useState, FormEvent, CSSProperties } from 'react';
import { LOGO_BASE64 } from '@/lib/logo';

interface Props { numero: 1 | 2; }

const FECHAS  = { 1: '28 de Noviembre', 2: '06 de Diciembre' };
const TITULOS = { 1: 'Show 28 de Noviembre', 2: 'Show 6 de Diciembre' };

const INITIAL = {
  alumno_nombre:        '',
  alumno_apellido:      '',
  alumno_dni:           '',
  responsable_nombre:   '',
  responsable_apellido: '',
  responsable_dni:      '',
  responsable_email:    '',
};

export default function AuthorizationForm({ numero }: Props) {
  const [fields,  setFields]  = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { alumno_nombre, alumno_apellido, alumno_dni,
            responsable_nombre, responsable_apellido, responsable_dni, responsable_email } = fields;
    if (!alumno_nombre || !alumno_apellido || !alumno_dni ||
        !responsable_nombre || !responsable_apellido || !responsable_dni || !responsable_email) {
      setError('Por favor completá todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/autorizacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumno:      { nombre: alumno_nombre, apellido: alumno_apellido, dni: alumno_dni },
          responsable: { nombre: responsable_nombre, apellido: responsable_apellido, dni: responsable_dni, email: responsable_email },
          numero,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar.');
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  }

  /* ── ÉXITO ───────────────────────────────────────────────────── */
  if (success) return (
    <div style={s.page}>
      <div style={s.card}>
        <Header />
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 52 }}>✅</div>
          <h2 style={s.successTitle}>¡{TITULOS[numero]} registrado!</h2>
          <p style={s.successSub}>
            Se enviaron las confirmaciones a <strong>{fields.responsable_email}</strong> y a la escuela.
          </p>
          <div style={s.summaryBox}>
            <Row label="Alumna"      value={`${fields.alumno_nombre} ${fields.alumno_apellido} — DNI ${fields.alumno_dni}`} />
            <Row label="Responsable" value={`${fields.responsable_nombre} ${fields.responsable_apellido} — DNI ${fields.responsable_dni}`} />
            <Row label="Fecha"       value={FECHAS[numero]} />
          </div>
          <button style={s.btnSecondary} onClick={() => { setFields(INITIAL); setSuccess(false); }}>
            Cargar otra autorización
          </button>
        </div>
      </div>
    </div>
  );

  /* ── FORMULARIO ──────────────────────────────────────────────── */
  return (
    <div style={s.page}>
      <div style={s.card}>
        <Header />

        <form onSubmit={handleSubmit}>
          <div style={s.docBox}>
            <span style={s.badge}>{TITULOS[numero]}</span>

            {/* ── Texto con campos inline ── */}
            <p style={s.docText}>
              Autorizo a mi hija{' '}
              <Box value={fields.alumno_nombre}    onChange={set('alumno_nombre')}    placeholder="nombre"    width={130} />{' '}
              <Box value={fields.alumno_apellido}  onChange={set('alumno_apellido')}  placeholder="apellido"  width={150} />{' '}
              con DNI{' '}
              <Box value={fields.alumno_dni}       onChange={set('alumno_dni')}       placeholder="00.000.000" width={115} />,{' '}
              a participar del show de fin de año en el{' '}
              <strong>Teatro Astral (Av. Corrientes 1639)</strong>,
              el día <strong>{FECHAS[numero]}</strong>.
            </p>

            <p style={{ ...s.docText, marginBottom: 0 }}>
              <strong>Adulto responsable:</strong>{' '}
              <Box value={fields.responsable_nombre}    onChange={set('responsable_nombre')}    placeholder="nombre"    width={130} />{' '}
              <Box value={fields.responsable_apellido}  onChange={set('responsable_apellido')}  placeholder="apellido"  width={150} />
              {'   '}
              <strong>DNI:</strong>{' '}
              <Box value={fields.responsable_dni}       onChange={set('responsable_dni')}       placeholder="00.000.000" width={115} />
            </p>
          </div>

          {/* Email aparte (no forma parte del texto legal) */}
          <div style={s.emailBlock}>
            <label style={s.emailLabel}>📧 Email del responsable</label>
            <input
              type="email"
              value={fields.responsable_email}
              onChange={set('responsable_email')}
              placeholder="ejemplo@gmail.com"
              style={{
                ...s.emailInput,
                fontWeight: fields.responsable_email ? 700 : 400,
                color: fields.responsable_email ? '#0f172a' : undefined,
              }}
            />
          </div>

          {error && <div style={s.errorBox}>⚠ {error}</div>}

          <button type="submit" style={s.btnPrimary} disabled={loading}>
            {loading ? 'Enviando...' : `✓ Confirmar — ${TITULOS[numero]}`}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Input tipo caja inline ────────────────────────────────────── */
function Box({ value, onChange, placeholder, width }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  width: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: 'inline-block',
        width,
        padding: '4px 10px',
        border: `1.5px solid ${focused ? '#3730a3' : '#cbd5e1'}`,
        borderRadius: 7,
        background: focused ? '#eef2ff' : '#f8fafc',
        fontSize: 14,
        fontFamily: 'inherit',
        fontWeight: value ? 700 : 400,
        color: value ? '#0f172a' : '#94a3b8',
        outline: 'none',
        verticalAlign: 'middle',
        transition: 'border-color 0.15s, background 0.15s',
        boxSizing: 'border-box',
      } as CSSProperties}
    />
  );
}

/* ── Helpers ───────────────────────────────────────────────────── */
function Header() {
  return (
    <div style={s.header}>
      <img src={LOGO_BASE64} alt="Danza y Arte" style={s.logo} />
      <h1 style={s.schoolName}>Danza y Arte</h1>
      <p style={s.schoolSub}>Show de Fin de Año — Teatro Astral</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 14 }}>
      <span style={{ fontWeight: 700, color: '#64748b', minWidth: 90 }}>{label}</span>
      <span style={{ color: '#0f172a' }}>{value}</span>
    </div>
  );
}

/* ── Estilos ───────────────────────────────────────────────────── */
const s: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fdf4ff 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 'clamp(12px, 4vw, 40px) 16px',
  },
  card: {
    width: '100%',
    maxWidth: 600,
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
    padding: 'clamp(20px, 5vw, 40px)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: 28,
    paddingBottom: 24,
    borderBottom: '1px solid #f1f5f9',
  },
  logo: { height: 72, width: 'auto', marginBottom: 10 },
  schoolName: { margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 },
  schoolSub:  { margin: 0, fontSize: 13, color: '#64748b' },
  docBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '20px 24px',
  },
  badge: {
    display: 'inline-block',
    background: '#e0e7ff',
    color: '#3730a3',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    padding: '3px 10px',
    borderRadius: 20,
    marginBottom: 14,
  },
  docText: {
    margin: '0 0 14px',
    fontSize: 15,
    lineHeight: 2.4,
    color: '#1e293b',
    fontFamily: 'Georgia, serif',
  },
  emailBlock: {
    marginTop: 20,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '14px 18px',
  },
  emailLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: '#475569',
    marginBottom: 8,
  },
  emailInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 9,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
  },
  btnPrimary: {
    width: '100%',
    marginTop: 20,
    padding: '14px 0',
    background: '#3730a3',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '11px 26px',
    background: '#f1f5f9',
    color: '#334155',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorBox: {
    marginTop: 16,
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#b91c1c',
    borderRadius: 10,
    padding: '11px 16px',
    fontSize: 14,
  },
  successTitle: { fontSize: 21, fontWeight: 800, color: '#0f172a', margin: '12px 0 8px' },
  successSub:   { color: '#475569', fontSize: 15, marginBottom: 22 },
  summaryBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '14px 20px',
    marginBottom: 22,
    textAlign: 'left',
  },
};
