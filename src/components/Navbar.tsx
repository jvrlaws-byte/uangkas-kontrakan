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
  ShieldAlert,
  Lock,
  Eye,
  Clock
} from 'lucide-react';
import { SystemInfo } from '../types';

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
  securityCount?: number;
  onOpenVerificationModal?: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const Navbar: React.FC<NavbarProps> = ({
  currentYear,
  currentMonth,
  onChangeMonth,
  isAdmin,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenAndroidModal,
  onOpenReportModal,
  onOpenMemberModal,
  canInstallPwa,
  onInstallPwa,
  pendingCount = 0,
  securityCount = 0,
  onOpenVerificationModal,
}) => {
  const totalAdminAlerts = pendingCount + securityCount;

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0b1120]/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 h-14 sm:h-20">
          
          {/* 1. Logo & House Title (Compact & Non-Overflowing on Mobile) */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Home className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="font-extrabold text-sm sm:text-xl text-white tracking-tight truncate">
                  Kas Kontrakan
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  Rp 5.000 / M
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block truncate max-w-xs md:max-w-md">
                Bayu • Apip • Ian • Ray • Dola • <strong>Vier (Admin)</strong>
              </p>
            </div>
          </div>

          {/* 2. Month & Year Navigation (Ultra-Fit for All Mobile Screens) */}
          <div className="flex items-center bg-slate-800/90 rounded-xl p-0.5 sm:p-1 border border-slate-700/70 shadow-inner shrink-0">
            <button
              onClick={() => onChangeMonth(-1)}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <div className="px-1.5 sm:px-3.5 py-1 text-center min-w-[72px] sm:min-w-[125px]">
              <span className="font-bold text-[11px] sm:text-sm text-white whitespace-nowrap sm:hidden">
                {SHORT_MONTH_NAMES[currentMonth - 1]} {currentYear}
              </span>
              <span className="font-bold text-xs sm:text-sm text-white whitespace-nowrap hidden sm:inline">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </span>
            </div>
            <button
              onClick={() => onChangeMonth(1)}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* 3. Action Buttons & Role Badge */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            
            {/* Pending Verification / Security Pill for Vier */}
            {isAdmin && totalAdminAlerts > 0 && onOpenVerificationModal && (
              <button
                onClick={onOpenVerificationModal}
                className={`inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold shadow-md active:scale-95 transition animate-pulse ${
                  securityCount > 0
                    ? 'bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-400'
                    : 'bg-amber-500 text-slate-950 shadow-amber-500/30 hover:bg-amber-400'
                }`}
                title="Cek Verifikasi & Notifikasi Keamanan Admin"
              >
                {securityCount > 0 ? (
                  <ShieldAlert className="w-3.5 h-3.5 mr-1 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 mr-1 shrink-0" />
                )}
                <span>{totalAdminAlerts}</span>
                <span className="hidden sm:inline ml-1">Notif</span>
              </button>
            )}

            {/* Role Badge & Login / Logout Action */}
            {isAdmin ? (
              <button
                onClick={onLogoutAdmin}
                className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 active:scale-95 transition shadow-sm whitespace-nowrap"
                title="Kamu login sebagai Vier (Admin). Klik untuk keluar."
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />
                <span>Vier</span>
                <Lock className="w-3 h-3 ml-1 text-amber-400/80 hidden sm:inline" />
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 border border-slate-700 transition whitespace-nowrap"
                title="Masuk sebagai Vier (Admin)"
              >
                <Lock className="w-3 h-3 mr-1 text-emerald-400 shrink-0" />
                <span>Admin</span>
              </button>
            )}

            {/* Install PWA Button (Desktop / Tablet in Navbar) */}
            {canInstallPwa && (
              <button
                onClick={onInstallPwa}
                className="hidden sm:inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition"
                title="Download / Pasang Aplikasi di HP"
              >
                <Download className="w-4 h-4 mr-1" />
                <span>Install App</span>
              </button>
            )}

            {/* Connect Devices (Desktop only - on Mobile it's in Bottom Nav!) */}
            <button
              onClick={onOpenAndroidModal}
              className="hidden sm:inline-flex items-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition"
              title="Hubungkan ke HP Android & iPhone iOS"
            >
              <Smartphone className="w-4 h-4 mr-1.5" />
              <span className="hidden md:inline">Android & iOS</span>
              <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Reports (Desktop only - on Mobile it's in Bottom Nav!) */}
            <button
              onClick={onOpenReportModal}
              className="hidden sm:inline-flex items-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Laporan Kas"
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
