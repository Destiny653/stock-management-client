import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

/**
 * Export data to CSV format
 */
export const exportToCSV = (headers: string[], data: any[][], filename: string) => {
    const csvContent = [
        headers.join(','),
        ...data.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export data to Excel format
 */
export const exportToExcel = (headers: string[], data: any[][], filename: string) => {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export data to PDF format
 */
export const exportToPDF = (headers: string[], data: any[][], filename: string, title?: string) => {
    const doc = new jsPDF();

    // Add title if provided
    if (title) {
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    }

    // @ts-ignore - autoTable is added by the plugin
    doc.autoTable({
        head: [headers],
        body: data,
        startY: title ? 40 : 20,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`${filename}.pdf`);
};
