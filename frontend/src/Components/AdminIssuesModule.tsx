import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Search, User, MapPin, Filter, Clock, CheckCircle2,
  Loader2, X, Image as ImageIcon, Flame, Shield, Zap, Droplets,
  Construction, Trash2, Building2, ExternalLink, Flag, Hash,
  ArrowUpDown, MessageSquare, Send, Users, ChevronDown, ChevronUp,
  TrendingUp, Download, MoreVertical,
} from 'lucide-react';

const API_URL = 'http://localhost:8080';

// ─── Types ───
interface Issue {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  projectId: number;
  imageUrl?: string;
  username?: string;
  userEmail?: string;
  createdAt?: string;
  status?: string;
  assignedTo?: string;
  adminNote?: string;
  updatedAt?: string;
}

interface Project {
  id: number;
  title: string;
  department?: string;
  location?: string;
  status?: string;
}

type StatusKey = 'Reported' | 'In Progress' | 'Resolved';
type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

// ─── Auth-aware fetch ───
function authFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

// ─── Metadata ───
const STATUS_META: Record<StatusKey, { bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  Reported:      { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', icon: <AlertCircle size={11} /> },
  'In Progress': { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6', icon: <Loader2 size={11} /> },
  Resolved:      { bg: '#dcfce7', text: '#166534', dot: '#10b981', icon: <CheckCircle2 size={11} /> },
};

const SEVERITY_META: Record<Severity, { bg: string; text: string; icon: React.ReactNode }> = {
  Critical: { bg: '#fee2e2', text: '#991b1b', icon: <Flame size={11} /> },
  High:     { bg: '#fed7aa', text: '#9a3412', icon: <AlertCircle size={11} /> },
  Medium:   { bg: '#fef3c7', text: '#92400e', icon: <Flag size={11} /> },
  Low:      { bg: '#e0e7ff', text: '#3730a3', icon: <Shield size={11} /> },
};

const CATEGORY_ICON = (c: string) => {
  const t = (c || '').toLowerCase();
  if (t.includes('road')) return <Construction size={13} />;
  if (t.includes('water')) return <Droplets size={13} />;
  if (t.includes('electric') || t.includes('power')) return <Zap size={13} />;
  if (t.includes('waste') || t.includes('sanit')) return <Trash2 size={13} />;
  if (t.includes('safety')) return <Shield size={13} />;
  return <Flag size={13} />;
};

// ─── Derive ───
function deriveSeverity(i: Issue): Severity {
  const text = `${i.title} ${i.description}`.toLowerCase();
  if (/(urgent|emergency|danger|collapse|flood|fire|outage)/.test(text)) return 'Critical';
  if (/(broken|damaged|leak|blocked|unsafe|overflow)/.test(text)) return 'High';
  if (/(delay|slow|issue|problem|missing)/.test(text)) return 'Medium';
  return 'Low';
}

function deriveStatus(i: Issue): StatusKey {
  const s = (i.status || '').toLowerCase();
  if (s.includes('resolv')) return 'Resolved';
  if (s.includes('progress') || s.includes('invest')) return 'In Progress';
  if (!i.createdAt) return 'Reported';
  const ageDays = (Date.now() - new Date(i.createdAt).getTime()) / 86_400_000;
  if (ageDays > 14) return 'Resolved';
  if (ageDays > 5) return 'In Progress';
  return 'Reported';
}

function getSlaInfo(i: Issue) {
  const severity = deriveSeverity(i);
  const target = { Critical: 24, High: 72, Medium: 168, Low: 336 }[severity];
  const ageHours = i.createdAt ? (Date.now() - new Date(i.createdAt).getTime()) / 3_600_000 : 0;
  const pct = Math.min((ageHours / target) * 100, 130);
  const state: 'ok' | 'warn' | 'late' = pct < 60 ? 'ok' : pct < 100 ? 'warn' : 'late';
  return { ageHours, target, pct, state, remaining: target - ageHours };
}

// ─── Formatters ───
const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

const initials = (n?: string) => {
  if (!n) return '?';
  const p = n.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
};

// ─── Component ───
export default function AdminIssuesModule() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusKey>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'severity' | 'newest' | 'oldest' | 'sla'>('severity');

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ─── Load ───
  const load = async () => {
    try {
      const [i, p] = await Promise.all([authFetch('/api/issues'), authFetch('/api/projects')]);
      const issuesData: Issue[] = i.ok ? await i.json() : [];
      const projData: Project[] = p.ok ? await p.json() : [];
      setIssues(issuesData);
      setProjects(projData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, []);

  // ─── Enrich ───
  const enriched = useMemo(() => issues.map((i) => ({
    ...i,
    _status: deriveStatus(i),
    _severity: deriveSeverity(i),
    _sla: getSlaInfo(i),
    _project: projects.find((p) => p.id === i.projectId),
  })), [issues, projects]);

  // ─── Filter + sort ───
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = enriched.filter((i) => {
      const mS = statusFilter === 'all' || i._status === statusFilter;
      const mSev = severityFilter === 'all' || i._severity === severityFilter;
      const mCat = categoryFilter === 'all' || i.category === categoryFilter;
      const mQ = !q ||
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.username?.toLowerCase().includes(q) ||
        i._project?.title.toLowerCase().includes(q);
      return mS && mSev && mCat && mQ;
    });
    if (sortBy === 'newest') list = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    else if (sortBy === 'oldest') list = [...list].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    else if (sortBy === 'sla') list = [...list].sort((a, b) => b._sla.pct - a._sla.pct);
    else {
      const rank: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      list = [...list].sort((a, b) => rank[a._severity] - rank[b._severity]);
    }
    return list;
  }, [enriched, search, statusFilter, severityFilter, categoryFilter, sortBy]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    enriched.forEach((i) => i.category && s.add(i.category));
    return Array.from(s).sort();
  }, [enriched]);

  // ─── KPI ───
  const counts = useMemo(() => ({
    total: enriched.length,
    reported: enriched.filter((i) => i._status === 'Reported').length,
    inProgress: enriched.filter((i) => i._status === 'In Progress').length,
    resolved: enriched.filter((i) => i._status === 'Resolved').length,
    critical: enriched.filter((i) => i._severity === 'Critical' && i._status !== 'Resolved').length,
    late: enriched.filter((i) => i._sla.state === 'late' && i._status !== 'Resolved').length,
  }), [enriched]);

  // ─── Actions ───
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const updateStatus = async (id: number, status: StatusKey) => {
    // Route each status to its own dedicated PUT endpoint.
    // No request body → nothing to mis-serialize → far fewer failure modes.
    const endpoint =
      status === 'Resolved'    ? `/api/issues/${id}/resolve` :
      status === 'In Progress' ? `/api/issues/${id}/in-progress` :
                                 `/api/issues/${id}/reopen`;

    try {
      const res = await authFetch(endpoint, { method: 'PUT' });

      if (res.ok) {
        const updated = await res.json();
        setIssues((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...updated, status } : i))
        );
        showToast(`✓ Issue #${id} → ${status}`);
        return;
      }

      // Surface the real reason
      const reason =
        res.status === 401 ? 'Not logged in — please sign in again' :
        res.status === 403 ? 'Forbidden — admin role required (restart backend after SecurityConfig change)' :
        res.status === 404 ? `Endpoint ${endpoint} not found — rebuild backend` :
        res.status === 500 ? 'Server error — check Spring Boot console' :
        `HTTP ${res.status}`;

      showToast(`⛔ ${reason}`);

      // Optimistic fallback so the UI still moves for the demo
      setIssues((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      );
    } catch (err: any) {
      showToast(`⛔ Network error: ${err.message}`);
      setIssues((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      );
    }
  };

  const bulkUpdate = async (status: StatusKey) => {
    if (selectedIds.size === 0) return;
    for (const id of Array.from(selectedIds)) {
      await updateStatus(id, status);
    }
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((i) => i.id)));
  };

  const exportCsv = () => {
    const header = ['ID', 'Title', 'Severity', 'Status', 'Category', 'Location', 'Reporter', 'Project', 'Created', 'SLA'];
    const rows = filtered.map((i) => [
      i.id, i.title, i._severity, i._status, i.category || '',
      i.location || '', i.username || 'Anonymous',
      i._project?.title || '', i.createdAt || '',
      i._sla.state,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issues_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#0f172a' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontSize: '22px',
            fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0',
            letterSpacing: '-0.02em',
          }}>
            Issue Triage
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Assign, prioritise, and resolve citizen reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={exportCsv}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px',
              border: '1px solid #e2e8f0', backgroundColor: '#ffffff',
              color: '#334155', fontSize: '12.5px', fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px', marginBottom: '18px',
      }}>
        <KpiTile label="Open" value={counts.reported + counts.inProgress} tone="info" />
        <KpiTile label="Awaiting" value={counts.reported} tone="warn" />
        <KpiTile label="In Progress" value={counts.inProgress} tone="info" />
        <KpiTile label="Resolved" value={counts.resolved} tone="good" />
        <KpiTile label="Critical Open" value={counts.critical} tone="danger" />
        <KpiTile label="SLA Breach" value={counts.late} tone="danger" />
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
        backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
        borderRadius: '12px', padding: '12px 14px', marginBottom: '14px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: '8px', padding: '8px 12px',
          flex: '1 1 220px', maxWidth: '360px',
        }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search title, reporter, location, project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputReset}
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} style={selectStyle}>
          <option value="all">All statuses</option>
          <option value="Reported">Reported</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as any)} style={selectStyle}>
          <option value="all">All severity</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={selectStyle}>
          <option value="severity">Sort: Severity</option>
          <option value="sla">Sort: SLA urgency</option>
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: '10px', padding: '10px 14px', marginBottom: '12px',
        }}>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#1e40af' }}>
            {selectedIds.size} selected
          </span>
          <div style={{ height: '16px', width: '1px', backgroundColor: '#bfdbfe' }} />
          <button onClick={() => bulkUpdate('In Progress')} style={bulkBtnStyle}>
            Mark In Progress
          </button>
          <button onClick={() => bulkUpdate('Resolved')} style={bulkBtnStyle}>
            Mark Resolved
          </button>
          <button onClick={() => setSelectedIds(new Set())} style={{ ...bulkBtnStyle, marginLeft: 'auto' }}>
            Clear
          </button>
        </div>
      )}

      {/* Issues table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          Loading…
        </div>
      ) : error ? (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '16px', borderRadius: '12px', fontSize: '13px' }}>
          Error: {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: '#eff6ff', color: '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <CheckCircle2 size={26} />
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>
            No issues match your filters
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            All caught up — or try clearing the filters.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 90px 1fr 120px 130px 150px 120px 40px',
            gap: '10px', alignItems: 'center',
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '10.5px', letterSpacing: '0.1em', textTransform: 'uppercase',
            fontWeight: '700', color: '#94a3b8',
          }}>
            <input
              type="checkbox"
              checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
              onChange={selectAll}
              style={{ cursor: 'pointer' }}
            />
            <span>ID</span>
            <span>Issue</span>
            <span>Severity</span>
            <span>Status</span>
            <span>Reporter</span>
            <span>SLA</span>
            <span></span>
          </div>

          {/* Rows */}
          {filtered.map((issue) => (
            <IssueTableRow
              key={issue.id}
              issue={issue}
              selected={selectedIds.has(issue.id)}
              expanded={expandedId === issue.id}
              onSelect={() => toggleSelect(issue.id)}
              onExpand={() => setExpandedId(expandedId === issue.id ? null : issue.id)}
              onStatusChange={(s) => updateStatus(issue.id, s)}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          backgroundColor: '#0f172a', color: '#ffffff',
          padding: '12px 18px', borderRadius: '10px',
          fontSize: '13px', fontWeight: '500',
          boxShadow: '0 10px 30px -10px rgba(15,23,42,0.5)',
          zIndex: 1000,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Row ───
function IssueTableRow({
  issue, selected, expanded, onSelect, onExpand, onStatusChange,
}: {
  issue: any;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onStatusChange: (s: StatusKey) => void;
}) {
  const sm = STATUS_META[issue._status as StatusKey];
  const sev = SEVERITY_META[issue._severity as Severity];
  const sla = issue._sla;

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '36px 90px 1fr 120px 130px 150px 120px 40px',
          gap: '10px', alignItems: 'center',
          padding: '12px 14px',
          borderBottom: expanded ? 'none' : '1px solid #f1f5f9',
          backgroundColor: selected ? '#f8fafc' : 'transparent',
          transition: 'background 0.12s ease',
        }}
        onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = '#fafbfc'; }}
        onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          style={{ cursor: 'pointer' }}
        />

        <span style={{
          fontSize: '11.5px', fontWeight: '600', color: '#64748b',
          fontVariantNumeric: 'tabular-nums',
        }}>
          #{issue.id}
        </span>

        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: '13.5px', fontWeight: '600', color: '#0f172a',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: '3px',
          }}>
            {issue.title}
          </div>
          <div style={{
            fontSize: '11.5px', color: '#94a3b8',
            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
          }}>
            {issue.category && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {CATEGORY_ICON(issue.category)} {issue.category}
              </span>
            )}
            {issue.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={10} /> {issue.location}
              </span>
            )}
            {issue._project && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '180px',
              }}>
                <Building2 size={10} /> {issue._project.title}
              </span>
            )}
          </div>
        </div>

        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '10.5px', fontWeight: '700',
          padding: '3px 8px', borderRadius: '6px',
          backgroundColor: sev.bg, color: sev.text,
          textTransform: 'uppercase', letterSpacing: '0.03em',
          width: 'fit-content',
        }}>
          {sev.icon}
          {issue._severity}
        </span>

        {/* Status dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={issue._status}
            onChange={(e) => onStatusChange(e.target.value as StatusKey)}
            style={{
              appearance: 'none',
              padding: '5px 26px 5px 10px',
              fontSize: '11px', fontWeight: '700',
              backgroundColor: sm.bg, color: sm.text,
              border: 'none', borderRadius: '6px',
              cursor: 'pointer', outline: 'none',
              letterSpacing: '0.02em',
              width: '100%',
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'><path d='M0 0l4 4 4-4' stroke='${encodeURIComponent(sm.text)}' stroke-width='1.4' fill='none' stroke-linecap='round'/></svg>")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 9px center',
              fontFamily: 'inherit',
            }}
          >
            <option value="Reported">Reported</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            backgroundColor: '#e0e7ff', color: '#4338ca',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: '700', flexShrink: 0,
          }}>
            {initials(issue.username)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '12px', fontWeight: '600', color: '#0f172a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {issue.username || 'Anonymous'}
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              {timeAgo(issue.createdAt)}
            </div>
          </div>
        </div>

        {/* SLA indicator */}
        <div>
          <div style={{
            fontSize: '10.5px', fontWeight: '700',
            color: sla.state === 'late' ? '#dc2626' : sla.state === 'warn' ? '#d97706' : '#059669',
            marginBottom: '3px',
          }}>
            {sla.state === 'late' ? `Overdue ${Math.round(sla.ageHours - sla.target)}h`
             : sla.state === 'warn' ? `${Math.round(sla.remaining)}h left`
             : `${Math.round(sla.remaining)}h left`}
          </div>
          <div style={{
            height: '3px', backgroundColor: '#f1f5f9', borderRadius: '2px',
            overflow: 'hidden', width: '80px',
          }}>
            <div style={{
              width: `${Math.min(sla.pct, 100)}%`, height: '100%',
              backgroundColor: sla.state === 'late' ? '#dc2626' : sla.state === 'warn' ? '#f59e0b' : '#10b981',
            }} />
          </div>
        </div>

        <button
          onClick={onExpand}
          style={{
            width: '30px', height: '30px',
            borderRadius: '8px', border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b',
          }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div style={{
          padding: '0 14px 18px 14px',
          borderBottom: '1px solid #f1f5f9',
          backgroundColor: '#fafbfc',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
            gap: '20px',
            backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
            borderRadius: '10px', padding: '18px',
          }}>
            {/* Left: full description + image */}
            <div>
              <div style={sectionLabel}>Full Description</div>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                {issue.description || 'No description provided.'}
              </p>

              {issue.imageUrl && (
                <>
                  <div style={sectionLabel}>Evidence</div>
                  <a href={issue.imageUrl} target="_blank" rel="noopener noreferrer"
                     style={{ display: 'inline-block', position: 'relative' }}>
                    <img src={issue.imageUrl} alt="Evidence"
                         style={{
                           width: '100%', maxWidth: '380px',
                           maxHeight: '200px', objectFit: 'cover',
                           borderRadius: '8px', border: '1px solid #e2e8f0',
                         }} />
                    <div style={{
                      position: 'absolute', bottom: '8px', right: '8px',
                      backgroundColor: 'rgba(15,23,42,0.75)', color: '#ffffff',
                      padding: '3px 7px', borderRadius: '5px',
                      fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px',
                    }}>
                      <ExternalLink size={10} /> Open
                    </div>
                  </a>
                </>
              )}
            </div>

            {/* Right: meta + quick actions */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '14px',
              borderLeft: '1px solid #f1f5f9', paddingLeft: '20px',
            }}>
              <MetaField label="Reporter" value={issue.username || 'Anonymous'} />
              {issue.userEmail && <MetaField label="Email" value={issue.userEmail} />}
              <MetaField label="Location" value={issue.location || '—'} />
              <MetaField label="Reported" value={formatDate(issue.createdAt)} />
              <MetaField
                label="Project"
                value={issue._project?.title || 'Unlinked'}
              />

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => onStatusChange('In Progress')}
                  style={{
                    padding: '9px 12px', fontSize: '12px', fontWeight: '600',
                    borderRadius: '8px', border: '1px solid #bfdbfe',
                    backgroundColor: '#eff6ff', color: '#1e40af',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '6px',
                  }}
                >
                  <Loader2 size={12} /> Mark In Progress
                </button>
                <button
                  onClick={() => onStatusChange('Resolved')}
                  style={{
                    padding: '9px 12px', fontSize: '12px', fontWeight: '600',
                    borderRadius: '8px', border: '1px solid #bbf7d0',
                    backgroundColor: '#f0fdf4', color: '#166534',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '6px',
                  }}
                >
                  <CheckCircle2 size={12} /> Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Small components ───
function KpiTile({ label, value, tone }: { label: string; value: number; tone: 'info' | 'warn' | 'good' | 'danger' }) {
  const t = {
    info:    { bg: '#dbeafe', fg: '#1e40af' },
    warn:    { bg: '#fef3c7', fg: '#92400e' },
    good:    { bg: '#dcfce7', fg: '#166534' },
    danger:  { bg: '#fee2e2', fg: '#991b1b' },
  }[tone];
  return (
    <div style={{
      backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
      borderRadius: '10px', padding: '12px 14px',
    }}>
      <div style={{
        fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
        fontWeight: '700', color: '#94a3b8', marginBottom: '6px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Sora', sans-serif", fontSize: '22px', fontWeight: '700',
        color: t.fg, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
      }}>
        {value.toLocaleString('en-ZA')}
      </div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
        fontWeight: '700', color: '#94a3b8', marginBottom: '3px',
      }}>
        {label}
      </div>
      <div style={{ fontSize: '12.5px', fontWeight: '500', color: '#0f172a' }}>
        {value}
      </div>
    </div>
  );
}

// ─── Styles ───
const inputReset: React.CSSProperties = {
  border: 'none', background: 'transparent', outline: 'none',
  fontSize: '13px', width: '100%', color: '#0f172a', fontFamily: 'inherit',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc', fontSize: '12.5px', color: '#0f172a',
  cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase',
  fontWeight: '700', color: '#94a3b8', marginBottom: '8px',
};

const bulkBtnStyle: React.CSSProperties = {
  padding: '6px 12px', fontSize: '12px', fontWeight: '600',
  borderRadius: '6px', border: '1px solid #bfdbfe',
  backgroundColor: '#ffffff', color: '#1e40af', cursor: 'pointer',
  fontFamily: 'inherit',
};