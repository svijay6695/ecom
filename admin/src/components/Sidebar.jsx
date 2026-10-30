import React from 'react';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  ShieldCheck,
  ExternalLink,
  LogOut,
  MapPin,
  X
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { logout } = useAdminAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Stock', icon: Package },
    { id: 'orders', label: 'Orders & Tracking', icon: Truck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'otps', label: 'Live OTP Tracker', icon: ShieldCheck }
  ];

  return (
    <>
      {isOpen && <div className="sidebar-mobile-backdrop" onClick={onClose} />}
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="20" fill="#8b4513" />
              <path d="M30 30 L40 70 L50 30" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M55 30 L55 70 M55 30 H75 C85 30 85 50 75 50 H55" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="brand-meta">
            <span className="brand-title">VP NUTS</span>
            <span className="brand-badge">ADMIN PORTAL</span>
          </div>
          {onClose && (
            <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="sidebar-hub-badge">
          <MapPin size={13} />
          <span>Kumbakonam Central Hub</span>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-group-label">OPERATIONS</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onClose) onClose();
                }}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="sidebar-footer">
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            className="store-link-btn"
            title="Open live customer store"
            onClick={() => { if (onClose) onClose(); }}
          >
            <ExternalLink size={16} />
            <span>View Customer Store</span>
          </a>

          <button
            className="logout-btn"
            onClick={() => {
              logout();
              if (onClose) onClose();
            }}
            title="Sign Out"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

