import * as XLSX from 'xlsx';
import { formatDate } from './validation';

/**
 * Exports orders array to an Excel (.xlsx) file.
 * @param {Array} orders - List of order objects from Firestore
 */
export const exportOrdersToExcel = (orders) => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return false;
  }

  // Format dataset for Excel rows
  const formattedData = orders.map((order) => {
    let orderDateFormatted = order.orderDate || '2026-10-11';
    let orderTimeFormatted = 'N/A';

    if (order.createdAt) {
      let fullFormatted = formatDate(order.createdAt);
      // Example: "11 Oct 2026, 02:30 PM"
      const parts = fullFormatted.split(', ');
      if (parts.length >= 2) {
        orderTimeFormatted = parts[1];
      } else {
        orderTimeFormatted = fullFormatted;
      }
    }

    return {
      'Token Number': order.tokenNumber || 0,
      'Name': order.name || '',
      'Phone Number': order.phone || '',
      'Biriyani Count': order.quantity || 0,
      'Price Per Biriyani': order.pricePerBiriyani || 180,
      'Total Amount': order.totalAmount || ((order.quantity || 0) * 180),
      'Order Date': orderDateFormatted,
      'Order Time': orderTimeFormatted
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
    { wch: 16 }  // Order Time
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

  // Trigger Excel file download
  const filename = 'harvest-festival-2026-biriyani-orders.xlsx';
  XLSX.writeFile(workbook, filename);
  return true;
};
