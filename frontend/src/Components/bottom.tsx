import React, { useEffect, useMemo, useState } from "react";

import {
  FaBuilding,
  FaCheckCircle,
  FaCoins,
  FaWallet,
  FaChartLine,
  FaUsers,
  FaClock,
  FaArrowUp,
} from "react-icons/fa";

const API_URL = "http://localhost:8080";

// ─── Auth-aware fetch ───
function authFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    !headers.has("Content-Type") &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

// ─── Debug version — logs every request so we can see what fails ───
async function safeJson<T = any>(path: string, fallback: T): Promise<T> {
  try {
    const res = await authFetch(path);
    console.log(`[safeJson] ${path} → HTTP ${res.status}`);
    if (!res.ok) {
      const text = await res.text();
      console.warn(
        `[safeJson] ${path} FAILED — status ${res.status} — body:`,
        text.slice(0, 300)
      );
      return fallback;
    }
    const data = await res.json();
    console.log(`[safeJson] ${path} OK →`, data);
    return (data ?? fallback) as T;
  } catch (err) {
    console.error(`[safeJson] ${path} ERROR →`, err);
    return fallback;
  }
}

// ─── Types ───
interface Project {
  id: number;
  status?: string;
  department?: string;
  budgetAllocated?: number;
  budgetUsed?: number;
  overallProgress?: number;
}

interface Contractor {
  id: number;
  name: string;
}

interface Issue {
  id: number;
  title: string;
}

interface UserStats {
  total: number;
  admins: number;
  citizens: number;
}

// ─── Formatters ───
const formatZAR = (n: number) => {
  if (!n) return "R 0";
  if (n >= 1_000_000_000) return `R ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `R ${(n / 1_000).toFixed(1)}K`;
  return `R ${n.toLocaleString("en-ZA")}`;
};

const formatCount = (n: number) => (n || 0).toLocaleString("en-ZA");

function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    admins: 0,
    citizens: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const [projData, contractData, issueData, statsData] = await Promise.all([
        safeJson<Project[]>("/api/projects", []),
        safeJson<Contractor[]>("/api/contractors", []),
        safeJson<Issue[]>("/api/issues", []),
        safeJson<UserStats>("/api/users/stats", {
          total: 0,
          admins: 0,
          citizens: 0,
        }),
      ]);
      if (!alive) return;
      setProjects(projData);
      setContractors(contractData);
      setIssues(issueData);
      setUserStats(statsData);
      setLoading(false);
    };

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  // ─── Derived real metrics ───
  const metrics = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((p) =>
      (p.status || "").toLowerCase().includes("complet")
    ).length;
    const active = total - completed;

    const totalAllocated = projects.reduce(
      (s, p) => s + (p.budgetAllocated || 0),
      0
    );
    const totalUsed = projects.reduce(
      (s, p) => s + (p.budgetUsed || 0),
      0
    );
    const remaining = Math.max(totalAllocated - totalUsed, 0);
    const usedPct =
      totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;

    const departments = new Set(
      projects.map((p) => p.department).filter(Boolean)
    ).size;

    const withProgress = projects.filter(
      (p) => typeof p.overallProgress === "number"
    );
    const avgProgress =
      withProgress.length > 0
        ? Math.round(
            withProgress.reduce((s, p) => s + (p.overallProgress || 0), 0) /
              withProgress.length
          )
        : 0;

    return {
      total,
      completed,
      active,
      totalAllocated,
      totalUsed,
      remaining,
      usedPct,
      departments,
      contractors: contractors.length,
      issues: issues.length,
      citizens: userStats.citizens,
      totalUsers: userStats.total,
      avgProgress,
    };
  }, [projects, contractors, issues, userStats]);

  const utilisationTone =
    metrics.usedPct < 5 ? "danger" : metrics.usedPct < 30 ? "warm" : "good";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        .dashboard {
          position: relative;
          z-index: 0;
          isolation: isolate;
          max-width: 1280px;
          margin: 0 auto 24px;
          padding: 40px 28px 40px;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          color: #2b2d3a;
          background: #fbfaf7;
          -webkit-font-smoothing: antialiased;
        }

        .dashboard-head { margin-bottom: 28px; }

        .dashboard h1 {
          font-family: 'Sora', 'Inter', sans-serif;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.025em;
          color: #2b2d3a;
          margin: 0 0 8px;
        }

        .dashboard .subtitle {
          font-size: 14px;
          color: #6a6d80;
          margin: 0;
          max-width: 520px;
          line-height: 1.55;
        }

        .dashboard-layout {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        @media (max-width: 900px) {
          .dashboard-layout { grid-template-columns: 1fr; }
        }

        .hero-card {
          position: relative;
          padding: 28px;
          border-radius: 24px;
          background: linear-gradient(135deg, #ffffff 0%, #fafbfd 100%);
          border: 1px solid rgba(180, 185, 205, 0.14);
          box-shadow:
            0 1px 2px rgba(50, 55, 80, 0.02),
            0 16px 40px -28px rgba(50, 55, 80, 0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .hero-card::after {
          content: "";
          position: absolute;
          top: -80px; right: -80px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, #e5eef8 0%, transparent 70%);
          opacity: 0.7;
          pointer-events: none;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
          color: #8e8fa3;
        }

        .hero-eyebrow .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4a7a5c;
          box-shadow: 0 0 0 3px rgba(74, 122, 92, 0.15);
        }

        .hero-total {
          font-family: 'Sora', 'Inter', sans-serif;
          font-size: 56px;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1;
          color: #2b2d3a;
          font-variant-numeric: tabular-nums;
        }

        .hero-total-label {
          font-size: 14px;
          color: #6a6d80;
          margin-top: 4px;
        }

        .hero-progress { margin-top: 8px; }

        .hero-progress-bar {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: #eef0f5;
          overflow: hidden;
          display: flex;
        }

        .hero-progress-active {
          height: 100%;
          background: linear-gradient(90deg, #7f9dc4 0%, #4f6888 100%);
        }

        .hero-progress-completed {
          height: 100%;
          background: linear-gradient(90deg, #8fb89c 0%, #4a7a5c 100%);
        }

        .hero-legend {
          display: flex;
          gap: 18px;
          margin-top: 14px;
          font-size: 13px;
          color: #4a4d63;
        }

        .hero-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hero-legend-dot {
          width: 8px; height: 8px; border-radius: 50%;
        }

        .hero-legend-value {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .budget-card {
          position: relative;
          padding: 28px;
          border-radius: 24px;
          background: #ffffff;
          border: 1px solid rgba(180, 185, 205, 0.14);
          box-shadow:
            0 1px 2px rgba(50, 55, 80, 0.02),
            0 16px 40px -28px rgba(50, 55, 80, 0.3);
          display: flex;
          flex-direction: column;
          gap: 18px;
          overflow: hidden;
        }

        .budget-card::after {
          content: "";
          position: absolute;
          top: -70px; right: -70px;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, #f8ecdf 0%, transparent 70%);
          opacity: 0.55;
          pointer-events: none;
        }

        .budget-headline {
          font-family: 'Sora', 'Inter', sans-serif;
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #2b2d3a;
          font-variant-numeric: tabular-nums;
          line-height: 1.05;
          position: relative;
          z-index: 1;
        }

        .budget-headline small {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #6a6d80;
          letter-spacing: 0;
          margin-top: 6px;
          font-family: 'Inter', sans-serif;
        }

        .budget-utilisation {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 500;
          position: relative;
          z-index: 1;
          width: fit-content;
        }

        .utilisation-danger { background: #f8e9ec; color: #8a5566; }
        .utilisation-warm   { background: #fbf1e7; color: #8a5f3d; }
        .utilisation-good   { background: #eaf5ef; color: #4a7a5c; }

        .budget-bar-wrap { position: relative; z-index: 1; }

        .budget-bar {
          width: 100%;
          height: 10px;
          border-radius: 5px;
          background: #eef0f5;
          overflow: hidden;
          position: relative;
        }

        .budget-bar-fill {
          height: 100%;
          border-radius: 5px;
          background: linear-gradient(90deg, #e0b280 0%, #8a5f3d 100%);
          transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          min-width: 3px;
        }

        .budget-bar-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 12px;
          color: #a4a7b8;
        }

        .budget-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 6px;
          position: relative;
          z-index: 1;
        }

        .budget-split-item {
          padding: 14px;
          border-radius: 14px;
          background: #fafbfd;
          border: 1px solid rgba(180, 185, 205, 0.1);
        }

        .budget-split-label {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #a4a7b8;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .budget-split-value {
          font-family: 'Sora', 'Inter', sans-serif;
          font-size: 17px;
          font-weight: 600;
          color: #2b2d3a;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }

        .secondary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
        }

        .mini-card {
          position: relative;
          padding: 20px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid rgba(180, 185, 205, 0.12);
          box-shadow:
            0 1px 2px rgba(50, 55, 80, 0.02),
            0 8px 24px -22px rgba(50, 55, 80, 0.28);
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
          transition:
            transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.3s ease;
        }

        .mini-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 1px 2px rgba(50, 55, 80, 0.03),
            0 18px 34px -26px rgba(50, 55, 80, 0.36);
        }

        .mini-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          background: #f1f6fc;
          color: #4f6888;
          box-shadow: inset 0 0 0 1px rgba(180, 185, 205, 0.14);
        }

        .mini-icon.tone-mint     { background: #edf6f1; color: #4a7a5c; }
        .mini-icon.tone-peach    { background: #fbf1e7; color: #8a5f3d; }
        .mini-icon.tone-lavender { background: #f1eefa; color: #635a82; }

        .mini-value {
          font-family: 'Sora', 'Inter', sans-serif;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #2b2d3a;
          line-height: 1.1;
          font-variant-numeric: tabular-nums;
        }

        .mini-label {
          font-size: 12.5px;
          color: #6a6d80;
          font-weight: 500;
        }

        .mini-hint {
          font-size: 11px;
          color: #a4a7b8;
          margin-top: -4px;
        }

        .mini-hint.warn { color: #8a5f3d; }

        .mini-card.skeleton,
        .hero-card.skeleton,
        .budget-card.skeleton {
          background: linear-gradient(90deg, #f3f4f8 0%, #eef0f5 40%, #f3f4f8 80%);
          background-size: 200% 100%;
          animation: dash-shimmer 1.6s ease-in-out infinite;
          border-color: transparent;
          box-shadow: none;
          min-height: 120px;
        }

        .hero-card.skeleton   { min-height: 260px; }
        .budget-card.skeleton { min-height: 260px; }

        .mini-card.skeleton::after,
        .hero-card.skeleton::after,
        .budget-card.skeleton::after { display: none; }

        @keyframes dash-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 640px) {
          .dashboard { padding: 28px 18px 28px; }
          .dashboard h1 { font-size: 22px; }
          .hero-total { font-size: 44px; }
          .budget-headline { font-size: 26px; }
        }
      `}</style>

      <section className="dashboard">
        <div className="dashboard-head">
          <h1>National Transparency Dashboard</h1>
          <p className="subtitle">
            Real-time overview of public development projects across South Africa
          </p>
        </div>

        {loading ? (
          <>
            <div className="dashboard-layout">
              <div className="hero-card skeleton" />
              <div className="budget-card skeleton" />
            </div>
            <div className="secondary-grid">
              {Array.from({ length: 5 }).map((_, i) => (
                <div className="mini-card skeleton" key={i} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="dashboard-layout">
              {/* Projects overview */}
              <div className="hero-card">
                <span className="hero-eyebrow">
                  <span className="dot" />
                  Portfolio Overview
                </span>

                <div>
                  <div className="hero-total">{formatCount(metrics.total)}</div>
                  <div className="hero-total-label">
                    Development projects under management
                  </div>
                </div>

                <div className="hero-progress">
                  <div className="hero-progress-bar">
                    {metrics.total > 0 && (
                      <>
                        <div
                          className="hero-progress-completed"
                          style={{
                            width: `${(metrics.completed / metrics.total) * 100}%`,
                          }}
                        />
                        <div
                          className="hero-progress-active"
                          style={{
                            width: `${(metrics.active / metrics.total) * 100}%`,
                          }}
                        />
                      </>
                    )}
                  </div>
                  <div className="hero-legend">
                    <div className="hero-legend-item">
                      <span
                        className="hero-legend-dot"
                        style={{ background: "#4a7a5c" }}
                      />
                      Completed&nbsp;
                      <span className="hero-legend-value">
                        {formatCount(metrics.completed)}
                      </span>
                    </div>
                    <div className="hero-legend-item">
                      <span
                        className="hero-legend-dot"
                        style={{ background: "#4f6888" }}
                      />
                      Active&nbsp;
                      <span className="hero-legend-value">
                        {formatCount(metrics.active)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="budget-card">
                <span className="hero-eyebrow">Budget Tracking</span>

                <div className="budget-headline">
                  {formatZAR(metrics.totalAllocated)}
                  <small>Total allocated across portfolio</small>
                </div>

                <div
                  className={`budget-utilisation utilisation-${utilisationTone}`}
                >
                  <FaArrowUp style={{ transform: "rotate(45deg)", fontSize: 11 }} />
                  {metrics.usedPct.toFixed(2)}% of budget utilised
                </div>

                <div className="budget-bar-wrap">
                  <div className="budget-bar">
                    <div
                      className="budget-bar-fill"
                      style={{
                        width: `${Math.min(metrics.usedPct, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="budget-bar-labels">
                    <span>{formatZAR(metrics.totalUsed)} spent</span>
                    <span>{formatZAR(metrics.remaining)} remaining</span>
                  </div>
                </div>

                <div className="budget-split">
                  <div className="budget-split-item">
                    <div className="budget-split-label">Spent</div>
                    <div className="budget-split-value">
                      {formatZAR(metrics.totalUsed)}
                    </div>
                  </div>
                  <div className="budget-split-item">
                    <div className="budget-split-label">Remaining</div>
                    <div className="budget-split-value">
                      {formatZAR(metrics.remaining)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary stats */}
            <div className="secondary-grid">
              <div className="mini-card">
                <div className="mini-icon tone-mint">
                  <FaCheckCircle />
                </div>
                <div className="mini-value">
                  {formatCount(metrics.completed)}
                </div>
                <div className="mini-label">Projects Completed</div>
                <div className="mini-hint">
                  {metrics.total > 0
                    ? `${Math.round(
                        (metrics.completed / metrics.total) * 100
                      )}% of portfolio`
                    : "No projects yet"}
                </div>
              </div>

              <div className="mini-card">
                <div className="mini-icon">
                  <FaBuilding />
                </div>
                <div className="mini-value">
                  {formatCount(metrics.departments)}
                </div>
                <div className="mini-label">Departments</div>
                <div className="mini-hint">Active government bodies</div>
              </div>

              <div className="mini-card">
                <div className="mini-icon tone-lavender">
                  <FaChartLine />
                </div>
                <div className="mini-value">
                  {formatCount(metrics.contractors)}
                </div>
                <div className="mini-label">Contractors</div>
                <div className="mini-hint">Registered suppliers</div>
              </div>

              <div className="mini-card">
                <div className="mini-icon tone-peach">
                  <FaClock />
                </div>
                <div className="mini-value">
                  {formatCount(metrics.issues)}
                </div>
                <div className="mini-label">Community Issues</div>
                <div className="mini-hint warn">Reported by citizens</div>
              </div>

              <div className="mini-card">
                <div className="mini-icon">
                  <FaUsers />
                </div>
                <div className="mini-value">
                  {formatCount(metrics.citizens)}
                </div>
                <div className="mini-label">Citizens Registered</div>
                <div
                  className={`mini-hint ${metrics.citizens === 0 ? "warn" : ""}`}
                >
                  {metrics.citizens === 0
                    ? "Awaiting first registration"
                    : `${formatCount(metrics.totalUsers)} total accounts`}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default Dashboard;