import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { MartabakTargetCard } from './components/MartabakTargetCard';
import { WeeklyKasMatrix } from './components/WeeklyKasMatrix';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseModal } from './components/ExpenseModal';
import { AndroidConnectModal } from './components/AndroidConnectModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { MemberModal } from './components/MemberModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ClaimPaymentModal } from './components/ClaimPaymentModal';
import { VerificationModal } from './components/VerificationModal';
import { api } from './services/api';
import { Member, MemberWeeklyRow, Expense, SummaryData, SystemInfo, PendingVerificationItem, SecurityAlertItem } from './types';
import { Eye, ShieldCheck, Lock, Clock, ShieldAlert, X } from 'lucide-react';

export const App: React.FC = () => {
  // Current Period State (Defaults to current year & month)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);

  // User Role State: Default to Viewer for security.
  // Only true if valid token exists and verified by backend.
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const token = localStorage.getItem('uangkas_admin_token');
    const saved = localStorage.getItem('uangkas_is_admin');
    return saved === 'true' && Boolean(token);
  });

  // Data States
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [matrix, setMatrix] = useState<MemberWeeklyRow[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Section Refs for smooth scrolling on mobile
  const martabakRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [initialExpenseData, setInitialExpenseData] = useState<Partial<Expense>>({});
  
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [unauthorizedNotice, setUnauthorizedNotice] = useState<string | undefined>(undefined);
  
  // Verification & Security Alert States
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [claimInitialMemberId, setClaimInitialMemberId] = useState<number | undefined>(undefined);
  const [claimInitialWeek, setClaimInitialWeek] = useState<number | undefined>(undefined);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [pendingPayments, setPendingPayments] = useState<PendingVerificationItem[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlertItem[]>([]);
  const [liveSecurityToast, setLiveSecurityToast] = useState<SecurityAlertItem | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(false);

  // Listen for PWA install event (Android / iOS / Desktop)
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstallPwa(false);
      }
      setDeferredPrompt(null);
    } else {
      setIsAndroidModalOpen(true);
    }
  };

  // Load all data in 1 atomic request
  const loadData = useCallback(async () => {
    try {
      const state = await api.getState(currentYear, currentMonth);
      setSystemInfo(state.info);
      setMembers(state.members);
      setMatrix(state.contributions.matrix);
      setExpenses(state.expenses);
      setSummary(state.summary);
      setPendingPayments(state.pendingPayments);
      if (localStorage.getItem('uangkas_admin_token')) {
        setSecurityAlerts(state.securityAlerts || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  // Verify admin session token with backend on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('uangkas_admin_token');
      if (token) {
        const isValid = await api.checkAdminAuth();
        if (!isValid) {
          setIsAdmin(false);
          localStorage.setItem('uangkas_is_admin', 'false');
          localStorage.removeItem('uangkas_admin_token');
        } else {
          setIsAdmin(true);
          const alertsRes = await api.getSecurityAlerts();
          setSecurityAlerts(alertsRes);
        }
      } else {
        setIsAdmin(false);
        localStorage.setItem('uangkas_is_admin', 'false');
      }
    };
    verifyAuth();
  }, []);

  // Admin login / logout handlers
  const handleAdminLoginSuccess = async () => {
    setIsAdmin(true);
    setUnauthorizedNotice(undefined);
    localStorage.setItem('uangkas_is_admin', 'true');
    await loadData();
  };

  const handleAdminLogout = async () => {
    if (window.confirm('Beralih ke Mode Teman Kontrakan (Lihat Saja)?')) {
      await api.logoutAdmin();
      setIsAdmin(false);
      setSecurityAlerts([]);
      setLiveSecurityToast(null);
    }
  };

  // Triggered when a non-admin clicks a modify button OR manually clicks Admin Login
  // Opens modal INSTANTLY (0ms) and logs security alert asynchronously
  const handleRequestAdminLogin = (attemptedAction?: string) => {
    if (attemptedAction && !isAdmin) {
      setUnauthorizedNotice(attemptedAction);
      setIsAdminModalOpen(true);
      api.reportUnauthorizedAttempt(attemptedAction).catch(() => {});
    } else {
      setUnauthorizedNotice(undefined);
      setIsAdminModalOpen(true);
    }
  };

  const handleClearSecurityAlerts = async () => {
    await api.clearSecurityAlerts();
    setSecurityAlerts([]);
    setLiveSecurityToast(null);
    await loadData();
  };

  // Initial fetch and month change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup Real-time SSE subscription (instant sync across Laptop, Android, and iOS!)
  useEffect(() => {
    const unsubscribe = api.subscribeEvents((event) => {
      if (event?.type === 'security_alert' && event.alert) {
        if (localStorage.getItem('uangkas_admin_token')) {
          setLiveSecurityToast(event.alert);
          try {
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          } catch {
            // ignore
          }
        }
      }
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Change Month handler
  const handleChangeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // Contributions Actions (Admin only) - with Instant Optimistic UI Update!
  const handleTogglePayment = async (memberId: number, week: number, isPaid: boolean) => {
    if (!isAdmin) {
      handleRequestAdminLogin(`Mencoba mengubah status kas minggu M${week}`);
      return;
    }

    // Optimistic UI update (0ms response)
    setMatrix((prev) =>
      prev.map((row) => {
        if (row.member.id !== memberId) return row;
        const currentCell = row.weeks[week];
        return {
          ...row,
          weeks: {
            ...row.weeks,
            [week]: {
              ...currentCell,
              is_paid: isPaid ? 1 : 0,
              pending_verification: 0,
              status: isPaid ? 'verified' : 'unpaid',
            },
          },
        };
      })
    );

    await api.toggleContribution({
      member_id: memberId,
      year: currentYear,
      month: currentMonth,
      week,
      is_paid: isPaid,
    });
    await loadData();
  };

  const handleBatchPayMonth = async (memberId: number) => {
    if (!isAdmin) {
      handleRequestAdminLogin('Mencoba mengubah status Lunas 1 Bulan');
      return;
    }

    // Optimistic UI update (0ms response)
    setMatrix((prev) =>
      prev.map((row) => {
        if (row.member.id !== memberId) return row;
        const updatedWeeks = { ...row.weeks };
        for (const w of [1, 2, 3, 4]) {
          updatedWeeks[w] = {
            ...updatedWeeks[w],
            is_paid: 1,
            pending_verification: 0,
            status: 'verified',
          };
        }
        return { ...row, weeks: updatedWeeks };
      })
    );

    await api.batchPay({
      member_id: memberId,
      year: currentYear,
      month: currentMonth,
    });
    await loadData();
  };

  // Claim & Verification Handlers
  const handleClaimPayment = async (data: {
    member_id: number;
    year: number;
    month: number;
    weeks: number[];
    payer_note: string;
  }) => {
    await api.claimPayment(data);
    await loadData();
  };

  const handleVerifySingle = async (id: string, approve: boolean) => {
    if (!isAdmin) {
      handleRequestAdminLogin('Mencoba memverifikasi pembayaran kas tanpa akses Admin');
      return;
    }
    await api.verifyPayment(id, approve);
    await loadData();
  };

  const handleVerifyAll = async () => {
    if (!isAdmin) {
      handleRequestAdminLogin('Mencoba setujui semua verifikasi kas tanpa akses Admin');
      return;
    }
    await api.verifyAllPayments(currentYear, currentMonth);
    await loadData();
  };

  const handleOpenClaimModal = (memberId?: number, week?: number) => {
    setClaimInitialMemberId(memberId);
    setClaimInitialWeek(week);
    setIsClaimModalOpen(true);
  };

  // Expenses Actions:
  // - Creating a new expense (!id) is open to both Roommates (enters pending verification) and Admin Vier (immediately verified)
  // - Editing an existing expense (id) is strictly Admin Vier only
  const handleSaveExpense = async (expenseData: Omit<Expense, 'id'>, id?: string) => {
    if (id) {
      if (!isAdmin) {
        handleRequestAdminLogin('Mencoba mengedit pengeluaran kas tanpa akses Admin');
        return;
      }
      await api.updateExpense(id, expenseData);
    } else {
      const res = await api.addExpense(expenseData);
      if (res.pending_verification === 1) {
        alert('✅ Pengeluaran berhasil dikirim! Menunggu verifikasi dari Vier (Admin).');
      }
    }
    await loadData();
  };

  const handleVerifyExpense = async (id: string, approve: boolean) => {
    if (!isAdmin) {
      handleRequestAdminLogin('Mencoba memverifikasi pengeluaran kas tanpa akses Admin');
      return;
    }
    await api.verifyExpense(id, approve);
    await loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!isAdmin) {
      handleRequestAdminLogin('Mencoba menghapus pengeluaran kas tanpa akses Admin');
      return;
    }
    await api.deleteExpense(id);
    await loadData();
  };

  // Quick Add shortcut helper (default Air Rp 5.000)
  const handleQuickAdd = async (category: string, amount: number, dayName?: string, notes?: string) => {
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];
    const indoDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const calculatedDay = dayName || indoDays[today.getDay()];
    const dayOfMonth = today.getDate();
    // Strictly 4 weeks per month
    const weekNum = Math.min(Math.ceil(dayOfMonth / 7), 4);

    await api.addExpense({
      year: currentYear,
      month: currentMonth,
      week: weekNum,
      date: isoDate,
      day_name: calculatedDay,
      category,
      amount,
      pic: members[0]?.name || 'Vier',
      notes: notes || `Pengeluaran ${category}`,
    });
    await loadData();
  };

  // Martabak Target Execution
  const handleExecuteMartabak = () => {
    if (!isAdmin) {
      handleRequestAdminLogin('Mencoba eksekusi Beli Martabak Rp 50.000');
      return;
    }
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];
    const indoDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    setEditingExpense(null);
    setInitialExpenseData({
      amount: 50000,
      category: 'Martabak Kontrakan',
      date: isoDate,
      day_name: indoDays[today.getDay()],
      notes: 'Eksekusi target saldo menganggur Rp 50.000! Beli martabak bareng anak kontrakan.',
      pic: 'Vier',
    });
    setIsExpenseModalOpen(true);
  };

  // Members Actions
  const handleAddMember = async (name: string) => {
    await api.addMember(name);
    await loadData();
  };

  const handleDeleteMember = async (id: number) => {
    await api.deleteMember(id);
    await loadData();
  };

  const pendingExpenses = expenses.filter((e) => e.pending_verification === 1);
  const totalPendingVerifications =
    summary?.pendingVerificationsCount !== undefined
      ? summary.pendingVerificationsCount
      : pendingPayments.length + pendingExpenses.length;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentYear={currentYear}
        currentMonth={currentMonth}
        onChangeMonth={handleChangeMonth}
        systemInfo={systemInfo}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => handleRequestAdminLogin()}
        onLogoutAdmin={handleAdminLogout}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenMemberModal={() => setIsMemberModalOpen(true)}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
        pendingCount={totalPendingVerifications}
        securityCount={securityAlerts.length}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
      />

      {/* REAL-TIME SECURITY NOTIFICATION TOAST FOR ADMIN (VIER) */}
      {isAdmin && liveSecurityToast && (
        <div className="bg-rose-950/95 border-b border-rose-500/60 px-3.5 py-2.5 shadow-lg shadow-rose-950/50 animate-in slide-in-from-top-3 duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-start sm:items-center space-x-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-xs text-rose-100 min-w-0">
                <span className="font-extrabold text-rose-300 block sm:inline mr-1.5">
                  🚨 Notifikasi Keamanan Admin:
                </span>
                <span className="font-semibold text-white">{liveSecurityToast.action}</span>
                <span className="text-[11px] text-rose-300/90 block sm:inline sm:ml-2">
                  ({liveSecurityToast.device_info} • {liveSecurityToast.created_at})
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => {
                  setLiveSecurityToast(null);
                  setIsVerificationModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95"
              >
                Cek Log
              </button>
              <button
                onClick={() => setLiveSecurityToast(null)}
                className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/60 transition"
                title="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Security Alert Banner for Admin if unread security alerts exist */}
      {isAdmin && !liveSecurityToast && securityAlerts.length > 0 && (
        <div className="bg-rose-950/60 border-b border-rose-800/60 px-3.5 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-rose-200 min-w-0">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <span className="truncate">
                <strong>{securityAlerts.length} Peringatan Keamanan:</strong> Ada percobaan ubah data oleh non-admin ({securityAlerts[0].action}).
              </span>
            </div>
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 shrink-0 transition"
            >
              Lihat Detail
            </button>
          </div>
        </div>
      )}

      {/* Mode Banner for Friends (Viewer Mode Notice) */}
      {!isAdmin && (
        <div className="bg-blue-950/70 border-b border-blue-900/60 px-3.5 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-[11px] sm:text-xs text-blue-200">
            <div className="flex items-center space-x-2 min-w-0">
              <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate sm:whitespace-normal">
                <strong>Mode Teman:</strong> Lapor bayar kas & pengeluaran baru. Verifikasi dikelola <strong>Vier (Admin)</strong>.
              </span>
            </div>
            <button
              onClick={() => handleRequestAdminLogin()}
              className="font-bold text-emerald-400 hover:underline shrink-0 flex items-center"
            >
              <Lock className="w-3 h-3 mr-1" /> Login Vier
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-28 sm:pb-8 space-y-4 sm:space-y-6 overflow-x-hidden">
        
        {loading && !summary ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Memuat data kas kontrakan...</p>
          </div>
        ) : (
          <>
            {/* 1. Target Martabak Card (Special Rule Feature) */}
            {summary && (
              <div ref={martabakRef}>
                <MartabakTargetCard
                  summary={summary}
                  isAdmin={isAdmin}
                  onExecuteMartabak={handleExecuteMartabak}
                  onRequestAdminLogin={handleRequestAdminLogin}
                />
              </div>
            )}

            {/* 2. Financial KPI Summary Cards */}
            {summary && (
              <SummaryCards summary={summary} />
            )}

            {/* 3. Weekly Contribution Matrix (Strictly 4 Weeks: Bayu, Apip, Ian, Ray, Dola, Vier) */}
            <div ref={matrixRef}>
              <WeeklyKasMatrix
                matrix={matrix}
                year={currentYear}
                month={currentMonth}
                isAdmin={isAdmin}
                pendingCount={totalPendingVerifications}
                onTogglePayment={handleTogglePayment}
                onBatchPayMonth={handleBatchPayMonth}
                onRequestAdminLogin={handleRequestAdminLogin}
                onOpenClaimModal={handleOpenClaimModal}
                onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
                onQuickVerify={handleVerifySingle}
              />
            </div>

            {/* 4. Weekly & Specific Daily Expense Ledger */}
            <ExpenseList
              expenses={expenses}
              isAdmin={isAdmin}
              onOpenAddModal={(preset) => {
                setEditingExpense(null);
                setInitialExpenseData(preset || {
                  category: 'Isi Ulang Air',
                  amount: 5000,
                });
                setIsExpenseModalOpen(true);
              }}
              onOpenEditModal={(exp) => {
                setEditingExpense(exp);
                setIsExpenseModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              onQuickAdd={handleQuickAdd}
              onVerifyExpense={handleVerifyExpense}
              onRequestAdminLogin={handleRequestAdminLogin}
            />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#090d16] py-6 text-center text-xs text-slate-500 mb-20 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Uang Kas Kontrakan • Bayu, Apip, Ian, Ray, Dola, Vier (Admin) • Rp 5.000 / M (4 M / bln)
          </p>
          <div className="flex items-center space-x-3 text-slate-400">
            <button 
              onClick={() => setIsAndroidModalOpen(true)}
              className="hover:text-emerald-400 transition"
            >
              📱 Android & iPhone iOS
            </button>
            <span>•</span>
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="hover:text-emerald-400 transition"
            >
              📊 Ekspor PDF & Excel
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Dock */}
      <MobileBottomNav
        isAdmin={isAdmin}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setInitialExpenseData({
            category: 'Isi Ulang Air',
            amount: 5000,
          });
          setIsExpenseModalOpen(true);
        }}
        onRequestAdminLogin={handleRequestAdminLogin}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onScrollToMartabak={() => {
          martabakRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToMatrix={() => {
          matrixRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        members={members}
        initialData={initialExpenseData}
        isAdmin={isAdmin}
      />

      <AndroidConnectModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        systemInfo={systemInfo}
      />

      {summary && (
        <MonthlyReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          year={currentYear}
          month={currentMonth}
          summary={summary}
          matrix={matrix}
          expenses={expenses}
        />
      )}

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        members={members}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
      />

      {/* Admin Login PIN Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setUnauthorizedNotice(undefined);
        }}
        onLoginSuccess={handleAdminLoginSuccess}
        adminName={systemInfo?.adminName || 'Vier'}
        unauthorizedNotice={unauthorizedNotice}
      />

      {/* Roommate Payment Claim Modal */}
      <ClaimPaymentModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        members={members}
        year={currentYear}
        month={currentMonth}
        initialMemberId={claimInitialMemberId}
        initialWeek={claimInitialWeek}
        onSubmitClaim={handleClaimPayment}
      />

      {/* Vier Admin Verification & Security Log Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        pendingList={pendingPayments}
        pendingExpenses={pendingExpenses}
        securityAlerts={securityAlerts}
        year={currentYear}
        month={currentMonth}
        onVerifySingle={handleVerifySingle}
        onVerifyExpense={handleVerifyExpense}
        onVerifyAll={handleVerifyAll}
        onClearSecurityAlerts={handleClearSecurityAlerts}
      />

    </div>
  );
};

export default App;
