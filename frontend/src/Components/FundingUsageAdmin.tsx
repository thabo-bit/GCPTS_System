// src/Components/FundingUsageAdmin.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet, Search, Save, X, Edit3, TrendingUp, TrendingDown,
  PiggyBank, Building2, MapPin, RefreshCw, CheckCircle2,
  Coins, Plus, Trash2, Receipt, PieChart, Clock,
  FolderKanban, ArrowLeft, ArrowRight
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

interface Project {
  id: number;
  title: string;
  department?: string;
  location?: string;
  category?: string;
  status?: string;
  budgetAllocated?: number;
  budgetUsed?: number;
}

interface Transaction {
  id: number;
  projectId: number;
  date: string;
  description: string;
  category: string;
  reference: string;
  status: 'completed' | 'pending' | 'cancelled';
  type: 'income' | 'expense';
  amount: number;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

const EMPTY_TX = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  category: '',
  reference: '',
  status: 'completed' as Transaction['status'],
  type: 'expense' as Transaction['type'],
  amount: '',
};

// ─── Calm accent colors per department ───
const DEPT_ACCENTS: Record<string, { bg: string; fg: string; ring: string }> = {
  'Department of Health':               { bg: '#f6ecef', fg: '#8a5566', ring: '#ebd3d9' },
  'Department of Water and Sanitation': { bg: '#eaf1f6', fg: '#4f6888', ring: '#d5e2ec' },
  'Department of Energy':               { bg: '#f8f1e6', fg: '#8a6a3d', ring: '#eedfc6' },
  'Department of Community Services':   { bg: '#efeaf3', fg: '#635a82', ring: '#ddd3e7' },
  'Department of Public Works':         { bg: '#eef2ec', fg: '#4f6b52', ring: '#d9e4d8' },
  'Department of Education':            { bg: '#e9f3ee', fg: '#3f7355', ring: '#d0e5da' },
  'Department of Environmental Affairs':{ bg: '#edf1e9', fg: '#566b47', ring: '#dbe3cf' },
};

const DEFAULT_ACCENT = { bg: '#eef0f5', fg: '#5a6478', ring: '#dfe3ec' };

const accentFor = (department?: string) =>
  (department && DEPT_ACCENTS[department]) || DEFAULT_ACCENT;

export default function FundingUsageAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectSearch, setProjectSearch] = useState('');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense'>('all');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_TX });

  const [toast, setToast] = useState<string | null>(null);

  // ─── Load projects ───
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/projects`);
      setProjects(res.data || []);
    } catch (err) {
      console.error('Fetch projects error:', err);
      setError('Could not load projects. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Refresh projects silently (after a transaction change) — no loading spinner
  const refreshProjectData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/projects`);
      setProjects(res.data || []);
    } catch (err) {
      console.error('Refresh projects failed:', err);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  // ─── Load transactions whenever the selected project changes ───
  useEffect(() => {
    if (selectedProjectId === null) {
      setTransactions([]);
      return;
    }
    const loadTransactions = async () => {
      setTxLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/transactions?projectId=${selectedProjectId}`
        );
        setTransactions(res.data || []);
      } catch (err) {
        console.error('Load transactions failed:', err);
        setTransactions([]);
        setToast('Failed to load transactions');
      } finally {
        setTxLoading(false);
      }
    };
    loadTransactions();
  }, [selectedProjectId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Filtered projects ───
  const filteredProjects = useMemo(() => {
    const q = projectSearch.toLowerCase();
    return projects.filter((p) =>
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  // ─── Selected project ───
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  // ─── Filtered transactions ───
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesFilter = txFilter === 'all' || t.type === txFilter;
      const q = txSearch.toLowerCase();
      const matchesSearch =
        !q ||
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.reference?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [transactions, txFilter, txSearch]);

  // ⭐⭐⭐ THE FIX ⭐⭐⭐
  // Same pattern as projectDetails.tsx — Total Received comes from the
  // PROJECT's allocated budget (what government granted), NOT from income
  // transactions. Plain consts, no useMemo, recomputed every render.

  const totalReceived = selectedProject?.budgetAllocated ?? 0;

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const pendingAmount = transactions
    .filter((t) => t.status === 'pending')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const availableBalance = totalReceived - totalExpenses;

  const fmt = (n: number) => {
    if (n >= 1000000) return `R ${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `R ${(n / 1000).toFixed(0)}k`;
    return `R ${n}`;
  };
  const fmtFull = (n: number) => `R ${(n || 0).toLocaleString('en-ZA')}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-ZA', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  // ─── CREATE ───
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const res = await axios.post(`${API_URL}/api/transactions`, {
        projectId: selectedProjectId,
        date: form.date,
        description: form.description,
        category: form.category,
        reference: form.reference || `TRX-${Date.now().toString().slice(-6)}`,
        status: form.status,
        type: form.type,
        amount: Number(form.amount) || 0,
      });

      setTransactions((prev) => [...prev, res.data]);
      setForm({ ...EMPTY_TX });
      setShowAddForm(false);
      await refreshProjectData();
      setToast(`Added "${res.data.description}" · logged to audit trail`);
    } catch (err) {
      console.error('Add transaction failed:', err);
      setToast('Failed to add transaction');
    }
  };

  // ─── UPDATE ───
  const handleUpdateTransaction = async (id: number) => {
    if (!form.description || !form.amount) return;

    try {
      const res = await axios.put(`${API_URL}/api/transactions/${id}`, {
        date: form.date,
        description: form.description,
        category: form.category,
        reference: form.reference,
        status: form.status,
        type: form.type,
        amount: Number(form.amount) || 0,
      });

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? res.data : t))
      );
      setEditingId(null);
      setForm({ ...EMPTY_TX });
      await refreshProjectData();
      setToast('Transaction updated · logged to audit trail');
    } catch (err) {
      console.error('Update transaction failed:', err);
      setToast('Failed to update transaction');
    }
  };

  // ─── DELETE ───
  const handleDeleteTransaction = async (id: number) => {
    const removed = transactions.find((t) => t.id === id);
    if (!removed) return;

    try {
      await axios.delete(`${API_URL}/api/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      await refreshProjectData();
      setToast(`Removed "${removed.description}" · logged to audit trail`);
    } catch (err) {
      console.error('Delete transaction failed:', err);
      setToast('Failed to delete transaction');
    }
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setForm({
      date: t.date,
      description: t.description,
      category: t.category,
      reference: t.reference,
      status: t.status,
      type: t.type,
      amount: String(t.amount),
    });
  };

  const cancelEdit = () => { setEditingId(null); setForm({ ...EMPTY_TX }); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        .fu-root {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          color: #2c2f38;
          display: flex; flex-direction: column; gap: 22px;
          -webkit-font-smoothing: antialiased;
        }

        .fu-head {
          display: flex; justify-content: space-between; align-items: center;
          gap: 20px; flex-wrap: wrap;
          padding-bottom: 18px;
          border-bottom: 1px solid #eae7e0;
        }
        .fu-head-left { display: flex; align-items: center; gap: 14px; }
        .fu-head-mark {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, #cbd5e8, #b8a4d4);
          display: flex; align-items: center; justify-content: center;
          color: #ffffff; flex-shrink: 0;
          box-shadow: 0 8px 20px -10px rgba(160,150,200,0.6);
        }
        .fu-head h1 {
          font-family: 'Sora', sans-serif;
          font-size: 1.35rem; font-weight: 600;
          margin: 0; color: #1a1d26;
          letter-spacing: -0.02em;
        }
        .fu-head p {
          font-size: 0.83rem; color: #7a7f8c; margin: 4px 0 0;
        }
        .fu-refresh {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 16px; border-radius: 12px;
          border: 1px solid #eae7e0; background: #ffffff;
          font-size: 0.8rem; color: #5a5f6c;
          cursor: pointer; font-family: inherit; font-weight: 500;
          transition: all 0.2s ease;
        }
        .fu-refresh:hover { background: #fbfaf7; border-color: #d8d3c8; }
        .fu-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

        .fu-projects-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 20px; flex-wrap: wrap;
        }
        .fu-projects-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.05rem; font-weight: 600;
          color: #1a1d26; margin: 0;
          letter-spacing: -0.01em;
        }
        .fu-projects-sub {
          font-size: 0.8rem; color: #8b8f9b; margin-top: 3px;
        }
        .fu-project-search {
          display: flex; align-items: center; gap: 9px;
          background: #ffffff; border: 1px solid #eae7e0;
          border-radius: 12px; padding: 10px 16px;
          min-width: 300px;
          transition: all 0.2s ease;
        }
        .fu-project-search:focus-within {
          border-color: #b8a4d4;
          box-shadow: 0 0 0 4px #f1eaf7;
        }
        .fu-project-search input {
          border: none; background: transparent; outline: none;
          width: 100%; font-size: 0.85rem; color: #1a1d26;
          font-family: inherit;
        }
        .fu-project-search input::placeholder { color: #a4a8b4; }

        .fu-project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .fu-card {
          background: #ffffff;
          border: 1px solid #ece9e2;
          border-radius: 20px;
          padding: 22px;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
          display: flex; flex-direction: column; gap: 16px;
          position: relative;
          overflow: hidden;
        }
        .fu-card:hover {
          transform: translateY(-3px);
          border-color: #dcd6cb;
          box-shadow: 0 22px 40px -28px rgba(70,60,100,0.3);
        }
        .fu-card-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
        }
        .fu-card-head {
          display: flex; align-items: flex-start;
          gap: 12px; margin-top: 4px;
        }
        .fu-card-mark {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .fu-card-title {
          font-family: 'Sora', sans-serif;
          font-size: 0.94rem; font-weight: 600;
          color: #1a1d26; line-height: 1.35;
          letter-spacing: -0.01em;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .fu-card-meta {
          display: flex; flex-direction: column; gap: 6px;
          font-size: 0.76rem; color: #8b8f9b;
        }
        .fu-card-meta span {
          display: inline-flex; align-items: center; gap: 6px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .fu-card-progress { display: flex; flex-direction: column; gap: 6px; }
        .fu-progress-head {
          display: flex; justify-content: space-between;
          font-size: 0.72rem; color: #8b8f9b; font-weight: 500;
        }
        .fu-progress-head .pct {
          font-weight: 700; color: #2c2f38;
          font-variant-numeric: tabular-nums;
        }
        .fu-progress-track {
          height: 6px; border-radius: 999px;
          background: #f0ede7; overflow: hidden;
        }
        .fu-progress-fill {
          height: 100%; border-radius: 999px;
          transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .fu-card-foot {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          padding-top: 14px; border-top: 1px dashed #eae7e0;
        }
        .fu-stat-label {
          font-size: 0.62rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #a4a8b4; margin-bottom: 4px;
        }
        .fu-stat-value {
          font-family: 'Sora', sans-serif;
          font-size: 0.94rem; font-weight: 600;
          color: #1a1d26; font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }
        .fu-stat-value.used { color: #5a6478; }
        .fu-card-arrow {
          position: absolute; bottom: 20px; right: 20px;
          width: 28px; height: 28px; border-radius: 8px;
          background: #faf8f4; display: flex;
          align-items: center; justify-content: center;
          color: #a4a8b4; transition: all 0.25s ease;
        }
        .fu-card:hover .fu-card-arrow {
          background: #1a1d26; color: #ffffff;
          transform: translateX(2px);
        }

        .fu-empty {
          padding: 70px 24px; text-align: center;
          color: #8b8f9b; background: #fbfaf7;
          border: 1px dashed #e2ddd1; border-radius: 20px;
        }
        .fu-empty h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1rem; font-weight: 600;
          color: #1a1d26; margin: 14px 0 4px;
        }
        .fu-error {
          padding: 24px; text-align: center;
          background: #fdf2f4; border: 1px solid #f4d3da;
          border-radius: 14px; color: #8a5566; font-size: 0.85rem;
        }

        .fu-banner {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
          background: #fbfaf7; border: 1px solid #ece9e2;
          border-radius: 16px; padding: 18px 22px;
        }
        .fu-banner-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .fu-banner-mark {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .fu-banner-title {
          font-family: 'Sora', sans-serif;
          font-size: 1rem; font-weight: 600;
          color: #1a1d26; line-height: 1.3;
        }
        .fu-banner-meta {
          font-size: 0.76rem; color: #7a7f8c;
          display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px;
        }
        .fu-banner-meta span {
          display: inline-flex; align-items: center; gap: 5px;
        }
        .fu-back-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 16px; border-radius: 12px;
          border: 1px solid #eae7e0; background: #ffffff;
          font-size: 0.8rem; color: #5a5f6c;
          cursor: pointer; font-family: inherit; font-weight: 500;
          transition: all 0.2s ease;
        }
        .fu-back-btn:hover { background: #faf8f4; border-color: #d8d3c8; }

        .fu-metrics {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 1100px) { .fu-metrics { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .fu-metrics { grid-template-columns: 1fr; } }

        .fu-metric {
          padding: 20px; border-radius: 16px; border: 1px solid;
          display: flex; flex-direction: column; gap: 10px;
          position: relative; overflow: hidden;
        }
        .fu-metric.received { background: #f3f7fb; border-color: #dbe6f0; }
        .fu-metric.spent    { background: #faf3f4; border-color: #f0dadd; }
        .fu-metric.available{ background: #f2f7f2; border-color: #d8e5d8; }
        .fu-metric.pending  { background: #faf6ec; border-color: #ece0c4; }

        .fu-metric-label {
          font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.05em;
          display: flex; align-items: center; gap: 6px;
        }
        .fu-metric.received .fu-metric-label { color: #4f6888; }
        .fu-metric.spent .fu-metric-label { color: #8a5566; }
        .fu-metric.available .fu-metric-label { color: #4f6b52; }
        .fu-metric.pending .fu-metric-label { color: #8a6a3d; }

        .fu-metric-value {
          font-family: 'Sora', sans-serif;
          font-size: 1.65rem; font-weight: 700;
          letter-spacing: -0.025em;
          font-variant-numeric: tabular-nums;
          line-height: 1.05;
        }
        .fu-metric.received .fu-metric-value { color: #3d5573; }
        .fu-metric.spent .fu-metric-value { color: #7a4655; }
        .fu-metric.available .fu-metric-value { color: #3f5a42; }
        .fu-metric.pending .fu-metric-value { color: #7a5c30; }

        .fu-metric-foot { font-size: 0.7rem; color: #8b8f9b; font-weight: 500; }

        .fu-toolbar {
          display: flex; gap: 12px; align-items: center;
          justify-content: space-between; flex-wrap: wrap;
          background: #ffffff; border: 1px solid #eae7e0;
          border-radius: 16px; padding: 14px 18px;
        }
        .fu-toolbar-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .fu-search {
          display: flex; align-items: center; gap: 9px;
          background: #fbfaf7; border: 1px solid #eae7e0;
          border-radius: 12px; padding: 10px 16px;
          min-width: 260px;
        }
        .fu-search:focus-within {
          border-color: #b8a4d4;
          box-shadow: 0 0 0 4px #f1eaf7;
        }
        .fu-search input {
          border: none; background: transparent; outline: none;
          width: 100%; font-size: 0.83rem; color: #1a1d26;
          font-family: inherit;
        }
        .fu-select {
          appearance: none;
          background: #fbfaf7; border: 1px solid #eae7e0;
          border-radius: 12px; padding: 10px 34px 10px 14px;
          font-size: 0.82rem; color: #1a1d26;
          font-family: inherit; cursor: pointer;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23a4a8b4' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>");
          background-repeat: no-repeat; background-position: right 12px center;
        }
        .fu-add-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 18px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #7c9c7a, #5e8060);
          color: #fff; font-size: 0.82rem; font-weight: 600;
          font-family: inherit; cursor: pointer;
          box-shadow: 0 8px 20px -10px rgba(94,128,96,0.5);
          transition: all 0.2s ease;
        }
        .fu-add-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 24px -10px rgba(94,128,96,0.6); }

        .fu-table-wrap {
          background: #ffffff; border: 1px solid #eae7e0;
          border-radius: 18px; overflow: hidden;
        }
        .fu-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .fu-th {
          background: #fbfaf7; color: #a4a8b4;
          padding: 15px 20px; font-weight: 700;
          font-size: 0.66rem; letter-spacing: 0.12em;
          text-transform: uppercase; text-align: left;
          border-bottom: 1px solid #eae7e0; white-space: nowrap;
        }
        .fu-tr {
          border-bottom: 1px solid #f5f2ed;
          transition: background 0.15s ease;
        }
        .fu-tr:last-child { border-bottom: none; }
        .fu-tr:hover { background: #fbfaf7; }

        .fu-td {
          padding: 15px 20px; color: #4a4f5c; vertical-align: middle;
        }
        .fu-td.muted { color: #a4a8b4; font-size: 0.78rem; font-family: 'SF Mono', Monaco, monospace; }
        .fu-td.right { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; font-family: 'Sora', sans-serif; }
        .fu-td.right.income { color: #4f6b52; }
        .fu-td.right.expense { color: #8a5566; }
        .fu-td.by {
          color: #8b8f9b; font-size: 0.75rem; white-space: nowrap;
        }
        .fu-td.by strong { color: #4a4f5c; font-weight: 600; }

        .fu-cat-badge {
          display: inline-block; padding: 4px 11px;
          border-radius: 8px; font-size: 0.72rem; font-weight: 600;
        }
        .fu-cat-badge.income { background: #eef5ee; color: #4f6b52; }
        .fu-cat-badge.expense { background: #faf0f2; color: #8a5566; }

        .fu-status-badge {
          display: inline-block; padding: 4px 11px;
          border-radius: 8px; font-size: 0.72rem; font-weight: 600;
          text-transform: capitalize;
        }
        .fu-status-badge.completed { background: #eef5ee; color: #4f6b52; }
        .fu-status-badge.pending { background: #faf6ec; color: #8a6a3d; }
        .fu-status-badge.cancelled { background: #faf0f2; color: #8a5566; }

        .fu-actions { display: flex; gap: 6px; justify-content: flex-end; }
        .fu-btn {
          width: 32px; height: 32px; border-radius: 9px;
          border: 1px solid #eae7e0; background: #ffffff;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; color: #8b8f9b; transition: all 0.2s ease;
        }
        .fu-btn:hover { background: #fbfaf7; color: #2c2f38; }
        .fu-btn.edit:hover { color: #4f6888; border-color: #dbe6f0; background: #f3f7fb; }
        .fu-btn.delete:hover { color: #8a5566; border-color: #f0dadd; background: #faf3f4; }
        .fu-btn.save { color: #fff; border-color: #5e8060; background: #5e8060; }
        .fu-btn.save:hover { background: #4d6b50; }
        .fu-btn.cancel:hover { color: #8a5566; border-color: #f0dadd; background: #faf3f4; }

        .fu-form-row { background: #f9f7f2 !important; }
        .fu-input {
          width: 100%; padding: 9px 12px;
          border: 1.5px solid #b8a4d4; border-radius: 9px;
          font-size: 0.82rem; font-family: inherit;
          outline: none; box-sizing: border-box;
          background: #fff; color: #1a1d26;
        }
        .fu-input:focus { box-shadow: 0 0 0 4px #f1eaf7; }
        .fu-input.sm { padding: 7px 9px; font-size: 0.78rem; }

        .fu-toast {
          position: fixed; top: 24px; left: 50%;
          transform: translateX(-50%);
          background: #1a1d26; color: #ffffff;
          padding: 12px 20px; border-radius: 12px;
          font-size: 0.83rem; font-weight: 500;
          display: flex; align-items: center; gap: 10px;
          box-shadow: 0 20px 44px -16px rgba(26,29,38,0.5);
          z-index: 1000;
        }
      `}</style>

      <div className="fu-root">
        {/* Header */}
        <div className="fu-head">
          <div className="fu-head-left">
            <div className="fu-head-mark">
              <Coins size={22} strokeWidth={1.9} />
            </div>
            <div>
              <h1>Funding Usage</h1>
              <p>Click a project below to update its transaction ledger.</p>
            </div>
          </div>
          <button className="fu-refresh" onClick={fetchProjects} disabled={loading}>
            <RefreshCw size={13} strokeWidth={2.2} />
            Refresh
          </button>
        </div>

        {/* ─── View 1: Project grid ─── */}
        {selectedProjectId === null && (
          <>
            <div className="fu-projects-head">
              <div>
                <h2 className="fu-projects-title">All Projects</h2>
                <div className="fu-projects-sub">
                  {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} · click any card to edit its funding ledger
                </div>
              </div>
              <div className="fu-project-search">
                <Search size={14} color="#a4a8b4" strokeWidth={2.2} />
                <input
                  type="text"
                  placeholder="Search by name, department, location…"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="fu-empty">Loading projects…</div>
            ) : error ? (
              <div className="fu-error">{error}</div>
            ) : filteredProjects.length === 0 ? (
              <div className="fu-empty">
                <FolderKanban size={28} strokeWidth={1.6} />
                <h3>No projects found</h3>
                <p>Try adjusting your search.</p>
              </div>
            ) : (
              <div className="fu-project-grid">
                {filteredProjects.map((p) => {
                  const accent = accentFor(p.department);
                  const allocated = p.budgetAllocated || 0;
                  const used = p.budgetUsed || 0;
                  const utilization = allocated > 0 ? (used / allocated) * 100 : 0;
                  const progressColor =
                    utilization < 30 ? '#c9a86b'
                    : utilization < 60 ? '#a4b88f'
                    : utilization < 85 ? '#7c9c7a'
                    : '#5e8060';

                  return (
                    <div
                      key={p.id}
                      className="fu-card"
                      onClick={() => setSelectedProjectId(p.id)}
                    >
                      <div className="fu-card-accent" style={{ background: accent.fg }} />

                      <div className="fu-card-head">
                        <div
                          className="fu-card-mark"
                          style={{ background: accent.bg, color: accent.fg, boxShadow: `inset 0 0 0 1px ${accent.ring}` }}
                        >
                          <Building2 size={18} strokeWidth={2.1} />
                        </div>
                        <div className="fu-card-title">{p.title}</div>
                      </div>

                      <div className="fu-card-meta">
                        {p.department && (
                          <span><Building2 size={12} strokeWidth={2.2} /> {p.department}</span>
                        )}
                        {p.location && (
                          <span><MapPin size={12} strokeWidth={2.2} /> {p.location}</span>
                        )}
                      </div>

                      <div className="fu-card-progress">
                        <div className="fu-progress-head">
                          <span>Utilization</span>
                          <span className="pct">{utilization.toFixed(0)}%</span>
                        </div>
                        <div className="fu-progress-track">
                          <div
                            className="fu-progress-fill"
                            style={{ width: `${Math.min(utilization, 100)}%`, background: progressColor }}
                          />
                        </div>
                      </div>

                      <div className="fu-card-foot">
                        <div>
                          <div className="fu-stat-label">Allocated</div>
                          <div className="fu-stat-value">{fmt(allocated)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="fu-stat-label">Used</div>
                          <div className="fu-stat-value used">{fmt(used)}</div>
                        </div>
                      </div>

                      <div className="fu-card-arrow">
                        <ArrowRight size={14} strokeWidth={2.4} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ─── View 2: Selected project ledger ─── */}
        {selectedProjectId !== null && selectedProject && (() => {
          const accent = accentFor(selectedProject.department);
          return (
            <>
              <div className="fu-banner">
                <div className="fu-banner-left">
                  <div
                    className="fu-banner-mark"
                    style={{ background: accent.bg, color: accent.fg, boxShadow: `inset 0 0 0 1px ${accent.ring}` }}
                  >
                    <Building2 size={20} strokeWidth={2.2} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="fu-banner-title">{selectedProject.title}</div>
                    <div className="fu-banner-meta">
                      {selectedProject.department && (
                        <span><Building2 size={12} /> {selectedProject.department}</span>
                      )}
                      {selectedProject.location && (
                        <span><MapPin size={12} /> {selectedProject.location}</span>
                      )}
                      <span><Wallet size={12} /> {transactions.length} transactions</span>
                    </div>
                  </div>
                </div>
                <button className="fu-back-btn" onClick={() => setSelectedProjectId(null)}>
                  <ArrowLeft size={14} strokeWidth={2.4} />
                  All projects
                </button>
              </div>

              {/* ⭐ Metrics — Total Received now = project.budgetAllocated */}
              <div className="fu-metrics">
                <div className="fu-metric received">
                  <span className="fu-metric-label">
                    <Receipt size={15} strokeWidth={2.2} /> Total Received
                  </span>
                  <div className="fu-metric-value">{fmtFull(totalReceived)}</div>
                  <div className="fu-metric-foot">
                    Allocated budget for this project
                  </div>
                </div>
                <div className="fu-metric spent">
                  <span className="fu-metric-label">
                    <TrendingDown size={15} strokeWidth={2.2} /> Total Spent
                  </span>
                  <div className="fu-metric-value">{fmtFull(totalExpenses)}</div>
                  <div className="fu-metric-foot">
                    {transactions.filter((t) => t.type === 'expense' && t.status === 'completed').length} completed expense transactions
                  </div>
                </div>
                <div className="fu-metric available">
                  <span className="fu-metric-label">
                    <PieChart size={15} strokeWidth={2.2} /> Available Balance
                  </span>
                  <div className="fu-metric-value">{fmtFull(availableBalance)}</div>
                  <div className="fu-metric-foot">Allocated − Spent</div>
                </div>
                <div className="fu-metric pending">
                  <span className="fu-metric-label">
                    <Clock size={15} strokeWidth={2.2} /> Pending
                  </span>
                  <div className="fu-metric-value">{fmtFull(pendingAmount)}</div>
                  <div className="fu-metric-foot">
                    {transactions.filter((t) => t.status === 'pending').length} pending transactions
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="fu-toolbar">
                <div className="fu-toolbar-left">
                  <div className="fu-search">
                    <Search size={14} color="#a4a8b4" strokeWidth={2.2} />
                    <input
                      type="text"
                      placeholder="Search description, category, reference…"
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                    />
                  </div>
                  <select className="fu-select" value={txFilter} onChange={(e) => setTxFilter(e.target.value as any)}>
                    <option value="all">All transactions</option>
                    <option value="income">Income only</option>
                    <option value="expense">Expenses only</option>
                  </select>
                </div>
                <button
                  className="fu-add-btn"
                  onClick={() => { setShowAddForm(true); setEditingId(null); setForm({ ...EMPTY_TX }); }}
                >
                  <Plus size={15} strokeWidth={2.4} />
                  Add transaction
                </button>
              </div>

              {/* Table */}
              <div className="fu-table-wrap">
                <table className="fu-table">
                  <thead>
                    <tr>
                      <th className="fu-th" style={{ width: '120px' }}>Date</th>
                      <th className="fu-th">Description</th>
                      <th className="fu-th" style={{ width: '150px' }}>Category</th>
                      <th className="fu-th" style={{ width: '130px' }}>Reference</th>
                      <th className="fu-th" style={{ width: '160px' }}>Updated by</th>
                      <th className="fu-th" style={{ width: '110px' }}>Status</th>
                      <th className="fu-th" style={{ width: '150px', textAlign: 'right' }}>Amount</th>
                      <th className="fu-th" style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showAddForm && (
                      <tr className="fu-form-row">
                        <td className="fu-td">
                          <input className="fu-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                        </td>
                        <td className="fu-td">
                          <input className="fu-input" type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} autoFocus />
                        </td>
                        <td className="fu-td">
                          <input className="fu-input" type="text" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                        </td>
                        <td className="fu-td">
                          <input className="fu-input" type="text" placeholder="Auto-generated" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                        </td>
                        <td className="fu-td" style={{ color: '#a4a8b4', fontSize: '0.75rem' }}>
                          — you'll be recorded
                        </td>
                        <td className="fu-td">
                          <select className="fu-input sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                            <option value="completed">completed</option>
                            <option value="pending">pending</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </td>
                        <td className="fu-td" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <select className="fu-input sm" style={{ width: 80 }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                              <option value="income">+</option>
                              <option value="expense">−</option>
                            </select>
                            <input className="fu-input" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: 120, textAlign: 'right' }} />
                          </div>
                        </td>
                        <td className="fu-td">
                          <div className="fu-actions">
                            <button className="fu-btn cancel" onClick={() => { setShowAddForm(false); setForm({ ...EMPTY_TX }); }} title="Cancel">
                              <X size={14} strokeWidth={2.4} />
                            </button>
                            <button className="fu-btn save" onClick={(e) => handleAddTransaction(e as any)} title="Save">
                              <Save size={14} strokeWidth={2.4} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {txLoading ? (
                      <tr>
                        <td colSpan={8} className="fu-td">
                          <div className="fu-empty" style={{ border: 'none', background: 'transparent', padding: '50px 20px' }}>
                            Loading transactions…
                          </div>
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 && !showAddForm ? (
                      <tr>
                        <td colSpan={8} className="fu-td">
                          <div className="fu-empty" style={{ border: 'none', background: 'transparent', padding: '50px 20px' }}>
                            <Wallet size={24} strokeWidth={1.6} />
                            <h3>No transactions yet</h3>
                            <p>Click "Add transaction" to record the first entry.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => {
                        const isEditing = editingId === t.id;

                        if (isEditing) {
                          return (
                            <tr key={t.id} className="fu-form-row">
                              <td className="fu-td">
                                <input className="fu-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                              </td>
                              <td className="fu-td">
                                <input className="fu-input" type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} autoFocus />
                              </td>
                              <td className="fu-td">
                                <input className="fu-input" type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                              </td>
                              <td className="fu-td">
                                <input className="fu-input" type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                              </td>
                              <td className="fu-td by">
                                Editing as <strong>you</strong>
                              </td>
                              <td className="fu-td">
                                <select className="fu-input sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                                  <option value="completed">completed</option>
                                  <option value="pending">pending</option>
                                  <option value="cancelled">cancelled</option>
                                </select>
                              </td>
                              <td className="fu-td" style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <select className="fu-input sm" style={{ width: 80 }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                                    <option value="income">+</option>
                                    <option value="expense">−</option>
                                  </select>
                                  <input className="fu-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: 120, textAlign: 'right' }} />
                                </div>
                              </td>
                              <td className="fu-td">
                                <div className="fu-actions">
                                  <button className="fu-btn cancel" onClick={cancelEdit} title="Cancel">
                                    <X size={14} strokeWidth={2.4} />
                                  </button>
                                  <button className="fu-btn save" onClick={() => handleUpdateTransaction(t.id)} title="Save">
                                    <Save size={14} strokeWidth={2.4} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={t.id} className="fu-tr">
                            <td className="fu-td">{formatDate(t.date)}</td>
                            <td className="fu-td" style={{ fontWeight: 500, color: '#1a1d26' }}>{t.description}</td>
                            <td className="fu-td">
                              <span className={`fu-cat-badge ${t.type}`}>{t.category}</span>
                            </td>
                            <td className="fu-td muted">{t.reference}</td>
                            <td className="fu-td by">
                              <strong>{t.updatedBy || t.createdBy || 'System'}</strong>
                            </td>
                            <td className="fu-td">
                              <span className={`fu-status-badge ${t.status}`}>{t.status}</span>
                            </td>
                            <td className={`fu-td right ${t.type}`}>
                              {t.type === 'income' ? '+' : '−'} {fmtFull(t.amount)}
                            </td>
                            <td className="fu-td">
                              <div className="fu-actions">
                                <button className="fu-btn edit" onClick={() => startEdit(t)} title="Edit">
                                  <Edit3 size={14} strokeWidth={2.2} />
                                </button>
                                <button className="fu-btn delete" onClick={() => handleDeleteTransaction(t.id)} title="Delete">
                                  <Trash2 size={14} strokeWidth={2.2} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </div>

      {toast && (
        <div className="fu-toast">
          <CheckCircle2 size={15} strokeWidth={2.4} style={{ color: '#a4d4b0' }} />
          {toast}
        </div>
      )}
    </>
  );
}