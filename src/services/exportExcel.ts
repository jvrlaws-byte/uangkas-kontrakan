import * as XLSX from 'xlsx';
import { MemberWeeklyRow, Expense, SummaryData, getActiveWeeksForMember } from '../types';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const exportToExcel = (
  year: number,
  month: number,
  summary: SummaryData,
  matrix: MemberWeeklyRow[],
  expenses: Expense[]
) => {
  const monthName = MONTH_NAMES[month - 1];
  const workbook = XLSX.utils.book_new();

  // 1. SHEET RINGKASAN
  const ringkasanData = [
    ['LAPORAN KAS KONTRAKAN'],
    ['Periode:', `${monthName} ${year}`],
    ['Tanggal Cetak:', new Date().toLocaleString('id-ID')],
    [],
    ['RINGKASAN KAS', 'NOMINAL (IDR)'],
    ['Pemasukan', summary.monthlyIncome],
    ['Pengeluaran', summary.monthlyExpense],
    ['Sisa Saldo', summary.currentBalance],
    ['Estimasi Tunggakan', summary.unpaidAmount],
    [],
    ['TARGET MARTABAK'],
    ['Target Martabak', summary.martabak.target],
    ['Saldo Tersedia', summary.martabak.currentBalance],
    ['Status', summary.martabak.isReady ? `TERCAPAI! (${summary.martabak.portions} Loyang Siap Beli)` : `Kurang Rp ${summary.martabak.remainingToTarget.toLocaleString('id-ID')}`],
    [],
    ['ATURAN KAS:'],
    ['- Iuran mingguan: Rp 5.000 / M'],
    ['- Anggota: Bayu, Apip, Ian, Ray, Dola, James_Dely, Vier'],
    ['- Pengeluaran: Air, Sabun, Tissue, Gas Masak'],
    ['- Target Martabak: Saldo ~Rp 50.000 untuk martabak bersama!'],
  ];

  const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasanData);
  XLSX.utils.book_append_sheet(workbook, wsRingkasan, 'Ringkasan Kas');

  // 2. SHEET REKAP IURAN ANGGOTA (4 Minggu per Bulan)
  const iuranHeader = [
    'No',
    'Nama Anggota',
    'Minggu 1',
    'Minggu 2',
    'Minggu 3',
    'Minggu 4',
    'Total Bayar (Rp)',
    'Status Bulan Ini'
  ];

  const iuranRows = matrix.map((row, idx) => {
    const activeWeeks = getActiveWeeksForMember(row.member.name, year, month);
    const targetAmount = activeWeeks.length * 5000;
    let totalPaid = 0;
    const weekStatuses = [1, 2, 3, 4].map((w) => {
      if (!activeWeeks.includes(w) || row.weeks[w]?.status === 'not_joined') {
        return 'Belum Ikut (-)';
      }
      const contrib = row.weeks[w];
      if (contrib && contrib.is_paid) {
        totalPaid += contrib.amount || 5000;
        return 'Lunas (5.000)';
      }
      return 'Belum';
    });

    const isFullyPaid = totalPaid >= targetAmount;

    return [
      idx + 1,
      row.member.name,
      weekStatuses[0],
      weekStatuses[1],
      weekStatuses[2],
      weekStatuses[3],
      totalPaid,
      isFullyPaid
        ? activeWeeks.length < 4
          ? 'LUNAS (M3-M4)'
          : 'LUNAS (4 M)'
        : 'ADA TUNGGAKAN'
    ];
  });

  const wsIuran = XLSX.utils.aoa_to_sheet([
    [`IURAN KAS - ${monthName.toUpperCase()} ${year}`],
    ['Tarif: Rp 5.000 / M'],
    [],
    iuranHeader,
    ...iuranRows
  ]);
  XLSX.utils.book_append_sheet(workbook, wsIuran, 'Iuran');

  // 3. SHEET PENGELUARAN
  const pengeluaranHeader = [
    'No',
    'Tanggal',
    'Hari',
    'M',
    'Kategori',
    'Nominal (Rp)',
    'PIC',
    'Ket'
  ];

  const pengeluaranRows = expenses.map((exp, idx) => [
    idx + 1,
    exp.date,
    exp.day_name,
    `M${exp.week}`,
    exp.category,
    exp.amount,
    exp.pic || '-',
    exp.notes || '-'
  ]);

  const wsPengeluaran = XLSX.utils.aoa_to_sheet([
    [`PENGELUARAN - ${monthName.toUpperCase()} ${year}`],
    [],
    pengeluaranHeader,
    ...pengeluaranRows,
    [],
    ['TOTAL', '', '', '', '', summary.monthlyExpense]
  ]);
  XLSX.utils.book_append_sheet(workbook, wsPengeluaran, 'Pengeluaran');

  // Trigger browser download
  const fileName = `Laporan_Kas_Kontrakan_${monthName}_${year}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
