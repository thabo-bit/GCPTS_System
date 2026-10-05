// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './AuthContext.tsx';

// Attach JWT to every outgoing request
axios.interceptors.request.use((config) => {
  const raw = localStorage.getItem('gcpts_auth');
  if (raw) {
    try {
      const { token } = JSON.parse(raw);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
  }
  return config;
});

// Auto-logout on 401
axios.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('gcpts_auth');
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/Register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);