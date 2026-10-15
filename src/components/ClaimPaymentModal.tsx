import React, { useState, useEffect } from 'react';
import { X, Send, User, Calendar, CheckCircle2, DollarSign, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Member } from '../types';

interface ClaimPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  year: number;
  month: number;
  initialMemberId?: number;
  initialWeek?: number;
  onSubmitClaim: (data: {
    member_id: number;
    year: number;
    month: number;
    weeks: number[];
    payer_note: string;
  }) => Promise<void>;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const ClaimPaymentModal: React.FC<ClaimPaymentModalProps> = ({
  isOpen,
  onClose,
  members,
  year,
  month,
  initialMemberId,
  initialWeek,
  onSubmitClaim,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<number>(initialMemberId || members[0]?.id || 1);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>(initialWeek ? [initialWeek] : [1]);
  const [payerNote, setPayerNote] = useState<string>('Cash');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialMemberId) setSelectedMemberId(initialMemberId);
      if (initialWeek) setSelectedWeeks([initialWeek]);
      setIsSuccess(false);
    }
  }, [isOpen, initialMemberId, initialWeek]);

  // Android Back button support & ESC
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ modal: 'claim-payment' }, '');
    const handlePopState = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleWeek = (w: number) => {
    if (selectedWeeks.includes(w)) {
      if (selectedWeeks.length > 1) {
        setSelectedWeeks(selectedWeeks.filter((week) => week !== w));
      }
    } else {
      setSelectedWeeks([...selectedWeeks, w].sort((a, b) => a - b));
    }
  };

  const selectFullMonth = () => {
    setSelectedWeeks([1, 2, 3, 4]);
  };

  const totalAmount = selectedWeeks.length * 5000;
  const monthName = MONTH_NAMES[month - 1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWeeks.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmitClaim({
        member_id: selectedMemberId,
        year,
        month,
        weeks: selectedWeeks,
        payer_note: payerNote,
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1400);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim laporan pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white sm:hidden mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Lapor Bayar Kas
              </h3>
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

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg text-white">Laporan Berhasil Terkirim!</h4>
            <p className="text-xs text-slate-300">
              Notifikasi telah dikirim ke Vier (Admin). Pembayaran akan tercatat lunas setelah diverifikasi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* 1. Pilih Nama Teman */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Siapa yang Membayar?
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {members.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold transition border ${
                      selectedMemberId === m.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Pilih Minggu Pembayaran */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Bayar Untuk Minggu Ke-
                </label>
                <button
                  type="button"
                  onClick={selectFullMonth}
                  className="text-[11px] font-bold text-emerald-400 hover:underline"
                >
                  ⚡ 1 Bulan (M1-M4)
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((w) => {
                  const isChecked = selectedWeeks.includes(w);
                  return (
                    <button
                      type="button"
                      key={w}
                      onClick={() => toggleWeek(w)}
                      className={`py-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center ${
                        isChecked
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-sm font-extrabold">M{w}</span>
                      <span className="text-[10px] opacity-80">5rb</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Metode Pembayaran: Hanya Cash */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Metode Pembayaran
              </label>
              <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <span className="text-base">💵</span>
                <span className="text-xs font-bold">Cash (Uang Tunai ke Vier)</span>
              </div>
              <input
                type="text"
                value={payerNote}
                onChange={(e) => setPayerNote(e.target.value)}
                placeholder="Catatan tambahan (Opsional, contoh: Titip di meja)"
                className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Info Verification Notice */}
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-start space-x-2 text-xs text-amber-200/90">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Status menjadi <strong>"Menunggu Verifikasi"</strong> sampai uang cash diterima dan disetujui <strong>Vier</strong>.
              </span>
            </div>

            {/* Total & Submit Button */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Total Bayar
                </span>
                <span className="text-base font-extrabold text-white">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || selectedWeeks.length === 0}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center justify-center space-x-1.5"
              >
                <Send className="w-4 h-4 mr-1" />
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Laporan ke Vier 🚀'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
