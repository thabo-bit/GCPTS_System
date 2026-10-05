// src/Components/CommunityModule.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, User, MapPin, AlertCircle, CheckCircle2, MessageSquare, TrendingUp,
  TrendingDown, Flame, Search, Filter, Building2, Clock, Award,
  ThumbsUp, Hash, Activity, Zap, Droplets, Construction, Trash2, Shield,
  Flag, ExternalLink, ArrowUpRight, BarChart3, PieChart,
  Wallet,
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
  overallProgress?: number;
  budgetAllocated?: number;
  budgetUsed?: number;
}

type StatusKey = 'Reported' | 'In Progress' | 'Resolved';

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

// ─── Category icon ───
const CATEGORY_ICON = (c: string) => {
  const t = (c || '').toLowerCase();
  if (t.includes('road')) return <Construction size={13} />;
  if (t.includes('water')) return <Droplets size={13} />;
  if (t.includes('electric') || t.includes('power')) return <Zap size={13} />;
  if (t.includes('waste') || t.includes('sanit')) return <Trash2 size={13} />;
  if (t.includes('safety')) return <Shield size={13} />;
  return <Flag size={13} />;
};

// ─── Derive status ───
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

// ─── Formatters ───
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

const formatZAR = (n: number) => {
  if (!n) return 'R 0';
  if (n >= 1_000_000_000) return `R ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `R ${(n / 1_000).toFixed(1)}K`;
  return `R ${n.toLocaleString('en-ZA')}`;
};

// ─── Simple string similarity for "trending topics" ───
const STOP_WORDS = new Set([
  'the','a','and','or','to','of','in','is','it','for','on','at','be','this',
  'that','was','are','as','with','by','from','has','have','had','will','would',
  'can','could','should','but','not','no','yes','my','our','your','their','its',
]);

function topKeywords(text: string, count = 20): string[] {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const freq = new Map<string, number>();
  words.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w);
}

// ─── Component ───
export default function CommunityModule() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'contributors' | 'wards' | 'announcements'>('overview');

  // ─── Load ───
  const load = async () => {
    try {
      const [i, p] = await Promise.all([authFetch('/api/issues'), authFetch('/api/projects')]);
      const issuesData: Issue[] = i.ok ? await i.json() : [];
      const projData: Project[] = p.ok ? await p.json() : [];
      setIssues(issuesData);
      setProjects(projData);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, []);

  // ─── Enriched issues ───
  const enriched = useMemo(() => issues.map((i) => ({
    ...i,
    _status: deriveStatus(i),
    _project: projects.find((p) => p.id === i.projectId),
  })), [issues, projects]);

  // ─── Aggregates ───
  const counts = useMemo(() => {
    const total = enriched.length;
    const resolved = enriched.filter((i) => i._status === 'Resolved').length;
    const inProgress = enriched.filter((i) => i._status === 'In Progress').length;
    const reported = enriched.filter((i) => i._status === 'Reported').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const last30 = enriched.filter((i) => {
      if (!i.createdAt) return false;
      return Date.now() - new Date(i.createdAt).getTime() < 30 * 86_400_000;
    }).length;
    return { total, resolved, inProgress, reported, resolutionRate, last30 };
  }, [enriched]);

  // ─── Categories ───
  const categories = useMemo(() => {
    const s = new Set<string>();
    enriched.forEach((i) => i.category && s.add(i.category));
    return Array.from(s).sort();
  }, [enriched]);

  // ─── Wards (locations used as proxy) ───
  const wards = useMemo(() => {
    const s = new Set<string>();
    enriched.forEach((i) => i.location && s.add(i.location));
    return Array.from(s).sort();
  }, [enriched]);

  // ─── Top contributors (grouped by username) ───
  const contributors = useMemo(() => {
    const map = new Map<string, { name: string; count: number; resolved: number; last: string }>();
    enriched.forEach((i) => {
      const key = (i.username || 'Anonymous').trim() || 'Anonymous';
      const cur = map.get(key) || { name: key, count: 0, resolved: 0, last: '' };
      cur.count += 1;
      if (i._status === 'Resolved') cur.resolved += 1;
      if (!cur.last || (i.createdAt && i.createdAt > cur.last)) cur.last = i.createdAt || '';
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [enriched]);

  // ─── Category breakdown (for the bar chart) ───
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; resolved: number }>();
    enriched.forEach((i) => {
      const k = i.category || 'Uncategorised';
      const cur = map.get(k) || { count: 0, resolved: 0 };
      cur.count += 1;
      if (i._status === 'Resolved') cur.resolved += 1;
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [enriched]);

  const maxCatCount = Math.max(1, ...categoryBreakdown.map((c) => c.count));

  // ─── Trending keywords (across all titles + descriptions) ───
  const trending = useMemo(() => {
    const corpus = enriched.map((i) => `${i.title} ${i.description || ''}`).join(' ');
    return topKeywords(corpus, 15);
  }, [enriched]);

  // ─── Ward heatmap (location → count + resolution rate) ───
  const wardStats = useMemo(() => {
    const map = new Map<string, { name: string; total: number; resolved: number; inProgress: number }>();
    enriched.forEach((i) => {
      const k = i.location || 'Unspecified';
      const cur = map.get(k) || { name: k, total: 0, resolved: 0, inProgress: 0 };
      cur.total += 1;
      if (i._status === 'Resolved') cur.resolved += 1;
      if (i._status === 'In Progress') cur.inProgress += 1;
      map.set(k, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [enriched]);

  const maxWardCount = Math.max(1, ...wardStats.map((w) => w.total));

  // ─── Top-level filtered list (search + category + ward) ───
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((i) => {
      const mCat = categoryFilter === 'all' || i.category === categoryFilter;
      const mWard = wardFilter === 'all' || i.location === wardFilter;
      const mQ = !q ||
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.username?.toLowerCase().includes(q);
      return mCat && mWard && mQ;
    });
  }, [enriched, search, categoryFilter, wardFilter]);

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
            Community Engagement
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Citizen sentiment, ward-level insights, and top contributors across the platform.
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

      {/* KPI strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '10px', marginBottom: '18px',
      }}>
        <KpiTile icon={<MessageSquare size={15} />} label="Total Reports" value={counts.total} tone="info" hint={`${counts.last30} in last 30 days`} />
        <KpiTile icon={<CheckCircle2 size={15} />} label="Resolution Rate" value={counts.resolutionRate} tone="good" suffix="%" hint={`${counts.resolved} resolved`} />
        <KpiTile icon={<Clock size={15} />} label="Active Reports" value={counts.reported + counts.inProgress} tone="warn" hint={`${counts.reported} awaiting triage`} />
        <KpiTile icon={<Users size={15} />} label="Contributors" value={contributors.length} tone="neutral" hint="Unique reporters" />
        <KpiTile icon={<MapPin size={15} />} label="Wards Covered" value={wards.length} tone="neutral" hint="Locations with reports" />
        <KpiTile icon={<Building2 size={15} />} label="Linked Projects" value={projects.length} tone="info" hint="Projects cited in reports" />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0',
        marginBottom: '18px', overflowX: 'auto',
      }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'contributors', label: 'Contributors' },
          { id: 'wards', label: 'Ward Insights' },
          { id: 'announcements', label: 'Projects & Updates' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#2563eb' : '#64748b',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          Loading community data…
        </div>
      ) : error ? (
        <div style={{
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#991b1b', padding: '16px', borderRadius: '12px', fontSize: '13px',
        }}>
          Error: {error}
        </div>
      ) : (
        <>
          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === 'overview' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
              gap: '16px',
            }}>
              {/* LEFT: recent activity + category breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Filter bar */}
                <div style={{
                  display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
                  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '12px', padding: '12px 14px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: '8px', padding: '8px 12px',
                    flex: '1 1 200px',
                  }}>
                    <Search size={14} color="#94a3b8" />
                    <input
                      placeholder="Search reports…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={inputReset}
                    />
                  </div>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
                    <option value="all">All categories</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} style={selectSelectStyle}>
                    <option value="all">All locations</option>
                    {wards.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>

                {/* Recent reports list */}
                <div style={{
                  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '12px', overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                      Recent Reports
                    </h3>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                      {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                    {filtered.length === 0 ? (
                      <div style={{
                        padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px',
                      }}>
                        No reports match your filters.
                      </div>
                    ) : (
                      filtered.slice(0, 20).map((issue) => (
                        <ReportRow key={issue.id} issue={issue} />
                      ))
                    )}
                  </div>
                </div>

                {/* Category breakdown */}
                <div style={{
                  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '12px', padding: '16px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '11px', letterSpacing: '0.12em',
                    textTransform: 'uppercase', fontWeight: '700',
                    color: '#94a3b8', marginBottom: '14px',
                  }}>
                    <BarChart3 size={13} /> Reports by Category
                  </div>
                  {categoryBreakdown.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>No data yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {categoryBreakdown.map((c) => {
                        const pct = (c.count / maxCatCount) * 100;
                        const resolvedPct = c.count > 0 ? (c.resolved / c.count) * 100 : 0;
                        return (
                          <div key={c.name}>
                            <div style={{
                              display: 'flex', justifyContent: 'space-between',
                              fontSize: '12px', color: '#475569', marginBottom: '5px',
                            }}>
                              <span style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontWeight: '500',
                              }}>
                                {CATEGORY_ICON(c.name)}
                                {c.name}
                              </span>
                              <span style={{ color: '#0f172a', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>
                                {c.count}
                              </span>
                            </div>
                            <div style={{
                              height: '6px', backgroundColor: '#f1f5f9',
                              borderRadius: '3px', overflow: 'hidden', position: 'relative',
                            }}>
                              <div style={{
                                width: `${pct}%`, height: '100%',
                                background: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)',
                                borderRadius: '3px',
                              }} />
                              <div style={{
                                position: 'absolute', top: 0, left: 0,
                                width: `${(pct * resolvedPct) / 100}%`, height: '100%',
                                background: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
                                borderRadius: '3px',
                                opacity: 0.85,
                              }} />
                            </div>
                            <div style={{
                              fontSize: '10.5px', color: '#94a3b8',
                              marginTop: '4px',
                            }}>
                              {c.resolved} of {c.count} resolved
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: trending + top contributors quick view */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Trending topics */}
                <Panel title="Trending Topics" icon={<Flame size={13} />}>
                  {trending.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>No data yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {trending.map((word, idx) => (
                        <span
                          key={word}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '999px',
                            fontSize: idx < 3 ? '12.5px' : '11.5px',
                            fontWeight: idx < 3 ? '700' : '600',
                            backgroundColor: idx < 3 ? '#fee2e2' : '#eff6ff',
                            color: idx < 3 ? '#991b1b' : '#1e40af',
                            letterSpacing: '0.01em',
                          }}
                        >
                          <Hash size={10} />
                          {word}
                        </span>
                      ))}
                    </div>
                  )}
                </Panel>

                {/* Top 5 contributors quick list */}
                <Panel title="Top Contributors" icon={<Award size={13} />}>
                  {contributors.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>No contributors yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {contributors.slice(0, 5).map((c, idx) => (
                        <div key={c.name} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                          <div style={{
                            ...avatarStyle,
                            backgroundColor: idx === 0 ? '#fef3c7' : '#e0e7ff',
                            color: idx === 0 ? '#92400e' : '#4338ca',
                          }}>
                            {initials(c.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '12.5px', fontWeight: '600',
                              color: '#0f172a', overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {c.name}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                              {c.count} report{c.count !== 1 ? 's' : ''} · {c.resolved} resolved
                            </div>
                          </div>
                          {idx === 0 && (
                            <span style={{
                              fontSize: '10px', fontWeight: '700',
                              padding: '2px 7px', borderRadius: '5px',
                              backgroundColor: '#fef3c7', color: '#92400e',
                              letterSpacing: '0.04em',
                            }}>
                              TOP
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                {/* Engagement score */}
                <Panel title="Engagement Score" icon={<Activity size={13} />}>
                  <EngagementScore
                    totalReports={counts.total}
                    contributors={contributors.length}
                    resolved={counts.resolved}
                    wards={wards.length}
                  />
                </Panel>
              </div>
            </div>
          )}

          {/* ─── CONTRIBUTORS TAB ─── */}
          {activeTab === 'contributors' && (
            <div style={{
              backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
              }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  All Contributors ({contributors.length})
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Citizens who have submitted reports, ranked by participation.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 100px 100px 120px 120px',
                gap: '10px', alignItems: 'center',
                padding: '10px 16px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '10.5px', letterSpacing: '0.1em',
                textTransform: 'uppercase', fontWeight: '700', color: '#94a3b8',
              }}>
                <span>#</span>
                <span>Contributor</span>
                <span>Reports</span>
                <span>Resolved</span>
                <span>Rate</span>
                <span>Last Active</span>
              </div>

              {contributors.map((c, idx) => {
                const rate = c.count > 0 ? Math.round((c.resolved / c.count) * 100) : 0;
                return (
                  <div
                    key={c.name}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr 100px 100px 120px 120px',
                      gap: '10px', alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{
                      fontSize: '12px', fontWeight: '700',
                      color: idx < 3 ? '#92400e' : '#94a3b8',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {idx + 1}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={avatarStyle}>{initials(c.name)}</div>
                      <span style={{
                        fontSize: '13px', fontWeight: '600', color: '#0f172a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {c.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                      {c.count}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                      {c.resolved}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        flex: 1, height: '5px', backgroundColor: '#f1f5f9',
                        borderRadius: '3px', overflow: 'hidden', maxWidth: '60px',
                      }}>
                        <div style={{
                          width: `${rate}%`, height: '100%',
                          backgroundColor: '#10b981',
                          borderRadius: '3px',
                        }} />
                      </div>
                      <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#64748b' }}>
                        {rate}%
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                      {timeAgo(c.last)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── WARDS TAB ─── */}
          {activeTab === 'wards' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
              {wardStats.length === 0 ? (
                <div style={{
                  padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px',
                  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '12px', gridColumn: '1 / -1',
                }}>
                  No ward data yet.
                </div>
              ) : (
                wardStats.map((w) => {
                  const pct = (w.total / maxWardCount) * 100;
                  const resolvedPct = w.total > 0 ? (w.resolved / w.total) * 100 : 0;
                  const heat = w.total > maxWardCount * 0.7 ? 'hot'
                    : w.total > maxWardCount * 0.4 ? 'warm'
                    : 'cool';
                  const heatColors = {
                    hot:  { bg: '#fef2f2', fg: '#991b1b', bar: '#ef4444' },
                    warm: { bg: '#fef3c7', fg: '#92400e', bar: '#f59e0b' },
                    cool: { bg: '#eff6ff', fg: '#1e40af', bar: '#3b82f6' },
                  }[heat];

                  return (
                    <div key={w.name} style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: '12px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            backgroundColor: heatColors.bg, color: heatColors.fg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <MapPin size={14} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px', fontWeight: '700', color: '#0f172a',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {w.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {w.total} report{w.total !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '10px', fontWeight: '700',
                          padding: '3px 7px', borderRadius: '5px',
                          backgroundColor: heatColors.bg, color: heatColors.fg,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          {heat}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{
                        height: '6px', backgroundColor: '#f1f5f9',
                        borderRadius: '3px', overflow: 'hidden', marginBottom: '10px',
                        position: 'relative',
                      }}>
                        <div style={{
                          width: `${pct}%`, height: '100%',
                          backgroundColor: heatColors.bar,
                          borderRadius: '3px',
                        }} />
                        <div style={{
                          position: 'absolute', top: 0, left: 0,
                          width: `${(pct * resolvedPct) / 100}%`, height: '100%',
                          backgroundColor: '#10b981',
                          borderRadius: '3px',
                        }} />
                      </div>

                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '8px', fontSize: '11.5px',
                      }}>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '700' }}>
                            Resolved
                          </div>
                          <div style={{ color: '#059669', fontWeight: '700', marginTop: '2px' }}>
                            {w.resolved}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '700' }}>
                            Active
                          </div>
                          <div style={{ color: '#2563eb', fontWeight: '700', marginTop: '2px' }}>
                            {w.inProgress}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '700' }}>
                            Pending
                          </div>
                          <div style={{ color: '#d97706', fontWeight: '700', marginTop: '2px' }}>
                            {w.total - w.resolved - w.inProgress}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ─── ANNOUNCEMENTS / PROJECTS TAB ─── */}
          {activeTab === 'announcements' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
              {projects.length === 0 ? (
                <div style={{
                  padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px',
                  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: '12px', gridColumn: '1 / -1',
                }}>
                  No active projects yet.
                </div>
              ) : (
                projects.slice(0, 12).map((p) => {
                  const projectIssues = enriched.filter((i) => i.projectId === p.id);
                  const issueCount = projectIssues.length;
                  const resolvedCount = projectIssues.filter((i) => i._status === 'Resolved').length;
                  const progress = p.overallProgress ?? 0;
                  const budgetPct = p.budgetAllocated && p.budgetAllocated > 0
                    ? Math.round(((p.budgetUsed || 0) / p.budgetAllocated) * 100)
                    : 0;

                  return (
                    <div key={p.id} style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex', flexDirection: 'column', gap: '12px',
                    }}>
                      <div>
                        <div style={{
                          fontSize: '13.5px', fontWeight: '700', color: '#0f172a',
                          lineHeight: 1.35, marginBottom: '4px',
                        }}>
                          {p.title}
                        </div>
                        <div style={{
                          fontSize: '11.5px', color: '#94a3b8',
                          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                        }}>
                          {p.department && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Building2 size={10} /> {p.department}
                            </span>
                          )}
                          {p.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={10} /> {p.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: '11px', color: '#64748b', marginBottom: '4px',
                        }}>
                          <span>Progress</span>
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>{progress}%</span>
                        </div>
                        <div style={{
                          height: '5px', backgroundColor: '#f1f5f9',
                          borderRadius: '3px', overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${progress}%`, height: '100%',
                            background: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)',
                            borderRadius: '3px',
                          }} />
                        </div>
                      </div>

                      <div style={{
                        display: 'flex', gap: '12px', flexWrap: 'wrap',
                        paddingTop: '10px', borderTop: '1px solid #f1f5f9',
                        fontSize: '11.5px', color: '#64748b',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MessageSquare size={11} /> {issueCount} report{issueCount !== 1 ? 's' : ''}
                        </span>
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          color: resolvedCount > 0 ? '#059669' : '#94a3b8',
                        }}>
                          <CheckCircle2 size={11} /> {resolvedCount} resolved
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                          <Wallet size={11} /> {budgetPct}% used
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───
function KpiTile({
  icon, label, value, tone, hint, suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'neutral' | 'warn' | 'info' | 'good' | 'danger';
  hint?: string;
  suffix?: string;
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
          width: '26px', height: '26px', borderRadius: '7px',
          backgroundColor: themes.bg, color: themes.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </span>
        <span style={{
          fontSize: '10px', letterSpacing: '0.1em',
          textTransform: 'uppercase', fontWeight: '700',
          color: '#94a3b8',
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: '22px', fontWeight: '700',
        color: '#0f172a', lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value.toLocaleString('en-ZA')}{suffix || ''}
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
      padding: '16px',
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

function ReportRow({ issue }: { issue: any }) {
  const sm = {
    Reported:      { bg: '#fef3c7', text: '#92400e', icon: <AlertCircle size={10} /> },
    'In Progress': { bg: '#dbeafe', text: '#1e40af', icon: <Clock size={10} /> },
    Resolved:      { bg: '#dcfce7', text: '#166534', icon: <CheckCircle2 size={10} /> },
  }[issue._status as 'Reported' | 'In Progress' | 'Resolved'];

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid #f1f5f9',
      display: 'grid',
      gridTemplateColumns: '32px 1fr auto',
      gap: '12px',
      alignItems: 'start',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        backgroundColor: '#eff6ff', color: '#2563eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {CATEGORY_ICON(issue.category)}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: '600', color: '#0f172a',
          marginBottom: '3px', lineHeight: 1.35,
        }}>
          {issue.title}
        </div>
        <div style={{
          fontSize: '11.5px', color: '#94a3b8',
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <User size={10} /> {issue.username || 'Anonymous'}
          </span>
          {issue.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={10} /> {issue.location}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={10} /> {timeAgo(issue.createdAt)}
          </span>
        </div>
      </div>

      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '10px', fontWeight: '700',
        padding: '3px 8px', borderRadius: '6px',
        backgroundColor: sm.bg, color: sm.text,
        textTransform: 'uppercase', letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}>
        {sm.icon}
        {issue._status}
      </span>
    </div>
  );
}

function EngagementScore({
  totalReports, contributors, resolved, wards,
}: {
  totalReports: number;
  contributors: number;
  resolved: number;
  wards: number;
}) {
  // Simple heuristic score out of 100
  const score = Math.min(100, Math.round(
    Math.min(totalReports * 2, 40) +
    Math.min(contributors * 4, 25) +
    Math.min((resolved / Math.max(totalReports, 1)) * 20, 20) +
    Math.min(wards * 3, 15)
  ));

  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Growing' : 'Starting';
  const tone = score >= 75 ? { bg: '#dcfce7', fg: '#166534' }
    : score >= 50 ? { bg: '#dbeafe', fg: '#1e40af' }
    : score >= 25 ? { bg: '#fef3c7', fg: '#92400e' }
    : { bg: '#f1f5f9', fg: '#475569' };

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px',
      }}>
        <span style={{
          fontFamily: "'Sora', sans-serif", fontSize: '36px',
          fontWeight: '700', color: '#0f172a', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {score}
        </span>
        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
          / 100
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '10.5px', fontWeight: '700',
          padding: '3px 9px', borderRadius: '999px',
          backgroundColor: tone.bg, color: tone.fg,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          {label}
        </span>
      </div>

      <div style={{
        height: '8px', backgroundColor: '#f1f5f9',
        borderRadius: '4px', overflow: 'hidden', marginBottom: '12px',
      }}>
        <div style={{
          width: `${score}%`, height: '100%',
          background: 'linear-gradient(90deg, #34d399 0%, #2563eb 100%)',
          borderRadius: '4px',
          transition: 'width 0.5s ease',
        }} />
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px', fontSize: '11px', color: '#94a3b8',
      }}>
        <div>
          <div style={{ fontWeight: '700', color: '#475569' }}>Reports</div>
          <div style={{ marginTop: '2px', color: '#0f172a', fontWeight: '600', fontSize: '12.5px' }}>
            {totalReports}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: '700', color: '#475569' }}>Contributors</div>
          <div style={{ marginTop: '2px', color: '#0f172a', fontWeight: '600', fontSize: '12.5px' }}>
            {contributors}
          </div>
        </div>
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

const selectSelectStyle: React.CSSProperties = selectStyle;

const avatarStyle: React.CSSProperties = {
  width: '32px', height: '32px', borderRadius: '50%',
  backgroundColor: '#e0e7ff', color: '#4338ca',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '11px', fontWeight: '700', flexShrink: 0,
  letterSpacing: '0.02em',
};