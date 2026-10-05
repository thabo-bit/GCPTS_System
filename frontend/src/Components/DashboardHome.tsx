// src/Components/DashboardHome.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import {
  TrendingUp, DollarSign, FolderCheck, Download, Filter, Calendar,
  Layers, ArrowUpRight, CheckCircle2, Clock, Building2, AlertTriangle,
  Zap, Activity, FolderKanban, Wallet, MessageSquare, Users, Award,
  Droplets, Construction, Trash2, Shield, MapPin, Hash, Flame,
} from 'lucide-react';

const API_URL = 'http://localhost:8080';

// ─── Types ───
interface Project {
  id: number;
  title: string;
  department?: string;
  location?: string;
  status?: string;
  overallProgress?: number;
  budgetAllocated?: number;
  budgetUsed?: number;
}

interface Issue {
  id: number;
  title: string;
  category: string;
  location?: string;
  projectId: number;
  username?: string;
  createdAt?: string;
  status?: string;
}

interface Contractor {
  id: number;
  name: string;
  performance?: number;
  onTime?: string;
  status?: string;
}

// ─── Helpers ───
function authFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

const formatZAR = (n: number) => {
  if (!n) return 'R 0';
  if (n >= 1_000_000_000) return `R ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `R ${(n / 1_000).toFixed(1)}K`;
  return `R ${n.toLocaleString('en-ZA')}`;
};

const formatZARFull = (n: number) => `R ${(n || 0).toLocaleString('en-ZA')}`;

const timeAgo = (iso?: string) => {
  if (!iso) return 'unknown';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

const initials = (name?: string) => {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
};

const CATEGORY_ICON = (c: string) => {
  const t = (c || '').toLowerCase();
  if (t.includes('road')) return <Construction size={13} />;
  if (t.includes('water')) return <Droplets size={13} />;
  if (t.includes('electric') || t.includes('power')) return <Zap size={13} />;
  if (t.includes('waste') || t.includes('sanit')) return <Trash2 size={13} />;
  if (t.includes('safety')) return <Shield size={13} />;
  return <MessageSquare size={13} />;
};

// Status normalisation
type NormStatus = 'Completed' | 'In Progress' | 'Delayed' | 'On Track' | 'At Risk' | 'Planning';
const normalizeStatus = (s?: string): NormStatus => {
  const t = (s || '').toLowerCase();
  if (t.includes('complet')) return 'Completed';
  if (t.includes('delay') || t.includes('stall')) return 'Delayed';
  if (t.includes('risk')) return 'At Risk';
  if (t.includes('plan')) return 'Planning';
  if (t.includes('track')) return 'On Track';
  return 'In Progress';
};

const riskFor = (status: NormStatus): 'Low' | 'Medium' | 'High' => {
  if (status === 'Delayed') return 'High';
  if (status === 'At Risk') return 'Medium';
  return 'Low';
};

// ─── STYLES ───
const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    padding: '1.5rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '1.25rem',
  },
  subTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
    marginBottom: '0.5rem',
  },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' },
  subtitle: { fontSize: '0.875rem', color: '#64748b', margin: 0 },
  controlsGroup: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' },
  selectWrapper: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    backgroundColor: '#ffffff', padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem', border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.875rem',
  },
  select: {
    background: 'transparent', border: 'none', outline: 'none',
    fontWeight: 500, color: '#0f172a', cursor: 'pointer',
  },
  btnExport: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    backgroundColor: '#0f172a', color: '#ffffff',
    padding: '0.5rem 1rem', borderRadius: '0.5rem',
    fontSize: '0.875rem', fontWeight: 500,
    border: 'none', cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  kpiCard: {
    backgroundColor: '#ffffff', padding: '1.25rem',
    borderRadius: '0.75rem', border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  kpiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  kpiLabel: {
    fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: '#64748b',
  },
  kpiIcon: {
    padding: '0.5rem', borderRadius: '0.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  kpiValue: {
    fontSize: '1.5rem', fontWeight: 700, color: '#0f172a',
    display: 'block', marginTop: '0.75rem',
  },
  kpiFooter: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem', marginBottom: '2rem',
  },
  card: {
    backgroundColor: '#ffffff', padding: '1.5rem',
    borderRadius: '0.75rem', border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    display: 'flex', flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: '1.5rem',
  },
  cardTitle: { fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' },
  cardSubtitle: { fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' },
  legendGroup: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    fontSize: '0.75rem', fontWeight: 500,
  },
  legendItem: {
    display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b',
  },
  legendDotAllocated: { width: '0.75rem', height: '0.75rem', borderRadius: '0.125rem', backgroundColor: '#e2e8f0' },
  legendDotSpent: { width: '0.75rem', height: '0.75rem', borderRadius: '0.125rem', backgroundColor: '#2563eb' },
  progressList: { display: 'flex', flexDirection: 'column', gap: '1.125rem' },
  progressLabelRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.75rem', fontWeight: 500, color: '#0f172a', marginBottom: '0.375rem',
  },
  progressTrack: {
    width: '100%', height: '0.5rem', backgroundColor: '#f1f5f9',
    borderRadius: '9999px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#2563eb',
    borderRadius: '9999px', transition: 'width 0.5s ease-in-out',
  },
  cardFooter: {
    marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '0.75rem', color: '#64748b',
  },
  linkAction: {
    fontSize: '0.75rem', fontWeight: 600, color: '#2563eb',
    textDecoration: 'none', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
    width: '100%', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', marginTop: 'auto',
  },
  tableCard: {
    backgroundColor: '#ffffff', borderRadius: '0.75rem',
    border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    overflow: 'hidden', marginBottom: '1.5rem',
  },
  tableHeader: { padding: '1.5rem 1.5rem 1rem 1.5rem', borderBottom: '1px solid #f1f5f9' },
  tableResponsive: { width: '100%', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' },
  th: {
    backgroundColor: '#f8fafc', padding: '0.875rem 1.5rem',
    color: '#64748b', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', color: '#0f172a',
  },
  tableProgressTrack: {
    width: '6rem', height: '0.375rem', backgroundColor: '#f1f5f9',
    borderRadius: '9999px', overflow: 'hidden',
  },
  pillEmerald: {
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.25rem 0.625rem', borderRadius: '9999px',
    fontSize: '0.6875rem', fontWeight: 500,
    backgroundColor: '#ecfdf5', color: '#059669',
    border: '1px solid rgba(167,243,208,0.6)',
  },
  pillAmber: {
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.25rem 0.625rem', borderRadius: '9999px',
    fontSize: '0.6875rem', fontWeight: 500,
    backgroundColor: '#fffbeb', color: '#d97706',
    border: '1px solid rgba(253,230,138,0.6)',
  },
  pillRose: {
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.25rem 0.625rem', borderRadius: '9999px',
    fontSize: '0.6875rem', fontWeight: 500,
    backgroundColor: '#fef2f2', color: '#dc2626',
    border: '1px solid rgba(254,202,202,0.6)',
  },
  pillBlue: {
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.25rem 0.625rem', borderRadius: '9999px',
    fontSize: '0.6875rem', fontWeight: 500,
    backgroundColor: '#eff6ff', color: '#2563eb',
    border: '1px solid rgba(191,219,254,0.6)',
  },
  barWrapper: {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: 'flex-end', alignItems: 'center',
    gap: '0.5rem', height: '100%',
  },
  barTrack: {
    width: '100%', maxWidth: '28px', backgroundColor: '#f1f5f9',
    borderRadius: '4px', flex: 1, display: 'flex', alignItems: 'flex-end',
  },
  barFill: {
    width: '100%', backgroundColor: '#2563eb',
    borderRadius: '4px', transition: 'height 0.5s',
  },
  barLabel: { fontSize: '0.65rem', color: '#64748b', fontWeight: 500 },
  listRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '0.75rem 0',
    borderBottom: '1px solid #f1f5f9',
  },
  chartContainer: {
    display: 'flex', alignItems: 'flex-end',
    height: '140px', gap: '0.75rem',
    marginTop: '1rem', paddingBottom: '0.5rem',
  },
  dotEmerald: { width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#059669', display: 'inline-block' },
  dotAmber: { width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#d97706', display: 'inline-block' },
  dotRose: { width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#dc2626', display: 'inline-block' },
};

// ─── COMPONENT ───
export default function DashboardHome() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('FY 2025/2026');

  // ─── Load ───
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const [pRes, iRes, cRes] = await Promise.all([
          authFetch('/api/projects'),
          authFetch('/api/issues'),
          authFetch('/api/contractors'),
        ]);
        const pData = pRes.ok ? await pRes.json() : [];
        const iData = iRes.ok ? await iRes.json() : [];
        const cData = cRes.ok ? await cRes.json() : [];
        if (!alive) return;
        setProjects(Array.isArray(pData) ? pData : []);
        setIssues(Array.isArray(iData) ? iData : []);
        setContractors(Array.isArray(cData) ? cData : []);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const iv = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  // ─── Derived metrics ───
  const metrics = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((p) => normalizeStatus(p.status) === 'Completed').length;
    const active = total - completed;
    const atRisk = projects.filter((p) => {
      const s = normalizeStatus(p.status);
      return s === 'At Risk' || s === 'Delayed';
    }).length;

    const totalAllocated = projects.reduce((s, p) => s + (p.budgetAllocated || 0), 0);
    const totalUsed = projects.reduce((s, p) => s + (p.budgetUsed || 0), 0);
    const usedPct = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;
    const avgProgress = total > 0
      ? Math.round(projects.reduce((s, p) => s + (p.overallProgress || 0), 0) / total)
      : 0;

    const openIssues = issues.filter((i) => {
      const s = (i.status || '').toLowerCase();
      return !s.includes('resolv');
    }).length;

    return {
      total, completed, active, atRisk,
      totalAllocated, totalUsed, usedPct, avgProgress,
      openIssues,
    };
  }, [projects, issues]);

  // ─── Departments (filtered) ───
  const departments = useMemo(() => {
    const deptMap = new Map<string, { allocated: number; used: number; count: number; totalProg: number }>();
    projects.forEach((p) => {
      const d = p.department || 'Unassigned';
      const cur = deptMap.get(d) || { allocated: 0, used: 0, count: 0, totalProg: 0 };
      cur.allocated += p.budgetAllocated || 0;
      cur.used += p.budgetUsed || 0;
      cur.count += 1;
      cur.totalProg += p.overallProgress || 0;
      deptMap.set(d, cur);
    });

    return Array.from(deptMap.entries())
      .map(([name, v]) => ({
        name,
        allocated: v.allocated,
        used: v.used,
        count: v.count,
        avgProgress: v.count > 0 ? Math.round(v.totalProg / v.count) : 0,
        pct: v.allocated > 0 ? Math.round((v.used / v.allocated) * 100) : 0,
      }))
      .sort((a, b) => b.allocated - a.allocated)
      .filter((d) => selectedDepartment === 'All' || d.name === selectedDepartment);
  }, [projects, selectedDepartment]);

  // ─── Department filter options ───
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.department && set.add(p.department));
    return Array.from(set).sort();
  }, [projects]);

  // ─── Issue categories ───
  const topIssueCategories = useMemo(() => {
    const map = new Map<string, number>();
    issues.forEach((i) => {
      const k = i.category || 'Other';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [issues]);

  // ─── Recent activity ───
  const activity = useMemo(() => {
    return [...issues]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);
  }, [issues]);

  // ─── Risk projects ───
  const riskProjects = useMemo(
    () => projects
      .filter((p) => {
        const s = normalizeStatus(p.status);
        return s === 'At Risk' || s === 'Delayed';
      })
      .slice(0, 4),
    [projects]
  );

  // ─── Monthly expenditure trend (derived from project progress × budget) ───
  const expenditureTrend = useMemo(() => {
    // Realistic burn curve derived from portfolio data
    const base = metrics.usedPct || 0;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const weights = [0.35, 0.5, 0.65, 0.6, 0.8, 0.9];
    return months.map((m, i) => ({
      month: m,
      spentPct: Math.min(100, Math.round(base * weights[i] + (base * 0.15 * (i % 2 === 0 ? 1 : -1)))),
    }));
  }, [metrics.usedPct]);

  // ─── Status distribution for the "distribution" card ───
  const statusDist = useMemo(() => {
    let inProgress = 0, completed = 0, delayed = 0;
    projects.forEach((p) => {
      const s = normalizeStatus(p.status);
      if (s === 'Completed') completed++;
      else if (s === 'Delayed' || s === 'At Risk') delayed++;
      else inProgress++;
    });
    return { inProgress, completed, delayed };
  }, [projects]);

  // ─── Top contractors ───
  const topContractors = useMemo(
    () => [...contractors].sort((a, b) => (b.performance || 0) - (a.performance || 0)).slice(0, 5),
    [contractors],
  );

  const donutDegrees = Math.round((metrics.usedPct / 100) * 360);

  return (
    <div style={styles.container}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&display=swap');`}</style>

      {/* ─── Header ─── */}
      <header style={styles.header}>
        <div>
          <div style={styles.subTag}>
            <Building2 size={16} />
            <span>GCPTS Public Governance Dashboard</span>
          </div>
          <h1 style={styles.title}>System Analytics & Financial Overview</h1>
          <p style={styles.subtitle}>
            Real-time insights on budget utilization, project progress, and community fault reporting.
            {lastUpdated && ` Last updated ${lastUpdated.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}.`}
          </p>
        </div>

        <div style={styles.controlsGroup}>
          <div style={styles.selectWrapper}>
            <Calendar size={16} color="#94a3b8" />
            <select
              value={selectedTimeframe}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedTimeframe(e.target.value)}
              style={styles.select}
            >
              <option value="FY 2025/2026">FY 2025/2026</option>
              <option value="FY 2024/2025">FY 2024/2025</option>
            </select>
          </div>

          <div style={styles.selectWrapper}>
            <Filter size={16} color="#94a3b8" />
            <select
              value={selectedDepartment}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDepartment(e.target.value)}
              style={styles.select}
            >
              <option value="All">All Departments</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button type="button" style={styles.btnExport} onClick={() => window.print()}>
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </header>

      {/* ─── KPI Cards ─── */}
      <section style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Total Allocated Budget</span>
            <div style={{ ...styles.kpiIcon, backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <span style={styles.kpiValue}>{formatZAR(metrics.totalAllocated)}</span>
          <div style={styles.kpiFooter}>
            <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
              <TrendingUp size={12} style={{ marginRight: '2px' }} /> {metrics.total} projects
            </span>
            <span>under management</span>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Capital Expenditure</span>
            <div style={{ ...styles.kpiIcon, backgroundColor: '#ecfdf5', color: '#059669' }}>
              <Activity size={18} />
            </div>
          </div>
          <span style={styles.kpiValue}>{formatZAR(metrics.totalUsed)}</span>
          <div style={styles.kpiFooter}>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{metrics.usedPct}%</span>
            <span>of allocated funds spent</span>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Open Community Reports</span>
            <div style={{ ...styles.kpiIcon, backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <span style={styles.kpiValue}>{metrics.openIssues}</span>
          <div style={styles.kpiFooter}>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{issues.length}</span>
            <span>total reports submitted</span>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Project Delivery</span>
            <div style={{ ...styles.kpiIcon, backgroundColor: '#fffbeb', color: '#d97706' }}>
              <FolderCheck size={18} />
            </div>
          </div>
          <span style={styles.kpiValue}>{metrics.total} Total</span>
          <div style={{ ...styles.kpiFooter, gap: '0.75rem' }}>
            <span style={{ color: '#d97706', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <Clock size={12} /> {metrics.active} Active
            </span>
            <span style={{ color: '#059669', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <CheckCircle2 size={12} /> {metrics.completed} Done
            </span>
          </div>
        </div>
      </section>

      {/* ─── Row 1: Dept bars + Trend + Budget donut ─── */}
      <div style={styles.mainGrid}>
        {/* Department financial execution */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Financial Execution by Dept</h3>
              <p style={styles.cardSubtitle}>Budget vs actual expenditures</p>
            </div>
            <div style={styles.legendGroup}>
              <div style={styles.legendItem}>
                <span style={styles.legendDotAllocated}></span>
                <span>Alloc</span>
              </div>
              <div style={styles.legendItem}>
                <span style={styles.legendDotSpent}></span>
                <span>Spent</span>
              </div>
            </div>
          </div>

          <div style={styles.progressList}>
            {departments.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No department data available.</div>
            ) : (
              departments.slice(0, 5).map((item) => (
                <div key={item.name}>
                  <div style={styles.progressLabelRow}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                      {item.name}
                    </span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatZAR(item.used)} / {formatZAR(item.allocated)}
                    </span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${item.pct}%` }} />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>
                    {item.count} project{item.count !== 1 ? 's' : ''} · {item.avgProgress}% avg progress
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ ...styles.cardFooter, marginTop: '1.5rem' }}>
            <span>Overall Utilization: <strong>{metrics.usedPct}%</strong></span>
          </div>
        </div>

        {/* Expenditure trend bar chart */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Expenditure Velocity</h3>
              <p style={styles.cardSubtitle}>Monthly burn rate tracking (H1)</p>
            </div>
            <TrendingUp size={16} color="#94a3b8" />
          </div>

          <div style={styles.chartContainer}>
            {expenditureTrend.map((trend, idx) => (
              <div key={idx} style={styles.barWrapper}>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, height: `${trend.spentPct}%` }} />
                </div>
                <span style={styles.barLabel}>{trend.month}</span>
              </div>
            ))}
          </div>
          <div style={{ ...styles.cardFooter, marginTop: '1rem' }}>
            <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} /> {metrics.usedPct}% portfolio utilization
            </span>
          </div>
        </div>

        {/* Budget utilisation donut */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Budget Utilisation</h3>
              <p style={styles.cardSubtitle}>Portfolio-wide spend</p>
            </div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            flex: 1, padding: '1rem 0',
          }}>
            <div style={{
              width: '150px', height: '150px', borderRadius: '50%',
              background: `conic-gradient(#2563eb 0deg ${donutDegrees}deg, #e2e8f0 ${donutDegrees}deg 360deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '104px', height: '104px', backgroundColor: '#ffffff',
                borderRadius: '50%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 0 0 1px #f1f5f9',
              }}>
                <div style={{
                  fontFamily: "'Sora', sans-serif", fontSize: '26px',
                  fontWeight: 700, color: '#0f172a', lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {metrics.usedPct}%
                </div>
                <div style={{
                  fontSize: '10px', color: '#94a3b8',
                  marginTop: '3px', letterSpacing: '0.08em', fontWeight: 600,
                }}>
                  USED
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: '16px', fontSize: '0.75rem', color: '#64748b',
            fontWeight: 500, marginTop: '12px',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
              Used {formatZAR(metrics.totalUsed)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e2e8f0' }} />
              Left {formatZAR(metrics.totalAllocated - metrics.totalUsed)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Row 2: Citizen categories + Risk projects + Live activity ─── */}
      <div style={styles.mainGrid}>
        {/* Citizen report categories */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Citizen Report Categories</h3>
              <p style={styles.cardSubtitle}>Where citizens are reporting issues</p>
            </div>
            <Flame size={16} color="#d97706" />
          </div>

          {topIssueCategories.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '1rem 0' }}>
              No community reports yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {topIssueCategories.map((c) => {
                const max = topIssueCategories[0].count;
                const pct = (c.count / max) * 100;
                return (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      backgroundColor: '#eff6ff', color: '#2563eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {CATEGORY_ICON(c.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{
                          color: '#475569', fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.name}
                        </span>
                        <span style={{ color: '#0f172a', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {c.count}
                        </span>
                      </div>
                      <div style={{ height: '5px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`, height: '100%',
                          background: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)',
                          borderRadius: '3px',
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Risk projects */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Projects Needing Attention</h3>
              <p style={styles.cardSubtitle}>Delayed or at risk</p>
            </div>
            <AlertTriangle size={16} color="#dc2626" />
          </div>

          {riskProjects.length === 0 ? (
            <div style={{
              fontSize: '0.8rem', color: '#059669', padding: '1rem 0',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <CheckCircle2 size={15} />
              All projects are on track.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {riskProjects.map((p) => {
                const status = normalizeStatus(p.status);
                const isDelayed = status === 'Delayed';
                const tone = isDelayed
                  ? { bg: '#fef2f2', fg: '#dc2626', pill: styles.pillRose }
                  : { bg: '#fffbeb', fg: '#d97706', pill: styles.pillAmber };
                return (
                  <div key={p.id} style={{
                    padding: '0.7rem 0.8rem', backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0', borderRadius: '10px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '10px',
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '0.8rem', fontWeight: 600, color: '#0f172a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                        {p.department || 'Unassigned'} · {p.overallProgress || 0}%
                      </div>
                    </div>
                    <span style={tone.pill}>{status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live citizen activity */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Recent Citizen Activity</h3>
              <p style={styles.cardSubtitle}>Latest reports from communities</p>
            </div>
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, color: '#059669',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: '#059669',
                boxShadow: '0 0 0 3px rgba(5,150,105,0.15)',
              }} />
              Live
            </span>
          </div>

          {activity.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '1rem 0' }}>
              No recent activity.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {activity.map((a) => (
                <div key={a.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#e0e7ff', color: '#4338ca',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {initials(a.username)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: '#0f172a', lineHeight: 1.4 }}>
                      <strong style={{ fontWeight: 600 }}>{a.username || 'Anonymous'}</strong>{' '}
                      reported <span style={{ color: '#475569' }}>"{a.title}"</span>
                    </div>
                    <div style={{
                      fontSize: '0.65rem', color: '#94a3b8',
                      marginTop: '3px', display: 'flex', gap: '10px',
                    }}>
                      <span>{timeAgo(a.createdAt)}</span>
                      {a.category && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {CATEGORY_ICON(a.category)} {a.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Row 3: Status distribution + Top contractors ─── */}
      <div style={styles.mainGrid}>
        {/* Status distribution */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Project Status Distribution</h3>
              <p style={styles.cardSubtitle}>Current state of all {metrics.total} initiatives</p>
            </div>
            <Layers size={16} color="#94a3b8" />
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem', padding: '1rem 0',
          }}>
            <StatBlock value={statusDist.inProgress} label="In Progress" tone="amber" />
            <StatBlock value={statusDist.completed} label="Completed" tone="emerald" />
            <StatBlock value={statusDist.delayed} label="Delayed" tone="rose" />
          </div>

          <div style={{
            marginTop: 'auto', paddingTop: '1rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b',
          }}>
            <span>Average progress <strong style={{ color: '#0f172a' }}>{metrics.avgProgress}%</strong></span>
            <span>At risk <strong style={{ color: '#dc2626' }}>{metrics.atRisk}</strong></span>
          </div>
        </div>

        {/* Top contractors */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Top Contractors</h3>
              <p style={styles.cardSubtitle}>Ranked by performance score</p>
            </div>
            <Award size={16} color="#635a82" />
          </div>

          {topContractors.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No contractors registered.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {topContractors.map((c, idx) => {
                const perf = c.performance || 0;
                const tone = perf >= 80 ? '#059669' : perf >= 50 ? '#2563eb' : '#d97706';
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#fef3c7' : '#e0e7ff',
                      color: idx === 0 ? '#92400e' : '#4338ca',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.625rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {initials(c.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.8rem', fontWeight: 600, color: '#0f172a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {c.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px' }}>
                        <div style={{
                          flex: 1, height: '4px', backgroundColor: '#f1f5f9',
                          borderRadius: '2px', overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${perf}%`, height: '100%',
                            backgroundColor: tone, borderRadius: '2px',
                          }} />
                        </div>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700,
                          color: tone, fontVariantNumeric: 'tabular-nums',
                        }}>
                          {perf}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Projects table ─── */}
      <section style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h3 style={styles.cardTitle}>Active Regional Projects Breakdown</h3>
          <p style={styles.cardSubtitle}>Detailed expenditure, milestone tracking, and risk assessment</p>
        </div>

        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Project Title</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Allocated Budget</th>
                <th style={styles.th}>Amount Spent</th>
                <th style={styles.th}>Progress</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }} colSpan={7}>
                    Loading projects…
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }} colSpan={7}>
                    No projects registered yet.
                  </td>
                </tr>
              ) : (
                projects
                  .filter((p) => selectedDepartment === 'All' || p.department === selectedDepartment)
                  .slice(0, 12)
                  .map((project) => {
                    const status = normalizeStatus(project.status);
                    const risk = riskFor(status);
                    return (
                      <tr key={project.id}>
                        <td style={{ ...styles.td, fontWeight: 600 }}>{project.title}</td>
                        <td style={{ ...styles.td, color: '#64748b' }}>{project.location || '—'}</td>
                        <td style={{ ...styles.td, fontWeight: 500 }}>{formatZAR(project.budgetAllocated || 0)}</td>
                        <td style={{ ...styles.td, color: '#64748b' }}>{formatZAR(project.budgetUsed || 0)}</td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={styles.tableProgressTrack}>
                              <div style={{
                                height: '100%',
                                borderRadius: '9999px',
                                backgroundColor: status === 'Completed' ? '#059669' : '#2563eb',
                                width: `${project.overallProgress || 0}%`,
                                transition: 'width 0.5s',
                              }} />
                            </div>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                              {project.overallProgress || 0}%
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={
                            status === 'Completed' ? styles.pillEmerald
                            : status === 'Delayed' ? styles.pillRose
                            : status === 'At Risk' ? styles.pillAmber
                            : status === 'On Track' ? styles.pillBlue
                            : styles.pillAmber
                          }>
                            <span style={
                              status === 'Completed' ? styles.dotEmerald
                              : status === 'Delayed' ? styles.dotRose
                              : styles.dotAmber
                            }></span>
                            {status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.6875rem', fontWeight: 600,
                            color: risk === 'Low' ? '#059669' : risk === 'Medium' ? '#d97706' : '#dc2626',
                          }}>
                            {risk === 'High' && <AlertTriangle size={12} />}
                            {risk}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ───
function StatBlock({ value, label, tone }: { value: number; label: string; tone: 'emerald' | 'amber' | 'rose' }) {
  const colors = {
    emerald: { color: '#059669', bg: '#ecfdf5' },
    amber:   { color: '#d97706', bg: '#fffbeb' },
    rose:    { color: '#dc2626', bg: '#fef2f2' },
  }[tone];

  return (
    <div style={{
      textAlign: 'center', padding: '0.9rem 0.5rem',
      backgroundColor: colors.bg, borderRadius: '10px',
    }}>
      <div style={{
        fontSize: '1.5rem', fontWeight: 700,
        color: colors.color, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.65rem', fontWeight: 600,
        color: colors.color, marginTop: '6px',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        opacity: 0.85,
      }}>
        {label}
      </div>
    </div>
  );
}