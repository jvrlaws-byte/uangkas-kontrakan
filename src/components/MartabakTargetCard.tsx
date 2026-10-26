import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Utensils, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { SummaryData } from '../types';

interface MartabakTargetCardProps {
  summary: SummaryData;
  isAdmin: boolean;
  onExecuteMartabak: () => void;
  onRequestAdminLogin: (attemptedAction?: string) => void;
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
    if (isReady && currentBalance >= 100000) {
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
  }, [isReady, currentBalance]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 shadow-xl ${
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          
          {/* Title & Icon */}
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner shrink-0 ${
                isReady
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-600 shadow-amber-400/40 animate-bounce'
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}
            >
              🥞
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 shrink-0" />
                  Target Martabak
                </span>
                {isReady ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Siap Beli!
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Target Rp 100rb
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-lg font-extrabold text-white mt-0.5 truncate">
                {isReady
                  ? 'Siap Beli Martabak! 🎉'
                  : 'Kumpulkan Saldo Rp 100rb'}
              </h2>
            </div>
          </div>

          {/* Action Button or Desktop Remaining Status */}
          {isReady ? (
            <div className="w-full sm:w-auto">
              {isAdmin ? (
                <button
                  onClick={onExecuteMartabak}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
                >
                  <Utensils className="w-4 h-4 mr-1.5" />
                  Beli Martabak! 🥞
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={() => onRequestAdminLogin('Mencoba eksekusi Beli Martabak Rp 100.000')}
                  className="w-full sm:w-auto bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 rounded-xl text-center transition active:scale-95"
                >
                  <span className="text-xs font-bold text-amber-300 block">
                    🎉 Siap Beli Martabak!
                  </span>
                  <span className="text-[10px] text-amber-400/80 block">
                    Minta Vier (Admin) catat
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="hidden sm:block text-right shrink-0">
              <span className="text-[11px] text-slate-400 block">Kurang</span>
              <span className="text-sm font-bold text-amber-400">
                Rp {martabak.remainingToTarget.toLocaleString('id-ID')}
              </span>
            </div>
          )}

        </div>

        {/* Progress Bar & Stats */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
            <div className="flex items-center space-x-1 text-slate-300 min-w-0 truncate">
              <span>Saldo:</span>
              <span className="font-extrabold text-white text-xs sm:text-sm">
                Rp {currentBalance.toLocaleString('id-ID')}
              </span>
              <span className="text-slate-500 text-[11px]">/ 100rb</span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {!isReady && (
                <span className="text-[11px] text-amber-400/90 font-semibold sm:hidden">
                  Kurang Rp {martabak.remainingToTarget.toLocaleString('id-ID')}
                </span>
              )}
              <span className="font-extrabold text-amber-400 text-xs sm:text-sm bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                {progressPercent}%
              </span>
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

          {/* Milestone Notes */}
          <div className="mt-2.5">
            {isReady ? (
              <p className="text-amber-200/90 font-medium flex items-center text-[11px] sm:text-xs">
                ✨ Saldo sisa cukup! Siap dibelikan martabak bareng anak kontrakan.
              </p>
            ) : (
              <p className="text-slate-400 flex items-start sm:items-center text-[11px] sm:text-xs leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
                <span>Saldo sisa di luar belanja rutin (air, sabun, tissue, gas) dipakai beli martabak bareng.</span>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
