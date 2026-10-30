import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const { login, loading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.message || 'Invalid credentials');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-card">
        <div className="login-brand">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="20" fill="#8b4513" />
            <path d="M30 30 L40 70 L50 30" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M55 30 L55 70 M55 30 H75 C85 30 85 50 75 50 H55" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="login-brand-text">
            <h2>VP NUTS</h2>
            <span className="portal-tag">ADMIN DISPATCH PORTAL</span>
          </div>
        </div>

        <p className="login-lead">Sign in to manage nuts & seeds catalog, stock, and live Tamil Nadu dispatches.</p>

        {error && (
          <div className="login-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
          <div className="form-group">
            <label>Admin Email</label>
            <div className="input-icon-box">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                required
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vrnuts.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-box">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="demo-credentials-box">
          <ShieldCheck size={16} className="demo-icon" />
          <div>
            <strong>Default Credentials:</strong>
            <p>Email: <code>admin@vrnuts.com</code></p>
            <p>Password: <code>admin123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

