// src/Components/ReportsModule.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Search, Sparkles, CheckCircle2, X,
  Clock, Building2, Coins, Calendar, Loader2,
  MapPin, AlertTriangle, Layers, FileDown, RefreshCw, TrendingUp
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

const API_URL = 'http://localhost:8080';
const ORG_NAME = 'Department of Public Works';
const REPORT_STORAGE_KEY = 'gcpts_reports_history';

// ─── Types ───
interface Milestone { name: string; date: string; status: string; }
interface FundingSource { name: string; amount: number; }

interface Project {
  id: number;
  referenceNumber?: string;
  title: string;
  category?: string;
  department?: string;
  description?: string;
  goals?: string;
  objectives?: string;
  location?: string;
  gpsCoordinates?: string;
  projectManager?: string;
  contractor?: string;
  startDate?: string;
  expectedCompletion?: string;
  overallProgress?: number;
  status?: string;
  budgetAllocated?: number;
  budgetUsed?: number;
  milestones?: Milestone[];
  fundingSources?: FundingSource[];
  blueprintFileNames?: string[];
  additionalDocumentNames?: string[];
}

interface Transaction {
  id: number;
  projectId: number;
  date: string;
  description: string;
  category: string;
  reference: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending' | 'cancelled';
}

interface Issue {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  projectId: number;
  username?: string;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  projectLabel: string;
  generatedAt: string;
  sections: number;
}

type ReportType = 'comprehensive' | 'portfolio' | 'budget_only' | 'progress_only' | 'documents_only';

const REPORT_TYPES: { key: ReportType; label: string; description: string }[] = [
  { key: 'comprehensive',  label: 'Comprehensive Project Report', description: 'Everything about one project — identity, budget, milestones, transactions, documents, issues.' },
  { key: 'portfolio',      label: 'Full Portfolio Report',        description: 'All projects combined with summary analytics and cross-project breakdown.' },
  { key: 'budget_only',    label: 'Budget & Expenditure Report',  description: 'Financial deep-dive — allocations, spending, sources and transaction ledger.' },
  { key: 'progress_only',  label: 'Progress & Milestones Report', description: 'Timeline, milestones, and status tracking per project.' },
  { key: 'documents_only', label: 'Documents & Blueprints',       description: 'Register of all project documents and blueprints.' },
];

const C = {
  ink: '#2b2d3a',
  inkSoft: '#6a6d80',
  inkMuted: '#a4a7b8',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.9)',
  hairDark: 'rgba(160,165,190,0.14)',
  mint:    { bg: '#e8f4ee', text: '#4a7a5c', accent: '#8fb89c', ring: '#c6e8d2' },
  sky:     { bg: '#e5eef8', text: '#4f6888', accent: '#7f9dc4', ring: '#c9dbf5' },
  peach:   { bg: '#f8ecdf', text: '#8a5f3d', accent: '#e0b280', ring: '#eeddbf' },
  rose:    { bg: '#f8e9ec', text: '#8a5566', accent: '#d8a2b0', ring: '#f0d5db' },
  lavender:{ bg: '#eeeaf7', text: '#635a82', accent: '#b8a4d4', ring: '#ddd3ea' },
};

const fmtCurrency = (n: number) => `R ${(n || 0).toLocaleString('en-ZA')}`;
const fmtDateTime = (s?: string) => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── PDF Helpers ───
function addPdfHeader(pdf: jsPDF, title: string, subtitle: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginX = 14;
  const logoSize = 14;

  pdf.setFillColor(91, 141, 239);
  pdf.roundedRect(marginX, 10, logoSize, logoSize, 3, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(logoSize * 0.55);
  pdf.text('GP', marginX + logoSize / 2, 10 + logoSize / 2 + logoSize * 0.18, { align: 'center' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text(title, marginX + logoSize + 6, 17);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(subtitle, marginX + logoSize + 6, 22);

  const today = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Generated: ${today}`, pageWidth - marginX, 14, { align: 'right' });
  pdf.text(ORG_NAME, pageWidth - marginX, 19, { align: 'right' });

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.4);
  pdf.line(marginX, 27, pageWidth - marginX, 27);
}

function addPdfFooter(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 14;

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    'Computer-generated report · Government Community Project Transparency System · POPIA compliant',
    marginX, pageHeight - 7
  );
  const pageCount = (pdf as any).getNumberOfPages();
  const currentPage = (pdf as any).getCurrentPageInfo().pageNumber;
  pdf.text(`Page ${currentPage} / ${pageCount}`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
}

const TABLE_STYLE = {
  styles: {
    font: 'helvetica' as const,
    fontSize: 8.5,
    cellPadding: 3,
    textColor: [15, 23, 42] as [number, number, number],
    lineColor: [238, 241, 246] as [number, number, number],
    lineWidth: 0.2,
    overflow: 'linebreak' as const,
  },
  headStyles: {
    fillColor: [91, 141, 239] as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: 'bold' as const,
    fontSize: 8.5,
  },
  alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
  theme: 'grid' as const,
};

function addSectionHeading(pdf: jsPDF, y: number, text: string): number {
  pdf.setFillColor(238, 241, 246);
  pdf.roundedRect(14, y, pdf.internal.pageSize.getWidth() - 28, 8, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(43, 45, 58);
  pdf.text(text, 18, y + 5.5);
  return y + 11;
}

function ensureSpace(pdf: jsPDF, y: number, needed: number, title: string, subtitle: string): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 20) {
    pdf.addPage();
    addPdfHeader(pdf, title, subtitle);
    return 32;
  }
  return y;
}

function loadHistory(): GeneratedReport[] {
  try {
    const raw = localStorage.getItem(REPORT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveHistory(reports: GeneratedReport[]) {
  try {
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports.slice(0, 30)));
  } catch {}
}

// ═══════════════════════════════════════════════════════
// REPORT BUILDERS
// ═══════════════════════════════════════════════════════

function buildComprehensiveReport(
  pdf: jsPDF,
  project: Project,
  transactions: Transaction[],
  issues: Issue[]
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginX = 14;
  const title = 'Comprehensive Project Report';
  const subtitle = project.title || 'Project';
  let y = 32;
  let sections = 0;

  // 1. Identity
  y = ensureSpace(pdf, y, 60, title, subtitle);
  y = addSectionHeading(pdf, y, '1. Project Identity'); sections++;
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX },
    head: [['Field', 'Value']],
    body: [
      ['Project Title', project.title || '—'],
      ['Reference Number', project.referenceNumber || '—'],
      ['Category', project.category || '—'],
      ['Department', project.department || '—'],
      ['Status', project.status || '—'],
      ['Overall Progress', `${project.overallProgress ?? 0}%`],
    ],
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
  });
  y = (pdf as any).lastAutoTable.finalY + 6;

  // 2. Timeline
  y = ensureSpace(pdf, y, 60, title, subtitle);
  y = addSectionHeading(pdf, y, '2. Timeline & Responsibility'); sections++;
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX },
    head: [['Field', 'Value']],
    body: [
      ['Start Date', project.startDate || '—'],
      ['Expected Completion', project.expectedCompletion || '—'],
      ['Project Manager', project.projectManager || '—'],
      ['Contractor', project.contractor || '—'],
      ['Location', project.location || '—'],
      ['GPS Coordinates', project.gpsCoordinates || '—'],
    ],
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
  });
  y = (pdf as any).lastAutoTable.finalY + 6;

  // 3. Description
  y = ensureSpace(pdf, y, 60, title, subtitle);
  y = addSectionHeading(pdf, y, '3. Description, Goals & Objectives'); sections++;
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX },
    head: [['Field', 'Value']],
    body: [
      ['Description', project.description || '—'],
      ['Goals', project.goals || '—'],
      ['Objectives', project.objectives || '—'],
    ],
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: pageWidth - marginX * 2 - 60 },
    },
  });
  y = (pdf as any).lastAutoTable.finalY + 6;

  // 4. Budget
  y = ensureSpace(pdf, y, 50, title, subtitle);
  y = addSectionHeading(pdf, y, '4. Budget & Expenditure Overview'); sections++;
  const alloc = project.budgetAllocated || 0;
  const used = project.budgetUsed || 0;
  const remaining = Math.max(alloc - used, 0);
  const util = alloc > 0 ? ((used / alloc) * 100).toFixed(1) : '0.0';
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX },
    head: [['Allocated (R)', 'Spent (R)', 'Remaining (R)', 'Utilisation %']],
    body: [[alloc.toLocaleString(), used.toLocaleString(), remaining.toLocaleString(), `${util}%`]],
    columnStyles: {
      0: { halign: 'right' }, 1: { halign: 'right' },
      2: { halign: 'right' }, 3: { halign: 'center' },
    },
  });
  y = (pdf as any).lastAutoTable.finalY + 6;

  if (project.fundingSources && project.fundingSources.length > 0) {
    y = ensureSpace(pdf, y, 40, title, subtitle);
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX },
      head: [['Funding Source', 'Amount (R)']],
      body: project.fundingSources.map((fs) => [fs.name || '—', (fs.amount || 0).toLocaleString()]),
      columnStyles: { 1: { halign: 'right' } },
    });
    y = (pdf as any).lastAutoTable.finalY + 6;
  }

  // 5. Transactions
  y = ensureSpace(pdf, y, 50, title, subtitle);
  y = addSectionHeading(pdf, y, '5. Transaction Ledger'); sections++;
  const projectTx = transactions.filter((t) => t.projectId === project.id);
  if (projectTx.length === 0) {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX },
      head: [['Status']], body: [['No transactions recorded.']],
    });
    y = (pdf as any).lastAutoTable.finalY + 6;
  } else {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX, top: 32, bottom: 18 },
      head: [['Date', 'Description', 'Category', 'Reference', 'Type', 'Status', 'Amount (R)']],
      body: projectTx.map((t) => [
        t.date || '—', t.description || '—', t.category || '—', t.reference || '—',
        (t.type || '').toUpperCase(), (t.status || '').toUpperCase(),
        (t.type === 'income' ? '+' : '−') + (t.amount || 0).toLocaleString(),
      ]),
      columnStyles: {
        4: { halign: 'center' }, 5: { halign: 'center' },
        6: { halign: 'right', fontStyle: 'bold' },
      },
      didDrawPage: () => { addPdfHeader(pdf, title, subtitle); addPdfFooter(pdf); },
    });
    y = (pdf as any).lastAutoTable.finalY + 6;
  }

  // 6. Milestones
  y = ensureSpace(pdf, y, 50, title, subtitle);
  y = addSectionHeading(pdf, y, '6. Milestones & Progress'); sections++;
  const ms = project.milestones || [];
  if (ms.length === 0) {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX },
      head: [['Status']], body: [['No milestones recorded.']],
    });
    y = (pdf as any).lastAutoTable.finalY + 6;
  } else {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX },
      head: [['#', 'Milestone', 'Date', 'Status']],
      body: ms.map((m, i) => [String(i + 1), m.name || '—', m.date || '—', m.status || '—']),
      columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 3: { halign: 'center' } },
    });
    y = (pdf as any).lastAutoTable.finalY + 6;
  }

  // 7. Documents
  y = ensureSpace(pdf, y, 50, title, subtitle);
  y = addSectionHeading(pdf, y, '7. Documents & Blueprints'); sections++;
  const docs: (string | number)[][] = [];
  (project.blueprintFileNames || []).forEach((f) => docs.push(['Blueprint', f, `${API_URL}/uploads/${f}`]));
  (project.additionalDocumentNames || []).forEach((f) => docs.push(['Additional Document', f, `${API_URL}/uploads/${f}`]));
  if (docs.length === 0) {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX },
      head: [['Status']], body: [['No documents uploaded.']],
    });
    y = (pdf as any).lastAutoTable.finalY + 6;
  } else {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX, top: 32, bottom: 18 },
      head: [['Type', 'File Name', 'URL']],
      body: docs,
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 80 } },
      didDrawPage: () => { addPdfHeader(pdf, title, subtitle); addPdfFooter(pdf); },
    });
    y = (pdf as any).lastAutoTable.finalY + 6;
  }

  // 8. Issues
  y = ensureSpace(pdf, y, 50, title, subtitle);
  y = addSectionHeading(pdf, y, '8. Community Issues'); sections++;
  const projectIssues = issues.filter((i) => i.projectId === project.id);
  if (projectIssues.length === 0) {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX },
      head: [['Status']], body: [['No community issues reported.']],
    });
  } else {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX, top: 32, bottom: 18 },
      head: [['Title', 'Category', 'Location', 'Reported By']],
      body: projectIssues.map((i) => [
        i.title || '—', i.category || '—', i.location || '—', i.username || 'Anonymous',
      ]),
      didDrawPage: () => { addPdfHeader(pdf, title, subtitle); addPdfFooter(pdf); },
    });
  }

  return sections;
}

function buildPortfolioReport(pdf: jsPDF, projects: Project[]): number {
  const marginX = 14;
  const title = 'Full Portfolio Report';
  const subtitle = `${projects.length} projects`;
  let y = 32;
  let sections = 0;

  // 1. Summary
  y = addSectionHeading(pdf, y, '1. Portfolio Summary'); sections++;
  const totalAlloc = projects.reduce((s, p) => s + (p.budgetAllocated || 0), 0);
  const totalUsed = projects.reduce((s, p) => s + (p.budgetUsed || 0), 0);
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.overallProgress || 0), 0) / projects.length) : 0;
  const completed = projects.filter((p) => (p.status || '').toLowerCase().includes('complet')).length;
  const inProg = projects.filter((p) => (p.status || '').toLowerCase().includes('progress')).length;
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX },
    head: [['Total', 'Completed', 'In Progress', 'Allocated (R)', 'Spent (R)', 'Remaining (R)', 'Avg %']],
    body: [[
      String(projects.length), String(completed), String(inProg),
      totalAlloc.toLocaleString(), totalUsed.toLocaleString(),
      (totalAlloc - totalUsed).toLocaleString(), `${avgProgress}%`,
    ]],
    columnStyles: {
      0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center' },
      3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' },
      6: { halign: 'center' },
    },
  });
  y = (pdf as any).lastAutoTable.finalY + 8;

  // 2. Breakdown
  y = addSectionHeading(pdf, y, '2. Project Breakdown'); sections++;
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX, top: 32, bottom: 18 },
    head: [['#', 'Project', 'Department', 'Status', 'Progress', 'Allocated (R)', 'Spent (R)']],
    body: projects.map((p, i) => [
      String(i + 1), p.title || 'Untitled', p.department || '—', p.status || '—',
      `${p.overallProgress ?? 0}%`,
      (p.budgetAllocated || 0).toLocaleString(),
      (p.budgetUsed || 0).toLocaleString(),
    ]),
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'right' }, 6: { halign: 'right' },
    },
    didDrawPage: () => { addPdfHeader(pdf, title, subtitle); addPdfFooter(pdf); },
  });
  y = (pdf as any).lastAutoTable.finalY + 8;

  // 3. Status Distribution
  y = ensureSpace(pdf, y, 50, title, subtitle);
  y = addSectionHeading(pdf, y, '3. Status Distribution'); sections++;
  const statusMap: Record<string, number> = {};
  projects.forEach((p) => {
    const s = p.status || 'Unknown';
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX },
    head: [['Status', 'Count', 'Percentage']],
    body: Object.entries(statusMap).map(([s, c]) => [s, String(c), `${((c / projects.length) * 100).toFixed(1)}%`]),
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
  });
  y = (pdf as any).lastAutoTable.finalY + 8;

  // 4. Department Breakdown
  y = ensureSpace(pdf, y, 50, title, subtitle);
  y = addSectionHeading(pdf, y, '4. Department Breakdown'); sections++;
  const deptMap: Record<string, { count: number; alloc: number; used: number }> = {};
  projects.forEach((p) => {
    const d = p.department || 'Unassigned';
    if (!deptMap[d]) deptMap[d] = { count: 0, alloc: 0, used: 0 };
    deptMap[d].count++;
    deptMap[d].alloc += p.budgetAllocated || 0;
    deptMap[d].used += p.budgetUsed || 0;
  });
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX, top: 32, bottom: 18 },
    head: [['Department', 'Projects', 'Allocated (R)', 'Spent (R)', 'Remaining (R)']],
    body: Object.entries(deptMap).map(([d, v]) => [
      d, String(v.count), v.alloc.toLocaleString(), v.used.toLocaleString(), (v.alloc - v.used).toLocaleString(),
    ]),
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    didDrawPage: () => { addPdfHeader(pdf, title, subtitle); addPdfFooter(pdf); },
  });

  return sections;
}

function buildBudgetReport(pdf: jsPDF, projects: Project[], transactions: Transaction[]): number {
  const marginX = 14;
  const title = 'Budget & Expenditure Report';
  const subtitle = `${projects.length} projects`;
  let y = 32;
  let sections = 0;

  y = addSectionHeading(pdf, y, '1. Budget Allocations per Project'); sections++;
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX, top: 32, bottom: 18 },
    head: [['Project', 'Department', 'Allocated (R)', 'Spent (R)', 'Remaining (R)', 'Util %']],
    body: projects.map((p) => {
      const a = p.budgetAllocated || 0;
      const u = p.budgetUsed || 0;
      const r = Math.max(a - u, 0);
      const pct = a > 0 ? ((u / a) * 100).toFixed(1) : '0.0';
      return [p.title || 'Untitled', p.department || '—', a.toLocaleString(), u.toLocaleString(), r.toLocaleString(), `${pct}%`];
    }),
    columnStyles: {
      2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right' }, 5: { halign: 'center' },
    },
    didDrawPage: () => { addPdfHeader(pdf, title, subtitle); addPdfFooter(pdf); },
  });
  y = (pdf as any).lastAutoTable.finalY + 8;

  y = ensureSpace(pdf, y, 50, title, subtitle);
  y = addSectionHeading(pdf, y, '2. Financial Summary'); sections++;
  const totalIncome = transactions.filter((t) => t.type === 'income' && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense' && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0);
  const pending = transactions.filter((t) => t.status === 'pending').reduce((s, t) => s + (t.amount || 0), 0);
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX },
    head: [['Total Income (R)', 'Total Expenditure (R)', 'Net Position (R)', 'Pending (R)']],
    body: [[totalIncome.toLocaleString(), totalExpense.toLocaleString(), (totalIncome - totalExpense).toLocaleString(), pending.toLocaleString()]],
    columnStyles: { 0: { halign: 'right' }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });
  y = (pdf as any).lastAutoTable.finalY + 8;

  y = ensureSpace(pdf, y, 50, title, subtitle);
  y = addSectionHeading(pdf, y, '3. Transaction Ledger'); sections++;
  if (transactions.length === 0) {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX },
      head: [['Status']], body: [['No transactions recorded.']],
    });
  } else {
    const projMap = new Map(projects.map((p) => [p.id, p.title]));
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX, top: 32, bottom: 18 },
      head: [['Date', 'Project', 'Description', 'Category', 'Reference', 'Type', 'Amount (R)']],
      body: transactions.map((t) => [
        t.date || '—', projMap.get(t.projectId) || `#${t.projectId}`,
        t.description || '—', t.category || '—', t.reference || '—',
        (t.type || '').toUpperCase(),
        (t.type === 'income' ? '+' : '−') + (t.amount || 0).toLocaleString(),
      ]),
      columnStyles: { 5: { halign: 'center' }, 6: { halign: 'right', fontStyle: 'bold' } },
      didDrawPage: () => { addPdfHeader(pdf, title, subtitle); addPdfFooter(pdf); },
    });
  }

  return sections;
}

function buildProgressReport(pdf: jsPDF, projects: Project[]): number {
  const marginX = 14;
  const title = 'Progress & Milestones Report';
  const subtitle = `${projects.length} projects`;
  let y = 32;
  let sections = 0;

  y = addSectionHeading(pdf, y, '1. Project Progress Overview'); sections++;
  autoTable(pdf, {
    ...TABLE_STYLE,
    startY: y, margin: { left: marginX, right: marginX, top: 32, bottom: 18 },
    head: [['Project', 'Department', 'Status', 'Progress', 'Milestones', 'Start', 'Completion']],
    body: projects.map((p) => {
      const ms = p.milestones || [];
      const done = ms.filter((m) => (m.status || '').toLowerCase().includes('complet')).length;
      return [
        p.title || 'Untitled', p.department || '—', p.status || '—',
        `${p.overallProgress ?? 0}%`, `${done} / ${ms.length}`,
        p.startDate || '—', p.expectedCompletion || '—',
      ];
    }),
    columnStyles: { 3: { halign: 'center' }, 4: { halign: 'center' } },
    didDrawPage: () => { addPdfHeader(pdf, title, subtitle); addPdfFooter(pdf); },
  });
  y = (pdf as any).lastAutoTable.finalY + 8;

  y = ensureSpace(pdf, y, 50, title, subtitle);
  y = addSectionHeading(pdf, y, '2. Complete Milestone Register'); sections++;
  const allMs: (string | number)[][] = [];
  projects.forEach((p) => {
    (p.milestones || []).forEach((m) => {
      allMs.push([p.title || 'Untitled', m.name || '—', m.date || '—', m.status || '—']);
    });
  });
  if (allMs.length === 0) {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX },
      head: [['Status']], body: [['No milestones recorded across projects.']],
    });
  } else {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX, top: 32, bottom: 18 },
      head: [['Project', 'Milestone', 'Date', 'Status']],
      body: allMs,
      columnStyles: { 3: { halign: 'center' } },
      didDrawPage: () => { addPdfHeader(pdf, title, subtitle); addPdfFooter(pdf); },
    });
  }

  return sections;
}

function buildDocumentsReport(pdf: jsPDF, projects: Project[]): number {
  const marginX = 14;
  const title = 'Documents & Blueprints Register';
  const subtitle = `${projects.length} projects`;
  let y = 32;
  let sections = 0;

  y = addSectionHeading(pdf, y, '1. Document Register'); sections++;
  const rows: (string | number)[][] = [];
  projects.forEach((p) => {
    (p.blueprintFileNames || []).forEach((f) => rows.push([p.title || 'Untitled', 'Blueprint', f, `${API_URL}/uploads/${f}`]));
    (p.additionalDocumentNames || []).forEach((f) => rows.push([p.title || 'Untitled', 'Additional Document', f, `${API_URL}/uploads/${f}`]));
  });
  if (rows.length === 0) {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX },
      head: [['Status']], body: [['No documents uploaded across projects.']],
    });
  } else {
    autoTable(pdf, {
      ...TABLE_STYLE,
      startY: y, margin: { left: marginX, right: marginX, top: 32, bottom: 18 },
      head: [['Project', 'Type', 'File Name', 'URL']],
      body: rows,
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 35 }, 2: { cellWidth: 60 } },
      didDrawPage: () => { addPdfHeader(pdf, title, subtitle); addPdfFooter(pdf); },
    });
  }

  return sections;
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function ReportsModule() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reportType, setReportType] = useState<ReportType>('comprehensive');
  const [selectedProjectId, setSelectedProjectId] = useState<'all' | number>('all');
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [history, setHistory] = useState<GeneratedReport[]>(() => loadHistory());
  const [historySearch, setHistorySearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, tx, iss] = await Promise.all([
          axios.get(`${API_URL}/api/projects`).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/api/transactions/all`).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/api/issues`).catch(() => ({ data: [] })),
        ]);
        setProjects(p.data || []);
        setTransactions(tx.data || []);
        setIssues(iss.data || []);
      } catch (err: any) {
        console.error('Reports fetch error:', err);
        setError('Could not load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const stats = useMemo(() => {
    const totalAlloc = projects.reduce((s, p) => s + (p.budgetAllocated || 0), 0);
    const totalUsed = projects.reduce((s, p) => s + (p.budgetUsed || 0), 0);
    return { totalReports: history.length, totalProjects: projects.length, totalAlloc, totalUsed };
  }, [history, projects]);

  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    if (!q) return history;
    return history.filter((h) =>
      h.name.toLowerCase().includes(q) ||
      h.type.toLowerCase().includes(q) ||
      h.projectLabel.toLowerCase().includes(q)
    );
  }, [history, historySearch]);

  const filteredProjectList = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.department || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  const selectedProject = useMemo(
    () => (selectedProjectId === 'all' ? null : projects.find((p) => p.id === selectedProjectId) || null),
    [projects, selectedProjectId]
  );

  const projectLabel =
    selectedProjectId === 'all' ? 'All Projects' : selectedProject?.title || 'Unknown Project';

  const filteredProjects = useMemo(
    () => (selectedProjectId === 'all' ? projects : projects.filter((p) => p.id === selectedProjectId)),
    [projects, selectedProjectId]
  );

  const filteredTransactions = useMemo(
    () => (selectedProjectId === 'all' ? transactions : transactions.filter((t) => t.projectId === selectedProjectId)),
    [transactions, selectedProjectId]
  );

  const recordGenerated = (name: string, type: string, sections: number) => {
    const entry: GeneratedReport = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name, type, projectLabel,
      generatedAt: new Date().toISOString(),
      sections,
    };
    const next = [entry, ...history];
    setHistory(next);
    saveHistory(next);
  };

  const needsProjectSelected = reportType === 'comprehensive' && selectedProjectId === 'all';

  const handleGenerate = async () => {
    if (needsProjectSelected) {
      setToast('Select a specific project for the comprehensive report');
      return;
    }

    setGenerating(true);
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const todayIso = new Date().toISOString().slice(0, 10);
      const safeProject = projectLabel.replace(/\s+/g, '_');
      const filename = `GCPTS_${reportType}_${safeProject}_${todayIso}.pdf`;

      let sections = 0;
      let headerTitle = '';
      let headerSubtitle = '';

      if (reportType === 'comprehensive' && selectedProject) {
        headerTitle = 'Comprehensive Project Report';
        headerSubtitle = selectedProject.title;
        addPdfHeader(pdf, headerTitle, headerSubtitle);
        sections = buildComprehensiveReport(pdf, selectedProject, filteredTransactions, issues);
      } else if (reportType === 'portfolio') {
        headerTitle = 'Full Portfolio Report';
        headerSubtitle = `${filteredProjects.length} projects`;
        addPdfHeader(pdf, headerTitle, headerSubtitle);
        sections = buildPortfolioReport(pdf, filteredProjects);
      } else if (reportType === 'budget_only') {
        headerTitle = 'Budget & Expenditure Report';
        headerSubtitle = `${filteredProjects.length} projects`;
        addPdfHeader(pdf, headerTitle, headerSubtitle);
        sections = buildBudgetReport(pdf, filteredProjects, filteredTransactions);
      } else if (reportType === 'progress_only') {
        headerTitle = 'Progress & Milestones Report';
        headerSubtitle = `${filteredProjects.length} projects`;
        addPdfHeader(pdf, headerTitle, headerSubtitle);
        sections = buildProgressReport(pdf, filteredProjects);
      } else if (reportType === 'documents_only') {
        headerTitle = 'Documents & Blueprints Register';
        headerSubtitle = `${filteredProjects.length} projects`;
        addPdfHeader(pdf, headerTitle, headerSubtitle);
        sections = buildDocumentsReport(pdf, filteredProjects);
      }

      addPdfFooter(pdf);

      pdf.save(filename);
      recordGenerated(headerTitle, reportType, sections);
      setToast(`Generated "${headerTitle}" — ${sections} sections`);
    } catch (err) {
      console.error('Report generation failed:', err);
      setToast('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .rm-root { font-family: 'DM Sans', system-ui, sans-serif; color: ${C.ink}; padding: 4px 0 32px; }
        .rm-head { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }
        .rm-head-left { display: flex; align-items: center; gap: 14px; }
        .rm-head-mark { width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, #7f9dc4, #b8a4d4); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; box-shadow: 0 6px 18px -6px rgba(127,157,196,0.5); }
        .rm-head-text h1 { font-family: 'Sora', sans-serif; font-size: 1.15rem; font-weight: 600; color: ${C.ink}; margin: 0; letter-spacing: -0.02em; }
        .rm-head-text p { font-size: 0.75rem; color: ${C.inkMuted}; margin: 3px 0 0; }
        .rm-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px; }
        @media (max-width: 1100px) { .rm-metrics { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .rm-metrics { grid-template-columns: 1fr; } }
        .rm-metric { padding: 18px; border-radius: 18px; background: ${C.glass}; backdrop-filter: blur(20px); border: 1px solid ${C.glassBorder}; box-shadow: 0 10px 24px -20px rgba(80,90,130,0.3), inset 0 1px 0 rgba(255,255,255,0.75); display: flex; flex-direction: column; gap: 12px; transition: all 0.3s ease; }
        .rm-metric:hover { transform: translateY(-3px); }
        .rm-metric-top { display: flex; align-items: center; justify-content: space-between; }
        .rm-metric-label { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 600; color: ${C.inkMuted}; }
        .rm-metric-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .rm-metric-value { font-family: 'Sora', sans-serif; font-size: 1.4rem; font-weight: 600; color: ${C.ink}; line-height: 1.1; letter-spacing: -0.025em; font-variant-numeric: tabular-nums; }
        .rm-metric-foot { font-size: 0.7rem; color: ${C.inkSoft}; }
        .rm-card { padding: 24px; border-radius: 22px; background: ${C.glass}; backdrop-filter: blur(24px); border: 1px solid ${C.glassBorder}; box-shadow: 0 18px 44px -30px rgba(80,90,130,0.4); margin-bottom: 22px; }
        .rm-section-title { font-family: 'Sora', sans-serif; font-size: 0.95rem; font-weight: 600; color: ${C.ink}; margin: 0 0 16px; display: flex; align-items: center; gap: 9px; }
        .rm-section-title .badge { font-family: 'DM Sans', sans-serif; font-size: 0.66rem; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: rgba(255,255,255,0.6); border: 1px solid ${C.glassBorder}; color: ${C.inkSoft}; }
        .rm-field { display: flex; flex-direction: column; gap: 6px; }
        .rm-field > label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: ${C.inkMuted}; }

        /* ─── Report type grid ─── */
        .rm-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 10px;
          margin-top: 8px;
        }
        .rm-type-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid ${C.glassBorder};
          background: rgba(255,255,255,0.6);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: all 0.22s ease;
        }
        .rm-type-card:hover {
          background: #fff;
          border-color: ${C.lavender.ring};
          transform: translateY(-1px);
        }
        .rm-type-card.active {
          background: #fff;
          border-color: ${C.lavender.accent};
          box-shadow: 0 0 0 3px ${C.lavender.bg}, 0 8px 20px -12px ${C.lavender.ring};
        }
        .rm-type-icon {
          width: 34px; height: 34px;
          border-radius: 10px;
          background: ${C.lavender.bg};
          color: ${C.lavender.text};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rm-type-body { flex: 1; min-width: 0; }
        .rm-type-label {
          font-family: 'Sora', sans-serif;
          font-size: 0.83rem; font-weight: 600;
          color: ${C.ink}; margin: 0 0 3px;
          letter-spacing: -0.01em;
        }
        .rm-type-desc {
          font-size: 0.72rem; color: ${C.inkSoft};
          margin: 0; line-height: 1.4;
        }
        .rm-type-check {
          color: ${C.mint.text};
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* ─── Scope picker ─── */
        .rm-scope-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 8px 0 10px;
        }
        .rm-scope-count {
          font-size: 0.72rem;
          color: ${C.inkMuted};
          font-weight: 500;
          white-space: nowrap;
        }
        .rm-scope-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 10px;
          max-height: 380px;
          overflow-y: auto;
          padding: 4px;
          border-radius: 14px;
        }
        .rm-scope-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid ${C.glassBorder};
          background: rgba(255,255,255,0.6);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .rm-scope-card:hover:not(:disabled) {
          background: #fff;
          border-color: ${C.lavender.ring};
          transform: translateY(-1px);
        }
        .rm-scope-card.active {
          background: #fff;
          border-color: ${C.lavender.accent};
          box-shadow: 0 0 0 3px ${C.lavender.bg}, 0 8px 20px -14px ${C.lavender.ring};
        }
        .rm-scope-card:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .rm-scope-all {
          background: linear-gradient(135deg, rgba(238,234,247,0.9), rgba(229,238,248,0.9));
          border-color: ${C.lavender.ring};
        }
        .rm-scope-mark {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6);
        }
        .rm-scope-body { flex: 1; min-width: 0; }
        .rm-scope-title {
          font-size: 0.83rem; font-weight: 600;
          color: ${C.ink}; margin: 0 0 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .rm-scope-meta {
          font-size: 0.7rem; color: ${C.inkSoft};
          margin: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .rm-scope-check {
          color: ${C.mint.text};
          flex-shrink: 0;
        }
        .rm-scope-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 30px 20px;
          font-size: 0.8rem;
          color: ${C.inkMuted};
        }
        .rm-scope-summary {
          margin-top: 18px;
          padding: 10px 14px;
          background: ${C.sky.bg};
          border: 1px solid ${C.sky.ring};
          border-radius: 10px;
          font-size: 0.78rem;
          color: ${C.sky.text};
        }

        /* ─── Buttons ─── */
        .rm-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 12px; border: 1px solid transparent; font-size: 0.83rem; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.22s ease; margin-top: 18px; }
        .rm-btn.primary { background: linear-gradient(135deg, #7f9dc4, #b8a4d4); color: #fff; box-shadow: 0 8px 20px -10px ${C.lavender.ring}; }
        .rm-btn.primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 26px -10px ${C.lavender.ring}; }
        .rm-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .rm-btn.ghost { background: rgba(255,255,255,0.7); border-color: ${C.glassBorder}; color: ${C.inkSoft}; }
        .rm-btn.ghost:hover { background: #fff; color: ${C.ink}; }

        .rm-info { font-size: 0.72rem; color: ${C.inkSoft}; margin-top: 6px; line-height: 1.5; }
        .rm-info.warn { color: ${C.rose.text}; background: ${C.rose.bg}; padding: 10px 14px; border-radius: 10px; display: block; margin-top: 12px; font-weight: 500; }

        .rm-search { display: flex; align-items: center; gap: 9px; background: rgba(255,255,255,0.7); border: 1px solid ${C.glassBorder}; border-radius: 11px; padding: 9px 14px; min-width: 240px; }
        .rm-search:focus-within { border-color: ${C.lavender.accent}; box-shadow: 0 0 0 4px ${C.lavender.bg}; background: #fff; }
        .rm-search input { border: none; background: transparent; outline: none; width: 100%; font-size: 0.82rem; color: ${C.ink}; font-family: inherit; }

        /* ─── History ─── */
        .rm-history-row { display: grid; grid-template-columns: 40px 1fr 200px 180px 120px; gap: 16px; align-items: center; padding: 14px 12px; border-radius: 14px; }
        .rm-history-row:hover { background: rgba(255,255,255,0.5); }
        .rm-history-row + .rm-history-row { border-top: 1px solid ${C.hairDark}; }
        @media (max-width: 900px) { .rm-history-row { grid-template-columns: 1fr; } }
        .rm-history-icon { width: 36px; height: 36px; border-radius: 10px; background: ${C.sky.bg}; color: ${C.sky.text}; display: flex; align-items: center; justify-content: center; }
        .rm-history-name { font-size: 0.85rem; font-weight: 600; color: ${C.ink}; margin: 0 0 3px; }
        .rm-history-meta { font-size: 0.72rem; color: ${C.inkSoft}; display: flex; align-items: center; gap: 8px; }
        .rm-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.68rem; font-weight: 600; background: ${C.lavender.bg}; color: ${C.lavender.text}; }

        .rm-empty { text-align: center; padding: 50px 24px; color: ${C.inkSoft}; }
        .rm-empty-icon { width: 56px; height: 56px; border-radius: 18px; background: ${C.lavender.bg}; color: ${C.lavender.text}; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
        .rm-empty h3 { font-family: 'Sora', sans-serif; font-size: 1rem; font-weight: 600; color: ${C.ink}; margin: 0 0 4px; }

        .rm-toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; padding: 13px 20px; border-radius: 999px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border: 1px solid ${C.glassBorder}; box-shadow: 0 20px 44px -20px rgba(70,80,120,0.4); font-size: 0.83rem; color: ${C.ink}; font-weight: 500; z-index: 999; }
        .rm-toast-icon { width: 26px; height: 26px; border-radius: 50%; background: ${C.mint.bg}; color: ${C.mint.text}; display: flex; align-items: center; justify-content: center; }
        .rm-toast button { background: none; border: none; color: ${C.inkMuted}; cursor: pointer; display: flex; padding: 0; }
        .rm-loader { padding: 80px 24px; text-align: center; color: ${C.inkSoft}; }
        .rm-error { padding: 24px; text-align: center; background: ${C.rose.bg}; color: ${C.rose.text}; border: 1px solid ${C.rose.ring}; border-radius: 14px; }
      `}</style>

      <div className="rm-root">
        {/* Header */}
        <div className="rm-head">
          <div className="rm-head-left">
            <div className="rm-head-mark">
              <FileText size={22} strokeWidth={1.9} />
            </div>
            <div className="rm-head-text">
              <h1>Reports & Analytics</h1>
              <p>Generate comprehensive PDF reports for a single project or your entire portfolio.</p>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="rm-metrics">
          <motion.div className="rm-metric" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="rm-metric-top">
              <span className="rm-metric-label">Reports Generated</span>
              <div className="rm-metric-icon" style={{ background: C.lavender.bg, color: C.lavender.text }}>
                <FileDown size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="rm-metric-value">{stats.totalReports}</div>
            <div className="rm-metric-foot">Saved in your browser</div>
          </motion.div>

          <motion.div className="rm-metric" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
            <div className="rm-metric-top">
              <span className="rm-metric-label">Projects Available</span>
              <div className="rm-metric-icon" style={{ background: C.sky.bg, color: C.sky.text }}>
                <Building2 size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="rm-metric-value">{stats.totalProjects}</div>
            <div className="rm-metric-foot">Across all departments</div>
          </motion.div>

          <motion.div className="rm-metric" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <div className="rm-metric-top">
              <span className="rm-metric-label">Total Allocated</span>
              <div className="rm-metric-icon" style={{ background: C.mint.bg, color: C.mint.text }}>
                <Coins size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="rm-metric-value">{fmtCurrency(stats.totalAlloc)}</div>
            <div className="rm-metric-foot">Portfolio budget</div>
          </motion.div>

          <motion.div className="rm-metric" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
            <div className="rm-metric-top">
              <span className="rm-metric-label">Total Spent</span>
              <div className="rm-metric-icon" style={{ background: C.peach.bg, color: C.peach.text }}>
                <AlertTriangle size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="rm-metric-value">{fmtCurrency(stats.totalUsed)}</div>
            <div className="rm-metric-foot">
              {stats.totalAlloc > 0 ? `${((stats.totalUsed / stats.totalAlloc) * 100).toFixed(1)}% utilised` : '0% utilised'}
            </div>
          </motion.div>
        </div>

        {/* Generate form */}
        <div className="rm-card">
          <h3 className="rm-section-title">
            <Sparkles size={15} strokeWidth={2.4} /> Generate New Report
          </h3>

          {/* Step 1 — Report Type */}
          <div className="rm-field" style={{ marginBottom: 22 }}>
            <label>1. Choose Report Type</label>
            <div className="rm-type-grid">
              {REPORT_TYPES.map((rt) => {
                const isActive = reportType === rt.key;
                return (
                  <button
                    key={rt.key}
                    type="button"
                    className={`rm-type-card ${isActive ? 'active' : ''}`}
                    onClick={() => setReportType(rt.key)}
                  >
                    <div className="rm-type-icon">
                      {rt.key === 'comprehensive' && <FileText size={16} strokeWidth={2.2} />}
                      {rt.key === 'portfolio'     && <Layers size={16} strokeWidth={2.2} />}
                      {rt.key === 'budget_only'   && <Coins size={16} strokeWidth={2.2} />}
                      {rt.key === 'progress_only' && <TrendingUp size={16} strokeWidth={2.2} />}
                      {rt.key === 'documents_only'&& <FileDown size={16} strokeWidth={2.2} />}
                    </div>
                    <div className="rm-type-body">
                      <p className="rm-type-label">{rt.label}</p>
                      <p className="rm-type-desc">{rt.description}</p>
                    </div>
                    {isActive && <CheckCircle2 size={16} strokeWidth={2.4} className="rm-type-check" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Scope picker (grid of project cards) */}
          <div className="rm-field" style={{ marginBottom: 6 }}>
            <label>2. Choose Scope</label>

            <div className="rm-scope-toolbar">
              <div className="rm-search" style={{ flex: 1, minWidth: 200 }}>
                <Search size={14} color={C.inkMuted} strokeWidth={2.2} />
                <input
                  type="text"
                  placeholder="Search projects by name, department or location…"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                />
              </div>
              <span className="rm-scope-count">
                {filteredProjectList.length} of {projects.length}
              </span>
            </div>

            <div className="rm-scope-grid">
              {!projectSearch.trim() && (
                <button
                  type="button"
                  className={`rm-scope-card rm-scope-all ${selectedProjectId === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedProjectId('all')}
                  disabled={reportType === 'comprehensive'}
                  title={reportType === 'comprehensive' ? 'Comprehensive report requires a single project' : ''}
                >
                  <div className="rm-scope-mark" style={{ background: C.lavender.bg, color: C.lavender.text }}>
                    <Layers size={18} strokeWidth={2.1} />
                  </div>
                  <div className="rm-scope-body">
                    <p className="rm-scope-title">All Projects</p>
                    <p className="rm-scope-meta">{projects.length} projects · full portfolio</p>
                  </div>
                  {selectedProjectId === 'all' && (
                    <CheckCircle2 size={16} strokeWidth={2.4} className="rm-scope-check" />
                  )}
                </button>
              )}

              {filteredProjectList.map((p) => {
                const isActive = selectedProjectId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`rm-scope-card ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedProjectId(p.id)}
                  >
                    <div className="rm-scope-mark" style={{ background: C.sky.bg, color: C.sky.text }}>
                      <Building2 size={18} strokeWidth={2.1} />
                    </div>
                    <div className="rm-scope-body">
                      <p className="rm-scope-title">{p.title}</p>
                      <p className="rm-scope-meta">
                        {p.department || 'No department'}
                        {p.location && ` · ${p.location}`}
                      </p>
                    </div>
                    {isActive && (
                      <CheckCircle2 size={16} strokeWidth={2.4} className="rm-scope-check" />
                    )}
                  </button>
                );
              })}

              {filteredProjectList.length === 0 && projectSearch.trim() && (
                <div className="rm-scope-empty">
                  No projects match "{projectSearch}"
                </div>
              )}
            </div>
          </div>

          {needsProjectSelected && (
            <div className="rm-info warn">
              ⚠️ The Comprehensive report requires a specific project. Pick one from the grid above.
            </div>
          )}

          <div className="rm-scope-summary">
            <span style={{ fontWeight: 600 }}>Ready to generate:</span>{' '}
            {REPORT_TYPES.find((r) => r.key === reportType)?.label} ·{' '}
            <strong>{projectLabel}</strong>
          </div>

          <button
            className="rm-btn primary"
            onClick={handleGenerate}
            disabled={generating || needsProjectSelected}
          >
            {generating ? (
              <>
                <Loader2 size={15} strokeWidth={2.4} style={{ animation: 'spin 1s linear infinite' }} />
                Generating…
              </>
            ) : (
              <>
                <Download size={15} strokeWidth={2.4} />
                Generate Report (PDF)
              </>
            )}
          </button>
        </div>

        {/* History */}
        <div className="rm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <h3 className="rm-section-title" style={{ margin: 0 }}>
              <Clock size={15} strokeWidth={2.4} /> Recently Generated
              <span className="badge">{filteredHistory.length}</span>
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="rm-search">
                <Search size={14} color={C.inkMuted} strokeWidth={2.2} />
                <input
                  type="text"
                  placeholder="Search report history…"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>
              {history.length > 0 && (
                <button className="rm-btn ghost" style={{ margin: 0, padding: '9px 14px', fontSize: '0.78rem' }} onClick={clearHistory}>
                  <RefreshCw size={13} strokeWidth={2.2} /> Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="rm-loader">Loading projects…</div>
          ) : error ? (
            <div className="rm-error">{error}</div>
          ) : filteredHistory.length === 0 ? (
            <div className="rm-empty">
              <div className="rm-empty-icon">
                <FileText size={24} strokeWidth={1.8} />
              </div>
              <h3>No reports generated yet</h3>
              <p>Generate your first report using the form above.</p>
            </div>
          ) : (
            filteredHistory.map((h) => (
              <div key={h.id} className="rm-history-row">
                <div className="rm-history-icon">
                  <FileText size={15} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="rm-history-name">{h.name}</p>
                  <div className="rm-history-meta">
                    <span className="rm-badge">{h.sections} sections</span>
                    <span>{h.type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: C.inkSoft }}>
                  <MapPin size={11} strokeWidth={2.2} style={{ marginRight: 5 }} />
                  {h.projectLabel}
                </div>
                <div style={{ fontSize: '0.78rem', color: C.inkSoft }}>
                  <Calendar size={11} strokeWidth={2.2} style={{ marginRight: 5 }} />
                  {fmtDateTime(h.generatedAt)}
                </div>
                <div style={{ fontSize: '0.72rem', color: C.mint.text, textAlign: 'right', fontWeight: 600 }}>
                  <CheckCircle2 size={12} strokeWidth={2.4} style={{ marginRight: 4 }} />
                  Done
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="rm-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.28 }}
          >
            <span className="rm-toast-icon">
              <CheckCircle2 size={14} strokeWidth={2.4} />
            </span>
            {toast}
            <button onClick={() => setToast(null)}>
              <X size={14} strokeWidth={2.4} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}