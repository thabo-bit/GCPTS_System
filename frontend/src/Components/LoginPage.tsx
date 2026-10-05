// src/Components/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import UserIcon from '../assets/circle-user-solid-full.svg';
import PasswordIcon from '../assets/password.png';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorJson = JSON.parse(responseText);
          throw new Error(errorJson.message || 'Invalid email or password.');
        } catch {
          throw new Error(responseText || 'Invalid email or password.');
        }
      }

      const data = responseText ? JSON.parse(responseText) : {};
      console.log('Login successful:', data);

      // ⭐ Save JWT + user info into context
      login({
        email: data.email || email,
        fullName: data.fullName || 'User',
        userType: data.userType || 'user',
        token: data.token,
      });

      // ⭐ THE FIX — persist the session so authFetch can find it
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.email || email);
      localStorage.setItem('fullName', data.fullName || 'User');
      localStorage.setItem('userType', data.userType || 'user');
      if (data.id != null) localStorage.setItem('userId', String(data.id));

      // Route by role
      if (data.userType === 'admin') {
        navigate('/Admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card-container">
        <div className="login-left-pane">
          <div className="floating-orb orb-1"></div>
          <div className="floating-orb orb-2"></div>
          <div className="floating-orb orb-3"></div>

          <div className="welcome-content">
            <h1>WELCOME</h1>
            <h2>GCPTS TRANSPARENCY PORTAL</h2>
            <p>
              Tracking every public development project with complete transparency.
              Sign in to manage projects, verify community reports, and monitor budgets.
            </p>
          </div>
        </div>

        <div className="login-right-pane">
          <div className="form-header">
            <h2>Sign in</h2>
            <p>Enter your details to access your account</p>
          </div>

          {error && (
            <div className="error-message" style={{ color: '#ff4d4f', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <img className="input-icon" src={UserIcon} alt="User Icon" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group password-group">
              <img className="input-icon" src={PasswordIcon} alt="Password Icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="show-pwd-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            <div className="form-meta-row">
              <label className="remember-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="forgot-link">Forgot Password?</a>
            </div>

            <button type="submit" className="primary-signin-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="divider-container">
            <span>Or</span>
          </div>

          <button type="button" className="secondary-signin-btn">
            Sign in with other
          </button>

          <p className="signup-prompt">
            Don't have an account?{' '}
            <span onClick={() => navigate('/Register')} className="signup-link">
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}