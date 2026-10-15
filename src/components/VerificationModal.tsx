import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ShieldCheck, AlertCircle, Clock, Check, ArrowLeft, User } from 'lucide-react';
import { PendingVerificationItem } from '../types';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingList: PendingVerificationItem[];
  year: number;
  month: number;
  onVerifySingle: (id: string, approve: boolean) => Promise<void>;
  onVerifyAll: () => Promise<void>;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  pendingList,
  year,
  month,
  onVerifySingle,
  onVerifyAll,
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAll, setLoadingAll] = useState<boolean>(false);

  if (!isOpen) return null;

  const monthName = MONTH_NAMES[month - 1];

  const handleVerify = async (id: string, approve: boolean) => {
    setLoadingId(id);
    try {
      await onVerifySingle(id, approve);
    } finally {
      setLoadingId(null);
    }
  };

  const handleVerifyAll = async () => {
    if (window.confirm(`Setujui dan verifikasi semua (${pendingList.length}) pembayaran yang masuk?`)) {
      setLoadingAll(true);
      try {
        await onVerifyAll();
        onClose();
      } finally {
        setLoadingAll(false);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-850 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white sm:hidden mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Verifikasi Kas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {pendingList.length} Menunggu
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {monthName} {year}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {pendingList.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-sm">Tidak Ada Antrean</h4>
              <p className="text-xs text-slate-400">
                Semua pembayaran kas sudah diverifikasi.
              </p>
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
                      {isLoading ? 'Memproses...' : 'Setujui / Lunas'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer (Verify All option) */}
        {pendingList.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-850 shrink-0 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Total: <strong>{pendingList.length} klaim</strong> (Rp {(pendingList.length * 5000).toLocaleString('id-ID')})
            </span>

            <button
              onClick={handleVerifyAll}
              disabled={loadingAll}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-md shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50 flex items-center"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {loadingAll ? 'Memproses...' : `Setujui Semua (${pendingList.length})`}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
