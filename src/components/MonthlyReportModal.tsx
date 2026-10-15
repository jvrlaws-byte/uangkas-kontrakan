import React, { useEffect } from 'react';
import { 
  X, 
  ArrowLeft,
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Receipt,
  CornerDownLeft
} from 'lucide-react';
import { MemberWeeklyRow, Expense, SummaryData } from '../types';
import { exportToExcel } from '../services/exportExcel';
import { exportToPdf } from '../services/exportPdf';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  summary: SummaryData;
  matrix: MemberWeeklyRow[];
  expenses: Expense[];
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
}) => {
  // Android Hardware / Gesture Back button support & ESC key
  useEffect(() => {
    if (!isOpen) return;

    // Push state for Android back navigation
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

  if (!isOpen) return null;

  const monthName = MONTH_NAMES[month - 1];
  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  const handleDownloadExcel = () => {
    exportToExcel(year, month, summary, matrix, expenses);
  };

  const handleDownloadPdf = () => {
    exportToPdf(year, month, summary, matrix, expenses);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
        
        {/* Mobile Drag / Swipe bar */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-slate-850">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header with Clear Back & Close Buttons */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-850 shrink-0">
          
          {/* Back Button for Android & Mobile */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition text-xs sm:text-sm font-semibold border border-slate-700 shadow-sm"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-1 text-emerald-400" />
              <span>Kembali</span>
            </button>

            <div>
              <h3 className="font-extrabold text-sm sm:text-lg text-white truncate max-w-[170px] sm:max-w-none">
                Laporan Kas
              </h3>
              <span className="text-[10px] sm:text-xs text-emerald-400 font-semibold block">
                {monthName} {year}
              </span>
            </div>
          </div>

          {/* Quick Export & Close Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleDownloadExcel}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              title="Download Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
              Excel
            </button>

            <button
              onClick={handleDownloadPdf}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
              title="Download PDF"
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

        {/* Scrollable Report Content Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Financial Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">Pemasukan</span>
              <div className="text-base sm:text-lg font-extrabold text-blue-400 mt-0.5">
                {formatRp(summary.monthlyIncome)}
              </div>
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">Pengeluaran</span>
              <div className="text-base sm:text-lg font-extrabold text-rose-400 mt-0.5">
                {formatRp(summary.monthlyExpense)}
              </div>
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">Saldo</span>
              <div className="text-base sm:text-lg font-extrabold text-emerald-400 mt-0.5">
                {formatRp(summary.currentBalance)}
              </div>
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">Martabak</span>
              <div className="text-xs sm:text-sm font-bold text-amber-400 mt-1">
                {summary.martabak.isReady ? `Siap Beli! 🥞` : `${summary.martabak.progress}%`}
              </div>
            </div>
          </div>

          {/* Section 1: Member Contribution Table Preview */}
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
              1. Iuran Kas
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
                    let total = 0;
                    [1, 2, 3, 4].forEach((w) => {
                      if (row.weeks[w]?.is_paid) total += row.weeks[w]?.amount || 5000;
                    });
                    const isAll = total >= 20000;

                    return (
                      <tr key={row.member.id}>
                        <td className="py-2 px-3 font-semibold text-white">
                          {row.member.name}
                          {row.member.name.toLowerCase() === 'vier' && (
                            <span className="ml-1 text-[10px] text-amber-400 font-bold">(Admin)</span>
                          )}
                        </td>
                        {[1, 2, 3, 4].map((w) => (
                          <td key={w} className="py-2 px-2 text-center">
                            {row.weeks[w]?.is_paid ? (
                              <span className="text-emerald-400 font-bold">✓</span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right font-bold text-slate-200">{formatRp(total)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isAll ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
                          }`}>
                            {isAll ? 'LUNAS' : 'NUNGGAK'}
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
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center">
              <Receipt className="w-4 h-4 mr-1.5 text-rose-400" />
              2. Pengeluaran
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-56">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800 text-slate-300 uppercase sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-2">M</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">PIC</th>
                    <th className="py-2.5 px-3">Ket</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500">
                        Belum ada pengeluaran bulan ini.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="py-2 px-3 text-white font-medium">
                          {exp.day_name}, {exp.date}
                        </td>
                        <td className="py-2 px-2 text-slate-400">M{exp.week}</td>
                        <td className="py-2 px-3 text-slate-300">{exp.category}</td>
                        <td className="py-2 px-3 text-slate-400">{exp.pic || '-'}</td>
                        <td className="py-2 px-3 text-slate-400 truncate max-w-xs">{exp.notes || '-'}</td>
                        <td className="py-2 px-3 text-right font-bold text-rose-400">
                          {formatRp(exp.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Sticky Mobile & Desktop Footer Navigation */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-850 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-safe">
          
          {/* Main Close Button */}
          <button
            onClick={onClose}
            className="w-full sm:w-auto order-2 sm:order-1 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 transition flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Tutup</span>
          </button>

          {/* Download Buttons */}
          <div className="w-full sm:w-auto order-1 sm:order-2 flex items-center space-x-2">
            <button
              onClick={handleDownloadExcel}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition flex items-center justify-center shadow-md shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Excel
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition flex items-center justify-center shadow-md shadow-blue-600/20"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              PDF
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
