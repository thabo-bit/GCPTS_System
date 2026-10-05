import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaUserTie,
  FaFolderOpen,
  FaArrowRight,
} from 'react-icons/fa';

export interface ProjectData {
  id: string;
  title: string;
  department: string;
  location: string;
  category: string;
  status: 'Completed' | 'On Track' | 'At Risk' | 'Delayed' | 'Planning';
  overallProgress: number;
  budgetAllocated: number;
  budgetUsed: number;
  contractor: string;
  imageUrl: string;
}

// Curated set of real, relevant public-development / infrastructure photos
const FALLBACK_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80', // construction site
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80', // highway / bridge
  'https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=800&q=80', // dam / water
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80', // city buildings
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80', // power / energy
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80', // engineers / planning
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&q=80', // modern architecture
  'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&w=800&q=80', // bridge / infrastructure
  'https://images.unsplash.com/photo-1523966211575-eb4a01e7dd51?auto=format&fit=crop&w=800&q=80', // road construction
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80', // urban development
];

/**
 * Returns a different fallback image for each project by shuffling
 * through the curated list based on the card index. If the project
 * already has a valid imageUrl, that is preferred.
 */
const getProjectImage = (project: ProjectData, index: number): string => {
  if (project.imageUrl && project.imageUrl.trim() !== '') {
    return project.imageUrl;
  }
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
};

const getStatusBadgeStyle = (status: ProjectData['status']) => {
  switch (status) {
    case 'Completed':
    case 'On Track':
      return { background: '#10b981', color: '#ffffff' };
    case 'At Risk':
      return { background: '#f59e0b', color: '#ffffff' };
    case 'Delayed':
      return { background: '#ef4444', color: '#ffffff' };
    case 'Planning':
    default:
      return { background: '#64748b', color: '#ffffff' };
  }
};

const getProgressBarColor = (status: ProjectData['status']) => {
  switch (status) {
    case 'Completed':
    case 'On Track':
      return '#10b981';
    case 'At Risk':
    case 'Delayed':
      return '#f59e0b';
    case 'Planning':
    default:
      return '#3b82f6';
  }
};

const formatCurrency = (amount: number) => {
  if (amount == null) return 'R 0.0M';
  if (amount >= 1_000_000) {
    return `R ${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `R ${amount.toLocaleString()}`;
};

export default function ProjectGrid() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8080/api/projects')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch projects from the database');
        }
        return response.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Limit to maximum 5 projects + 1 Explore card = 6 total slots (Strictly 2 rows x 3 columns)
  const maxSlots = 5;
  const hasMoreProjects = projects.length > maxSlots;
  const displayedProjects = hasMoreProjects ? projects.slice(0, maxSlots) : projects;

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* SECTION HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>
            Latest Projects
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
            Recently updated public development projects across the country
          </p>
        </div>
        <button 
          onClick={() => navigate('/projects')}
          style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: '600', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
        >
          View All Projects <FaArrowRight style={{ fontSize: '12px' }} />
        </button>
      </div>

      {loading && <p style={{ color: '#64748b', fontSize: '15px' }}>Loading projects from database...</p>}
      {error && <p style={{ color: '#ef4444', fontSize: '15px' }}>Error: {error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p style={{ color: '#64748b', fontSize: '15px' }}>No projects found in the database.</p>
      )}

      {/* 2 ROWS x 3 COLUMNS GRID (MAX 6 SLOTS TOTAL) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' }}>
        {displayedProjects.map((project: ProjectData, index: number) => {
          const statusStyle = getStatusBadgeStyle(project.status);
          const barColor = getProgressBarColor(project.status);
          
          const allocatedNum = project.budgetAllocated || 0;
          const usedNum = project.budgetUsed || 0;
          const usedPercentage = allocatedNum > 0 ? Math.round((usedNum / allocatedNum) * 100) : 0;

          return (
            <div
              key={project.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* CARD TOP IMAGE WITH BADGES */}
              <div style={{ position: 'relative', height: '180px', width: '100%', backgroundColor: '#e2e8f0' }}>
                <img
                  src={getProjectImage(project, index)}
                  alt={project.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                <span
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '12px',
                  }}
                >
                  {project.category}
                </span>

                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    ...statusStyle,
                  }}
                >
                  {project.status || 'On Track'}
                </span>
              </div>

              {/* CARD BODY CONTENT */}
              <div style={{ padding: '20px 20px 16px 20px', flexGrow: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0', lineHeight: '1.35' }}>
                  {project.title}
                </h3>
                
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaMapMarkerAlt style={{ fontSize: '12px', flexShrink: 0 }} />
                  <span>{project.department} &bull; {project.location}</span>
                </p>

                {/* PROGRESS BAR */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                    <span>Progress</span>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>{project.overallProgress || 0}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${project.overallProgress || 0}%`,
                        height: '100%',
                        backgroundColor: barColor,
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>

                {/* BUDGET STATS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f8fafc', paddingTop: '12px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>Allocated</span>
                    <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>{formatCurrency(allocatedNum)}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>Used ({usedPercentage}%)</span>
                    <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>{formatCurrency(usedNum)}</strong>
                  </div>
                </div>
              </div>

              {/* CARD FOOTER */}
              <div
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e7ff',
                      color: '#4338ca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                    }}
                  >
                    <FaUserTie />
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    {project.contractor || 'TBD'}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/project/${project.id}`)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#2563eb', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    padding: 0 
                  }}
                >
                  View <FaArrowRight style={{ fontSize: '11px' }} />
                </button>
              </div>

            </div>
          );
        })}

        {/* 6th SLOT: STYLISH "EXPLORE ALL" CARD (COMPLETES THE 2x3 GRID) */}
        {hasMoreProjects && (
          <div
            onClick={() => navigate('/projects')}
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: '16px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 14px 30px rgba(15, 23, 42, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(15, 23, 42, 0.15)';
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '18px',
              marginBottom: '12px',
              color: '#ffffff',
            }}>
              <FaFolderOpen />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0', color: '#ffffff' }}>
              Explore All Projects
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0', lineHeight: '1.4' }}>
              Browse all {projects.length} public development projects in our directory.
            </p>
            <span style={{ 
              backgroundColor: '#3b82f6', 
              color: '#ffffff', 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '13px', 
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              View Catalog <FaArrowRight style={{ fontSize: '11px' }} />
            </span>
          </div>
        )}
      </div>
    </section>
  );
}