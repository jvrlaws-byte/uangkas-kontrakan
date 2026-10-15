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
import { Member, MemberWeeklyRow, Expense, SummaryData, SystemInfo, PendingVerificationItem } from './types';
import { Eye, ShieldCheck, Lock, Clock } from 'lucide-react';

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
  
  // Verification System States
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [claimInitialMemberId, setClaimInitialMemberId] = useState<number | undefined>(undefined);
  const [claimInitialWeek, setClaimInitialWeek] = useState<number | undefined>(undefined);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [pendingPayments, setPendingPayments] = useState<PendingVerificationItem[]>([]);

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
        }
      } else {
        setIsAdmin(false);
        localStorage.setItem('uangkas_is_admin', 'false');
      }
    };
    verifyAuth();
  }, []);

  // Admin login / logout handlers
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem('uangkas_is_admin', 'true');
  };

  const handleAdminLogout = async () => {
    if (window.confirm('Beralih ke Mode Teman Kontrakan (Lihat Saja)?')) {
      await api.logoutAdmin();
      setIsAdmin(false);
    }
  };

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [infoRes, membersRes, contribRes, expensesRes, summaryRes, pendingRes] = await Promise.all([
        api.getInfo(),
        api.getMembers(),
        api.getContributions(currentYear, currentMonth),
        api.getExpenses(currentYear, currentMonth),
        api.getSummary(currentYear, currentMonth),
        api.getPendingPayments(currentYear, currentMonth),
      ]);

      setSystemInfo(infoRes);
      setMembers(membersRes);
      setMatrix(contribRes.matrix);
      setExpenses(expensesRes);
      setSummary(summaryRes);
      setPendingPayments(pendingRes);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  // Initial fetch and month change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup Real-time SSE subscription (instant sync across Laptop, Android, and iOS!)
  useEffect(() => {
    const unsubscribe = api.subscribeEvents((event) => {
      console.log('⚡ Data update received via Realtime SSE:', event);
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

  // Contributions Actions (Admin only)
  const handleTogglePayment = async (memberId: number, week: number, isPaid: boolean) => {
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
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
      setIsAdminModalOpen(true);
      return;
    }
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
      setIsAdminModalOpen(true);
      return;
    }
    await api.verifyPayment(id, approve);
    await loadData();
  };

  const handleVerifyAll = async () => {
    if (!isAdmin) {
      setIsAdminModalOpen(true);
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

  // Expenses Actions (Admin only)
  const handleSaveExpense = async (expenseData: Omit<Expense, 'id'>, id?: string) => {
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
    if (id) {
      await api.updateExpense(id, expenseData);
    } else {
      await api.addExpense(expenseData);
    }
    await loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
    await api.deleteExpense(id);
    await loadData();
  };

  // Quick Add shortcut helper (default Air Rp 5.000)
  const handleQuickAdd = async (category: string, amount: number, dayName?: string, notes?: string) => {
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
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
      setIsAdminModalOpen(true);
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

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentYear={currentYear}
        currentMonth={currentMonth}
        onChangeMonth={handleChangeMonth}
        systemInfo={systemInfo}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminModalOpen(true)}
        onLogoutAdmin={handleAdminLogout}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenMemberModal={() => setIsMemberModalOpen(true)}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
        pendingCount={summary?.pendingVerificationsCount !== undefined ? summary.pendingVerificationsCount : pendingPayments.length}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
      />

      {/* Mode Banner for Friends (Viewer Mode Notice) */}
      {!isAdmin && (
        <div className="bg-blue-950/70 border-b border-blue-900/60 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-blue-200">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Mode Teman Kontrakan:</strong> Kamu dapat memantau saldo, target martabak, dan rekap kas. Perubahan data dikelola oleh <strong>Vier (Admin)</strong>.
              </span>
            </div>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="ml-2 font-bold text-emerald-400 hover:underline shrink-0 flex items-center"
            >
              <Lock className="w-3 h-3 mr-1" /> Login Vier
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
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
                  onRequestAdminLogin={() => setIsAdminModalOpen(true)}
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
                pendingCount={summary?.pendingVerificationsCount !== undefined ? summary.pendingVerificationsCount : pendingPayments.length}
                onTogglePayment={handleTogglePayment}
                onBatchPayMonth={handleBatchPayMonth}
                onRequestAdminLogin={() => setIsAdminModalOpen(true)}
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
              onRequestAdminLogin={() => setIsAdminModalOpen(true)}
            />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#090d16] py-6 text-center text-xs text-slate-500 mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Uang Kas Kontrakan • Bayu, Apip, Ian, Ray, Dola, Vier (Admin) • Rp 5.000 / mgg (4 mgg / bln)
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
        onRequestAdminLogin={() => setIsAdminModalOpen(true)}
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
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        adminName={systemInfo?.adminName || 'Vier'}
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

      {/* Vier Admin Verification Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        pendingList={pendingPayments}
        year={currentYear}
        month={currentMonth}
        onVerifySingle={handleVerifySingle}
        onVerifyAll={handleVerifyAll}
      />

    </div>
  );
};

export default App;
