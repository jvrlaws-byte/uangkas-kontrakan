import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ShieldCheck, ShieldAlert, Clock, Check, ArrowLeft, Trash2, Smartphone, Receipt, User } from 'lucide-react';
import { PendingVerificationItem, SecurityAlertItem, Expense } from '../types';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingList: PendingVerificationItem[];
  pendingExpenses?: Expense[];
  securityAlerts?: SecurityAlertItem[];
  year: number;
  month: number;
  onVerifySingle: (id: string, approve: boolean) => Promise<void>;
  onVerifyExpense?: (id: string, approve: boolean) => Promise<void>;
  onVerifyAll: () => Promise<void>;
  onClearSecurityAlerts?: () => Promise<void>;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  pendingList,
  pendingExpenses = [],
  securityAlerts = [],
  year,
  month,
  onVerifySingle,
  onVerifyExpense,
  onVerifyAll,
  onClearSecurityAlerts,
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAll, setLoadingAll] = useState<boolean>(false);
  const [clearingSec, setClearingSec] = useState<boolean>(false);

  if (!isOpen) return null;

  const monthName = MONTH_NAMES[month - 1];
  const totalPendingCount = pendingList.length + pendingExpenses.length;

  const handleVerify = async (id: string, approve: boolean) => {
    setLoadingId(id);
    try {
      await onVerifySingle(id, approve);
    } finally {
      setLoadingId(null);
    }
  };

  const handleVerifyExp = async (id: string, approve: boolean) => {
    if (!onVerifyExpense) return;
    setLoadingId(id);
    try {
      await onVerifyExpense(id, approve);
    } finally {
      setLoadingId(null);
    }
  };

  const handleVerifyAll = async () => {
    if (window.confirm(`Setujui semua (${totalPendingCount}) antrean verifikasi (kas & pengeluaran)?`)) {
      setLoadingAll(true);
      try {
        await onVerifyAll();
        onClose();
      } finally {
        setLoadingAll(false);
      }
    }
  };

  const handleClearSecurity = async () => {
    if (!onClearSecurityAlerts) return;
    setClearingSec(true);
    try {
      await onClearSecurityAlerts();
    } finally {
      setClearingSec(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200 max-h-[90dvh] flex flex-col">
        
        {/* Mobile Drag Bar */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-slate-850 shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-slate-850 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white sm:hidden shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  Verifikasi Admin Vier
                </h3>
                {totalPendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                    {totalPendingCount} Menunggu
                  </span>
                )}
                {securityAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                    {securityAlerts.length} Keamanan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Iuran Kas, Pengeluaran & Keamanan ({monthName} {year})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 overscroll-contain">
          
          {/* 1. SECURITY ALERTS SECTION (Unauthorized Modification Attempts) */}
          {securityAlerts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-1.5" />
                  Peringatan Keamanan ({securityAlerts.length})
                </h4>
                {onClearSecurityAlerts && (
                  <button
                    onClick={handleClearSecurity}
                    disabled={clearingSec}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-300 flex items-center bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition active:scale-95"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {clearingSec ? 'Menghapus...' : 'Bersihkan'}
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                {securityAlerts.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-3 rounded-xl bg-rose-950/35 border border-rose-500/30 flex items-start space-x-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-rose-200 leading-snug">
                        {sec.action}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-rose-300/80">
                        <span className="inline-flex items-center font-semibold">
                          <Smartphone className="w-3 h-3 mr-1" />
                          {sec.device_info}
                        </span>
                        <span>•</span>
                        <span className="font-mono">IP: {sec.ip_address}</span>
                        <span>•</span>
                        <span>{sec.created_at}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. PENDING EXPENSES SECTION (Pengeluaran Baru dari Teman) */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center">
              <Receipt className="w-4 h-4 mr-1.5" />
              Verifikasi Pengeluaran Baru ({pendingExpenses.length})
            </h4>

            {pendingExpenses.length === 0 ? (
              <div className="py-4 px-4 text-center bg-slate-850/60 rounded-2xl border border-slate-800/80 text-xs text-slate-400">
                Tidak ada laporan pengeluaran baru yang menunggu verifikasi.
              </div>
            ) : (
              pendingExpenses.map((exp) => {
                const isLoading = loadingId === exp.id;
                return (
                  <div
                    key={exp.id}
                    className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 font-bold flex items-center justify-center shrink-0 text-xs">
                        M{exp.week}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-sm text-white">
                            {exp.category}
                          </span>
                          <span className="text-xs font-extrabold text-rose-400">
                            -Rp {exp.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-0.5">
                          <span className="inline-flex items-center text-amber-300 font-semibold">
                            <User className="w-3 h-3 mr-1" />
                            PIC: {exp.pic || 'Teman'}
                          </span>
                          <span>•</span>
                          <span>{exp.day_name}, {exp.date}</span>
                        </div>
                        {exp.notes && (
                          <p className="text-[11px] text-slate-400 mt-1">
                            "{exp.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleVerifyExp(exp.id, false)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/70 transition active:scale-95 disabled:opacity-50"
                        title="Tolak & hapus pengeluaran ini"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1 inline" />
                        Tolak
                      </button>

                      <button
                        onClick={() => handleVerifyExp(exp.id, true)}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 flex items-center"
                        title="Setujui pengeluaran ini"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {isLoading ? 'Memproses...' : 'Setujui'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 3. PENDING KAS VERIFICATIONS SECTION */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center">
              <Clock className="w-4 h-4 mr-1.5" />
              Verifikasi Iuran Kas ({pendingList.length})
            </h4>

            {pendingList.length === 0 ? (
              <div className="py-4 px-4 text-center bg-slate-850/60 rounded-2xl border border-slate-800/80 text-xs text-slate-400">
                Tidak ada antrean pembayaran iuran kas.
              </div>
            ) : (
              pendingList.map((item) => {
                const isLoading = loadingId === item.id;
                return (
                  <div 
                    key={item.id}
                    className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">
                        M{item.week}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-white">
                            {item.member_name}
                          </span>
                          <span className="text-xs font-bold text-emerald-400">
                            Rp {item.amount.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-bold">
                            M{item.week}
                          </span>
                        </div>
                        
                        <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                          💵 {item.payer_note || 'Cash'}
                        </p>
                        
                        {item.claimed_at && (
                          <span className="text-[10px] text-slate-400 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(item.claimed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(item.claimed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleVerify(item.id, false)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/70 transition active:scale-95 disabled:opacity-50"
                        title="Tolak klaim pembayaran"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1 inline" />
                        Tolak
                      </button>

                      <button
                        onClick={() => handleVerify(item.id, true)}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 flex items-center"
                        title="Setujui dan ubah status jadi Lunas"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {isLoading ? 'Memproses...' : 'Setujui'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-850 shrink-0 flex items-center justify-between gap-3 pb-safe">
          {totalPendingCount > 0 ? (
            <>
              <span className="text-xs text-slate-400">
                Total: <strong>{totalPendingCount} menunggu</strong> ({pendingList.length} kas, {pendingExpenses.length} pengeluaran)
              </span>

              <button
                onClick={handleVerifyAll}
                disabled={loadingAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-md shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50 flex items-center shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {loadingAll ? 'Memproses...' : `Setujui Semua (${totalPendingCount})`}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              Tutup
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
