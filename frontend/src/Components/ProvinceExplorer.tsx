import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SouthAfricaMap from './SouthAfricaMap';

const API_URL = 'http://localhost:8080';

interface Project {
  id: number;
  title: string;
  province?: string;
  community?: string;
  status?: string;
  overallProgress?: number;
  budgetAllocated?: number;
  gpsCoordinates?: string;
  [key: string]: any;
}

/* ---------- Real SVG icons ---------- */

const PinIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = '#3b82f6',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="2.6" stroke={color} strokeWidth="1.8" />
  </svg>
);

const SearchIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#94a3b8',
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
    <path
      d="M20 20l-3.6-3.6"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = '#94a3b8',
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const WalletIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = '#94a3b8',
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="6"
      width="18"
      height="13"
      rx="2.5"
      stroke={color}
      strokeWidth="1.7"
    />
    <path d="M3 10h18" stroke={color} strokeWidth="1.7" />
    <circle cx="17" cy="14.5" r="1.2" fill={color} />
  </svg>
);

const ChartIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = '#94a3b8',
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 20V10M12 20V4M20 20v-7"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

/* ---------- Main component ---------- */

export default function ProvinceExplorer() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/projects`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading projects:', err);
        setLoading(false);
      });
  }, []);

  const handleProvinceSelect = (provName: string | null) => {
    setSelectedProvince(provName);
    setSelectedCommunity(null);
  };

  const communitiesInProvince = useMemo<string[]>(() => {
    const s = new Set<string>();
    projects
      .filter((p) => !selectedProvince || p.province === selectedProvince)
      .forEach((p) => {
        if (p.community) s.add(p.community);
      });
    return Array.from(s).sort();
  }, [projects, selectedProvince]);

  const filteredProjects = useMemo<Project[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesProvince =
        !selectedProvince || project.province === selectedProvince;
      const matchesCommunity =
        !selectedCommunity || project.community === selectedCommunity;
      const matchesSearch =
        !q ||
        project.title?.toLowerCase().includes(q) ||
        project.community?.toLowerCase().includes(q) ||
        project.province?.toLowerCase().includes(q) ||
        project.status?.toLowerCase().includes(q);
      return matchesProvince && matchesCommunity && matchesSearch;
    });
  }, [projects, selectedProvince, selectedCommunity, searchQuery]);

  const hasFilters = !!(selectedProvince || selectedCommunity || searchQuery);

  const resetAll = () => {
    setSelectedProvince(null);
    setSelectedCommunity(null);
    setSearchQuery('');
  };

  return (
    <div
      style={{
        maxWidth: '1280px',
        margin: '40px auto',
        padding: '0 24px',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        color: '#0f172a',
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            margin: '0 0 6px 0',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#0f172a',
          }}
        >
          Provincial Project Explorer
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#64748b',
            maxWidth: '620px',
          }}
        >
          Browse funded work across South Africa. Select a province or
          community to narrow the list.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* ============ LEFT: MAP CARD (sticky) ============ */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9',
            position: 'sticky',
            top: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                color: '#0f172a',
                fontWeight: 600,
              }}
            >
              Explore by Map
            </h3>
            <span
              style={{
                fontSize: '12px',
                color: '#64748b',
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                padding: '4px 10px',
                borderRadius: '999px',
                fontWeight: 500,
              }}
            >
              {selectedProvince || 'All provinces'}
            </span>
          </div>

          <SouthAfricaMap
            selectedProvince={selectedProvince}
            onSelectProvince={handleProvinceSelect}
            projects={projects}
          />

          {/* Communities */}
          <div style={{ marginTop: '28px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#1e293b',
                  fontWeight: 600,
                }}
              >
                Communities
              </h4>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {communitiesInProvince.length} available
              </span>
            </div>

            {communitiesInProvince.length === 0 ? (
              <div
                style={{
                  fontSize: '13px',
                  color: '#94a3b8',
                  fontStyle: 'italic',
                }}
              >
                No communities in this selection.
              </div>
            ) : (
              <div
                style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
              >
                <CommunityChip
                  label="All"
                  active={selectedCommunity === null}
                  onClick={() => setSelectedCommunity(null)}
                />
                {communitiesInProvince.map((comm) => (
                  <CommunityChip
                    key={comm}
                    label={comm}
                    active={selectedCommunity === comm}
                    onClick={() =>
                      setSelectedCommunity(
                        selectedCommunity === comm ? null : comm
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============ RIGHT: LEDGER ============ */}
        <div>
          {/* Header row: title + search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                color: '#0f172a',
                fontWeight: 600,
              }}
            >
              Projects{' '}
              <span
                style={{
                  color: '#94a3b8',
                  fontWeight: 500,
                  marginLeft: '4px',
                }}
              >
                ({filteredProjects.length})
              </span>
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  minWidth: '220px',
                  transition: 'border-color 0.15s ease',
                }}
                onFocusCapture={(e) =>
                  (e.currentTarget.style.borderColor = '#cbd5e1')
                }
                onBlurCapture={(e) =>
                  (e.currentTarget.style.borderColor = '#f1f5f9')
                }
              >
                <SearchIcon size={15} />
                <input
                  type="text"
                  placeholder="Search projects…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <CloseIcon size={13} />
                  </button>
                )}
              </div>

              {hasFilters && (
                <button
                  onClick={resetAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: 500,
                    padding: '8px 4px',
                    fontFamily: 'inherit',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div
            style={{
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
              paddingRight: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {loading ? (
              <SkeletonCard />
            ) : filteredProjects.length === 0 ? (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: '#ffffff',
                  borderRadius: '16px',
                  color: '#64748b',
                  border: '1px solid #f1f5f9',
                  fontSize: '14px',
                }}
              >
                <div style={{ marginBottom: hasFilters ? '16px' : 0 }}>
                  No projects found for this selection.
                </div>
                {hasFilters && (
                  <button
                    onClick={resetAll}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 18px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      fontFamily: 'inherit',
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Sub-components ================= */

const CommunityChip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '6px 12px 6px 10px',
        borderRadius: '999px',
        border: `1px solid ${
          active ? '#bfdbfe' : hover ? '#e2e8f0' : '#f1f5f9'
        }`,
        background: active ? '#eff6ff' : hover ? '#f8fafc' : '#ffffff',
        color: active ? '#1d4ed8' : '#475569',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: active ? 500 : 400,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >
      <PinIcon size={12} color={active ? '#1d4ed8' : '#94a3b8'} />
      {label}
    </button>
  );
};

const ProjectCard: React.FC<{
  project: Project;
  onClick: () => void;
}> = ({ project, onClick }) => {
  const [hover, setHover] = useState(false);
  const progress = Math.max(0, Math.min(100, project.overallProgress || 0));
  const budget = project.budgetAllocated
    ? `R ${project.budgetAllocated.toLocaleString()}`
    : 'N/A';
  const status = project.status || 'Active';
  const isActive = status.toLowerCase() === 'active';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        (e.key === 'Enter' || e.key === ' ') && onClick()
      }
      style={{
        background: '#ffffff',
        border: '1px solid #f1f5f9',
        borderRadius: '16px',
        padding: '22px 24px',
        boxShadow: hover
          ? '0 8px 24px rgba(15, 23, 42, 0.08)'
          : '0 2px 10px rgba(0,0,0,0.02)',
        cursor: 'pointer',
        transition:
          'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        borderColor: hover ? '#e2e8f0' : '#f1f5f9',
      }}
    >
      {/* Title + status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '10px',
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: '17px',
            color: '#0f172a',
            fontWeight: 600,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {project.title}
        </h4>
        <span
          style={{
            padding: '4px 11px',
            borderRadius: '999px',
            fontSize: '11.5px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
            color: isActive ? '#15803d' : '#475569',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            textTransform: 'capitalize',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isActive && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: '#22c55e',
                display: 'inline-block',
              }}
            />
          )}
          {status}
        </span>
      </div>

      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '13px',
          color: '#64748b',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <PinIcon size={13} color="#94a3b8" />
          <span style={{ color: '#334155' }}>
            {project.community || 'Local Area'}
            {project.province ? `, ${project.province}` : ''}
          </span>
        </span>
        <span style={{ color: '#e2e8f0' }}>|</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <WalletIcon size={13} color="#94a3b8" />
          <span style={{ color: '#334155', fontWeight: 500 }}>{budget}</span>
        </span>
      </div>

      {/* Progress */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '12.5px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#64748b',
            }}
          >
            <ChartIcon size={13} color="#94a3b8" />
            Progress
          </span>
          <span
            style={{
              color: '#0f172a',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {progress}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            background: '#f1f5f9',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background:
                progress === 100 ? '#22c55e' : '#3b82f6',
              borderRadius: '999px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
};

const SkeletonCard: React.FC = () => (
  <div
    style={{
      background: '#ffffff',
      border: '1px solid #f1f5f9',
      borderRadius: '16px',
      padding: '22px 24px',
      opacity: 0.6,
    }}
  >
    <div
      style={{
        width: '60%',
        height: '18px',
        background: '#f1f5f9',
        borderRadius: '6px',
        marginBottom: '14px',
      }}
    />
    <div
      style={{
        width: '40%',
        height: '12px',
        background: '#f8fafc',
        borderRadius: '6px',
        marginBottom: '20px',
      }}
    />
    <div
      style={{
        width: '100%',
        height: '6px',
        background: '#f1f5f9',
        borderRadius: '999px',
      }}
    />
  </div>
);