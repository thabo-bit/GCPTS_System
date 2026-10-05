// src/Components/ProjectCalendar.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search,
  CheckCircle2, Clock, AlertTriangle, X, MapPin,
  List, LayoutGrid, Sparkles
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

// ─── Types ───
interface Milestone {
  name: string;
  date: string;
  status: string; // "Completed" | "In Progress" | "Pending"
}

interface Project {
  id: number;
  title: string;
  department?: string;
  location?: string;
  status?: string;
  startDate?: string;
  expectedCompletion?: string;
  milestones?: Milestone[];
}

interface CalendarEvent {
  id: string;
  date: string;   // ISO YYYY-MM-DD
  name: string;
  status: string;
  projectId: number;
  projectTitle: string;
  projectDepartment?: string;
  projectLocation?: string;
}

type ViewMode = 'month' | 'list';

// ─── Theme ───
const C = {
  ink: '#2b2d3a',
  inkSoft: '#6a6d80',
  inkMuted: '#a4a7b8',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.9)',
  hairDark: 'rgba(160,165,190,0.14)',
  mint:    { bg: '#e8f4ee', text: '#4a7a5c', accent: '#8fb89c', ring: '#c6e8d2' },
  sky:     { bg: '#e5eef8', text: '#4f6888', accent: '#7f9dc4', ring: '#c9dbf5' },
  peach:   { bg: '#f8ecdf', text: '#8a5f3d', accent: '#e0b280', ring: '#eeddbf' },
  rose:    { bg: '#f8e9ec', text: '#8a5566', accent: '#d8a2b0', ring: '#f0d5db' },
  lavender:{ bg: '#eeeaf7', text: '#635a82', accent: '#b8a4d4', ring: '#ddd3ea' },
};

// ─── Helpers ───
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseFlexibleDate(input?: string): Date | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function statusTheme(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('completed'))    return { ...C.mint,  label: 'Completed' };
  if (s.includes('progress'))     return { ...C.sky,   label: 'In Progress' };
  if (s.includes('delay') || s.includes('overdue'))
                                  return { ...C.rose,  label: 'Delayed' };
  return { ...C.peach, label: 'Pending' };
}

function humanDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function humanDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-ZA', { weekday: 'long' });
}

// ─── Component ───
export default function ProjectCalendar() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cursor, setCursor] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Completed' | 'In Progress' | 'Pending' | 'Delayed'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | string>('all');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // ─── Fetch projects ───
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_URL}/api/projects`);
        setProjects(res.data || []);
      } catch (err: any) {
        console.error('Calendar fetch error:', err);
        setError('Could not load projects. Ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // ─── Flatten milestones ───
  const allEvents: CalendarEvent[] = useMemo(() => {
    const out: CalendarEvent[] = [];
    projects.forEach((p) => {
      (p.milestones || []).forEach((m, idx) => {
        const parsed = parseFlexibleDate(m.date);
        if (!parsed) return;
        out.push({
          id: `${p.id}-${idx}`,
          date: toISODate(parsed),
          name: m.name || 'Untitled milestone',
          status: m.status || 'Pending',
          projectId: p.id,
          projectTitle: p.title || 'Untitled project',
          projectDepartment: p.department,
          projectLocation: p.location,
        });
      });
    });
    return out;
  }, [projects]);

  // ─── Departments filter options ───
  const departments = useMemo(() => {
    const set = new Set<string>();
    allEvents.forEach((e) => e.projectDepartment && set.add(e.projectDepartment));
    return Array.from(set).sort();
  }, [allEvents]);

  // ─── Apply filters ───
  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEvents.filter((e) => {
      const mStatus =
        statusFilter === 'all' || statusTheme(e.status).label === statusFilter;
      const mDept =
        departmentFilter === 'all' || e.projectDepartment === departmentFilter;
      const mSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.projectTitle.toLowerCase().includes(q);
      return mStatus && mDept && mSearch;
    });
  }, [allEvents, search, statusFilter, departmentFilter]);

  // ─── Group events by ISO date ───
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [filteredEvents]);

  // ─── Month grid ───
  const monthGrid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ date: Date | null; iso: string | null }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, iso: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, iso: toISODate(date) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, iso: null });
    return cells;
  }, [cursor]);

  // ─── Stats for current month ───
  const monthStats = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const inMonth = filteredEvents.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const today = toISODate(new Date());
    return {
      total: inMonth.length,
      completed: inMonth.filter((e) => statusTheme(e.status).label === 'Completed').length,
      inProgress: inMonth.filter((e) => statusTheme(e.status).label === 'In Progress').length,
      overdue: inMonth.filter(
        (e) => statusTheme(e.status).label !== 'Completed' && e.date < today
      ).length,
    };
  }, [filteredEvents, cursor]);

  // ─── Navigation ───
  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const goToday = () => setCursor(new Date());

  const todayIso = toISODate(new Date());

  // ─── Upcoming + Overdue lists ───
  const overdueList = useMemo(() => {
    return [...filteredEvents]
      .filter((e) => e.date < todayIso && statusTheme(e.status).label !== 'Completed')
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEvents, todayIso]);

  const upcomingList = useMemo(() => {
    return [...filteredEvents]
      .filter((e) => e.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 60);
  }, [filteredEvents, todayIso]);

  const selectedDayEvents = selectedDay ? eventsByDate[selectedDay] || [] : [];

  // ─── Reusable: single row for list view ───
  const ListRow: React.FC<{ event: CalendarEvent }> = ({ event }) => {
    const th = statusTheme(event.status);
    return (
      <div className="pc-list-row">
        <div className="pc-list-date">
          {humanDate(event.date)}
          <small>{humanDay(event.date)}</small>
        </div>
        <div>
          <p className="pc-list-name">{event.name}</p>
          <div className="pc-list-proj">
            <MapPin size={11} strokeWidth={2.2} />
            {event.projectTitle}
            {event.projectDepartment && <span style={{ opacity: 0.6 }}> · {event.projectDepartment}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            className="pc-status-pill"
            style={{ background: th.bg, color: th.text }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: th.accent, marginRight: 2,
              }}
            />
            {th.label}
          </span>
        </div>
        <div className="pc-list-progress">
          <Clock size={12} strokeWidth={2.2} /> {humanDay(event.date)}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .pc-root {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          color: ${C.ink};
          padding: 4px 0 32px;
          -webkit-font-smoothing: antialiased;
        }

        .pc-head {
          display: flex; justify-content: space-between; align-items: center;
          gap: 20px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .pc-head-left { display: flex; align-items: center; gap: 14px; }
        .pc-head-mark {
          width: 46px; height: 46px; border-radius: 14px;
          background: linear-gradient(135deg, #b8a4d4, #7f9dc4);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 18px -6px rgba(184,164,212,0.5), inset 0 1px 0 rgba(255,255,255,0.6);
          color: #fff; flex-shrink: 0;
        }
        .pc-head-text h1 {
          font-family: 'Sora', sans-serif; font-size: 1.15rem;
          font-weight: 600; color: ${C.ink}; margin: 0;
          letter-spacing: -0.02em;
        }
        .pc-head-text p {
          font-size: 0.75rem; color: ${C.inkMuted}; margin: 3px 0 0;
        }

        .pc-view-toggle {
          display: inline-flex; align-items: center;
          background: ${C.glass}; backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          border-radius: 12px; padding: 4px;
          box-shadow: 0 4px 14px -8px rgba(80,90,130,0.2);
        }
        .pc-view-toggle button {
          border: none; background: transparent;
          padding: 8px 14px; border-radius: 9px;
          font-size: 0.78rem; font-weight: 600;
          font-family: inherit; color: ${C.inkSoft};
          cursor: pointer; display: inline-flex;
          align-items: center; gap: 6px;
          transition: all 0.22s ease;
        }
        .pc-view-toggle button.active {
          background: #fff; color: ${C.ink};
          box-shadow: 0 2px 8px -4px rgba(80,90,130,0.3);
        }

        .pc-toolbar {
          display: flex; gap: 12px; align-items: center;
          justify-content: space-between; flex-wrap: wrap;
          padding: 14px 18px; border-radius: 20px;
          background: ${C.glass}; backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 8px 24px -18px rgba(80,90,130,0.3);
          margin-bottom: 20px;
        }
        .pc-nav {
          display: flex; align-items: center; gap: 8px;
        }
        .pc-nav-title {
          font-family: 'Sora', sans-serif;
          font-size: 0.95rem; font-weight: 600;
          color: ${C.ink}; min-width: 165px; text-align: center;
          letter-spacing: -0.01em;
        }
        .pc-nav-btn {
          width: 32px; height: 32px; border-radius: 9px;
          border: 1px solid ${C.glassBorder};
          background: rgba(255,255,255,0.7);
          color: ${C.inkSoft}; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .pc-nav-btn:hover {
          background: #fff; color: ${C.ink};
          transform: translateY(-1px);
        }
        .pc-today-btn {
          padding: 8px 14px; border-radius: 10px;
          border: 1px solid ${C.glassBorder};
          background: rgba(255,255,255,0.7);
          font-size: 0.78rem; font-weight: 600;
          color: ${C.inkSoft}; font-family: inherit;
          cursor: pointer; transition: all 0.2s ease;
        }
        .pc-today-btn:hover { background: #fff; color: ${C.ink}; }

        .pc-filters {
          display: flex; align-items: center; gap: 10px;
          flex-wrap: wrap;
        }

        .pc-search {
          display: flex; align-items: center; gap: 9px;
          background: rgba(255,255,255,0.7);
          border: 1px solid ${C.glassBorder};
          border-radius: 11px; padding: 9px 14px;
          min-width: 220px; transition: all 0.2s ease;
        }
        .pc-search:focus-within {
          border-color: ${C.lavender.accent};
          box-shadow: 0 0 0 4px ${C.lavender.bg};
          background: #fff;
        }
        .pc-search input {
          border: none; background: transparent; outline: none;
          width: 100%; font-size: 0.82rem;
          color: ${C.ink}; font-family: inherit;
        }
        .pc-search input::placeholder { color: ${C.inkMuted}; }

        .pc-select {
          appearance: none;
          background: rgba(255,255,255,0.7);
          border: 1px solid ${C.glassBorder};
          border-radius: 11px;
          padding: 9px 32px 9px 14px;
          font-size: 0.8rem;
          color: ${C.ink};
          font-family: inherit;
          cursor: pointer; outline: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23a4a7b8' stroke-width='1.3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>");
          background-repeat: no-repeat;
          background-position: right 12px center;
          transition: all 0.2s ease;
        }
        .pc-select:hover { background-color: rgba(255,255,255,0.9); }
        .pc-select:focus { border-color: ${C.lavender.accent}; box-shadow: 0 0 0 4px ${C.lavender.bg}; }

        .pc-metrics {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 22px;
        }
        @media (max-width: 1100px) { .pc-metrics { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .pc-metrics { grid-template-columns: 1fr; } }

        .pc-metric {
          padding: 18px; border-radius: 18px;
          background: ${C.glass}; backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 10px 24px -20px rgba(80,90,130,0.3), inset 0 1px 0 rgba(255,255,255,0.75);
          display: flex; flex-direction: column; gap: 12px;
          transition: all 0.3s ease;
        }
        .pc-metric:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px -24px rgba(80,90,130,0.4);
        }
        .pc-metric-top { display: flex; align-items: center; justify-content: space-between; }
        .pc-metric-label {
          font-size: 0.65rem; letter-spacing: 0.14em;
          text-transform: uppercase; font-weight: 600;
          color: ${C.inkMuted};
        }
        .pc-metric-icon {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6);
        }
        .pc-metric-value {
          font-family: 'Sora', sans-serif; font-size: 1.5rem;
          font-weight: 600; color: ${C.ink}; line-height: 1.1;
          letter-spacing: -0.025em; font-variant-numeric: tabular-nums;
        }
        .pc-metric-foot {
          font-size: 0.7rem; color: ${C.inkSoft};
          display: flex; align-items: center; gap: 6px;
        }

        .pc-cal-card {
          background: ${C.glass}; backdrop-filter: blur(24px);
          border: 1px solid ${C.glassBorder};
          border-radius: 22px; overflow: hidden;
          box-shadow: 0 18px 44px -30px rgba(80,90,130,0.4), inset 0 1px 0 rgba(255,255,255,0.75);
        }

        .pc-weekdays {
          display: grid; grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid ${C.hairDark};
          background: rgba(255,255,255,0.35);
        }
        .pc-weekday {
          padding: 12px 14px;
          font-size: 0.65rem; letter-spacing: 0.14em;
          text-transform: uppercase; font-weight: 700;
          color: ${C.inkMuted};
          text-align: left;
        }

        .pc-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
        }
        .pc-day {
          min-height: 130px;
          padding: 10px 10px 8px;
          border-right: 1px solid ${C.hairDark};
          border-bottom: 1px solid ${C.hairDark};
          background: rgba(255,255,255,0.28);
          display: flex; flex-direction: column; gap: 6px;
          cursor: pointer; transition: all 0.2s ease;
          position: relative;
        }
        .pc-day:nth-child(7n) { border-right: none; }
        .pc-day:hover { background: rgba(255,255,255,0.65); }
        .pc-day.empty { cursor: default; background: rgba(250,250,252,0.4); }
        .pc-day.empty:hover { background: rgba(250,250,252,0.4); }

        .pc-day-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 6px;
        }
        .pc-day-num {
          font-family: 'Sora', sans-serif;
          font-size: 0.82rem; font-weight: 600;
          color: ${C.inkSoft};
          width: 24px; height: 24px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 8px;
        }
        .pc-day.today .pc-day-num {
          background: linear-gradient(135deg, ${C.lavender.accent}, ${C.sky.accent});
          color: #fff;
          box-shadow: 0 4px 10px -4px ${C.lavender.ring};
        }
        .pc-day-count {
          font-size: 0.62rem; font-weight: 700;
          letter-spacing: 0.05em;
          color: ${C.inkMuted};
          background: rgba(255,255,255,0.7);
          padding: 2px 7px; border-radius: 999px;
          border: 1px solid ${C.glassBorder};
        }

        .pc-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.68rem; font-weight: 500;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6);
        }
        .pc-chip .pc-dot {
          width: 6px; height: 6px; border-radius: 50%;
          flex-shrink: 0;
        }
        .pc-chip-more {
          font-size: 0.62rem; font-weight: 600;
          color: ${C.inkMuted};
          padding: 2px 6px;
        }

        .pc-list-wrap {
          background: ${C.glass}; backdrop-filter: blur(24px);
          border: 1px solid ${C.glassBorder};
          border-radius: 22px; padding: 22px;
          box-shadow: 0 18px 44px -30px rgba(80,90,130,0.4), inset 0 1px 0 rgba(255,255,255,0.75);
        }
        .pc-list-section-title {
          font-family: 'Sora', sans-serif;
          font-size: 0.95rem; font-weight: 600;
          color: ${C.ink}; margin: 0 0 14px;
          display: flex; align-items: center; gap: 9px;
        }
        .pc-list-section-title .badge {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.66rem; font-weight: 700;
          padding: 2px 9px; border-radius: 999px;
          background: rgba(255,255,255,0.6);
          border: 1px solid ${C.glassBorder};
          color: ${C.inkSoft};
        }

        .pc-list-row {
          display: grid;
          grid-template-columns: 130px 1fr 160px 130px;
          gap: 16px; align-items: center;
          padding: 14px 12px;
          border-radius: 14px;
          transition: background 0.2s ease;
        }
        .pc-list-row:hover { background: rgba(255,255,255,0.5); }
        .pc-list-row + .pc-list-row { border-top: 1px solid ${C.hairDark}; }

        @media (max-width: 900px) {
          .pc-list-row { grid-template-columns: 1fr; gap: 8px; }
        }

        .pc-list-date {
          font-family: 'Sora', sans-serif;
          font-size: 0.78rem; font-weight: 600;
          color: ${C.ink};
          letter-spacing: -0.01em;
        }
        .pc-list-date small {
          display: block; color: ${C.inkMuted};
          font-weight: 500; font-size: 0.65rem;
          letter-spacing: 0.05em; text-transform: uppercase;
          margin-top: 2px;
        }
        .pc-list-name {
          font-size: 0.85rem; font-weight: 600;
          color: ${C.ink}; margin: 0 0 3px;
        }
        .pc-list-proj {
          font-size: 0.72rem; color: ${C.inkSoft};
          display: flex; align-items: center; gap: 6px;
        }
        .pc-status-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 999px;
          font-size: 0.66rem; font-weight: 600;
          letter-spacing: 0.03em;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6);
          white-space: nowrap;
        }
        .pc-list-progress {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.72rem; color: ${C.inkSoft};
        }

        .pc-empty {
          text-align: center; padding: 60px 24px;
          color: ${C.inkSoft};
        }
        .pc-empty-icon {
          width: 56px; height: 56px; border-radius: 18px;
          background: ${C.lavender.bg}; color: ${C.lavender.text};
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }
        .pc-empty h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1rem; font-weight: 600;
          color: ${C.ink}; margin: 0 0 4px;
        }
        .pc-empty p { font-size: 0.82rem; margin: 0; }

        .pc-drawer-backdrop {
          position: fixed; inset: 0;
          background: rgba(30,35,55,0.28);
          backdrop-filter: blur(6px);
          z-index: 900;
          display: flex; justify-content: flex-end;
        }
        .pc-drawer {
          width: 420px; max-width: 92vw;
          height: 100vh;
          background: #ffffff;
          box-shadow: -20px 0 60px -20px rgba(60,70,110,0.4);
          border-left: 1px solid ${C.glassBorder};
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .pc-drawer-head {
          padding: 22px 24px;
          border-bottom: 1px solid ${C.hairDark};
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px;
        }
        .pc-drawer-title {
          font-family: 'Sora', sans-serif;
          font-size: 1rem; font-weight: 600;
          color: ${C.ink}; margin: 0 0 4px;
          letter-spacing: -0.01em;
        }
        .pc-drawer-sub {
          font-size: 0.76rem; color: ${C.inkSoft};
          display: flex; align-items: center; gap: 6px;
        }
        .pc-drawer-close {
          width: 32px; height: 32px; border-radius: 9px;
          border: 1px solid ${C.glassBorder};
          background: rgba(255,255,255,0.9);
          color: ${C.inkSoft}; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .pc-drawer-close:hover { background: ${C.rose.bg}; color: ${C.rose.text}; }

        .pc-drawer-body {
          flex: 1; overflow-y: auto;
          padding: 18px 20px 24px;
        }
        .pc-drawer-item {
          padding: 14px 16px;
          border-radius: 14px;
          background: ${C.glass};
          border: 1px solid ${C.glassBorder};
          margin-bottom: 10px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .pc-drawer-item .name {
          font-size: 0.86rem; font-weight: 600;
          color: ${C.ink};
        }
        .pc-drawer-item .project {
          font-size: 0.72rem; color: ${C.inkSoft};
          display: flex; align-items: center; gap: 6px;
        }

        .pc-loading {
          padding: 80px 24px; text-align: center;
          color: ${C.inkSoft}; font-size: 0.85rem;
        }
        .pc-error {
          padding: 24px; text-align: center;
          background: ${C.rose.bg}; color: ${C.rose.text};
          border: 1px solid ${C.rose.ring};
          border-radius: 14px; font-size: 0.85rem;
        }
      `}</style>

      <div className="pc-root">
        {/* Header */}
        <div className="pc-head">
          <div className="pc-head-left">
            <div className="pc-head-mark">
              <CalendarIcon size={22} strokeWidth={1.9} />
            </div>
            <div className="pc-head-text">
              <h1>Project Calendar</h1>
              <p>Milestones across all projects · deadlines, delays & completions.</p>
            </div>
          </div>

          <div className="pc-view-toggle">
            <button
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              <LayoutGrid size={13} strokeWidth={2.3} /> Month
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={13} strokeWidth={2.3} /> List
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="pc-toolbar">
          <div className="pc-nav">
            <button className="pc-nav-btn" onClick={goPrev} title="Previous month">
              <ChevronLeft size={15} strokeWidth={2.4} />
            </button>
            <div className="pc-nav-title">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </div>
            <button className="pc-nav-btn" onClick={goNext} title="Next month">
              <ChevronRight size={15} strokeWidth={2.4} />
            </button>
            <button className="pc-today-btn" onClick={goToday}>Today</button>
          </div>

          <div className="pc-filters">
            <div className="pc-search">
              <Search size={14} color={C.inkMuted} strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Search milestone or project…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="pc-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Delayed">Delayed</option>
            </select>

            <select
              className="pc-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as any)}
            >
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Metrics */}
        <div className="pc-metrics">
          <motion.div className="pc-metric"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pc-metric-top">
              <span className="pc-metric-label">This Month</span>
              <div className="pc-metric-icon" style={{ background: C.lavender.bg, color: C.lavender.text }}>
                <Sparkles size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="pc-metric-value">{monthStats.total}</div>
            <div className="pc-metric-foot">Milestones scheduled this month</div>
          </motion.div>

          <motion.div className="pc-metric"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <div className="pc-metric-top">
              <span className="pc-metric-label">Completed</span>
              <div className="pc-metric-icon" style={{ background: C.mint.bg, color: C.mint.text }}>
                <CheckCircle2 size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="pc-metric-value">{monthStats.completed}</div>
            <div className="pc-metric-foot" style={{ color: C.mint.text }}>
              Delivered on time
            </div>
          </motion.div>

          <motion.div className="pc-metric"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="pc-metric-top">
              <span className="pc-metric-label">In Progress</span>
              <div className="pc-metric-icon" style={{ background: C.sky.bg, color: C.sky.text }}>
                <Clock size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="pc-metric-value">{monthStats.inProgress}</div>
            <div className="pc-metric-foot" style={{ color: C.sky.text }}>
              Currently being worked on
            </div>
          </motion.div>

          <motion.div className="pc-metric"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="pc-metric-top">
              <span className="pc-metric-label">Overdue</span>
              <div className="pc-metric-icon" style={{ background: C.rose.bg, color: C.rose.text }}>
                <AlertTriangle size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="pc-metric-value">{monthStats.overdue}</div>
            <div className="pc-metric-foot" style={{ color: C.rose.text }}>
              Missed deadlines this month
            </div>
          </motion.div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="pc-loading">Loading calendar…</div>
        ) : error ? (
          <div className="pc-error">{error}</div>
        ) : allEvents.length === 0 ? (
          <div className="pc-list-wrap">
            <div className="pc-empty">
              <div className="pc-empty-icon">
                <CalendarIcon size={24} strokeWidth={1.8} />
              </div>
              <h3>No milestones scheduled yet</h3>
              <p>Add milestones to your projects and they will appear here.</p>
            </div>
          </div>
        ) : viewMode === 'month' ? (
          <div className="pc-cal-card">
            <div className="pc-weekdays">
              {DAYS_SHORT.map((d) => (
                <div key={d} className="pc-weekday">{d}</div>
              ))}
            </div>

            <div className="pc-grid">
              {monthGrid.map((cell, i) => {
                if (!cell.date || !cell.iso) {
                  return <div key={i} className="pc-day empty" />;
                }
                const events = eventsByDate[cell.iso] || [];
                const isToday = cell.iso === todayIso;
                return (
                  <div
                    key={i}
                    className={`pc-day ${isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDay(cell.iso!)}
                  >
                    <div className="pc-day-head">
                      <span className="pc-day-num">{cell.date.getDate()}</span>
                      {events.length > 0 && (
                        <span className="pc-day-count">{events.length}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0 }}>
                      {events.slice(0, 2).map((e) => {
                        const th = statusTheme(e.status);
                        return (
                          <div
                            key={e.id}
                            className="pc-chip"
                            style={{ background: th.bg, color: th.text }}
                            title={`${e.name} — ${e.projectTitle}`}
                          >
                            <span className="pc-dot" style={{ background: th.accent }} />
                            {e.name}
                          </div>
                        );
                      })}
                      {events.length > 2 && (
                        <span className="pc-chip-more">+{events.length - 2} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pc-list-wrap">
            {overdueList.length > 0 && (
              <>
                <h3 className="pc-list-section-title" style={{ color: C.rose.text }}>
                  <AlertTriangle size={15} strokeWidth={2.4} /> Overdue
                  <span className="badge">{overdueList.length}</span>
                </h3>
                {overdueList.map((e) => <ListRow key={e.id} event={e} />)}
                <div style={{ height: 24 }} />
              </>
            )}

            <h3 className="pc-list-section-title">
              <Clock size={15} strokeWidth={2.4} /> Upcoming
              <span className="badge">{upcomingList.length}</span>
            </h3>
            {upcomingList.length === 0 ? (
              <div className="pc-empty" style={{ padding: '40px 20px' }}>
                <p>No upcoming milestones.</p>
              </div>
            ) : (
              upcomingList.map((e) => <ListRow key={e.id} event={e} />)
            )}
          </div>
        )}
      </div>

      {/* Day Drawer */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            className="pc-drawer-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              className="pc-drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pc-drawer-head">
                <div>
                  <h2 className="pc-drawer-title">
                    {humanDate(selectedDay)}
                  </h2>
                  <div className="pc-drawer-sub">
                    <Clock size={12} strokeWidth={2.2} />
                    {humanDay(selectedDay)} · {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'milestone' : 'milestones'}
                  </div>
                </div>
                <button className="pc-drawer-close" onClick={() => setSelectedDay(null)}>
                  <X size={15} strokeWidth={2.4} />
                </button>
              </div>

              <div className="pc-drawer-body">
                {selectedDayEvents.length === 0 ? (
                  <div className="pc-empty" style={{ padding: '40px 10px' }}>
                    <div className="pc-empty-icon">
                      <CalendarIcon size={22} strokeWidth={1.8} />
                    </div>
                    <h3>Nothing scheduled</h3>
                    <p>No milestones on this day.</p>
                  </div>
                ) : (
                  selectedDayEvents.map((e) => {
                    const th = statusTheme(e.status);
                    return (
                      <div key={e.id} className="pc-drawer-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                          <div className="name">{e.name}</div>
                          <span
                            className="pc-status-pill"
                            style={{ background: th.bg, color: th.text }}
                          >
                            <span
                              style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: th.accent, marginRight: 2,
                              }}
                            />
                            {th.label}
                          </span>
                        </div>
                        <div className="project">
                          <MapPin size={11} strokeWidth={2.2} />
                          {e.projectTitle}
                          {e.projectDepartment && <span style={{ opacity: 0.6 }}> · {e.projectDepartment}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}