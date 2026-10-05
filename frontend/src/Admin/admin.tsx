// AdminDashboard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  FolderKanban,
  CalendarPlus,
  Clock,
  Wallet,
  Coins,
  Search,
  ChevronLeft,
  ArrowLeft,
  LogOut,
  Shield,
  AlertCircle,
} from 'lucide-react';
import CreateProject from '../Components/CreateProject';
import EditProject from '../Components/EditsProjects';
import ProjectsList from '../Components/ProjectsList';
import CreateUpcomingProject from '../Components/CreateUpcomingProject';
import PendingApprovals from '../Components/PendingApprovals';
import BudgetAllocation from '../Components/BudgetAllocation';
import FundingUsageAdmin from '../Components/FundingUsageAdmin';
import AuditLogsModule from '../Components/AuditLogs';
import AdminIssuesModule from '../Components/AdminIssuesModule';
import type { Project as ProjectType } from '../Components/ProjectsList';
import { useAuth } from '../AuthContext';

interface NavItem {
  name: string;
  icon: React.ComponentType<any>;
}

// ─── Helpers ───
function getInitials(fullName?: string, email?: string): string {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
  }
  if (email && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return '?';
}

function getRoleLabel(userType?: string): string {
  if (!userType) return 'User';
  if (userType.toLowerCase() === 'admin') return 'Administrator';
  return userType.charAt(0).toUpperCase() + userType.slice(1);
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeNav, setActiveNav] = useState<string>('Create Project');
  const [editingProject, setEditingProject] = useState<ProjectType | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // ─── Derived user display values ───
  const displayName = user?.fullName || 'Admin User';
  const displayEmail = user?.email || '';
  const displayRole = getRoleLabel(user?.userType);
  const initials = getInitials(user?.fullName, user?.email);

  const navItems: NavItem[] = [
    { name: 'Create Project',    icon: PlusCircle },
    { name: 'Projects',          icon: FolderKanban },
    { name: 'Upcoming Projects', icon: CalendarPlus },
    { name: 'Pending Approvals', icon: Clock },
    { name: 'Budgets',           icon: Wallet },
    { name: 'Issues',            icon: AlertCircle },
    { name: 'Funding Usage',     icon: Coins },
    { name: 'Audit Logs',        icon: Shield },
  ];

  const handleEditProject = (project: ProjectType) => {
    setEditingProject(project);
    setActiveNav('Edit Project');
  };

  const handleCreateNew = () => {
    setEditingProject(null);
    setActiveNav('Create Project');
  };

  const handleSuccess = () => {
    setEditingProject(null);
    setActiveNav('Projects');
  };

  const handleUpcomingSuccess = () => {
    setActiveNav('Upcoming Projects');
  };

  const handleCancel = () => {
    setEditingProject(null);
    setActiveNav('Create Project');
  };

  // ─── Logout handler ───
  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (!confirmed) return;

    // Clear auth context (this typically clears localStorage too)
    logout();

    // Belt-and-braces: wipe any persisted keys directly
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');

    // Redirect to login
    navigate('/login', { replace: true });
  };

  const renderActiveModule = () => {
    switch (activeNav) {
      case 'Create Project':
        return <CreateProject onSuccess={handleSuccess} onCancel={handleCancel} />;

      case 'Edit Project':
        return (
          <EditProject
            projectData={editingProject || undefined}
            onSuccess={handleSuccess}
            onCancel={() => setActiveNav('Projects')}
          />
        );

      case 'Projects':
        return (
          <ProjectsList
            onCreateNew={handleCreateNew}
            onEditProject={handleEditProject}
          />
        );

      case 'Upcoming Projects':
        return (
          <CreateUpcomingProject
            onSuccess={handleUpcomingSuccess}
            onCancel={() => setActiveNav('Create Project')}
          />
        );

      case 'Pending Approvals':
        return <PendingApprovals />;

      case 'Budgets':
        return <BudgetAllocation />;

      case 'Funding Usage':
        return <FundingUsageAdmin />;

      case 'Issues':
        return <AdminIssuesModule />;

      case 'Audit Logs':
        return <AuditLogsModule />;

      default:
        return <CreateProject onSuccess={handleSuccess} onCancel={handleCancel} />;
    }
  };

  const showBackButton = () => activeNav === 'Edit Project';

  const getPageTitle = () => {
    switch (activeNav) {
      case 'Create Project':    return 'Create New Project';
      case 'Edit Project':      return `Edit: ${editingProject?.title || 'Project'}`;
      case 'Projects':          return 'Projects';
      case 'Upcoming Projects': return 'Add Upcoming Project';
      case 'Pending Approvals': return 'Pending Approvals';
      case 'Budgets':           return 'Budget Allocation';
      case 'Funding Usage':     return 'Funding Usage';
      case 'Issues':            return 'Issue Triage';
      case 'Audit Logs':        return 'Audit Trail';
      default:                  return activeNav;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#f1f5f9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      <aside
        style={{
          width: sidebarCollapsed ? '80px' : '260px',
          backgroundColor: '#070e1b',
          color: '#94a3b8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #1e293b',
          flexShrink: 0,
          transition: 'width 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <div>
          <div
            style={{
              padding: sidebarCollapsed ? '20px 12px' : '20px 20px 16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#131d35',
                border: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                flexShrink: 0,
              }}
            >
              <CoatOfArmsIcon />
            </div>
            {!sidebarCollapsed && (
              <div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#ffffff',
                    letterSpacing: '0.5px',
                  }}
                >
                  GCPTS
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#64748b',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Enterprise
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: sidebarCollapsed ? '8px 8px' : '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 130px)',
            }}
          >
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive =
                activeNav === item.name ||
                (item.name === 'Projects' && activeNav === 'Edit Project');
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setEditingProject(null);
                    setActiveNav(item.name);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: sidebarCollapsed ? '10px' : '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isActive ? '#131d35' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  }}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '6px',
                        bottom: '6px',
                        width: '3px',
                        backgroundColor: '#10b981',
                        borderTopRightRadius: '3px',
                        borderBottomRightRadius: '3px',
                      }}
                    />
                  )}
                  <IconComponent
                    size={18}
                    style={{
                      color: isActive ? '#10b981' : '#64748b',
                      flexShrink: 0,
                    }}
                  />
                  {!sidebarCollapsed && item.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Bottom: logged-in user + logout ─── */}
        <div style={{ padding: '12px', borderTop: '1px solid #16223b' }}>
          {!sidebarCollapsed ? (
            <>
              {/* Expanded card: avatar + name + email + role + logout icon */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#0d1729',
                  border: '1px solid #16223b',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '12px',
                    flexShrink: 0,
                    letterSpacing: '0.02em',
                  }}
                  title={displayName}
                >
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: '#ffffff',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={displayName}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#10b981',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginTop: '1px',
                    }}
                  >
                    {displayRole}
                  </div>
                  {displayEmail && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '1px',
                      }}
                      title={displayEmail}
                    >
                      {displayEmail}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <LogOut size={15} />
                </button>
              </div>

              {/* Full-width logout button below the card */}
              <button
                onClick={handleLogout}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #16223b',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#16223b';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <LogOut size={14} />
                Log out
              </button>
            </>
          ) : (
            // Collapsed state: avatar-only + logout icon
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '12px',
                  letterSpacing: '0.02em',
                }}
                title={`${displayName} · ${displayRole}`}
              >
                {initials}
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                style={{
                  background: 'transparent',
                  border: '1px solid #16223b',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#16223b';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* Sidebar collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '6px',
              marginTop: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={18}
              style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none' }}
            />
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header
          style={{
            height: '64px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            {showBackButton() && (
              <button
                onClick={() => {
                  setActiveNav('Projects');
                  setEditingProject(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                <ArrowLeft size={16} /> Back to Projects
              </button>
            )}

            <h2
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#0f172a',
                margin: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {getPageTitle()}
            </h2>
          </div>

          {/* Top-right: search + mini profile chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 12px',
                width: '260px',
                gap: '8px',
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search projects..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  width: '100%',
                  color: '#0f172a',
                }}
              />
            </div>

            {/* Profile chip with logout dropdown affordance */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 10px 5px 5px',
                borderRadius: '999px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
              title={`${displayName} · ${displayRole}`}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '10.5px',
                  letterSpacing: '0.02em',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0f172a',
                  maxWidth: '120px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                title="Log out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            backgroundColor: '#f8fafc',
          }}
        >
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
}

function CoatOfArmsIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}