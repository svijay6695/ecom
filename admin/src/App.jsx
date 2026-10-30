import React, { useState } from 'react';
import { useAdminAuth } from './context/AdminAuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './pages/DashboardView';
import ProductsView from './pages/ProductsView';
import OrdersView from './pages/OrdersView';
import CustomersView from './pages/CustomersView';
import OtpTrackerView from './pages/OtpTrackerView';
import AdminLogin from './pages/AdminLogin';
import './App.css';

function App() {
  const { isAuthenticated } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const getPageMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dispatch Overview & KPI Dashboard',
          subtitle: 'Live Tamil Nadu order milestones and inventory metrics'
        };
      case 'products':
        return {
          title: 'Products & Inventory Manager',
          subtitle: 'Manage dry fruits, nutrient seeds, pricing, and 250g/500g/1kg stock'
        };
      case 'orders':
        return {
          title: 'Customer Orders & Live Dispatch Tracker',
          subtitle: 'Track and advance delivery milestones from Kumbakonam hub'
        };
      case 'customers':
        return {
          title: 'Customer Accounts Directory',
          subtitle: 'Registered buyers and order history across Tamil Nadu'
        };
      case 'otps':
        return {
          title: 'Live Phone OTP & Temporary Code Tracker',
          subtitle: 'Real-time monitoring of SMS OTPs, trial bypass codes, and mobile verifications'
        };
      default:
        return { title: 'Admin Portal', subtitle: '' };
    }
  };

  const { title, subtitle } = getPageMeta();

  return (
    <div className="admin-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="admin-main-container">
        <Header
          title={title}
          subtitle={subtitle}
          onRefresh={() => setRefreshKey(k => k + 1)}
          onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />

        <main className="admin-content-area" key={refreshKey}>
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'otps' && <OtpTrackerView />}
        </main>
      </div>
    </div>
  );
}

export default App;

