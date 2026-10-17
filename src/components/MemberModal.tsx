import React, { useState } from 'react';
import { X, Users, UserPlus, Trash2, CheckCircle2 } from 'lucide-react';
import { Member } from '../types';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAddMember: (name: string) => Promise<void>;
  onDeleteMember: (id: number) => Promise<void>;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddMember,
  onDeleteMember,
}) => {
  const [newName, setNewName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddMember(newName.trim());
      setNewName('');
    } catch (err: any) {
      alert(err.message || 'Gagal menambah anggota');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Yakin ingin menghapus ${name} dari daftar anak kontrakan?`)) {
      setDeletingId(id);
      try {
        await onDeleteMember(id);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-850 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-white">
              Daftar Anak Kontrakan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          
          {/* Add Member Form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Nama anak kontrakan baru..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Tambah
            </button>
          </form>

          {/* Members List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {members.map((m, index) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-xs text-slate-300 font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-bold text-sm text-slate-200">{m.name}</span>
                    <span className="text-[11px] text-emerald-400 block">Iuran: Rp 5.000 / M</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(m.id, m.name)}
                  disabled={deletingId === m.id}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                  title={`Hapus ${m.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
            Anggota bawaan kontrakan: <strong>Bayu, Apip, Ian, Ray, Dola, Vier (Admin)</strong>. Kamu bisa menambahkan anggota baru kapan saja jika ada teman baru yang masuk.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
