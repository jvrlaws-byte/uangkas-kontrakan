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
  Eye
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
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setExpensePage(1);
  }, [month, year, isOpen]);

  if (!isOpen) return null;

  const monthName = MONTH_NAMES[month - 1];
  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;
  const verifiedExpenses = expenses.filter((e) => e.pending_verification !== 1);
  const totalExpensePages = Math.max(1, Math.ceil(verifiedExpenses.length / REPORT_EXPENSES_PER_PAGE));
  const safeExpensePage = Math.min(expensePage, totalExpensePages);
  const expStartIdx = (safeExpensePage - 1) * REPORT_EXPENSES_PER_PAGE;
  const paginatedVerifiedExpenses = verifiedExpenses.slice(expStartIdx, expStartIdx + REPORT_EXPENSES_PER_PAGE);

  const handleDownloadExcel = () => {
    exportToExcel(year, month, summary, matrix, verifiedExpenses);
  };

  const handleDownloadPdf = () => {
    exportToPdf(year, month, summary, matrix, verifiedExpenses);
  };

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

        {/* Header with Clear Back, Month Switcher & Close Buttons */}
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

            {/* Quick Export & Close Buttons */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={handleDownloadExcel}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                title="Download Excel Bulan Ini"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                Excel
              </button>

              <button
                onClick={handleDownloadPdf}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
                title="Download PDF Bulan Ini"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
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

          {/* Download Buttons */}
          <div className="w-full sm:w-auto order-1 sm:order-2 flex items-center space-x-2">
            <button
              onClick={handleDownloadExcel}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition flex items-center justify-center shadow-md shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Download Excel ({monthName})
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition flex items-center justify-center shadow-md shadow-blue-600/20"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Download PDF ({monthName})
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
