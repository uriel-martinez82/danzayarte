'use client';

import { LOGO_BASE64 } from '@/lib/logo';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const SHOWS = [
  {
    numero: 1,
    titulo: 'Show 28 de Noviembre',
    fecha: 'Sábado 28 de Noviembre',
    hora: 'A confirmar',
    color: '#0891b2',
    colorLight: '#e0f7fa',
    emoji: '🎭',
    url: `${APP_URL}/autorizacion/1`,
  },
  {
    numero: 2,
    titulo: 'Show 6 de Diciembre',
    fecha: 'Domingo 6 de Diciembre',
    hora: 'A confirmar',
    color: '#7c3aed',
    colorLight: '#ede9fe',
    emoji: '✨',
    url: `${APP_URL}/autorizacion/2`,
  },
];

function qrUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=1e1b4b&data=${encodeURIComponent(data)}`;
}

export default function HomePage() {
  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <header style={s.header}>
        <img src={LOGO_BASE64} alt="Danza y Arte" style={s.logo} />
        <h1 style={s.title}>Danza y Arte</h1>
        <p style={s.subtitle}>Show de Fin de Año — Teatro Astral</p>
        <p style={s.address}>Av. Corrientes 1639, Buenos Aires</p>
      </header>

      {/* ── Intro ── */}
      <p style={s.intro}>
        Para que tu hija/hijo pueda participar del show, necesitamos que completes
        la autorización correspondiente a cada fecha. Hacé clic en el botón
        o escaneá el código QR desde tu celular.
      </p>

      {/* ── Cards de shows ── */}
      <div style={s.cards}>
        {SHOWS.map(show => (
          <div key={show.numero} style={{ ...s.card, borderTop: `4px solid ${show.color}` }}>

            <div style={s.cardHeader}>
              <span style={{ fontSize: 36 }}>{show.emoji}</span>
              <div>
                <div style={{ ...s.showLabel, color: show.color, background: show.colorLight }}>
                  Autorización {show.numero}
                </div>
                <h2 style={s.showTitle}>{show.titulo}</h2>
                <p style={s.showDate}>📅 {show.fecha}</p>
                <p style={s.showDate}>📍 Teatro Astral — Av. Corrientes 1639</p>
              </div>
            </div>

            {/* QR */}
            <div style={s.qrWrap}>
              <img
                src={qrUrl(show.url)}
                alt={`QR Autorización ${show.numero}`}
                style={s.qr}
              />
              <p style={s.qrLabel}>Escaneá con tu celular</p>
            </div>

            {/* Botón */}
            <a href={show.url} style={{ ...s.btn, background: show.color }}>
              Completar autorización →
            </a>
          </div>
        ))}
      </div>

      {/* ── Instrucciones ── */}
      <div style={s.infoBox}>
        <h3 style={s.infoTitle}>ℹ️ ¿Cómo completar la autorización?</h3>
        <ol style={s.infoList}>
          <li>Ingresá al formulario de cada show haciendo clic en el botón o escaneando el QR.</li>
          <li>Completá los datos de tu hija/hijo y los tuyos como adulto responsable.</li>
          <li>Hacé clic en "Confirmar" y recibirás un mail con la confirmación.</li>
          <li>Repetí el proceso para el segundo show si tu hija participa en ambas fechas.</li>
        </ol>
      </div>

      <footer style={s.footer}>
        <p>Danza y Arte · Teatro Astral · Av. Corrientes 1639</p>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f0f4ff 0%, #fdf4ff 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '0 16px 40px',
  },
  header: {
    textAlign: 'center',
    padding: '48px 16px 32px',
  },
  logo: { height: 90, width: 'auto', marginBottom: 12 },
  title: { margin: '0 0 6px', fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: -1 },
  subtitle: { margin: '0 0 4px', fontSize: 17, color: '#3730a3', fontWeight: 700 },
  address: { margin: 0, fontSize: 13, color: '#64748b' },
  intro: {
    maxWidth: 560,
    margin: '0 auto 32px',
    textAlign: 'center',
    fontSize: 15,
    color: '#475569',
    lineHeight: 1.7,
  },
  cards: {
    display: 'flex',
    gap: 20,
    maxWidth: 760,
    margin: '0 auto 32px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    minWidth: 280,
    maxWidth: 360,
    background: '#fff',
    borderRadius: 20,
    padding: '28px 24px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  cardHeader: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  showLabel: {
    display: 'inline-block',
    fontSize: 11, fontWeight: 800, letterSpacing: 1,
    textTransform: 'uppercase', padding: '3px 10px',
    borderRadius: 20, marginBottom: 8,
  },
  showTitle: { margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0f172a' },
  showDate: { margin: '0 0 4px', fontSize: 13, color: '#475569' },
  qrWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  qr: {
    width: 160, height: 160,
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: 8,
    background: '#fff',
  },
  qrLabel: { margin: 0, fontSize: 12, color: '#94a3b8' },
  btn: {
    display: 'block',
    textAlign: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    padding: '13px 0',
    borderRadius: 12,
    textDecoration: 'none',
    letterSpacing: 0.2,
  },
  infoBox: {
    maxWidth: 560,
    margin: '0 auto 32px',
    background: '#fff',
    borderRadius: 16,
    padding: '24px 28px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  },
  infoTitle: { margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' },
  infoList: { margin: 0, paddingLeft: 20, color: '#475569', fontSize: 14, lineHeight: 2 },
  footer: { textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 16 },
};
