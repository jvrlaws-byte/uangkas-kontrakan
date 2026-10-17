import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  ArrowLeft,
  Smartphone, 
  Wifi, 
  Copy, 
  Check, 
  Sparkles, 
  Share2,
  Apple
} from 'lucide-react';
import { SystemInfo } from '../types';

interface AndroidConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemInfo: SystemInfo | null;
}

export const AndroidConnectModal: React.FC<AndroidConnectModalProps> = ({
  isOpen,
  onClose,
  systemInfo,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ modal: 'connect' }, '');
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

  const mobileUrl = systemInfo?.mobileUrl || window.location.origin;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
        
        {/* Mobile Drag Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-slate-850 shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Sticky Header (Never Cut Off on Mobile) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-850 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-white truncate">
                Akses HP Android & iPhone
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Terhubung real-time ke database kas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
          
          {/* Main QR Code & URL Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-850 p-4 rounded-2xl border border-slate-800">
            
            {/* Left: QR Code */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200">
                <QRCodeSVG
                  value={mobileUrl}
                  size={135}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-[11px] font-semibold text-slate-300 mt-2 flex items-center">
                <Wifi className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
                Scan Kamera Android / iPhone
              </p>
            </div>

            {/* Right: URL & Connection info */}
            <div className="space-y-3 min-w-0">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-1">
                  Link Akses Aplikasi:
                </span>
                <div className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <code className="text-xs text-emerald-400 font-mono flex-1 truncate">
                    {mobileUrl}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0"
                    title="Salin Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-[11px] text-blue-200 space-y-1">
                <div className="flex items-center font-bold text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 mr-1 shrink-0" /> Sinkronisasi Real-Time:
                </div>
                <p className="leading-relaxed">
                  Vier (Admin) & teman kontrakan terhubung otomatis tanpa perlu reload.
                </p>
              </div>
            </div>

          </div>

          {/* Platform Tab Switcher: Android vs iOS */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Pasang ke Layar HP:
              </span>
              <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex">
                <button
                  onClick={() => setActivePlatform('android')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center ${
                    activePlatform === 'android'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🤖 Android
                </button>
                <button
                  onClick={() => setActivePlatform('ios')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center ${
                    activePlatform === 'ios'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Apple className="w-3 h-3 mr-1" />
                  iPhone (iOS)
                </button>
              </div>
            </div>

            {/* Android Instructions */}
            {activePlatform === 'android' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex sm:block items-start space-x-2.5 sm:space-x-0 sm:space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Buka di Chrome</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Buka link di atas pada browser Google Chrome Android.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex sm:block items-start space-x-2.5 sm:space-x-0 sm:space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Pilih "Install Aplikasi"</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Klik menu titik tiga Chrome (⋮) lalu tekan <strong>"Install aplikasi"</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex sm:block items-start space-x-2.5 sm:space-x-0 sm:space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Siap Dipakai!</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Ikon aplikasi langsung muncul di layar utama HP kamu.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* iOS iPhone Instructions */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex sm:block items-start space-x-2.5 sm:space-x-0 sm:space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Buka di Safari</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Buka link alamat di atas menggunakan browser <strong>Safari</strong> iPhone.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex sm:block items-start space-x-2.5 sm:space-x-0 sm:space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Tekan Tombol Share</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Tekan ikon <strong>Share</strong> (<Share2 className="w-3 h-3 inline text-blue-400" />) di bilah bawah Safari.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex sm:block items-start space-x-2.5 sm:space-x-0 sm:space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Add to Home Screen</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Pilih <strong>"Add to Home Screen"</strong>. Aplikasi siap di layar iPhone!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Sticky Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-850 shrink-0 pb-safe">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700 transition flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Tutup</span>
          </button>
        </div>

      </div>
    </div>
  );
};
