// components/PendingApprovals.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Check, X, Clock, RefreshCw, Landmark, HeartHandshake,
  AlertCircle, Search, Wallet, MapPin
} from 'lucide-react';

const API_URL = 'http://localhost:8080';

interface UpcomingProject {
  id: number;
  title: string;
  category: string;
  department: string;
  ward: string;
  location: string;
  estimatedBudget: number;
  scheduledStart: string;
  issuer: string;
  communityImpact: string;
  status: string;
  referenceNumber?: string;
}

export default function PendingApprovals() {
  const [projects, setProjects] = useState<UpcomingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/upcoming-projects`);
      const all: UpcomingProject[] = res.data || [];
      setProjects(all.filter((p) => p.status === 'Waiting for Approval'));
    } catch (err) {
      console.error('Fetch pending error:', err);
      setToast('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const setStatus = async (id: number, status: string) => {
    setBusyId(id);
    try {
      await axios.patch(`${API_URL}/api/upcoming-projects/${id}/status`, { status });
      setToast(`Marked as ${status}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Status update failed:', err);
      setToast('Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const fmt = (n: number) => `R ${(n || 0).toLocaleString('en-ZA')}`;

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return !q ||
      p.title?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.ward?.toLowerCase().includes(q) ||
      p.issuer?.toLowerCase().includes(q);
  });

  return (
    <>
      <style>{`
        .pa-wrap {
          display: flex; flex-direction: column; gap: 22px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #0f172a;
        }

        .pa-hero {
          display: flex; justify-content: space-between; align-items: center;
          gap: 20px; flex-wrap: wrap;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 22px 26px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
        }
        .pa-hero-left { display: flex; align-items: center; gap: 16px; }
        .pa-hero-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, #fef3e2, #fde4be);
          color: #a06820;
          display: flex; align-items: center; justify-content: center;
          box-shadow: inset 0 0 0 1px rgba(192,122,52,0.15);
          flex-shrink: 0;
        }
        .pa-hero h2 {
          margin: 0 0 4px; font-size: 1.15rem; font-weight: 700;
          color: #0f172a; letter-spacing: -0.02em;
        }
        .pa-hero p {
          margin: 0; font-size: 0.85rem; color: #64748b;
        }

        .pa-toolbar {
          display: flex; gap: 12px; align-items: center;
          justify-content: space-between; flex-wrap: wrap;
          background: #ffffff; border: 1px solid #e2e8f0;
          border-radius: 14px; padding: 12px 16px;
        }

        .pa-search {
          display: flex; align-items: center; gap: 8px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 8px 12px;
          min-width: 260px; flex: 1; max-width: 400px;
          transition: all 0.2s ease;
        }
        .pa-search:focus-within {
          border-color: #93c5fd; background: #fff;
          box-shadow: 0 0 0 3px rgba(147,197,253,0.25);
        }
        .pa-search input {
          border: none; background: transparent; outline: none;
          font-size: 0.83rem; width: 100%; color: #0f172a;
          font-family: inherit;
        }
        .pa-search input::placeholder { color: #94a3b8; }

        .pa-refresh {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 14px; border-radius: 10px;
          border: 1px solid #e2e8f0; background: #ffffff;
          font-size: 0.8rem; color: #475569; cursor: pointer;
          font-family: inherit; font-weight: 500;
          transition: all 0.2s ease;
        }
        .pa-refresh:hover { background: #f8fafc; border-color: #cbd5e1; }
        .pa-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

        .pa-count {
          font-size: 0.75rem; color: #94a3b8;
          font-weight: 500; font-variant-numeric: tabular-nums;
        }

        .pa-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 16px;
        }

        .pa-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 22px;
          display: flex; flex-direction: column; gap: 14px;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          position: relative;
          overflow: hidden;
        }
        .pa-card::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; background: #c19a6b;
        }
        .pa-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 36px -22px rgba(15,23,42,0.25);
          border-color: #cbd5e1;
        }

        .pa-card-head {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 12px;
        }
        .pa-card-title {
          margin: 0 0 6px; font-size: 1rem; font-weight: 700;
          color: #0f172a; line-height: 1.35;
          letter-spacing: -0.01em;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .pa-card-dept {
          font-size: 0.75rem; color: #64748b;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .pa-kind {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.65rem; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 5px 10px; border-radius: 999px;
          white-space: nowrap; flex-shrink: 0;
        }
        .pa-kind.gov { background: #e5eef8; color: #4f6888; }
        .pa-kind.ngo { background: #e8f4ee; color: #4a7a5c; }

        .pa-priority {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.68rem; font-weight: 600;
          color: #8a5f3d;
        }
        .pa-priority-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #e0b280;
        }
        .pa-priority-dot.high { background: #d8a2b0; }

        .pa-meta {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }
        .pa-meta-item {
          display: flex; flex-direction: column; gap: 3px;
        }
        .pa-meta-label {
          font-size: 0.65rem; font-weight: 600;
          color: #94a3b8; text-transform: uppercase;
          letter-spacing: 0.06em;
          display: inline-flex; align-items: center; gap: 5px;
        }
        .pa-meta-value {
          font-size: 0.82rem; font-weight: 600;
          color: #0f172a;
          font-variant-numeric: tabular-nums;
          overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pa-issuer {
          font-size: 0.72rem; color: #94a3b8;
          display: inline-flex; align-items: center; gap: 6px;
          padding-top: 4px;
        }
        .pa-issuer strong {
          color: #475569; font-weight: 600;
        }

        .pa-actions {
          display: flex; gap: 8px; margin-top: 4px;
        }
        .pa-btn {
          flex: 1;
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px;
          padding: 10px 14px; border-radius: 10px;
          font-size: 0.78rem; font-weight: 600;
          cursor: pointer; font-family: inherit;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .pa-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .pa-btn.approve {
          background: #eef8f1; color: #2f7d52;
          border-color: #c6e8d2;
        }
        .pa-btn.approve:hover:not(:disabled) {
          background: #3ba868; color: #fff;
          border-color: #3ba868;
          transform: translateY(-1px);
        }
        .pa-btn.reject {
          background: #fdf2f4; color: #b8375c;
          border-color: #fbcfdc;
        }
        .pa-btn.reject:hover:not(:disabled) {
          background: #e11d64; color: #fff;
          border-color: #e11d64;
          transform: translateY(-1px);
        }

        .pa-empty {
          text-align: center; padding: 80px 24px;
          background: #ffffff; border: 1px dashed #e2e8f0;
          border-radius: 16px; color: #64748b;
        }
        .pa-empty-icon {
          width: 64px; height: 64px; border-radius: 18px;
          background: #eef8f1; color: #3ba868;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px;
        }
        .pa-empty h3 {
          margin: 0 0 6px; font-size: 1.05rem;
          font-weight: 600; color: #0f172a;
        }
        .pa-empty p { margin: 0; font-size: 0.85rem; }

        .pa-loading {
          padding: 60px; text-align: center;
          color: #64748b; font-size: 0.9rem;
        }

        .pa-toast {
          position: fixed; bottom: 24px; left: 50%;
          transform: translateX(-50%); z-index: 1000;
          background: #0f172a; color: #ffffff;
          padding: 12px 20px; border-radius: 12px;
          font-size: 0.83rem; font-weight: 500;
          display: flex; align-items: center; gap: 10px;
          box-shadow: 0 20px 44px -16px rgba(15,23,42,0.5);
        }
      `}</style>

      <div className="pa-wrap">
        {/* Hero */}
        <div className="pa-hero">
          <div className="pa-hero-left">
            <div className="pa-hero-icon">
              <Clock size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2>Pending Approvals</h2>
              <p>Review and approve upcoming projects waiting for sign-off.</p>
            </div>
          </div>
          <span className="pa-count">
            {filtered.length} {filtered.length === 1 ? 'project' : 'projects'} awaiting
          </span>
        </div>

        {/* Toolbar */}
        <div className="pa-toolbar">
          <div className="pa-search">
            <Search size={14} color="#94a3b8" strokeWidth={2.2} />
            <input
              placeholder="Search by title, department, ward, or issuer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="pa-refresh" onClick={fetchPending} disabled={loading}>
            <RefreshCw size={13} strokeWidth={2.2} />
            Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="pa-loading">Loading pending approvals…</div>
        ) : filtered.length === 0 ? (
          <div className="pa-empty">
            <div className="pa-empty-icon">
              <Check size={28} strokeWidth={2.2} />
            </div>
            <h3>{search ? 'No matches' : 'All caught up!'}</h3>
            <p>
              {search
                ? 'Try adjusting your search.'
                : 'Every upcoming project has been reviewed.'}
            </p>
          </div>
        ) : (
          <div className="pa-grid">
            {filtered.map((p) => {
              const isGov = p.category === 'Government Project';
              const isHigh = p.communityImpact === 'High Priority';
              const isBusy = busyId === p.id;

              return (
                <div key={p.id} className="pa-card">
                  <div className="pa-card-head">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 className="pa-card-title">{p.title}</h3>
                      <span className="pa-card-dept">
                        {isGov ? <Landmark size={12} /> : <HeartHandshake size={12} />}
                        {p.department}
                      </span>
                    </div>
                    <span className={`pa-kind ${isGov ? 'gov' : 'ngo'}`}>
                      {isGov ? 'Gov' : 'NGO'}
                    </span>
                  </div>

                  <div className="pa-priority">
                    <span className={`pa-priority-dot ${isHigh ? 'high' : ''}`} />
                    {p.communityImpact}
                  </div>

                  <div className="pa-meta">
                    <div className="pa-meta-item">
                      <span className="pa-meta-label">
                        <Wallet size={10} strokeWidth={2.4} /> Budget
                      </span>
                      <span className="pa-meta-value">{fmt(p.estimatedBudget)}</span>
                    </div>
                    <div className="pa-meta-item">
                      <span className="pa-meta-label">
                        <MapPin size={10} strokeWidth={2.4} /> Ward
                      </span>
                      <span className="pa-meta-value">{p.ward || '—'}</span>
                    </div>
                    <div className="pa-meta-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="pa-meta-label">
                        <AlertCircle size={10} strokeWidth={2.4} /> Location
                      </span>
                      <span className="pa-meta-value">{p.location || '—'}</span>
                    </div>
                  </div>

                  <div className="pa-issuer">
                    Issued by <strong>{p.issuer}</strong>
                    {p.referenceNumber && (
                      <span style={{
                        marginLeft: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.68rem',
                        color: '#94a3b8',
                      }}>
                        {p.referenceNumber}
                      </span>
                    )}
                  </div>

                  <div className="pa-actions">
                    <button
                      className="pa-btn approve"
                      onClick={() => setStatus(p.id, 'Approved')}
                      disabled={isBusy}
                    >
                      <Check size={14} strokeWidth={2.4} />
                      {isBusy ? 'Working…' : 'Approve'}
                    </button>
                    <button
                      className="pa-btn reject"
                      onClick={() => setStatus(p.id, 'Rejected')}
                      disabled={isBusy}
                    >
                      <X size={14} strokeWidth={2.4} />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className="pa-toast">
          <Check size={15} strokeWidth={2.4} style={{ color: '#34d399' }} />
          {toast}
        </div>
      )}
    </>
  );
}