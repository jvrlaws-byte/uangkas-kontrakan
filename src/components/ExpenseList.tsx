import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Edit3, 
  Droplet, 
  Sparkles, 
  ShoppingBag, 
  Filter, 
  User, 
  Flame, 
  Layers, 
  Clock,
  Check,
  X 
} from 'lucide-react';
import { Expense } from '../types';

interface ExpenseListProps {
  expenses: Expense[];
  isAdmin: boolean;
  onOpenAddModal: (preset?: Partial<Expense>) => void;
  onOpenEditModal: (expense: Expense) => void;
  onDeleteExpense: (id: string) => Promise<void>;
  onQuickAdd: (category: string, amount: number, dayName?: string, notes?: string) => Promise<void>;
  onVerifyExpense?: (id: string, approve: boolean) => Promise<void>;
  onRequestAdminLogin: (attemptedAction?: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  isAdmin,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteExpense,
  onVerifyExpense,
  onRequestAdminLogin,
}) => {
  const [filterWeek, setFilterWeek] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ exp: Expense; mode: 'delete' | 'reject' } | null>(null);

  // Indonesian day helper (no "Semua")
  const days = ['Hari', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Categories specific to this kontrakan (no "Semua")
  const categoriesList = [
    'Kategori',
    'Isi Ulang Air',
    'Sabun Cuci Piring',
    'Tissue',
    'Gas Masak',
    'Lain-lain'
  ];

  // Filtered expenses (strictly 4 weeks)
  const filtered = expenses.filter((exp) => {
    if (filterWeek !== 'all' && exp.week !== Number(filterWeek)) return false;
    if (filterDay !== 'all' && exp.day_name !== filterDay) return false;
    if (filterCategory !== 'all') {
      if (filterCategory === 'Gas Masak') {
        if (!exp.category.includes('Gas')) return false;
      } else if (exp.category !== filterCategory) {
        return false;
      }
    }
    return true;
  });

  const handleDelete = (exp: Expense) => {
    if (!isAdmin) {
      onRequestAdminLogin('Mencoba menghapus data pengeluaran kas');
      return;
    }
    setConfirmTarget({ exp, mode: 'delete' });
  };

  const executeConfirmedAction = async () => {
    if (!confirmTarget) return;
    const { exp, mode } = confirmTarget;
    if (mode === 'delete') {
      setDeletingId(exp.id);
      try {
        await onDeleteExpense(exp.id);
        setConfirmTarget(null);
      } finally {
        setDeletingId(null);
      }
    } else if (mode === 'reject' && onVerifyExpense) {
      setVerifyingId(exp.id);
      try {
        await onVerifyExpense(exp.id, false);
        setConfirmTarget(null);
      } finally {
        setVerifyingId(null);
      }
    }
  };

  const handleEdit = (exp: Expense) => {
    if (!isAdmin) {
      onRequestAdminLogin(`Mencoba mengedit pengeluaran (${exp.category})`);
      return;
    }
    onOpenEditModal(exp);
  };

  const handleVerify = async (exp: Expense, approve: boolean) => {
    if (!isAdmin || !onVerifyExpense) return;
    if (!approve) {
      setConfirmTarget({ exp, mode: 'reject' });
      return;
    }
    setVerifyingId(exp.id);
    try {
      await onVerifyExpense(exp.id, true);
    } finally {
      setVerifyingId(null);
    }
  };

  const getCategoryBadge = (category: string) => {
    if (category.includes('Air') || category.includes('Galon')) {
      return { bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', icon: Droplet, label: 'Isi Ulang Air' };
    }
    if (category.includes('Sabun')) {
      return { bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30', icon: ShoppingBag, label: 'Sabun Cuci Piring' };
    }
    if (category.includes('Tissue')) {
      return { bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', icon: Layers, label: 'Tissue' };
    }
    if (category.includes('Gas')) {
      return { bg: 'bg-orange-500/15 text-orange-300 border-orange-500/30', icon: Flame, label: 'Gas Masak' };
    }
    if (category.includes('Martabak')) {
      return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Sparkles, label: 'Martabak' };
    }
    return { bg: 'bg-slate-700/60 text-slate-300 border-slate-600', icon: ShoppingBag, label: category };
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden w-full">
      
      {/* Header & Quick Action Buttons */}
      <div className="p-4 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 text-rose-400" />
              Pengeluaran Kas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdmin
                ? 'Operasional: Air, Sabun, Tissue, Gas Masak & Lainnya.'
                : 'Teman bisa input pengeluaran baru (diverifikasi oleh Vier).'}
            </p>
          </div>

          <button
            onClick={() => onOpenAddModal()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {isAdmin ? '+ Catat Pengeluaran' : '+ Lapor Pengeluaran'}
          </button>
        </div>

        {/* ⚡ Quick Shortcut Buttons (Open to all roommates — verified by Vier if !isAdmin) */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            ⚡ Shortcut Rutin:
          </span>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
            
            {/* Isi Air */}
            <button
              onClick={() => {
                onOpenAddModal({
                  category: 'Isi Ulang Air',
                  amount: 5000,
                  notes: 'Isi ulang air galon',
                });
              }}
              className="inline-flex items-center justify-center sm:justify-start px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/70 transition active:scale-95 shadow-sm truncate"
              title="Catat isi ulang air"
            >
              <Droplet className="w-3.5 h-3.5 mr-1 text-cyan-400 shrink-0" />
              <span className="truncate">+ Isi Air</span>
            </button>

            {/* Sabun Cuci Piring */}
            <button
              onClick={() => {
                onOpenAddModal({
                  category: 'Sabun Cuci Piring',
                  amount: 8000,
                  notes: 'Beli sabun cuci piring',
                });
              }}
              className="inline-flex items-center justify-center sm:justify-start px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold bg-teal-950/60 hover:bg-teal-900/80 text-teal-300 border border-teal-800/70 transition active:scale-95 shadow-sm truncate"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1 text-teal-400 shrink-0" />
              <span className="truncate">+ Sabun Cuci</span>
            </button>

            {/* Tissue */}
            <button
              onClick={() => {
                onOpenAddModal({
                  category: 'Tissue',
                  amount: 10000,
                  notes: 'Beli tissue',
                });
              }}
              className="inline-flex items-center justify-center sm:justify-start px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/70 transition active:scale-95 shadow-sm truncate"
            >
              <Layers className="w-3.5 h-3.5 mr-1 text-indigo-400 shrink-0" />
              <span className="truncate">+ Tissue</span>
            </button>

            {/* Gas Masak */}
            <button
              onClick={() => {
                onOpenAddModal({
                  category: 'Gas Masak',
                  amount: 22000,
                  notes: 'Refill gas masak 3kg',
                });
              }}
              className="inline-flex items-center justify-center sm:justify-start px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold bg-orange-950/60 hover:bg-orange-900/80 text-orange-300 border border-orange-800/70 transition active:scale-95 shadow-sm truncate"
            >
              <Flame className="w-3.5 h-3.5 mr-1 text-orange-400 shrink-0" />
              <span className="truncate">+ Gas Masak</span>
            </button>
          </div>
        </div>

        {/* Filter Controls: Minggu -> Hari -> Kategori (No "Semua") */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 text-xs">
            <div className="hidden sm:flex items-center text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <span>Filter:</span>
            </div>

            {/* 1. Minggu */}
            <select
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              className={`min-w-0 w-full sm:w-auto bg-slate-800 border text-slate-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-medium text-xs transition ${
                filterWeek !== 'all' ? 'border-emerald-500/60 text-emerald-300 bg-emerald-950/20' : 'border-slate-700'
              }`}
            >
              <option value="all">Minggu</option>
              <option value="1">M1</option>
              <option value="2">M2</option>
              <option value="3">M3</option>
              <option value="4">M4</option>
            </select>

            {/* 2. Hari */}
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className={`min-w-0 w-full sm:w-auto bg-slate-800 border text-slate-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-medium text-xs transition ${
                filterDay !== 'all' ? 'border-emerald-500/60 text-emerald-300 bg-emerald-950/20' : 'border-slate-700'
              }`}
            >
              {days.map((d) => (
                <option key={d} value={d === 'Hari' ? 'all' : d}>
                  {d}
                </option>
              ))}
            </select>

            {/* 3. Kategori */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`min-w-0 w-full sm:w-auto bg-slate-800 border text-slate-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-medium text-xs truncate transition ${
                filterCategory !== 'all' ? 'border-emerald-500/60 text-emerald-300 bg-emerald-950/20' : 'border-slate-700'
              }`}
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat === 'Kategori' ? 'all' : cat}>
                  {cat}
                </option>
              ))}
            </select>

            {(filterWeek !== 'all' || filterDay !== 'all' || filterCategory !== 'all') && (
              <button
                onClick={() => {
                  setFilterWeek('all');
                  setFilterDay('all');
                  setFilterCategory('all');
                }}
                className="col-span-3 sm:col-span-1 inline-flex items-center justify-center text-[11px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 active:scale-95 transition mt-1 sm:mt-0"
                title="Reset filter"
              >
                <X className="w-3 h-3 mr-1" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE VIEW (< 640px) Specifically optimized for Android & iOS */}
      <div className="block sm:hidden divide-y divide-slate-800/80">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs px-4">
            Belum ada catatan pengeluaran di periode ini.
          </div>
        ) : (
          filtered.map((exp) => {
            const badge = getCategoryBadge(exp.category);
            const Icon = badge.icon;
            const isDeleting = deletingId === exp.id;
            const isPending = exp.pending_verification === 1;
            const isVerifying = verifyingId === exp.id;

            return (
              <div
                key={exp.id}
                className={`p-3.5 transition flex flex-col space-y-2 ${
                  isPending ? 'bg-amber-950/20 border-l-4 border-l-amber-400' : 'hover:bg-slate-800/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                      {exp.day_name}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      {exp.date}
                    </span>
                    <span className="text-[10px] text-slate-500">M{exp.week}</span>
                    {isPending && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        <Clock className="w-2.5 h-2.5 mr-0.5" />
                        Menunggu Verif
                      </span>
                    )}
                  </div>

                  {/* Nominal */}
                  <div className="text-right shrink-0">
                    <span className={`font-extrabold text-sm ${isPending ? 'text-amber-300' : 'text-rose-400'}`}>
                      -Rp {exp.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${badge.bg}`}>
                      <Icon className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate">{exp.category}</span>
                    </span>
                    {exp.pic && (
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <User className="w-3 h-3 mr-1 text-slate-500" />
                        {exp.pic}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {isPending && isAdmin ? (
                      <>
                        <button
                          onClick={() => handleVerify(exp, true)}
                          disabled={isVerifying}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center active:scale-95 transition"
                          title="Setujui Pengeluaran"
                        >
                          <Check className="w-3 h-3 mr-0.5" />
                          Setuju
                        </button>
                        <button
                          onClick={() => handleVerify(exp, false)}
                          disabled={isVerifying}
                          className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/50 active:scale-95 transition"
                          title="Tolak Pengeluaran"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(exp)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 active:bg-slate-700 transition"
                          title={isAdmin ? "Edit" : "Hanya Admin (Vier)"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 active:bg-rose-900/60 transition"
                          title={isAdmin ? "Hapus" : "Hanya Admin (Vier)"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {exp.notes && (
                  <p className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
                    {exp.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (>= 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/60 text-slate-300 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Hari & Tanggal</th>
              <th className="py-3 px-3 font-semibold">M</th>
              <th className="py-3 px-4 font-semibold">Kategori</th>
              <th className="py-3 px-4 font-semibold">PIC / Pembeli</th>
              <th className="py-3 px-4 font-semibold">Keterangan</th>
              <th className="py-3 px-4 text-right font-semibold">Nominal</th>
              <th className="py-3 px-4 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Belum ada catatan pengeluaran di periode atau filter ini.
                </td>
              </tr>
            ) : (
              filtered.map((exp) => {
                const badge = getCategoryBadge(exp.category);
                const Icon = badge.icon;
                const isDeleting = deletingId === exp.id;
                const isPending = exp.pending_verification === 1;
                const isVerifying = verifyingId === exp.id;

                return (
                  <tr
                    key={exp.id}
                    className={`transition ${
                      isPending ? 'bg-amber-950/20 hover:bg-amber-950/30' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    
                    {/* Day & Date */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          {exp.day_name}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                          {exp.date}
                        </span>
                        {isPending && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            <Clock className="w-3 h-3 mr-1" />
                            Menunggu Verifikasi
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Week (Strictly M1 - M4) */}
                    <td className="py-3.5 px-3 text-xs text-slate-400">
                      M{exp.week}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {exp.category}
                      </span>
                    </td>

                    {/* PIC */}
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {exp.pic ? (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{exp.pic}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate">
                      {exp.notes || '-'}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-bold text-sm ${isPending ? 'text-amber-300' : 'text-rose-400'}`}>
                        -Rp {exp.amount.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {isPending && isAdmin ? (
                          <>
                            <button
                              onClick={() => handleVerify(exp, true)}
                              disabled={isVerifying}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center transition active:scale-95"
                              title="Setujui Pengeluaran"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Setuju
                            </button>
                            <button
                              onClick={() => handleVerify(exp, false)}
                              disabled={isVerifying}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/50 transition"
                              title="Tolak Pengeluaran"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(exp)}
                              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
                              title={isAdmin ? "Edit Pengeluaran" : "Hanya Admin (Vier)"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(exp)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-lg hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                              title={isAdmin ? "Hapus Pengeluaran" : "Hanya Admin (Vier)"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Sleek Delete / Reject Confirmation Pop-Up Modal */}
      {confirmTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmTarget(null);
          }}
        >
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-base sm:text-lg text-white">
                {confirmTarget.mode === 'delete'
                  ? 'Hapus Catatan Pengeluaran?'
                  : 'Tolak Laporan Pengeluaran?'}
              </h4>
              <p className="text-xs text-slate-400">
                {confirmTarget.mode === 'delete'
                  ? 'Catatan ini akan dihapus permanen dan saldo kas akan otomatis disesuaikan.'
                  : 'Laporan pengeluaran dari teman ini akan ditolak dan dihapus dari daftar antrean.'}
              </p>
            </div>

            {/* Expense Detail Box */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-3.5 text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {confirmTarget.exp.category}
                </span>
                <span className="text-xs font-extrabold text-rose-400">
                  -Rp {confirmTarget.exp.amount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{confirmTarget.exp.day_name}, {confirmTarget.exp.date} (M{confirmTarget.exp.week})</span>
                <span>PIC: <strong className="text-slate-300">{confirmTarget.exp.pic || '-'}</strong></span>
              </div>
              {confirmTarget.exp.notes && (
                <p className="text-[11px] text-slate-500 truncate pt-1 border-t border-slate-800/80">
                  "{confirmTarget.exp.notes}"
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={Boolean(deletingId || verifyingId)}
                className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                disabled={Boolean(deletingId || verifyingId)}
                className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {deletingId || verifyingId
                    ? 'Menghapus...'
                    : confirmTarget.mode === 'delete'
                      ? 'Ya, Hapus'
                      : 'Ya, Tolak'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
