import React from 'react';
import { Home, Plus, Sparkles, FileText, Smartphone, Lock } from 'lucide-react';

interface MobileBottomNavProps {
  isAdmin: boolean;
  onOpenAddExpense: () => void;
  onRequestAdminLogin: () => void;
  onOpenReportModal: () => void;
  onOpenAndroidModal: () => void;
  onScrollToMartabak: () => void;
  onScrollToMatrix: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  isAdmin,
  onOpenAddExpense,
  onRequestAdminLogin,
  onOpenReportModal,
  onOpenAndroidModal,
  onScrollToMartabak,
  onScrollToMatrix,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
      {/* Background with blur and AMOLED dark styling */}
      <div className="bg-[#0b1120]/95 backdrop-blur-lg border-t border-slate-800/90 shadow-2xl px-4 pt-2 pb-safe">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          
          {/* 1. Iuran Kas */}
          <button
            onClick={onScrollToMatrix}
            className="flex flex-col items-center justify-center py-1 px-2 text-slate-400 hover:text-emerald-400 active:scale-95 transition"
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold">Iuran Kas</span>
          </button>

          {/* 2. Target Martabak */}
          <button
            onClick={onScrollToMartabak}
            className="flex flex-col items-center justify-center py-1 px-2 text-slate-400 hover:text-amber-400 active:scale-95 transition"
          >
            <Sparkles className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="text-[10px] font-semibold">Martabak</span>
          </button>

          {/* 3. CENTER FLOATING BUTTON: + Catat Pengeluaran */}
          <div className="relative -top-5">
            <button
              onClick={isAdmin ? onOpenAddExpense : onRequestAdminLogin}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-[#0b1120] active:scale-90 transition-transform ${
                isAdmin
                  ? 'bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-emerald-500/40'
                  : 'bg-gradient-to-tr from-slate-700 to-slate-600 text-amber-300 shadow-slate-900/60'
              }`}
              title={isAdmin ? 'Catat Pengeluaran' : 'Masuk Admin (Vier)'}
            >
              {isAdmin ? (
                <Plus className="w-7 h-7 stroke-[2.5]" />
              ) : (
                <Lock className="w-6 h-6 stroke-[2.2]" />
              )}
            </button>
          </div>

          {/* 4. Laporan & Export */}
          <button
            onClick={onOpenReportModal}
            className="flex flex-col items-center justify-center py-1 px-2 text-slate-400 hover:text-blue-400 active:scale-95 transition"
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold">Laporan</span>
          </button>

          {/* 5. Hubungkan Android & iOS */}
          <button
            onClick={onOpenAndroidModal}
            className="flex flex-col items-center justify-center py-1 px-2 text-slate-400 hover:text-indigo-400 active:scale-95 transition"
          >
            <Smartphone className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold">Hubungkan</span>
          </button>

        </div>
      </div>
    </div>
  );
};
