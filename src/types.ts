export interface Member {
  id: number;
  name: string;
  is_active: number;
  created_at?: string;
}

export interface Contribution {
  id: string;
  member_id: number;
  year: number;
  month: number;
  week: number;
  amount: number;
  is_paid: number;
  paid_at: string | null;
  notes?: string;
  pending_verification?: number; // 0 or 1
  status?: 'unpaid' | 'pending' | 'verified' | 'not_joined';
  is_exempt?: number;
  payer_note?: string;
  claimed_at?: string | null;
  verified_at?: string | null;
}

export interface PendingVerificationItem {
  id: string;
  member_id: number;
  member_name: string;
  year: number;
  month: number;
  week: number;
  amount: number;
  payer_note?: string;
  claimed_at?: string;
}

export interface MemberWeeklyRow {
  member: Member;
  weeks: {
    [weekNumber: number]: Contribution;
  };
}

export interface Expense {
  id: string;
  year: number;
  month: number;
  week: number;
  date: string;       // YYYY-MM-DD
  day_name: string;   // 'Senin', 'Selasa', 'Rabu', etc.
  category: string;   // 'Isi Ulang Galon', 'Token Listrik', etc.
  amount: number;
  pic?: string;       // Person in charge / who paid
  notes?: string;
  pending_verification?: number; // 0 or 1
  is_verified?: number; // 0 or 1
  verified_at?: string | null;
  created_at?: string;
}

export interface SummaryData {
  year: number;
  month: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  currentBalance: number;
  allTimeIncome: number;
  allTimeExpense: number;
  activeMembersCount: number;
  expectedMonthlyTotal: number;
  unpaidAmount: number;
  pendingVerificationsCount?: number;
  securityAlertsCount?: number;
  martabak: {
    target: number;
    currentBalance: number;
    progress: number;
    isReady: boolean;
    portions: number;
    remainingToTarget: number;
  };
}

export interface SecurityAlertItem {
  id: string;
  action: string;
  device_info: string;
  ip_address: string;
  is_read: number;
  created_at: string;
}

export interface SystemInfo {
  appName: string;
  localIp: string;
  port: number;
  laptopUrl: string;
  mobileUrl: string;
  connectedClients: number;
  defaultMembers: string[];
  weeklyFee: number;
  martabakTarget: number;
  adminName: string;
}

export type UserRole = 'admin' | 'viewer';

/**
 * Menentukan minggu aktif iuran untuk setiap anggota pada bulan & tahun tertentu.
 * Khusus James_Deli: pada bulan Oktober 2026 hanya ikut di M3 dan M4,
 * sedangkan untuk bulan-bulan kedepannya ikut full 4 minggu (M1 - M4) seperti anggota lainnya.
 */
export const getActiveWeeksForMember = (memberName: string, year: number, month: number): number[] => {
  const normalized = (memberName || '').trim().toLowerCase();
  if (normalized === 'james_deli' || normalized === 'james deli' || normalized === 'james_dely' || normalized === 'james dely') {
    if (year === 2026 && month === 10) {
      return [3, 4];
    }
  }
  return [1, 2, 3, 4];
};
