import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, User, FileText, Check, Droplets, Sparkles } from 'lucide-react';
import { Expense, Member } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>, id?: string) => Promise<void>;
  editingExpense?: Expense | null;
  members: Member[];
  initialData?: Partial<Expense>;
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  members,
  initialData,
}) => {
  const [date, setDate] = useState<string>('');
  const [dayName, setDayName] = useState<string>('Senin');
  const [week, setWeek] = useState<number>(1);
  const [category, setCategory] = useState<string>('Isi Ulang Air');
  const [amount, setAmount] = useState<number | ''>(5000);
  const [pic, setPic] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Categories as specified: Isi Ulang Air, Sabun Cuci Piring, Tissue, Gas, Martabak, Lain-lain
  const categories = [
    { name: 'Isi Ulang Air', defaultAmount: 5000, icon: '💧' },
    { name: 'Sabun Cuci Piring', defaultAmount: 15000, icon: '🧼' },
    { name: 'Tissue', defaultAmount: 10000, icon: '🧻' },
    { name: 'Gas Masak', defaultAmount: 22000, icon: '🍳' },
    { name: 'Martabak Kontrakan', defaultAmount: 50000, icon: '🥞' },
    { name: 'Lain-lain', defaultAmount: null, icon: '📦' },
  ];

  // Initialize form
  useEffect(() => {
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
      const iso = today.toISOString().split('T')[0];
      setDate(initialData?.date || iso);
      
      const dayIdx = today.getDay();
      setDayName(initialData?.day_name || INDO_DAYS[dayIdx]);
      
      const dayOfMonth = today.getDate();
      const calcWeek = Math.min(Math.ceil(dayOfMonth / 7), 4);
      setWeek(initialData?.week || calcWeek);

      const chosenCategory = initialData?.category || 'Isi Ulang Air';
      setCategory(chosenCategory);
      setAmount(initialData?.amount !== undefined ? initialData.amount : (chosenCategory === 'Isi Ulang Air' ? 5000 : 5000));
      setPic(initialData?.pic || (members[0]?.name || ''));
      setNotes(initialData?.notes || '');
    }
  }, [editingExpense, initialData, isOpen, members]);

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
    if (!date || amount === '' || amount <= 0 || !category) {
      alert('Mohon lengkapi tanggal, nominal, dan kategori');
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
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
        
        {/* Mobile Swipe / Drag Handle (Poco X7 Pro ergonomics) */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden bg-slate-850">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-850">
          <h3 className="font-bold text-base sm:text-lg text-white flex items-center">
            {editingExpense ? '✏️ Edit Pengeluaran' : '📝 Catat Pengeluaran Kas'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Category Chips (Spesifik: Isi Ulang Air, Sabun Cuci Piring, Tissue, Gas, Martabak, Lain-lain) */}
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

          {/* Date & Day of Week Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Tanggal *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hari (Otomatis) *
              </label>
              <select
                value={dayName}
                onChange={(e) => setDayName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              >
                {INDO_DAYS.map((d) => (
                  <option key={d} value={d}>
                    Hari {d}
                  </option>
                ))}
              </select>
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
              <select
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>M1</option>
                <option value={2}>M2</option>
                <option value={3}>M3</option>
                <option value={4}>M4</option>
              </select>
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
              placeholder="Misal: Isi ulang galon air minum depot dekat / Sunlight 750ml / Gas LPG 3kg / Tissue Nice"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons (Sticky at bottom for mobile) */}
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
              <span>{isSubmitting ? 'Menyimpan...' : editingExpense ? 'Simpan' : 'Simpan Pengeluaran'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
