import React from 'react';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { SummaryData } from '../types';

interface SummaryCardsProps {
  summary: SummaryData;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
      
      {/* 1. Saldo Kas Bersih */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Sisa Saldo
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <div className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
            {formatRp(summary.currentBalance)}
          </div>
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-400">
            Saldo aktif
          </p>
        </div>
      </div>

      {/* 2. Pemasukan Bulan Ini */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pemasukan
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <div className="text-lg sm:text-2xl font-extrabold text-blue-400 tracking-tight">
            +{formatRp(summary.monthlyIncome)}
          </div>
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-400">
            Total masuk
          </p>
        </div>
      </div>

      {/* 3. Pengeluaran Bulan Ini */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pengeluaran
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <div className="text-lg sm:text-2xl font-extrabold text-rose-400 tracking-tight">
            -{formatRp(summary.monthlyExpense)}
          </div>
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-400">
            Total keluar
          </p>
        </div>
      </div>

      {/* 4. Estimasi Tunggakan Kas */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tunggakan
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <div className="text-lg sm:text-2xl font-extrabold text-amber-400 tracking-tight">
            {formatRp(summary.unpaidAmount)}
          </div>
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-400">
            {summary.unpaidAmount === 0 ? 'Semua lunas' : 'Belum lunas'}
          </p>
        </div>
      </div>

    </div>
  );
};
