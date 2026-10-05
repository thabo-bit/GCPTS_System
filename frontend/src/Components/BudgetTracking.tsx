// components/BudgetTracking.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, PiggyBank, Percent, Search, Download,
  RefreshCw, Building2, HeartPulse, Droplets, GraduationCap,
  TreePine, Landmark, HeartHandshake, CheckCircle2, AlertTriangle,
  Clock, Layers, BarChart3, ShieldCheck, Sparkles, X,
  Coins, HandCoins, Globe2, Briefcase
} from 'lucide-react';

type SectorKey = 'health' | 'sanitation' | 'infrastructure' | 'education' | 'environment' | 'community';
type SourceKey = 'national' | 'provincial' | 'municipal' | 'ngo' | 'donor';

interface BudgetAllocation {
  id: number;
  sector: SectorKey;
  sectorLabel: string;
  program: string;
  entity: string;
  entityType: 'department' | 'ngo';
  source: SourceKey;
  sourceLabel: string;
  allocated: number;
  committed: number;
  spent: number;
  fiscalYear: string;
  status: 'On Track' | 'Delayed' | 'Under Review' | 'Completed';
  region: string;
}

interface SectorConfig {
  key: SectorKey;
  label: string;
  icon: React.ComponentType<any>;
  tone: { bg: string; text: string; accent: string; ring: string };
}

interface SourceConfig {
  key: SourceKey;
  label: string;
  icon: React.ComponentType<any>;
  tone: { bg: string; text: string };
}

const SECTORS: SectorConfig[] = [
  { key: 'health',         label: 'Health',            icon: HeartPulse,      tone: { bg: '#f8e9ec', text: '#8a5566', accent: '#d8a2b0', ring: '#f0d5db' } },
  { key: 'sanitation',     label: 'Sanitation',        icon: Droplets,        tone: { bg: '#e5eef8', text: '#4f6888', accent: '#7f9dc4', ring: '#d0dcef' } },
  { key: 'infrastructure', label: 'Infrastructure',    icon: Landmark,        tone: { bg: '#f8ecdf', text: '#8a5f3d', accent: '#e0b280', ring: '#eeddbf' } },
  { key: 'education',      label: 'Education',         icon: GraduationCap,   tone: { bg: '#e8f4ee', text: '#4a7a5c', accent: '#8fb89c', ring: '#d4e5da' } },
  { key: 'environment',    label: 'Environment',       icon: TreePine,        tone: { bg: '#eef1e9', text: '#566b47', accent: '#a4b88f', ring: '#dbe3cf' } },
  { key: 'community',      label: 'Community & NGOs',  icon: HeartHandshake,  tone: { bg: '#eeeaf7', text: '#635a82', accent: '#b8a4d4', ring: '#ddd3ea' } },
];

const SOURCES: SourceConfig[] = [
  { key: 'national',   label: 'National Treasury',    icon: Landmark,       tone: { bg: '#e5eef8', text: '#4f6888' } },
  { key: 'provincial', label: 'Provincial Grant',     icon: Globe2,         tone: { bg: '#eef1e9', text: '#566b47' } },
  { key: 'municipal',  label: 'Municipal Budget',     icon: Building2,      tone: { bg: '#f8ecdf', text: '#8a5f3d' } },
  { key: 'ngo',        label: 'NGO / Civil Society',  icon: HeartHandshake, tone: { bg: '#e8f4ee', text: '#4a7a5c' } },
  { key: 'donor',      label: 'International Donor',  icon: HandCoins,      tone: { bg: '#eeeaf7', text: '#635a82' } },
];

const SEED: BudgetAllocation[] = [
  // HEALTH
  { id: 1,  sector: 'health', sectorLabel: 'Health', program: 'Primary Healthcare Clinics Upgrade', entity: 'Department of Health',                    entityType: 'department', source: 'provincial', sourceLabel: 'Provincial Grant',   allocated: 12500000, committed: 9800000, spent: 7200000, fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 32 - Kimberley' },
  { id: 2,  sector: 'health', sectorLabel: 'Health', program: 'Emergency Medical Services Fleet',   entity: 'Department of Health',                    entityType: 'department', source: 'national',   sourceLabel: 'National Treasury',  allocated: 6800000,  committed: 5200000, spent: 4100000, fiscalYear: '2026/2027', status: 'On Track',     region: 'Province-wide' },
  { id: 3,  sector: 'health', sectorLabel: 'Health', program: 'Kimberley Hospital Repairs',         entity: 'Workers of Society Organisation',         entityType: 'ngo',        source: 'ngo',        sourceLabel: 'NGO / Civil Society', allocated: 438939,   committed: 438939,  spent: 210000,  fiscalYear: '2026/2027', status: 'Under Review', region: 'Ward 32 - Kimberley' },

  // SANITATION
  { id: 4,  sector: 'sanitation', sectorLabel: 'Sanitation', program: 'Galeshewe Stormwater Drainage',   entity: 'Water & Sanitation',                     entityType: 'department', source: 'municipal',  sourceLabel: 'Municipal Budget',   allocated: 4500000,  committed: 3200000, spent: 1800000, fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 4 - Galeshewe' },
  { id: 5,  sector: 'sanitation', sectorLabel: 'Sanitation', program: 'Rural Sanitation System Upgrade',  entity: 'Water & Sanitation',                     entityType: 'department', source: 'national',   sourceLabel: 'National Treasury',  allocated: 2000000,  committed: 1800000, spent: 1300000, fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 3 - Beaconsfield' },
  { id: 6,  sector: 'sanitation', sectorLabel: 'Sanitation', program: 'Water Supply Network Extension',   entity: 'Water & Sanitation',                     entityType: 'department', source: 'provincial', sourceLabel: 'Provincial Grant',   allocated: 2800000,  committed: 2100000, spent: 1200000, fiscalYear: '2026/2027', status: 'Delayed',      region: 'Ward 12 - CBD' },

  // INFRASTRUCTURE
  { id: 7,  sector: 'infrastructure', sectorLabel: 'Infrastructure', program: 'Road Paving & Resurfacing',      entity: 'Transport & Infrastructure',              entityType: 'department', source: 'municipal',  sourceLabel: 'Municipal Budget',   allocated: 3400000,  committed: 2900000, spent: 2300000, fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 7 - Roodepan' },
  { id: 8,  sector: 'infrastructure', sectorLabel: 'Infrastructure', program: 'CBD Smart Solar Streetlights',   entity: 'Electrical Engineering',                  entityType: 'department', source: 'national',   sourceLabel: 'National Treasury',  allocated: 2100000,  committed: 1500000, spent: 800000,  fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 12 - CBD' },
  { id: 9,  sector: 'infrastructure', sectorLabel: 'Infrastructure', program: 'Community Hall Renovation',      entity: 'Public Works',                            entityType: 'department', source: 'municipal',  sourceLabel: 'Municipal Budget',   allocated: 1200000,  committed: 1200000, spent: 900000,  fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 4 - Galeshewe' },

  // EDUCATION
  { id: 10, sector: 'education', sectorLabel: 'Education', program: 'Roodepan Youth Digital Bootcamp',  entity: 'NC Youth Digital Empowerment Trust',      entityType: 'ngo',        source: 'ngo',        sourceLabel: 'NGO / Civil Society', allocated: 850000,   committed: 620000,  spent: 420000,  fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 7 - Roodepan' },
  { id: 11, sector: 'education', sectorLabel: 'Education', program: 'School Infrastructure Refurbishment', entity: 'Department of Education',              entityType: 'department', source: 'provincial', sourceLabel: 'Provincial Grant',   allocated: 5600000,  committed: 4200000, spent: 3100000, fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 4 - Galeshewe' },

  // ENVIRONMENT
  { id: 12, sector: 'environment', sectorLabel: 'Environment', program: 'Clean Rivers Waste-to-Wealth',      entity: 'Green Kimberley Eco-Alliance',            entityType: 'ngo',        source: 'ngo',        sourceLabel: 'NGO / Civil Society', allocated: 420000,   committed: 380000,  spent: 260000,  fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 3 - Beaconsfield' },
  { id: 13, sector: 'environment', sectorLabel: 'Environment', program: 'Kamfers Dam Restoration',           entity: 'Environmental Affairs',                   entityType: 'department', source: 'donor',      sourceLabel: 'International Donor', allocated: 3200000,  committed: 2400000, spent: 1400000, fiscalYear: '2026/2027', status: 'Under Review', region: 'Ward 3 - Beaconsfield' },

  // COMMUNITY / NGO
  { id: 14, sector: 'community', sectorLabel: 'Community & NGOs', program: 'Homestead Public Park',          entity: 'Parks & Urban Greening',                  entityType: 'department', source: 'municipal',  sourceLabel: 'Municipal Budget',   allocated: 1150000,  committed: 1150000, spent: 750000,  fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 9 - Homestead' },
  { id: 15, sector: 'community', sectorLabel: 'Community & NGOs', program: 'Sports Field Development',       entity: 'Community Services',                      entityType: 'department', source: 'municipal',  sourceLabel: 'Municipal Budget',   allocated: 1500000,  committed: 1300000, spent: 750000,  fiscalYear: '2026/2027', status: 'On Track',     region: 'Ward 9 - Homestead' },
  { id: 16, sector: 'community', sectorLabel: 'Community & NGOs', program: 'Youth Volunteer Program',        entity: 'Green Kimberley Alliance',                entityType: 'ngo',        source: 'ngo',        sourceLabel: 'NGO / Civil Society', allocated: 320000,   committed: 280000,  spent: 180000,  fiscalYear: '2026/2027', status: 'On Track',     region: 'Province-wide' },
];

const C = {
  ink: '#2b2d3a',
  inkSoft: '#6a6d80',
  inkMuted: '#a4a7b8',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.9)',
  hairDark: 'rgba(160,165,190,0.14)',
  mint: { bg: '#e8f4ee', text: '#4a7a5c', accent: '#8fb89c', glow: 'rgba(143,184,156,0.35)' },
  lavender: { bg: '#eeeaf7', text: '#635a82', accent: '#b8a4d4', glow: 'rgba(184,164,212,0.35)' },
  peach: { bg: '#f8ecdf', text: '#8a5f3d', accent: '#e0b280', glow: 'rgba(224,178,128,0.35)' },
  sky: { bg: '#e5eef8', text: '#4f6888', accent: '#7f9dc4', glow: 'rgba(127,157,196,0.35)' },
  rose: { bg: '#f8e9ec', text: '#8a5566', accent: '#d8a2b0', glow: 'rgba(216,162,176,0.35)' },
};

const statusStyle = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('delayed')) return { bg: C.rose.bg, text: C.rose.text, icon: AlertTriangle };
  if (s.includes('completed')) return { bg: C.lavender.bg, text: C.lavender.text, icon: CheckCircle2 };
  if (s.includes('review')) return { bg: C.peach.bg, text: C.peach.text, icon: Clock };
  return { bg: C.mint.bg, text: C.mint.text, icon: CheckCircle2 };
};

export default function BudgetTracking() {
  const [sectorFilter, setSectorFilter] = useState<'all' | SectorKey>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | SourceKey>('all');
  const [fiscalYear, setFiscalYear] = useState('2026/2027');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3200);
    return () => clearTimeout(t);
  }, [notification]);

  const fmt = (n: number) => {
    if (n >= 1000000) return `R ${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `R ${(n / 1000).toFixed(0)}k`;
    return `R ${n}`;
  };
  const fmtFull = (n: number) => `R ${(n || 0).toLocaleString('en-ZA')}`;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SEED.filter((b) => {
      const mSector = sectorFilter === 'all' || b.sector === sectorFilter;
      const mSource = sourceFilter === 'all' || b.source === sourceFilter;
      const mSearch =
        !q ||
        b.program.toLowerCase().includes(q) ||
        b.entity.toLowerCase().includes(q) ||
        b.region.toLowerCase().includes(q);
      return mSector && mSource && mSearch;
    });
  }, [sectorFilter, sourceFilter, search]);

  const totals = useMemo(() => {
    const allocated = filtered.reduce((a, c) => a + c.allocated, 0);
    const spent = filtered.reduce((a, c) => a + c.spent, 0);
    const ngoAllocated = filtered.filter((b) => b.source === 'ngo' || b.source === 'donor').reduce((a, c) => a + c.allocated, 0);
    return {
      allocated, spent,
      remaining: allocated - spent,
      ngoAllocated,
      utilization: allocated > 0 ? (spent / allocated) * 100 : 0,
      ngoShare: allocated > 0 ? (ngoAllocated / allocated) * 100 : 0,
    };
  }, [filtered]);

  const sectorTotals = useMemo(() => {
    return SECTORS.map((s) => {
      const items = filtered.filter((b) => b.sector === s.key);
      const allocated = items.reduce((a, c) => a + c.allocated, 0);
      const spent = items.reduce((a, c) => a + c.spent, 0);
      return {
        ...s,
        count: items.length,
        allocated, spent,
        utilization: allocated > 0 ? (spent / allocated) * 100 : 0,
      };
    }).filter((s) => s.count > 0);
  }, [filtered]);

  const handleSync = async () => {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 600));
    setSyncing(false);
    setNotification('Financial ledger synced with provincial treasury.');
  };

  const handleExport = () => {
    setNotification('Compiling sectoral budget report for export…');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .bt-root {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          color: ${C.ink};
          padding: 4px 0 32px;
          -webkit-font-smoothing: antialiased;
        }

        .bt-head {
          display: flex; justify-content: space-between; align-items: center;
          gap: 20px; flex-wrap: wrap; margin-bottom: 22px;
        }
        .bt-head-left { display: flex; align-items: center; gap: 14px; }
        .bt-head-mark {
          width: 46px; height: 46px; border-radius: 14px;
          background: linear-gradient(135deg, #c4d4e8, #b8a4d4);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 18px -6px rgba(184,164,212,0.5), inset 0 1px 0 rgba(255,255,255,0.6);
          color: #fff; flex-shrink: 0;
        }
        .bt-head-text h1 {
          font-family: 'Sora', sans-serif; font-size: 1.15rem;
          font-weight: 600; color: ${C.ink}; margin: 0;
          letter-spacing: -0.02em;
        }
        .bt-head-text p {
          font-size: 0.75rem; color: ${C.inkMuted}; margin: 3px 0 0;
        }

        .bt-pill-live {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 999px;
          background: ${C.glass}; backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          font-size: 0.72rem; color: ${C.inkSoft};
          font-weight: 500;
          box-shadow: 0 4px 14px -8px rgba(80,90,130,0.2);
        }
        .bt-pill-live .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: ${C.mint.accent};
          box-shadow: 0 0 0 3px ${C.mint.bg};
          animation: bt-pulse 2.4s ease-in-out infinite;
        }
        @keyframes bt-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .bt-toolbar {
          display: flex; gap: 14px; align-items: center;
          justify-content: space-between; flex-wrap: wrap;
          padding: 14px 18px; border-radius: 20px;
          background: ${C.glass}; backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 8px 24px -18px rgba(80,90,130,0.3);
          margin-bottom: 20px;
        }
        .bt-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .bt-select {
          appearance: none;
          background: rgba(255,255,255,0.7);
          border: 1px solid ${C.glassBorder};
          border-radius: 11px;
          padding: 9px 32px 9px 14px;
          font-size: 0.8rem;
          color: ${C.ink};
          font-family: inherit;
          cursor: pointer; outline: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23a4a7b8' stroke-width='1.3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>");
          background-repeat: no-repeat;
          background-position: right 12px center;
          transition: all 0.2s ease;
        }
        .bt-select:hover { background-color: rgba(255,255,255,0.9); }
        .bt-select:focus { border-color: ${C.lavender.accent}; box-shadow: 0 0 0 4px ${C.lavender.bg}; }

        .bt-search {
          display: flex; align-items: center; gap: 9px;
          background: rgba(255,255,255,0.7);
          border: 1px solid ${C.glassBorder};
          border-radius: 11px; padding: 9px 14px;
          min-width: 240px; transition: all 0.2s ease;
        }
        .bt-search:focus-within {
          border-color: ${C.lavender.accent};
          box-shadow: 0 0 0 4px ${C.lavender.bg};
          background: #fff;
        }
        .bt-search input {
          border: none; background: transparent; outline: none;
          width: 100%; font-size: 0.82rem;
          color: ${C.ink}; font-family: inherit;
        }
        .bt-search input::placeholder { color: ${C.inkMuted}; }

        .bt-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 11px;
          border: 1px solid transparent;
          font-size: 0.8rem; font-weight: 600;
          font-family: inherit; cursor: pointer;
          transition: all 0.22s ease;
          white-space: nowrap;
        }
        .bt-btn.secondary {
          background: rgba(255,255,255,0.7);
          border-color: ${C.glassBorder};
          color: ${C.inkSoft};
        }
        .bt-btn.secondary:hover {
          background: #fff; color: ${C.ink};
          transform: translateY(-1px);
        }
        .bt-btn.primary {
          background: linear-gradient(135deg, #7f9dc4, #b8a4d4);
          color: #fff;
          box-shadow: 0 8px 20px -10px ${C.lavender.glow};
        }
        .bt-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px -10px ${C.lavender.glow};
        }
        .bt-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .bt-btn svg { transition: transform 0.4s ease; }
        .bt-btn.syncing svg { animation: bt-spin 0.9s linear infinite; }
        @keyframes bt-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .bt-metrics {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 22px;
        }
        @media (max-width: 1100px) { .bt-metrics { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .bt-metrics { grid-template-columns: 1fr; } }

        .bt-metric {
          padding: 18px; border-radius: 18px;
          background: ${C.glass}; backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 10px 24px -20px rgba(80,90,130,0.3), inset 0 1px 0 rgba(255,255,255,0.75);
          display: flex; flex-direction: column; gap: 12px;
          transition: all 0.3s ease;
        }
        .bt-metric:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px -24px rgba(80,90,130,0.4);
        }
        .bt-metric-top { display: flex; align-items: center; justify-content: space-between; }
        .bt-metric-label {
          font-size: 0.65rem; letter-spacing: 0.14em;
          text-transform: uppercase; font-weight: 600;
          color: ${C.inkMuted};
        }
        .bt-metric-icon {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6);
        }
        .bt-metric-value {
          font-family: 'Sora', sans-serif; font-size: 1.5rem;
          font-weight: 600; color: ${C.ink}; line-height: 1.1;
          letter-spacing: -0.025em; font-variant-numeric: tabular-nums;
        }
        .bt-metric-value.highlight { color: ${C.mint.text}; }
        .bt-metric-foot {
          font-size: 0.7rem; color: ${C.inkSoft};
          display: flex; align-items: center; gap: 6px; margin-top: 2px;
        }

        .bt-section-label {
          display: flex; align-items: center; gap: 10px;
          margin: 6px 0 14px;
          font-size: 0.68rem; letter-spacing: 0.16em;
          text-transform: uppercase; font-weight: 600;
          color: ${C.inkMuted};
        }
        .bt-section-label::after {
          content: ''; flex: 1; height: 1px;
          background: ${C.hairDark};
        }z

        .bt-sector-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 22px;
        }
        .bt-sector {
          padding: 16px 18px; border-radius: 16px;
          background: ${C.glass}; backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 8px 20px -18px rgba(80,90,130,0.3);
          display: flex; flex-direction: column; gap: 12px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .bt-sector:hover { transform: translateY(-3px); }
        .bt-sector.active {
          box-shadow: 0 0 0 2px ${C.lavender.accent}, 0 12px 28px -18px ${C.lavender.glow};
        }
        .bt-sector-top {
          display: flex; justify-content: space-between; align-items: center;
        }
        .bt-sector-icon {
          width: 36px; height: 36px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
        }
        .bt-sector-count {
          font-size: 0.68rem; font-weight: 600;
          color: ${C.inkMuted};
          font-variant-numeric: tabular-nums;
        }
        .bt-sector-name {
          font-size: 0.78rem; font-weight: 600;
          color: ${C.ink};
          letter-spacing: -0.01em;
        }
        .bt-sector-amount {
          font-family: 'Sora', sans-serif;
          font-size: 1.1rem; font-weight: 600;
          color: ${C.ink}; line-height: 1.2;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        .bt-sector-bar {
          height: 5px; border-radius: 999px;
          background: rgba(160,165,190,0.18);
          overflow: hidden;
        }
        .bt-sector-bar-fill {
          height: 100%; border-radius: 999px;
          transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .bt-table-card {
          background: ${C.glass}; backdrop-filter: blur(24px);
          border: 1px solid ${C.glassBorder};
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 18px 44px -30px rgba(80,90,130,0.4), inset 0 1px 0 rgba(255,255,255,0.75);
        }
        .bt-table-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid ${C.hairDark};
          gap: 12px; flex-wrap: wrap;
        }
        .bt-table-title {
          font-family: 'Sora', sans-serif;
          font-size: 0.95rem; font-weight: 600;
          color: ${C.ink};
          display: inline-flex; align-items: center; gap: 9px;
          letter-spacing: -0.01em;
        }
        .bt-table-title-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: ${C.sky.bg}; color: ${C.sky.text};
          display: flex; align-items: center; justify-content: center;
        }
        .bt-table-count {
          font-size: 0.7rem; color: ${C.inkMuted};
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          display: inline-flex; align-items: center; gap: 7px;
          padding: 4px 12px; border-radius: 999px;
          background: rgba(255,255,255,0.6);
          border: 1px solid ${C.glassBorder};
        }

        .bt-table-scroll { overflow-x: auto; }
        .bt-table {
          width: 100%; border-collapse: collapse;
          font-size: 0.83rem; min-width: 1000px;
        }
        .bt-th {
          background: rgba(255,255,255,0.35);
          color: ${C.inkMuted};
          padding: 14px 16px;
          font-weight: 600; font-size: 0.66rem;
          letter-spacing: 0.14em; text-transform: uppercase;
          text-align: left;
          border-bottom: 1px solid ${C.hairDark};
          white-space: nowrap;
        }
        .bt-tr {
          border-bottom: 1px solid ${C.hairDark};
          transition: background 0.2s ease;
        }
        .bt-tr:last-child { border-bottom: none; }
        .bt-tr:hover { background: rgba(255,255,255,0.5); }

        .bt-td {
          padding: 14px 16px;
          color: ${C.inkSoft};
          vertical-align: middle;
        }

        .bt-program-name {
          font-weight: 600; color: ${C.ink};
          font-size: 0.86rem; margin-bottom: 4px;
          line-height: 1.35;
        }
        .bt-program-meta {
          display: inline-flex; align-items: center;
          gap: 10px; font-size: 0.68rem;
          color: ${C.inkMuted}; flex-wrap: wrap;
        }
        .bt-program-meta span {
          display: inline-flex; align-items: center; gap: 4px;
        }

        .bt-sector-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 999px;
          font-size: 0.68rem; font-weight: 500;
          white-space: nowrap;
        }

        .bt-source-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 8px;
          font-size: 0.68rem; font-weight: 500;
          white-space: nowrap;
          border: 1px solid;
        }

        .bt-entity {
          display: inline-flex; align-items: center; gap: 9px;
          min-width: 0;
        }
        .bt-entity-mark {
          width: 30px; height: 30px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6);
        }
        .bt-entity-mark.dept { background: ${C.sky.bg}; color: ${C.sky.text}; }
        .bt-entity-mark.ngo  { background: ${C.mint.bg}; color: ${C.mint.text}; }
        .bt-entity-body { min-width: 0; }
        .bt-entity-name {
          font-size: 0.8rem; font-weight: 600;
          color: ${C.ink}; line-height: 1.25;
        }
        .bt-entity-type {
          font-size: 0.62rem; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: ${C.inkMuted};
          margin-top: 2px;
        }

        .bt-money {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .bt-money.allocated { color: ${C.ink}; }
        .bt-money.spent { color: ${C.sky.text}; }
        .bt-money.remaining { color: ${C.mint.text}; }

        .bt-status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 999px;
          font-size: 0.66rem; font-weight: 600;
          letter-spacing: 0.03em;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6);
        }

        .bt-progress-head {
          display: flex; justify-content: space-between;
          align-items: center; font-size: 0.72rem;
          margin-bottom: 6px; gap: 8px;
        }
        .bt-progress-percent {
          font-family: 'Sora', sans-serif;
          font-weight: 600; color: ${C.ink};
          font-size: 0.82rem;
          font-variant-numeric: tabular-nums;
        }
        .bt-progress-track {
          height: 5px; border-radius: 999px;
          background: rgba(160,165,190,0.18);
          overflow: hidden;
        }
        .bt-progress-fill {
          height: 100%; border-radius: 999px;
          transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .bt-empty {
          text-align: center; padding: 60px 24px;
          color: ${C.inkSoft};
        }
        .bt-empty-icon {
          width: 56px; height: 56px; border-radius: 18px;
          background: ${C.lavender.bg}; color: ${C.lavender.text};
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }
        .bt-empty h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1rem; font-weight: 600;
          color: ${C.ink}; margin: 0 0 4px;
        }
        .bt-empty p { font-size: 0.82rem; margin: 0; }

        .bt-toast {
          position: fixed; top: 24px; left: 50%;
          transform: translateX(-50%);
          display: flex; align-items: center; gap: 12px;
          padding: 13px 20px; border-radius: 999px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 20px 44px -20px rgba(70,80,120,0.4);
          font-size: 0.83rem; color: ${C.ink};
          font-weight: 500; z-index: 999; max-width: 90vw;
        }
        .bt-toast-icon {
          width: 26px; height: 26px; border-radius: 50%;
          background: ${C.mint.bg}; color: ${C.mint.text};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bt-toast button {
          background: none; border: none;
          color: ${C.inkMuted}; cursor: pointer;
          display: flex; padding: 0; margin-left: 4px;
        }
      `}</style>

      <div className="bt-root">
        <div className="bt-head">
          <div className="bt-head-left">
            <div className="bt-head-mark">
              <Coins size={22} strokeWidth={1.9} />
            </div>
            <div className="bt-head-text">
              <h1>Budget Allocation Dashboard</h1>
              <p>Sectoral funding across Health, Sanitation, Infrastructure, Education, Environment & NGOs.</p>
            </div>
          </div>
          <div className="bt-pill-live">
            <span className="dot" />
            Live ledger · synced moments ago
          </div>
        </div>

        <div className="bt-toolbar">
          <div className="bt-filters">
            <select
              className="bt-select"
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value as any)}
            >
              <option value="all">All Sectors</option>
              {SECTORS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>

            <select
              className="bt-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
            >
              <option value="all">All Funding Sources</option>
              {SOURCES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>

            <select
              className="bt-select"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
            >
              <option>Financial Year 2025/2026</option>
              <option>Financial Year 2026/2027</option>
            </select>

            <div className="bt-search">
              <Search size={14} color={C.inkMuted} strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Search program, department, NGO, region…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className={`bt-btn secondary ${syncing ? 'syncing' : ''}`}
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw size={14} strokeWidth={2.2} />
              {syncing ? 'Syncing…' : 'Sync Ledger'}
            </button>
            <button className="bt-btn primary" onClick={handleExport}>
              <Download size={14} strokeWidth={2.2} />
              Export Report
            </button>
          </div>
        </div>

        <div className="bt-metrics">
          <motion.div className="bt-metric"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bt-metric-top">
              <span className="bt-metric-label">Total Allocated</span>
              <div className="bt-metric-icon" style={{ background: C.sky.bg, color: C.sky.text }}>
                <Layers size={16} strokeWidth={2.2} />
              </div>
            </div>
            <div className="bt-metric-value">{fmt(totals.allocated)}</div>
            <div className="bt-metric-foot">
              <BarChart3 size={12} /> {filtered.length} programs · {sectorTotals.length} sectors
            </div>
          </motion.div>

          <motion.div className="bt-metric"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bt-metric-top">
              <span className="bt-metric-label">Total Spent</span>
              <div className="bt-metric-icon" style={{ background: C.peach.bg, color: C.peach.text }}>
                <TrendingUp size={16} strokeWidth={2.2} />
              </div>
            </div>
            <div className="bt-metric-value">{fmt(totals.spent)}</div>
            <div className="bt-metric-foot" style={{ color: C.peach.text }}>
              <Percent size={12} /> {totals.utilization.toFixed(1)}% utilization
            </div>
          </motion.div>

          <motion.div className="bt-metric"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bt-metric-top">
              <span className="bt-metric-label">Available Reserves</span>
              <div className="bt-metric-icon" style={{ background: C.mint.bg, color: C.mint.text }}>
                <PiggyBank size={16} strokeWidth={2.2} />
              </div>
            </div>
            <div className="bt-metric-value highlight">{fmt(totals.remaining)}</div>
            <div className="bt-metric-foot" style={{ color: C.mint.text }}>
              <ShieldCheck size={12} /> Ready for deployment
            </div>
          </motion.div>

          <motion.div className="bt-metric"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bt-metric-top">
              <span className="bt-metric-label">NGO & Donor Funding</span>
              <div className="bt-metric-icon" style={{ background: C.lavender.bg, color: C.lavender.text }}>
                <HeartHandshake size={16} strokeWidth={2.2} />
              </div>
            </div>
            <div className="bt-metric-value">{fmt(totals.ngoAllocated)}</div>
            <div className="bt-metric-foot" style={{ color: C.lavender.text }}>
              <HandCoins size={12} /> {totals.ngoShare.toFixed(1)}% of portfolio
            </div>
          </motion.div>
        </div>

        <div className="bt-section-label">
          <Sparkles size={12} strokeWidth={2.4} />
          Allocation by sector
        </div>
        <div className="bt-sector-grid">
          {sectorTotals.map((s) => {
            const Icon = s.icon;
            const isActive = sectorFilter === s.key;
            return (
              <motion.div
                key={s.key}
                className={`bt-sector ${isActive ? 'active' : ''}`}
                onClick={() => setSectorFilter(isActive ? 'all' : s.key)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bt-sector-top">
                  <div
                    className="bt-sector-icon"
                    style={{ background: s.tone.bg, color: s.tone.text }}
                  >
                    <Icon size={17} strokeWidth={2.1} />
                  </div>
                  <span className="bt-sector-count">{s.count} {s.count === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="bt-sector-name">{s.label}</div>
                <div className="bt-sector-amount">{fmt(s.allocated)}</div>
                <div className="bt-sector-bar">
                  <div
                    className="bt-sector-bar-fill"
                    style={{
                      width: `${s.utilization}%`,
                      background: `linear-gradient(90deg, ${s.tone.accent}, ${s.tone.text})`,
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.68rem', color: C.inkMuted, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Spent: {fmt(s.spent)}</span>
                  <span>{s.utilization.toFixed(0)}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="bt-table-card">
          <div className="bt-table-head">
            <div className="bt-table-title">
              <div className="bt-table-title-icon">
                <Briefcase size={14} strokeWidth={2.2} />
              </div>
              Funding programs ledger
            </div>
            <span className="bt-table-count">
              <Sparkles size={11} strokeWidth={2.4} />
              {filtered.length} of {SEED.length} entries
            </span>
          </div>

          <div className="bt-table-scroll">
            <table className="bt-table">
              <thead>
                <tr>
                  <th className="bt-th">Program</th>
                  <th className="bt-th">Sector</th>
                  <th className="bt-th">Department / NGO</th>
                  <th className="bt-th">Funding Source</th>
                  <th className="bt-th">Allocated</th>
                  <th className="bt-th">Spent</th>
                  <th className="bt-th">Remaining</th>
                  <th className="bt-th">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="bt-td">
                      <div className="bt-empty">
                        <div className="bt-empty-icon">
                          <Search size={24} strokeWidth={1.8} />
                        </div>
                        <h3>No budget allocations found</h3>
                        <p>Try adjusting your filters or search term.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((b, i) => {
                    const sector = SECTORS.find((s) => s.key === b.sector)!;
                    const source = SOURCES.find((s) => s.key === b.source)!;
                    const SectorIcon = sector.icon;
                    const SourceIcon = source.icon;
                    const sc = statusStyle(b.status);
                    const StatusIcon = sc.icon;
                    const util = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0;
                    const progressColor =
                      util < 30 ? '#d8a2b0'
                      : util < 60 ? '#e0b280'
                      : util < 85 ? '#8fb89c'
                      : '#4a7a5c';
                    const remaining = b.allocated - b.spent;
                    const isNgo = b.entityType === 'ngo';

                    return (
                      <motion.tr
                        key={b.id}
                        className="bt-tr"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: i * 0.03 }}
                      >
                        <td className="bt-td">
                          <div className="bt-program-name">{b.program}</div>
                          <div className="bt-program-meta">
                            <span><Globe2 size={11} strokeWidth={2.2} /> {b.region}</span>
                            <span><Clock size={11} strokeWidth={2.2} /> {b.fiscalYear}</span>
                          </div>
                        </td>

                        <td className="bt-td">
                          <span
                            className="bt-sector-tag"
                            style={{ background: sector.tone.bg, color: sector.tone.text }}
                          >
                            <SectorIcon size={11} strokeWidth={2.4} />
                            {sector.label}
                          </span>
                        </td>

                        <td className="bt-td">
                          <div className="bt-entity">
                            <div className={`bt-entity-mark ${isNgo ? 'ngo' : 'dept'}`}>
                              {isNgo ? <HeartHandshake size={14} strokeWidth={2.2} /> : <Building2 size={14} strokeWidth={2.2} />}
                            </div>
                            <div className="bt-entity-body">
                              <div className="bt-entity-name">{b.entity}</div>
                              <div className="bt-entity-type">
                                {isNgo ? 'NGO Partner' : 'Government Department'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="bt-td">
                          <span
                            className="bt-source-tag"
                            style={{
                              background: source.tone.bg,
                              color: source.tone.text,
                              borderColor: source.tone.bg,
                            }}
                          >
                            <SourceIcon size={11} strokeWidth={2.4} />
                            {source.label}
                          </span>
                        </td>

                        <td className="bt-td">
                          <span className="bt-money allocated">{fmtFull(b.allocated)}</span>
                        </td>
                        <td className="bt-td">
                          <span className="bt-money spent">{fmtFull(b.spent)}</span>
                        </td>
                        <td className="bt-td">
                          <span className="bt-money remaining">{fmtFull(remaining)}</span>
                        </td>
                        <td className="bt-td" style={{ minWidth: 190 }}>
                          <div className="bt-progress-head">
                            <span className="bt-progress-percent">{util.toFixed(0)}%</span>
                            <span
                              className="bt-status-pill"
                              style={{ background: sc.bg, color: sc.text }}
                            >
                              <StatusIcon size={10} strokeWidth={2.4} />
                              {b.status}
                            </span>
                          </div>
                          <div className="bt-progress-track">
                            <div
                              className="bt-progress-fill"
                              style={{ width: `${util}%`, background: progressColor }}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <motion.div
            className="bt-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="bt-toast-icon">
              <CheckCircle2 size={14} strokeWidth={2.4} />
            </span>
            {notification}
            <button onClick={() => setNotification(null)}>
              <X size={14} strokeWidth={2.4} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}