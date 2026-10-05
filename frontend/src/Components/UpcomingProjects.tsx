// components/UpcomingProjects.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Search, MapPin, Clock, Wallet, Calendar, TrendingUp, Target,
  Building2, HeartHandshake, CheckCircle2, AlertCircle,
  Landmark, FileText, Shield, GraduationCap, Sparkles, Leaf,
  Lightbulb, Briefcase, Handshake, Send, UserPlus, Layers,
  Activity, X, ArrowUpRight, RefreshCw
} from 'lucide-react';

const API_URL = 'http://localhost:8080';

interface UpcomingProject {
  id: number;
  referenceNumber?: string;
  title: string;
  category: string;
  department: string;
  ward: string;
  location: string;
  duration: string;
  estimatedBudget: number;
  scheduledStart: string;
  tenderStatus: string;
  description: string;
  communityImpact: string;
  status: string;
  issuer: string;
  govRef?: string;
  allocatingMinistry?: string;
  ngoPartner?: string;
  ngoRole?: string;
  currentStage?: number;
  stageDescription?: string;
  imageUrl?: string;
  tags?: string[];
}

export default function UpcomingProjects() {
  const [selectedWard, setSelectedWard] = useState<string>('All Wards');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'government' | 'ngo'>('all');
  const [sortBy, setSortBy] = useState<'budget' | 'duration' | 'startDate'>('budget');

  const [projectsList, setProjectsList] = useState<UpcomingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchUpcoming = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await axios.get(`${API_URL}/api/upcoming-projects`);
      setProjectsList(res.data || []);
    } catch (err) {
      console.error('Fetch upcoming projects error:', err);
      setFetchError('Could not load upcoming projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming();
  }, []);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(t);
  }, [notification]);

  const handleVolunteerJoin = (orgName: string) => {
    setNotification(`Registered to volunteer with ${orgName}. Coordinator details sent to your inbox.`);
  };

  const iconFor = (dept: string) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('infra')) return Building2;
    if (d.includes('educat')) return GraduationCap;
    if (d.includes('electric') || d.includes('energy')) return Lightbulb;
    if (d.includes('environ')) return Leaf;
    if (d.includes('park')) return Sparkles;
    if (d.includes('health')) return HeartHandshake;
    return Building2;
  };

  const colorFor = (dept: string) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('infra')) return '#7f9dc4';
    if (d.includes('educat')) return '#8fb89c';
    if (d.includes('electric') || d.includes('energy')) return '#e0b280';
    if (d.includes('environ')) return '#8fb89c';
    if (d.includes('park')) return '#b8a4d4';
    if (d.includes('health')) return '#d8a2b0';
    return '#7f9dc4';
  };

  const parseDuration = (dur: string) => {
    if (!dur) return 0;
    const m = dur.match(/(\d+)/);
    return m ? parseInt(m[1]) : 0;
  };

  const filteredProjects = useMemo(() => {
    return projectsList
      .filter((p) => {
        const matchesWard = selectedWard === 'All Wards' || p.ward === selectedWard;
        const matchesTab =
          activeTab === 'all' ||
          (activeTab === 'government' && p.category === 'Government Project') ||
          (activeTab === 'ngo' && p.category === 'NGO Initiative');
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          !q ||
          p.title?.toLowerCase().includes(q) ||
          p.department?.toLowerCase().includes(q) ||
          p.issuer?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q));
        return matchesWard && matchesSearch && matchesTab;
      })
      .sort((a, b) => {
        if (sortBy === 'budget') return (b.estimatedBudget || 0) - (a.estimatedBudget || 0);
        if (sortBy === 'duration') return parseDuration(b.duration) - parseDuration(a.duration);
        if (sortBy === 'startDate')
          return new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime();
        return 0;
      });
  }, [projectsList, selectedWard, activeTab, searchTerm, sortBy]);

  const wards = useMemo(() => {
    const set = new Set<string>();
    projectsList.forEach((p) => p.ward && set.add(p.ward));
    return ['All Wards', ...Array.from(set)];
  }, [projectsList]);

  const totalEstimatedCost = filteredProjects.reduce((a, c) => a + (c.estimatedBudget || 0), 0);
  const governmentProjects = filteredProjects.filter((p) => p.category === 'Government Project').length;
  const ngoProjects = filteredProjects.filter((p) => p.category === 'NGO Initiative').length;
  const highPriority = filteredProjects.filter((p) => p.communityImpact === 'High Priority').length;

  const formatCurrency = (n: number) => `R ${(n || 0).toLocaleString('en-ZA')}`;

  const ngoStages = [
    { num: 1, title: 'Compliance', desc: 'Valid NPO registration', icon: Shield },
    { num: 2, title: 'Proposal', desc: 'Monitor govt briefings', icon: FileText },
    { num: 3, title: 'Submission', desc: 'Apply with business plans', icon: Send },
    { num: 4, title: 'Evaluation', desc: 'Admin checks & reviews', icon: Search },
    { num: 5, title: 'Approval', desc: 'Sign service contracts', icon: CheckCircle2 },
  ];

  const C = {
    ink: '#2b2d3a',
    inkSoft: '#6a6d80',
    inkMuted: '#a4a7b8',
    glass: 'rgba(255,255,255,0.72)',
    glassBorder: 'rgba(255,255,255,0.9)',
    hair: 'rgba(255,255,255,0.7)',
    hairDark: 'rgba(160,165,190,0.14)',
    mint: { bg: '#e8f4ee', text: '#4a7a5c', accent: '#8fb89c', glow: 'rgba(143,184,156,0.35)' },
    lavender: { bg: '#eeeaf7', text: '#635a82', accent: '#b8a4d4', glow: 'rgba(184,164,212,0.35)' },
    peach: { bg: '#f8ecdf', text: '#8a5f3d', accent: '#e0b280', glow: 'rgba(224,178,128,0.35)' },
    sky: { bg: '#e5eef8', text: '#4f6888', accent: '#7f9dc4', glow: 'rgba(127,157,196,0.35)' },
    rose: { bg: '#f8e9ec', text: '#8a5566', accent: '#d8a2b0', glow: 'rgba(216,162,176,0.35)' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .ap-root {
          min-height: 100vh;
          background: #f4f5fa;
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          color: ${C.ink};
          position: relative;
          overflow-x: hidden;
          padding: 40px 24px 96px;
          -webkit-font-smoothing: antialiased;
        }

        .ap-root::before,
        .ap-root::after {
          content: '';
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }
        .ap-root::before {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(184,164,212,0.35), transparent 70%);
          top: -160px; left: -120px;
        }
        .ap-root::after {
          width: 620px; height: 620px;
          background: radial-gradient(circle, rgba(143,184,156,0.28), transparent 70%);
          bottom: -200px; right: -140px;
        }

        .ap-shell {
          position: relative;
          z-index: 1;
          max-width: 1160px;
          margin: 0 auto;
        }

        .ap-masthead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .ap-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ap-brand-mark {
          width: 46px; height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #c4d4e8, #b8a4d4);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px -6px rgba(184,164,212,0.5), inset 0 1px 0 rgba(255,255,255,0.6);
          color: #ffffff;
          flex-shrink: 0;
        }
        .ap-brand-text h1 {
          font-family: 'Sora', sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: ${C.ink};
          margin: 0;
          letter-spacing: -0.01em;
        }
        .ap-brand-text p {
          font-size: 0.72rem;
          color: ${C.inkMuted};
          margin: 2px 0 0;
          font-weight: 400;
        }

        .ap-pill-live {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: ${C.glass};
          backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          font-size: 0.72rem;
          color: ${C.inkSoft};
          font-weight: 500;
          box-shadow: 0 4px 14px -8px rgba(80,90,130,0.2);
        }
        .ap-pill-live .dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: ${C.mint.accent};
          box-shadow: 0 0 0 3px ${C.mint.bg};
          animation: ap-pulse 2.4s ease-in-out infinite;
        }
        @keyframes ap-pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .ap-hero {
          padding: 44px 40px 40px;
          border-radius: 28px;
          background: ${C.glass};
          backdrop-filter: blur(28px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 20px 50px -32px rgba(70,80,120,0.35), inset 0 1px 0 rgba(255,255,255,0.8);
          margin-bottom: 26px;
          position: relative;
          overflow: hidden;
        }
        .ap-hero::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(127,157,196,0.22), transparent 70%);
          filter: blur(20px);
        }
        .ap-hero-inner { position: relative; z-index: 1; }

        .ap-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${C.lavender.text};
          background: ${C.lavender.bg};
          padding: 6px 14px;
          border-radius: 999px;
          margin-bottom: 18px;
        }

        .ap-hero-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.9rem, 3.4vw, 2.65rem);
          font-weight: 600;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: ${C.ink};
          margin: 0 0 14px;
          max-width: 620px;
        }
        .ap-hero-title em {
          font-style: normal;
          background: linear-gradient(135deg, #7f9dc4, #b8a4d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ap-hero-sub {
          font-size: 0.96rem;
          line-height: 1.6;
          color: ${C.inkSoft};
          max-width: 540px;
          margin: 0 0 32px;
          font-weight: 400;
        }

        .ap-hero-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding-top: 24px;
          border-top: 1px solid ${C.hairDark};
        }
        @media (max-width: 720px) {
          .ap-hero-metrics { grid-template-columns: 1fr; }
          .ap-hero { padding: 30px 24px; }
        }
        .ap-metric {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.55);
          border: 1px solid ${C.glassBorder};
          transition: all 0.3s ease;
        }
        .ap-metric:hover {
          background: rgba(255,255,255,0.8);
          transform: translateY(-2px);
        }
        .ap-metric-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ap-metric-label {
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
          color: ${C.inkMuted};
        }
        .ap-metric-icon {
          width: 26px; height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ap-metric-value {
          font-family: 'Sora', sans-serif;
          font-size: 1.6rem;
          font-weight: 600;
          color: ${C.ink};
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .ap-metric-foot {
          font-size: 0.72rem;
          color: ${C.inkSoft};
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .ap-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 14px 18px;
          border-radius: 20px;
          background: ${C.glass};
          backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 8px 24px -18px rgba(80,90,130,0.3);
          margin-bottom: 30px;
        }

        .ap-tabs {
          display: inline-flex;
          gap: 4px;
          background: rgba(255,255,255,0.6);
          padding: 4px;
          border-radius: 14px;
          border: 1px solid ${C.glassBorder};
        }
        .ap-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 500;
          color: ${C.inkSoft};
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s ease;
        }
        .ap-tab:hover { color: ${C.ink}; }
        .ap-tab.active {
          background: #ffffff;
          color: ${C.ink};
          font-weight: 600;
          box-shadow: 0 4px 10px -6px rgba(80,90,130,0.3);
        }
        .ap-tab-count {
          font-size: 0.68rem;
          padding: 1px 7px;
          border-radius: 999px;
          background: ${C.lavender.bg};
          color: ${C.lavender.text};
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .ap-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .ap-select {
          appearance: none;
          background: rgba(255,255,255,0.7);
          border: 1px solid ${C.glassBorder};
          border-radius: 11px;
          padding: 9px 32px 9px 14px;
          font-size: 0.8rem;
          color: ${C.ink};
          font-family: inherit;
          cursor: pointer;
          outline: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23a4a7b8' stroke-width='1.3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>");
          background-repeat: no-repeat;
          background-position: right 12px center;
          transition: all 0.2s ease;
        }
        .ap-select:hover { background-color: rgba(255,255,255,0.9); }
        .ap-select:focus {
          border-color: ${C.lavender.accent};
          box-shadow: 0 0 0 4px ${C.lavender.bg};
        }

        .ap-search {
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(255,255,255,0.7);
          border: 1px solid ${C.glassBorder};
          border-radius: 11px;
          padding: 9px 14px;
          min-width: 240px;
          transition: all 0.2s ease;
        }
        .ap-search:focus-within {
          border-color: ${C.lavender.accent};
          box-shadow: 0 0 0 4px ${C.lavender.bg};
          background: #ffffff;
        }
        .ap-search input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.82rem;
          color: ${C.ink};
          font-family: inherit;
        }
        .ap-search input::placeholder { color: ${C.inkMuted}; }

        .ap-list { display: flex; flex-direction: column; gap: 18px; }

        .ap-card {
          border-radius: 24px;
          background: ${C.glass};
          backdrop-filter: blur(24px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 14px 36px -28px rgba(70,80,120,0.35), inset 0 1px 0 rgba(255,255,255,0.75);
          overflow: hidden;
          display: grid;
          grid-template-columns: 260px 1fr;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ap-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 54px -30px rgba(70,80,120,0.4);
        }
        @media (max-width: 860px) {
          .ap-card { grid-template-columns: 1fr; }
        }

        .ap-card-media {
          position: relative;
          min-height: 240px;
          overflow: hidden;
          background: #e6e8ef;
        }
        .ap-card-media img {
          width: 100%; height: 100%;
          object-fit: cover;
          filter: saturate(0.9);
          transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ap-card:hover .ap-card-media img { transform: scale(1.05); }

        .ap-priority {
          position: absolute;
          top: 14px; left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.66rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          color: ${C.ink};
          box-shadow: 0 4px 14px -6px rgba(30,40,70,0.25);
        }
        .ap-priority .dot {
          width: 6px; height: 6px; border-radius: 50%;
        }

        .ap-card-body {
          padding: 24px 26px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        .ap-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          flex-wrap: wrap;
        }
        .ap-card-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.15rem;
          font-weight: 600;
          line-height: 1.3;
          letter-spacing: -0.015em;
          color: ${C.ink};
          margin: 0 0 6px;
        }
        .ap-card-sub {
          font-size: 0.78rem;
          color: ${C.inkSoft};
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .ap-card-sub .dot-sep {
          width: 3px; height: 3px; border-radius: 50%;
          background: ${C.inkMuted};
        }

        .ap-kind {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 6px 12px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .ap-kind.gov { background: ${C.sky.bg}; color: ${C.sky.text}; }
        .ap-kind.ngo { background: ${C.mint.bg}; color: ${C.mint.text}; }

        .ap-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .ap-tag {
          font-size: 0.68rem;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(255,255,255,0.7);
          border: 1px solid ${C.glassBorder};
          color: ${C.inkSoft};
          font-weight: 500;
        }

        .ap-desc {
          font-size: 0.87rem;
          line-height: 1.65;
          color: ${C.inkSoft};
          margin: 0;
          font-weight: 400;
        }

        .ap-issuer {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(255,255,255,0.55);
          border: 1px solid ${C.glassBorder};
        }
        .ap-issuer-mark {
          width: 34px; height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ap-issuer-mark.gov { background: ${C.sky.bg}; color: ${C.sky.text}; }
        .ap-issuer-mark.ngo { background: ${C.mint.bg}; color: ${C.mint.text}; }
        .ap-issuer-body { min-width: 0; flex: 1; }
        .ap-issuer-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: ${C.ink};
        }
        .ap-issuer-meta {
          font-size: 0.72rem;
          color: ${C.inkMuted};
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 2px;
        }
        .ap-issuer-meta code {
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 0.68rem;
          background: rgba(255,255,255,0.8);
          padding: 1px 6px;
          border-radius: 5px;
          color: ${C.inkSoft};
        }

        .ap-facts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
        }
        .ap-fact {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.5);
          border: 1px solid ${C.glassBorder};
          transition: all 0.25s ease;
        }
        .ap-fact:hover { background: rgba(255,255,255,0.8); }
        .ap-fact-label {
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 600;
          color: ${C.inkMuted};
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 6px;
        }
        .ap-fact-value {
          font-size: 0.85rem;
          font-weight: 500;
          color: ${C.ink};
          font-variant-numeric: tabular-nums;
          line-height: 1.35;
        }
        .ap-fact-value.highlight {
          font-family: 'Sora', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .ap-tracker {
          border-radius: 16px;
          background: rgba(255,255,255,0.55);
          border: 1px solid ${C.glassBorder};
          padding: 16px 18px;
        }
        .ap-tracker-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .ap-tracker-title {
          font-size: 0.72rem;
          font-weight: 600;
          color: ${C.mint.text};
          display: inline-flex;
          align-items: center;
          gap: 7px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .ap-tracker-stage {
          font-size: 0.72rem;
          color: ${C.inkMuted};
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .ap-stages {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        @media (max-width: 640px) {
          .ap-stages { grid-template-columns: repeat(auto-fit, minmax(70px, 1fr)); }
        }
        .ap-stage {
          padding: 10px 6px;
          border-radius: 12px;
          background: rgba(255,255,255,0.55);
          border: 1px solid ${C.glassBorder};
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 0.62rem;
          color: ${C.inkMuted};
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .ap-stage.completed {
          background: ${C.mint.bg};
          border-color: transparent;
          color: ${C.mint.text};
        }
        .ap-stage.current {
          background: ${C.mint.accent};
          border-color: ${C.mint.accent};
          color: #ffffff;
          box-shadow: 0 6px 16px -6px ${C.mint.glow};
        }

        .ap-progress {
          height: 4px;
          border-radius: 999px;
          background: rgba(160,165,190,0.18);
          overflow: hidden;
        }
        .ap-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, ${C.mint.accent}, ${C.mint.text});
          transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ap-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding-top: 6px;
          border-top: 1px solid ${C.hairDark};
          font-size: 0.75rem;
          color: ${C.inkMuted};
        }
        .ap-foot-left {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 500;
        }

        .ap-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, ${C.mint.accent}, ${C.mint.text});
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          box-shadow: 0 8px 20px -10px ${C.mint.glow};
          transition: all 0.25s ease;
        }
        .ap-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px -10px ${C.mint.glow};
        }
        .ap-cta svg { transition: transform 0.25s ease; }
        .ap-cta:hover svg { transform: translate(2px, -2px); }

        .ap-empty {
          text-align: center;
          padding: 80px 24px;
          border-radius: 24px;
          background: ${C.glass};
          backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          color: ${C.inkSoft};
        }
        .ap-empty-icon {
          width: 60px; height: 60px;
          border-radius: 18px;
          background: ${C.lavender.bg};
          color: ${C.lavender.text};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .ap-empty h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: ${C.ink};
          margin: 0 0 6px;
        }
        .ap-empty p { font-size: 0.85rem; margin: 0; }

        .ap-loading {
          padding: 60px;
          text-align: center;
          color: ${C.inkSoft};
          font-size: 0.9rem;
        }

        .ap-error {
          padding: 20px;
          text-align: center;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 14px;
          color: #b91c1c;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .ap-error button {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #fecaca;
          background: #fff;
          color: #b91c1c;
          cursor: pointer;
          font-size: 0.78rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: inherit;
        }
        .ap-error button:hover { background: #fef2f2; }

        .ap-toast {
          position: fixed;
          top: 24px; left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 20px;
          border-radius: 999px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          border: 1px solid ${C.glassBorder};
          box-shadow: 0 20px 44px -20px rgba(70,80,120,0.4);
          font-size: 0.83rem;
          color: ${C.ink};
          font-weight: 500;
          z-index: 999;
          max-width: 90vw;
        }
        .ap-toast-icon {
          width: 26px; height: 26px;
          border-radius: 50%;
          background: ${C.mint.bg};
          color: ${C.mint.text};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ap-toast button {
          background: none;
          border: none;
          color: ${C.inkMuted};
          cursor: pointer;
          display: flex;
          padding: 0;
          margin-left: 4px;
        }
      `}</style>

      <div className="ap-root">
        <div className="ap-shell">

          <div className="ap-masthead">
            <div className="ap-brand">
              <div className="ap-brand-mark">
                <Sparkles size={22} strokeWidth={1.8} />
              </div>
              <div className="ap-brand-text">
                <h1>GCPTS · Community Pipeline</h1>
                <p>Northern Cape transparency portal</p>
              </div>
            </div>
            <div className="ap-pill-live">
              <span className="dot" />
              Live · {projectsList.length} projects synced
            </div>
          </div>

          <motion.section
            className="ap-hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ap-hero-inner">
              <span className="ap-eyebrow">
                <Activity size={12} strokeWidth={2.2} />
                Regional Project Overview
              </span>
              <h2 className="ap-hero-title">
                Tracking what's being built in <em>your community</em>.
              </h2>
              <p className="ap-hero-sub">
                Every infrastructure and civil society initiative across the province — with live approval stages, budgets, and locations.
              </p>

              <div className="ap-hero-metrics">
                <div className="ap-metric">
                  <div className="ap-metric-top">
                    <span className="ap-metric-label">Initiatives</span>
                    <div className="ap-metric-icon" style={{ background: C.sky.bg, color: C.sky.text }}>
                      <Layers size={14} strokeWidth={2.2} />
                    </div>
                  </div>
                  <div className="ap-metric-value">{filteredProjects.length}</div>
                  <div className="ap-metric-foot">
                    <Building2 size={12} /> {governmentProjects} gov · {ngoProjects} NGO
                  </div>
                </div>

                <div className="ap-metric">
                  <div className="ap-metric-top">
                    <span className="ap-metric-label">Financial scope</span>
                    <div className="ap-metric-icon" style={{ background: C.mint.bg, color: C.mint.text }}>
                      <Wallet size={14} strokeWidth={2.2} />
                    </div>
                  </div>
                  <div className="ap-metric-value">{formatCurrency(totalEstimatedCost)}</div>
                  <div className="ap-metric-foot" style={{ color: C.mint.text }}>
                    <TrendingUp size={12} /> Combined budget
                  </div>
                </div>

                <div className="ap-metric">
                  <div className="ap-metric-top">
                    <span className="ap-metric-label">High priority</span>
                    <div className="ap-metric-icon" style={{ background: C.peach.bg, color: C.peach.text }}>
                      <Target size={14} strokeWidth={2.2} />
                    </div>
                  </div>
                  <div className="ap-metric-value">{highPriority}</div>
                  <div className="ap-metric-foot" style={{ color: C.peach.text }}>
                    <AlertCircle size={12} /> Urgent attention
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.div
            className="ap-controls"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <div className="ap-tabs">
              {[
                { id: 'all', label: 'All', icon: Layers },
                { id: 'government', label: 'Government', icon: Landmark },
                { id: 'ngo', label: 'NGO', icon: HeartHandshake },
              ].map((t) => {
                const I = t.icon;
                return (
                  <button
                    key={t.id}
                    className={`ap-tab ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id as typeof activeTab)}
                  >
                    <I size={13} strokeWidth={2.2} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="ap-filters">
              <select className="ap-select" value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
                {wards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>

              <select className="ap-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <option value="budget">Sort · Budget</option>
                <option value="duration">Sort · Duration</option>
                <option value="startDate">Sort · Start</option>
              </select>

              <div className="ap-search">
                <Search size={14} color={C.inkMuted} strokeWidth={2.2} />
                <input
                  type="text"
                  placeholder="Search projects, NGOs, wards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          <div className="ap-list">
            {loading ? (
              <div className="ap-loading">
                <RefreshCw size={20} style={{ animation: 'ap-spin 1s linear infinite', marginBottom: 8 }} />
                <div>Loading upcoming projects…</div>
                <style>{`@keyframes ap-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : fetchError ? (
              <div className="ap-error">
                <AlertCircle size={16} />
                {fetchError}
                <button onClick={fetchUpcoming}>
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredProjects.length === 0 ? (
                  <motion.div
                    className="ap-empty"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="ap-empty-icon">
                      <Search size={26} strokeWidth={1.8} />
                    </div>
                    <h3>No initiatives found</h3>
                    <p>Try adjusting your filters or search criteria.</p>
                  </motion.div>
                ) : (
                  filteredProjects.map((project, i) => {
                    const isGov = project.category === 'Government Project';
                    const Icon = iconFor(project.department);
                    const projColor = colorFor(project.department);
                    const tone = isGov ? C.sky : C.mint;
                    const imageSrc = project.imageUrl
                      ? (project.imageUrl.startsWith('http') ? project.imageUrl : `${API_URL}${project.imageUrl}`)
                      : 'https://images.unsplash.com/photo-1541888946425-d0fbb18f86f6?auto=format&fit=crop&w=600&q=80';

                    return (
                      <motion.article
                        key={project.id}
                        layout
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className="ap-card"
                      >
                        <div className="ap-card-media">
                          <img src={imageSrc} alt={project.title} loading="lazy" />
                          <div className="ap-priority">
                            <span
                              className="dot"
                              style={{
                                background: project.communityImpact === 'High Priority'
                                  ? C.rose.accent
                                  : C.peach.accent,
                              }}
                            />
                            {project.communityImpact}
                          </div>
                        </div>

                        <div className="ap-card-body">
                          <div className="ap-card-head">
                            <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                              <h3 className="ap-card-title">{project.title}</h3>
                              <div className="ap-card-sub">
                                <Icon size={12} style={{ color: projColor }} />
                                {project.department}
                                <span className="dot-sep" />
                                {project.ward}
                              </div>
                            </div>
                            <span className={`ap-kind ${isGov ? 'gov' : 'ngo'}`}>
                              {isGov ? <Landmark size={12} strokeWidth={2.2} /> : <HeartHandshake size={12} strokeWidth={2.2} />}
                              {isGov ? 'Government' : 'NGO'}
                            </span>
                          </div>

                          {project.tags && project.tags.length > 0 && (
                            <div className="ap-tags">
                              {project.tags.map((tag) => (
                                <span key={tag} className="ap-tag">{tag}</span>
                              ))}
                            </div>
                          )}

                          <div className="ap-issuer">
                            <div className={`ap-issuer-mark ${isGov ? 'gov' : 'ngo'}`}>
                              {isGov ? <Landmark size={16} strokeWidth={2} /> : <HeartHandshake size={16} strokeWidth={2} />}
                            </div>
                            <div className="ap-issuer-body">
                              <div className="ap-issuer-name">{project.issuer}</div>
                              <div className="ap-issuer-meta">
                                {isGov ? (
                                  <>
                                    {project.govRef && <span><FileText size={11} /> Ref <code>{project.govRef}</code></span>}
                                    {project.allocatingMinistry && <span><Briefcase size={11} /> {project.allocatingMinistry}</span>}
                                  </>
                                ) : (
                                  project.ngoRole && <span><Handshake size={11} /> {project.ngoRole}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="ap-desc">{project.description}</p>

                          {!isGov && project.currentStage && (
                            <div className="ap-tracker">
                              <div className="ap-tracker-head">
                                <span className="ap-tracker-title">
                                  <Activity size={12} strokeWidth={2.4} /> Funding approval progress
                                </span>
                                <span className="ap-tracker-stage">Stage {project.currentStage} of 5</span>
                              </div>
                              <div className="ap-stages">
                                {ngoStages.map((s) => {
                                  const SIcon = s.icon;
                                  const completed = s.num < project.currentStage!;
                                  const current = s.num === project.currentStage;
                                  return (
                                    <div
                                      key={s.num}
                                      className={`ap-stage ${completed ? 'completed' : ''} ${current ? 'current' : ''}`}
                                      title={s.desc}
                                    >
                                      <SIcon size={13} strokeWidth={2.2} />
                                      <span>{s.title}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="ap-progress">
                                <div
                                  className="ap-progress-fill"
                                  style={{ width: `${(project.currentStage! / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="ap-facts">
                            <div className="ap-fact">
                              <div className="ap-fact-label"><MapPin size={10} strokeWidth={2.4} /> Location</div>
                              <div className="ap-fact-value">{project.location}</div>
                            </div>
                            <div className="ap-fact">
                              <div className="ap-fact-label"><Clock size={10} strokeWidth={2.4} /> Duration</div>
                              <div className="ap-fact-value highlight" style={{ color: C.sky.text }}>{project.duration}</div>
                            </div>
                            <div className="ap-fact">
                              <div className="ap-fact-label"><Wallet size={10} strokeWidth={2.4} /> Budget</div>
                              <div className="ap-fact-value highlight" style={{ color: C.mint.text }}>{formatCurrency(project.estimatedBudget)}</div>
                            </div>
                            <div className="ap-fact">
                              <div className="ap-fact-label"><Calendar size={10} strokeWidth={2.4} /> Start</div>
                              <div className="ap-fact-value">{project.scheduledStart}</div>
                            </div>
                          </div>

                          <div className="ap-foot">
                            <span className="ap-foot-left">
                              {isGov ? (
                                <>
                                  <Shield size={12} strokeWidth={2.2} style={{ color: tone.accent }} />
                                  {project.tenderStatus}
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={12} strokeWidth={2.2} style={{ color: C.mint.accent }} />
                                  Verified civil society program
                                </>
                              )}
                            </span>

                            {!isGov && (
                              <motion.button
                                className="ap-cta"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleVolunteerJoin(project.issuer)}
                              >
                                <UserPlus size={14} strokeWidth={2.2} />
                                Join initiative
                                <ArrowUpRight size={13} strokeWidth={2.4} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        <AnimatePresence>
          {notification && (
            <motion.div
              className="ap-toast"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="ap-toast-icon">
                <CheckCircle2 size={14} strokeWidth={2.4} />
              </span>
              {notification}
              <button onClick={() => setNotification(null)}>
                <X size={14} strokeWidth={2.4} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}