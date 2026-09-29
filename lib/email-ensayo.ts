const TITULO = 'Ensayo General — Teatro Astral';
const FECHA  = '14 y/o 15 de noviembre del 2026';
const LUGAR  = 'Teatro Astral (Av. Corrientes 1639)';

interface Persona { nombre: string; apellido: string; dni: string; }
interface ResponsableE extends Persona { email: string; }

async function generarPDFEnsayo(alumno: Persona, responsable: ResponsableE): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;

  let logo: Buffer | null = null;
  try {
    const res = await fetch('https://danzayarte.mudigital.com.ar/logo.png');
    logo = Buffer.from(await res.arrayBuffer());
  } catch { /* sin logo */ }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Logo centrado
    if (logo) {
      try {
        doc.image(logo, (595 - 80) / 2, 60, { fit: [80, 80] });
        doc.moveDown(4.5);
      } catch { doc.moveDown(1); }
    } else {
      doc.moveDown(1);
    }

    // Nombre escuela
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#7c3aed')
       .text('Danza y Arte - Agustina Spera', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#64748b')
       .text('Ensayo General — Teatro Astral', { align: 'center' });
    doc.moveDown(0.6);

    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#7c3aed')
       .text('AUTORIZACIÓN ENSAYO GENERAL', { align: 'center' });
    doc.moveDown(1.2);

    doc.fillColor('#1e293b').fontSize(14).font('Helvetica')
       .text('Autorizo a mi hijo/hija ', { continued: true })
       .font('Helvetica-Bold').text(`${alumno.nombre} ${alumno.apellido}`, { continued: true })
       .font('Helvetica').text(' con DNI ', { continued: true })
       .font('Helvetica-Bold').text(alumno.dni, { continued: true })
       .font('Helvetica').text(', a concurrir al ensayo general en el ', { continued: true })
       .font('Helvetica-Bold').text(LUGAR, { continued: true })
       .font('Helvetica').text(' con la Escuela de Danza y Arte Agustina Spera. Ensayo a realizarse el ', { continued: true })
       .font('Helvetica-Bold').text(`${FECHA}.`);

    doc.moveDown(1.2);

    doc.font('Helvetica').text('Adulto responsable: ', { continued: true })
       .font('Helvetica-Bold').text(`${responsable.nombre} ${responsable.apellido}`);
    doc.font('Helvetica').text('DNI: ', { continued: true })
       .font('Helvetica-Bold').text(responsable.dni);

    doc.moveDown(4);

    doc.fontSize(10).fillColor('#94a3b8')
       .text('Documento generado automáticamente — Danza y Arte - Agustina Spera.', { align: 'center' });

    doc.end();
  });
}

function buildEmailHTMLEnsayo(alumno: Persona, responsable: ResponsableE): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><title>Autorización Ensayo General</title></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:Arial,sans-serif;">
  <div style="max-width:620px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#ffffff;padding:32px 40px;text-align:center;border-bottom:2px solid #ede9fe;">
      <img src="https://danzayarte.mudigital.com.ar/logo.png" alt="Danza y Arte" style="height:70px;width:auto;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;"/>
      <h1 style="color:#0f172a;margin:0 0 4px;font-size:22px;font-weight:800;">Danza y Arte - Agustina Spera</h1>
      <p style="color:#64748b;margin:0;font-size:13px;">Ensayo General — Teatro Astral</p>
    </div>
    <div style="background:#fff;padding:36px 40px;">
      <div style="margin-bottom:20px;">
        <span style="background:#ede9fe;color:#7c3aed;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 14px;border-radius:20px;">
          ${TITULO}
        </span>
      </div>
      <h2 style="color:#0f172a;font-size:18px;margin:0 0 20px;">✅ Autorización registrada</h2>
      <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:24px 28px;margin-bottom:28px;font-family:Georgia,serif;font-size:15px;line-height:2.2;color:#1e293b;">
        Autorizo a mi hijo/hija <strong>${alumno.nombre} ${alumno.apellido}</strong> con DNI <strong>${alumno.dni}</strong>,
        a concurrir al ensayo general en el <strong>${LUGAR}</strong>
        con la Escuela de Danza y Arte Agustina Spera. Ensayo a realizarse el <strong>${FECHA}</strong>.
        <br/><br/>
        <strong>Adulto responsable:</strong> <strong>${responsable.nombre} ${responsable.apellido}</strong>
        &nbsp;&nbsp;&nbsp;
        <strong>DNI:</strong> <strong>${responsable.dni}</strong>
      </div>
      <h3 style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Datos registrados</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="background:#f8fafc;">
          <td style="padding:11px 14px;font-weight:700;color:#64748b;width:160px;">Alumno/a</td>
          <td style="padding:11px 14px;color:#0f172a;">${alumno.nombre} ${alumno.apellido}</td>
        </tr>
        <tr>
          <td style="padding:11px 14px;font-weight:700;color:#64748b;">DNI alumno/a</td>
          <td style="padding:11px 14px;color:#0f172a;">${alumno.dni}</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:11px 14px;font-weight:700;color:#64748b;">Responsable</td>
          <td style="padding:11px 14px;color:#0f172a;">${responsable.nombre} ${responsable.apellido}</td>
        </tr>
        <tr>
          <td style="padding:11px 14px;font-weight:700;color:#64748b;">DNI responsable</td>
          <td style="padding:11px 14px;color:#0f172a;">${responsable.dni}</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:11px 14px;font-weight:700;color:#64748b;">Email</td>
          <td style="padding:11px 14px;color:#0f172a;">${responsable.email}</td>
        </tr>
        <tr>
          <td style="padding:11px 14px;font-weight:700;color:#64748b;">Ensayo</td>
          <td style="padding:11px 14px;color:#7c3aed;font-weight:700;">${FECHA} · ${LUGAR}</td>
        </tr>
      </table>
      <p style="margin-top:28px;padding-top:16px;border-top:1px solid #f1f5f9;font-size:12px;color:#94a3b8;">
        Se adjunta el PDF de la autorización. Este correo fue generado automáticamente por
        <strong>Danza y Arte - Agustina Spera</strong>. No responder a este mensaje.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function enviarEmailAutorizacionEnsayo(
  alumno: Persona,
  responsable: ResponsableE,
): Promise<{ skipped?: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email-ensayo] RESEND_API_KEY no configurada — mail no enviado.');
    return { skipped: true };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const MAIL_ESCUELA = process.env.MAIL_ESCUELA!;
    const MAIL_FROM    = process.env.MAIL_FROM!;
    const testMode     = process.env.TEST_MODE === 'true';
    const html         = buildEmailHTMLEnsayo(alumno, responsable);
    const subject      = `Autorización Ensayo General · ${alumno.nombre} ${alumno.apellido}`;
    const pdfBuffer    = await generarPDFEnsayo(alumno, responsable);
    const pdfName      = `autorizacion-ensayo-${alumno.apellido.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    const attachments  = [{ filename: pdfName, content: pdfBuffer }];

    await Promise.all([
      resend.emails.send({
        from:    MAIL_FROM,
        to:      testMode ? 'uriel.martinez.elias@gmail.com' : responsable.email,
        subject: testMode ? `[TEST] ${subject}` : subject,
        html,
        attachments,
      }),
      resend.emails.send({
        from:    MAIL_FROM,
        to:      testMode ? 'uriel.martinez.elias@gmail.com' : MAIL_ESCUELA,
        subject: `[Escuela${testMode ? ' TEST' : ''}] ${subject}`,
        html,
        attachments,
      }),
    ]);

    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[email-ensayo] Error enviando mail:', msg);
    return { error: msg };
  }
}
