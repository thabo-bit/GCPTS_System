// src/Public/Register.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import '../Components/Register.css';
import { useAuth } from '../AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'user' | 'admin'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, mobile, password, userType }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || 'Failed to register account.');
      }

      const data = text ? JSON.parse(text) : {};

      if (data.token) {
        login({
          email: data.email || email,
          fullName: data.fullName || fullName,
          userType: data.userType || userType,
          token: data.token,
        });

        navigate(data.userType === 'admin' ? '/Admin' : '/Dashboard');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
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
            <div className="brand-logo-container">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTs_2TnxficCQAT2d_BL4StVBrwVB1NCjosiTpMCbbPCgICUmktBzb87ks&s=10"
                alt="Coat of arms of South Africa"
                className="pane-logo"
              />
            </div>
            <h1>JOIN US</h1>
            <h2>GCPTS TRANSPARENCY PORTAL</h2>
            <p>
              Register as a citizen or field inspector to report local infrastructure faults,
              track community development budgets, and hold public projects accountable.
            </p>
          </div>
        </div>

        <div className="login-right-pane">
          <div className="form-header">
            <h2>Create Account</h2>
            <p>Enter your details to register on the platform</p>
          </div>

          {error && (
            <div className="error-message" style={{ color: '#ff4d4f', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <span className="input-icon"><User size={18} /></span>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon"><Mail size={18} /></span>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon"><Phone size={18} /></span>
              <input
                type="text"
                placeholder="Mobile Number (e.g. 0821234567)"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>

            <div className="input-group password-group">
              <span className="input-icon"><Lock size={18} /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="show-pwd-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Account type selector */}
            <div className="input-group">
              <span className="input-icon"><Shield size={18} /></span>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value as 'user' | 'admin')}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  color: '#1f2233',
                  cursor: 'pointer',
                }}
              >
                <option value="user">Community Member</option>
                <option value="admin">Government Administrator</option>
              </select>
            </div>

            <button type="submit" className="primary-signin-btn" disabled={loading}>
              {loading ? 'Processing...' : 'Complete Registration'}
            </button>
          </form>

          <p className="signup-prompt">
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} className="signup-link">
              Sign In
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}