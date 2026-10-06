import { jsPDF } from 'jspdf';

/**
 * Renders the Indian Rupee symbol (₹) using clean vector lines alongside the amount string in jsPDF.
 */
function drawRupeeText(doc, amountStr, startX, y, fontSize, align = 'center') {
  const h = fontSize * 0.352778; // convert pt to mm
  const rWidth = h * 0.55;
  const gap = h * 0.12;
  
  doc.setFontSize(fontSize);
  const numWidth = doc.getTextWidth(amountStr);
  const totalWidth = rWidth + gap + numWidth;
  
  let x = startX;
  if (align === 'center') {
    x = startX - totalWidth / 2;
  } else if (align === 'right') {
    x = startX - totalWidth;
  }
  
  const strokeW = Math.max(0.2, h * 0.08);
  doc.setLineWidth(strokeW);
  doc.setDrawColor(15, 23, 42); // Dark slate
  
  const topY = y - h * 0.72;
  const midY = y - h * 0.48;
  const loopBotY = y - h * 0.26;
  const botY = y - h * 0.02;
  const stemX = x + rWidth * 0.22;
  
  // Vector strokes for Indian Rupee symbol (₹)
  doc.line(x, topY, x + rWidth, topY);
  doc.line(x, midY, x + rWidth * 0.82, midY);
  doc.line(stemX, topY, stemX, midY);
  doc.line(stemX, midY, x + rWidth * 0.72, (midY + loopBotY) / 2);
  doc.line(x + rWidth * 0.72, (midY + loopBotY) / 2, stemX, loopBotY);
  doc.line(stemX + strokeW * 0.5, loopBotY - h * 0.05, x + rWidth * 0.85, botY);
  
  // Render numeric amount text next to Rupee symbol
  doc.text(amountStr, x + rWidth + gap, y);
}

/**
 * Draws a single order tag on the PDF document canvas.
 */
function drawSingleTag(doc, order, tagX, tagY, tagWidth, tagHeight) {
  // Thin cutting guide border
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.25);
  doc.rect(tagX, tagY, tagWidth, tagHeight);

  const centerX = tagX + tagWidth / 2;

  // 1. Event Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('HARVEST FESTIVAL 2026', centerX, tagY + 5.5, { align: 'center' });

  // Organization
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(71, 85, 105);
  doc.text("ST. MARY'S YOUTH ASSOCIATION, KUNDARA", centerX, tagY + 8.5, { align: 'center' });

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('October 11, 2026', centerX, tagY + 11.2, { align: 'center' });

  // Upper Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(tagX + 4, tagY + 12.8, tagX + tagWidth - 4, tagY + 12.8);

  // 2. Order Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ORDER', centerX, tagY + 16.2, { align: 'center' });

  // 3. Token Number (#027) - LARGEST & MOST PROMINENT
  const tokenNum = Number(order.tokenNumber) || 0;
  const tokenStr = `#${String(tokenNum).padStart(3, '0')}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(tokenStr, centerX, tagY + 24.5, { align: 'center' });

  // Lower Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(tagX + 4, tagY + 27.2, tagX + tagWidth - 4, tagY + 27.2);

  // 4. Customer Name (handles long names safely)
  const name = order.name || 'Customer';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  
  const maxWidth = tagWidth - 8;
  let fontSize = 9;
  doc.setFontSize(fontSize);
  let textWidth = doc.getTextWidth(name);
  if (textWidth > maxWidth) {
    fontSize = 7.5;
    doc.setFontSize(fontSize);
  }
  
  const lines = doc.splitTextToSize(name, maxWidth);
  const nameY = lines.length > 1 ? tagY + 31.0 : tagY + 32.2;
  doc.text(lines, centerX, nameY, { align: 'center' });

  // 5. Biriyani Count
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const qty = Number(order.quantity) || 1;
  const biriyaniText = `BIRIYANI × ${qty}`;
  doc.text(biriyaniText, centerX, tagY + 39.2, { align: 'center' });

  // 6. Total Amount with ₹ symbol
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const totalAmt = Number(order.totalAmount) || (qty * 180);
  drawRupeeText(doc, String(totalAmt), centerX, tagY + 45.8, 10.5, 'center');
}

/**
 * Main export function: Generates and downloads the A4 Order Tags PDF.
 * 
 * @param {Array} orders - Array of order objects from Firebase
 * @param {string} exportType - 'all' | 'uncollected' | 'selected'
 */
export function generateOrderTagsPdf(orders, exportType = 'all') {
  if (!orders || orders.length === 0) {
    throw new Error('No orders available to generate order tags.');
  }

  // Always sort by tokenNumber ascending
  const sortedOrders = [...orders].sort((a, b) => (Number(a.tokenNumber) || 0) - (Number(b.tokenNumber) || 0));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const marginLeft = 10;
  const marginTop = 10;
  const gapX = 4;
  const gapY = 4;
  const tagWidth = (210 - 20 - (2 * gapX)) / 3; // ~60.66mm
  const tagHeight = 50; // 50mm height
  const tagsPerPage = 15; // 3 columns x 5 rows = 15 tags per page

  sortedOrders.forEach((order, index) => {
    if (index > 0 && index % tagsPerPage === 0) {
      doc.addPage();
    }

    const indexOnPage = index % tagsPerPage;
    const row = Math.floor(indexOnPage / 3);
    const col = indexOnPage % 3;

    const x = marginLeft + col * (tagWidth + gapX);
    const y = marginTop + row * (tagHeight + gapY);

    drawSingleTag(doc, order, x, y, tagWidth, tagHeight);
  });

  let fileName = 'Harvest_Festival_2026_Order_Tags.pdf';
  if (exportType === 'uncollected') {
    fileName = 'Harvest_Festival_2026_Uncollected_Order_Tags.pdf';
  } else if (exportType === 'selected') {
    fileName = 'Harvest_Festival_2026_Selected_Order_Tags.pdf';
  }

  doc.save(fileName);
  return true;
}
