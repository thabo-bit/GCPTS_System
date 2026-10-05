// src/Components/heroSection.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, User as UserIcon, Shield, FolderKanban, TrendingUp,
  AlertCircle, Bell, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import heroBg from '../assets/african-child-8.png';
import coatOfArms from '../assets/coat_of_arms_of_south_africa_1.png';
import './HeroSection.css';

export default function HeroSection() {
  const navigate = useNavigate();
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const goToDashboard = () => {
    navigate(isAdmin ? '/Admin' : '/Dashboard');
  };

  const navLinks = [
    { label: 'Home',      path: '/' },
    { label: 'Projects',  path: '/projects' },
    { label: 'Upcoming',  path: '/Project' },
    { label: 'Dashboard', path: '/Dashboard' },
    { label: 'Budget',    path: '/Budget' },
  ];

  return (
    <section className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="overlay">
        {/* ─── NAVBAR ─── */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            margin: '20px auto 0',
            maxWidth: '1280px',
            width: 'calc(100% - 48px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderRadius: '16px',
            background: 'rgba(7, 14, 27, 0.55)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
            gap: '24px',
          }}
        >
          {/* BRAND */}
          <div
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '11px',
                background:
                  'radial-gradient(circle at 50% 30%, #1b2942 0%, #0d1728 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                flexShrink: 0,
              }}
            >
              <img
                src={coatOfArms}
                alt="Coat of Arms of South Africa"
                style={{
                  width: '34px',
                  height: '34px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '1.2px',
                }}
              >
                GCPTS
              </span>
              <span
                style={{
                  marginTop: '4px',
                  fontSize: '9px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '1.6px',
                }}
              >
                Transparency Portal
              </span>
            </div>
          </div>

          {/* NAV LINKS */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              flexShrink: 0,
            }}
          >
            {navLinks.map((link) => {
              const isHovered = hoveredLink === link.label;
              return (
                <button
                  key={link.label}
                  onClick={() => navigate(link.path)}
                  onMouseEnter={() => setHoveredLink(link.label)}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{
                    cursor: 'pointer',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    border: 'none',
                    color: isHovered ? '#ffffff' : '#cbd5e1',
                    background: isHovered
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'transparent',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* ACTIONS */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/Register')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    background: '#10b981',
                    border: '1px solid #10b981',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#059669';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={goToDashboard}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '5px 12px 5px 5px',
                    borderRadius: 999,
                    background: isAdmin
                      ? 'rgba(16,185,129,0.18)'
                      : 'rgba(255,255,255,0.1)',
                    border: hovered
                      ? '1px solid rgba(139, 92, 246, 0.6)'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.22s ease',
                  }}
                >
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isAdmin
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0,
                    }}
                  >
                    {isAdmin ? <Shield size={14} /> : <UserIcon size={14} />}
                  </span>

                  <span
                    style={{
                      color: '#ffffff',
                      fontWeight: 600,
                      maxWidth: '140px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.fullName || 'User'}
                  </span>

                  {isAdmin && (
                    <span
                      style={{
                        fontSize: 9.5,
                        background: '#10b981',
                        color: '#fff',
                        padding: '3px 8px',
                        borderRadius: 999,
                        letterSpacing: 0.6,
                        fontWeight: 700,
                      }}
                    >
                      ADMIN
                    </span>
                  )}

                  <ChevronDown
                    size={14}
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      transition: 'transform 0.22s ease',
                      transform: hovered ? 'rotate(180deg)' : 'rotate(0)',
                    }}
                  />
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#e2e8f0',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    e.currentTarget.style.color = '#fecaca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                    e.currentTarget.style.color = '#e2e8f0';
                  }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─── HERO CONTENT ─── */}
        <div className="hero-content">
       

          <h1>Government Community Project</h1>
          <h2>Transparency System</h2>

          <p>
            Tracking every public development project with complete transparency.
            See what's being built near you, how much it costs, and report
            service delivery issues in real time.
          </p>

          <div className="hero-buttons">
            <button className="primary" onClick={() => navigate('/projects')}>
              <FolderKanban size={15} style={{ marginRight: 8, verticalAlign: '-2px' }} />
              Browse Projects
            </button>
            <button
              onClick={() =>
                navigate(isLoggedIn ? (isAdmin ? '/Admin' : '/Dashboard') : '/login')
              }
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <TrendingUp size={15} />
              {isLoggedIn ? 'Go to Dashboard' : 'Explore Dashboard'}
            </button>
          
            <button
              onClick={() => navigate('/Project')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Bell size={15} />
              Upcoming Projects
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}