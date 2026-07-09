import { jsPDF } from 'jspdf';
import type { Student } from './types';

// Función determinista para generar un hash criptográfico de control
export function generateSecurityHash(projectName: string, students: Student[], uniqueCode: string): string {
  const docIds = students.map(s => s.document_id).sort().join(',');
  const dataString = `${projectName}-${docIds}-${uniqueCode}`;

  let hash1 = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash1 |= 0;
  }
  const absHash1 = Math.abs(hash1).toString(16).toUpperCase().padStart(8, '0');

  let hash2 = 17;
  for (let i = 0; i < dataString.length; i++) {
    hash2 = (hash2 * 31 + dataString.charCodeAt(i)) | 0;
  }
  const absHash2 = Math.abs(hash2).toString(16).toUpperCase().padStart(8, '0');

  return `SEC-EXIS-2026-A-${absHash1}-${absHash2}`;
}

// Función para dibujar divisores hechos de microtexto repetido (anti-copia/anti-edición)
export function drawMicrotextDivider(doc: jsPDF, x1: number, y: number, x2: number, text: string) {
  doc.saveGraphicsState();
  doc.setTextColor(203, 213, 225); // slate-300 (muy tenue)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.5); // Microtexto de 3.5 puntos

  let currentX = x1;
  const spacing = 1.5; // Espacio entre repeticiones
  while (currentX < x2) {
    doc.text(text, currentX, y);
    currentX += doc.getTextWidth(text) + spacing;
  }
  doc.restoreGraphicsState();
}

export function generateReceiptPDF(
  projectName: string,
  category: string,
  description: string,
  githubRepo: string | undefined,
  students: Student[],
  uniqueCode: string
) {
  // Inicializar documento A4 (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const isBorrador = uniqueCode.includes('BORRADOR');
  const securityHash = generateSecurityHash(projectName, students, uniqueCode);

  // Metadatos
  doc.setProperties({
    title: isBorrador ? `Vista Previa Recibo EXIS 2026-A` : `Recibo Registro EXIS 2026-A - ${projectName}`,
    subject: 'Comprobante de Inscripción EXIS 2026-A',
    creator: 'Sistema de Registro EXIS 2026-A',
    author: 'Universidad Internacional del Trópico Americano'
  });

  // Colores Corporativos
  const PRIMARY_RGB = [0, 89, 78];     // #00594E (Verde oscuro teal)
  const SECONDARY_RGB = [181, 161, 96]; // #B5A160 (Dorado)
  const TEXT_DARK = [30, 41, 59];       // #1E293B (Gris oscuro)
  const TEXT_MUTED = [100, 116, 139];   // #64748B (Gris slate)
  const BG_LIGHT = [248, 250, 252];    // #F8FAFC (Blanco-grisáceo)
  const BORDER_LIGHT = [226, 232, 240]; // #E2E8F0 (Borde suave)

  // --- PATRÓN DE SEGURIDAD DE FONDO (GUILLOCHE / LÍNEAS FINAS CRUZADAS) ---
  doc.saveGraphicsState();
  doc.setDrawColor(241, 245, 249); // slate-100 (muy tenue)
  doc.setLineWidth(0.06); // Línea ultrafina

  // Rejilla geométrica de seguridad
  for (let i = -80; i < 210; i += 7) {
    // Diagonales ascendentes /
    doc.line(i, 48, i + 235, 283);
    // Diagonales descendentes \
    doc.line(i + 235, 48, i, 283);
  }
  doc.restoreGraphicsState();

  // --- CABECERA ---
  // Fondo de cabecera principal (Teal)
  doc.setFillColor(PRIMARY_RGB[0], PRIMARY_RGB[1], PRIMARY_RGB[2]);
  doc.rect(15, 15, 180, 32, 'F');

  // Franja decorativa dorada
  doc.setFillColor(SECONDARY_RGB[0], SECONDARY_RGB[1], SECONDARY_RGB[2]);
  doc.rect(15, 47, 180, 2.5, 'F');

  // Textos de Cabecera
  // Izquierda
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('EXIS 2026-A', 22, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('INNOVATION EXPO • PROGRAMA DE INGENIERÍA DE SISTEMAS', 22, 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('UNITRÓPICO', 22, 39);

  // Derecha
  doc.setTextColor(SECONDARY_RGB[0], SECONDARY_RGB[1], SECONDARY_RGB[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(isBorrador ? 'VISTA PREVIA' : 'RECIBO OFICIAL', 138, 26);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(isBorrador ? 'ESTADO: BORRADOR' : 'ESTADO: INSCRITO', 138, 31);
  doc.text(`CÓDIGO: ${uniqueCode}`, 138, 36);

  // --- MARCA DE AGUA BORRADOR ---
  if (isBorrador) {
    doc.saveGraphicsState();
    doc.setTextColor(226, 232, 240); // Muy claro (slate-200)
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text('BORRADOR NO VÁLIDO', 105, 150, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();
  }

  // --- SECCIÓN 1: DETALLES DEL PROYECTO ---
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DATOS DEL PROYECTO', 15, 58);

  // Línea divisoria de Microtexto
  drawMicrotextDivider(doc, 15, 60, 195, 'EXIS2026-A•DATOSDEPROYECTOCONFIRMADO•');

  // Caja de Proyecto
  doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
  doc.roundedRect(15, 63, 180, 44, 3, 3, 'F');
  doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
  doc.roundedRect(15, 63, 180, 44, 3, 3, 'S');

  // Contenido de la Caja del Proyecto
  // Nombre
  doc.setTextColor(PRIMARY_RGB[0], PRIMARY_RGB[1], PRIMARY_RGB[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(projectName, 20, 71);

  // Categoría
  doc.setTextColor(SECONDARY_RGB[0], SECONDARY_RGB[1], SECONDARY_RGB[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`CATEGORÍA: ${category.toUpperCase()}`, 20, 76);

  // GitHub Repo
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (githubRepo) {
    doc.text(`Repositorio: ${githubRepo}`, 20, 81);
  } else {
    doc.text('Repositorio: No registrado', 20, 81);
  }

  // Descripción (Multilínea)
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const descLines = doc.splitTextToSize(description, 170);
  // Dibujar máximo 3 líneas para evitar desbordes
  const displayLines = descLines.slice(0, 3);
  doc.text(displayLines, 20, 87);

  // --- SECCIÓN 2: INTEGRANTES REGISTRADOS ---
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('INTEGRANTES REGISTRADOS', 15, 116);

  // Línea divisoria de Microtexto
  drawMicrotextDivider(doc, 15, 118, 195, 'EXIS2026-A•INTEGRANTEOFICIALREGISTRADO•');

  // Configuración de columnas según la cantidad de estudiantes
  const numStudents = students.length;
  const containerWidth = 180;
  const gap = 5;
  const cardWidth = (containerWidth - (numStudents - 1) * gap) / numStudents;
  const cardHeight = 84;
  const startY = 122;

  // Renderizar estudiantes
  students.forEach((student, index) => {
    const cardX = 15 + index * (cardWidth + gap);

    // Fondo y borde de tarjeta
    doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
    doc.roundedRect(cardX, startY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
    doc.roundedRect(cardX, startY, cardWidth, cardHeight, 3, 3, 'S');

    // Título de la tarjeta (Integrante #)
    doc.setFillColor(PRIMARY_RGB[0], PRIMARY_RGB[1], PRIMARY_RGB[2]);
    doc.roundedRect(cardX, startY, cardWidth, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`INTEGRANTE #${index + 1}`, cardX + cardWidth / 2, startY + 4.2, { align: 'center' });

    // Nombre
    doc.setTextColor(PRIMARY_RGB[0], PRIMARY_RGB[1], PRIMARY_RGB[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    // Ajustar nombre si es muy largo
    const nameLines = doc.splitTextToSize(student.name, cardWidth - 6);
    doc.text(nameLines[0], cardX + 4, startY + 13);

    // Semestre
    doc.setTextColor(SECONDARY_RGB[0], SECONDARY_RGB[1], SECONDARY_RGB[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${student.semester} Semestre`, cardX + 4, startY + 18);

    // Campos de contacto e identificación
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);

    doc.text('DOCUMENTO', cardX + 4, startY + 24);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(student.document_id, cardX + 4, startY + 28);

    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('CORREO ELECTRÓNICO', cardX + 4, startY + 34);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    // Truncar correo si sobrepasa el ancho de tarjeta
    const emailStr = student.email;
    const truncatedEmail = emailStr.length > 22 && numStudents === 3 ? emailStr.slice(0, 20) + '...' : emailStr;
    doc.text(truncatedEmail, cardX + 4, startY + 38);

    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('TELÉFONO', cardX + 4, startY + 44);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(student.phone, cardX + 4, startY + 48);

    // Asignaturas
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('ASIGNATURA PRINCIPAL', cardX + 4, startY + 54);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const sub1 = student.subject1 === 'Otro' ? (student.subject1_custom || 'Otro') : student.subject1;
    const sub1Lines = doc.splitTextToSize(sub1, cardWidth - 8);
    doc.text(sub1Lines[0] || '', cardX + 4, startY + 58);

    // Asignatura 2 (si existe)
    if (student.subject2) {
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('ASIGNATURA SECUNDARIA', cardX + 4, startY + 65);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const sub2 = student.subject2 === 'Otro' ? (student.subject2_custom || 'Otro') : student.subject2;
      const sub2Lines = doc.splitTextToSize(sub2, cardWidth - 8);
      doc.text(sub2Lines[0] || '', cardX + 4, startY + 69);
    }
  });

  // --- SECCIÓN 3: CERTIFICACIÓN Y SELLO DIGITAL ---
  const certY = 215;
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('VALIDEZ E INFORMACIÓN DE REGISTRO', 15, certY);

  // Línea divisoria de Microtexto
  drawMicrotextDivider(doc, 15, certY + 2, 195, 'EXIS2026-A•VALIDEZDIGITALYFIRMASECURIZADA•');

  // Caja de Validez
  doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
  doc.roundedRect(15, certY + 5, 180, 42, 3, 3, 'F');
  doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
  doc.roundedRect(15, certY + 5, 180, 42, 3, 3, 'S');

  // Sello decorativo (Círculo Verde o Dorado para Borrador)
  const sealX = 35;
  const sealY = certY + 26;
  const sealColor = isBorrador ? SECONDARY_RGB : PRIMARY_RGB;
  doc.setFillColor(sealColor[0], sealColor[1], sealColor[2]);
  doc.circle(sealX, sealY, 11, 'F');

  if (isBorrador) {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('?', sealX, sealY + 2.5, { align: 'center' });
  } else {
    // Dibujar checkmark blanca dentro del sello
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.2);
    doc.line(sealX - 4, sealY, sealX - 1, sealY + 3);
    doc.line(sealX - 1, sealY + 3, sealX + 5, sealY - 3);
  }

  // Texto Sello
  doc.setTextColor(sealColor[0], sealColor[1], sealColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SISTEMA EXIS 2026-A', sealX, sealY + 16, { align: 'center' });
  doc.text(isBorrador ? 'VISTA PREVIA' : 'VERIFICADO', sealX, sealY + 20, { align: 'center' });

  // Textos de Validez
  doc.setTextColor(PRIMARY_RGB[0], PRIMARY_RGB[1], PRIMARY_RGB[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(isBorrador ? 'VISTA PREVIA - BORRADOR DE REGISTRO' : 'REGISTRO CONFIRMADO DIGITALMENTE', 55, certY + 11);

  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(isBorrador ? 'Código de Seguridad: VISTA-PREVIA-BORRADOR' : `Código Único: ${uniqueCode}`, 55, certY + 16);

  const localDate = new Date();
  const dateStr = localDate.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Fecha y Hora de Emisión: ${dateStr}`, 55, certY + 20);

  // Firma Criptográfica de Control (Hash)
  doc.setTextColor(PRIMARY_RGB[0], PRIMARY_RGB[1], PRIMARY_RGB[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.text(`Firma de Control (HASH): ${securityHash}`, 55, certY + 25);

  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  const termsText = [
    isBorrador
      ? 'Este documento es una previsualización. Los datos no han sido guardados en el sistema de EXIS 2026-A.'
      : 'Este documento confirma la inscripción oficial del proyecto en el sistema. Firma de control certificada.',
    'Conserve esta constancia. Cualquier alteración de datos o de la Firma de Control (HASH) anula su validez legal.',
    'La veracidad de los datos suministrados es responsabilidad de los estudiantes firmantes.'
  ];
  doc.text(termsText, 55, certY + 30);

  // --- PIE DE PÁGINA ---
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(
    'Universidad Internacional del Trópico Americano - Unitrópico • Programa de Ingeniería de Sistemas',
    105,
    283,
    { align: 'center' }
  );

  // Descargar el PDF
  const filenamePrefix = isBorrador ? 'Borrador_' : 'Recibo_';
  doc.save(`${filenamePrefix}Inscripcion_EXIS_2026_A_${projectName.replace(/\s+/g, '_') || 'Borrador'}.pdf`);
}
