import React, { useEffect, useState } from 'react';
import { 
  X, 
  ArrowLeft,
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Receipt,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  Eye,
  Download,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { MemberWeeklyRow, Expense, SummaryData, getActiveWeeksForMember } from '../types';
import { exportToExcel } from '../services/exportExcel';
import { exportToPdf } from '../services/exportPdf';
import { api } from '../services/api';
import { CustomDropdown } from './CustomDropdown';

const REPORT_EXPENSES_PER_PAGE = 7;

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  summary: SummaryData;
  matrix: MemberWeeklyRow[];
  expenses: Expense[];
  onChangeMonth?: (delta: number) => void;
  onSelectMonth?: (month: number) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  year,
  month,
  summary,
  matrix,
  expenses,
  onChangeMonth,
  onSelectMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [expensePage, setExpensePage] = useState<number>(1);
  const [previewFormat, setPreviewFormat] = useState<'pdf' | 'excel' | null>(null);
  const [excelSheetTab, setExcelSheetTab] = useState<'ringkasan' | 'iuran' | 'pengeluaran'>('iuran');
  const [yearlyData, setYearlyData] = useState<Array<{
    month: number;
    income: number;
    expense: number;
    net: number;
    runningBalance: number;
    paidWeeks: number;
    expenseCount: number;
  }>>([]);
  const [loadingYearly, setLoadingYearly] = useState<boolean>(false);

  // Fetch yearly monthly recap when modal opens or year/expenses/summary changes
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoadingYearly(true);
    api.getYearlyReport(year)
      .then((res) => {
        if (mounted) setYearlyData(res.months || []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingYearly(false);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen, year, summary.monthlyIncome, summary.monthlyExpense]);

  // Android Hardware / Gesture Back button support & ESC key
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ modal: 'report' }, '');

    const handlePopState = () => {
      if (previewFormat) {
        setPreviewFormat(null);
      } else {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewFormat) {
          setPreviewFormat(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, previewFormat]);

  useEffect(() => {
    setExpensePage(1);
    setPreviewFormat(null);
  }, [month, year, isOpen]);

  if (!isOpen) return null;

  const monthName = MONTH_NAMES[month - 1];
  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;
  const verifiedExpenses = expenses.filter((e) => e.pending_verification !== 1);
  const totalExpensePages = Math.max(1, Math.ceil(verifiedExpenses.length / REPORT_EXPENSES_PER_PAGE));
  const safeExpensePage = Math.min(expensePage, totalExpensePages);
  const expStartIdx = (safeExpensePage - 1) * REPORT_EXPENSES_PER_PAGE;
  const paginatedVerifiedExpenses = verifiedExpenses.slice(expStartIdx, expStartIdx + REPORT_EXPENSES_PER_PAGE);

  const docNo = `UK-LH/${year}/${String(month).padStart(2, '0')}`;
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Open Preview Pop-Up first (do NOT auto-download)
  const handleOpenExcelPreview = () => {
    setExcelSheetTab('iuran');
    setPreviewFormat('excel');
  };

  const handleOpenPdfPreview = () => {
    setPreviewFormat('pdf');
  };

  // Actual download triggered only when user confirms inside Preview Pop-Up
  const handleConfirmDownload = () => {
    if (previewFormat === 'excel') {
      exportToExcel(year, month, summary, matrix, verifiedExpenses);
    } else if (previewFormat === 'pdf') {
      exportToPdf(year, month, summary, matrix, verifiedExpenses);
    }
  };

  // Calculate totals for preview tables
  let totalTargetAllMembers = 0;
  let totalPaidAllMembers = 0;
  matrix.forEach((row) => {
    const activeWeeks = getActiveWeeksForMember(row.member.name, year, month);
    totalTargetAllMembers += activeWeeks.length * 5000;
    activeWeeks.forEach((w) => {
      if (row.weeks[w]?.is_paid) totalPaidAllMembers += row.weeks[w]?.amount || 5000;
    });
  });
  const totalUnpaidAllMembers = Math.max(0, totalTargetAllMembers - totalPaidAllMembers);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
        
        {/* Mobile Drag / Swipe bar */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-slate-850 shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header with Clear Back, Month Switcher & Preview Buttons */}
        <div className="flex flex-col gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-850 shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Back Button & Title */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <button
                onClick={onClose}
                className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition text-xs font-semibold border border-slate-700 shadow-sm shrink-0"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-1 text-emerald-400" />
                <span>Kembali</span>
              </button>

              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-lg text-white truncate">
                  Laporan Kas Bulanan
                </h3>
                <span className="text-[11px] text-emerald-400 font-semibold block truncate">
                  Periode {monthName} {year}
                </span>
              </div>
            </div>

            {/* Quick Preview Export & Close Buttons */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={handleOpenExcelPreview}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                title="Lihat Preview & Export Excel Bulan Ini"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                Excel
              </button>

              <button
                onClick={handleOpenPdfPreview}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
                title="Lihat Preview & Export PDF Bulan Ini"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                PDF
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Month Picker & Tab Switcher Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            {/* Tabs: Rincian Bulan Ini vs Rekap Per Bulan (1 Tahun) */}
            <div className="grid grid-cols-2 sm:flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Rincian {monthName}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'yearly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Rekap Per Bulan ({year})</span>
              </button>
            </div>

            {/* Direct Month Selector inside Modal */}
            <div className="flex items-center justify-between sm:justify-end space-x-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
              {onChangeMonth && (
                <button
                  type="button"
                  onClick={() => onChangeMonth(-1)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <CustomDropdown
                value={month}
                onChange={(val) => {
                  const targetM = Number(val);
                  if (onSelectMonth) {
                    onSelectMonth(targetM);
                  } else if (onChangeMonth) {
                    onChangeMonth(targetM - month);
                  }
                  setActiveTab('monthly');
                }}
                options={MONTH_NAMES.map((mName, idx) => ({
                  value: idx + 1,
                  label: `${mName} ${year}`,
                }))}
                isActiveFilter
                align="right"
                className="w-40 sm:w-44"
              />

              {onChangeMonth && (
                <button
                  type="button"
                  onClick={() => onChangeMonth(1)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 overscroll-contain">
          
          {activeTab === 'yearly' ? (
            /* TAB 2: REKAPITULASI UANG KAS PER BULAN (JANUARI - DESEMBER) */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-850 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-emerald-400" />
                    Rekapitulasi Kas Per Bulan — Tahun {year}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Klik pada bulan mana saja untuk melihat tabel iuran anggota & rincian pengeluaran bulan tersebut.
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Saldo Kas Akumulasi</span>
                  <span className="text-base sm:text-lg font-extrabold text-emerald-400">
                    {formatRp(summary.currentBalance)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800 text-slate-300 uppercase">
                    <tr>
                      <th className="py-3 px-3.5">Bulan</th>
                      <th className="py-3 px-3 text-right">Pemasukan</th>
                      <th className="py-3 px-3 text-right">Pengeluaran</th>
                      <th className="py-3 px-3 text-right">Kas Bersih</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                    {loadingYearly ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Memuat rekapitulasi bulanan...
                        </td>
                      </tr>
                    ) : (
                      yearlyData.map((item) => {
                        const isCurrentSelected = item.month === month;
                        const hasActivity = item.income > 0 || item.expense > 0;
                        return (
                          <tr
                            key={item.month}
                            onClick={() => {
                              if (onSelectMonth) onSelectMonth(item.month);
                              else if (onChangeMonth) onChangeMonth(item.month - month);
                              setActiveTab('monthly');
                            }}
                            className={`cursor-pointer transition ${
                              isCurrentSelected
                                ? 'bg-emerald-950/30 hover:bg-emerald-950/40'
                                : hasActivity
                                  ? 'hover:bg-slate-800/50'
                                  : 'opacity-65 hover:opacity-100 hover:bg-slate-800/30'
                            }`}
                          >
                            <td className="py-3 px-3.5 font-bold text-white flex items-center space-x-2">
                              <span>{MONTH_NAMES[item.month - 1]}</span>
                              {isCurrentSelected && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Aktif
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-blue-400">
                              {formatRp(item.income)}
                              {item.paidWeeks > 0 && (
                                <span className="block text-[10px] font-normal text-slate-400">
                                  {item.paidWeeks} minggu lunas
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-rose-400">
                              {formatRp(item.expense)}
                              {item.expenseCount > 0 && (
                                <span className="block text-[10px] font-normal text-slate-400">
                                  {item.expenseCount} catatan
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-3 text-right font-extrabold ${
                              item.net > 0 ? 'text-emerald-400' : item.net < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {item.net >= 0 ? `+${formatRp(item.net)}` : formatRp(item.net)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 transition"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* TAB 1: RINCIAN LAPORAN BULAN INI */
            <>
              {/* Financial Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">
                    Pemasukan ({monthName})
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-blue-400 mt-0.5">
                    {formatRp(summary.monthlyIncome)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">
                    Pengeluaran ({monthName})
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-rose-400 mt-0.5">
                    {formatRp(summary.monthlyExpense)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">
                    Kas Bersih ({monthName})
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-emerald-400 mt-0.5">
                    {formatRp(summary.monthlyNet)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">
                    Total Saldo Kas
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-amber-400 mt-0.5">
                    {formatRp(summary.currentBalance)}
                  </div>
                </div>
              </div>

              {/* Section 1: Member Contribution Table Preview */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
                  <span className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                    1. Tabel Iuran Kas Anggota ({monthName} {year})
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Target: Rp 20.000 / anggota
                  </span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800 text-slate-300 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Nama</th>
                        <th className="py-2.5 px-2 text-center">M1</th>
                        <th className="py-2.5 px-2 text-center">M2</th>
                        <th className="py-2.5 px-2 text-center">M3</th>
                        <th className="py-2.5 px-2 text-center">M4</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                      {matrix.map((row) => {
                        const activeWeeks = getActiveWeeksForMember(row.member.name, year, month);
                        const targetAmount = activeWeeks.length * 5000;
                        const isPartialMonth = activeWeeks.length < 4;
                        let total = 0;
                        activeWeeks.forEach((w) => {
                          if (row.weeks[w]?.is_paid) total += row.weeks[w]?.amount || 5000;
                        });
                        const isAll = total >= targetAmount;

                        return (
                          <tr key={row.member.id}>
                            <td className="py-2.5 px-3 font-semibold text-white">
                              {row.member.name}
                              {row.member.name.toLowerCase() === 'vier' && (
                                <span className="ml-1 text-[10px] text-amber-400 font-bold">(Admin)</span>
                              )}
                              {isPartialMonth && (
                                <span className="ml-1 text-[10px] text-blue-400 font-bold">(M3-M4)</span>
                              )}
                            </td>
                            {[1, 2, 3, 4].map((w) => {
                              const isWeekActive = activeWeeks.includes(w) && row.weeks[w]?.status !== 'not_joined';
                              return (
                                <td key={w} className="py-2.5 px-2 text-center">
                                  {!isWeekActive ? (
                                    <span className="text-slate-600 text-[10px]">—</span>
                                  ) : row.weeks[w]?.is_paid ? (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">✓</span>
                                  ) : row.weeks[w]?.pending_verification === 1 ? (
                                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">Verif</span>
                                  ) : (
                                    <span className="text-slate-600">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-3 text-right font-bold text-slate-200">{formatRp(total)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isAll ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
                              }`}>
                                {isAll
                                  ? isPartialMonth
                                    ? 'LUNAS (M3-M4)'
                                    : 'LUNAS'
                                  : `KURANG ${formatRp(targetAmount - total)}`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Expense Ledger Preview */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
                  <span className="flex items-center">
                    <Receipt className="w-4 h-4 mr-1.5 text-rose-400" />
                    2. Rincian Pengeluaran ({monthName} {year})
                  </span>
                  <span className="text-[11px] text-rose-400 font-bold">
                    Total: {formatRp(summary.monthlyExpense)}
                  </span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-60 overflow-y-auto overscroll-contain">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800 text-slate-300 uppercase sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Hari & Tanggal</th>
                        <th className="py-2.5 px-2">M</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3">PIC</th>
                        <th className="py-2.5 px-3">Keterangan</th>
                        <th className="py-2.5 px-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                      {verifiedExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500">
                            Belum ada pengeluaran terverifikasi di bulan {monthName} {year}.
                          </td>
                        </tr>
                      ) : (
                        paginatedVerifiedExpenses.map((exp) => (
                          <tr key={exp.id}>
                            <td className="py-2.5 px-3 text-white font-medium whitespace-nowrap">
                              {exp.day_name}, {exp.date}
                            </td>
                            <td className="py-2.5 px-2 text-slate-400">M{exp.week}</td>
                            <td className="py-2.5 px-3 text-slate-200 font-semibold">{exp.category}</td>
                            <td className="py-2.5 px-3 text-slate-300">{exp.pic || '-'}</td>
                            <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{exp.notes || '-'}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-400 whitespace-nowrap">
                              -{formatRp(exp.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {verifiedExpenses.length > REPORT_EXPENSES_PER_PAGE && (
                  <div className="flex items-center justify-between pt-1.5 text-xs text-slate-400">
                    <span>
                      Menampilkan <strong>{expStartIdx + 1}–{Math.min(expStartIdx + REPORT_EXPENSES_PER_PAGE, verifiedExpenses.length)}</strong> dari <strong>{verifiedExpenses.length}</strong> pengeluaran
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
                        disabled={safeExpensePage <= 1}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 font-bold"
                      >
                        Prev
                      </button>
                      <span className="px-2 font-bold text-emerald-400">
                        Hal. {safeExpensePage} / {totalExpensePages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpensePage((p) => Math.min(totalExpensePages, p + 1))}
                        disabled={safeExpensePage >= totalExpensePages}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 font-bold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Sticky Mobile & Desktop Footer Navigation */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-850 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-safe">
          
          {/* Main Close Button */}
          <button
            onClick={onClose}
            className="w-full sm:w-auto order-2 sm:order-1 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 transition flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Tutup Laporan</span>
          </button>

          {/* Preview & Export Action Buttons (Opens Preview Pop-Up First) */}
          <div className="w-full sm:w-auto order-1 sm:order-2 flex items-center space-x-2">
            <button
              onClick={handleOpenExcelPreview}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition flex items-center justify-center shadow-md shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel ({monthName})
            </button>
            <button
              onClick={handleOpenPdfPreview}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition flex items-center justify-center shadow-md shadow-blue-600/20"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Export PDF ({monthName})
            </button>
          </div>

        </div>

        {/* =====================================================================
            DOCUMENT PREVIEW POP-UP MODAL (VIEW FIRST BEFORE DOWNLOADING)
           ===================================================================== */}
        {previewFormat && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewFormat(null);
            }}
          >
            <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94dvh] flex flex-col">
              
              {/* Preview Pop-Up Top Bar */}
              <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center justify-between sm:justify-start space-x-3">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        previewFormat === 'pdf'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {previewFormat === 'pdf' ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm sm:text-base font-extrabold text-white">
                          {previewFormat === 'pdf'
                            ? 'Preview Dokumen PDF Resmi'
                            : 'Preview Workbook Excel (.xlsx)'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          Mode Lihat Saja
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Laporan_Kas_Kontrakan_{monthName}_{year}.{previewFormat === 'pdf' ? 'pdf' : 'xlsx'} • Silakan periksa tampilan sebelum memilih download.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewFormat(null)}
                    className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Format Switcher inside Preview Pop-Up */}
                <div className="flex items-center justify-between sm:justify-end space-x-2">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setPreviewFormat('pdf')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                        previewFormat === 'pdf'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Tampilan PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFormat('excel')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                        previewFormat === 'excel'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Tampilan Excel</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewFormat(null)}
                    className="hidden sm:inline-flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Tutup Preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preview Body (Scrollable Document / Spreadsheet Viewer) */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/90 overscroll-contain">
                {previewFormat === 'pdf' ? (
                  /* =========================================================
                     1. EXECUTIVE A4 PDF PAPER PREVIEW
                     ========================================================= */
                  <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-300">
                    {/* PDF Top Banner */}
                    <div className="bg-slate-900 text-white px-5 sm:px-8 py-5 border-b-4 border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] sm:text-xs font-extrabold tracking-widest text-emerald-400 uppercase block">
                          KONTRAKAN CIKARANG • LEMBAH HIJAU
                        </span>
                        <h2 className="text-base sm:text-xl font-black tracking-tight text-white mt-0.5">
                          LAPORAN KEUANGAN & IURAN KAS KONTRAKAN
                        </h2>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Tarif Iuran Wajib: Rp 5.000 / Minggu (Rp 20.000 / Bulan) • Bendahara: Vier (Admin)
                        </p>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-left sm:text-right shrink-0">
                        <div className="text-xs font-extrabold text-emerald-400 uppercase">
                          PERIODE: {monthName} {year}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">No. Dok: {docNo}</div>
                        <div className="text-[11px] text-slate-400">Cetak: {printDate}</div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-8 space-y-6">
                      {/* Section I: 4 KPI Cards */}
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-2.5">
                          I. RINGKASAN POSISI KEUANGAN
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="rounded-xl bg-emerald-50 border border-emerald-500/40 p-3">
                            <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">
                              PEMASUKAN BULAN INI
                            </span>
                            <span className="text-sm sm:text-base font-black text-emerald-900 block mt-1">
                              {formatRp(summary.monthlyIncome)}
                            </span>
                            <span className="text-[10px] text-emerald-700 block mt-0.5">
                              {summary.paidCount} dari {summary.totalExpectedInstallments} minggu lunas
                            </span>
                          </div>

                          <div className="rounded-xl bg-rose-50 border border-rose-500/40 p-3">
                            <span className="text-[10px] font-extrabold text-rose-700 uppercase block">
                              PENGELUARAN BULAN INI
                            </span>
                            <span className="text-sm sm:text-base font-black text-rose-900 block mt-1">
                              {formatRp(summary.monthlyExpense)}
                            </span>
                            <span className="text-[10px] text-rose-700 block mt-0.5">
                              {verifiedExpenses.length} transaksi terverifikasi
                            </span>
                          </div>

                          <div className="rounded-xl bg-blue-50 border border-blue-500/40 p-3">
                            <span className="text-[10px] font-extrabold text-blue-700 uppercase block">
                              SALDO KAS AKTIF
                            </span>
                            <span className="text-sm sm:text-base font-black text-blue-900 block mt-1">
                              {formatRp(summary.currentBalance)}
                            </span>
                            <span className="text-[10px] text-blue-700 block mt-0.5">
                              Kas Bersih: {summary.monthlyNet >= 0 ? '+' : ''}{formatRp(summary.monthlyNet)}
                            </span>
                          </div>

                          <div className="rounded-xl bg-amber-50 border border-amber-500/40 p-3">
                            <span className="text-[10px] font-extrabold text-amber-800 uppercase block">
                              TARGET MARTABAK (100K)
                            </span>
                            <span className="text-sm sm:text-base font-black text-amber-950 block mt-1">
                              {summary.martabak.isReady
                                ? `TERCAPAI (${summary.martabak.portions}x)`
                                : `${summary.martabak.progress}% Terkumpul`}
                            </span>
                            <span className="text-[10px] text-amber-800 block mt-0.5">
                              {summary.martabak.isReady
                                ? 'Saldo siap beli martabak!'
                                : `Kurang ${formatRp(summary.martabak.remainingToTarget)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section II: Member Contribution Table */}
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-2">
                          II. REKAPITULASI IURAN KAS MINGGUAN ANGGOTA ({monthName.toUpperCase()} {year})
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-slate-300">
                          <table className="w-full text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-white">
                                <th className="py-2 px-2.5 text-center border border-slate-700 w-8">No</th>
                                <th className="py-2 px-3 text-left border border-slate-700">Nama Anggota</th>
                                <th className="py-2 px-2 text-center border border-slate-700">Minggu 1</th>
                                <th className="py-2 px-2 text-center border border-slate-700">Minggu 2</th>
                                <th className="py-2 px-2 text-center border border-slate-700">Minggu 3</th>
                                <th className="py-2 px-2 text-center border border-slate-700">Minggu 4</th>
                                <th className="py-2 px-3 text-right border border-slate-700">Total Bayar</th>
                                <th className="py-2 px-3 text-center border border-slate-700">Status Iuran</th>
                              </tr>
                            </thead>
                            <tbody>
                              {matrix.map((row, idx) => {
                                const activeWeeks = getActiveWeeksForMember(row.member.name, year, month);
                                const targetAmount = activeWeeks.length * 5000;
                                let totalPaid = 0;
                                activeWeeks.forEach((w) => {
                                  if (row.weeks[w]?.is_paid) totalPaid += row.weeks[w]?.amount || 5000;
                                });
                                const isAll = totalPaid >= targetAmount;

                                return (
                                  <tr key={row.member.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                                    <td className="py-2 px-2.5 text-center border border-slate-200 font-semibold text-slate-600">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2 px-3 border border-slate-200 font-bold text-slate-900">
                                      {row.member.name}
                                      {row.member.name.toLowerCase() === 'vier' && (
                                        <span className="ml-1 text-[10px] text-amber-700 font-bold">(Admin)</span>
                                      )}
                                      {activeWeeks.length < 4 && (
                                        <span className="ml-1 text-[10px] text-blue-700 font-bold">(M3-M4)</span>
                                      )}
                                    </td>
                                    {[1, 2, 3, 4].map((w) => {
                                      const isWeekActive = activeWeeks.includes(w) && row.weeks[w]?.status !== 'not_joined';
                                      const isPaid = row.weeks[w]?.is_paid;
                                      return (
                                        <td key={w} className="py-2 px-2 text-center border border-slate-200 font-bold">
                                          {!isWeekActive ? (
                                            <span className="text-slate-400">—</span>
                                          ) : isPaid ? (
                                            <span className="text-emerald-700">LUNAS</span>
                                          ) : (
                                            <span className="text-rose-600">BELUM</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                    <td className="py-2 px-3 text-right border border-slate-200 font-bold text-slate-900">
                                      {formatRp(totalPaid)}
                                    </td>
                                    <td
                                      className={`py-2 px-3 text-center border border-slate-200 font-extrabold text-[10px] ${
                                        isAll ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                                      }`}
                                    >
                                      {isAll
                                        ? activeWeeks.length < 4
                                          ? 'LUNAS (M3-M4)'
                                          : 'LUNAS PENUH'
                                        : `KURANG ${formatRp(targetAmount - totalPaid)}`}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-emerald-50 font-extrabold text-emerald-900 border-t-2 border-emerald-500">
                                <td className="py-2.5 px-2.5 border border-emerald-200" />
                                <td className="py-2.5 px-3 border border-emerald-200">
                                  TOTAL PEMASUKAN IURAN KAS
                                </td>
                                <td colSpan={4} className="py-2.5 px-3 text-center border border-emerald-200 text-[10px]">
                                  Target Wajib Bulan Ini: {formatRp(totalTargetAllMembers)}
                                </td>
                                <td className="py-2.5 px-3 text-right border border-emerald-200">
                                  {formatRp(totalPaidAllMembers)}
                                </td>
                                <td className="py-2.5 px-3 text-center border border-emerald-200 text-[10px]">
                                  {totalUnpaidAllMembers === 0
                                    ? '100% LUNAS'
                                    : `Tunggakan: ${formatRp(totalUnpaidAllMembers)}`}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* Section III: Expense Table */}
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-2">
                          III. RINCIAN PENGELUARAN OPERASIONAL KONTRAKAN ({monthName.toUpperCase()} {year})
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-slate-300">
                          <table className="w-full text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-slate-800 text-white">
                                <th className="py-2 px-2.5 text-center border border-slate-700 w-8">No</th>
                                <th className="py-2 px-3 text-left border border-slate-700">Hari & Tanggal</th>
                                <th className="py-2 px-2 text-center border border-slate-700">Minggu</th>
                                <th className="py-2 px-3 text-left border border-slate-700">Kategori Pengeluaran</th>
                                <th className="py-2 px-2.5 text-center border border-slate-700">PIC</th>
                                <th className="py-2 px-3 text-left border border-slate-700">Keterangan / Catatan</th>
                                <th className="py-2 px-3 text-right border border-slate-700">Nominal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {verifiedExpenses.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="py-4 text-center text-slate-500">
                                    Belum ada pengeluaran terverifikasi pada periode ini
                                  </td>
                                </tr>
                              ) : (
                                verifiedExpenses.map((exp, idx) => (
                                  <tr key={exp.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                                    <td className="py-2 px-2.5 text-center border border-slate-200 text-slate-600">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2 px-3 border border-slate-200 font-medium text-slate-800 whitespace-nowrap">
                                      {exp.day_name}, {exp.date}
                                    </td>
                                    <td className="py-2 px-2 text-center border border-slate-200 font-bold text-slate-700">
                                      M{exp.week}
                                    </td>
                                    <td className="py-2 px-3 border border-slate-200 font-bold text-slate-900">
                                      {exp.category}
                                    </td>
                                    <td className="py-2 px-2.5 text-center border border-slate-200 text-slate-700">
                                      {exp.pic || '-'}
                                    </td>
                                    <td className="py-2 px-3 border border-slate-200 text-slate-600">
                                      {exp.notes || '-'}
                                    </td>
                                    <td className="py-2 px-3 text-right border border-slate-200 font-bold text-rose-700 whitespace-nowrap">
                                      {formatRp(exp.amount)}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="bg-rose-50 font-extrabold text-rose-900 border-t-2 border-rose-400">
                                <td className="py-2.5 px-2.5 border border-rose-200" />
                                <td colSpan={4} className="py-2.5 px-3 border border-rose-200">
                                  TOTAL PENGELUARAN OPERASIONAL BULAN INI
                                </td>
                                <td className="py-2.5 px-3 text-center border border-rose-200 text-[10px]">
                                  {verifiedExpenses.length} Transaksi
                                </td>
                                <td className="py-2.5 px-3 text-right border border-rose-200">
                                  {formatRp(summary.monthlyExpense)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* Section IV: Notes & Official Verification Stamp */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="sm:col-span-2 rounded-xl bg-slate-50 border border-slate-300 p-3.5 text-[11px] text-slate-600 space-y-1">
                          <div className="font-extrabold text-slate-800 uppercase">
                            CATATAN & KETENTUAN KAS KONTRAKAN:
                          </div>
                          <div>• Kebutuhan Rutin: Isi Ulang Air Galon (Rp 5.000), Sabun Cuci Piring (Rp 8.000), Tissue & Gas.</div>
                          <div>• Anggota Aktif: Bayu, Apip, Ian, Ray, Dola, James_Deli (Mulai M3 Okt), Vier (Admin).</div>
                          <div>• Target Martabak Bersama: Saldo kas menganggur mencapai Rp 100.000 (100K).</div>
                        </div>

                        <div className="rounded-xl bg-emerald-50 border border-emerald-400 p-3.5 text-center flex flex-col justify-between">
                          <span className="text-[10px] font-extrabold text-emerald-900 uppercase">
                            DISAHKAN & DIVERIFIKASI OLEH:
                          </span>
                          <div className="my-2 inline-flex items-center justify-center space-x-1 text-[11px] font-bold text-emerald-700 bg-white/80 py-1 px-2 rounded-lg border border-emerald-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Terverifikasi Digital</span>
                          </div>
                          <span className="text-xs font-black text-slate-900">
                            VIER — Admin / Bendahara
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* =========================================================
                     2. EXCEL WORKBOOK SPREADSHEET PREVIEW (3 SHEET TABS)
                     ========================================================= */
                  <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-emerald-600/40">
                    {/* Excel Workbook Title Bar */}
                    <div className="bg-emerald-800 text-white px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                        <span className="text-xs sm:text-sm font-extrabold">
                          Laporan_Kas_Kontrakan_{monthName}_{year}.xlsx
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-100 font-medium">
                        Klik tab sheet di bawah untuk melihat isi masing-masing lembar kerja Excel
                      </span>
                    </div>

                    {/* Excel Sheet Switcher Tabs */}
                    <div className="bg-slate-100 border-b border-slate-300 px-3 pt-2 flex items-center space-x-1 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setExcelSheetTab('ringkasan')}
                        className={`px-3.5 py-2 rounded-t-lg text-xs font-extrabold border-t border-x transition whitespace-nowrap ${
                          excelSheetTab === 'ringkasan'
                            ? 'bg-white text-emerald-800 border-slate-300 shadow-sm'
                            : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
                        }`}
                      >
                        Sheet 1: Ringkasan Eksekutif
                      </button>
                      <button
                        type="button"
                        onClick={() => setExcelSheetTab('iuran')}
                        className={`px-3.5 py-2 rounded-t-lg text-xs font-extrabold border-t border-x transition whitespace-nowrap ${
                          excelSheetTab === 'iuran'
                            ? 'bg-white text-emerald-800 border-slate-300 shadow-sm'
                            : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
                        }`}
                      >
                        Sheet 2: Matriks Iuran Kas
                      </button>
                      <button
                        type="button"
                        onClick={() => setExcelSheetTab('pengeluaran')}
                        className={`px-3.5 py-2 rounded-t-lg text-xs font-extrabold border-t border-x transition whitespace-nowrap ${
                          excelSheetTab === 'pengeluaran'
                            ? 'bg-white text-emerald-800 border-slate-300 shadow-sm'
                            : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
                        }`}
                      >
                        Sheet 3: Jurnal Pengeluaran
                      </button>
                    </div>

                    {/* Spreadsheet Grid Area */}
                    <div className="p-4 sm:p-6 overflow-x-auto">
                      {excelSheetTab === 'ringkasan' && (
                        <table className="w-full text-xs border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 font-mono text-[10px]">
                              <th className="border border-slate-300 py-1 px-2 w-8 text-center">#</th>
                              <th className="border border-slate-300 py-1 px-3 text-center">A (Komponen Laporan)</th>
                              <th className="border border-slate-300 py-1 px-3 text-center">B (Angka)</th>
                              <th className="border border-slate-300 py-1 px-3 text-center">C (Terformat Rupiah)</th>
                              <th className="border border-slate-300 py-1 px-3 text-center">D (Keterangan)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-emerald-900 text-white font-extrabold">
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono text-[10px] text-slate-300">1</td>
                              <td colSpan={4} className="border border-slate-300 py-2 px-3">
                                LAPORAN KEUANGAN & IURAN KAS KONTRAKAN CIKARANG (LEMBAH HIJAU) — {monthName.toUpperCase()} {year}
                              </td>
                            </tr>
                            <tr className="bg-slate-100 font-bold text-slate-800">
                              <td className="border border-slate-300 py-1.5 px-2 text-center font-mono text-[10px] text-slate-500">2</td>
                              <td className="border border-slate-300 py-1.5 px-3">I. RINGKASAN POSISI KEUANGAN</td>
                              <td className="border border-slate-300 py-1.5 px-3 text-right">NOMINAL (IDR)</td>
                              <td className="border border-slate-300 py-1.5 px-3 text-right">TERFORMAT</td>
                              <td className="border border-slate-300 py-1.5 px-3">KETERANGAN</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono text-[10px] text-slate-400">3</td>
                              <td className="border border-slate-300 py-2 px-3 font-semibold">Total Pemasukan Bulan Ini</td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-mono">{summary.monthlyIncome}</td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-bold text-emerald-700">{formatRp(summary.monthlyIncome)}</td>
                              <td className="border border-slate-300 py-2 px-3 text-slate-600">{summary.paidCount} dari {summary.totalExpectedInstallments} minggu lunas</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono text-[10px] text-slate-400">4</td>
                              <td className="border border-slate-300 py-2 px-3 font-semibold">Total Pengeluaran Bulan Ini</td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-mono">{summary.monthlyExpense}</td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-bold text-rose-700">{formatRp(summary.monthlyExpense)}</td>
                              <td className="border border-slate-300 py-2 px-3 text-slate-600">{verifiedExpenses.length} transaksi operasional terverifikasi</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono text-[10px] text-slate-400">5</td>
                              <td className="border border-slate-300 py-2 px-3 font-semibold">Arus Kas Bersih Bulan Ini</td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-mono">{summary.monthlyNet}</td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-bold text-blue-700">{summary.monthlyNet >= 0 ? '+' : ''}{formatRp(summary.monthlyNet)}</td>
                              <td className="border border-slate-300 py-2 px-3 text-slate-600">{summary.monthlyNet >= 0 ? 'Surplus Kas Bulanan' : 'Defisit Kas Bulanan'}</td>
                            </tr>
                            <tr className="bg-emerald-50/70">
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono text-[10px] text-slate-400">6</td>
                              <td className="border border-slate-300 py-2 px-3 font-bold">Total Sisa Saldo Kas Aktif</td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-mono font-bold">{summary.currentBalance}</td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-extrabold text-emerald-800">{formatRp(summary.currentBalance)}</td>
                              <td className="border border-slate-300 py-2 px-3 text-slate-700 font-medium">Saldo kas riil siap pakai saat ini</td>
                            </tr>
                            <tr className="bg-slate-100 font-bold text-slate-800">
                              <td className="border border-slate-300 py-1.5 px-2 text-center font-mono text-[10px] text-slate-500">7</td>
                              <td className="border border-slate-300 py-1.5 px-3">II. TARGET MARTABAK BERSAMA (100K)</td>
                              <td className="border border-slate-300 py-1.5 px-3 text-right">NILAI</td>
                              <td className="border border-slate-300 py-1.5 px-3 text-right">TERFORMAT</td>
                              <td className="border border-slate-300 py-1.5 px-3">STATUS TARGET</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono text-[10px] text-slate-400">8</td>
                              <td className="border border-slate-300 py-2 px-3 font-semibold">Target Saldo Martabak</td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-mono">{summary.martabak.target}</td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-bold text-amber-800">{formatRp(summary.martabak.target)}</td>
                              <td className="border border-slate-300 py-2 px-3 text-slate-600">Target saldo menganggur Rp 100.000 (Progress: {summary.martabak.progress}%)</td>
                            </tr>
                          </tbody>
                        </table>
                      )}

                      {excelSheetTab === 'iuran' && (
                        <table className="w-full text-xs border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 font-mono text-[10px]">
                              <th className="border border-slate-300 py-1 px-2 text-center">A (No)</th>
                              <th className="border border-slate-300 py-1 px-3 text-left">B (Nama Anggota)</th>
                              <th className="border border-slate-300 py-1 px-2 text-left">C (Peran)</th>
                              <th className="border border-slate-300 py-1 px-2 text-center">D (M1)</th>
                              <th className="border border-slate-300 py-1 px-2 text-center">E (M2)</th>
                              <th className="border border-slate-300 py-1 px-2 text-center">F (M3)</th>
                              <th className="border border-slate-300 py-1 px-2 text-center">G (M4)</th>
                              <th className="border border-slate-300 py-1 px-2.5 text-right">H (Target)</th>
                              <th className="border border-slate-300 py-1 px-2.5 text-right">I (Dibayar)</th>
                              <th className="border border-slate-300 py-1 px-2.5 text-center">J (Status)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matrix.map((row, idx) => {
                              const activeWeeks = getActiveWeeksForMember(row.member.name, year, month);
                              const targetAmount = activeWeeks.length * 5000;
                              let totalPaid = 0;
                              const cells = [1, 2, 3, 4].map((w) => {
                                if (!activeWeeks.includes(w) || row.weeks[w]?.status === 'not_joined') {
                                  return '— (Belum Ikut)';
                                }
                                if (row.weeks[w]?.is_paid) {
                                  totalPaid += row.weeks[w]?.amount || 5000;
                                  return 'LUNAS (5.000)';
                                }
                                return 'BELUM BAYAR';
                              });
                              const isAll = totalPaid >= targetAmount;
                              const role =
                                row.member.name.toLowerCase() === 'vier'
                                  ? 'Admin / Bendahara'
                                  : activeWeeks.length < 4
                                    ? 'Mulai M3'
                                    : 'Anggota';

                              return (
                                <tr key={row.member.id} className="hover:bg-slate-50">
                                  <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">{idx + 1}</td>
                                  <td className="border border-slate-300 py-1.5 px-3 font-bold">{row.member.name}</td>
                                  <td className="border border-slate-300 py-1.5 px-2 text-slate-600">{role}</td>
                                  {cells.map((c, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className={`border border-slate-300 py-1.5 px-2 text-center font-semibold ${
                                        c.startsWith('LUNAS')
                                          ? 'text-emerald-700 bg-emerald-50/40'
                                          : c.startsWith('—')
                                            ? 'text-slate-400'
                                            : 'text-rose-600'
                                      }`}
                                    >
                                      {c}
                                    </td>
                                  ))}
                                  <td className="border border-slate-300 py-1.5 px-2.5 text-right font-mono">{formatRp(targetAmount)}</td>
                                  <td className="border border-slate-300 py-1.5 px-2.5 text-right font-mono font-bold text-emerald-800">{formatRp(totalPaid)}</td>
                                  <td className="border border-slate-300 py-1.5 px-2.5 text-center font-bold text-[10px]">
                                    {isAll
                                      ? activeWeeks.length < 4
                                        ? 'LUNAS (M3-M4)'
                                        : 'LUNAS PENUH'
                                      : `KURANG ${formatRp(targetAmount - totalPaid)}`}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="bg-emerald-50 font-extrabold text-emerald-950">
                              <td className="border border-slate-300 py-2 px-2" />
                              <td className="border border-slate-300 py-2 px-3">TOTAL KESELURUHAN</td>
                              <td colSpan={5} className="border border-slate-300 py-2 px-2 text-center text-slate-600">
                                {matrix.length} Anggota Aktif
                              </td>
                              <td className="border border-slate-300 py-2 px-2.5 text-right font-mono">{formatRp(totalTargetAllMembers)}</td>
                              <td className="border border-slate-300 py-2 px-2.5 text-right font-mono">{formatRp(totalPaidAllMembers)}</td>
                              <td className="border border-slate-300 py-2 px-2.5 text-center text-[10px]">
                                {totalUnpaidAllMembers === 0 ? '100% LUNAS' : `TUNGGAKAN ${formatRp(totalUnpaidAllMembers)}`}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}

                      {excelSheetTab === 'pengeluaran' && (
                        <table className="w-full text-xs border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 font-mono text-[10px]">
                              <th className="border border-slate-300 py-1 px-2 text-center">A (No)</th>
                              <th className="border border-slate-300 py-1 px-3 text-left">B (Tanggal)</th>
                              <th className="border border-slate-300 py-1 px-2 text-left">C (Hari)</th>
                              <th className="border border-slate-300 py-1 px-2 text-center">D (Minggu)</th>
                              <th className="border border-slate-300 py-1 px-3 text-left">E (Kategori)</th>
                              <th className="border border-slate-300 py-1 px-2 text-left">F (PIC)</th>
                              <th className="border border-slate-300 py-1 px-3 text-left">G (Keterangan)</th>
                              <th className="border border-slate-300 py-1 px-3 text-right">H (Nominal Rp)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {verifiedExpenses.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="border border-slate-300 py-4 text-center text-slate-500">
                                  Belum ada pengeluaran terverifikasi bulan ini
                                </td>
                              </tr>
                            ) : (
                              verifiedExpenses.map((exp, idx) => (
                                <tr key={exp.id} className="hover:bg-slate-50">
                                  <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">{idx + 1}</td>
                                  <td className="border border-slate-300 py-1.5 px-3 font-mono">{exp.date}</td>
                                  <td className="border border-slate-300 py-1.5 px-2">{exp.day_name}</td>
                                  <td className="border border-slate-300 py-1.5 px-2 text-center font-bold">M{exp.week}</td>
                                  <td className="border border-slate-300 py-1.5 px-3 font-bold">{exp.category}</td>
                                  <td className="border border-slate-300 py-1.5 px-2">{exp.pic || '-'}</td>
                                  <td className="border border-slate-300 py-1.5 px-3 text-slate-600">{exp.notes || '-'}</td>
                                  <td className="border border-slate-300 py-1.5 px-3 text-right font-mono font-bold text-rose-700">
                                    {formatRp(exp.amount)}
                                  </td>
                                </tr>
                              ))
                            )}
                            <tr className="bg-rose-50 font-extrabold text-rose-950">
                              <td className="border border-slate-300 py-2 px-2" />
                              <td colSpan={6} className="border border-slate-300 py-2 px-3">
                                TOTAL PENGELUARAN OPERASIONAL BULAN INI ({verifiedExpenses.length} Transaksi)
                              </td>
                              <td className="border border-slate-300 py-2 px-3 text-right font-mono">
                                {formatRp(summary.monthlyExpense)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Pop-Up Bottom Action Bar (View Only / Close vs Download File) */}
              <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Kamu bisa membaca laporan langsung di layar ini, atau klik tombol di kanan jika ingin mengunduh file ke perangkatmu.
                  </span>
                </div>

                <div className="w-full sm:w-auto flex items-center space-x-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewFormat(null)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    Tutup Preview (Tanpa Download)
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDownload}
                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white shadow-lg transition flex items-center justify-center space-x-2 active:scale-95 ${
                      previewFormat === 'pdf'
                        ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {previewFormat === 'pdf'
                        ? `Ya, Download PDF (${monthName})`
                        : `Ya, Download Excel (${monthName})`}
                    </span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
