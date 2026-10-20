import { brand } from '@/config/brand';

/** Gera um PDF DEMONSTRATIVO, sem validade jurídica, com marca d'água em todas as páginas. */
export async function downloadContractPdf(title: string, text: string, filename: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const M = 56;

  const frame = () => {
    doc.setFillColor(6, 27, 55);
    doc.rect(0, 0, W, 64, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold').setFontSize(13).text(brand.name, M, 38);
    const nameW = doc.getTextWidth(brand.name);
    doc.setTextColor(222, 173, 91);
    doc.setFont('helvetica', 'normal').setFontSize(9).text(brand.tagline.toUpperCase(), M + nameW + 12, 38);
    doc.setTextColor(232, 220, 196);
    doc.setFont('helvetica', 'bold').setFontSize(54);
    doc.text('DEMONSTRATIVO', W / 2, H / 2, { align: 'center', angle: 35 });
    doc.setTextColor(155, 101, 11);
    doc.setFont('helvetica', 'bold').setFontSize(8);
    doc.text('DOCUMENTO DEMONSTRATIVO — SEM VALIDADE JURÍDICA — NÃO ASSINAR', W / 2, H - 28, { align: 'center' });
  };

  frame();
  doc.setTextColor(6, 27, 55);
  doc.setFont('helvetica', 'bold').setFontSize(15).text(title, M, 104);
  doc.setFont('helvetica', 'normal').setFontSize(10.5);
  const lines = doc.splitTextToSize(text, W - M * 2) as string[];
  let y = 136;
  for (const line of lines) {
    if (y > H - 64) { doc.addPage(); frame(); doc.setTextColor(6, 27, 55); doc.setFont('helvetica', 'normal').setFontSize(10.5); y = 100; }
    doc.text(line, M, y);
    y += 15;
  }
  doc.save(filename);
}
