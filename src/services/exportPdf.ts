import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MemberWeeklyRow, Expense, SummaryData } from '../types';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const exportToPdf = (
  year: number,
  month: number,
  summary: SummaryData,
  matrix: MemberWeeklyRow[],
  expenses: Expense[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const monthName = MONTH_NAMES[month - 1];
  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  // Top Header Banner
  doc.setFillColor(22, 163, 74); // Emerald 600
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KAS KONTRAKAN', 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${monthName} ${year}`, 14, 18);
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, 196, 18, { align: 'right' });

  // Reset text color
  doc.setTextColor(30, 41, 59);

  // Financial Summary Cards
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN KAS', 14, 34);

  // Box 1: Pemasukan
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(34, 197, 94); // green-500
  doc.roundedRect(14, 37, 42, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(21, 128, 61);
  doc.text('Pemasukan', 16, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRp(summary.monthlyIncome), 16, 51);

  // Box 2: Pengeluaran
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(239, 68, 68); // red-500
  doc.roundedRect(60, 37, 42, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(185, 28, 28);
  doc.text('Pengeluaran', 62, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRp(summary.monthlyExpense), 62, 51);

  // Box 3: Sisa Saldo
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(59, 130, 246); // blue-500
  doc.roundedRect(106, 37, 44, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(29, 78, 216);
  doc.text('Sisa Saldo', 108, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRp(summary.currentBalance), 108, 51);

  // Box 4: Martabak Target
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.roundedRect(154, 37, 42, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 83, 9);
  doc.text('Target Martabak', 156, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(summary.martabak.isReady ? `Siap Beli! (${summary.martabak.portions}x)` : `${summary.martabak.progress}%`, 156, 51);

  // Section 1: Member Contribution Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('1. IURAN KAS', 14, 65);

  const memberTableRows = matrix.map((row, idx) => {
    let total = 0;
    const w1 = row.weeks[1]?.is_paid ? 'Lunas' : 'Belum';
    const w2 = row.weeks[2]?.is_paid ? 'Lunas' : 'Belum';
    const w3 = row.weeks[3]?.is_paid ? 'Lunas' : 'Belum';
    const w4 = row.weeks[4]?.is_paid ? 'Lunas' : 'Belum';

    [1, 2, 3, 4].forEach((w) => {
      if (row.weeks[w]?.is_paid) total += row.weeks[w]?.amount || 5000;
    });

    const status = total >= 20000 ? 'LUNAS' : `Kurang ${formatRp(20000 - total)}`;

    return [
      idx + 1,
      row.member.name,
      w1,
      w2,
      w3,
      w4,
      formatRp(total),
      status
    ];
  });

  autoTable(doc, {
    startY: 68,
    head: [['No', 'Anggota', 'M1', 'M2', 'M3', 'M4', 'Total', 'Status']],
    body: memberTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 26, halign: 'right' },
      8: { cellWidth: 34, halign: 'center' },
    },
  });

  // Section 2: Expense Table
  const finalY = (doc as any).lastAutoTable.finalY || 130;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. PENGELUARAN', 14, finalY + 10);

  const expenseTableRows = expenses.map((exp, idx) => [
    idx + 1,
    `${exp.day_name}, ${exp.date}`,
    `M${exp.week}`,
    exp.category,
    formatRp(exp.amount),
    exp.pic || '-',
    exp.notes || '-'
  ]);

  if (expenseTableRows.length === 0) {
    expenseTableRows.push(['-', 'Belum ada pengeluaran di bulan ini', '-', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: finalY + 13,
    head: [['No', 'Hari & Tanggal', 'Mgg', 'Kategori', 'Nominal', 'PIC', 'Keterangan']],
    body: expenseTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 34 },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 22 },
      6: { cellWidth: 40 },
    },
  });

  // Footer note
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Uang Kas Kontrakan (Isi Ulang Air Rp 5rb, Sabun Cuci Piring, Tissue, Gas Masak) | Bayu, Apip, Ian, Ray, Dola, Vier', 14, pageHeight - 10);
  doc.text('Target Martabak: Saldo menganggur Rp 50.000', 196, pageHeight - 10, { align: 'right' });

  // Save PDF
  const fileName = `Laporan_Kas_Kontrakan_${monthName}_${year}.pdf`;
  doc.save(fileName);
};
