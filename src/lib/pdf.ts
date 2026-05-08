import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, Client, Product } from '../store/useStore';
import { formatCurrency } from './format';

export const generateMultipleStickerLabels = (products: Product[]) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [50, 25]
  });

  products.forEach((product, index) => {
    if (index > 0) doc.addPage();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('MUNDO OUTLET', 25, 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    const name = `${product.brand} - ${product.model}`.substring(0, 35);
    doc.text(name, 25, 8, { align: 'center' });

    doc.rect(3, 10, 44, 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`SKU: ${product.sku}`, 25, 13.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`ESTADO:`, 3, 19);
    doc.line(13, 19, 47, 19);

    doc.text(`NOTAS:`, 3, 23);
    doc.line(12, 23, 47, 23);
  });

  doc.autoPrint();
  const pdfBlobUrl = doc.output('bloburl');
  window.open(pdfBlobUrl, '_blank');
};
export const generateStickerLabel = (product: Product) => {
  generateMultipleStickerLabels([product]);
};

export const generateSalePDF = (sale: Sale, client?: Client, openInNewWindow: boolean = true) => {
  const doc = new jsPDF();

  // Branding - Header
  // doc.setFillColor(10, 17, 30); Very dark blue/slate
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MUNDO OUTLET', 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Recibo de Venta Oficial', 210 - 14, 25, { align: 'right' });

  // Sale Details (left side)
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Detalles del Recibo:', 14, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(`ID Recibo:`, 14, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${sale.id.slice(0, 8).toUpperCase()}`, 40, 62);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Fecha:`, 14, 68);
  doc.setFont('helvetica', 'normal');
  doc.text(`${new Date(sale.date).toLocaleDateString('es-AR')}`, 40, 68);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Pago:`, 14, 74);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sale.paymentMethod || 'No especificado'}`, 40, 74);

  // Client Details (right side)
  if (client) {
    doc.setFont('helvetica', 'normal');
    doc.text('Facturar a:', 120, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(`Cliente:`, 120, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(`${client.name}`, 140, 62);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Tipo:`, 120, 68);
    doc.setFont('helvetica', 'normal');
    doc.text(`${client.type}`, 140, 68);
    
    if (client.phone) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Tel:`, 120, 74);
      doc.setFont('helvetica', 'normal');
      doc.text(`${client.phone}`, 140, 74);
    }
  }

  // Items Table
  const tableData = sale.items.map(item => [
    item.quantity,
    item.name,
    item.serie || '-',
    formatCurrency(item.price, false),
    formatCurrency(item.quantity * item.price, false)
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Cant.', 'Descripción', 'Serie/Lote', 'P. Unitario', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [10, 17, 30],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 40 },
      4: { halign: 'right', cellWidth: 40 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Shipping
  if (sale.shippingCost > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Costo de Envío:', 130, finalY);
    doc.text(formatCurrency(sale.shippingCost, false), 196, finalY, { align: 'right' });
  }

  // Total
  doc.setFillColor(240, 245, 250);
  doc.rect(120, finalY + 5, 80, 12, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 130, finalY + 13);
  doc.text(formatCurrency(sale.total, false), 196, finalY + 13, { align: 'right' });

  // Footer Message
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('¡Gracias por su compra en Mundo Outlet!', 105, 280, { align: 'center' });
  doc.text('Para cualquier reclamo, es necesario presentar este recibo.', 105, 285, { align: 'center' });

  if (openInNewWindow) {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Recibo_${sale.id.slice(0, 8)}.pdf`);
  }
};

export const generateThermalTicket = (data: {
  title: string;
  code: string;
  client?: string;
  status: string;
  date: string;
  details?: string;
}) => {
  // 80mm width is approximately 226 points in jsPDF (72 points per inch)
  // We'll use 80mm x 100mm as a base, it can grow as needed
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 100]
  });

  const margin = 5;
  const width = 70;
  let y = 10;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MUNDO OUTLET', 40, y, { align: 'center' });
  y += 6;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.title.toUpperCase(), 40, y, { align: 'center' });
  y += 8;

  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + width, y);
  y += 8;

  // Code / SKU (Big)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CÓDIGO/ID:', margin, y);
  y += 6;
  doc.setFontSize(16);
  doc.text(data.code, 40, y, { align: 'center' });
  y += 10;

  // Info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.client || 'STOCK INTERNO', 25, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.status, 25, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.date, 25, y);
  y += 8;

  if (data.details) {
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    // Auto-wrap text
    const splitDetails = doc.splitTextToSize(data.details, width);
    doc.text(splitDetails, margin, y);
    y += splitDetails.length * 4;
  }

  y += 5;
  doc.line(margin, y, margin + width, y);
  y += 8;

  doc.setFontSize(7);
  doc.text('GENERADO POR MUNDO OUTLET ERP', 40, y, { align: 'center' });

  window.open(doc.output('bloburl'), '_blank');
};
