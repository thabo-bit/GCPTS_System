// components/ProjectsList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Search, PlusCircle, Edit, Trash2, MapPin, Building2,
  User, Calendar, X, CheckCircle2, AlertCircle,
  FolderKanban, Eye, RefreshCw
} from 'lucide-react';

const API_URL = 'http://localhost:8080';

export interface Project {
  id: number;
  title: string;
  category: string;
  department: string;
  location: string;
  description: string;
  goals: string;
  objectives: string;
  projectManager: string;
  contractor: string;
  gpsCoordinates: string;
  startDate: string;
  expectedCompletion: string;
  overallProgress: number;
  status: string;
  budgetAllocated: number;
  budgetUsed: number;
  fundingSources: { id: number; name: string; amount: number }[];
  milestones: { id: number; name: string; date: string; status: string }[];
  blueprintFileNames?: string[];
  additionalDocumentNames?: string[];
}

interface ProjectsListProps {
  onCreateNew: () => void;
  onEditProject: (project: Project) => void;
}

export default function ProjectsList({ onCreateNew, onEditProject }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState<string | null>(null);

  // ─── Fetch projects from backend ───
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

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Filtering ───
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return projects.filter((p) => {
      const matchSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.department?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.projectManager?.toLowerCase().includes(q) ||
        p.contractor?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const statuses = ['All', 'Planning', 'On Track', 'At Risk', 'Delayed'];
  const counts: Record<string, number> = {
    All: projects.length,
    Planning: projects.filter((p) => p.status === 'Planning').length,
    'On Track': projects.filter((p) => p.status === 'On Track').length,
    'At Risk': projects.filter((p) => p.status === 'At Risk').length,
    Delayed: projects.filter((p) => p.status === 'Delayed').length,
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'On Track': return { bg: '#ecfdf5', text: '#047857', ring: '#a7f3d0' };
      case 'Planning': return { bg: '#eff6ff', text: '#1d4ed8', ring: '#bfdbfe' };
      case 'At Risk': return { bg: '#fffbeb', text: '#b45309', ring: '#fde68a' };
      case 'Delayed': return { bg: '#fef2f2', text: '#b91c1c', ring: '#fecaca' };
      default: return { bg: '#f1f5f9', text: '#475569', ring: '#e2e8f0' };
    }
  };

  const formatCurrency = (n: number) => `R ${(n || 0).toLocaleString('en-ZA')}`;
  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── Delete ───
  const handleDelete = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/api/projects/${project.id}`);
      setToast(`Deleted: ${project.title}`);
      fetchProjects();
    } catch (err) {
      console.error('Delete failed:', err);
      setToast('Failed to delete project');
    }
  };

  return (
    <>
      <style>{`
        .pl-wrap {
          display: flex; flex-direction: column; gap: 22px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #0f172a;
        }

        .pl-hero {
          display: flex; justify-content: space-between; align-items: center;
          gap: 20px; flex-wrap: wrap;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 22px 26px;
        }
        .pl-hero h2 {
          margin: 0; font-size: 1.15rem; font-weight: 700;
          color: #0f172a; letter-spacing: -0.02em;
        }
        .pl-hero p {
          margin: 6px 0 0; font-size: 0.85rem; color: #64748b;
        }
        .pl-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #10b981; color: white; border: none;
          padding: 10px 18px; border-radius: 10px;
          font-size: 0.85rem; font-weight: 600; cursor: pointer;
          box-shadow: 0 4px 12px -4px rgba(16,185,129,0.4);
          transition: all 0.2s ease;
        }
        .pl-btn-primary:hover {
          background: #059669; transform: translateY(-1px);
        }

        .pl-toolbar {
          display: flex; gap: 12px; flex-wrap: wrap;
          align-items: center; justify-content: space-between;
          background: #ffffff; border: 1px solid #e2e8f0;
          border-radius: 14px; padding: 12px 16px;
        }
        .pl-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .pl-tab {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 8px;
          border: 1px solid transparent; background: transparent;
          font-size: 0.78rem; font-weight: 500; color: #64748b;
          cursor: pointer; font-family: inherit;
          transition: all 0.2s ease;
        }
        .pl-tab:hover { background: #f1f5f9; color: #0f172a; }
        .pl-tab.active {
          background: #eff6ff; color: #1d4ed8;
          border-color: #bfdbfe; font-weight: 600;
        }
        .pl-tab-count {
          font-size: 0.68rem; padding: 1px 6px;
          background: rgba(15,23,42,0.06); border-radius: 999px;
        }
        .pl-tab.active .pl-tab-count {
          background: rgba(29,78,216,0.12); color: #1d4ed8;
        }

        .pl-search {
          display: flex; align-items: center; gap: 8px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 8px 12px;
          min-width: 260px; transition: all 0.2s ease;
        }
        .pl-search:focus-within {
          border-color: #93c5fd; background: #ffffff;
          box-shadow: 0 0 0 3px rgba(147,197,253,0.25);
        }
        .pl-search input {
          border: none; background: transparent; outline: none;
          font-size: 0.83rem; width: 100%; color: #0f172a;
          font-family: inherit;
        }
        .pl-search input::placeholder { color: #94a3b8; }

        .pl-refresh {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 12px; border-radius: 10px;
          border: 1px solid #e2e8f0; background: #ffffff;
          font-size: 0.8rem; color: #475569; cursor: pointer;
          font-family: inherit; font-weight: 500;
          transition: all 0.2s ease;
        }
        .pl-refresh:hover { background: #f8fafc; border-color: #cbd5e1; }
        .pl-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

        .pl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }

        .pl-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          display: flex; flex-direction: column; gap: 14px;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .pl-card::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; background: #10b981;
          opacity: 0; transition: opacity 0.3s ease;
        }
        .pl-card:hover {
          transform: translateY(-3px);
          border-color: #cbd5e1;
          box-shadow: 0 16px 36px -22px rgba(15,23,42,0.25);
        }
        .pl-card:hover::before { opacity: 1; }

        .pl-card-head {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 12px;
        }
        .pl-card-title {
          margin: 0 0 4px; font-size: 0.98rem; font-weight: 700;
          color: #0f172a; line-height: 1.35;
          letter-spacing: -0.01em;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .pl-card-dept {
          font-size: 0.75rem; color: #64748b;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .pl-badge {
          font-size: 0.68rem; font-weight: 600;
          padding: 4px 10px; border-radius: 999px;
          white-space: nowrap; flex-shrink: 0;
          border: 1px solid;
        }

        .pl-meta {
          display: flex; flex-direction: column; gap: 8px;
          font-size: 0.78rem; color: #64748b;
        }
        .pl-meta-row {
          display: flex; align-items: center; gap: 8px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .pl-progress-wrap {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; background: #f8fafc;
          border-radius: 10px; border: 1px solid #f1f5f9;
        }
        .pl-progress-bar {
          flex: 1; height: 6px; background: #e2e8f0;
          border-radius: 999px; overflow: hidden;
        }
        .pl-progress-fill {
          height: 100%; border-radius: 999px;
          transition: width 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        .pl-progress-text {
          font-size: 0.72rem; font-weight: 700;
          color: #0f172a; font-variant-numeric: tabular-nums;
          min-width: 32px; text-align: right;
        }

        .pl-budget {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 12px; background: #f8fafc;
          border-radius: 10px; border: 1px solid #f1f5f9;
        }
        .pl-budget-label {
          color: #64748b; font-size: 0.68rem;
          text-transform: uppercase; letter-spacing: 0.05em;
          font-weight: 600;
        }
        .pl-budget-value {
          font-weight: 700; color: #0f172a;
          font-variant-numeric: tabular-nums;
          font-size: 0.88rem;
        }

        .pl-card-foot {
          display: flex; justify-content: space-between;
          align-items: center; gap: 8px;
          padding-top: 12px; border-top: 1px solid #f1f5f9;
        }
        .pl-manager {
          font-size: 0.72rem; color: #94a3b8;
          display: inline-flex; align-items: center; gap: 5px;
          overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; max-width: 55%;
        }
        .pl-actions { display: flex; gap: 6px; }
        .pl-icon-btn {
          width: 30px; height: 30px; border-radius: 8px;
          border: 1px solid #e2e8f0; background: #ffffff;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; color: #64748b;
          transition: all 0.2s ease;
        }
        .pl-icon-btn:hover {
          background: #f8fafc; color: #0f172a;
          border-color: #cbd5e1; transform: translateY(-1px);
        }
        .pl-icon-btn.edit:hover {
          background: #eff6ff; color: #1d4ed8;
          border-color: #bfdbfe;
        }
        .pl-icon-btn.danger:hover {
          background: #fef2f2; color: #dc2626;
          border-color: #fecaca;
        }

        .pl-empty {
          grid-column: 1 / -1;
          text-align: center; padding: 80px 24px;
          background: #ffffff; border: 1px dashed #e2e8f0;
          border-radius: 16px; color: #64748b;
        }
        .pl-empty-icon {
          width: 56px; height: 56px; border-radius: 14px;
          background: #f1f5f9; color: #94a3b8;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }
        .pl-empty h3 {
          margin: 0 0 6px; font-size: 1rem;
          font-weight: 600; color: #0f172a;
        }
        .pl-empty p { margin: 0 0 18px; font-size: 0.85rem; }

        .pl-loading {
          padding: 60px; text-align: center;
          color: #64748b; font-size: 0.9rem;
        }
        .pl-error {
          padding: 40px; text-align: center;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 14px; color: #b91c1c;
          font-size: 0.88rem;
        }

        .pl-toast {
          position: fixed; bottom: 24px; left: 50%;
          transform: translateX(-50%); z-index: 1000;
          background: #0f172a; color: #ffffff;
          padding: 12px 20px; border-radius: 12px;
          font-size: 0.83rem; font-weight: 500;
          display: flex; align-items: center; gap: 10px;
          box-shadow: 0 20px 44px -16px rgba(15,23,42,0.5);
        }
      `}</style>

      <div className="pl-wrap">
        <div className="pl-hero">
          <div>
            <h2>Project Registry</h2>
            <p>Select any project below to view, edit, or remove it from the pipeline.</p>
          </div>
          <button className="pl-btn-primary" onClick={onCreateNew}>
            <PlusCircle size={16} strokeWidth={2.2} />
            New Project
          </button>
        </div>

        <div className="pl-toolbar">
          <div className="pl-tabs">
            {statuses.map((s) => (
              <button
                key={s}
                className={`pl-tab ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
                <span className="pl-tab-count">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="pl-search">
              <Search size={14} color="#94a3b8" strokeWidth={2.2} />
              <input
                placeholder="Search projects, departments, managers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="pl-refresh" onClick={fetchProjects} disabled={loading}>
              <RefreshCw size={13} strokeWidth={2.2} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="pl-loading">Loading projects…</div>
        ) : error ? (
          <div className="pl-error">{error}</div>
        ) : (
          <div className="pl-grid">
            {filtered.length === 0 ? (
              <div className="pl-empty">
                <div className="pl-empty-icon">
                  <FolderKanban size={26} strokeWidth={1.8} />
                </div>
                <h3>No projects found</h3>
                <p>Try adjusting your filters or create your first project.</p>
                <button className="pl-btn-primary" onClick={onCreateNew}>
                  <PlusCircle size={16} strokeWidth={2.2} />
                  Create Project
                </button>
              </div>
            ) : (
              filtered.map((p) => {
                const sc = statusColor(p.status);
                const progressColor =
                  (p.overallProgress || 0) < 30 ? '#ef4444'
                  : (p.overallProgress || 0) < 60 ? '#f59e0b'
                  : '#10b981';

                return (
                  <div
                    key={p.id}
                    className="pl-card"
                    onClick={() => onEditProject(p)}
                  >
                    <div className="pl-card-head">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 className="pl-card-title">{p.title || 'Untitled Project'}</h3>
                        <span className="pl-card-dept">
                          <Building2 size={12} />
                          {p.department || 'No department'}
                        </span>
                      </div>
                      <span
                        className="pl-badge"
                        style={{ background: sc.bg, color: sc.text, borderColor: sc.ring }}
                      >
                        {p.status || 'Unknown'}
                      </span>
                    </div>

                    <div className="pl-meta">
                      <span className="pl-meta-row">
                        <MapPin size={13} color="#94a3b8" />
                        {p.location || '—'}
                      </span>
                      <span className="pl-meta-row">
                        <Calendar size={13} color="#94a3b8" />
                        {formatDate(p.startDate)} → {formatDate(p.expectedCompletion)}
                      </span>
                    </div>

                    <div className="pl-progress-wrap">
                      <div className="pl-progress-bar">
                        <div
                          className="pl-progress-fill"
                          style={{
                            width: `${p.overallProgress || 0}%`,
                            background: progressColor,
                          }}
                        />
                      </div>
                      <span className="pl-progress-text">{p.overallProgress || 0}%</span>
                    </div>

                    <div className="pl-budget">
                      <span className="pl-budget-label">Budget</span>
                      <span className="pl-budget-value">
                        {formatCurrency(p.budgetAllocated)}
                      </span>
                    </div>

                    <div className="pl-card-foot">
                      <span className="pl-manager">
                        <User size={12} />
                        {p.projectManager || 'Unassigned'}
                      </span>
                      <div className="pl-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="pl-icon-btn edit"
                          title="Edit project"
                          onClick={() => onEditProject(p)}
                        >
                          <Edit size={14} strokeWidth={2.2} />
                        </button>
                        <button
                          className="pl-icon-btn danger"
                          title="Delete project"
                          onClick={(e) => handleDelete(p, e)}
                        >
                          <Trash2 size={14} strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="pl-toast">
          <CheckCircle2 size={15} strokeWidth={2.4} style={{ color: '#34d399' }} />
          {toast}
        </div>
      )}
    </>
  );
}