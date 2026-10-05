// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Public/Home';
import LoginPage from './Components/LoginPage';
import RegisterPage from './Public/Register';
import AdminPortal from './Admin/admin';
import ViewProject from './Public/projectDetails';
import Dashboard from './Public/DashBoard';
import Budget from './Components/BudgetTracking';
import UpcomingProjects from './Components/UpcomingProjects';
import ProjectsPage from './Components/ProjectsPage';
import PageNotFound from './Components/pageNotFound';
import WelcomePage from './Components/WelcomePage';
import { useAuth } from './AuthContext';
import './App.css';

// Only /Admin uses this guard
function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { isLoggedIn, isAdmin, isReady } = useAuth();

  if (!isReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
          color: '#64748b',
        }}
      >
        Loading…
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  // ─── Welcome overlay — shows on every full page load / refresh.
  //     Because <App /> remounts on refresh, this state resets to true
  //     each time. Client-side route changes do NOT remount App, so the
  //     welcome won't re-trigger during in-app navigation. ───
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  const finishWelcome = () => {
    setShowWelcome(false);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Welcome overlay — sits on top of everything until dismissed */}
        {showWelcome && <WelcomePage onDone={finishWelcome} />}

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/Register" element={<RegisterPage />} />
          <Route path="/Project" element={<UpcomingProjects />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/project/:id" element={<ViewProject />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Budget" element={<Budget />} />

          {/* Admin-only */}
          <Route
            path="/Admin"
            element={
              <RequireAuth adminOnly>
                <AdminPortal />
              </RequireAuth>
            }
          />

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}