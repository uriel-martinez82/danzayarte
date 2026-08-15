import { Resend } from 'resend';
import { Alumno, Responsable } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

const MAIL_ESCUELA = process.env.MAIL_ESCUELA!; // ej: secretaria@escuela.edu.ar
const MAIL_FROM    = process.env.MAIL_FROM!;    // ej: noreply@tudominio.com

function buildEmailHTML(alumno: Alumno, responsable: Responsable, numero: number): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8" /><title>Autorización ${numero}</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
      <h2 style="color: #1a56db;">✅ Autorización N° ${numero} registrada</h2>
      <p>Se ha completado exitosamente la <strong>Autorización N° ${numero}</strong> con los siguientes datos:</p>

      <h3 style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">👤 Datos del Alumno</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px; font-weight:bold; width:140px;">Nombre completo</td><td>${alumno.nombre} ${alumno.apellido}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:6px; font-weight:bold;">DNI</td><td>${alumno.dni}</td></tr>
      </table>

      <h3 style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 20px;">👨‍👩‍👧 Datos del Responsable</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px; font-weight:bold; width:140px;">Nombre completo</td><td>${responsable.nombre} ${responsable.apellido}</td></tr>
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
) {
  const html = buildEmailHTML(alumno, responsable, numero);
  const subject = `Autorización N° ${numero} - ${alumno.nombre} ${alumno.apellido}`;

  // Enviar al responsable y a la escuela en paralelo
  const [mailResponsable, mailEscuela] = await Promise.all([
    resend.emails.send({
      from: MAIL_FROM,
      to: responsable.email,
      subject,
      html,
    }),
    resend.emails.send({
      from: MAIL_FROM,
      to: MAIL_ESCUELA,
      subject: `[Escuela] ${subject}`,
      html,
    }),
  ]);

  return { mailResponsable, mailEscuela };
}
