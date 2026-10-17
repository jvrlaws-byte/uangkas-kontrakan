import React from 'react';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { SummaryData } from '../types';

interface SummaryCardsProps {
  summary: SummaryData;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
      
      {/* 1. Saldo Kas Bersih */}
      <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:border-slate-700 transition min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
            Sisa Saldo
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-base sm:text-2xl font-extrabold text-white tracking-tight truncate">
            {formatRp(summary.currentBalance)}
          </div>
          <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 truncate">
            Saldo aktif
          </p>
        </div>
      </div>

      {/* 2. Pemasukan Bulan Ini */}
      <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:border-slate-700 transition min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
            Pemasukan
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-base sm:text-2xl font-extrabold text-blue-400 tracking-tight truncate">
            +{formatRp(summary.monthlyIncome)}
          </div>
          <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 truncate">
            Total masuk
          </p>
        </div>
      </div>

      {/* 3. Pengeluaran Bulan Ini */}
      <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:border-slate-700 transition min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
            Pengeluaran
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-base sm:text-2xl font-extrabold text-rose-400 tracking-tight truncate">
            -{formatRp(summary.monthlyExpense)}
          </div>
          <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 truncate">
            Total keluar
          </p>
        </div>
      </div>

      {/* 4. Estimasi Tunggakan Kas */}
      <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:border-slate-700 transition min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
            Tunggakan
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-base sm:text-2xl font-extrabold text-amber-400 tracking-tight truncate">
            {formatRp(summary.unpaidAmount)}
          </div>
          <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400 truncate">
            {summary.unpaidAmount === 0 ? 'Semua lunas' : 'Belum lunas'}
          </p>
        </div>
      </div>

    </div>
  );
};
