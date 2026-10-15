import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Smartphone, 
  Wifi, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Globe, 
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

  if (!isOpen) return null;

  const mobileUrl = systemInfo?.mobileUrl || `http://${window.location.hostname}:3000`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-blue-950/70 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                Hubungkan ke Semua HP Android & iPhone iOS
              </h3>
              <p className="text-xs text-slate-400">
                Laptop, Android, dan iPhone terhubung langsung ke database kas yang sama!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Main QR Code & URL Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-850 p-5 rounded-2xl border border-slate-800">
            
            {/* Left: QR Code */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
                <QRCodeSVG
                  value={mobileUrl}
                  size={165}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs font-semibold text-slate-300 mt-2.5 flex items-center">
                <Wifi className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Scan via Kamera Android / iPhone
              </p>
            </div>

            {/* Right: URL & Connection info */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">
                  Alamat Akses di Jaringan WiFi Kontrakan:
                </span>
                <div className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <code className="text-xs sm:text-sm text-emerald-400 font-mono flex-1 truncate">
                    {mobileUrl}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Salin Alamat"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-200 space-y-1">
                <div className="flex items-center font-bold text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Sinkronisasi Real-Time:
                </div>
                <p>
                  Vier (Admin) dan seluruh teman kontrakan bisa membuka aplikasi ini bersamaan. Data kas ter-update live tanpa perlu reload!
                </p>
              </div>
            </div>

          </div>

          {/* Platform Tab Switcher: Android vs iOS */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Panduan Pemasangan:
              </span>
              <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex">
                <button
                  onClick={() => setActivePlatform('android')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center ${
                    activePlatform === 'android'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🤖 Semua Android
                </button>
                <button
                  onClick={() => setActivePlatform('ios')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center ${
                    activePlatform === 'ios'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5 mr-1" />
                  iPhone (iOS)
                </button>
              </div>
            </div>

            {/* Android Instructions */}
            {activePlatform === 'android' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <div className="font-bold text-slate-200">Buka di Chrome Android</div>
                  <p className="text-slate-400">
                    Scan QR code di atas atau buka link menggunakan Google Chrome di HP Android kamu.
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <div className="font-bold text-slate-200">Tekan "Install App"</div>
                  <p className="text-slate-400">
                    Klik tombol hijau <strong>"Install App"</strong> di navbar, atau pilih menu titik 3 Chrome (⋮) lalu pilih <strong>"Install Aplikasi"</strong>.
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <div className="font-bold text-slate-200">Beres!</div>
                  <p className="text-slate-400">
                    Aplikasi langsung muncul di layar utama Android dengan ikon 🏠 layaknya aplikasi APK native.
                  </p>
                </div>
              </div>
            ) : (
              /* iOS iPhone Instructions */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <div className="font-bold text-slate-200">Buka di Safari iPhone</div>
                  <p className="text-slate-400">
                    Buka kamera iPhone, scan QR code atau buka link alamat di browser <strong>Safari</strong>.
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <div className="font-bold text-slate-200">Tekan Tombol Share (Bagikan)</div>
                  <p className="text-slate-400">
                    Tekan ikon <strong>Share</strong> (kotak panah ke atas <Share2 className="w-3.5 h-3.5 inline text-blue-400" />) di bilah bawah Safari.
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <div className="font-bold text-slate-200">Pilih "Add to Home Screen"</div>
                  <p className="text-slate-400">
                    Pilih <strong>"Add to Home Screen (Tambahkan ke Layar Utama)"</strong>. Aplikasi langsung ada di layar iPhone kamu!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tips for Outside Access (Cloudflare Tunnel) */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-start space-x-3 text-xs">
            <Globe className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block mb-0.5">
                Akses dari luar kontrakan tanpa WiFi (Paket Data 4G/5G):
              </span>
              <p className="text-slate-400 leading-relaxed">
                Di terminal laptop cukup ketik: <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">npx cloudflared tunnel --url http://localhost:3000</code>. Kamu akan dapat link internet publik gratis dengan HTTPS yang bisa dibuka oleh semua anak kontrakan di mana pun!
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
