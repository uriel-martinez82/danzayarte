import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const alumno_nombre        = searchParams.get('alumno_nombre') ?? '';
  const alumno_apellido      = searchParams.get('alumno_apellido') ?? '';
  const alumno_dni           = searchParams.get('alumno_dni') ?? '';
  const responsable_nombre   = searchParams.get('responsable_nombre') ?? '';
  const responsable_apellido = searchParams.get('responsable_apellido') ?? '';
  const responsable_dni      = searchParams.get('responsable_dni') ?? '';

  try {
    const PDFDocument = (await import('pdfkit')).default;

    let logo: Buffer | null = null;
    try {
      const res = await fetch('https://danzayarte.mudigital.com.ar/logo.png');
      logo = Buffer.from(await res.arrayBuffer());
    } catch { /* sin logo */ }

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      if (logo) {
        try { doc.image(logo, (595 - 80) / 2, 60, { fit: [80, 80] }); doc.moveDown(4.5); }
        catch { doc.moveDown(1); }
      } else {
        doc.moveDown(1);
      }

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
         .font('Helvetica-Bold').text(`${alumno_nombre} ${alumno_apellido}`, { continued: true })
         .font('Helvetica').text(' con DNI ', { continued: true })
         .font('Helvetica-Bold').text(alumno_dni, { continued: true })
         .font('Helvetica').text(', a concurrir al ensayo general en el ', { continued: true })
         .font('Helvetica-Bold').text('Teatro Astral (Av. Corrientes 1639)', { continued: true })
         .font('Helvetica').text(' con la Escuela de Danza y Arte Agustina Spera. Ensayo a realizarse el ', { continued: true })
         .font('Helvetica-Bold').text('14 y/o 15 de noviembre del 2026.');

      doc.moveDown(1.2);
      doc.font('Helvetica').text('Adulto responsable: ', { continued: true })
         .font('Helvetica-Bold').text(`${responsable_nombre} ${responsable_apellido}`);
      doc.font('Helvetica').text('DNI: ', { continued: true })
         .font('Helvetica-Bold').text(responsable_dni);

      doc.moveDown(4);
      doc.fontSize(10).fillColor('#94a3b8')
         .text('Documento generado automáticamente — Danza y Arte - Agustina Spera.', { align: 'center' });

      doc.end();
    });

    const filename = `autorizacion-ensayo-${alumno_apellido.toLowerCase().replace(/\s+/g, '-') || 'alumno'}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generando PDF';
    console.error('[PDF ensayo]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
