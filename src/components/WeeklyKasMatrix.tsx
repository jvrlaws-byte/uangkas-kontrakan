import React, { useState } from 'react';
import { 
  Check, 
  CheckCircle2, 
  CalendarCheck, 
  Sparkles, 
  LayoutGrid, 
  Table, 
  Lock, 
  Clock, 
  Send, 
  ShieldCheck, 
  XCircle,
  AlertCircle 
} from 'lucide-react';
import { MemberWeeklyRow } from '../types';

interface WeeklyKasMatrixProps {
  matrix: MemberWeeklyRow[];
  year: number;
  month: number;
  isAdmin: boolean;
  pendingCount?: number;
  onTogglePayment: (memberId: number, week: number, isPaid: boolean) => Promise<void>;
  onBatchPayMonth: (memberId: number) => Promise<void>;
  onRequestAdminLogin: () => void;
  onOpenClaimModal: (memberId?: number, week?: number) => void;
  onOpenVerificationModal: () => void;
  onQuickVerify?: (id: string, approve: boolean) => Promise<void>;
}

export const WeeklyKasMatrix: React.FC<WeeklyKasMatrixProps> = ({
  matrix,
  year,
  month,
  isAdmin,
  pendingCount = 0,
  onTogglePayment,
  onBatchPayMonth,
  onRequestAdminLogin,
  onOpenClaimModal,
  onOpenVerificationModal,
  onQuickVerify,
}) => {
  const [loadingCell, setLoadingCell] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards'); // Default to cards on mobile

  const handleCellClick = async (memberId: number, week: number, isPaid: boolean, isPending: boolean, contribId: string, memberName: string) => {
    if (isAdmin) {
      if (isPending) {
        // Vier clicks a pending item -> directly ask to approve or reject
        const action = window.confirm(
          `Pembayaran M${week} ${memberName} (Rp 5.000) sedang menunggu verifikasi lo.\n\nKlik OK untuk SETUJUI / LUNAS.\nKlik Batal jika ingin mengecek detail klaim.`
        );
        if (action && onQuickVerify) {
          setLoadingCell(`${memberId}_${week}`);
          try {
            await onQuickVerify(contribId, true);
          } finally {
            setLoadingCell(null);
          }
        } else {
          onOpenVerificationModal();
        }
        return;
      }

      // Normal admin toggle
      const key = `${memberId}_${week}`;
      setLoadingCell(key);
      try {
        await onTogglePayment(memberId, week, !isPaid);
      } finally {
        setLoadingCell(null);
      }
    } else {
      // Roommate / Viewer mode
      if (isPending) {
        alert(`Pembayaran Minggu ${week} untuk ${memberName} sudah dilaporkan dan sedang menunggu verifikasi dari Vier.`);
        return;
      }
      if (isPaid) {
        alert(`Iuran Minggu ${week} untuk ${memberName} sudah Lunas dan terverifikasi oleh Vier.`);
        return;
      }
      // Unpaid -> open claim modal with pre-selected member & week
      onOpenClaimModal(memberId, week);
    }
  };

  const handleBatch = async (memberId: number) => {
    if (!isAdmin) {
      onRequestAdminLogin();
      return;
    }
    setLoadingCell(`batch_${memberId}`);
    try {
      await onBatchPayMonth(memberId);
    } finally {
      setLoadingCell(null);
    }
  };

  // Strictly 4 weeks per month as requested
  const weeks = [1, 2, 3, 4];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
      
      {/* Vier Pending Verification Notice Banner */}
      {isAdmin && pendingCount > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{pendingCount} Verifikasi Menunggu</span>
          </div>

          <button
            onClick={onOpenVerificationModal}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition active:scale-95 shrink-0 flex items-center"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Verifikasi
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 text-emerald-400" />
              Iuran Kas Mingguan
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Rp 5.000 / M
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin 
              ? 'Admin (Vier): Klik kotak untuk verifikasi atau ubah status.' 
              : 'Mode Teman: Klik kotak untuk lapor pembayaran ke Vier.'}
          </p>
        </div>

        {/* Action Buttons & View toggle */}
        <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-2">
          
          {/* Lapor Bayar Kas button (available for all roommates) */}
          <button
            onClick={() => onOpenClaimModal()}
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-95"
            title="Lapor kamu sudah transfer / bayar uang kas"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Lapor Sudah Bayar
          </button>

          {/* Verification Modal Trigger for Vier */}
          {isAdmin && pendingCount > 0 && (
            <button
              onClick={onOpenVerificationModal}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Verifikasi ({pendingCount})
            </button>
          )}

          {/* View toggle (Cards vs Table) for Mobile */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 sm:hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1" />
              Kartu
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5 mr-1" />
              Tabel
            </button>
          </div>

          {/* Legends */}
          <div className="hidden sm:flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Lunas</span>
            </div>
            <div className="flex items-center space-x-1 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse" />
              <span>Menunggu Verifikasi</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-600 inline-block" />
              <span>Belum</span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE CARD VIEW (Optimized for Android & iOS Touch Screens) */}
      <div className={`p-3 sm:hidden space-y-3 ${viewMode === 'cards' ? 'block' : 'hidden'}`}>
        {matrix.map((row) => {
          const { member, weeks: memberWeeks } = row;
          let totalPaid = 0;
          let paidCount = 0;
          let pendingInRow = 0;
          weeks.forEach((w) => {
            if (memberWeeks[w]?.is_paid) {
              totalPaid += memberWeeks[w]?.amount || 5000;
              paidCount++;
            } else if (memberWeeks[w]?.pending_verification === 1) {
              pendingInRow++;
            }
          });
          const isAllPaid = paidCount >= 4;

          return (
            <div
              key={member.id}
              className="bg-slate-850/80 border border-slate-700/70 rounded-2xl p-3.5 space-y-3 shadow-md"
            >
              {/* Member Row Top */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold text-white text-sm">{member.name}</h4>
                      {['vier', 'javier'].includes(member.name.toLowerCase()) && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                          Admin
                        </span>
                      )}
                      {pendingInRow > 0 && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-extrabold flex items-center">
                          <Clock className="w-2.5 h-2.5 mr-0.5" />
                          {pendingInRow} Verif
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Total: <strong className="text-emerald-400 font-bold">Rp {totalPaid.toLocaleString('id-ID')}</strong> / 20.000
                    </span>
                  </div>
                </div>

                <div>
                  {isAllPaid ? (
                    <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Lunas 1 Bln
                    </span>
                  ) : isAdmin ? (
                    <button
                      onClick={() => handleBatch(member.id)}
                      disabled={loadingCell === `batch_${member.id}`}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 active:scale-95 transition"
                    >
                      <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                      Lunas 1 Bln
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenClaimModal(member.id)}
                      className="inline-flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition"
                    >
                      <Send className="w-3 h-3 mr-1" /> Lapor
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Weeks Touch-Friendly Buttons */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Iuran Mingguan (M1 - M4):
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {weeks.map((w) => {
                    const contrib = memberWeeks[w];
                    const isPaid = contrib?.is_paid === 1;
                    const isPending = !isPaid && contrib?.pending_verification === 1;
                    const cellKey = `${member.id}_${w}`;
                    const isLoading = loadingCell === cellKey;

                    return (
                      <button
                        key={w}
                        onClick={() => handleCellClick(member.id, w, isPaid, isPending, contrib?.id || `${member.id}_${year}_${month}_${w}`, member.name)}
                        disabled={isLoading}
                        className={`h-12 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-0.5 active:scale-90 ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                            : isPending
                              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/20 animate-pulse'
                              : isAdmin
                                ? 'bg-slate-800 text-slate-400 border border-slate-700/80 hover:bg-slate-700'
                                : 'bg-slate-800/60 text-slate-400 border border-slate-700/60 hover:border-emerald-500/50'
                        } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                        title={
                          isPending 
                            ? `Menunggu verifikasi Vier (Klik untuk proses)` 
                            : isPaid 
                              ? `Lunas M${w}` 
                              : isAdmin 
                                ? `Tandai lunas M${w}` 
                                : `Klik untuk lapor sudah bayar M${w}`
                        }
                      >
                        <span className="text-xs font-extrabold opacity-90">M{w}</span>
                        {isPaid ? (
                          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                        ) : isPending ? (
                          <span className="text-[9px] text-amber-300 font-extrabold uppercase flex items-center">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            Verif
                          </span>
                        ) : isAdmin ? (
                          <span className="text-[11px] text-slate-300 font-bold">+5rb</span>
                        ) : (
                          <span className="text-[10px] text-emerald-400/90 font-medium">Lapor</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SPREADSHEET TABLE VIEW (Desktop / Tablet / Landscape) */}
      <div className={`overflow-x-auto ${viewMode === 'table' ? 'block' : 'hidden sm:block'}`}>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/60 text-slate-300 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold sticky left-0 bg-slate-900 z-10 w-44">
                Nama Anggota
              </th>
              {weeks.map((w) => (
                <th key={w} className="py-3 px-3 text-center font-bold min-w-[90px]">
                  M{w}
                </th>
              ))}
              <th className="py-3 px-4 text-right font-semibold min-w-[100px]">
                Total Bayar
              </th>
              <th className="py-3 px-4 text-center font-semibold min-w-[130px]">
                Status / Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {matrix.map((row) => {
              const { member, weeks: memberWeeks } = row;
              
              let totalPaid = 0;
              let paidCount = 0;
              weeks.forEach((w) => {
                if (memberWeeks[w]?.is_paid) {
                  totalPaid += memberWeeks[w]?.amount || 5000;
                  paidCount++;
                }
              });

              const isAllPaid = paidCount >= 4;

              return (
                <tr key={member.id} className="hover:bg-slate-800/30 transition">
                  
                  {/* Member Name */}
                  <td className="py-3.5 px-4 font-medium text-white sticky left-0 bg-slate-900/95 z-10">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 flex items-center space-x-1">
                          <span>{member.name}</span>
                          {['vier', 'javier'].includes(member.name.toLowerCase()) && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {isAllPaid ? (
                            <span className="text-emerald-400 font-medium">Lunas 4 Minggu ✓</span>
                          ) : (
                            <span className="text-amber-400/90 font-medium">{4 - paidCount} M belum</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Weeks 1 - 4 Columns */}
                  {weeks.map((w) => {
                    const contrib = memberWeeks[w];
                    const isPaid = contrib?.is_paid === 1;
                    const isPending = !isPaid && contrib?.pending_verification === 1;
                    const cellKey = `${member.id}_${w}`;
                    const isLoading = loadingCell === cellKey;

                    return (
                      <td key={w} className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleCellClick(member.id, w, isPaid, isPending, contrib?.id || `${member.id}_${year}_${month}_${w}`, member.name)}
                          disabled={isLoading}
                          className={`w-full py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1 active:scale-95 ${
                            isPaid
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/10'
                              : isPending
                                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 hover:bg-amber-500/35 animate-pulse'
                                : isAdmin
                                  ? 'bg-slate-800/80 text-slate-400 border border-slate-700/80 hover:bg-slate-700 hover:text-white'
                                  : 'bg-slate-800/40 text-slate-400 border border-slate-700/40 hover:border-emerald-500/50 hover:text-white'
                          } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                          title={
                            isPending 
                              ? `Menunggu verifikasi Vier` 
                              : isPaid 
                                ? `Lunas` 
                                : isAdmin 
                                  ? `Tandai lunas` 
                                  : `Klik untuk lapor bayar`
                          }
                        >
                          {isPaid ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                              <span>Rp 5.000</span>
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                              <span className="text-[11px] font-bold text-amber-300">
                                {isAdmin ? 'Verif Lo!' : 'Menunggu'}
                              </span>
                            </>
                          ) : isAdmin ? (
                            <span>+ Bayar</span>
                          ) : (
                            <span className="text-slate-400 group-hover:text-emerald-400">Lapor</span>
                          )}
                        </button>
                      </td>
                    );
                  })}

                  {/* Total Paid */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-white text-sm">
                      Rp {totalPaid.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">dari Rp 20.000</span>
                  </td>

                  {/* Batch Action */}
                  <td className="py-3.5 px-4 text-center">
                    {isAllPaid ? (
                      <span className="inline-flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Lengkap
                      </span>
                    ) : isAdmin ? (
                      <button
                        onClick={() => handleBatch(member.id)}
                        disabled={loadingCell === `batch_${member.id}`}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
                        title="Tandai bayar lunas seluruh 4 minggu bulan ini"
                      >
                        <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                        Lunas 1 Bulan
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenClaimModal(member.id)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition active:scale-95"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Lapor Bayar
                      </button>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 sm:p-4 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div>
          💡 <span className="font-medium text-slate-300">Sistem Verifikasi:</span> Pembayaran yang dilaporkan teman baru tercatat resmi setelah <strong>diverifikasi oleh Vier (Admin)</strong>.
        </div>
        {!isAdmin && (
          <button
            onClick={onRequestAdminLogin}
            className="text-emerald-400 hover:underline font-semibold flex items-center"
          >
            <Lock className="w-3 h-3 mr-1" /> Login Vier untuk Verifikasi
          </button>
        )}
      </div>

    </div>
  );
};
