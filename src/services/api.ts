import { Member, MemberWeeklyRow, Expense, SummaryData, SystemInfo, PendingVerificationItem } from '../types';

const API_BASE = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('uangkas_admin_token') || '';
  return {
    'Content-Type': 'application/json',
    'x-admin-token': token,
  };
};

export const api = {
  // System Info
  async getInfo(): Promise<SystemInfo> {
    try {
      const res = await fetch(`${API_BASE}/info`);
      if (!res.ok) throw new Error('Failed to fetch system info');
      return await res.json();
    } catch (err) {
      console.warn('API getInfo error, using fallback:', err);
      return {
        appName: 'Uang Kas Kontrakan',
        localIp: window.location.hostname,
        port: Number(window.location.port) || 3000,
        laptopUrl: window.location.origin,
        mobileUrl: window.location.origin,
        connectedClients: 1,
        defaultMembers: ['Bayu', 'Apip', 'Ian', 'Ray', 'Dola', 'Vier'],
        weeklyFee: 5000,
        martabakTarget: 50000,
        adminName: 'Vier',
      };
    }
  },

  // Admin Verification (Vier)
  async verifyAdminPin(pin: string): Promise<{ success: boolean; adminName: string; token: string }> {
    const res = await fetch(`${API_BASE}/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'PIN Admin salah');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('uangkas_admin_token', data.token);
    }
    return data;
  },

  async changeAdminPin(currentPin: string, newPin: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/change-pin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPin, newPin }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengubah PIN');
    }
  },

  async checkAdminAuth(): Promise<boolean> {
    const token = localStorage.getItem('uangkas_admin_token');
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/admin/check-auth`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.authenticated;
    } catch {
      return false;
    }
  },

  async logoutAdmin(): Promise<void> {
    try {
      await fetch(`${API_BASE}/admin/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('uangkas_admin_token');
      localStorage.setItem('uangkas_is_admin', 'false');
    }
  },

  // Members
  async getMembers(): Promise<Member[]> {
    const res = await fetch(`${API_BASE}/members`);
    if (!res.ok) throw new Error('Failed to fetch members');
    return await res.json();
  },

  async addMember(name: string): Promise<Member> {
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Gagal menambah anggota');
    }
    return await res.json();
  },

  async deleteMember(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/members/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Gagal menghapus anggota');
    }
  },

  // Contributions Matrix
  async getContributions(year: number, month: number): Promise<{ year: number; month: number; matrix: MemberWeeklyRow[] }> {
    const res = await fetch(`${API_BASE}/contributions?year=${year}&month=${month}`);
    if (!res.ok) throw new Error('Failed to fetch contributions');
    return await res.json();
  },

  async toggleContribution(data: {
    member_id: number;
    year: number;
    month: number;
    week: number;
    is_paid: boolean;
    notes?: string;
  }): Promise<void> {
    const res = await fetch(`${API_BASE}/contributions/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Gagal memperbarui status iuran');
    }
  },

  async batchPay(data: {
    member_id: number;
    year: number;
    month: number;
    weeksToPay?: number[];
  }): Promise<void> {
    const res = await fetch(`${API_BASE}/contributions/batch-pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Gagal bayar lunas bulanan');
    }
  },

  // Verification & Claims System
  async claimPayment(data: {
    member_id: number;
    year: number;
    month: number;
    week?: number;
    weeks?: number[];
    payer_note?: string;
  }): Promise<void> {
    const res = await fetch(`${API_BASE}/contributions/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengirim laporan pembayaran');
    }
  },

  async verifyPayment(id: string, approve: boolean): Promise<void> {
    const res = await fetch(`${API_BASE}/contributions/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, approve }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memverifikasi pembayaran');
    }
  },

  async verifyAllPayments(year: number, month: number): Promise<void> {
    const res = await fetch(`${API_BASE}/contributions/verify-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ year, month }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memverifikasi semua pembayaran');
    }
  },

  async getPendingPayments(year?: number, month?: number): Promise<PendingVerificationItem[]> {
    let url = `${API_BASE}/contributions/pending`;
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch pending payments');
    return await res.json();
  },

  // Expenses
  async getExpenses(year: number, month: number): Promise<Expense[]> {
    const res = await fetch(`${API_BASE}/expenses?year=${year}&month=${month}`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return await res.json();
  },

  async addExpense(expense: Omit<Expense, 'id'>): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(expense),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menyimpan pengeluaran');
    }
    return await res.json();
  },

  async updateExpense(id: string, expense: Partial<Expense>): Promise<void> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(expense),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal update pengeluaran');
    }
  },

  async deleteExpense(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus pengeluaran');
    }
  },

  // Summary
  async getSummary(year: number, month: number): Promise<SummaryData> {
    const res = await fetch(`${API_BASE}/summary?year=${year}&month=${month}`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return await res.json();
  },

  // Realtime Sync Listener (SSE)
  subscribeEvents(onDataChange: (event: any) => void): () => void {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE}/events`);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onDataChange(data);
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };
      eventSource.onerror = () => {
        // Automatically attempts reconnect
      };
    } catch (err) {
      console.warn('SSE not supported or connection failed:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  },
};
