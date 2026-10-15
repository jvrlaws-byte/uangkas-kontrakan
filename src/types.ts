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
  status?: 'unpaid' | 'pending' | 'verified';
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
  martabak: {
    target: number;
    currentBalance: number;
    progress: number;
    isReady: boolean;
    portions: number;
    remainingToTarget: number;
  };
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
