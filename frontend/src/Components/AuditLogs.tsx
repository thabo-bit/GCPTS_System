// src/Components/AuditLogsModule.tsx
import React, { useState, useMemo, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Search, Download, Shield, AlertTriangle, CheckCircle2,
  XCircle, LogIn, LogOut, Edit3, Trash2, Plus, Lock,
  UserCog, FileText, ChevronDown, Filter, Clock,
  Activity, Fingerprint, Globe, MonitorSmartphone,
  KeyRound, Eye, RefreshCw
} from 'lucide-react';

const API_URL = 'http://localhost:8080';

// ⭐ Read the JWT from the SAME key AuthContext uses ('gcpts_auth').
//    AuthContext stores: { email, fullName, userType, token } as JSON.
function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('gcpts_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

// ─── TYPES ───
type Severity = 'critical' | 'warning' | 'info';
type LogStatus = 'SUCCESS' | 'FAILURE';

interface AuditLog {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  severity: Severity;
  entity: string;
  recordName: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  requestMethod: string;
  status: LogStatus;
  failureReason: string | null;
  sessionId: string | null;
  isSensitive: boolean;
}

interface SeverityTheme {
  bg: string;
  soft: string;
  text: string;
  accent: string;
  ring: string;
}

interface Theme {
  bg: string;
  card: string;
  border: string;
  borderSoft: string;
  text: string;
  textSoft: string;
  textMuted: string;
  critical: SeverityTheme;
  warning: SeverityTheme;
  info: SeverityTheme;
  success: SeverityTheme;
}

// ─── CALM THEME ───
const THEME: Theme = {
  bg: '#f6f7fb',
  card: '#ffffff',
  border: '#eef0f6',
  borderSoft: '#f4f5fa',
  text: '#1a1f36',
  textSoft: '#6b7280',
  textMuted: '#9ca3af',

  critical: { bg: '#fdf2f4', soft: '#fce7ec', text: '#b8375c', accent: '#e11d64', ring: '#fbcfdc' },
  warning:  { bg: '#fdf8ee', soft: '#fbf0d9', text: '#a06820', accent: '#e0932b', ring: '#f5deb0' },
  info:     { bg: '#eef4fb', soft: '#e1ecfa', text: '#3b5a8c', accent: '#5b8def', ring: '#c9dbf5' },
  success:  { bg: '#eef8f1', soft: '#e0f2e7', text: '#2f7d52', accent: '#3ba868', ring: '#c6e8d2' },
};

const severityTheme = (s: Severity): SeverityTheme => THEME[s] ?? THEME.info;

const actionIcons: Record<string, LucideIcon> = {
  LOGIN_SUCCESS: LogIn,
  LOGIN_FAILURE: LogIn,
  ADMIN_LOGIN: LogIn,
  LOGOUT: LogOut,
  USER_REGISTERED: Plus,
  BUDGET_UPDATED: Edit3,
  PROJECT_CREATED: Plus,
  PROJECT_UPDATED: Edit3,
  PROJECT_DELETED: Trash2,
  TRANSACTION_CREATED: Plus,
  TRANSACTION_UPDATED: Edit3,
  TRANSACTION_DELETED: Trash2,
  ACCESS_DENIED: Lock,
  USER_ROLE_CHANGED: UserCog,
};

const prettyAction = (a: string): string =>
  (a || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

const formatDate = (iso: string): { date: string; time: string } => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: '—', time: '' };
  return {
    date: d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
    time: d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
  };
};

// ─── SAFE JSON PARSE ───
// Backend stores oldValue/newValue as TEXT columns, which come back as
// JSON strings. Parse them into objects so DiffViewer can iterate.
function parseJSONValue(value: any): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

// ─── DIFF VIEWER ───
interface DiffViewerProps {
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
}

function DiffViewer({ oldValue, newValue }: DiffViewerProps) {
  if (!oldValue && !newValue) {
    return (
      <div style={{ color: THEME.textMuted, fontSize: '12px', fontStyle: 'italic' }}>
        No field changes recorded
      </div>
    );
  }
  const keys = new Set([
    ...Object.keys(oldValue || {}),
    ...Object.keys(newValue || {}),
  ]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[...keys].map((key) => {
        const o = oldValue?.[key];
        const n = newValue?.[key];
        return (
          <div key={key} style={{
            display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px',
            alignItems: 'center', fontSize: '12.5px',
          }}>
            <div style={{ color: THEME.textSoft, fontWeight: 600 }}>{key}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {o !== undefined && (
                <span style={{
                  color: THEME.critical.text, backgroundColor: THEME.critical.bg,
                  padding: '3px 10px', borderRadius: '20px',
                  textDecoration: 'line-through', fontSize: '12px',
                }}>{String(o)}</span>
              )}
              {n !== undefined && (
                <span style={{
                  color: THEME.success.text, backgroundColor: THEME.success.bg,
                  padding: '3px 10px', borderRadius: '20px',
                  fontWeight: 600, fontSize: '12px',
                }}>{String(n)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN ───
export default function AuditLogsModule() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ─── Fetch real audit logs ───
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();

      const res = await fetch(`${API_URL}/api/audit-logs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error(
            'Access denied — admin role required. Try logging out and back in as admin.'
          );
        }
        if (res.status === 401) {
          throw new Error('Session expired — please log in again.');
        }
        throw new Error(`Failed to load audit logs (${res.status})`);
      }

      const raw: any[] = await res.json();

      const normalized: AuditLog[] = raw.map((l) => ({
        id: String(l.id),
        userName: l.userName ?? 'System',
        userRole: l.userRole ?? 'Unknown',
        action: l.action ?? 'UNKNOWN',
        severity: (l.severity as Severity) ?? 'info',
        entity: l.entity ?? 'Unknown',
        recordName: l.recordName ?? null,
        oldValue: parseJSONValue(l.oldValue),
        newValue: parseJSONValue(l.newValue),
        timestamp: l.timestamp ?? new Date().toISOString(),
        ipAddress: l.ipAddress ?? '—',
        userAgent: l.userAgent ?? '—',
        endpoint: l.endpoint ?? '—',
        requestMethod: l.requestMethod ?? '—',
        status: (l.status as LogStatus) ?? 'SUCCESS',
        failureReason: l.failureReason ?? null,
        sessionId: l.sessionId ?? null,
        isSensitive: l.isSensitive ?? false,
      }));

      setLogs(normalized);
    } catch (err: any) {
      console.error('Audit logs fetch error:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      log.userName?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.recordName?.toLowerCase().includes(q) ||
      log.ipAddress?.includes(q);
    const matchesSev = filterSeverity === 'ALL' || log.severity === filterSeverity;
    const matchesEnt = filterEntity === 'ALL' || log.entity === filterEntity;
    return matchesSearch && matchesSev && matchesEnt;
  }), [logs, searchTerm, filterSeverity, filterEntity]);

  const stats = useMemo(() => ({
    total: logs.length,
    critical: logs.filter((l) => l.severity === 'critical').length,
    failures: logs.filter((l) => l.status === 'FAILURE').length,
    today: logs.filter((l) => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
  }), [logs]);

  const entities = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => l.entity && set.add(l.entity));
    return ['ALL', ...Array.from(set)];
  }, [logs]);

  const exportCSV = (): void => {
    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Severity', 'Entity', 'Record', 'Status', 'IP', 'Method', 'Endpoint'];
    const rows = filteredLogs.map((l) => [
      l.id, l.timestamp, l.userName, l.userRole, l.action, l.severity,
      l.entity, l.recordName || '-', l.status, l.ipAddress, l.requestMethod, l.endpoint,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '22px',
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      color: THEME.text,
    }}>

      {/* HERO HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f9faff 100%)',
        borderRadius: '20px', padding: '28px 32px',
        border: `1px solid ${THEME.border}`,
        boxShadow: '0 1px 3px rgba(16,24,40,0.03), 0 12px 32px -12px rgba(16,24,40,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #eef4fb, #e1ecfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 0 0 1px rgba(91,141,239,0.15)',
          }}>
            <Shield size={24} color="#5b8def" strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontSize: '21px', fontWeight: 700, color: THEME.text, margin: 0, letterSpacing: '-0.3px' }}>
              Audit Trail
            </h1>
            <p style={{ fontSize: '13.5px', color: THEME.textSoft, margin: '4px 0 0 0' }}>
              Immutable activity log · POPIA compliant · security monitoring
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchLogs} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#ffffff', color: THEME.textSoft,
            border: `1px solid ${THEME.border}`, borderRadius: '12px',
            padding: '11px 18px', fontSize: '13px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}>
            <RefreshCw size={15} strokeWidth={2.2} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #1a1f36, #2a3152)',
            color: '#ffffff', border: 'none', borderRadius: '12px',
            padding: '11px 20px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 4px 12px -4px rgba(26,31,54,0.3)',
          }}>
            <Download size={15} strokeWidth={2.2} /> Export CSV
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Events', value: stats.total, icon: Activity, color: '#5b8def', bg: THEME.info.soft },
          { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: '#e11d64', bg: THEME.critical.soft },
          { label: 'Failed Actions', value: stats.failures, icon: XCircle, color: '#e0932b', bg: THEME.warning.soft },
          { label: 'Today', value: stats.today, icon: Clock, color: '#3ba868', bg: THEME.success.soft },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{
              backgroundColor: THEME.card, borderRadius: '16px',
              padding: '20px', border: `1px solid ${THEME.border}`,
              boxShadow: '0 1px 2px rgba(16,24,40,0.02)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  backgroundColor: s.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={s.color} strokeWidth={2.2} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: THEME.text, letterSpacing: '-0.5px', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '12px', color: THEME.textSoft, marginTop: '6px', fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTER BAR */}
      <div style={{
        backgroundColor: THEME.card, borderRadius: '16px', padding: '16px 20px',
        border: `1px solid ${THEME.border}`,
        display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: THEME.bg, border: `1px solid ${THEME.border}`,
          borderRadius: '10px', padding: '9px 14px', flex: '1 1 240px',
        }}>
          <Search size={15} color={THEME.textMuted} strokeWidth={2.2} />
          <input
            type="text"
            placeholder="Search users, actions, IPs, records…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: '13px', width: '100%', color: THEME.text,
            }}
          />
        </div>

        <Pill
          icon={Filter}
          value={filterSeverity}
          onChange={setFilterSeverity}
          options={[
            { v: 'ALL', l: 'All severity' },
            { v: 'critical', l: 'Critical' },
            { v: 'warning', l: 'Warning' },
            { v: 'info', l: 'Info' },
          ]}
        />

        <Pill
          icon={FileText}
          value={filterEntity}
          onChange={setFilterEntity}
          options={entities.map((e) => ({
            v: e,
            l: e === 'ALL' ? 'All modules' : e,
          }))}
        />
      </div>

      {/* LOG TIMELINE */}
      <div style={{
        backgroundColor: THEME.card, borderRadius: '18px',
        border: `1px solid ${THEME.border}`,
        boxShadow: '0 1px 2px rgba(16,24,40,0.02)', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: THEME.textSoft }}>Loading audit logs…</div>
          </div>
        ) : error ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: THEME.critical.bg, color: THEME.critical.text,
              padding: '14px 20px', borderRadius: '12px',
              fontSize: '13px', fontWeight: 500,
              boxShadow: `inset 0 0 0 1px ${THEME.critical.ring}`,
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              backgroundColor: THEME.bg, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Search size={22} color={THEME.textMuted} />
            </div>
            <div style={{ fontSize: '14px', color: THEME.textSoft, fontWeight: 500 }}>
              No logs match your current filters
            </div>
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const sev = severityTheme(log.severity);
            const Icon = actionIcons[log.action] || FileText;
            const isExpanded = expandedId === log.id;
            const isFailure = log.status === 'FAILURE';
            const { date, time } = formatDate(log.timestamp);

            return (
              <div key={log.id} style={{
                borderBottom: idx < filteredLogs.length - 1 ? `1px solid ${THEME.borderSoft}` : 'none',
                backgroundColor: isExpanded ? THEME.bg : 'transparent',
              }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 44px 1fr 180px 130px 32px',
                    alignItems: 'center', gap: '16px',
                    padding: '18px 24px', cursor: 'pointer',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {date}
                    </div>
                    <div style={{ fontSize: '12px', color: THEME.textSoft, marginTop: '2px' }}>
                      {time}
                    </div>
                  </div>

                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    backgroundColor: sev.soft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `inset 0 0 0 1px ${sev.ring}`,
                  }}>
                    <Icon size={17} color={sev.accent} strokeWidth={2.2} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '13.5px', fontWeight: 600, color: THEME.text,
                      marginBottom: '3px',
                    }}>
                      {prettyAction(log.action)}
                    </div>
                    <div style={{
                      fontSize: '12px', color: THEME.textSoft,
                      display: 'flex', alignItems: 'center', gap: '8px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '1px 8px', borderRadius: '10px',
                        backgroundColor: THEME.bg, color: THEME.textSoft,
                        fontSize: '11px', fontWeight: 500,
                      }}>
                        {log.entity}
                      </span>
                      {log.recordName && <span>· {log.recordName}</span>}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: THEME.text }}>
                      {log.userName}
                    </div>
                    <div style={{ fontSize: '11.5px', color: THEME.textMuted, marginTop: '2px' }}>
                      {log.userRole}
                    </div>
                  </div>

                  <div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: 600,
                      backgroundColor: isFailure ? THEME.critical.bg : THEME.success.bg,
                      color: isFailure ? THEME.critical.text : THEME.success.text,
                      boxShadow: `inset 0 0 0 1px ${isFailure ? THEME.critical.ring : THEME.success.ring}`,
                    }}>
                      {isFailure
                        ? <XCircle size={11} strokeWidth={2.4} />
                        : <CheckCircle2 size={11} strokeWidth={2.4} />}
                      {isFailure ? 'Failed' : 'Success'}
                    </span>
                  </div>

                  <div style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                    display: 'flex', justifyContent: 'flex-end',
                  }}>
                    <ChevronDown size={16} color={THEME.textMuted} />
                  </div>
                </div>

                {isExpanded && (
                  <div style={{
                    padding: '0 24px 24px 24px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}>
                    <div style={{
                      backgroundColor: THEME.card, borderRadius: '14px',
                      border: `1px solid ${THEME.border}`, padding: '18px',
                    }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 700, color: THEME.textMuted,
                        textTransform: 'uppercase', letterSpacing: '0.6px',
                        marginBottom: '14px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        <Edit3 size={12} strokeWidth={2.4} /> Change Details
                      </div>
                      {isFailure ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          backgroundColor: THEME.critical.bg,
                          padding: '12px 14px', borderRadius: '10px',
                          color: THEME.critical.text, fontSize: '12.5px',
                          boxShadow: `inset 0 0 0 1px ${THEME.critical.ring}`,
                        }}>
                          <AlertTriangle size={15} strokeWidth={2.2} />
                          <div><strong>Reason:</strong> {log.failureReason || 'Unknown'}</div>
                        </div>
                      ) : (
                        <DiffViewer oldValue={log.oldValue} newValue={log.newValue} />
                      )}
                    </div>

                    <div style={{
                      backgroundColor: THEME.card, borderRadius: '14px',
                      border: `1px solid ${THEME.border}`, padding: '18px',
                    }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 700, color: THEME.textMuted,
                        textTransform: 'uppercase', letterSpacing: '0.6px',
                        marginBottom: '14px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        <Fingerprint size={12} strokeWidth={2.4} /> Technical Metadata
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <MetaRow icon={Globe} label="IP Address" value={log.ipAddress} mono />
                        <MetaRow icon={MonitorSmartphone} label="Device" value={log.userAgent} />
                        <MetaRow icon={Activity} label="Method" value={log.requestMethod} mono />
                        <MetaRow icon={Eye} label="Endpoint" value={log.endpoint} mono />
                        <MetaRow icon={KeyRound} label="Session" value={log.sessionId || '—'} mono />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{
        textAlign: 'center', fontSize: '12px', color: THEME.textMuted,
        padding: '4px 0 12px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}>
        <Shield size={12} strokeWidth={2.2} />
        Showing {filteredLogs.length} of {logs.length} entries · logs are immutable and retained per POPIA
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// ─── SUB COMPONENTS ───
interface PillOption { v: string; l: string; }
interface PillProps {
  icon: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  options: PillOption[];
}

function Pill({ icon: Icon, value, onChange, options }: PillProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      backgroundColor: THEME.bg, border: `1px solid ${THEME.border}`,
      borderRadius: '10px', padding: '9px 12px',
    }}>
      <Icon size={13} color={THEME.textMuted} strokeWidth={2.2} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: 'none', background: 'transparent', outline: 'none',
          fontSize: '12.5px', color: THEME.text, fontWeight: 500,
          cursor: 'pointer', paddingRight: '4px',
        }}
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

interface MetaRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
}

function MetaRow({ icon: Icon, label, value, mono }: MetaRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '7px',
        backgroundColor: THEME.bg, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={12} color={THEME.textSoft} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <span style={{ color: THEME.textSoft, fontSize: '12px' }}>{label}</span>
        <span style={{
          color: THEME.text, fontWeight: 500,
          fontFamily: mono ? '"JetBrains Mono", "SF Mono", monospace' : 'inherit',
          fontSize: mono ? '11.5px' : '12.5px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: '180px',
        }}>{value}</span>
      </div>
    </div>
  );
}