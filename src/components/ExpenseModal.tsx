import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, User, FileText, Check, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Expense, Member } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>, id?: string) => Promise<void>;
  editingExpense?: Expense | null;
  members: Member[];
  initialData?: Partial<Expense>;
  isAdmin?: boolean;
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const ORDERED_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DAY_TO_ISO_INDEX: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
  Minggu: 7,
};

const formatLocalIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  members,
  initialData,
  isAdmin = false,
}) => {
  const [date, setDate] = useState<string>('');
  const [dayName, setDayName] = useState<string>('Senin');
  const [week, setWeek] = useState<number>(1);
  const [category, setCategory] = useState<string>('Isi Ulang Air');
  const [amount, setAmount] = useState<number | ''>(5000);
  const [pic, setPic] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccessPending, setIsSuccessPending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Categories as specified: Isi Ulang Air (5.000), Sabun Cuci Piring (8.000), Tissue (10.000), Gas Masak (22.000), Martabak (100.000), Lain-lain
  const categories = [
    { name: 'Isi Ulang Air', defaultAmount: 5000, icon: '💧' },
    { name: 'Sabun Cuci Piring', defaultAmount: 8000, icon: '🧼' },
    { name: 'Tissue', defaultAmount: 10000, icon: '🧻' },
    { name: 'Gas Masak', defaultAmount: 22000, icon: '🍳' },
    { name: 'Martabak Kontrakan', defaultAmount: 100000, icon: '🥞' },
    { name: 'Lain-lain', defaultAmount: null, icon: '📦' },
  ];

  // Initialize form ONLY when modal opens or editingExpense/initialData changes
  useEffect(() => {
    if (!isOpen) return;
    setIsSuccessPending(false);
    setErrorMsg('');

    if (editingExpense) {
      setDate(editingExpense.date);
      setDayName(editingExpense.day_name);
      setWeek(editingExpense.week);
      setCategory(editingExpense.category);
      setAmount(editingExpense.amount);
      setPic(editingExpense.pic || '');
      setNotes(editingExpense.notes || '');
    } else {
      const today = new Date();
      const iso = formatLocalIsoDate(today);
      setDate(initialData?.date || iso);
      
      const dayIdx = today.getDay();
      setDayName(initialData?.day_name || INDO_DAYS[dayIdx]);
      
      const dayOfMonth = today.getDate();
      const calcWeek = Math.min(Math.ceil(dayOfMonth / 7), 4);
      setWeek(initialData?.week || calcWeek);

      const chosenCategory = initialData?.category || 'Isi Ulang Air';
      setCategory(chosenCategory);
      setAmount(initialData?.amount !== undefined ? initialData.amount : 5000);
      setPic(initialData?.pic || members[0]?.name || 'Bayu');
      setNotes(initialData?.notes || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingExpense, initialData]);

  // Android hardware back button & ESC key support
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ modal: 'expense' }, '');
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

  // Handle date change -> auto-calculate day and week (strictly 4 weeks)
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (newDate) {
      const d = new Date(newDate + 'T00:00:00');
      const detectedDay = INDO_DAYS[d.getDay()];
      setDayName(detectedDay);
      const dayOfMonth = d.getDate();
      setWeek(Math.min(Math.ceil(dayOfMonth / 7), 4));
    }
  };

  // Handle day selection -> automatically set real calendar date of that day in the current real week (Mon-Sun)
  const handleDayNameChange = (selectedDay: string) => {
    setDayName(selectedDay);
    const now = new Date();
    const todayIsoIdx = now.getDay() === 0 ? 7 : now.getDay();
    const targetIsoIdx = DAY_TO_ISO_INDEX[selectedDay] || todayIsoIdx;
    const diffDays = targetIsoIdx - todayIsoIdx;

    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffDays);
    const newDateStr = formatLocalIsoDate(targetDate);
    setDate(newDateStr);
    setWeek(Math.min(Math.ceil(targetDate.getDate() / 7), 4));
  };

  const handleSelectCategory = (catName: string, defaultNominal: number | null) => {
    setCategory(catName);
    if (!editingExpense && defaultNominal !== null) {
      setAmount(defaultNominal);
    }
    if (catName === 'Gas Masak' && (!notes || notes.toLowerCase().includes('gas'))) {
      setNotes('Refill gas masak 3kg');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!date || amount === '' || amount <= 0 || !category) {
      setErrorMsg('Mohon lengkapi tanggal, nominal, dan kategori pengeluaran.');
      return;
    }

    const d = new Date(date + 'T00:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          year,
          month,
          week,
          date,
          day_name: dayName,
          category,
          amount: Number(amount),
          pic,
          notes,
        },
        editingExpense ? editingExpense.id : undefined
      );

      if (!isAdmin && !editingExpense) {
        setIsSuccessPending(true);
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan catatan pengeluaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
        
        {/* Mobile Swipe / Drag Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-slate-850 shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-850 shrink-0">
          <h3 className="font-bold text-base sm:text-lg text-white flex items-center">
            {isSuccessPending
              ? '✅ Laporan Terkirim'
              : editingExpense
                ? '✏️ Edit Pengeluaran'
                : isAdmin
                  ? '📝 Catat Pengeluaran Kas'
                  : '📝 Lapor Pengeluaran Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Sleek Pop-Up Success View for Non-Admin (Roommate) */}
        {isSuccessPending ? (
          <div className="p-6 sm:p-8 text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-extrabold text-lg sm:text-xl text-white">
                Pengeluaran Berhasil Dilaporkan!
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                Laporan pengeluaran kamu sudah tercatat di sistem dan sedang menunggu verifikasi dari <strong className="text-amber-300">Vier (Admin)</strong>.
              </p>
            </div>

            {/* Submitted Expense Summary Box */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 text-left space-y-2 max-w-sm mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{category}</span>
                <span className="text-sm font-extrabold text-rose-400">
                  Rp {Number(amount).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                <span>📅 Hari {dayName}, {date} (M{week})</span>
                <span>👤 PIC: <strong className="text-slate-200">{pic || 'Teman'}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">Status: Menunggu Verifikasi Vier</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-sm mx-auto py-3 px-6 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
              >
                Oke, Mengerti
              </button>
            </div>
          </div>
        ) : (
          /* Scrollable Form Body */
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
            
            {!isAdmin && !editingExpense && (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 leading-relaxed">
                💡 <strong>Sistem Verifikasi Vier:</strong> Pengeluaran yang kamu masukkan akan dikirim ke <strong>Vier (Admin)</strong> untuk dicek dan diverifikasi terlebih dahulu.
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {/* Category Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <Tag className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Kebutuhan Kontrakan *
                </span>
                <span className="text-[11px] text-slate-400">Pilih salah satu</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const isSelected = category === cat.name || (cat.name === 'Gas Masak' && (category === 'Gas' || category === 'Gas LPG'));
                  return (
                    <button
                      type="button"
                      key={cat.name}
                      onClick={() => handleSelectCategory(cat.name, cat.defaultAmount)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition flex items-center space-x-2 ${
                        isSelected
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <div className="truncate">
                        <div className="truncate">{cat.name}</div>
                        {cat.defaultAmount && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Rp {cat.defaultAmount.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day of Week & Date Picker (Selecting Day auto-updates Date to real current week!) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Hari (Tanggal Ikut Otomatis) *
                </label>
                <CustomDropdown
                  size="md"
                  value={dayName}
                  onChange={(val) => handleDayNameChange(val)}
                  options={ORDERED_DAYS.map((d) => ({
                    value: d,
                    label: `Hari ${d}`,
                  }))}
                  buttonClassName="text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Tanggal Riil *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Amount & Week Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center">
                  <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Nominal (Rp) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="5000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base text-white font-extrabold focus:outline-none focus:border-emerald-500 tracking-tight"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Minggu Ke-
                </label>
                <CustomDropdown
                  size="md"
                  value={week}
                  onChange={(val) => setWeek(Number(val))}
                  options={[
                    { value: 1, label: 'Minggu 1 (M1)', badge: 'M1' },
                    { value: 2, label: 'Minggu 2 (M2)', badge: 'M2' },
                    { value: 3, label: 'Minggu 3 (M3)', badge: 'M3' },
                    { value: 4, label: 'Minggu 4 (M4)', badge: 'M4' },
                  ]}
                />
              </div>
            </div>

            {/* PIC (Siapa yang beli) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Siapa yang Beli (PIC)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {members.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPic(m.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      pic === m.name
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="Atau ketik nama pembeli..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Keterangan
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Isi ulang galon air minum depot dekat / Sunlight / Gas LPG 3kg / Tissue"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 pb-safe border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 sm:w-auto px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition text-center"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Mengirim...'
                    : editingExpense
                      ? 'Simpan'
                      : isAdmin
                        ? 'Simpan Pengeluaran'
                        : 'Kirim ke Verifikasi Vier'}
                </span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
