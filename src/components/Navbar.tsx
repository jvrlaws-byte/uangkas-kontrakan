import React from 'react';
import { 
  Home, 
  Smartphone, 
  FileSpreadsheet, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  ShieldCheck,
  Lock,
  Eye,
  Clock
} from 'lucide-react';
import { SystemInfo, UserRole } from '../types';

interface NavbarProps {
  currentYear: number;
  currentMonth: number;
  onChangeMonth: (delta: number) => void;
  systemInfo: SystemInfo | null;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenAndroidModal: () => void;
  onOpenReportModal: () => void;
  onOpenMemberModal: () => void;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  pendingCount?: number;
  onOpenVerificationModal?: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const Navbar: React.FC<NavbarProps> = ({
  currentYear,
  currentMonth,
  onChangeMonth,
  systemInfo,
  isAdmin,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenAndroidModal,
  onOpenReportModal,
  onOpenMemberModal,
  canInstallPwa,
  onInstallPwa,
  pendingCount = 0,
  onOpenVerificationModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0b1120]/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & House Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Home className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="font-extrabold text-base sm:text-xl text-white tracking-tight">
                  Kas Kontrakan
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Rp 5.000 / M
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block truncate max-w-xs md:max-w-md">
                Bayu • Apip • Ian • Ray • Dola • <strong>Vier (Admin)</strong>
              </p>
            </div>
          </div>

          {/* Month & Year Navigation (Compact on Mobile) */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 sm:p-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => onChangeMonth(-1)}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 sm:px-4 py-1.5 text-center min-w-[95px] sm:min-w-[130px]">
              <span className="font-bold text-xs sm:text-sm text-white">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </span>
            </div>
            <button
              onClick={() => onChangeMonth(1)}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons & Role Badge */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* Pending Verification Pill for Vier */}
            {isAdmin && pendingCount > 0 && onOpenVerificationModal && (
              <button
                onClick={onOpenVerificationModal}
                className="inline-flex items-center px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl text-xs font-extrabold bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 hover:bg-amber-400 active:scale-95 transition animate-pulse"
                title={`Ada ${pendingCount} pembayaran teman menunggu verifikasi lo`}
              >
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-950" />
                <span>{pendingCount} Verif</span>
              </button>
            )}

            {/* Role Badge & Login / Logout Action */}
            {isAdmin ? (
              <button
                onClick={onLogoutAdmin}
                className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition shadow-sm"
                title="Kamu login sebagai Vier (Admin). Klik untuk beralih ke Mode Teman (Lihat Saja)"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
                <span className="hidden sm:inline">Admin:</span> Vier
                <Lock className="w-3 h-3 ml-1 text-amber-400/80" />
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Masuk sebagai Vier untuk mengubah data"
              >
                <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span className="hidden sm:inline">Mode Teman</span>
                <span className="text-emerald-400 ml-1 font-bold">Login Admin</span>
              </button>
            )}

            {/* Install PWA Button */}
            {canInstallPwa && (
              <button
                onClick={onInstallPwa}
                className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition animate-bounce"
                title="Download / Pasang Aplikasi di Android / iPhone"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Install</span> App
              </button>
            )}

            {/* Connect Devices (Android & iOS) */}
            <button
              onClick={onOpenAndroidModal}
              className="inline-flex items-center p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition group"
              title="Hubungkan ke HP Android & iPhone iOS"
            >
              <Smartphone className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden md:inline">Android & iOS</span>
              <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block" />
            </button>

            {/* Reports */}
            <button
              onClick={onOpenReportModal}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition hidden sm:flex items-center"
              title="Laporan Bulanan, PDF & Excel"
            >
              <FileSpreadsheet className="w-4 h-4 sm:mr-1.5 text-emerald-400" />
              <span className="hidden md:inline">Laporan</span>
            </button>

            {/* Member Management (Admin only) */}
            {isAdmin && (
              <button
                onClick={onOpenMemberModal}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition hidden sm:block"
                title="Kelola Data Anggota Kontrakan"
              >
                <Users className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
