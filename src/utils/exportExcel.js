import * as XLSX from 'xlsx';
import { formatDate } from './validation';

/**
 * Exports orders array to an Excel (.xlsx) file in ASCENDING order of Token Numbers (1, 2, 3...).
 * @param {Array} orders - List of order objects from Firestore
 * @param {string} customFilename - Optional custom file name
 */
export const exportOrdersToExcel = (orders, customFilename = 'harvest-festival-2026-biriyani-orders.xlsx') => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return false;
  }

  // Sort orders in ascending order of Token Numbers (1, 2, 3...)
  const sortedOrders = [...orders].sort((a, b) => (Number(a.tokenNumber) || 0) - (Number(b.tokenNumber) || 0));

  // Format dataset for Excel rows
  const formattedData = sortedOrders.map((order) => {
    let orderDateFormatted = order.orderDate || '2026-10-11';
    let orderTimeFormatted = 'N/A';
    let collectedAtFormatted = '-';

    if (order.createdAt) {
      let fullFormatted = formatDate(order.createdAt);
      const parts = fullFormatted.split(', ');
      if (parts.length >= 2) {
        orderTimeFormatted = parts[1];
      } else {
        orderTimeFormatted = fullFormatted;
      }
    }

    if (order.collectedAt) {
      collectedAtFormatted = formatDate(order.collectedAt);
    }

    let statusDisplay = order.collectionStatus === 'collected' ? 'Collected' : 'Pending';
    let paymentDisplay = '-';
    if (order.paymentMode) {
      paymentDisplay = order.paymentMode === 'gpay' ? 'GPay' : order.paymentMode === 'cash' ? 'Cash' : order.paymentMode;
    }

    return {
      'Token Number': order.tokenNumber || 0,
      'Name': order.name || '',
      'Phone Number': order.phone || '',
      'Biriyani Count': order.quantity || 0,
      'Price Per Biriyani': order.pricePerBiriyani || 180,
      'Total Amount': order.totalAmount || ((order.quantity || 0) * 180),
      'Order Date': orderDateFormatted,
      'Order Time': orderTimeFormatted,
      'Collection Status': statusDisplay,
      'Payment Mode': paymentDisplay,
      'Collected At': collectedAtFormatted,
      'Collected By Counter': order.collectedByCounter || '-',
      'Collection Remark': order.collectionRemark || ''
    };
  });

  // Create worksheet & workbook
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
  // Set column widths for clean presentation
  worksheet['!cols'] = [
    { wch: 14 }, // Token Number
    { wch: 24 }, // Name
    { wch: 16 }, // Phone Number
    { wch: 14 }, // Biriyani Count
    { wch: 18 }, // Price Per Biriyani
    { wch: 16 }, // Total Amount
    { wch: 14 }, // Order Date
    { wch: 16 }, // Order Time
    { wch: 18 }, // Collection Status
    { wch: 16 }, // Payment Mode
    { wch: 22 }, // Collected At
    { wch: 20 }, // Collected By Counter
    { wch: 30 }  // Collection Remark
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

  // Trigger Excel file download
  XLSX.writeFile(workbook, customFilename);
  return true;
};
