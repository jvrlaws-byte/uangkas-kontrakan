import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MemberWeeklyRow, Expense, SummaryData, getActiveWeeksForMember } from '../types';

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
  const docNo = `UK-LH/${year}/${String(month).padStart(2, '0')}`;
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // ============================================================================
  // 1. OFFICIAL EXECUTIVE HEADER BANNER
  // ============================================================================
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 32, 'F');

  // Emerald accent bar at bottom of header
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 30.5, 210, 1.5, 'F');

  // Left Header Title
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('KONTRAKAN CIKARANG • LEMBAH HIJAU', 14, 10);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KEUANGAN & IURAN KAS KONTRAKAN', 14, 18);

  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Tarif Iuran Wajib: Rp 5.000 / Minggu (Rp 20.000 / Bulan) • Bendahara: Vier (Admin)', 14, 24.5);

  // Right Header Metadata Box
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.setDrawColor(51, 65, 85); // Slate 700
  doc.roundedRect(144, 6, 52, 20, 2, 2, 'FD');

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`PERIODE: ${monthName.toUpperCase()} ${year}`, 170, 11.5, { align: 'center' });

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`No. Dok: ${docNo}`, 170, 16.5, { align: 'center' });
  doc.text(`Cetak: ${printDate}`, 170, 21.5, { align: 'center' });

  // ============================================================================
  // 2. RINGKASAN EKSEKUTIF (4 KPI CARDS - 182mm total width)
  // ============================================================================
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('I. RINGKASAN POSISI KEUANGAN', 14, 40);

  const cardY = 43;
  const cardH = 21;
  const cardW = 43.25;
  const gap = 3;

  // Card 1: Pemasukan Bulan Ini
  const c1X = 14;
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(16, 185, 129); // Emerald 500
  doc.roundedRect(c1X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 128, 61);
  doc.text('PEMASUKAN BULAN INI', c1X + 3, cardY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70);
  doc.text(formatRp(summary.monthlyIncome), c1X + 3, cardY + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 101, 52);
  doc.text(`${summary.paidCount} dari ${summary.totalExpectedInstallments} minggu lunas`, c1X + 3, cardY + 18);

  // Card 2: Pengeluaran Bulan Ini
  const c2X = c1X + cardW + gap;
  doc.setFillColor(254, 242, 242); // Rose 50
  doc.setDrawColor(244, 63, 94); // Rose 500
  doc.roundedRect(c2X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(190, 18, 60);
  doc.text('PENGELUARAN BULAN INI', c2X + 3, cardY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(136, 19, 55);
  doc.text(formatRp(summary.monthlyExpense), c2X + 3, cardY + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(159, 18, 57);
  doc.text(`${expenses.length} transaksi terverifikasi`, c2X + 3, cardY + 18);

  // Card 3: Sisa Saldo Kas Aktif
  const c3X = c2X + cardW + gap;
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.setDrawColor(59, 130, 246); // Blue 500
  doc.roundedRect(c3X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text('SALDO KAS AKTIF', c3X + 3, cardY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(formatRp(summary.currentBalance), c3X + 3, cardY + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(37, 99, 235);
  doc.text(`Kas Bersih: ${summary.monthlyNet >= 0 ? '+' : ''}${formatRp(summary.monthlyNet)}`, c3X + 3, cardY + 18);

  // Card 4: Target Martabak (Rp 100.000)
  const c4X = c3X + cardW + gap;
  doc.setFillColor(255, 251, 235); // Amber 50
  doc.setDrawColor(245, 158, 11); // Amber 500
  doc.roundedRect(c4X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('TARGET MARTABAK (100K)', c4X + 3, cardY + 5.5);
  doc.setFontSize(10.5);
  doc.setTextColor(120, 53, 15);
  doc.text(
    summary.martabak.isReady ? `TERCAPAI (${summary.martabak.portions}x)` : `${summary.martabak.progress}% Terkumpul`,
    c4X + 3,
    cardY + 13
  );
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(146, 64, 14);
  doc.text(
    summary.martabak.isReady
      ? 'Saldo siap beli martabak!'
      : `Kurang ${formatRp(summary.martabak.remainingToTarget)}`,
    c4X + 3,
    cardY + 18
  );

  // ============================================================================
  // 3. TABEL I: REKAPITULASI IURAN KAS MINGGUAN ANGGOTA (M1 - M4)
  // ============================================================================
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`II. REKAPITULASI IURAN KAS MINGGUAN ANGGOTA (${monthName.toUpperCase()} ${year})`, 14, 72);

  let totalTargetAllMembers = 0;
  let totalPaidAllMembers = 0;

  const memberTableRows = matrix.map((row, idx) => {
    const activeWeeks = getActiveWeeksForMember(row.member.name, year, month);
    const targetAmount = activeWeeks.length * 5000;
    totalTargetAllMembers += targetAmount;

    let totalMemberPaid = 0;
    const weekLabel = (w: number) => {
      if (!activeWeeks.includes(w) || row.weeks[w]?.status === 'not_joined') return '—';
      if (row.weeks[w]?.is_paid) {
        totalMemberPaid += row.weeks[w]?.amount || 5000;
        return 'LUNAS';
      }
      if (row.weeks[w]?.pending_verification === 1) {
        return 'VERIF';
      }
      return 'BELUM';
    };

    const w1 = weekLabel(1);
    const w2 = weekLabel(2);
    const w3 = weekLabel(3);
    const w4 = weekLabel(4);

    totalPaidAllMembers += totalMemberPaid;

    const isAllPaid = totalMemberPaid >= targetAmount;
    const statusText = isAllPaid
      ? activeWeeks.length < 4
        ? 'LUNAS (M3-M4)'
        : 'LUNAS PENUH'
      : `KURANG ${formatRp(targetAmount - totalMemberPaid)}`;

    const displayName =
      row.member.name.toLowerCase() === 'vier'
        ? `${row.member.name} (Admin)`
        : activeWeeks.length < 4
          ? `${row.member.name} (M3-M4)`
          : row.member.name;

    return [
      idx + 1,
      displayName,
      w1,
      w2,
      w3,
      w4,
      formatRp(totalMemberPaid),
      statusText,
    ];
  });

  const totalUnpaidAllMembers = Math.max(0, totalTargetAllMembers - totalPaidAllMembers);

  autoTable(doc, {
    startY: 75,
    margin: { left: 14, right: 14 },
    head: [['No', 'Nama Anggota', 'Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Total Bayar', 'Status Iuran']],
    body: memberTableRows,
    foot: [[
      '',
      'TOTAL PEMASUKAN IURAN KAS',
      `Target: ${formatRp(totalTargetAllMembers)}`,
      '',
      '',
      '',
      formatRp(totalPaidAllMembers),
      totalUnpaidAllMembers === 0 ? '100% LUNAS' : `Tunggakan: ${formatRp(totalUnpaidAllMembers)}`,
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [240, 253, 244], // Emerald 50
      textColor: [6, 95, 70],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5,
    },
    // Total width = 10 + 42 + 18 + 18 + 18 + 18 + 26 + 32 = 182mm (A4 210mm - 28mm margins)
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 42, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const val = String(data.cell.raw || '');
        if (data.column.index >= 2 && data.column.index <= 5) {
          if (val === 'LUNAS') {
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'BELUM') {
            data.cell.styles.textColor = [190, 18, 60];
          } else if (val === '—') {
            data.cell.styles.textColor = [148, 163, 184];
          }
        }
        if (data.column.index === 7) {
          if (val.startsWith('LUNAS')) {
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fillColor = [240, 253, 244];
          } else {
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fillColor = [255, 251, 235];
          }
        }
      }
      if (data.section === 'foot') {
        if (data.column.index === 6) {
          data.cell.styles.halign = 'right';
        }
        if (data.column.index === 7) {
          data.cell.styles.halign = 'center';
        }
      }
    },
  });

  // ============================================================================
  // 4. TABEL II: JURNAL PENGELUARAN OPERASIONAL KONTRAKAN
  // ============================================================================
  const afterMemberY = (doc as any).lastAutoTable.finalY || 145;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`III. RINCIAN PENGELUARAN OPERASIONAL KONTRAKAN (${monthName.toUpperCase()} ${year})`, 14, afterMemberY + 9);

  const expenseTableRows = expenses.map((exp, idx) => [
    idx + 1,
    `${exp.day_name}, ${exp.date}`,
    `M${exp.week}`,
    exp.category,
    exp.pic || '-',
    exp.notes || '-',
    formatRp(exp.amount),
  ]);

  if (expenseTableRows.length === 0) {
    expenseTableRows.push(['-', 'Belum ada pengeluaran terverifikasi pada periode ini', '-', '-', '-', '-', 'Rp 0']);
  }

  autoTable(doc, {
    startY: afterMemberY + 12,
    margin: { left: 14, right: 14 },
    head: [['No', 'Hari & Tanggal', 'Minggu', 'Kategori Pengeluaran', 'PIC', 'Keterangan / Catatan', 'Nominal']],
    body: expenseTableRows,
    foot: [[
      '',
      'TOTAL PENGELUARAN OPERASIONAL BULAN INI',
      '',
      '',
      '',
      `${expenses.length} Transaksi`,
      formatRp(summary.monthlyExpense),
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [254, 242, 242], // Rose 50
      textColor: [159, 18, 57],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5,
    },
    // Total width = 10 + 34 + 14 + 34 + 22 + 42 + 26 = 182mm
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 34, halign: 'left' },
      2: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 34, halign: 'left', fontStyle: 'bold' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 42, halign: 'left' },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        data.cell.styles.textColor = [190, 18, 60];
      }
      if (data.section === 'foot' && data.column.index === 6) {
        data.cell.styles.halign = 'right';
      }
    },
  });

  // ============================================================================
  // 5. SIGNATURE / VERIFICATION BLOCK & FOOTER
  // ============================================================================
  const afterExpenseY = (doc as any).lastAutoTable.finalY || 220;
  const pageHeight = doc.internal.pageSize.height;

  if (afterExpenseY + 35 < pageHeight - 15) {
    const signY = afterExpenseY + 8;

    // Left Box: Catatan & Ketentuan Kas
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, signY, 112, 24, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('CATATAN & KETENTUAN KAS KONTRAKAN:', 17, signY + 5.5);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('• Kebutuhan Rutin: Isi Ulang Air Galon (Rp 5.000), Sabun Cuci Piring (Rp 8.000), Tissue & Gas.', 17, signY + 10.5);
    doc.text('• Anggota Aktif: Bayu, Apip, Ian, Ray, Dola, James_Deli (Mulai M3 Okt), Vier (Admin).', 17, signY + 15);
    doc.text('• Target Martabak Bersama: Saldo kas menganggur mencapai Rp 100.000 (100K).', 17, signY + 19.5);

    // Right Box: Pengesahan Admin
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(132, signY, 64, 24, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text('DISAHKAN & DIVERIFIKASI OLEH:', 164, signY + 5.5, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(21, 128, 61);
    doc.text('[ Terverifikasi Digital — Sistem UangKas ]', 164, signY + 12.5, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('VIER — Admin / Bendahara', 164, signY + 20, { align: 'center' });
  }

  // Bottom Page Footer Line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 12, 196, pageHeight - 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Dokumen Resmi Sistem Informasi Uang Kas Kontrakan Cikarang (Lembah Hijau)',
    14,
    pageHeight - 7.5
  );
  doc.text(
    `Target Martabak: Rp 100.000 • Hal 1 / 1`,
    196,
    pageHeight - 7.5,
    { align: 'right' }
  );

  // Trigger PDF Download
  const fileName = `Laporan_Kas_Kontrakan_${monthName}_${year}.pdf`;
  doc.save(fileName);
};
