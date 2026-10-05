// components/BudgetAllocation.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit3, X, Save, Trash2,
  Building2, HeartHandshake, Landmark, Globe2, HandCoins,
  Layers, TrendingUp, PiggyBank, Percent, Coins,
  CheckCircle2, Sparkles, BarChart3, Wallet,
  HeartPulse, Droplets, GraduationCap, TreePine,
  Briefcase, MapPin, Calendar,
} from 'lucide-react';

// ─── TYPES ───
type SectorKey =
  | 'health'
  | 'sanitation'
  | 'infrastructure'
  | 'education'
  | 'environment'
  | 'community';

type SourceKey = 'national' | 'provincial' | 'municipal' | 'ngo' | 'donor';
type EntityType = 'department' | 'ngo';

interface ProjectLine {
  id: number;
  name: string;
  allocated: number;
  spent: number;
  status: string;
  region: string;
}

interface DepartmentBudget {
  id: number;
  name: string;
  entityType: EntityType;
  sector: SectorKey;
  source: SourceKey;
  fiscalYear: string;
  allocated: number;
  note: string;
  projects: ProjectLine[];
}

interface SectorConfig {
  key: SectorKey;
  label: string;
  icon: React.ComponentType<any>;
  tone: { bg: string; text: string };
}

interface SourceConfig {
  key: SourceKey;
  label: string;
  icon: React.ComponentType<any>;
}

// ─── CONFIG ───
const SECTORS: SectorConfig[] = [
  { key: 'health',         label: 'Health',           icon: HeartPulse,     tone: { bg: '#f8e9ec', text: '#8a5566' } },
  { key: 'sanitation',     label: 'Sanitation',       icon: Droplets,       tone: { bg: '#e5eef8', text: '#4f6888' } },
  { key: 'infrastructure', label: 'Infrastructure',   icon: Landmark,       tone: { bg: '#f8ecdf', text: '#8a5f3d' } },
  { key: 'education',      label: 'Education',        icon: GraduationCap,  tone: { bg: '#e8f4ee', text: '#4a7a5c' } },
  { key: 'environment',    label: 'Environment',      icon: TreePine,       tone: { bg: '#eef1e9', text: '#566b47' } },
  { key: 'community',      label: 'Community & NGOs', icon: HeartHandshake, tone: { bg: '#eeeaf7', text: '#635a82' } },
];

const SOURCES: SourceConfig[] = [
  { key: 'national',   label: 'National Treasury',    icon: Landmark },
  { key: 'provincial', label: 'Provincial Grant',     icon: Globe2 },
  { key: 'municipal',  label: 'Municipal Budget',     icon: Building2 },
  { key: 'ngo',        label: 'NGO / Civil Society',  icon: HeartHandshake },
  { key: 'donor',      label: 'International Donor',  icon: HandCoins },
];

// ─── SEED — 3 departments, each with projects ───
const SEED: DepartmentBudget[] = [
  {
    id: 1,
    name: 'Department of Health',
    entityType: 'department',
    sector: 'health',
    source: 'provincial',
    fiscalYear: '2026/2027',
    allocated: 300000000,
    note: 'Primary healthcare, clinics and hospital upgrades.',
    projects: [
      { id: 101, name: 'Primary Healthcare Clinics Upgrade', allocated: 12500000, spent: 7200000,  status: 'On Track',     region: 'Ward 32 - Kimberley' },
      { id: 102, name: 'Emergency Medical Services Fleet',   allocated: 6800000,  spent: 4100000,  status: 'On Track',     region: 'Province-wide' },
      { id: 103, name: 'Rutanang Clinic Upgrade',            allocated: 9000000,  spent: 5400000,  status: 'On Track',     region: 'Ward 3 - Beaconsfield' },
    ],
  },
  {
    id: 2,
    name: 'Department of Education',
    entityType: 'department',
    sector: 'education',
    source: 'provincial',
    fiscalYear: '2026/2027',
    allocated: 220000000,
    note: 'Schools, learning facilities and youth skills programs.',
    projects: [
      { id: 201, name: 'School Infrastructure Refurbishment', allocated: 5600000, spent: 3100000, status: 'On Track', region: 'Ward 4 - Galeshewe' },
      { id: 202, name: 'Roodepan Digital Bootcamp',           allocated: 850000,  spent: 420000,  status: 'On Track', region: 'Ward 7 - Roodepan' },
    ],
  },
  {
    id: 3,
    name: 'Department of Water and Sanitation',
    entityType: 'department',
    sector: 'sanitation',
    source: 'national',
    fiscalYear: '2026/2027',
    allocated: 180000000,
    note: 'Stormwater, water supply and sanitation infrastructure.',
    projects: [
      { id: 301, name: 'Galeshewe Stormwater Drainage',   allocated: 4500000,  spent: 1800000,  status: 'On Track', region: 'Ward 4 - Galeshewe' },
      { id: 302, name: 'Rural Sanitation System Upgrade', allocated: 2000000,  spent: 1300000,  status: 'On Track', region: 'Ward 3 - Beaconsfield' },
      { id: 303, name: 'Homevale Wastewater Expansion',   allocated: 18000000, spent: 11000000, status: 'Delayed',  region: 'Homevale' },
    ],
  },
];

const C = {
  ink: '#2b2d3a',
  inkSoft: '#6a6d80',
  inkMuted: '#a4a7b8',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.9)',
  hairDark: 'rgba(160,165,190,0.14)',
  mint: { bg: '#e8f4ee', text: '#4a7a5c', accent: '#8fb89c' },
  lavender: { bg: '#eeeaf7', text: '#635a82', accent: '#b8a4d4' },
  peach: { bg: '#f8ecdf', text: '#8a5f3d', accent: '#e0b280' },
  sky: { bg: '#e5eef8', text: '#4f6888', accent: '#7f9dc4' },
  rose: { bg: '#f8e9ec', text: '#8a5566', accent: '#d8a2b0' },
};

const EMPTY_DEPT = {
  name: '',
  entityType: 'department' as EntityType,
  sector: 'health' as SectorKey,
  source: 'municipal' as SourceKey,
  fiscalYear: '2026/2027',
  allocated: '',
  note: '',
};

const EMPTY_PROJECT = {
  name: '',
  allocated: '',
  spent: '',
  status: 'On Track',
  region: '',
};

export default function BudgetAllocation() {
  const [departments, setDepartments] = useState<DepartmentBudget[]>(SEED);

  const [deptForm, setDeptForm] = useState({ ...EMPTY_DEPT });
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);

  const [inlineEditId, setInlineEditId] = useState<number | null>(null);
  const [inlineValue, setInlineValue] = useState('');

  const [projectFormFor, setProjectFormFor] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState({ ...EMPTY_PROJECT });

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectLine | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fmt = (n: number) => {
    if (n >= 1000000) return `R ${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `R ${(n / 1000).toFixed(0)}k`;
    return `R ${n}`;
  };
  const fmtFull = (n: number) => `R ${(n || 0).toLocaleString('en-ZA')}`;

  // ─── Roll-ups ───
  const enriched = useMemo(() => {
    return departments.map((d) => {
      const totalProjectAllocated = d.projects.reduce((s, p) => s + p.allocated, 0);
      const totalProjectSpent = d.projects.reduce((s, p) => s + p.spent, 0);
      const remaining = d.allocated - totalProjectSpent;
      const utilization = d.allocated > 0 ? (totalProjectSpent / d.allocated) * 100 : 0;
      return { ...d, totalProjectAllocated, totalProjectSpent, remaining, utilization };
    });
  }, [departments]);

  const totals = useMemo(() => {
    const allocated = enriched.reduce((s, d) => s + d.allocated, 0);
    const spent = enriched.reduce((s, d) => s + d.totalProjectSpent, 0);
    const ngo = enriched.filter((d) => d.entityType === 'ngo').reduce((s, d) => s + d.allocated, 0);
    return {
      allocated, spent,
      remaining: allocated - spent,
      utilization: allocated > 0 ? (spent / allocated) * 100 : 0,
      ngo,
    };
  }, [enriched]);

  // ─── Department: add / edit ───
  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDept: DepartmentBudget = {
      id: editingDeptId ?? Date.now(),
      name: deptForm.name,
      entityType: deptForm.entityType,
      sector: deptForm.sector,
      source: deptForm.source,
      fiscalYear: deptForm.fiscalYear,
      allocated: Number(deptForm.allocated) || 0,
      note: deptForm.note,
      projects: editingDeptId
        ? departments.find((d) => d.id === editingDeptId)?.projects ?? []
        : [],
    };
    if (editingDeptId) {
      setDepartments((prev) => prev.map((d) => (d.id === editingDeptId ? newDept : d)));
      setToast(`Updated ${newDept.name}`);
    } else {
      setDepartments((prev) => [newDept, ...prev]);
      setToast(`Assigned ${fmtFull(newDept.allocated)} to ${newDept.name}`);
    }
    setDeptForm({ ...EMPTY_DEPT });
    setEditingDeptId(null);
  };

  const startEditDept = (d: DepartmentBudget) => {
    setEditingDeptId(d.id);
    setDeptForm({
      name: d.name,
      entityType: d.entityType,
      sector: d.sector,
      source: d.source,
      fiscalYear: d.fiscalYear,
      allocated: d.allocated.toString(),
      note: d.note,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteDept = (id: number) => {
    const d = departments.find((x) => x.id === id);
    setDepartments((prev) => prev.filter((x) => x.id !== id));
    setToast(`Removed ${d?.name ?? id}`);
  };

  // ─── Inline edit allocated ───
  const startInlineAllocatedEdit = (d: DepartmentBudget) => {
    setInlineEditId(d.id);
    setInlineValue(d.allocated.toString());
  };
  const cancelInlineAllocatedEdit = () => {
    setInlineEditId(null);
    setInlineValue('');
  };
  const saveInlineAllocatedEdit = (id: number) => {
    const value = Number(inlineValue) || 0;
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, allocated: value } : d)));
    setToast(`Budget updated to ${fmtFull(value)}`);
    setInlineEditId(null);
    setInlineValue('');
  };

  // ─── Projects: add / edit / delete ───
  const openProjectForm = (deptId: number) => {
    setProjectFormFor(deptId);
    setProjectForm({ ...EMPTY_PROJECT });
  };
  const cancelProjectForm = () => {
    setProjectFormFor(null);
    setProjectForm({ ...EMPTY_PROJECT });
  };
  const submitProject = (e: React.FormEvent, deptId: number) => {
    e.preventDefault();
    const project: ProjectLine = {
      id: Date.now(),
      name: projectForm.name,
      allocated: Number(projectForm.allocated) || 0,
      spent: Number(projectForm.spent) || 0,
      status: projectForm.status,
      region: projectForm.region || 'Not specified',
    };
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, projects: [project, ...d.projects] } : d))
    );
    setToast(`Added "${project.name}"`);
    setProjectFormFor(null);
    setProjectForm({ ...EMPTY_PROJECT });
  };

  const deleteProject = (deptId: number, projectId: number) => {
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === deptId ? { ...d, projects: d.projects.filter((p) => p.id !== projectId) } : d
      )
    );
    setToast('Project removed');
  };

  const startEditProject = (p: ProjectLine) => {
    setEditingProjectId(p.id);
    setProjectDraft({ ...p });
  };
  const cancelEditProject = () => {
    setEditingProjectId(null);
    setProjectDraft(null);
  };
  const saveEditProject = (deptId: number) => {
    if (!projectDraft) return;
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === deptId
          ? { ...d, projects: d.projects.map((p) => (p.id === projectDraft.id ? projectDraft : p)) }
          : d
      )
    );
    setToast(`Updated "${projectDraft.name}"`);
    setEditingProjectId(null);
    setProjectDraft(null);
  };

  return (
    <>
      <style>{`
        .ba-root {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          color: ${C.ink};
          padding: 4px 0 32px;
        }

        .ba-head {
          display: flex; justify-content: space-between; align-items: center;
          gap: 20px; flex-wrap: wrap; margin-bottom: 22px;
        }
        .ba-head-left { display: flex; align-items: center; gap: 14px; }
        .ba-head-mark {
          width: 46px; height: 46px; border-radius: 14px;
          background: linear-gradient(135deg, #c4d4e8, #b8a4d4);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 18px -6px rgba(184,164,212,0.5), inset 0 1px 0 rgba(255,255,255,0.6);
          color: #fff; flex-shrink: 0;
        }
        .ba-head-text h1 {
          font-family: 'Sora', sans-serif; font-size: 1.15rem;
          font-weight: 600; color: ${C.ink}; margin: 0;
        }
        .ba-head-text p {
          font-size: 0.75rem; color: ${C.inkMuted}; margin: 3px 0 0;
        }

        .ba-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 11px;
          border: 1px solid transparent;
          font-size: 0.82rem; font-weight: 600;
          font-family: inherit; cursor: pointer;
          transition: all 0.22s ease;
          white-space: nowrap;
        }
        .ba-btn.ghost {
          background: rgba(255,255,255,0.9);
          border-color: #d8dce8;
          color: ${C.inkSoft};
        }
        .ba-btn.ghost:hover { background: #fff; color: ${C.ink}; }
        .ba-btn.save {
          background: ${C.mint.accent};
          color: #fff;
          box-shadow: 0 8px 20px -10px rgba(143,184,156,0.5);
        }
        .ba-btn.save:hover { background: ${C.mint.text}; }
        .ba-btn.small { padding: 8px 14px; font-size: 0.76rem; }

        .ba-metrics {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 22px;
        }
        @media (max-width: 1100px) { .ba-metrics { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .ba-metrics { grid-template-columns: 1fr; } }

        .ba-metric {
          padding: 18px; border-radius: 18px;
          background: ${C.glass}; backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 10px 24px -20px rgba(80,90,130,0.3), inset 0 1px 0 rgba(255,255,255,0.75);
          display: flex; flex-direction: column; gap: 12px;
        }
        .ba-metric-top { display: flex; align-items: center; justify-content: space-between; }
        .ba-metric-label {
          font-size: 0.65rem; letter-spacing: 0.14em;
          text-transform: uppercase; font-weight: 600;
          color: ${C.inkMuted};
        }
        .ba-metric-icon {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .ba-metric-value {
          font-family: 'Sora', sans-serif; font-size: 1.5rem;
          font-weight: 600; color: ${C.ink};
          font-variant-numeric: tabular-nums;
        }
        .ba-metric-value.highlight { color: ${C.mint.text}; }
        .ba-metric-foot {
          font-size: 0.7rem; color: ${C.inkSoft};
          display: flex; align-items: center; gap: 6px; margin-top: 2px;
        }

        .ba-section-label {
          display: flex; align-items: center; gap: 10px;
          margin: 22px 0 14px;
          font-size: 0.68rem; letter-spacing: 0.16em;
          text-transform: uppercase; font-weight: 600;
          color: ${C.inkMuted};
        }
        .ba-section-label::after {
          content: ''; flex: 1; height: 1px;
          background: ${C.hairDark};
        }

        .ba-form {
          background: ${C.glass}; backdrop-filter: blur(24px);
          border: 1px solid ${C.glassBorder};
          border-radius: 22px; padding: 24px 26px;
          box-shadow: 0 18px 44px -30px rgba(80,90,130,0.4);
          margin-bottom: 22px;
        }
        .ba-form-head {
          display: flex; justify-content: space-between; align-items: center;
          gap: 14px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .ba-form-title {
          font-family: 'Sora', sans-serif;
          font-size: 1rem; font-weight: 600;
          color: ${C.ink};
          display: inline-flex; align-items: center; gap: 9px;
        }
        .ba-form-title-icon {
          width: 30px; height: 30px; border-radius: 9px;
          background: ${C.mint.bg}; color: ${C.mint.text};
          display: flex; align-items: center; justify-content: center;
        }

        .ba-form-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 16px; margin-bottom: 20px;
        }
        @media (max-width: 1100px) { .ba-form-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .ba-form-grid { grid-template-columns: 1fr; } }

        .ba-field { display: flex; flex-direction: column; gap: 7px; }
        .ba-field.span-2 { grid-column: span 2; }
        @media (max-width: 1100px) { .ba-field.span-2 { grid-column: span 1; } }

        .ba-field label {
          font-size: 0.68rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: ${C.inkSoft};
        }
        .ba-field input,
        .ba-field select,
        .ba-field textarea {
          padding: 12px 14px;
          border: 1.5px solid #c9cedd;
          border-radius: 11px;
          font-size: 0.9rem; background: #ffffff;
          color: ${C.ink}; outline: none; font-family: inherit;
          transition: all 0.2s ease; font-weight: 500;
          width: 100%; box-sizing: border-box;
        }
        .ba-field textarea { resize: vertical; min-height: 60px; }
        .ba-field input::placeholder { color: #b8bccb; font-weight: 400; }
        .ba-field input:focus,
        .ba-field select:focus,
        .ba-field textarea:focus {
          border-color: ${C.lavender.accent};
          box-shadow: 0 0 0 4px ${C.lavender.bg};
          background: #fff;
        }

        .ba-form-foot {
          display: flex; justify-content: flex-end; gap: 10px;
          padding-top: 18px; border-top: 1px solid ${C.hairDark};
        }

        .ba-dept-grid { display: flex; flex-direction: column; gap: 18px; }

        .ba-dept {
          padding: 22px 24px; border-radius: 22px;
          background: ${C.glass}; backdrop-filter: blur(24px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 18px 44px -30px rgba(80,90,130,0.4);
        }

        .ba-dept-head {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 16px; flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .ba-dept-head-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .ba-dept-mark {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ba-dept-mark.dept { background: ${C.sky.bg}; color: ${C.sky.text}; }
        .ba-dept-mark.ngo  { background: ${C.mint.bg}; color: ${C.mint.text}; }

        .ba-dept-name {
          font-family: 'Sora', sans-serif;
          font-size: 1.05rem; font-weight: 600;
          color: ${C.ink}; margin: 0;
        }
        .ba-dept-meta {
          font-size: 0.75rem; color: ${C.inkMuted};
          display: flex; gap: 10px; flex-wrap: wrap; margin-top: 5px;
        }
        .ba-dept-meta span {
          display: inline-flex; align-items: center; gap: 5px;
        }
        .ba-dept-actions { display: flex; gap: 8px; }

        .ba-dept-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          padding: 16px;
          background: rgba(255,255,255,0.55);
          border-radius: 14px;
          border: 1px solid ${C.glassBorder};
          margin-bottom: 18px;
        }
        @media (max-width: 900px) { .ba-dept-stats { grid-template-columns: repeat(2, 1fr); } }

        .ba-dept-stat-label {
          font-size: 0.6rem; letter-spacing: 0.12em;
          text-transform: uppercase; font-weight: 600;
          color: ${C.inkMuted};
          display: block; margin-bottom: 5px;
        }
        .ba-dept-stat-value {
          font-family: 'Sora', sans-serif;
          font-size: 1.05rem; font-weight: 600;
          color: ${C.ink};
          font-variant-numeric: tabular-nums;
        }
        .ba-dept-stat-value.spent { color: ${C.sky.text}; }
        .ba-dept-stat-value.remaining { color: ${C.mint.text}; }

        .ba-dept-stat-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 5px;
        }
        .ba-dept-stat-edit {
          background: rgba(255,255,255,0.7);
          border: 1px solid ${C.glassBorder};
          border-radius: 6px;
          padding: 2px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: ${C.inkMuted};
        }
        .ba-dept-stat-edit:hover { color: ${C.lavender.text}; }

        .ba-inline-edit {
          display: flex; flex-direction: column; gap: 6px;
        }
        .ba-inline-edit input {
          padding: 8px 10px;
          border: 1.5px solid ${C.lavender.accent};
          border-radius: 9px;
          font-size: 0.9rem;
          background: #fff;
          color: ${C.ink};
          outline: none;
          font-family: inherit;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          width: 100%;
          box-sizing: border-box;
        }
        .ba-inline-edit-actions {
          display: flex; gap: 6px;
        }

        .ba-dept-bar-wrap {
          grid-column: 1 / -1;
          padding-top: 10px;
        }
        .ba-dept-bar-head {
          display: flex; justify-content: space-between;
          font-size: 0.72rem; color: ${C.inkSoft};
          margin-bottom: 6px;
        }
        .ba-dept-bar-head .pct {
          font-weight: 700; color: ${C.ink};
          font-variant-numeric: tabular-nums;
        }
        .ba-dept-bar {
          height: 6px; border-radius: 999px;
          background: rgba(160,165,190,0.18);
          overflow: hidden;
        }
        .ba-dept-bar-fill {
          height: 100%; border-radius: 999px;
          transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ba-projects-head {
          display: flex; justify-content: space-between;
          align-items: center; gap: 12px; flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .ba-projects-title {
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: ${C.inkSoft};
          display: inline-flex; align-items: center; gap: 8px;
        }
        .ba-projects-count {
          font-size: 0.68rem; color: ${C.inkMuted};
          padding: 3px 10px; border-radius: 999px;
          background: rgba(255,255,255,0.6);
          border: 1px solid ${C.glassBorder};
          font-weight: 600;
        }

        .ba-project-row {
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1fr auto;
          gap: 12px; align-items: center;
          padding: 12px 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.55);
          border: 1px solid ${C.glassBorder};
          margin-bottom: 8px;
          font-size: 0.82rem;
        }
        @media (max-width: 900px) {
          .ba-project-row { grid-template-columns: 1fr 1fr; }
        }

        .ba-project-name {
          font-size: 0.84rem; font-weight: 600;
          color: ${C.ink}; margin-bottom: 3px;
        }
        .ba-project-meta {
          font-size: 0.66rem; color: ${C.inkMuted};
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ba-project-money-label {
          font-size: 0.58rem; color: ${C.inkMuted};
          font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 2px;
        }
        .ba-project-money {
          font-variant-numeric: tabular-nums;
          font-weight: 600; font-size: 0.82rem;
          color: ${C.ink};
        }
        .ba-project-money.spent { color: ${C.sky.text}; }

        .ba-project-status {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 999px;
          font-size: 0.62rem; font-weight: 600;
        }
        .st-on-track { background: ${C.mint.bg}; color: ${C.mint.text}; }
        .st-delayed { background: ${C.rose.bg}; color: ${C.rose.text}; }
        .st-review { background: ${C.peach.bg}; color: ${C.peach.text}; }
        .st-completed { background: ${C.lavender.bg}; color: ${C.lavender.text}; }

        .ba-icon-btn {
          width: 30px; height: 30px; border-radius: 8px;
          border: 1px solid ${C.glassBorder};
          background: rgba(255,255,255,0.9);
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; color: ${C.inkSoft};
          transition: all 0.2s ease;
        }
        .ba-icon-btn:hover { background: #fff; color: ${C.ink}; }
        .ba-icon-btn.edit:hover { color: ${C.sky.text}; border-color: ${C.sky.accent}; }
        .ba-icon-btn.danger:hover { color: ${C.rose.text}; border-color: ${C.rose.accent}; }

        .ba-empty {
          text-align: center; padding: 40px 20px;
          color: ${C.inkSoft};
        }
        .ba-empty h3 {
          font-family: 'Sora', sans-serif;
          font-size: 0.95rem; font-weight: 600;
          color: ${C.ink}; margin: 12px 0 4px;
        }

        .ba-project-form {
          padding: 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.75);
          border: 1px dashed ${C.lavender.accent};
          margin-top: 12px;
        }
        .ba-project-form-title {
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: ${C.lavender.text};
          margin-bottom: 12px;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ba-project-form-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 900px) {
          .ba-project-form-grid { grid-template-columns: 1fr 1fr; }
        }
        .ba-project-form-foot {
          display: flex; justify-content: flex-end; gap: 10px;
          margin-top: 14px;
        }

        .ba-toast {
          position: fixed; top: 24px; left: 50%;
          transform: translateX(-50%);
          display: flex; align-items: center; gap: 12px;
          padding: 13px 20px; border-radius: 999px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 20px 44px -20px rgba(70,80,120,0.4);
          font-size: 0.83rem; color: ${C.ink};
          font-weight: 500; z-index: 1000;
        }
      `}</style>

      <div className="ba-root">
        {/* Header */}
        <div className="ba-head">
          <div className="ba-head-left">
            <div className="ba-head-mark">
              <Coins size={22} strokeWidth={1.9} />
            </div>
            <div className="ba-head-text">
              <h1>Budget Allocation</h1>
              <p>Assign budgets to departments, add their projects, and track spending per department.</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="ba-metrics">
          <div className="ba-metric">
            <div className="ba-metric-top">
              <span className="ba-metric-label">Total Allocated</span>
              <div className="ba-metric-icon" style={{ background: C.sky.bg, color: C.sky.text }}>
                <Layers size={16} strokeWidth={2.2} />
              </div>
            </div>
            <div className="ba-metric-value">{fmt(totals.allocated)}</div>
            <div className="ba-metric-foot">
              <Wallet size={12} /> {departments.length} departments
            </div>
          </div>
          <div className="ba-metric">
            <div className="ba-metric-top">
              <span className="ba-metric-label">Total Spent</span>
              <div className="ba-metric-icon" style={{ background: C.peach.bg, color: C.peach.text }}>
                <TrendingUp size={16} strokeWidth={2.2} />
              </div>
            </div>
            <div className="ba-metric-value">{fmt(totals.spent)}</div>
            <div className="ba-metric-foot" style={{ color: C.peach.text }}>
              <Percent size={12} /> {totals.utilization.toFixed(1)}% utilization
            </div>
          </div>
          <div className="ba-metric">
            <div className="ba-metric-top">
              <span className="ba-metric-label">Available</span>
              <div className="ba-metric-icon" style={{ background: C.mint.bg, color: C.mint.text }}>
                <PiggyBank size={16} strokeWidth={2.2} />
              </div>
            </div>
            <div className="ba-metric-value highlight">{fmt(totals.remaining)}</div>
            <div className="ba-metric-foot" style={{ color: C.mint.text }}>
              <CheckCircle2 size={12} /> Ready for deployment
            </div>
          </div>
          <div className="ba-metric">
            <div className="ba-metric-top">
              <span className="ba-metric-label">NGO Share</span>
              <div className="ba-metric-icon" style={{ background: C.lavender.bg, color: C.lavender.text }}>
                <HeartHandshake size={16} strokeWidth={2.2} />
              </div>
            </div>
            <div className="ba-metric-value">{fmt(totals.ngo)}</div>
            <div className="ba-metric-foot" style={{ color: C.lavender.text }}>
              <HandCoins size={12} /> {totals.allocated > 0 ? ((totals.ngo / totals.allocated) * 100).toFixed(1) : '0'}% of portfolio
            </div>
          </div>
        </div>

        {/* Assign form */}
        <div className="ba-form">
          <div className="ba-form-head">
            <div className="ba-form-title">
              <div className="ba-form-title-icon">
                <Plus size={14} strokeWidth={2.4} />
              </div>
              {editingDeptId ? 'Edit department budget' : 'Assign a budget to a department'}
            </div>
          </div>

          <form onSubmit={handleDeptSubmit}>
            <div className="ba-form-grid">
              <div className="ba-field span-2">
                <label>{deptForm.entityType === 'ngo' ? 'NGO Name' : 'Department Name'}</label>
                <input
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder={deptForm.entityType === 'ngo' ? 'e.g., Workers of Society Organisation' : 'e.g., Department of Education'}
                  required
                />
              </div>

              <div className="ba-field">
                <label>Entity Type</label>
                <select value={deptForm.entityType} onChange={(e) => setDeptForm({ ...deptForm, entityType: e.target.value as EntityType })}>
                  <option value="department">Government Department</option>
                  <option value="ngo">NGO Partner</option>
                </select>
              </div>

              <div className="ba-field">
                <label>Sector</label>
                <select value={deptForm.sector} onChange={(e) => setDeptForm({ ...deptForm, sector: e.target.value as SectorKey })}>
                  {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>

              <div className="ba-field">
                <label>Funding Source</label>
                <select value={deptForm.source} onChange={(e) => setDeptForm({ ...deptForm, source: e.target.value as SourceKey })}>
                  {SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>

              <div className="ba-field">
                <label>Fiscal Year</label>
                <select value={deptForm.fiscalYear} onChange={(e) => setDeptForm({ ...deptForm, fiscalYear: e.target.value })}>
                  <option>2025/2026</option>
                  <option>2026/2027</option>
                  <option>2027/2028</option>
                </select>
              </div>

              <div className="ba-field span-2">
                <label>Total Budget Allocated (ZAR)</label>
                <input
                  required type="number"
                  value={deptForm.allocated}
                  onChange={(e) => setDeptForm({ ...deptForm, allocated: e.target.value })}
                  placeholder="300000000"
                />
              </div>

              <div className="ba-field" style={{ gridColumn: '1 / -1' }}>
                <label>Note (optional)</label>
                <textarea
                  value={deptForm.note}
                  onChange={(e) => setDeptForm({ ...deptForm, note: e.target.value })}
                  placeholder="What is this department responsible for?"
                />
              </div>
            </div>

            <div className="ba-form-foot">
              {editingDeptId && (
                <button
                  type="button"
                  className="ba-btn ghost"
                  onClick={() => { setDeptForm({ ...EMPTY_DEPT }); setEditingDeptId(null); }}
                >
                  Cancel Edit
                </button>
              )}
              <button type="submit" className="ba-btn save">
                <Save size={14} strokeWidth={2.4} />
                {editingDeptId ? 'Update Department' : 'Assign Budget'}
              </button>
            </div>
          </form>
        </div>

        {/* Section label */}
        <div className="ba-section-label">
          <BarChart3 size={12} strokeWidth={2.4} />
          Departments · spending roll-up
        </div>

        {/* Departments */}
        {enriched.length === 0 ? (
          <div className="ba-empty">
            <Wallet size={26} color={C.inkMuted} strokeWidth={1.6} />
            <h3>No departments yet</h3>
            <p>Use the form above to assign a budget to your first department.</p>
          </div>
        ) : (
          <div className="ba-dept-grid">
            {enriched.map((d) => {
              const sectorCfg = SECTORS.find((s) => s.key === d.sector)!;
              const sourceCfg = SOURCES.find((s) => s.key === d.source)!;
              const SectorIcon = sectorCfg.icon;
              const SourceIcon = sourceCfg.icon;
              const isNgo = d.entityType === 'ngo';
              const isEditingAllocated = inlineEditId === d.id;

              return (
                <motion.div
                  key={d.id}
                  className="ba-dept"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Head */}
                  <div className="ba-dept-head">
                    <div className="ba-dept-head-left">
                      <div className={`ba-dept-mark ${isNgo ? 'ngo' : 'dept'}`}>
                        {isNgo ? <HeartHandshake size={22} strokeWidth={2} /> : <Building2 size={22} strokeWidth={2} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ba-dept-name">{d.name}</h3>
                        <div className="ba-dept-meta">
                          <span style={{ color: sectorCfg.tone.text }}>
                            <SectorIcon size={12} strokeWidth={2.4} />
                            {sectorCfg.label}
                          </span>
                          <span><SourceIcon size={12} strokeWidth={2.4} /> {sourceCfg.label}</span>
                          <span><Calendar size={12} strokeWidth={2.4} /> {d.fiscalYear}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ba-dept-actions">
                      <button className="ba-icon-btn edit" onClick={() => startEditDept(d)} title="Edit department (all fields)">
                        <Edit3 size={13} strokeWidth={2.2} />
                      </button>
                      <button className="ba-icon-btn danger" onClick={() => deleteDept(d.id)} title="Delete department">
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="ba-dept-stats">
                    <div>
                      {isEditingAllocated ? (
                        <div className="ba-inline-edit">
                          <span className="ba-dept-stat-label">Allocated</span>
                          <input
                            type="number"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineAllocatedEdit(d.id);
                              if (e.key === 'Escape') cancelInlineAllocatedEdit();
                            }}
                          />
                          <div className="ba-inline-edit-actions">
                            <button type="button" className="ba-icon-btn danger" onClick={cancelInlineAllocatedEdit} title="Cancel">
                              <X size={12} strokeWidth={2.4} />
                            </button>
                            <button
                              type="button"
                              className="ba-icon-btn"
                              onClick={() => saveInlineAllocatedEdit(d.id)}
                              title="Save"
                              style={{ color: C.mint.text, borderColor: C.mint.accent }}
                            >
                              <Save size={12} strokeWidth={2.4} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="ba-dept-stat-head">
                            <span className="ba-dept-stat-label" style={{ marginBottom: 0 }}>Allocated</span>
                            <button
                              type="button"
                              className="ba-dept-stat-edit"
                              onClick={() => startInlineAllocatedEdit(d)}
                              title="Edit allocated budget"
                            >
                              <Edit3 size={10} strokeWidth={2.4} />
                            </button>
                          </div>
                          <div className="ba-dept-stat-value">{fmt(d.allocated)}</div>
                        </>
                      )}
                    </div>

                    <div>
                      <span className="ba-dept-stat-label">Spent</span>
                      <div className="ba-dept-stat-value spent">{fmt(d.totalProjectSpent)}</div>
                    </div>
                    <div>
                      <span className="ba-dept-stat-label">Remaining</span>
                      <div className="ba-dept-stat-value remaining">{fmt(d.remaining)}</div>
                    </div>
                    <div>
                      <span className="ba-dept-stat-label">Projects</span>
                      <div className="ba-dept-stat-value">{d.projects.length}</div>
                    </div>

                    <div className="ba-dept-bar-wrap">
                      <div className="ba-dept-bar-head">
                        <span>Utilization of allocated budget</span>
                        <span className="pct">{d.utilization.toFixed(0)}%</span>
                      </div>
                      <div className="ba-dept-bar">
                        <div
                          className="ba-dept-bar-fill"
                          style={{
                            width: `${Math.min(d.utilization, 100)}%`,
                            background: isNgo
                              ? `linear-gradient(90deg, ${C.mint.accent}, ${C.mint.text})`
                              : `linear-gradient(90deg, ${C.sky.accent}, ${C.sky.text})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Projects header */}
                  <div className="ba-projects-head">
                    <div className="ba-projects-title">
                      <Briefcase size={12} strokeWidth={2.4} />
                      Projects under this department
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className="ba-projects-count">
                        {d.projects.length} {d.projects.length === 1 ? 'project' : 'projects'}
                      </span>
                      {projectFormFor !== d.id && (
                        <button
                          className="ba-btn ghost small"
                          onClick={() => openProjectForm(d.id)}
                          type="button"
                        >
                          <Plus size={12} strokeWidth={2.6} /> Add project
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Projects */}
                  {d.projects.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: C.inkMuted, padding: '12px 4px' }}>
                      No projects attached yet. Click "Add project" to link one.
                    </div>
                  ) : (
                    d.projects.map((p) => {
                      const isEditingProject = editingProjectId === p.id && projectDraft;
                      const statusClass =
                        p.status === 'Delayed' ? 'st-delayed'
                        : p.status === 'Under Review' ? 'st-review'
                        : p.status === 'Completed' ? 'st-completed'
                        : 'st-on-track';

                      if (isEditingProject) {
                        return (
                          <div key={p.id} className="ba-project-row" style={{ gridTemplateColumns: '1.6fr 1fr 1fr 1fr auto' }}>
                            <div className="ba-field">
                              <label>Name</label>
                              <input
                                value={projectDraft!.name}
                                onChange={(e) => setProjectDraft({ ...projectDraft!, name: e.target.value })}
                                autoFocus
                              />
                            </div>
                            <div className="ba-field">
                              <label>Allocated</label>
                              <input
                                type="number"
                                value={projectDraft!.allocated}
                                onChange={(e) => setProjectDraft({ ...projectDraft!, allocated: Number(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="ba-field">
                              <label>Spent</label>
                              <input
                                type="number"
                                value={projectDraft!.spent}
                                onChange={(e) => setProjectDraft({ ...projectDraft!, spent: Number(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="ba-field">
                              <label>Status</label>
                              <select
                                value={projectDraft!.status}
                                onChange={(e) => setProjectDraft({ ...projectDraft!, status: e.target.value })}
                              >
                                <option>On Track</option>
                                <option>Delayed</option>
                                <option>Under Review</option>
                                <option>Completed</option>
                              </select>
                            </div>
                            <div className="ba-dept-actions">
                              <button className="ba-icon-btn danger" onClick={cancelEditProject} title="Cancel">
                                <X size={12} strokeWidth={2.4} />
                              </button>
                              <button
                                className="ba-icon-btn"
                                onClick={() => saveEditProject(d.id)}
                                title="Save"
                                style={{ color: C.mint.text, borderColor: C.mint.accent }}
                              >
                                <Save size={12} strokeWidth={2.4} />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={p.id} className="ba-project-row">
                          <div>
                            <div className="ba-project-name">{p.name}</div>
                            <div className="ba-project-meta">
                              <MapPin size={11} strokeWidth={2.2} /> {p.region}
                            </div>
                          </div>
                          <div>
                            <div className="ba-project-money-label">Allocated</div>
                            <div className="ba-project-money">{fmtFull(p.allocated)}</div>
                          </div>
                          <div>
                            <div className="ba-project-money-label">Spent</div>
                            <div className="ba-project-money spent">{fmtFull(p.spent)}</div>
                          </div>
                          <div>
                            <span className={`ba-project-status ${statusClass}`}>
                              <CheckCircle2 size={10} strokeWidth={2.6} />
                              {p.status}
                            </span>
                          </div>
                          <div className="ba-dept-actions">
                            <button className="ba-icon-btn edit" onClick={() => startEditProject(p)} title="Edit project">
                              <Edit3 size={12} strokeWidth={2.2} />
                            </button>
                            <button className="ba-icon-btn danger" onClick={() => deleteProject(d.id, p.id)} title="Remove project">
                              <Trash2 size={12} strokeWidth={2.2} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Inline add-project form */}
                  <AnimatePresence>
                    {projectFormFor === d.id && (
                      <motion.div
                        className="ba-project-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="ba-project-form-title">
                          <Plus size={12} strokeWidth={2.6} /> New project
                        </div>
                        <form onSubmit={(e) => submitProject(e, d.id)}>
                          <div className="ba-project-form-grid">
                            <div className="ba-field">
                              <label>Project name</label>
                              <input
                                required
                                value={projectForm.name}
                                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                                placeholder="e.g., Rutanang Clinic Upgrade"
                              />
                            </div>
                            <div className="ba-field">
                              <label>Allocated (ZAR)</label>
                              <input
                                required type="number"
                                value={projectForm.allocated}
                                onChange={(e) => setProjectForm({ ...projectForm, allocated: e.target.value })}
                                placeholder="9000000"
                              />
                            </div>
                            <div className="ba-field">
                              <label>Spent (ZAR)</label>
                              <input
                                type="number"
                                value={projectForm.spent}
                                onChange={(e) => setProjectForm({ ...projectForm, spent: e.target.value })}
                                placeholder="5400000"
                              />
                            </div>
                            <div className="ba-field">
                              <label>Region</label>
                              <input
                                value={projectForm.region}
                                onChange={(e) => setProjectForm({ ...projectForm, region: e.target.value })}
                                placeholder="Ward 3 - Beaconsfield"
                              />
                            </div>
                            <div className="ba-field">
                              <label>Status</label>
                              <select
                                value={projectForm.status}
                                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                              >
                                <option>On Track</option>
                                <option>Delayed</option>
                                <option>Under Review</option>
                                <option>Completed</option>
                              </select>
                            </div>
                          </div>
                          <div className="ba-project-form-foot">
                            <button type="button" className="ba-btn ghost small" onClick={cancelProjectForm}>
                              Cancel
                            </button>
                            <button type="submit" className="ba-btn save small">
                              <Save size={12} strokeWidth={2.6} /> Add project
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="ba-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.28 }}
          >
            <span
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: C.mint.bg, color: C.mint.text,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={14} strokeWidth={2.4} />
            </span>
            {toast}
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', color: C.inkMuted, cursor: 'pointer', display: 'flex', padding: 0 }}
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}