// src/Public/ProjectsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Building2, Filter, X, SlidersHorizontal,
  Grid3x3, List, ArrowUpDown, Calendar, Coins, TrendingUp,
  ChevronDown, LayoutGrid, RefreshCw, ArrowLeft, Home,
} from 'lucide-react';

const API_URL = 'http://localhost:8080';

interface Project {
  id: number;
  title: string;
  category?: string;
  department?: string;
  location?: string;
  status?: string;
  startDate?: string;
  expectedCompletion?: string;
  budgetAllocated?: number;
  budgetUsed?: number;
  overallProgress?: number;
  imageUrl?: string;
  contractor?: string;
}

type SortKey = 'recent' | 'title_asc' | 'budget_desc' | 'budget_asc' | 'progress_desc' | 'progress_asc';
type ViewMode = 'grid' | 'list';

const STATUS_OPTIONS = ['All', 'On Track', 'In Progress', 'Completed', 'Delayed', 'At Risk', 'Planning', 'On Hold'];

const formatCurrency = (n: number) => {
  if (!n) return 'R 0';
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R ${(n / 1_000).toFixed(0)}k`;
  return `R ${n.toLocaleString()}`;
};

const statusStyle = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('complet'))  return { bg: '#e8f4ee', text: '#4a7a5c' };
  if (s.includes('track'))    return { bg: '#e8f4ee', text: '#4a7a5c' };
  if (s.includes('progress')) return { bg: '#e5eef8', text: '#4f6888' };
  if (s.includes('delay'))    return { bg: '#f8e9ec', text: '#8a5566' };
  if (s.includes('risk'))     return { bg: '#f8ecdf', text: '#8a5f3d' };
  if (s.includes('hold'))     return { bg: '#f8ecdf', text: '#8a5f3d' };
  if (s.includes('plan'))     return { bg: '#eeeaf7', text: '#635a82' };
  return { bg: '#eef1f6', text: '#5a6478' };
};

export default function ProjectsPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ─── Fetch all projects ───
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/projects`);
        if (!res.ok) throw new Error(`Failed to load projects (${res.status})`);
        const data = await res.json();
        setProjects(data || []);
      } catch (err: any) {
        console.error('Projects fetch error:', err);
        setError(err.message || 'Could not load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // ─── Build filter options ───
  const departments = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.department && set.add(p.department));
    return ['All', ...Array.from(set).sort()];
  }, [projects]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.location && set.add(p.location));
    return ['All', ...Array.from(set).sort()];
  }, [projects]);

  // ─── Filter + sort ───
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = projects.filter((p) => {
      const matchesSearch =
        !q ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.department || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.contractor || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'All' ||
        (p.status || '').toLowerCase() === statusFilter.toLowerCase();

      const matchesDept =
        departmentFilter === 'All' || p.department === departmentFilter;

      const matchesLoc =
        locationFilter === 'All' || p.location === locationFilter;

      return matchesSearch && matchesStatus && matchesDept && matchesLoc;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'title_asc':      return (a.title || '').localeCompare(b.title || '');
        case 'budget_desc':    return (b.budgetAllocated || 0) - (a.budgetAllocated || 0);
        case 'budget_asc':     return (a.budgetAllocated || 0) - (b.budgetAllocated || 0);
        case 'progress_desc':  return (b.overallProgress || 0) - (a.overallProgress || 0);
        case 'progress_asc':   return (a.overallProgress || 0) - (b.overallProgress || 0);
        case 'recent':
        default:               return b.id - a.id;
      }
    });

    return result;
  }, [projects, search, statusFilter, departmentFilter, locationFilter, sortKey]);

  // ─── Active filter count ───
  const activeFilterCount =
    (statusFilter !== 'All' ? 1 : 0) +
    (departmentFilter !== 'All' ? 1 : 0) +
    (locationFilter !== 'All' ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDepartmentFilter('All');
    setLocationFilter('All');
    setSortKey('recent');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        .pp-root {
          min-height: 100vh;
          background: #f6f7fb;
          font-family: 'DM Sans', system-ui, sans-serif;
          color: #2b2d3a;
          padding: 32px 24px 60px;
          -webkit-font-smoothing: antialiased;
        }
        .pp-container {
          max-width: 1320px;
          margin: 0 auto;
        }

        /* ─── Breadcrumb / back bar ─── */
        .pp-crumbbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .pp-crumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #8b8f9b;
        }
        .pp-crumbs button {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: #8b8f9b;
          font-family: inherit;
          font-size: 0.82rem;
          transition: color 0.15s ease;
        }
        .pp-crumbs button:hover { color: #635a82; }
        .pp-crumbs .sep { color: #c8c2b8; }
        .pp-crumbs .current {
          color: #1a1d26;
          font-weight: 600;
        }

        .pp-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 10px;
          background: #fff;
          border: 1px solid #eae7e0;
          color: #5a6478;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(50,55,80,0.02);
        }
        .pp-back-btn:hover {
          background: #f8f6f1;
          border-color: #d8d3c8;
          color: #1a1d26;
          transform: translateX(-2px);
        }
        .pp-home-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 10px;
          background: linear-gradient(135deg, #635a82 0%, #4f6888 100%);
          border: none;
          color: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 6px 16px -8px rgba(99,90,130,0.55);
        }
        .pp-home-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px -8px rgba(99,90,130,0.65);
        }

        /* ─── Header ─── */
        .pp-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .pp-head-left { display: flex; align-items: center; gap: 16px; }
        .pp-head-mark {
          width: 52px; height: 52px; border-radius: 16px;
          background: linear-gradient(135deg, #7f9dc4, #b8a4d4);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 22px -8px rgba(127,157,196,0.5);
          color: #fff; flex-shrink: 0;
        }
        .pp-head-text h1 {
          font-family: 'Sora', sans-serif;
          font-size: 1.6rem; font-weight: 700;
          margin: 0; color: #1a1d26;
          letter-spacing: -0.025em;
        }
        .pp-head-text p {
          font-size: 0.85rem; color: #8b8f9b;
          margin: 4px 0 0;
        }

        .pp-head-actions {
          display: flex; gap: 10px; align-items: center;
          flex-wrap: wrap;
        }

        /* ─── Toolbar (search + filters) ─── */
        .pp-toolbar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          padding: 16px 18px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.95);
          border-radius: 18px;
          box-shadow: 0 10px 30px -22px rgba(80,90,130,0.4);
          margin-bottom: 20px;
        }

        .pp-search {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid #eae7e0;
          border-radius: 12px;
          padding: 10px 16px;
          flex: 1 1 260px;
          transition: all 0.2s ease;
        }
        .pp-search:focus-within {
          border-color: #b8a4d4;
          box-shadow: 0 0 0 4px #f1eaf7;
        }
        .pp-search input {
          border: none; background: transparent; outline: none;
          width: 100%; font-size: 0.85rem; color: #1a1d26;
          font-family: inherit;
        }
        .pp-search input::placeholder { color: #a4a8b4; }

        .pp-select-wrap { position: relative; }
        .pp-select {
          appearance: none;
          background: #fff;
          border: 1px solid #eae7e0;
          border-radius: 12px;
          padding: 10px 36px 10px 14px;
          font-size: 0.82rem;
          color: #1a1d26;
          font-family: inherit;
          cursor: pointer;
          outline: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23a4a7b8' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>");
          background-repeat: no-repeat;
          background-position: right 12px center;
          transition: all 0.2s ease;
        }
        .pp-select:hover { border-color: #d8d3c8; }
        .pp-select:focus { border-color: #b8a4d4; box-shadow: 0 0 0 4px #f1eaf7; }

        .pp-clear-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #eae7e0;
          background: #fff;
          font-size: 0.78rem;
          font-weight: 600;
          color: #8a5566;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .pp-clear-btn:hover { background: #fdf2f4; border-color: #f0d5db; }

        .pp-view-toggle {
          display: inline-flex;
          background: #fff;
          border: 1px solid #eae7e0;
          border-radius: 12px;
          padding: 4px;
        }
        .pp-view-toggle button {
          border: none;
          background: transparent;
          padding: 8px 12px;
          border-radius: 9px;
          color: #8b8f9b;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .pp-view-toggle button.active {
          background: #f1eaf7;
          color: #635a82;
        }

        .pp-count-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          font-size: 0.85rem;
          color: #8b8f9b;
        }
        .pp-count-line strong {
          color: #1a1d26;
          font-family: 'Sora', sans-serif;
          font-weight: 600;
        }
        .pp-active-filters {
          display: flex; gap: 8px; flex-wrap: wrap;
        }
        .pp-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
          background: #eeeaf7;
          color: #635a82;
          border: 1px solid #ddd3ea;
        }
        .pp-chip button {
          background: none; border: none;
          color: inherit; cursor: pointer;
          display: flex; padding: 0;
          opacity: 0.7;
        }
        .pp-chip button:hover { opacity: 1; }

        /* ─── Grid ─── */
        .pp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .pp-card {
          background: #fff;
          border: 1px solid #ece9e2;
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }
        .pp-card:hover {
          transform: translateY(-4px);
          border-color: #dcd6cb;
          box-shadow: 0 22px 40px -22px rgba(70,60,100,0.28);
        }
        .pp-card-img {
          position: relative;
          height: 170px;
          background: linear-gradient(135deg, #eef1f6, #dde4ee);
          overflow: hidden;
        }
        .pp-card-img img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }
        .pp-card-status {
          position: absolute;
          top: 12px; right: 12px;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5);
        }
        .pp-card-category {
          position: absolute;
          bottom: 12px; left: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.66rem;
          font-weight: 600;
          background: rgba(15, 23, 42, 0.7);
          color: #fff;
          backdrop-filter: blur(6px);
        }

        .pp-card-body {
          padding: 18px 20px 14px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pp-card-title {
          font-family: 'Sora', sans-serif;
          font-size: 0.98rem;
          font-weight: 600;
          color: #1a1d26;
          margin: 0;
          line-height: 1.35;
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.7em;
        }
        .pp-card-meta {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 0.74rem;
          color: #8b8f9b;
        }
        .pp-card-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pp-progress-block { margin-top: auto; }
        .pp-progress-head {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: #8b8f9b;
          margin-bottom: 5px;
          font-weight: 500;
        }
        .pp-progress-head strong {
          font-family: 'Sora', sans-serif;
          color: #1a1d26;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .pp-progress-track {
          height: 6px;
          border-radius: 999px;
          background: #f0ede7;
          overflow: hidden;
        }
        .pp-progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .pp-card-foot {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 14px 20px;
          border-top: 1px solid #f4f2ee;
          background: #fbfaf7;
        }
        .pp-stat-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a4a8b4;
          margin-bottom: 3px;
        }
        .pp-stat-value {
          font-family: 'Sora', sans-serif;
          font-size: 0.86rem;
          font-weight: 600;
          color: #1a1d26;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }
        .pp-stat-value.used { color: #5a6478; }

        /* ─── List view ─── */
        .pp-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pp-list-row {
          display: grid;
          grid-template-columns: 80px 1fr 200px 160px 140px 120px;
          gap: 16px;
          align-items: center;
          padding: 16px 20px;
          background: #fff;
          border: 1px solid #ece9e2;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.22s ease;
        }
        .pp-list-row:hover {
          border-color: #dcd6cb;
          transform: translateX(2px);
          box-shadow: 0 10px 24px -18px rgba(70,60,100,0.3);
        }
        .pp-list-mark {
          width: 56px; height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, #eef1f6, #dde4ee);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .pp-list-mark img { width: 100%; height: 100%; object-fit: cover; }
        .pp-list-title {
          font-family: 'Sora', sans-serif;
          font-size: 0.9rem; font-weight: 600;
          color: #1a1d26; margin: 0 0 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pp-list-sub {
          font-size: 0.72rem; color: #8b8f9b;
          display: flex; align-items: center; gap: 6px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pp-list-status {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          justify-self: start;
        }
        .pp-list-num {
          font-family: 'Sora', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1a1d26;
          font-variant-numeric: tabular-nums;
        }
        .pp-list-num-label {
          display: block;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a4a8b4;
          margin-bottom: 2px;
        }

        @media (max-width: 1000px) {
          .pp-list-row { grid-template-columns: 60px 1fr 1fr; gap: 12px; }
          .pp-list-status { display: none; }
        }

        /* ─── Empty / loading / error ─── */
        .pp-empty {
          padding: 80px 24px;
          text-align: center;
          color: #8b8f9b;
          background: #fff;
          border: 1px dashed #e2ddd1;
          border-radius: 18px;
        }
        .pp-empty-icon {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: #eeeaf7;
          color: #635a82;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }
        .pp-empty h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1rem; font-weight: 600;
          color: #1a1d26; margin: 0 0 6px;
        }
        .pp-empty p { font-size: 0.85rem; margin: 0 0 18px; }
        .pp-empty button {
          background: #635a82;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .pp-loader {
          padding: 100px 24px;
          text-align: center;
          color: #8b8f9b;
          font-size: 0.9rem;
        }
        .pp-error {
          padding: 24px;
          text-align: center;
          background: #fdf2f4;
          color: #8a5566;
          border: 1px solid #f0d5db;
          border-radius: 14px;
          font-size: 0.85rem;
        }

        /* ─── Mobile filter drawer button ─── */
        .pp-mobile-filter-btn {
          display: none;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid #eae7e0;
          color: #5a6478;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          position: relative;
        }
        .pp-mobile-filter-btn .badge {
          background: #b8a4d4;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
        }
        @media (max-width: 760px) {
          .pp-mobile-filter-btn { display: inline-flex; }
          .pp-desktop-filters { display: none; }
        }
      `}</style>

      <div className="pp-root">
        <div className="pp-container">
          {/* Breadcrumb + back/home bar */}
          <div className="pp-crumbbar">
            <div className="pp-crumbs">
              <button onClick={() => navigate('/')}>Home</button>
              <span className="sep">/</span>
              <span className="current">All Projects</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="pp-back-btn"
                onClick={() => navigate(-1)}
                title="Go back to the previous page"
              >
                <ArrowLeft size={14} strokeWidth={2.4} />
                Back
              </button>
              <button
                className="pp-home-btn"
                onClick={() => navigate('/')}
                title="Return to home page"
              >
                <Home size={14} strokeWidth={2.4} />
                Back to Home
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="pp-head">
            <div className="pp-head-left">
              <div className="pp-head-mark">
                <Building2 size={24} strokeWidth={2} />
              </div>
              <div className="pp-head-text">
                <h1>All Projects</h1>
                <p>Browse, filter, and explore every public development project.</p>
              </div>
            </div>

            <div className="pp-head-actions">
              <button
                className="pp-mobile-filter-btn"
                onClick={() => setShowMobileFilters((s) => !s)}
              >
                <SlidersHorizontal size={15} strokeWidth={2.4} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="badge">{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="pp-toolbar">
            <div className="pp-search">
              <Search size={16} color="#a4a8b4" strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Search by name, department, location, contractor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#a4a8b4' }}
                >
                  <X size={14} strokeWidth={2.4} />
                </button>
              )}
            </div>

            <div className="pp-select-wrap pp-desktop-filters">
              <select
                className="pp-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Statuses' : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="pp-select-wrap pp-desktop-filters">
              <select
                className="pp-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Departments' : d}
                  </option>
                ))}
              </select>
            </div>

            <div className="pp-select-wrap pp-desktop-filters">
              <select
                className="pp-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l === 'All' ? 'All Locations' : l}
                  </option>
                ))}
              </select>
            </div>

            <div className="pp-select-wrap">
              <select
                className="pp-select"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="recent">Most Recent</option>
                <option value="title_asc">A → Z</option>
                <option value="budget_desc">Highest Budget</option>
                <option value="budget_asc">Lowest Budget</option>
                <option value="progress_desc">Most Progress</option>
                <option value="progress_asc">Least Progress</option>
              </select>
            </div>

            <div className="pp-view-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={14} strokeWidth={2.4} /> Grid
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
              >
                <List size={14} strokeWidth={2.4} /> List
              </button>
            </div>

            {activeFilterCount > 0 && (
              <button className="pp-clear-btn" onClick={clearFilters}>
                <X size={13} strokeWidth={2.4} /> Clear ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="pp-toolbar" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <select
                className="pp-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                ))}
              </select>
              <select
                className="pp-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
                ))}
              </select>
              <select
                className="pp-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                {locations.map((l) => (
                  <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>
                ))}
              </select>
              {activeFilterCount > 0 && (
                <button className="pp-clear-btn" onClick={clearFilters} style={{ alignSelf: 'flex-start' }}>
                  <X size={13} strokeWidth={2.4} /> Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Count + active filter chips */}
          <div className="pp-count-line">
            <div>
              Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> projects
            </div>
            {activeFilterCount > 0 && (
              <div className="pp-active-filters">
                {search && (
                  <span className="pp-chip">
                    "{search}"
                    <button onClick={() => setSearch('')}><X size={11} strokeWidth={3} /></button>
                  </span>
                )}
                {statusFilter !== 'All' && (
                  <span className="pp-chip">
                    {statusFilter}
                    <button onClick={() => setStatusFilter('All')}><X size={11} strokeWidth={3} /></button>
                  </span>
                )}
                {departmentFilter !== 'All' && (
                  <span className="pp-chip">
                    {departmentFilter}
                    <button onClick={() => setDepartmentFilter('All')}><X size={11} strokeWidth={3} /></button>
                  </span>
                )}
                {locationFilter !== 'All' && (
                  <span className="pp-chip">
                    {locationFilter}
                    <button onClick={() => setLocationFilter('All')}><X size={11} strokeWidth={3} /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="pp-loader">Loading projects…</div>
          ) : error ? (
            <div className="pp-error">{error}</div>
          ) : filteredProjects.length === 0 ? (
            <div className="pp-empty">
              <div className="pp-empty-icon">
                <Search size={26} strokeWidth={1.8} />
              </div>
              <h3>No projects match your filters</h3>
              <p>Try adjusting your search or clearing some filters.</p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}>Clear all filters</button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="pp-grid">
              {filteredProjects.map((p) => {
                const st = statusStyle(p.status);
                const progress = p.overallProgress || 0;
                const progressColor =
                  progress < 30 ? '#d8a2b0'
                  : progress < 60 ? '#e0b280'
                  : progress < 85 ? '#7f9dc4'
                  : '#8fb89c';

                return (
                  <div
                    key={p.id}
                    className="pp-card"
                    onClick={() => navigate(`/project/${p.id}`)}
                  >
                    <div className="pp-card-img">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.title} />
                      ) : (
                        <img
                          src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"
                          alt={p.title}
                        />
                      )}
                      <span
                        className="pp-card-status"
                        style={{ background: st.bg, color: st.text }}
                      >
                        {p.status || 'On Track'}
                      </span>
                      {p.category && (
                        <span className="pp-card-category">{p.category}</span>
                      )}
                    </div>

                    <div className="pp-card-body">
                      <h3 className="pp-card-title">{p.title}</h3>

                      <div className="pp-card-meta">
                        {p.department && (
                          <span>
                            <Building2 size={12} strokeWidth={2.2} />
                            {p.department}
                          </span>
                        )}
                        {p.location && (
                          <span>
                            <MapPin size={12} strokeWidth={2.2} />
                            {p.location}
                          </span>
                        )}
                      </div>

                      <div className="pp-progress-block">
                        <div className="pp-progress-head">
                          <span>Progress</span>
                          <strong>{progress}%</strong>
                        </div>
                        <div className="pp-progress-track">
                          <div
                            className="pp-progress-fill"
                            style={{ width: `${progress}%`, background: progressColor }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pp-card-foot">
                      <div>
                        <div className="pp-stat-label">Allocated</div>
                        <div className="pp-stat-value">
                          {formatCurrency(p.budgetAllocated || 0)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="pp-stat-label">Used</div>
                        <div className="pp-stat-value used">
                          {formatCurrency(p.budgetUsed || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pp-list">
              {filteredProjects.map((p) => {
                const st = statusStyle(p.status);
                return (
                  <div
                    key={p.id}
                    className="pp-list-row"
                    onClick={() => navigate(`/project/${p.id}`)}
                  >
                    <div className="pp-list-mark">
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80'}
                        alt={p.title}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p className="pp-list-title">{p.title}</p>
                      <div className="pp-list-sub">
                        <Building2 size={11} strokeWidth={2.2} />
                        {p.department || '—'}
                        {p.location && <span> · {p.location}</span>}
                      </div>
                    </div>
                    <div>
                      <span className="pp-list-status" style={{ background: st.bg, color: st.text }}>
                        {p.status || 'On Track'}
                      </span>
                    </div>
                    <div>
                      <span className="pp-list-num-label">Progress</span>
                      <span className="pp-list-num">{p.overallProgress || 0}%</span>
                    </div>
                    <div>
                      <span className="pp-list-num-label">Allocated</span>
                      <span className="pp-list-num">{formatCurrency(p.budgetAllocated || 0)}</span>
                    </div>
                    <div>
                      <span className="pp-list-num-label">Used</span>
                      <span className="pp-list-num">{formatCurrency(p.budgetUsed || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}