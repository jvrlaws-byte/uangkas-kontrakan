import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Utensils, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { SummaryData } from '../types';

interface MartabakTargetCardProps {
  summary: SummaryData;
  isAdmin: boolean;
  onExecuteMartabak: () => void;
  onRequestAdminLogin: () => void;
}

export const MartabakTargetCard: React.FC<MartabakTargetCardProps> = ({
  summary,
  isAdmin,
  onExecuteMartabak,
  onRequestAdminLogin,
}) => {
  const { martabak, currentBalance } = summary;
  const isReady = martabak.isReady;
  const progressPercent = Math.min(Math.max(Math.round((currentBalance / martabak.target) * 100), 0), 100);

  // Trigger celebration confetti when target is reached
  useEffect(() => {
    if (isReady && currentBalance >= 50000) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#eab308', '#22c55e', '#ffffff'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isReady]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 shadow-xl ${
        isReady
          ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-amber-900/40 border-amber-500/50 shadow-amber-500/10'
          : 'bg-gradient-to-br from-slate-900 via-slate-800/90 to-slate-900 border-slate-700/60'
      }`}
    >
      {/* Decorative background glow */}
      {isReady && (
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Title & Icon */}
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner ${
                isReady
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-600 shadow-amber-400/40 animate-bounce'
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}
            >
              🥞
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Target Martabak
                </span>
                {isReady ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Siap Beli!
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Target Rp 50rb
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {isReady
                  ? `Siap Beli Martabak! 🎉`
                  : `Kumpulkan Saldo Rp 50rb`}
              </h2>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {isReady ? (
              isAdmin ? (
                <button
                  onClick={onExecuteMartabak}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Utensils className="w-4 h-4 mr-1.5" />
                  Beli Martabak! 🥞
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl text-center">
                  <span className="text-xs font-bold text-amber-300 block">
                    🎉 Siap Beli Martabak!
                  </span>
                  <span className="text-[10px] text-amber-400/80">
                    Minta Vier (Admin) catat
                  </span>
                </div>
              )
            ) : (
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Kurang</span>
                <span className="text-xs sm:text-sm font-bold text-amber-400">
                  Rp {martabak.remainingToTarget.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Progress Bar & Stats */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-300">
              <span>Saldo:</span>
              <span className="font-bold text-white text-sm">
                Rp {currentBalance.toLocaleString('id-ID')}
              </span>
              <span className="text-slate-500 text-[11px]">/ Rp 50rb</span>
            </div>
            <div className="font-bold text-amber-400 text-xs sm:text-sm">
              {progressPercent}%
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isReady
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-md shadow-amber-400/50'
                  : 'bg-gradient-to-r from-emerald-500 to-amber-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Milestone Notes (Updated to match our shortcuts) */}
          <div className="mt-2.5 text-xs">
            {isReady ? (
              <p className="text-amber-200/90 font-medium flex items-center text-xs">
                ✨ Saldo sisa cukup! Siap dibelikan martabak bareng anak kontrakan.
              </p>
            ) : (
              <p className="text-slate-400 flex items-center text-[11px] sm:text-xs">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0 inline" />
                Saldo sisa di luar belanja rutin (air, sabun, tissue, gas) dipakai beli martabak bareng.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
