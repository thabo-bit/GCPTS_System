import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Search,
  User,
  MapPin,
  Filter,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Shield,
  Zap,
  Droplets,
  Construction,
  Trash2,
  Building2,
  Calendar,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Flag,
  Hash,
  ArrowUpRight,
  Activity,
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

// ─── Status / severity / category metadata ───
const STATUS_META: Record<StatusKey, { bg: string; text: string; dot: string; icon: React.ReactNode; label: string }> = {
  Reported: {
    bg: '#fef3c7', text: '#92400e', dot: '#f59e0b',
    icon: <AlertCircle size={13} />, label: 'Reported',
  },
  'In Progress': {
    bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6',
    icon: <Loader2 size={13} />, label: 'In Progress',
  },
  Resolved: {
    bg: '#dcfce7', text: '#166534', dot: '#10b981',
    icon: <CheckCircle2 size={13} />, label: 'Resolved',
  },
};

const SEVERITY_META: Record<Severity, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  Critical: { bg: '#fee2e2', text: '#991b1b', label: 'Critical', icon: <Flame size={11} /> },
  High:     { bg: '#fed7aa', text: '#9a3412', label: 'High',     icon: <AlertCircle size={11} /> },
  Medium:   { bg: '#fef3c7', text: '#92400e', label: 'Medium',   icon: <Minus size={11} /> },
  Low:      { bg: '#e0e7ff', text: '#3730a3', label: 'Low',      icon: <Shield size={11} /> },
};

// Category → icon mapping (fallback safe)
const CATEGORY_ICON = (category: string) => {
  const c = (category || '').toLowerCase();
  if (c.includes('road')) return <Construction size={14} />;
  if (c.includes('water')) return <Droplets size={14} />;
  if (c.includes('electric') || c.includes('power')) return <Zap size={14} />;
  if (c.includes('waste') || c.includes('sanit')) return <Trash2 size={14} />;
  if (c.includes('safety')) return <Shield size={14} />;
  return <Flag size={14} />;
};

// ─── Derive helpers ───
function deriveSeverity(issue: Issue): Severity {
  const text = `${issue.title} ${issue.description}`.toLowerCase();
  if (/(urgent|emergency|danger|collapse|flood|fire|outage)/.test(text)) return 'Critical';
  if (/(broken|damaged|leak|blocked|unsafe|overflow)/.test(text)) return 'High';
  if (/(delay|slow|issue|problem|missing)/.test(text)) return 'Medium';
  return 'Low';
}

function deriveStatus(issue: Issue): StatusKey {
  const s = (issue.status || '').toLowerCase();
  if (s.includes('resolv')) return 'Resolved';
  if (s.includes('progress') || s.includes('invest')) return 'In Progress';
  if (!issue.createdAt) return 'Reported';
  const ageDays = (Date.now() - new Date(issue.createdAt).getTime()) / 86_400_000;
  if (ageDays > 14) return 'Resolved';
  if (ageDays > 5) return 'In Progress';
  return 'Reported';
}

// ─── SLA: hours since report vs. target response window ───
function getSlaInfo(issue: Issue) {
  const severity = deriveSeverity(issue);
  const target = { Critical: 24, High: 72, Medium: 168, Low: 336 }[severity]; // hours
  const ageHours = issue.createdAt
    ? (Date.now() - new Date(issue.createdAt).getTime()) / 3_600_000
    : 0;
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

const formatTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
};

const timeAgo = (iso?: string) => {
  if (!iso) return 'unknown';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const initials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
};

// ─── Component ───
export default function IssuesModule() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusKey>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity'>('severity');

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ─── Load issues + projects ───
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const [issuesRes, projectsRes] = await Promise.all([
          authFetch('/api/issues'),
          authFetch('/api/projects'),
        ]);
        const issuesData: Issue[] = issuesRes.ok ? await issuesRes.json() : [];
        const projectsData: Project[] = projectsRes.ok ? await projectsRes.json() : [];
        if (!alive) return;
        setIssues(issuesData);
        setProjects(projectsData);
        setError(null);
        setLastUpdated(new Date());
      } catch (err: any) {
        if (!alive) return;
        setError(err.message || 'Failed to load issues');
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  // ─── Enrich each issue with derived fields ───
  const enriched = useMemo(() => {
    return issues.map((i) => {
      const project = projects.find((p) => p.id === i.projectId);
      return {
        ...i,
        _status: deriveStatus(i),
        _severity: deriveSeverity(i),
        _sla: getSlaInfo(i),
        _project: project,
      };
    });
  }, [issues, projects]);

  // ─── Filter + sort ───
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = enriched.filter((i) => {
      const mStatus = statusFilter === 'all' || i._status === statusFilter;
      const mCategory = categoryFilter === 'all' || (i.category || '') === categoryFilter;
      const mSeverity = severityFilter === 'all' || i._severity === severityFilter;
      const mSearch =
        !q ||
        (i.title || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q) ||
        (i.location || '').toLowerCase().includes(q) ||
        (i.username || '').toLowerCase().includes(q) ||
        (i._project?.title || '').toLowerCase().includes(q);
      return mStatus && mCategory && mSeverity && mSearch;
    });

    if (sortBy === 'newest') {
      list = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } else if (sortBy === 'oldest') {
      list = [...list].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    } else {
      const rank: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      list = [...list].sort((a, b) => rank[a._severity] - rank[b._severity]);
    }
    return list;
  }, [enriched, search, categoryFilter, statusFilter, severityFilter, sortBy]);

  const selected = useMemo(
    () => enriched.find((i) => i.id === selectedId) || null,
    [enriched, selectedId]
  );

  // ─── Aggregates ───
  const counts = useMemo(() => ({
    total: enriched.length,
    reported: enriched.filter((i) => i._status === 'Reported').length,
    inProgress: enriched.filter((i) => i._status === 'In Progress').length,
    resolved: enriched.filter((i) => i._status === 'Resolved').length,
    critical: enriched.filter((i) => i._severity === 'Critical').length,
    late: enriched.filter((i) => i._sla.state === 'late' && i._status !== 'Resolved').length,
    last7d: enriched.filter((i) => {
      if (!i.createdAt) return false;
      return Date.now() - new Date(i.createdAt).getTime() < 7 * 86_400_000;
    }).length,
  }), [enriched]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach((i) => i.category && set.add(i.category));
    return Array.from(set).sort();
  }, [enriched]);

  // ─── Category breakdown ───
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    enriched.forEach((i) => {
      const k = i.category || 'Uncategorised';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [enriched]);

  const maxCategoryCount = Math.max(1, ...categoryBreakdown.map((c) => c.count));

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#0f172a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* ─── Header ─── */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '24px', fontWeight: '700',
            color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em',
          }}>
            Community Issues
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Citizen-reported service delivery problems, triaged and tracked end-to-end.
          </p>
        </div>
        {lastUpdated && (
          <div style={{
            fontSize: '11.5px', color: '#94a3b8',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 0 3px rgba(16,185,129,0.15)',
            }} />
            Live · updated {lastUpdated.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* ─── KPI row ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <KpiCard icon={<MessageSquare size={15} />} label="Total Reported" value={counts.total} tone="neutral" hint={`${counts.last7d} in last 7 days`} />
        <KpiCard icon={<AlertCircle size={15} />} label="Awaiting Triage" value={counts.reported} tone="warn" hint="Needs attention" />
        <KpiCard icon={<Loader2 size={15} />} label="In Progress" value={counts.inProgress} tone="info" hint="Being worked on" />
        <KpiCard icon={<CheckCircle2 size={15} />} label="Resolved" value={counts.resolved} tone="good" hint="Closed successfully" />
        <KpiCard icon={<Flame size={15} />} label="Critical" value={counts.critical} tone="danger" hint="High-risk reports" />
        <KpiCard icon={<Clock size={15} />} label="Past SLA" value={counts.late} tone="danger" hint="Overdue responses" />
      </div>

      {/* ─── Main grid: list (left) + insight panel (right) ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 320px',
        gap: '20px',
        alignItems: 'flex-start',
      }}>

        {/* LEFT COLUMN */}
        <div>

          {/* Filters */}
          <div style={{
            display: 'flex', gap: '10px', flexWrap: 'wrap',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '14px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '8px', padding: '8px 12px',
              flex: '1 1 240px', maxWidth: '380px',
            }}>
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search issues, projects, locations…"
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
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>

          {/* Issue list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '14px' }}>
              Loading issues…
            </div>
          ) : error ? (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca',
              color: '#991b1b', padding: '16px', borderRadius: '12px', fontSize: '13px',
            }}>
              Error: {error}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onReset={() => { setSearch(''); setStatusFilter('all'); setSeverityFilter('all'); setCategoryFilter('all'); }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  selected={issue.id === selectedId}
                  onClick={() => setSelectedId(issue.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — insight panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <Panel title="By Category" icon={<Hash size={13} />}>
            {categoryBreakdown.length === 0 ? (
              <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>No data yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categoryBreakdown.map((c) => (
                  <div key={c.name}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '12px', color: '#475569', marginBottom: '4px',
                    }}>
                      <span style={{ fontWeight: '500' }}>{c.name}</span>
                      <span style={{ color: '#0f172a', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>
                        {c.count}
                      </span>
                    </div>
                    <div style={{
                      height: '5px', backgroundColor: '#f1f5f9',
                      borderRadius: '3px', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(c.count / maxCategoryCount) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)',
                        borderRadius: '3px',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="SLA Health" icon={<Activity size={13} />}>
            <SlaSummary issues={enriched} />
          </Panel>

          <Panel title="Top Contributors" icon={<User size={13} />}>
            <ContributorsList issues={enriched} />
          </Panel>

          <Panel title="Recent Activity" icon={<Clock size={13} />}>
            <RecentActivity issues={enriched} />
          </Panel>
        </div>
      </div>

      {/* ─── Detail drawer ─── */}
      {selected && (
        <DetailDrawer
          issue={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───

function KpiCard({
  icon, label, value, tone, hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'neutral' | 'warn' | 'info' | 'good' | 'danger';
  hint?: string;
}) {
  const themes = {
    neutral: { bg: '#f1f5f9', fg: '#475569' },
    warn:    { bg: '#fef3c7', fg: '#92400e' },
    info:    { bg: '#dbeafe', fg: '#1e40af' },
    good:    { bg: '#dcfce7', fg: '#166534' },
    danger:  { bg: '#fee2e2', fg: '#991b1b' },
  }[tone];

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          width: '28px', height: '28px', borderRadius: '8px',
          backgroundColor: themes.bg, color: themes.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </span>
        <span style={{
          fontSize: '10.5px', letterSpacing: '0.1em',
          textTransform: 'uppercase', fontWeight: '600',
          color: '#94a3b8',
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: '26px', fontWeight: '700',
        color: '#0f172a', lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value.toLocaleString('en-ZA')}
      </div>
      {hint && (
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{hint}</div>
      )}
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '14px 16px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '11px', letterSpacing: '0.12em',
        textTransform: 'uppercase', fontWeight: '700',
        color: '#94a3b8', marginBottom: '12px',
      }}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function IssueRow({
  issue, selected, onClick,
}: {
  issue: any; // enriched
  selected: boolean;
  onClick: () => void;
}) {
  const sm = STATUS_META[issue._status as StatusKey];
  const sev = SEVERITY_META[issue._severity as Severity];
  const sla = issue._sla;

  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        width: '100%',
        backgroundColor: '#ffffff',
        border: `1px solid ${selected ? '#2563eb' : '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        font: 'inherit',
        boxShadow: selected ? '0 4px 14px -6px rgba(37,99,235,0.35)' : 'none',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: '14px',
        alignItems: 'flex-start',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.boxShadow = '0 2px 8px -4px rgba(15,23,42,0.06)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Left: severity + category icon */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        backgroundColor: sev.bg, color: sev.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {CATEGORY_ICON(issue.category)}
      </div>

      {/* Middle: content */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          marginBottom: '4px',
        }}>
          <span style={{
            fontSize: '14px', fontWeight: '600', color: '#0f172a',
            lineHeight: 1.3,
          }}>
            {issue.title}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: '700',
            padding: '2px 7px', borderRadius: '5px',
            backgroundColor: sev.bg, color: sev.text,
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {sev.icon}
            {sev.label}
          </span>
        </div>

        <div style={{
          fontSize: '12.5px', color: '#64748b',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.4,
          marginBottom: '8px',
        }}>
          {issue.description}
        </div>

        <div style={{
          display: 'flex', gap: '14px', flexWrap: 'wrap',
          fontSize: '11.5px', color: '#94a3b8', alignItems: 'center',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={11} /> {issue.username || 'Anonymous'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={11} /> {issue.location || 'Unspecified'}
          </span>
          {issue._project && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={11} /> {issue._project.title}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} /> {timeAgo(issue.createdAt)}
          </span>
        </div>

        {/* SLA bar */}
        <div style={{ marginTop: '10px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '10.5px', color: '#94a3b8', marginBottom: '4px',
          }}>
            <span>SLA · target {sla.target}h</span>
            <span style={{
              color: sla.state === 'late' ? '#dc2626' : sla.state === 'warn' ? '#d97706' : '#059669',
              fontWeight: '600',
            }}>
              {sla.state === 'late' ? `Overdue by ${Math.round(sla.ageHours - sla.target)}h`
               : `Response due in ${Math.round(sla.remaining)}h`}
            </span>
          </div>
          <div style={{
            height: '4px', backgroundColor: '#f1f5f9',
            borderRadius: '2px', overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(sla.pct, 100)}%`,
              height: '100%',
              backgroundColor: sla.state === 'late' ? '#dc2626' : sla.state === 'warn' ? '#f59e0b' : '#10b981',
              borderRadius: '2px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Right: status pill + chevron */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        <span style={{
          fontSize: '10.5px', fontWeight: '700',
          padding: '4px 9px', borderRadius: '999px',
          backgroundColor: sm.bg, color: sm.text,
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          whiteSpace: 'nowrap',
        }}>
          {sm.icon}
          {sm.label}
        </span>
        <ChevronRight size={14} color="#cbd5e1" />
      </div>
    </button>
  );
}

function DetailDrawer({ issue, onClose }: { issue: any; onClose: () => void }) {
  const sm = STATUS_META[issue._status as StatusKey];
  const sev = SEVERITY_META[issue._severity as Severity];
  const sla = issue._sla;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 900,
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '520px', maxWidth: '94vw',
          height: '100%', backgroundColor: '#ffffff',
          boxShadow: '-30px 0 60px -30px rgba(15,23,42,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '22px 26px 18px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(180deg, #fafbfc 0%, #ffffff 100%)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: '10px',
          }}>
            <div style={{
              fontSize: '10.5px', letterSpacing: '0.14em',
              textTransform: 'uppercase', fontWeight: '700',
              color: '#94a3b8',
            }}>
              Issue #{issue.id}
            </div>
            <button
              onClick={onClose}
              style={{
                width: '30px', height: '30px',
                borderRadius: '8px', border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b',
              }}
            >
              <X size={14} />
            </button>
          </div>

          <h2 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '18px', fontWeight: '700',
            color: '#0f172a', margin: '0 0 12px 0', lineHeight: 1.3,
          }}>
            {issue.title}
          </h2>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={pillStyle(sm.bg, sm.text)}>
              {sm.icon} {sm.label}
            </span>
            <span style={pillStyle(sev.bg, sev.text)}>
              {sev.icon} {sev.label}
            </span>
            {issue.category && (
              <span style={pillStyle('#eff6ff', '#1e40af')}>
                {issue.category}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px' }}>

          {/* SLA bar in drawer */}
          <SectionBlock label="SLA Status">
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '12px', color: '#475569', marginBottom: '6px',
            }}>
              <span>Response target: {sla.target}h</span>
              <span style={{
                color: sla.state === 'late' ? '#dc2626' : sla.state === 'warn' ? '#d97706' : '#059669',
                fontWeight: '600',
              }}>
                {sla.state === 'late' ? 'Overdue'
                 : sla.state === 'warn' ? 'Approaching SLA'
                 : 'On track'}
              </span>
            </div>
            <div style={{
              height: '6px', backgroundColor: '#f1f5f9',
              borderRadius: '3px', overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(sla.pct, 100)}%`,
                height: '100%',
                backgroundColor: sla.state === 'late' ? '#dc2626' : sla.state === 'warn' ? '#f59e0b' : '#10b981',
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{
              fontSize: '11px', color: '#94a3b8', marginTop: '6px',
            }}>
              Age: {Math.round(sla.ageHours)}h · Reported {formatDate(issue.createdAt)} at {formatTime(issue.createdAt)}
            </div>
          </SectionBlock>

          <SectionBlock label="Description">
            <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
              {issue.description || 'No description provided.'}
            </p>
          </SectionBlock>

          <SectionBlock label="Location">
            <div style={fieldRowStyle}>
              <MapPin size={14} color="#64748b" />
              <span style={{ fontSize: '13px', color: '#334155' }}>
                {issue.location || 'Not specified'}
              </span>
            </div>
          </SectionBlock>

          <SectionBlock label="Reported by">
            <div style={fieldRowStyle}>
              <div style={avatarStyle}>{initials(issue.username)}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                  {issue.username || 'Anonymous'}
                </div>
                {issue.userEmail && (
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    {issue.userEmail}
                  </div>
                )}
              </div>
            </div>
          </SectionBlock>

          {issue._project && (
            <SectionBlock label="Related Project">
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '12px',
                backgroundColor: '#fafbfc',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  backgroundColor: '#eff6ff', color: '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: '600', color: '#0f172a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {issue._project.title}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    {issue._project.department || 'Unassigned'} · {issue._project.status || 'Unknown'}
                  </div>
                </div>
                <ArrowUpRight size={14} color="#94a3b8" />
              </div>
            </SectionBlock>
          )}

          {issue.imageUrl && (
            <SectionBlock label="Evidence">
              <a
                href={issue.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', position: 'relative' }}
              >
                <img
                  src={issue.imageUrl}
                  alt="Evidence"
                  style={{
                    width: '100%', maxHeight: '320px', objectFit: 'cover',
                    borderRadius: '10px', border: '1px solid #e2e8f0',
                    cursor: 'zoom-in',
                  }}
                />
                <div style={{
                  position: 'absolute', bottom: '10px', right: '10px',
                  backgroundColor: 'rgba(15,23,42,0.75)',
                  color: '#ffffff', padding: '4px 8px', borderRadius: '6px',
                  fontSize: '10.5px', fontWeight: '500',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  backdropFilter: 'blur(4px)',
                }}>
                  <ExternalLink size={11} /> Open full size
                </div>
              </a>
            </SectionBlock>
          )}

          {/* Timeline placeholder */}
          <SectionBlock label="Timeline">
            <div style={{
              borderLeft: '2px solid #e2e8f0',
              paddingLeft: '14px',
              display: 'flex', flexDirection: 'column', gap: '14px',
            }}>
              <TimelineItem
                dot="#3b82f6"
                title="Issue reported"
                subtitle={`by ${issue.username || 'Anonymous'} · ${timeAgo(issue.createdAt)}`}
              />
              {issue._status !== 'Reported' && (
                <TimelineItem
                  dot="#f59e0b"
                  title="Marked in progress"
                  subtitle="Assigned to project manager"
                />
              )}
              {issue._status === 'Resolved' && (
                <TimelineItem
                  dot="#10b981"
                  title="Marked resolved"
                  subtitle="Closed successfully"
                />
              )}
            </div>
          </SectionBlock>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '14px 26px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex', gap: '8px',
          backgroundColor: '#fafbfc',
        }}>
          {(['Reported', 'In Progress', 'Resolved'] as StatusKey[]).map((s) => {
            const meta = STATUS_META[s];
            const isActive = issue._status === s;
            return (
              <button
                key={s}
                onClick={() => {
                  // Wire to a PATCH /api/issues/{id}/status endpoint when ready
                  alert(`Would set issue #${issue.id} → ${s}`);
                }}
                style={{
                  flex: 1,
                  padding: '9px 10px',
                  fontSize: '12px', fontWeight: '600',
                  borderRadius: '8px',
                  border: `1px solid ${isActive ? meta.dot : '#e2e8f0'}`,
                  backgroundColor: isActive ? meta.bg : '#ffffff',
                  color: isActive ? meta.text : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ dot, title, subtitle }: { dot: string; title: string; subtitle?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', left: '-21px', top: '3px',
        width: '10px', height: '10px', borderRadius: '50%',
        backgroundColor: dot,
        boxShadow: `0 0 0 3px #ffffff, 0 0 0 4px ${dot}33`,
      }} />
      <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#0f172a' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function SlaSummary({ issues }: { issues: any[] }) {
  const active = issues.filter((i) => i._status !== 'Resolved');
  const onTrack = active.filter((i) => i._sla.state === 'ok').length;
  const warn = active.filter((i) => i._sla.state === 'warn').length;
  const late = active.filter((i) => i._sla.state === 'late').length;
  const total = Math.max(active.length, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SlaRow label="On track" count={onTrack} total={total} color="#10b981" />
      <SlaRow label="Approaching" count={warn} total={total} color="#f59e0b" />
      <SlaRow label="Overdue" count={late} total={total} color="#dc2626" />
      <div style={{
        fontSize: '11px', color: '#94a3b8',
        marginTop: '4px', paddingTop: '10px',
        borderTop: '1px solid #f1f5f9',
      }}>
        Based on {active.length} open issue{active.length !== 1 ? 's' : ''}.
      </div>
    </div>
  );
}

function SlaRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = (count / total) * 100;
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '12px', color: '#475569', marginBottom: '4px',
      }}>
        <span>{label}</span>
        <span style={{ fontWeight: '700', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
          {count}
        </span>
      </div>
      <div style={{ height: '5px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '3px' }} />
      </div>
    </div>
  );
}

function ContributorsList({ issues }: { issues: any[] }) {
  const map = new Map<string, number>();
  issues.forEach((i) => {
    const k = i.username || 'Anonymous';
    map.set(k, (map.get(k) || 0) + 1);
  });
  const top = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (top.length === 0) return <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>No contributors yet.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {top.map(([name, count]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={avatarStyle}>{initials(name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12.5px', fontWeight: '600', color: '#0f172a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {name}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {count} report{count !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentActivity({ issues }: { issues: any[] }) {
  const recent = [...issues]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5);

  if (recent.length === 0) return <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>No activity yet.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {recent.map((i) => (
        <div key={i.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: STATUS_META[i._status as StatusKey].dot,
            marginTop: '6px', flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px', color: '#334155', fontWeight: '500',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              lineHeight: 1.4,
            }}>
              {i.title}
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
              {timeAgo(i.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 20px',
      backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
      borderRadius: '12px',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        backgroundColor: '#eff6ff', color: '#2563eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <AlertCircle size={26} />
      </div>
      <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '16px' }}>
        No issues match your filters
      </h3>
      <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>
        Try clearing the search or changing filters.
      </p>
      <button
        onClick={onReset}
        style={{
          backgroundColor: '#2563eb', color: '#ffffff',
          border: 'none', borderRadius: '8px',
          padding: '9px 18px', fontSize: '13px', fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Reset filters
      </button>
    </div>
  );
}

function SectionBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '22px' }}>
      <div style={{
        fontSize: '10.5px', letterSpacing: '0.14em',
        textTransform: 'uppercase', fontWeight: '700',
        color: '#94a3b8', marginBottom: '10px',
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── Small styles ───
const inputReset: React.CSSProperties = {
  border: 'none', background: 'transparent', outline: 'none',
  fontSize: '13px', width: '100%', color: '#0f172a', fontFamily: 'inherit',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  fontSize: '12.5px',
  color: '#0f172a',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'inherit',
};

const fieldRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
};

const avatarStyle: React.CSSProperties = {
  width: '32px', height: '32px', borderRadius: '50%',
  backgroundColor: '#e0e7ff', color: '#4338ca',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '11px', fontWeight: '700', flexShrink: 0,
  letterSpacing: '0.02em',
};

function pillStyle(bg: string, text: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '4px 10px', borderRadius: '999px',
    fontSize: '10.5px', fontWeight: '700',
    letterSpacing: '0.04em', textTransform: 'uppercase',
    backgroundColor: bg, color: text,
  };
}