/* CSS compartido para páginas públicas del sitio */
export const PUBLIC_CSS = `
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0,0); }
    33%       { transform: translate(30px,-20px); }
    66%       { transform: translate(-20px,15px); }
  }
  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0,0); }
    33%       { transform: translate(-25px,20px); }
    66%       { transform: translate(20px,-15px); }
  }
  @keyframes spinnerAnim {
    to { transform: rotate(360deg); }
  }
  @keyframes ringGlow {
    0%, 100% { box-shadow: 0 0 30px rgba(124,58,237,0.3); }
    50%       { box-shadow: 0 0 60px rgba(124,58,237,0.6), 0 0 100px rgba(236,72,153,0.2); }
  }
  @keyframes successBounce {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  *, *::before, *::after { box-sizing: border-box; }

  .pub-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #4f1b8e 0%, #6d28d9 25%, #3730a3 55%, #be185d 100%);
    background-size: 300% 300%;
    animation: gradientShift 12s ease infinite;
    display: flex; align-items: center; justify-content: center;
    padding: clamp(20px, 4vw, 48px) 16px;
    font-family: system-ui, -apple-system, sans-serif;
    position: relative; overflow-x: hidden;
  }

  /* Orbs */
  .pub-orb {
    position: fixed; border-radius: 50%;
    filter: blur(80px); pointer-events: none; z-index: 0;
  }
  .pub-orb-1 {
    width: 500px; height: 500px; top: -150px; left: -150px;
    background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
    animation: orbFloat1 18s ease-in-out infinite;
  }
  .pub-orb-2 {
    width: 400px; height: 400px; bottom: -100px; right: -100px;
    background: radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%);
    animation: orbFloat2 22s ease-in-out infinite;
  }
  .pub-orb-3 {
    width: 350px; height: 350px; top: 30%; right: -80px;
    background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%);
    animation: orbFloat1 26s ease-in-out infinite reverse;
  }

  /* Card */
  .pub-card {
    width: 100%; max-width: 460px;
    background: rgba(255,255,255,0.97);
    border-radius: 28px;
    padding: clamp(32px,6vw,48px) clamp(24px,6vw,40px);
    box-shadow:
      0 32px 80px rgba(0,0,0,0.3),
      0 0 0 1px rgba(255,255,255,0.5) inset;
    position: relative; z-index: 1;
    animation: fadeUp 0.65s ease both;
  }
  .pub-card-wide { max-width: 580px; }

  /* Header */
  .pub-header { text-align: center; margin-bottom: 28px; }
  .pub-logo-ring {
    display: inline-block; margin-bottom: 16px;
    padding: 5px; border-radius: 28px;
    background: linear-gradient(135deg, rgba(124,58,237,0.7), rgba(236,72,153,0.7));
    animation: ringGlow 3.5s ease-in-out infinite;
  }
  .pub-logo-wrap {
    width: 80px; height: 80px; border-radius: 23px;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    animation: float 4.5s ease-in-out infinite;
  }
  .pub-logo { height: 56px; width: auto; }

  .pub-title {
    margin: 0 0 5px; font-size: clamp(20px,5vw,26px); font-weight: 900;
    letter-spacing: -0.3px;
    background: linear-gradient(135deg, #4f1b8e, #7c3aed, #be185d);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .pub-sub {
    margin: 0; font-size: 13px; color: #64748b; font-weight: 500;
  }

  /* Info box */
  .pub-info {
    background: linear-gradient(135deg, #f5f3ff, #fdf2f8);
    border: 1.5px solid #e9d5ff; border-radius: 14px;
    padding: 14px 18px; margin-bottom: 24px;
  }
  .pub-info p { margin: 0; font-size: 14px; color: #5b21b6; line-height: 1.65; }

  /* Form elements */
  .pub-field { margin-bottom: 18px; }
  .pub-label {
    display: block; font-size: 12px; font-weight: 800;
    color: #475569; letter-spacing: 0.06em;
    text-transform: uppercase; margin-bottom: 7px;
  }
  .pub-input {
    width: 100%; padding: 13px 16px;
    background: #f8fafc; border: 1.5px solid #e2e8f0;
    border-radius: 12px; font-size: 15px; color: #0f172a;
    outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }
  .pub-input::placeholder { color: #b0bec5; }
  .pub-input:focus {
    border-color: #7c3aed;
    background: #faf7ff;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
  }
  .pub-input-wrap { position: relative; }
  .pub-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #94a3b8;
    display: flex; align-items: center; padding: 0;
    transition: color 0.15s ease;
  }
  .pub-eye:hover { color: #7c3aed; }

  /* Submit button */
  .pub-submit {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #4f1b8e, #7c3aed, #be185d);
    background-size: 200% 200%; animation: gradientShift 5s ease infinite;
    color: #fff; border: none; border-radius: 14px;
    font-size: 16px; font-weight: 800; cursor: pointer;
    box-shadow: 0 4px 20px rgba(124,58,237,0.35);
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    letter-spacing: 0.2px;
  }
  .pub-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(124,58,237,0.5);
  }
  .pub-submit:active:not(:disabled) { transform: translateY(0); }
  .pub-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Spinner */
  .pub-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    border-radius: 50%; animation: spinnerAnim 0.7s linear infinite;
    display: inline-block;
  }

  /* Error */
  .pub-error {
    background: #fef2f2; border: 1.5px solid #fca5a5;
    color: #b91c1c; border-radius: 10px;
    padding: 11px 14px; font-size: 13px; font-weight: 600;
    margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
  }

  /* Success panel */
  .pub-success {
    text-align: center; padding: 8px 0;
    animation: fadeUp 0.5s ease both;
  }
  .pub-success-icon {
    font-size: 56px; margin-bottom: 16px;
    display: block; animation: successBounce 0.6s ease both;
  }
  .pub-success-title {
    margin: 0 0 10px; font-size: 22px; font-weight: 900;
    background: linear-gradient(135deg, #059669, #10b981);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .pub-success-text {
    margin: 0; font-size: 14px; color: #475569; line-height: 1.7;
  }
  .pub-success-badge {
    display: inline-block; margin-top: 16px;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1.5px solid #86efac; border-radius: 14px;
    padding: 12px 20px; font-size: 15px; font-weight: 800; color: #15803d;
  }
  .pub-success-badge span { display: block; font-size: 11px; font-weight: 600; color: #4ade80; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.06em; }

  /* Section divider */
  .pub-divider {
    display: flex; align-items: center; gap: 12px; margin: 22px 0;
  }
  .pub-divider::before, .pub-divider::after {
    content: ''; flex: 1; height: 1px; background: #e2e8f0;
  }
  .pub-divider span { font-size: 12px; color: #94a3b8; font-weight: 600; white-space: nowrap; }

  /* Badge section highlight */
  .pub-badge-row {
    display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 24px;
  }
  .pub-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 50px;
    font-size: 13px; font-weight: 700;
  }
  .pub-badge-purple { background: #f5f3ff; color: #6d28d9; border: 1.5px solid #ddd6fe; }
  .pub-badge-pink   { background: #fdf2f8; color: #9d174d; border: 1.5px solid #fbcfe8; }

  /* ── Responsive mobile ── */
  @media (max-width: 520px) {
    .pub-page { padding: 16px 12px; align-items: flex-start; }
    .pub-card {
      border-radius: 20px;
      padding: 24px 16px 28px;
    }
    .pub-card-wide {
      border-radius: 20px;
      padding: 24px 16px 28px;
    }
    .pub-logo-ring { border-radius: 22px; }
    .pub-logo-wrap { width: 68px; height: 68px; border-radius: 18px; }
    .pub-logo { height: 46px; }
    .pub-title { font-size: 19px; }
    .pub-sub { font-size: 12px; }
    .pub-header { margin-bottom: 20px; }
    .pub-info { padding: 11px 14px; }
    .pub-info p { font-size: 13px; }
    .pub-input { font-size: 14px; padding: 12px 14px; }
    .pub-submit { font-size: 15px; padding: 13px; }
    .pub-badge { font-size: 12px; padding: 5px 10px; }
    .pub-badge-row { gap: 7px; margin-bottom: 18px; }
    .pub-success-icon { font-size: 46px; }
    .pub-success-title { font-size: 19px; }
    .pub-success-text { font-size: 13px; }
    .pub-orb { filter: blur(50px); }
    .pub-orb-1 { width: 250px; height: 250px; top: -80px; left: -80px; }
    .pub-orb-2 { width: 200px; height: 200px; bottom: -60px; right: -60px; }
    .pub-orb-3 { width: 180px; height: 180px; }
  }
`;
