import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('vr_nuts_admin_user');
    return saved ? JSON.parse(saved) : {
      name: 'VP Nuts Administrator',
      email: 'admin@vrnuts.com',
      role: 'admin',
      location: 'Kumbakonam Central Hub'
    };
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true); // default logged in for convenience
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success && res.user && res.user.role === 'admin') {
        setAdmin(res.user);
        setIsAuthenticated(true);
        localStorage.setItem('vr_nuts_admin_token', res.token);
        localStorage.setItem('vr_nuts_admin_user', JSON.stringify(res.user));
        return { success: true };
      } else {
        return { success: false, message: res.message || 'Invalid admin credentials' };
      }
    } catch (err) {
      // Offline fallback login for default credentials
      if (email.toLowerCase() === 'admin@vrnuts.com' && password === 'admin123') {
        const fallbackAdmin = {
          name: 'VP Nuts Administrator',
          email: 'admin@vrnuts.com',
          role: 'admin',
          location: 'Kumbakonam Central Hub'
        };
        setAdmin(fallbackAdmin);
        setIsAuthenticated(true);
        localStorage.setItem('vr_nuts_admin_user', JSON.stringify(fallbackAdmin));
        return { success: true };
      }
      return { success: false, message: 'Server unreachable. Use admin@vrnuts.com / admin123.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem('vr_nuts_admin_token');
    localStorage.removeItem('vr_nuts_admin_user');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthenticated, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

