import React, { useEffect, useRef, useState, useCallback } from 'react';

interface WelcomePageProps {
  onDone: () => void;
}

export default function WelcomePage({ onDone }: WelcomePageProps) {
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const leavingRef = useRef(false);
  const onDoneRef = useRef(onDone);

  const DURATION = 7000;

  // Keep onDone ref fresh without re-triggering effects
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const handleContinue = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);

    setTimeout(() => {
      onDoneRef.current();
    }, 800);
  }, []);

  useEffect(() => {
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      setProgress(p);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        handleContinue();
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [handleContinue]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');

        html,
        body,
        #root {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }

        * {
          box-sizing: border-box;
        }

        .gcpts-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          overflow: hidden;
          background: #f4f0e8;
          color: #211d1a;
          font-family: 'Inter', sans-serif;
          transition: opacity 0.8s cubic-bezier(.65,0,.35,1);
        }

        .gcpts-root.leaving {
          opacity: 0;
          pointer-events: none;
        }

        /* =========================
           BACKGROUND
        ========================= */

        .gcpts-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .gcpts-gradient {
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(
              circle 650px at 15% 20%,
              rgba(245, 158, 11, .24),
              transparent 65%
            ),
            radial-gradient(
              circle 650px at 85% 80%,
              rgba(190, 24, 93, .14),
              transparent 65%
            ),
            radial-gradient(
              circle 500px at 65% 15%,
              rgba(124, 58, 237, .12),
              transparent 65%
            );
          filter: blur(70px);
          animation: backgroundMove 18s ease-in-out infinite alternate;
        }

        @keyframes backgroundMove {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(2%, -2%, 0) scale(1.04);
          }

          100% {
            transform: translate3d(-2%, 2%, 0) scale(1.08);
          }
        }

        .gcpts-grid {
          position: absolute;
          inset: 0;
          opacity: .28;
          background-image:
            linear-gradient(
              rgba(33, 29, 26, .055) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(33, 29, 26, .055) 1px,
              transparent 1px
            );
          background-size: 55px 55px;
          mask-image: radial-gradient(
            ellipse 75% 75% at 75% 50%,
            black,
            transparent 80%
          );
          -webkit-mask-image: radial-gradient(
            ellipse 75% 75% at 75% 50%,
            black,
            transparent 80%
          );
        }

        .gcpts-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(
            circle,
            rgba(33, 29, 26, .12) 1px,
            transparent 1.5px
          );
          background-size: 22px 22px;
          mask-image: radial-gradient(
            ellipse 70% 70% at 80% 50%,
            black,
            transparent 80%
          );
          -webkit-mask-image: radial-gradient(
            ellipse 70% 70% at 80% 50%,
            black,
            transparent 80%
          );
        }

        .gcpts-noise {
          position: absolute;
          inset: 0;
          opacity: .14;
          pointer-events: none;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .gcpts-bg-word {
          position: absolute;
          left: -3%;
          bottom: -8%;
          font-family: 'Instrument Serif', serif;
          font-size: clamp(180px, 31vw, 450px);
          line-height: .75;
          letter-spacing: -.06em;
          color: rgba(33, 29, 26, .035);
          white-space: nowrap;
          user-select: none;
          pointer-events: none;
        }

        /* =========================
           LAYOUT
        ========================= */

        .gcpts-layout {
          position: relative;
          z-index: 5;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: clamp(35px, 5vw, 85px);
          padding: 42px clamp(30px, 5vw, 80px);
          align-items: center;
        }

        /* =========================
           LEFT SIDE
        ========================= */

        .gcpts-left {
          height: 100%;
          max-height: 780px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 18px 0;
        }

        .gcpts-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          opacity: 0;
          animation: fadeDown .9s cubic-bezier(.22,1,.36,1) .15s forwards;
        }

        .gcpts-logo {
          width: 45px;
          height: 45px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #211d1a;
          color: #fbbf24;
          box-shadow: 0 18px 35px -15px rgba(33,29,26,.45);
          position: relative;
          overflow: hidden;
        }

        .gcpts-logo::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 20%,
            rgba(255,255,255,.3),
            transparent 80%
          );
          transform: translateX(-100%);
          animation: shine 4s ease-in-out infinite;
        }

        @keyframes shine {
          0%, 65% {
            transform: translateX(-100%);
          }

          80%, 100% {
            transform: translateX(100%);
          }
        }

        .gcpts-brand-name {
          font-family: 'Instrument Serif', serif;
          font-size: 25px;
          line-height: 1;
        }

        .gcpts-brand-sub {
          margin-top: 4px;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(33,29,26,.48);
        }

        .gcpts-hero {
          margin: auto 0;
          padding: 35px 0;
        }

        .gcpts-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 13px;
          margin-bottom: 25px;
          border: 1px solid rgba(33,29,26,.09);
          border-radius: 999px;
          background: rgba(255,255,255,.56);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: rgba(33,29,26,.65);
          opacity: 0;
          animation: fadeUp .8s cubic-bezier(.22,1,.36,1) .7s forwards;
        }

        .gcpts-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 4px rgba(22,163,74,.13);
          animation: livePulse 2s ease-in-out infinite;
        }

        @keyframes livePulse {
          50% {
            transform: scale(1.35);
            opacity: .7;
          }
        }

        .gcpts-title {
          margin: 0;
          font-family: 'Instrument Serif', serif;
          font-weight: 400;
          font-size: clamp(54px, 6.8vw, 105px);
          line-height: .91;
          letter-spacing: -.045em;
          color: #211d1a;
        }

        .gcpts-title-line {
          display: block;
          overflow: hidden;
          padding-bottom: .05em;
        }

        .gcpts-title-inner {
          display: inline-block;
          opacity: 0;
          transform: translateY(110%);
          animation: titleReveal 1.05s cubic-bezier(.76,0,.24,1) forwards;
        }

        @keyframes titleReveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .gcpts-title em {
          font-style: italic;
          background: linear-gradient(
            120deg,
            #d97706,
            #ea580c 35%,
            #be185d 70%,
            #7c3aed
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textGradient 6s ease-in-out infinite;
        }

        @keyframes textGradient {
          0%, 100% {
            background-position: 0 50%;
          }

          50% {
            background-position: 100% 50%;
          }
        }

        .gcpts-description {
          max-width: 490px;
          margin: 28px 0 38px;
          font-size: 15.5px;
          line-height: 1.7;
          color: rgba(33,29,26,.64);
          opacity: 0;
          animation: fadeUp 1s cubic-bezier(.22,1,.36,1) 2s forwards;
        }

        @keyframes fadeDown {
          from {
            opacity: 0;
            transform: translateY(-15px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* =========================
           BUTTONS
        ========================= */

        .gcpts-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          opacity: 0;
          animation: fadeUp 1s cubic-bezier(.22,1,.36,1) 2.45s forwards;
        }

        .gcpts-primary,
        .gcpts-secondary {
          border: 0;
          cursor: pointer;
          font-family: inherit;
          transition: .35s cubic-bezier(.22,1,.36,1);
        }

        .gcpts-primary {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          padding: 17px 27px;
          border-radius: 999px;
          background: #211d1a;
          color: white;
          font-size: 14px;
          box-shadow: 0 18px 40px -17px rgba(33,29,26,.55);
          position: relative;
          overflow: hidden;
        }

        .gcpts-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          background: linear-gradient(
            120deg,
            #f59e0b,
            #ea580c,
            #be185d,
            #7c3aed
          );
          background-size: 200% 200%;
          animation: textGradient 4s ease infinite;
          transition: opacity .35s ease;
        }

        .gcpts-primary:hover::before {
          opacity: 1;
        }

        .gcpts-primary > * {
          position: relative;
          z-index: 2;
        }

        .gcpts-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 50px -18px rgba(190,24,93,.5);
        }

        .gcpts-primary:hover svg {
          transform: translateX(5px);
        }

        .gcpts-primary svg {
          transition: transform .35s ease;
        }

        .gcpts-secondary {
          padding: 17px 23px;
          border-radius: 999px;
          border: 1px solid rgba(33,29,26,.12);
          background: rgba(255,255,255,.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          color: #211d1a;
          font-size: 14px;
        }

        .gcpts-secondary:hover {
          background: rgba(255,255,255,.9);
          transform: translateY(-3px);
          box-shadow: 0 15px 35px -18px rgba(33,29,26,.3);
        }

        /* =========================
           STATS
        ========================= */

        .gcpts-stats {
          display: flex;
          align-items: center;
          gap: 28px;
          padding-top: 23px;
          border-top: 1px solid rgba(33,29,26,.1);
          opacity: 0;
          animation: fadeUp 1s cubic-bezier(.22,1,.36,1) 3s forwards;
        }

        .gcpts-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .gcpts-stat-value {
          font-family: 'Instrument Serif', serif;
          font-size: 25px;
          line-height: 1;
        }

        .gcpts-stat-value span {
          color: #d97706;
          font-style: italic;
        }

        .gcpts-stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(33,29,26,.46);
        }

        .gcpts-divider {
          width: 1px;
          height: 30px;
          background: rgba(33,29,26,.12);
        }

        /* =========================
           RIGHT VISUAL
        ========================= */

        .gcpts-right {
          position: relative;
          height: 100%;
          max-height: 780px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gcpts-scene {
          position: relative;
          width: min(100%, 550px);
          aspect-ratio: 4 / 5;
        }

        .gcpts-scene-glow {
          position: absolute;
          width: 75%;
          height: 75%;
          left: 12%;
          top: 13%;
          border-radius: 50%;
          background: rgba(245,158,11,.16);
          filter: blur(65px);
          animation: sceneGlow 6s ease-in-out infinite alternate;
        }

        @keyframes sceneGlow {
          from {
            transform: scale(.9);
          }

          to {
            transform: scale(1.08);
          }
        }

        /* =========================
           MAIN VISUAL CARD
        ========================= */

        .gcpts-main-card {
          position: absolute;
          inset: 5% 5% 7% 5%;
          border-radius: 35px;
          overflow: hidden;
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.95),
              rgba(250,245,236,.9)
            );
          border: 1px solid rgba(33,29,26,.08);
          box-shadow:
            0 2px 0 rgba(255,255,255,.95) inset,
            0 45px 90px -35px rgba(33,29,26,.4),
            0 20px 40px -25px rgba(33,29,26,.22);
          opacity: 0;
          transform: translateY(40px) scale(.95) rotate(1deg);
          animation: cardEnter 1.35s cubic-bezier(.22,1,.36,1) .35s forwards;
        }

        @keyframes cardEnter {
          to {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(1deg);
          }
        }

        .gcpts-map {
          position: absolute;
          inset: 0;
          opacity: .35;
          background-image:
            linear-gradient(
              30deg,
              rgba(33,29,26,.06) 12%,
              transparent 12.5%,
              transparent 87%,
              rgba(33,29,26,.06) 87.5%
            ),
            linear-gradient(
              150deg,
              rgba(33,29,26,.05) 12%,
              transparent 12.5%,
              transparent 87%,
              rgba(33,29,26,.05) 87.5%
            );
          background-size: 70px 120px;
        }

        /* =========================
           CITY
        ========================= */

        .gcpts-city {
          position: absolute;
          left: 10%;
          right: 10%;
          top: 19%;
          bottom: 17%;
        }

        .gcpts-ground {
          position: absolute;
          left: -10%;
          right: -10%;
          bottom: 0;
          height: 48%;
          background:
            linear-gradient(
              145deg,
              #eadfce,
              #d9c9b3
            );
          clip-path: polygon(
            0 35%,
            100% 0,
            100% 100%,
            0 100%
          );
          border-radius: 20px;
        }

        .gcpts-road {
          position: absolute;
          left: -10%;
          right: -10%;
          bottom: 9%;
          height: 70px;
          transform: rotate(-10deg);
          background: #57504a;
          box-shadow: 0 12px 25px rgba(33,29,26,.18);
        }

        .gcpts-road::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 3px;
          background: repeating-linear-gradient(
            90deg,
            #f7d774 0 28px,
            transparent 28px 55px
          );
        }

        .gcpts-building {
          position: absolute;
          bottom: 22%;
          left: 17%;
          width: 29%;
          height: 42%;
          background: linear-gradient(
            135deg,
            #f7f1e8,
            #ded4c6
          );
          border: 1px solid rgba(33,29,26,.08);
          box-shadow: 13px 16px 25px rgba(33,29,26,.14);
          transform: skewY(-3deg);
        }

        .gcpts-building::before {
          content: '';
          position: absolute;
          left: 12%;
          right: 12%;
          top: 12%;
          height: 70%;
          background:
            repeating-linear-gradient(
              90deg,
              rgba(217,119,6,.45) 0 8px,
              transparent 8px 18px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(33,29,26,.08) 0 8px,
              transparent 8px 18px
            );
          opacity: .65;
        }

        .gcpts-building-top {
          position: absolute;
          left: -5%;
          top: -9%;
          width: 110%;
          height: 15px;
          border-radius: 4px;
          background: #211d1a;
        }

        .gcpts-small-building {
          position: absolute;
          right: 17%;
          bottom: 29%;
          width: 22%;
          height: 30%;
          background: linear-gradient(
            135deg,
            #c9bca9,
            #a99a86
          );
          box-shadow: 10px 12px 20px rgba(33,29,26,.12);
        }

        .gcpts-small-building::before {
          content: '';
          position: absolute;
          inset: 12%;
          background:
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,.65) 0 7px,
              transparent 7px 14px
            );
        }

        /* =========================
           CRANE
        ========================= */

        .gcpts-crane {
          position: absolute;
          right: 5%;
          top: 9%;
          width: 45%;
          height: 47%;
        }

        .gcpts-crane-tower {
          position: absolute;
          right: 20%;
          bottom: 0;
          width: 7px;
          height: 78%;
          background: #211d1a;
        }

        .gcpts-crane-tower::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(
              45deg,
              transparent 0 12px,
              rgba(255,255,255,.2) 12px 14px
            );
        }

        .gcpts-crane-arm {
          position: absolute;
          right: 18%;
          top: 15%;
          width: 82%;
          height: 6px;
          background: #211d1a;
          transform-origin: right center;
          animation: craneMove 5s ease-in-out infinite alternate;
        }

        @keyframes craneMove {
          from {
            transform: rotate(-2deg);
          }

          to {
            transform: rotate(4deg);
          }
        }

        .gcpts-crane-cable {
          position: absolute;
          left: 20%;
          top: 19%;
          width: 1px;
          height: 31%;
          background: #211d1a;
        }

        .gcpts-crane-load {
          position: absolute;
          left: calc(20% - 13px);
          top: 49%;
          width: 27px;
          height: 20px;
          border-radius: 3px;
          background: #d97706;
          box-shadow: 0 8px 12px rgba(33,29,26,.15);
          animation: loadFloat 5s ease-in-out infinite alternate;
        }

        @keyframes loadFloat {
          from {
            transform: translateY(0);
          }

          to {
            transform: translateY(12px);
          }
        }

        /* =========================
           TREES
        ========================= */

        .gcpts-tree {
          position: absolute;
          bottom: 29%;
          width: 35px;
          height: 70px;
        }

        .gcpts-tree-1 {
          left: 5%;
        }

        .gcpts-tree-2 {
          right: 5%;
          transform: scale(.75);
        }

        .gcpts-tree-trunk {
          position: absolute;
          bottom: 0;
          left: 16px;
          width: 5px;
          height: 36px;
          border-radius: 4px;
          background: #6b4226;
        }

        .gcpts-tree-leaves {
          position: absolute;
          top: 0;
          left: 0;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle at 30% 30%,
              #86a66f,
              #47734b 70%
            );
          box-shadow:
            10px 5px 0 -3px #608c58,
            -8px 8px 0 -4px #527f50;
        }

        /* =========================
           PROJECT PATH
        ========================= */

        .gcpts-project-path {
          position: absolute;
          left: 11%;
          right: 11%;
          bottom: 10%;
          height: 45%;
          pointer-events: none;
        }

        .gcpts-path-line {
          position: absolute;
          left: 0;
          right: 0;
          top: 55%;
          height: 2px;
          background-image: repeating-linear-gradient(
            90deg,
            rgba(190,24,93,.45) 0 8px,
            transparent 8px 16px
          );
          background-size: 16px 2px;
          transform: rotate(-5deg);
          animation: pathMove 1s linear infinite;
        }

        @keyframes pathMove {
          to {
            background-position: -16px 0;
          }
        }

        .gcpts-location {
          position: absolute;
          top: 39%;
          right: 27%;
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          background: #be185d;
          transform: rotate(-45deg);
          box-shadow:
            0 10px 25px rgba(190,24,93,.35);
          animation: markerFloat 3s ease-in-out infinite;
        }

        .gcpts-location::after {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          left: 13px;
          top: 13px;
          border-radius: 50%;
          background: white;
        }

        @keyframes markerFloat {
          50% {
            transform: rotate(-45deg) translateY(-7px);
          }
        }

        /* =========================
           GLASS DATA CARDS
        ========================= */

        .gcpts-data-card {
          position: absolute;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px 15px;
          border: 1px solid rgba(33,29,26,.08);
          border-radius: 17px;
          background: rgba(255,255,255,.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 25px 45px -22px rgba(33,29,26,.35);
          opacity: 0;
        }

        .gcpts-card-budget {
          left: -6%;
          top: 14%;
          animation:
            miniIn 1s cubic-bezier(.34,1.56,.64,1) 1.45s forwards,
            floatOne 5s ease-in-out 2.5s infinite;
        }

        .gcpts-card-status {
          right: -7%;
          bottom: 15%;
          animation:
            miniIn 1s cubic-bezier(.34,1.56,.64,1) 1.9s forwards,
            floatTwo 6s ease-in-out 3s infinite;
        }

        @keyframes miniIn {
          from {
            opacity: 0;
            transform: translateY(25px) scale(.9);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes floatOne {
          50% {
            transform: translateY(-9px);
          }
        }

        @keyframes floatTwo {
          50% {
            transform: translateY(9px);
          }
        }

        .gcpts-card-icon {
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gcpts-card-icon.orange {
          color: #b45309;
          background: linear-gradient(
            135deg,
            #fef3c7,
            #fde68a
          );
        }

        .gcpts-card-icon.green {
          color: #15803d;
          background: linear-gradient(
            135deg,
            #dcfce7,
            #bbf7d0
          );
        }

        .gcpts-card-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .gcpts-card-value {
          font-family: 'Instrument Serif', serif;
          font-size: 20px;
          line-height: 1;
        }

        .gcpts-card-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(33,29,26,.48);
        }

        /* =========================
           MINI CHART
        ========================= */

        .gcpts-chart {
          position: absolute;
          z-index: 8;
          right: 6%;
          top: 8%;
          width: 125px;
          padding: 13px;
          border-radius: 17px;
          background: rgba(255,255,255,.74);
          border: 1px solid rgba(33,29,26,.07);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 20px 35px -20px rgba(33,29,26,.3);
          opacity: 0;
          animation: fadeUp .9s ease 2.3s forwards;
        }

        .gcpts-chart-title {
          font-family: 'DM Mono', monospace;
          font-size: 7px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(33,29,26,.45);
          margin-bottom: 6px;
        }

        .gcpts-chart svg {
          width: 100%;
          height: 50px;
          overflow: visible;
        }

        .gcpts-chart-line {
          fill: none;
          stroke: #be185d;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 150;
          stroke-dashoffset: 150;
          animation: chartDraw 2s ease 2.5s forwards;
        }

        @keyframes chartDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* =========================
           ORBIT
        ========================= */

        .gcpts-orbit {
          position: absolute;
          left: -8%;
          top: 25%;
          width: 116%;
          height: 55%;
          border: 1px dashed rgba(33,29,26,.12);
          border-radius: 50%;
          transform: rotate(-18deg);
          animation: orbitSpin 30s linear infinite;
        }

        .gcpts-orbit-dot {
          position: absolute;
          left: 50%;
          top: -5px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #d97706;
          box-shadow: 0 0 18px rgba(217,119,6,.45);
        }

        @keyframes orbitSpin {
          to {
            transform: rotate(342deg);
          }
        }

        /* =========================
           SKIP
        ========================= */

        .gcpts-skip {
          position: absolute;
          z-index: 30;
          right: clamp(30px, 5vw, 80px);
          top: 38px;
          border: 0;
          background: transparent;
          color: rgba(33,29,26,.52);
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: .13em;
          text-transform: uppercase;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          opacity: 0;
          animation: fadeDown .8s ease 3.5s forwards;
        }

        .gcpts-skip-circle {
          width: 21px;
          height: 21px;
          border-radius: 50%;
          border: 1px solid currentColor;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .3s ease;
        }

        .gcpts-skip:hover {
          color: #211d1a;
        }

        .gcpts-skip:hover .gcpts-skip-circle {
          transform: translateX(3px);
        }

        /* =========================
           PROGRESS
        ========================= */

        .gcpts-progress {
          position: absolute;
          z-index: 40;
          left: 0;
          right: 0;
          top: 0;
          height: 2px;
          background: rgba(33,29,26,.06);
        }

        .gcpts-progress-bar {
          height: 100%;
          background: linear-gradient(
            90deg,
            #fbbf24,
            #ea580c,
            #be185d,
            #7c3aed
          );
          box-shadow: 0 0 12px rgba(234,88,12,.4);
          will-change: width;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 1050px) {
          .gcpts-layout {
            grid-template-columns: 1fr;
            padding: 30px 25px;
          }

          .gcpts-right {
            display: none;
          }

          .gcpts-left {
            max-height: none;
          }

          .gcpts-hero {
            margin: auto 0;
          }
        }

        @media (max-width: 650px) {
          .gcpts-layout {
            padding: 25px 22px;
          }

          .gcpts-title {
            font-size: clamp(49px, 15vw, 75px);
          }

          .gcpts-description {
            font-size: 14px;
            margin-top: 23px;
            margin-bottom: 28px;
          }

          .gcpts-actions {
            gap: 9px;
          }

          .gcpts-primary,
          .gcpts-secondary {
            padding: 14px 20px;
            font-size: 13px;
          }

          .gcpts-stats {
            gap: 15px;
            flex-wrap: wrap;
          }

          .gcpts-divider {
            display: none;
          }

          .gcpts-skip {
            top: 23px;
            right: 22px;
          }

          .gcpts-bg-word {
            font-size: 42vw;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className={`gcpts-root ${leaving ? 'leaving' : ''}`}>

        <div className="gcpts-background">
          <div className="gcpts-gradient" />
          <div className="gcpts-grid" />
          <div className="gcpts-dots" />
          <div className="gcpts-noise" />

          <div className="gcpts-bg-word">
            Transparency
          </div>
        </div>

        <div className="gcpts-progress">
          <div
            className="gcpts-progress-bar"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <button
          className="gcpts-skip"
          onClick={handleContinue}
        >
          Skip intro

          <span className="gcpts-skip-circle">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </span>
        </button>

        <main className="gcpts-layout">

          {/* =========================
              LEFT
          ========================= */}

          <section className="gcpts-left">

            <div className="gcpts-brand">

              <div className="gcpts-logo">
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" />
                  <path d="M9.5 12l1.8 1.8L15 10" />
                </svg>
              </div>

              <div>
                <div className="gcpts-brand-name">
                  GCPTS
                </div>

                <div className="gcpts-brand-sub">
                  Republic of South Africa
                </div>
              </div>

            </div>

            <div className="gcpts-hero">

              <div className="gcpts-eyebrow">
                <span className="gcpts-live-dot" />
                Live · Nationwide transparency
              </div>

              <h1 className="gcpts-title">

                <span className="gcpts-title-line">
                  <span
                    className="gcpts-title-inner"
                    style={{ animationDelay: '1s' }}
                  >
                    Every rand,
                  </span>
                </span>

                <span className="gcpts-title-line">
                  <span
                    className="gcpts-title-inner"
                    style={{ animationDelay: '1.12s' }}
                  >
                    every project,
                  </span>
                </span>

                <span className="gcpts-title-line">
                  <span
                    className="gcpts-title-inner"
                    style={{ animationDelay: '1.24s' }}
                  >
                    <em>in the open.</em>
                  </span>
                </span>

              </h1>

              <p className="gcpts-description">
                The Government Community Project Transparency System
                tracks public development projects, budgets and community
                reports — in real time, for every citizen.
              </p>

              <div className="gcpts-actions">

                <button
                  className="gcpts-primary"
                  onClick={handleContinue}
                >
                  <span>Enter the portal</span>

                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </button>

                <button
                  className="gcpts-secondary"
                  onClick={handleContinue}
                >
                  Sign in
                </button>

              </div>

            </div>

            <div className="gcpts-stats">

              <div className="gcpts-stat">
                <div className="gcpts-stat-value">
                  1,240<span>+</span>
                </div>

                <div className="gcpts-stat-label">
                  Active projects
                </div>
              </div>

              <div className="gcpts-divider" />

              <div className="gcpts-stat">
                <div className="gcpts-stat-value">
                  R 84<span>bn</span>
                </div>

                <div className="gcpts-stat-label">
                  Tracked budget
                </div>
              </div>

              <div className="gcpts-divider" />

              <div className="gcpts-stat">
                <div className="gcpts-stat-value">
                  9<span> prov</span>
                </div>

                <div className="gcpts-stat-label">
                  Coverage
                </div>
              </div>

            </div>

          </section>

          {/* =========================
              RIGHT — ILLUSTRATION
          ========================= */}

          <section className="gcpts-right">

            <div className="gcpts-scene">

              <div className="gcpts-scene-glow" />

              <div className="gcpts-orbit">
                <span className="gcpts-orbit-dot" />
              </div>

              <div className="gcpts-main-card">

                <div className="gcpts-map" />

                <div className="gcpts-city">

                  <div className="gcpts-ground" />

                  <div className="gcpts-road" />

                  <div className="gcpts-building">
                    <div className="gcpts-building-top" />
                  </div>

                  <div className="gcpts-small-building" />

                  <div className="gcpts-tree gcpts-tree-1">
                    <div className="gcpts-tree-leaves" />
                    <div className="gcpts-tree-trunk" />
                  </div>

                  <div className="gcpts-tree gcpts-tree-2">
                    <div className="gcpts-tree-leaves" />
                    <div className="gcpts-tree-trunk" />
                  </div>

                  <div className="gcpts-crane">

                    <div className="gcpts-crane-tower" />

                    <div className="gcpts-crane-arm" />

                    <div className="gcpts-crane-cable" />

                    <div className="gcpts-crane-load" />

                  </div>

                  <div className="gcpts-project-path">
                    <div className="gcpts-path-line" />

                    <div className="gcpts-location" />
                  </div>

                </div>

              </div>

              {/* Budget */}

              <div className="gcpts-data-card gcpts-card-budget">

                <div className="gcpts-card-icon orange">

                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>

                </div>

                <div className="gcpts-card-content">

                  <div className="gcpts-card-value">
                    R 2.4m
                  </div>

                  <div className="gcpts-card-label">
                    Disbursed today
                  </div>

                </div>

              </div>

              {/* Status */}

              <div className="gcpts-data-card gcpts-card-status">

                <div className="gcpts-card-icon green">

                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>

                </div>

                <div className="gcpts-card-content">

                  <div className="gcpts-card-value">
                    98.2%
                  </div>

                  <div className="gcpts-card-label">
                    On schedule
                  </div>

                </div>

              </div>

              {/* Chart */}

              <div className="gcpts-chart">

                <div className="gcpts-chart-title">
                  Project activity
                </div>

                <svg
                  viewBox="0 0 110 50"
                  fill="none"
                >
                  <path
                    d="M2 42 C15 38, 20 40, 29 31 C38 22, 43 34, 52 27 C62 19, 69 24, 76 17 C84 10, 91 15, 108 5"
                    className="gcpts-chart-line"
                  />

                  <circle
                    cx="108"
                    cy="5"
                    r="3"
                    fill="#be185d"
                  />
                </svg>

              </div>

            </div>

          </section>

        </main>

      </div>
    </>
  );
}