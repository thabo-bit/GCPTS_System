// src/Public/projectDetails.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, User, Briefcase, Calendar, FileText,
  AlertTriangle, CheckCircle2, Download, Coins, UploadCloud,
  Send, Receipt, TrendingDown, PieChart, Clock, DownloadCloud,
  Printer, Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../AuthContext';

const API_URL = 'http://localhost:8080';

const ORG_NAME = 'Department of Public Works';
const LOGO_BASE64 = '';

// Curated set of real, relevant public-development / infrastructure photos
const FALLBACK_HERO_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80', // construction site
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80', // highway / bridge
  'https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=1600&q=80', // dam / water
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80', // city buildings
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1600&q=80', // power / energy
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=80', // engineers / planning
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1600&q=80', // modern architecture
  'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&w=1600&q=80', // bridge / infrastructure
  'https://images.unsplash.com/photo-1523966211575-eb4a01e7dd51?auto=format&fit=crop&w=1600&q=80', // road construction
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80', // urban development
];

/**
 * Picks a deterministic fallback image based on the project id so that
 * the same project always shows the same hero image, but different
 * projects each get a different one. Prefers the project's own imageUrl.
 */
const getHeroImage = (project: { id?: number; imageUrl?: string } | null): string => {
  if (project?.imageUrl && project.imageUrl.trim() !== '') {
    return project.imageUrl;
  }
  const seed = typeof project?.id === 'number' ? project.id : 0;
  return FALLBACK_HERO_IMAGES[Math.abs(seed) % FALLBACK_HERO_IMAGES.length];
};

// ─── Auth-aware fetch helper ───
function authFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

interface Project {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  category?: string;
  department?: string;
  location?: string;
  projectManager?: string;
  contractor?: string;
  startDate?: string;
  expectedCompletion?: string;
  budgetAllocated?: number;
  budgetUsed?: number;
  overallProgress?: number;
  gpsCoordinates?: string;
  fundingSources?: any[];
  milestones?: any[];
  blueprintFileNames?: string[];
  additionalDocumentNames?: string[];
}

interface Issue {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  username?: string;
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
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export default function ViewProject() {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    marginTop: '8px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    color: '#0f172a',
    boxSizing: 'border-box',
  };

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { user, isLoggedIn } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Overview');

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState<boolean>(true);

  const [image, setImage] = useState<File | null>(null);
  const [issue, setIssue] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
  });
  const [showIssueForm, setShowIssueForm] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [transactionSearch, setTransactionSearch] = useState('');

  // ─── Fetch project ───
  useEffect(() => {
    authFetch(`/api/projects/${id}`)
      .then((r) => { if (!r.ok) throw new Error('Could not fetch project details.'); return r.json(); })
      .then((data) => { setProject(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [id]);

  // ─── Fetch issues on Community tab ───
  useEffect(() => {
    const fetchIssues = async () => {
      setLoadingIssues(true);
      try {
        const r = await authFetch(`/api/issues?projectId=${id}`);
        if (!r.ok) throw new Error('Failed to load issues');
        setIssues(await r.json());
      } catch (err) {
        console.log('Error loading issues:', err);
      } finally {
        setLoadingIssues(false);
      }
    };
    if (activeTab === 'Community') fetchIssues();
  }, [activeTab, id]);

  // ─── Fetch REAL transactions from backend ───
  useEffect(() => {
    const fetchTransactions = async () => {
      if (activeTab !== 'Funding Usage') return;

      setLoadingTransactions(true);
      setTransactionError(null);
      try {
        const response = await authFetch(`/api/transactions?projectId=${id}`);
        if (!response.ok) throw new Error(`Failed to load transactions (${response.status})`);
        const data: Transaction[] = await response.json();
        setTransactions(data);
      } catch (err: any) {
        console.error('Error loading transactions:', err);
        setTransactionError(err.message || 'Failed to load transactions');
        setTransactions([]);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [activeTab, id]);

  // ─── Submit issue ───
  const submitIssue = async () => {
    if (!issue.title || !issue.description || !issue.category) {
      alert('Please complete all required fields');
      return;
    }

    if (!isLoggedIn) {
      alert('Please log in to report an issue.');
      navigate('/login');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', issue.title);
      formData.append('description', issue.description);
      formData.append('category', issue.category);
      formData.append('location', issue.location);
      formData.append('projectId', id as string);
      formData.append('username', user?.fullName || 'Anonymous');
      formData.append('userEmail', user?.email || '');

      if (image) formData.append('image', image);

      const response = await authFetch('/api/issues', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Issue reported successfully');
        setIssue({ title: '', description: '', category: '', location: '' });
        setImage(null);
        setShowIssueForm(false);

        if (activeTab === 'Community') {
          const refreshed = await authFetch(`/api/issues?projectId=${id}`);
          if (refreshed.ok) setIssues(await refreshed.json());
        }
      } else {
        console.log(await response.text());
      }
    } catch (err) {
      console.log(err);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter = transactionFilter === 'all' || t.type === transactionFilter;
    const search = transactionSearch.toLowerCase();
    const matchesSearch =
      (t.description || '').toLowerCase().includes(search) ||
      (t.category || '').toLowerCase().includes(search) ||
      (t.reference || '').toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });

  // ⭐ Total Received = project.budgetAllocated (NOT income transactions).
  //    Computed directly every render — no useMemo, no stale state.
  const allocatedBudget = project?.budgetAllocated ?? 0;

  const totalSpent = transactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const pendingAmount = transactions
    .filter((t) => t.status === 'pending')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const availableBalance = allocatedBudget - totalSpent;

  // Kept for backwards compatibility with the PDF exporter
  const totalReceived = allocatedBudget;

  const formatCurrency = (amount: number) => `R ${(amount || 0).toLocaleString('en-ZA')}`;
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── PDF helpers ───
  const drawLogoPlaceholder = (pdf: jsPDF, x: number, y: number, size: number) => {
    pdf.setFillColor('#2563eb');
    pdf.roundedRect(x, y, size, size, 3, 3, 'F');
    pdf.setTextColor('#ffffff');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(size * 0.5);
    pdf.text('GP', x + size / 2, y + size / 2 + size * 0.18, { align: 'center' });
  };

  const addHeader = (pdf: jsPDF, pageWidth: number) => {
    const marginX = 14;
    const logoSize = 16;
    if (LOGO_BASE64) {
      try { pdf.addImage(LOGO_BASE64, 'PNG', marginX, 10, logoSize, logoSize); } catch { drawLogoPlaceholder(pdf, marginX, 10, logoSize); }
    } else {
      drawLogoPlaceholder(pdf, marginX, 10, logoSize);
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor('#0f172a');
    pdf.text('Project Financial Report', marginX + logoSize + 8, 17);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor('#64748b');
    pdf.text(ORG_NAME, marginX + logoSize + 8, 23);
    const today = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
    pdf.setFontSize(9);
    pdf.text(`Generated: ${today}`, pageWidth - marginX, 14, { align: 'right' });
    pdf.setDrawColor('#e2e8f0');
    pdf.setLineWidth(0.5);
    pdf.line(marginX, 30, pageWidth - marginX, 30);
  };

  const addFooter = (pdf: jsPDF, pageWidth: number, pageHeight: number) => {
    const marginX = 14;
    pdf.setDrawColor('#e2e8f0');
    pdf.setLineWidth(0.3);
    pdf.line(marginX, pageHeight - 16, pageWidth - marginX, pageHeight - 16);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor('#94a3b8');
    pdf.text('This is a computer-generated report. For questions, please contact the project manager.', marginX, pageHeight - 10);
    const pageCount = (pdf as any).getNumberOfPages();
    const currentPage = (pdf as any).getCurrentPageInfo().pageNumber;
    pdf.text(`Page ${currentPage} of ${pageCount}`, pageWidth - marginX, pageHeight - 10, { align: 'right' });
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginX = 14;

      addHeader(pdf, pageWidth);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor('#0f172a');
      pdf.text(project?.title || 'Project', marginX, 38);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor('#64748b');
      const metaLine = [
        project?.department ? `Department: ${project.department}` : null,
        project?.location ? `Location: ${project.location}` : null,
        project?.contractor ? `Contractor: ${project.contractor}` : null,
      ].filter(Boolean).join('   |   ');
      if (metaLine) pdf.text(metaLine, marginX, 44);

      const cardY = 50, cardHeight = 20, gap = 5;
      const cardWidth = (pageWidth - marginX * 2 - gap * 3) / 4;
      const cards = [
        { label: 'Total Received',    value: formatCurrency(allocatedBudget),  bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
        { label: 'Total Spent',       value: formatCurrency(totalSpent),       bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
        { label: 'Available Balance', value: formatCurrency(availableBalance), bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
        { label: 'Pending',           value: formatCurrency(pendingAmount),    bg: '#fefce8', border: '#fde047', text: '#854d0e' },
      ];
      cards.forEach((card, i) => {
        const x = marginX + i * (cardWidth + gap);
        pdf.setFillColor(card.bg);
        pdf.setDrawColor(card.border);
        pdf.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(card.text);
        pdf.text(card.label, x + 4, cardY + 7);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(card.value, x + 4, cardY + 15);
      });

      const rows = filteredTransactions.map((t) => [
        formatDate(t.date),
        t.description || '',
        t.category || '',
        t.reference || '',
        (t.status || '').charAt(0).toUpperCase() + (t.status || '').slice(1),
        `${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}`,
      ]);

      autoTable(pdf, {
        startY: cardY + cardHeight + 10,
        margin: { left: marginX, right: marginX, top: 35, bottom: 22 },
        head: [['Date', 'Description', 'Category', 'Reference', 'Status', 'Amount']],
        body: rows,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: '#0f172a', lineColor: '#f1f5f9', lineWidth: 0.2 },
        headStyles: { fillColor: [37, 99, 235], textColor: '#ffffff', fontStyle: 'bold', halign: 'left' },
        alternateRowStyles: { fillColor: '#f8fafc' },
        columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } },
        didParseCell: (data) => {
          if (data.section === 'body') {
            if (data.column.index === 5) {
              const isIncome = rows[data.row.index][5].startsWith('+');
              data.cell.styles.textColor = isIncome ? '#16a34a' : '#dc2626';
            }
            if (data.column.index === 4) {
              const status = rows[data.row.index][4].toLowerCase();
              data.cell.styles.textColor = status === 'completed' ? '#16a34a' : status === 'pending' ? '#ca8a04' : '#dc2626';
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        didDrawPage: () => {
          if ((pdf as any).getCurrentPageInfo().pageNumber > 1) addHeader(pdf, pageWidth);
          addFooter(pdf, pageWidth, pageHeight);
        },
      });

      const todayIso = new Date().toISOString().split('T')[0];
      const safeTitle = (project?.title || 'Report').replace(/\s+/g, '_');
      pdf.save(`Project_Financial_Report_${safeTitle}_${todayIso}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading project details...</div>;
  if (error) return <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444', fontFamily: 'system-ui' }}>Error: {error}</div>;
  if (!project) return null;

  const allocated = project.budgetAllocated || 0;
  const used = project.budgetUsed || 0;
  const remaining = Math.max(allocated - used, 0);
  const progress = project.overallProgress || 0;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span> /
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/projects')}>Projects</span> /
        <span style={{ color: '#0f172a', fontWeight: '500' }}>{project.title}</span>
      </div>

      {/* Hero */}
      <div style={{
        position: 'relative', borderRadius: '24px', overflow: 'hidden', height: '320px',
        backgroundColor: '#0f172a',
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.8)), url(${getHeroImage(project)})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '32px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
      }}>
        <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', gap: '8px' }}>
          <span style={{ backgroundColor: '#10b981', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
            {project.status || 'On Track'}
          </span>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
            {project.category || 'General'}
          </span>
        </div>

        <div>
          <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0', lineHeight: '1.2' }}>
            {project.title}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '16px', fontWeight: '500' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building2 size={16} /> {project.department || 'N/A'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {project.location || 'N/A'}</span>
          </p>
        </div>
      </div>

      {/* Progress strip */}
      <div style={{ background: '#fff', borderRadius: '20px', padding: '24px 32px', marginTop: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Overall Progress</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '5px' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid #f8fafc' }}>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b', marginBottom: '2px' }}><Calendar size={14} /> Start Date</span>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{project.startDate || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b', marginBottom: '2px' }}><Calendar size={14} /> Expected Completion</span>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{project.expectedCompletion || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b', marginBottom: '2px' }}><Coins size={14} /> Budget Allocated</span>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>R {allocated.toLocaleString()}</strong>
          </div>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b', marginBottom: '2px' }}><Briefcase size={14} /> Contractor</span>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{project.contractor || 'N/A'}</strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0', margin: '28px 0 20px 0', overflowX: 'auto' }}>
        {['Overview', 'Budget', 'Funding Usage', 'Progress', 'Timeline', 'Community', 'Documents', 'Issues'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none', padding: '12px 4px', fontSize: '15px',
              fontWeight: isActive ? '700' : '500', color: isActive ? '#2563eb' : '#64748b',
              cursor: 'pointer', borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: '-1px', whiteSpace: 'nowrap',
            }}>{tab}</button>
          );
        })}
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', minHeight: '350px' }}>

        {/* ─── OVERVIEW ─── */}
        {activeTab === 'Overview' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0' }}>Project Description</h3>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 0 32px 0' }}>
              {project.description || 'No description provided.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { icon: Building2, label: 'Department', value: project.department },
                { icon: MapPin, label: 'Location', value: project.location },
                { icon: User, label: 'Project Manager', value: project.projectManager },
                { icon: Briefcase, label: 'Contractor', value: project.contractor },
                { icon: Calendar, label: 'Start Date', value: project.startDate },
                { icon: Calendar, label: 'Expected Completion', value: project.expectedCompletion },
              ].map((it, i) => {
                const Icon = it.icon;
                return (
                  <div key={i} style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>{it.label}</span>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>{it.value || 'N/A'}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>GPS Coordinates</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontSize: '14px', fontWeight: '500' }}>
              <MapPin size={16} /> {project.gpsCoordinates || 'N/A'}
            </div>
          </div>
        )}

        {/* ─── BUDGET ─── */}
        {activeTab === 'Budget' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Allocated', value: `R ${allocated.toLocaleString()}`, color: '#0f172a' },
                { label: 'Used', value: `R ${used.toLocaleString()}`, color: '#2563eb' },
                { label: 'Remaining', value: `R ${remaining.toLocaleString()}`, color: '#10b981' },
                { label: 'Used %', value: `${allocated > 0 ? Math.round((used / allocated) * 100) : 0}%`, color: '#0f172a' },
              ].map((c, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Coins size={16} /> {c.label}</span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: c.color, marginTop: '6px' }}>{c.value}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Funding Sources</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {project.fundingSources && project.fundingSources.length > 0 ? (
                project.fundingSources.map((source: any, index: number) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="#64748b" /> {source.name}
                    </span>
                    <strong style={{ color: '#0f172a' }}>R {source.amount?.toLocaleString()}</strong>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '14px' }}>No funding sources recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── FUNDING USAGE ─── */}
        {activeTab === 'Funding Usage' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {/* ⭐ Total Received = project.budgetAllocated */}
              <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '13px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><Receipt size={16} /> Total Received</span>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e40af', marginTop: '8px' }}>{formatCurrency(allocatedBudget)}</div>
              </div>
              {/* ⭐ Total Spent = completed expense transactions */}
              <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', padding: '20px', borderRadius: '16px', border: '1px solid #fecaca' }}>
                <span style={{ fontSize: '13px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><TrendingDown size={16} /> Total Spent</span>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#991b1b', marginTop: '8px' }}>{formatCurrency(totalSpent)}</div>
              </div>
              {/* ⭐ Available = Allocated − Spent */}
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><PieChart size={16} /> Available Balance</span>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#166534', marginTop: '8px' }}>{formatCurrency(availableBalance)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', padding: '20px', borderRadius: '16px', border: '1px solid #fde047' }}>
                <span style={{ fontSize: '13px', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><Clock size={16} /> Pending</span>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#854d0e', marginTop: '8px' }}>{formatCurrency(pendingAmount)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Transaction History</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    style={{ padding: '10px 16px 10px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', width: '250px', backgroundColor: '#f8fafc' }}
                  />
                </div>
                <select value={transactionFilter} onChange={(e) => setTransactionFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
                  <option value="all">All Transactions</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                </select>
                <button onClick={exportToPDF} disabled={isExporting} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', fontSize: '14px', cursor: isExporting ? 'not-allowed' : 'pointer', backgroundColor: isExporting ? '#94a3b8' : '#2563eb', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#fff' }}>
                  {isExporting ? (<>⟳ Exporting...</>) : (<><DownloadCloud size={18} /> Export PDF</>)}
                </button>
                <button style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', cursor: 'pointer', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#0f172a' }} onClick={() => window.print()}>
                  <Printer size={18} /> Print
                </button>
              </div>
            </div>

            {loadingTransactions ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><p style={{ color: '#64748b' }}>Loading transactions...</p></div>
            ) : transactionError ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
                <p>Error: {transactionError}</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: '60px', height: '60px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Receipt size={28} />
                </div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>No transactions recorded</h3>
                <p style={{ color: '#64748b' }}>
                  {transactions.length === 0
                    ? 'No transactions have been added for this project yet.'
                    : 'No transactions match your current filter or search.'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Date</th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Description</th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Category</th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Reference</th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Status</th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{formatDate(t.date)}</td>
                        <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '500' }}>{t.description}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backgroundColor: t.type === 'income' ? '#f0fdf4' : '#fef2f2', color: t.type === 'income' ? '#16a34a' : '#dc2626' }}>{t.category}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>{t.reference}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backgroundColor: t.status === 'completed' ? '#f0fdf4' : t.status === 'pending' ? '#fefce8' : '#fef2f2', color: t.status === 'completed' ? '#16a34a' : t.status === 'pending' ? '#ca8a04' : '#dc2626' }}>{t.status}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: t.type === 'income' ? '#16a34a' : '#dc2626' }}>{t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── PROGRESS / TIMELINE ─── */}
        {(activeTab === 'Progress' || activeTab === 'Timeline') && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>Milestone Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '12px' }}>
              {project.milestones && project.milestones.length > 0 ? (
                project.milestones.map((milestone: any, idx: number, arr: any[]) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
                    {idx < arr.length - 1 && (
                      <div style={{ position: 'absolute', left: '11px', top: '24px', width: '2px', height: '36px', backgroundColor: milestone.status === 'Completed' ? '#10b981' : '#e2e8f0' }} />
                    )}
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: milestone.status === 'Completed' ? '#10b981' : milestone.status === 'In Progress' ? '#2563eb' : '#f1f5f9', border: milestone.status === 'Pending' ? '2px solid #cbd5e1' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      {milestone.status === 'Completed' ? <CheckCircle2 size={14} /> : ''}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: milestone.status === 'Pending' ? '#94a3b8' : '#0f172a', margin: 0 }}>{milestone.name}</h4>
                      <span style={{ fontSize: '12px', color: milestone.status === 'In Progress' ? '#2563eb' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Calendar size={12} /> {milestone.date}</span>
                    </div>
                  </div>
                ))
              ) : (<p style={{ color: '#64748b', fontSize: '14px' }}>No milestones recorded.</p>)}
            </div>
          </div>
        )}

        {/* ─── DOCUMENTS ─── */}
        {activeTab === 'Documents' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Project Documents & Blueprints</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Official architectural blueprints, environmental impact assessments, and reports.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {project.blueprintFileNames?.map((file: string, idx: number) => (
                <div key={`bp-${idx}`} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', backgroundColor: '#dbeafe', color: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} /></div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0', maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file}</h4>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Blueprint</p>
                    </div>
                  </div>
                  <a href={`${API_URL}/uploads/${file}`} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#2563eb', color: '#fff', textDecoration: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={14} /> Download
                  </a>
                </div>
              ))}

              {project.additionalDocumentNames?.map((file: string, idx: number) => (
                <div key={`doc-${idx}`} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} /></div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0', maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file}</h4>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Additional Document</p>
                    </div>
                  </div>
                  <a href={`${API_URL}/uploads/${file}`} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#2563eb', color: '#fff', textDecoration: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={14} /> Download
                  </a>
                </div>
              ))}

              {(!project.blueprintFileNames || project.blueprintFileNames.length === 0) && (!project.additionalDocumentNames || project.additionalDocumentNames.length === 0) && (
                <p style={{ color: '#64748b', fontSize: '14px' }}>No documents uploaded for this project.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── COMMUNITY ─── */}
        {activeTab === 'Community' && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>Community Issues</h3>

            {loadingIssues ? (
              <p style={{ color: '#64748b' }}>Loading issues...</p>
            ) : issues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: '60px', height: '60px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <User size={28} />
                </div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>No issues reported yet</h3>
                <p style={{ color: '#64748b' }}>Be the first person to report an issue.</p>
                <button onClick={() => { setActiveTab('Issues'); setShowIssueForm(true); }} style={{ marginTop: '16px', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                  Report an Issue
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {issues.map((item) => (
                  <div key={item.id} style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '17px', color: '#0f172a' }}>{item.title}</h4>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>{item.description}</p>
                    {item.imageUrl && (<img src={item.imageUrl} alt="Reported issue" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '12px', marginTop: '15px' }} />)}
                    <div style={{ marginTop: '15px', fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={12} />
                      Reported by: <strong style={{ color: '#475569' }}>{item.username || 'Anonymous'}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ISSUES (form) ─── */}
        {activeTab === 'Issues' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '5px' }}>Community Issue Reporting</h2>
                <p style={{ color: '#64748b' }}>Help improve this project by reporting problems you notice.</p>
              </div>
              <button onClick={() => setShowIssueForm(!showIssueForm)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                {showIssueForm ? 'Close Form' : 'Report Issue'}
              </button>
            </div>

            {isLoggedIn && user && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 13,
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <User size={14} />
                You are reporting as <strong>{user.fullName}</strong> ({user.email})
              </div>
            )}

            {showIssueForm && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Submit a New Issue</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label>Issue Title</label>
                    <input placeholder="Example: Damaged road near school" value={issue.title} onChange={(e) => setIssue({ ...issue, title: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label>Category</label>
                    <select value={issue.category} onChange={(e) => setIssue({ ...issue, category: e.target.value })} style={inputStyle}>
                      <option value="">Select category</option>
                      <option>Road Infrastructure</option>
                      <option>Water Supply</option>
                      <option>Electricity</option>
                      <option>Public Safety</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label>Location</label>
                    <input placeholder="Ward, Street, Area" value={issue.location} onChange={(e) => setIssue({ ...issue, location: e.target.value })} style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <label>Description</label>
                  <textarea placeholder="Explain the issue in detail..." value={issue.description} onChange={(e) => setIssue({ ...issue, description: e.target.value })} style={{ ...inputStyle, height: '130px', resize: 'none' }} />
                </div>

                <div style={{ marginTop: '25px' }}>
                  <label style={{ fontWeight: '600' }}>Upload Evidence Photo</label>
                  <div onClick={() => fileInput.current?.click()} style={{ marginTop: '10px', height: '150px', border: '2px dashed #cbd5e1', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: 'pointer', background: '#f8fafc' }}>
                    <UploadCloud size={35} color="#2563eb" />
                    <p style={{ color: '#64748b' }}>{image ? image.name : 'Click to upload image'}</p>
                    <input ref={fileInput} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) setImage(e.target.files[0]); }} />
                  </div>
                </div>

                <button onClick={submitIssue} style={{ marginTop: '30px', background: '#10b981', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Send size={18} />
                  Submit Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}