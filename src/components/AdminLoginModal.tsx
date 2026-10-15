import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import { api } from '../services/api';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (adminName: string) => void;
  adminName?: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  adminName = 'Vier',
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (!cleanPin) {
      setError('Masukkan PIN Admin');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.verifyAdminPin(cleanPin);
      onLoginSuccess(res.adminName || 'Vier');
      setPin('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'PIN Admin salah');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Masuk sebagai {adminName}
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold block">
                Akses Admin
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Masukkan PIN untuk membuka akses admin.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              PIN Admin
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                maxLength={12}
                autoFocus
                required
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Masukkan PIN"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-base text-white tracking-widest text-center font-mono focus:outline-none focus:border-emerald-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
            {error && (
              <p className="text-xs text-rose-400 font-medium mt-1.5 text-center">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !pin}
              className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-1"
            >
              <ShieldCheck className="w-4 h-4 mr-1" />
              <span>{isSubmitting ? 'Memeriksa...' : 'Buka Akses'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
