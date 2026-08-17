import { Resend } from 'resend';
import PDFDocument from 'pdfkit';

const resend = new Resend(process.env.RESEND_API_KEY);
const MAIL_FROM = process.env.MAIL_FROM ?? 'noreply@danzayarte.mudigital.com.ar';

const SHOW_LABELS: Record<number, string> = {
  1: '28 de noviembre',
  2: '6 de diciembre',
};

const DIA_LABELS: Record<string, string> = {
  '2026-09-12': 'Sábado 12 de septiembre',
  '2026-09-13': 'Domingo 13 de septiembre',
  '2026-09-19': 'Sábado 19 de septiembre',
  '2026-09-20': 'Domingo 20 de septiembre',
};

async function logoBuffer(): Promise<Buffer | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://danzayarte.mudigital.com.ar';
    const res = await fetch(`${base}/logo.png`);
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function generarPDF(params: {
  alumnoNombre: string;
  alumnoApellido: string;
  showNumero: number;
  fecha: string;
  hora: number;
}): Promise<Buffer> {
  const logo = await logoBuffer();
  const { alumnoNombre, alumnoApellido, showNumero, fecha, hora } = params;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Logo
    if (logo) doc.image(logo, 50, 45, { width: 65 });

    // Título
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a2e')
       .text('Turno Confirmado', 130, 50);
    doc.fontSize(11).font('Helvetica').fillColor('#666666')
       .text('Danza y Arte - Agustina Spera', 130, 76);

    doc.moveTo(50, 112).lineTo(545, 112).strokeColor('#e0e0e0').lineWidth(1).stroke();

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a2e')
       .text('Comprobante de reserva de turno', 50, 132);

    const filas = [
      ['Alumno/a',         `${alumnoNombre} ${alumnoApellido}`],
      ['Show',             `Show de Fin de Año — ${SHOW_LABELS[showNumero] ?? ''}`],
      ['Fecha del turno',  DIA_LABELS[fecha] ?? fecha],
      ['Horario',          `${hora}:00 hs`],
    ];

    let y = 166;
    for (const [label, valor] of filas) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#555555').text(label + ':', 50, y);
      doc.fontSize(11).font('Helvetica').fillColor('#111111').text(valor, 210, y);
      y += 30;
    }

    doc.moveTo(50, y + 12).lineTo(545, y + 12).strokeColor('#e0e0e0').stroke();

    doc.fontSize(10).font('Helvetica').fillColor('#888888')
       .text('Presentá este comprobante el día de tu turno.', 50, y + 26);
    doc.fontSize(10).fillColor('#888888')
       .text('Danza y Arte - Agustina Spera', 50, y + 42);

    doc.end();
  });
}

export async function enviarEmailTurno(params: {
  emailDestinatario: string | null;
  alumnoNombre: string;
  alumnoApellido: string;
  showNumero: number;
  fecha: string;
  hora: number;
}) {
  const { emailDestinatario, alumnoNombre, alumnoApellido, showNumero, fecha, hora } = params;

  const showLabel  = SHOW_LABELS[showNumero] ?? '';
  const fechaLabel = DIA_LABELS[fecha] ?? fecha;
  const subject    = `Danza y Arte - Agustina Spera | Turno reservado · ${alumnoNombre} ${alumnoApellido}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:system-ui,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

      <!-- Header blanco con logo -->
      <tr><td style="background:#ffffff;padding:28px 40px 20px;text-align:center;border-bottom:1px solid #f0f0f0;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://danzayarte.mudigital.com.ar'}/logo.png"
             alt="Danza y Arte" style="height:64px;width:auto;display:block;margin:0 auto 10px;" />
        <p style="margin:0;font-size:13px;color:#888;">Danza y Arte - Agustina Spera</p>
      </td></tr>

      <!-- Cuerpo -->
      <tr><td style="padding:32px 40px;">
        <h2 style="margin:0 0 6px;font-size:22px;color:#1a1a2e;">🎟️ ¡Turno confirmado!</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#444;">
          Hola <strong>${alumnoNombre}</strong>, tu turno para el Show del <strong>${showLabel}</strong> fue reservado correctamente.
        </p>

        <!-- Detalle del turno -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;font-size:13px;font-weight:700;color:#64748b;width:140px;">Alumno/a</td>
            <td style="padding:8px 0;font-size:14px;color:#0f172a;">${alumnoNombre} ${alumnoApellido}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;font-weight:700;color:#64748b;">Show</td>
            <td style="padding:8px 0;font-size:14px;color:#0f172a;">Show de Fin de Año — ${showLabel}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;font-weight:700;color:#64748b;">Fecha</td>
            <td style="padding:8px 0;font-size:14px;color:#0f172a;">${fechaLabel}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;font-weight:700;color:#64748b;">Horario</td>
            <td style="padding:8px 0;font-size:14px;font-weight:700;color:#3730a3;">${hora}:00 hs</td>
          </tr>
        </table>

        <p style="margin:0;font-size:14px;color:#475569;">
          Encontrás el comprobante adjunto en este mail. Presentalo el día del turno.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8fafc;padding:18px 40px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">Danza y Arte - Agustina Spera</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const pdfBuffer = await generarPDF({ alumnoNombre, alumnoApellido, showNumero, fecha, hora });
  const attachments = [{
    filename: `turno_${alumnoApellido.toLowerCase()}_danzayarte.pdf`,
    content: pdfBuffer.toString('base64'),
  }];

  const testMode = process.env.TEST_MODE === 'true';
  const INTERNAL = 'uriel.martinez.elias@gmail.com';

  const envios: Promise<unknown>[] = [];

  // Email al responsable (solo si tiene email registrado)
  const destinatarioFinal = testMode ? INTERNAL : emailDestinatario;
  if (destinatarioFinal) {
    envios.push(resend.emails.send({
      from: MAIL_FROM,
      to: destinatarioFinal,
      subject: testMode ? `[TEST] ${subject}` : subject,
      html,
      attachments,
    }));
  }

  // Copia interna — siempre
  envios.push(resend.emails.send({
    from: MAIL_FROM,
    to: INTERNAL,
    subject: testMode
      ? `[TEST Escuela] ${subject}`
      : emailDestinatario
        ? subject
        : `[SIN EMAIL RESPONSABLE] ${subject}`,
    html,
    attachments,
  }));

  await Promise.all(envios);
}
