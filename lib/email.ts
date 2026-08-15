import { Alumno, Responsable } from '@/types';

function buildEmailHTML(alumno: Alumno, responsable: Responsable, numero: number): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8" /><title>Autorización ${numero}</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
      <h2 style="color: #3730a3;">✅ Autorización registrada — ${numero === 1 ? 'Show 28 de Noviembre' : 'Show 6 de Diciembre'}</h2>
      <p>Se ha completado exitosamente la autorización con los siguientes datos:</p>

      <h3 style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">👤 Alumna</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px; font-weight:bold; width:160px;">Nombre completo</td><td>${alumno.nombre} ${alumno.apellido}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:6px; font-weight:bold;">DNI</td><td>${alumno.dni}</td></tr>
      </table>

      <h3 style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 20px;">👨‍👩‍👧 Adulto responsable</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px; font-weight:bold; width:160px;">Nombre completo</td><td>${responsable.nombre} ${responsable.apellido}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:6px; font-weight:bold;">DNI</td><td>${responsable.dni}</td></tr>
        <tr><td style="padding:6px; font-weight:bold;">Email</td><td>${responsable.email}</td></tr>
      </table>

      <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
        Este correo fue generado automáticamente. No responder a este mensaje.
      </p>
    </body>
    </html>
  `;
}

export async function enviarEmailAutorizacion(
  alumno: Alumno,
  responsable: Responsable,
  numero: number
): Promise<{ skipped?: boolean; error?: string }> {

  // Si no hay API key configurada, saltar silenciosamente
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada — mail no enviado.');
    return { skipped: true };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const MAIL_ESCUELA = process.env.MAIL_ESCUELA!;
    const MAIL_FROM    = process.env.MAIL_FROM!;
    const html         = buildEmailHTML(alumno, responsable, numero);
    const subject      = `Autorización — ${numero === 1 ? 'Show 28 de Noviembre' : 'Show 6 de Diciembre'} · ${alumno.nombre} ${alumno.apellido}`;

    await Promise.all([
      resend.emails.send({ from: MAIL_FROM, to: responsable.email, subject, html }),
      resend.emails.send({ from: MAIL_FROM, to: [MAIL_ESCUELA, 'uriel.martinez.elias@gmail.com'], subject: `[Escuela] ${subject}`, html }),
    ]);

    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[email] Error enviando mail:', msg);
    return { error: msg };
  }
}