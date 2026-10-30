import React from 'react';
import { ShieldCheck, Server, RefreshCw, Menu } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import './Header.css';

const Header = ({ title, subtitle, onRefresh, loading, onToggleSidebar }) => {
  const { admin } = useAdminAuth();

  return (
    <header className="admin-header">
      <div className="header-left-group">
        {onToggleSidebar && (
          <button
            className="mobile-sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label="Open sidebar menu"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="header-titles">
          <h1 className="header-main-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header-actions">
        {onRefresh && (
          <button
            className={`refresh-btn ${loading ? 'spinning' : ''}`}
            onClick={onRefresh}
            title="Refresh Live Data"
            disabled={loading}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        )}

        {/* <div className="api-status-pill">
          <Server size={14} className="status-dot" />
          <span>API :5001</span>
        </div> */}

        <div className="admin-user-profile">
          <div className="admin-avatar">
            {admin?.name?.charAt(0) || 'A'}
          </div>
          <div className="admin-info">
            <span className="admin-name">{admin?.name || 'Administrator'}</span>
            <span className="admin-role">
              <ShieldCheck size={12} /> Super Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

