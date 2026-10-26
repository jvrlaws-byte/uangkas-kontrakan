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
  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;
  const docNo = `UK-LH/${year}/${String(month).padStart(2, '0')}`;
  const printDate = new Date().toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const workbook = XLSX.utils.book_new();

  // ============================================================================
  // SHEET 1: RINGKASAN EKSEKUTIF
  // ============================================================================
  const ringkasanData: any[][] = [
    ['LAPORAN KEUANGAN & IURAN KAS KONTRAKAN CIKARANG (LEMBAH HIJAU)'],
    ['Dokumen Resmi Rekapitulasi Bulanan — Bendahara: Vier (Admin)'],
    [],
    ['INFORMASI DOKUMEN', 'KETERANGAN'],
    ['Nomor Dokumen', docNo],
    ['Periode Laporan', `${monthName} ${year}`],
    ['Tanggal Cetak', printDate],
    ['Tarif Iuran Wajib', 'Rp 5.000 / Minggu (Rp 20.000 / Bulan)'],
    [],
    ['I. RINGKASAN POSISI KEUANGAN', 'NOMINAL (ANGKA)', 'TERFORMAT (RUPIAH)', 'KETERANGAN'],
    ['Total Pemasukan Bulan Ini', summary.monthlyIncome, formatRp(summary.monthlyIncome), `${summary.paidCount} dari ${summary.totalExpectedInstallments} minggu lunas`],
    ['Total Pengeluaran Bulan Ini', summary.monthlyExpense, formatRp(summary.monthlyExpense), `${expenses.length} transaksi operasional terverifikasi`],
    ['Arus Kas Bersih Bulan Ini', summary.monthlyNet, `${summary.monthlyNet >= 0 ? '+' : ''}${formatRp(summary.monthlyNet)}`, summary.monthlyNet >= 0 ? 'Surplus Kas Bulanan' : 'Defisit Kas Bulanan'],
    ['Total Sisa Saldo Kas Aktif', summary.currentBalance, formatRp(summary.currentBalance), 'Saldo kas riil siap pakai saat ini'],
    ['Total Tunggakan Belum Dibayar', summary.unpaidAmount, formatRp(summary.unpaidAmount), summary.unpaidAmount === 0 ? 'Seluruh anggota sudah lunas' : 'Masih ada iuran minggu yang belum dibayar'],
    [],
    ['II. STATUS TARGET MARTABAK BERSAMA (100K)', 'NOMINAL / NILAI', 'TERFORMAT', 'STATUS TARGET'],
    ['Target Saldo Martabak', summary.martabak.target, formatRp(summary.martabak.target), 'Target saldo kas menganggur Rp 100.000'],
    ['Saldo Kas Tersedia Saat Ini', summary.martabak.currentBalance, formatRp(summary.martabak.currentBalance), `Progress terkumpul: ${summary.martabak.progress}%`],
    [
      'Kekurangan Menuju Target',
      summary.martabak.remainingToTarget,
      formatRp(summary.martabak.remainingToTarget),
      summary.martabak.isReady
        ? `TERCAPAI! Siap beli (${summary.martabak.portions}x porsi)`
        : `Kurang ${formatRp(summary.martabak.remainingToTarget)} lagi`,
    ],
    [],
    ['III. KETENTUAN & ANGGOTA KONTRAKAN', 'RINCIAN'],
    ['Daftar Anggota (7 Orang)', 'Bayu, Apip, Ian, Ray, Dola, James_Deli (Mulai M3 Okt), Vier (Admin)'],
    ['Alokasi Pengeluaran Rutin', 'Isi Ulang Air Galon (Rp 5.000), Sabun Cuci Piring (Rp 8.000), Tissue, Gas Masak'],
  ];

  const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasanData);
  wsRingkasan['!cols'] = [
    { wch: 36 },
    { wch: 20 },
    { wch: 24 },
    { wch: 46 },
  ];
  wsRingkasan['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ];
  XLSX.utils.book_append_sheet(workbook, wsRingkasan, '1. Ringkasan Eksekutif');

  // ============================================================================
  // SHEET 2: MATRIKS IURAN KAS ANGGOTA (M1 - M4)
  // ============================================================================
  const iuranHeader = [
    'No',
    'Nama Anggota',
    'Peran / Ket',
    'Minggu 1 (M1)',
    'Minggu 2 (M2)',
    'Minggu 3 (M3)',
    'Minggu 4 (M4)',
    'Target Wajib (Rp)',
    'Sudah Dibayar (Rp)',
    'Sisa Tunggakan (Rp)',
    'Status Kelunasan',
  ];

  let totalTargetAll = 0;
  let totalPaidAll = 0;
  let totalUnpaidAll = 0;

  const iuranRows = matrix.map((row, idx) => {
    const activeWeeks = getActiveWeeksForMember(row.member.name, year, month);
    const targetAmount = activeWeeks.length * 5000;
    let totalPaid = 0;

    const weekStatuses = [1, 2, 3, 4].map((w) => {
      if (!activeWeeks.includes(w) || row.weeks[w]?.status === 'not_joined') {
        return '— (Belum Ikut)';
      }
      const contrib = row.weeks[w];
      if (contrib && contrib.is_paid) {
        totalPaid += contrib.amount || 5000;
        return 'LUNAS (Rp 5.000)';
      }
      if (contrib && contrib.pending_verification === 1) {
        return 'MENUNGGU VERIF';
      }
      return 'BELUM BAYAR';
    });

    const unpaid = Math.max(0, targetAmount - totalPaid);
    totalTargetAll += targetAmount;
    totalPaidAll += totalPaid;
    totalUnpaidAll += unpaid;

    const isFullyPaid = totalPaid >= targetAmount;
    const roleLabel =
      row.member.name.toLowerCase() === 'vier'
        ? 'Admin / Bendahara'
        : activeWeeks.length < 4
          ? 'Anggota (Mulai M3)'
          : 'Anggota';

    return [
      idx + 1,
      row.member.name,
      roleLabel,
      weekStatuses[0],
      weekStatuses[1],
      weekStatuses[2],
      weekStatuses[3],
      targetAmount,
      totalPaid,
      unpaid,
      isFullyPaid
        ? activeWeeks.length < 4
          ? 'LUNAS (M3-M4)'
          : 'LUNAS PENUH (4M)'
        : `KURANG ${formatRp(unpaid)}`,
    ];
  });

  const wsIuran = XLSX.utils.aoa_to_sheet([
    [`REKAPITULASI IURAN KAS MINGGUAN ANGGOTA — PERIODE ${monthName.toUpperCase()} ${year}`],
    [`Tarif Iuran: Rp 5.000 / Minggu • Nomor Dokumen: ${docNo}`],
    [],
    iuranHeader,
    ...iuranRows,
    [],
    [
      '',
      'TOTAL KESELURUHAN',
      `${matrix.length} Anggota`,
      '',
      '',
      '',
      '',
      totalTargetAll,
      totalPaidAll,
      totalUnpaidAll,
      totalUnpaidAll === 0 ? '100% LUNAS' : `TUNGGAKAN ${formatRp(totalUnpaidAll)}`,
    ],
  ]);

  wsIuran['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
  ];
  wsIuran['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
  ];
  XLSX.utils.book_append_sheet(workbook, wsIuran, '2. Matriks Iuran Kas');

  // ============================================================================
  // SHEET 3: JURNAL PENGELUARAN OPERASIONAL
  // ============================================================================
  const pengeluaranHeader = [
    'No',
    'Tanggal (YYYY-MM-DD)',
    'Hari',
    'Minggu Ke',
    'Kategori Pengeluaran',
    'PIC / Penanggung Jawab',
    'Catatan / Keterangan',
    'Nominal (Rp)',
    'Nominal Terformat',
  ];

  const pengeluaranRows =
    expenses.length > 0
      ? expenses.map((exp, idx) => [
          idx + 1,
          exp.date,
          exp.day_name,
          `Minggu ${exp.week} (M${exp.week})`,
          exp.category,
          exp.pic || '-',
          exp.notes || '-',
          exp.amount,
          formatRp(exp.amount),
        ])
      : [['-', '-', '-', '-', 'Belum ada pengeluaran terverifikasi bulan ini', '-', '-', 0, 'Rp 0']];

  const wsPengeluaran = XLSX.utils.aoa_to_sheet([
    [`JURNAL RINCIAN PENGELUARAN OPERASIONAL KONTRAKAN — PERIODE ${monthName.toUpperCase()} ${year}`],
    [`Kebutuhan Rutin: Air Galon, Sabun Cuci Piring, Tissue, Gas Masak • Dokumen: ${docNo}`],
    [],
    pengeluaranHeader,
    ...pengeluaranRows,
    [],
    [
      '',
      'TOTAL PENGELUARAN BULAN INI',
      '',
      '',
      `${expenses.length} Transaksi`,
      '',
      '',
      summary.monthlyExpense,
      formatRp(summary.monthlyExpense),
    ],
  ]);

  wsPengeluaran['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 12 },
    { wch: 18 },
    { wch: 26 },
    { wch: 22 },
    { wch: 36 },
    { wch: 16 },
    { wch: 20 },
  ];
  wsPengeluaran['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
  ];
  XLSX.utils.book_append_sheet(workbook, wsPengeluaran, '3. Jurnal Pengeluaran');

  // Trigger browser download
  const fileName = `Laporan_Kas_Kontrakan_${monthName}_${year}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
