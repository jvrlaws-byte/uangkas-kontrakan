import * as XLSX from 'xlsx';
import { MemberWeeklyRow, Expense, SummaryData } from '../types';

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
    ['LAPORAN KEUANGAN UANG KAS KONTRAKAN'],
    ['Periode:', `${monthName} ${year}`],
    ['Tanggal Cetak:', new Date().toLocaleString('id-ID')],
    [],
    ['RINGKASAN ARUS KAS BULANAN', 'NOMINAL (IDR)'],
    ['Total Pemasukan Kas', summary.monthlyIncome],
    ['Total Pengeluaran Kas', summary.monthlyExpense],
    ['Sisa Saldo Kas Bersih', summary.currentBalance],
    ['Estimasi Tunggakan Kas Belum Bayar', summary.unpaidAmount],
    [],
    ['STATUS TARGET MARTABAK (Rp 50.000)'],
    ['Target Martabak', summary.martabak.target],
    ['Saldo Tersedia Saat Ini', summary.martabak.currentBalance],
    ['Status Pencapaian', summary.martabak.isReady ? `TERCAPAI! (${summary.martabak.portions} Loyang Martabak Siap Beli)` : `Kurang Rp ${summary.martabak.remainingToTarget.toLocaleString('id-ID')}`],
    [],
    ['ATURAN KAS KONTRAKAN:'],
    ['- Iuran mingguan: Rp 5.000 per orang per minggu'],
    ['- Anggota: Bayu, Apip, Ian, Ray, Dola, Vier'],
    ['- Pengeluaran Kas: Khusus Isi Ulang Air (Rp 5.000), Sabun Cuci Piring, Tissue, Gas Masak, dan Lain-lain'],
    ['- Target Martabak: Setiap ada saldo menganggur ~Rp 50.000 siap dibelikan martabak bersama!'],
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
    let totalPaid = 0;
    const weekStatuses = [1, 2, 3, 4].map((w) => {
      const contrib = row.weeks[w];
      if (contrib && contrib.is_paid) {
        totalPaid += contrib.amount || 5000;
        return 'Lunas (5.000)';
      }
      return 'Belum';
    });

    const isFullyPaid = totalPaid >= 20000;

    return [
      idx + 1,
      row.member.name,
      weekStatuses[0],
      weekStatuses[1],
      weekStatuses[2],
      weekStatuses[3],
      totalPaid,
      isFullyPaid ? 'LUNAS (4 MGG)' : 'ADA TUNGGAKAN'
    ];
  });

  const wsIuran = XLSX.utils.aoa_to_sheet([
    [`REKAP PEMBAYARAN IURAN KAS KONTRAKAN - ${monthName.toUpperCase()} ${year}`],
    ['Tarif per minggu: Rp 5.000 per orang'],
    [],
    iuranHeader,
    ...iuranRows
  ]);
  XLSX.utils.book_append_sheet(workbook, wsIuran, 'Iuran Anggota');

  // 3. SHEET PENGELUARAN LENGKAP
  const pengeluaranHeader = [
    'No',
    'Tanggal',
    'Hari',
    'Minggu Ke',
    'Kategori',
    'Nominal (Rp)',
    'Penanggung Jawab (PIC)',
    'Keterangan'
  ];

  const pengeluaranRows = expenses.map((exp, idx) => [
    idx + 1,
    exp.date,
    exp.day_name,
    `Minggu ${exp.week}`,
    exp.category,
    exp.amount,
    exp.pic || '-',
    exp.notes || '-'
  ]);

  const wsPengeluaran = XLSX.utils.aoa_to_sheet([
    [`RINCIAN PENGELUARAN UANG KAS KONTRAKAN - ${monthName.toUpperCase()} ${year}`],
    ['Mencatat spesifik hari, tanggal, dan keperluan'],
    [],
    pengeluaranHeader,
    ...pengeluaranRows,
    [],
    ['TOTAL PENGELUARAN', '', '', '', '', summary.monthlyExpense]
  ]);
  XLSX.utils.book_append_sheet(workbook, wsPengeluaran, 'Rincian Pengeluaran');

  // Trigger browser download
  const fileName = `Laporan_Kas_Kontrakan_${monthName}_${year}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
