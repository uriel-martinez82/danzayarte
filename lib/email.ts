import { Alumno, Responsable } from '@/types';

const FECHAS  = { 1: '28 de Noviembre', 2: '06 de Diciembre' } as const;
const TITULOS = { 1: 'Show 28 de Noviembre', 2: 'Show 6 de Diciembre' } as const;

async function logoBuffer(): Promise<Buffer> {
  const res = await fetch('https://danzayarte.mudigital.com.ar/logo.png');
  return Buffer.from(await res.arrayBuffer());
}

async function generarPDF(alumno: Alumno, responsable: Responsable, numero: 1 | 2): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Logo centrado
    try {
      doc.image(await logoBuffer(), (595 - 80) / 2, 60, { fit: [80, 80] });
      doc.moveDown(4.5);
    } catch { doc.moveDown(1); }

    // Nombre escuela
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#3730a3')
       .text('Danza y Arte - Agustina Spera', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#64748b')
       .text('Show de Fin de Año — Teatro Astral', { align: 'center' });
    doc.moveDown(0.6);

    // Línea separadora
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(1);

    // Badge / título del show
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#3730a3')
       .text(TITULOS[numero].toUpperCase(), { align: 'center' });
    doc.moveDown(1.2);

    // Texto de la autorización
    doc.fillColor('#1e293b').fontSize(14).font('Helvetica')
       .text('Autorizo a mi hija ', { continued: true })
       .font('Helvetica-Bold').text(`${alumno.nombre} ${alumno.apellido}`, { continued: true })
       .font('Helvetica').text(' con DNI ', { continued: true })
       .font('Helvetica-Bold').text(alumno.dni, { continued: true })
       .font('Helvetica').text(', a participar del show de fin de año en el ', { continued: true })
       .font('Helvetica-Bold').text('Teatro Astral (Av. Corrientes 1639)', { continued: true })
       .font('Helvetica').text(', el día ', { continued: true })
       .font('Helvetica-Bold').text(`${FECHAS[numero]}.`);

    doc.moveDown(1.2);

    doc.font('Helvetica').text('Adulto responsable: ', { continued: true })
       .font('Helvetica-Bold').text(`${responsable.nombre} ${responsable.apellido}`);
    doc.font('Helvetica').text('DNI: ', { continued: true })
       .font('Helvetica-Bold').text(responsable.dni);

    doc.moveDown(3);

    // Línea de firma
    const sigY = doc.y;
    doc.moveTo(60, sigY).lineTo(280, sigY).strokeColor('#94a3b8').lineWidth(1).stroke();
    doc.fontSize(11).font('Helvetica').fillColor('#64748b')
       .text('Firma del adulto responsable', 60, sigY + 8, { width: 220, align: 'center' });

    doc.moveDown(5);

    // Footer
    doc.fontSize(10).fillColor('#94a3b8')
       .text(
         'Este documento fue generado automáticamente por el sistema de autorizaciones de Danza y Arte - Agustina Spera.',
         { align: 'center' }
       );

    doc.end();
  });
}

function buildEmailHTML(alumno: Alumno, responsable: Responsable, numero: 1 | 2): string {
  const fecha  = FECHAS[numero];
  const titulo = TITULOS[numero];

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><title>Autorización ${titulo}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">

  <div style="max-width:620px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:#ffffff;padding:32px 40px;text-align:center;border-bottom:2px solid #e0e7ff;">
      <img src="https://danzayarte.mudigital.com.ar/logo.png" alt="Danza y Arte" style="height:70px;width:auto;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;"/>
      <h1 style="color:#0f172a;margin:0 0 4px;font-size:22px;font-weight:800;">Danza y Arte - Agustina Spera</h1>
      <p style="color:#64748b;margin:0;font-size:13px;">Show de Fin de Año — Teatro Astral</p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:36px 40px;">

      <div style="margin-bottom:20px;">
        <span style="background:#e0e7ff;color:#3730a3;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 14px;border-radius:20px;">
          ${titulo}
        </span>
      </div>

      <h2 style="color:#0f172a;font-size:18px;margin:0 0 20px;">✅ Autorización registrada</h2>

      <!-- Texto de la autorización -->
      <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:24px 28px;margin-bottom:28px;font-family:Georgia,serif;font-size:15px;line-height:2.2;color:#1e293b;">
        Autorizo a mi hija <strong>${alumno.nombre} ${alumno.apellido}</strong> con DNI <strong>${alumno.dni}</strong>,
        a participar del show de fin de año en el <strong>Teatro Astral (Av. Corrientes 1639)</strong>,
        el día <strong>${fecha}</strong>.
        <br/><br/>
        <strong>Adulto responsable:</strong> <strong>${responsable.nombre} ${responsable.apellido}</strong>
        &nbsp;&nbsp;&nbsp;
        <strong>DNI:</strong> <strong>${responsable.dni}</strong>
      </div>

      <!-- Tabla de datos -->
      <h3 style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Datos registrados</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="background:#f8fafc;">
          <td style="padding:11px 14px;font-weight:700;color:#64748b;width:160px;">Alumna</td>
          <td style="padding:11px 14px;color:#0f172a;">${alumno.nombre} ${alumno.apellido}</td>
        </tr>
        <tr>
          <td style="padding:11px 14px;font-weight:700;color:#64748b;">DNI alumna</td>
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
          <td style="padding:11px 14px;font-weight:700;color:#64748b;">Show</td>
          <td style="padding:11px 14px;color:#3730a3;font-weight:700;">${titulo} · ${fecha}</td>
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

export async function enviarEmailAutorizacion(
  alumno: Alumno,
  responsable: Responsable,
  numero: number
): Promise<{ skipped?: boolean; error?: string }> {

  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada — mail no enviado.');
    return { skipped: true };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const MAIL_ESCUELA = process.env.MAIL_ESCUELA!;
    const MAIL_FROM    = process.env.MAIL_FROM!;
    const n            = numero as 1 | 2;
    const html         = buildEmailHTML(alumno, responsable, n);
    const subject      = `Autorización — ${n === 1 ? 'Show 28 de Noviembre' : 'Show 6 de Diciembre'} · ${alumno.nombre} ${alumno.apellido}`;
    const pdfBuffer    = await generarPDF(alumno, responsable, n);
    const pdfName      = `autorizacion-${n === 1 ? 'show-28nov' : 'show-6dic'}-${alumno.apellido.toLowerCase().replace(/\s+/g, '-')}.pdf`;

    const attachments = [{ filename: pdfName, content: pdfBuffer }];

    await Promise.all([
      resend.emails.send({ from: MAIL_FROM, to: responsable.email, subject, html, attachments }),
      resend.emails.send({ from: MAIL_FROM, to: [MAIL_ESCUELA, 'uriel.martinez.elias@gmail.com'], subject: `[Escuela] ${subject}`, html, attachments }),
    ]);

    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[email] Error enviando mail:', msg);
    return { error: msg };
  }
}
