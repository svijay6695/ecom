import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Truck,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import api from '../services/api';
import './DashboardView.css';

const DashboardView = ({ setActiveTab }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeOtpsCount, setActiveOtpsCount] = useState(0);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (e) {
      // Fallback local stats
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        activeProducts: 0,
        totalProducts: 0,
        pendingDispatches: 0,
        districtSales: {
          'Kumbakonam': 0,
        },
        recentOrders: [
          {
            orderId: 'VPN-849201',
            customer: { name: 'Suresh Kumar', phone: '+91 98401 23456' },
            shippingAddress: { district: 'Coimbatore' },
            totalAmount: 1188,
            currentStatus: 'in-transit',
            createdAt: new Date().toISOString()
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOtpsCount = async () => {
    try {
      const res = await api.getOtps();
      if (res && res.success && Array.isArray(res.data)) {
        const active = res.data.filter(o => o.currentStatus === 'active').length;
        setActiveOtpsCount(active);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOtpsCount();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="status-badge confirmed">Confirmed</span>;
      case 'packed':
        return <span className="status-badge packed">Packed</span>;
      case 'in-transit':
        return <span className="status-badge transit">In Transit</span>;
      case 'out-for-delivery':
        return <span className="status-badge out">Out for Delivery</span>;
      case 'delivered':
        return <span className="status-badge delivered">Delivered</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="dashboard-page">
      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="kpi-card revenue">
          <div className="kpi-icon-box">
            <IndianRupee size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL REVENUE</span>
            <h3 className="kpi-value">₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}</h3>
            <span className="kpi-trend positive">
              <TrendingUp size={14} /> +18.4% from last week
            </span>
          </div>
        </div>

        <div className="kpi-card orders">
          <div className="kpi-icon-box">
            <ShoppingBag size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL ORDERS</span>
            <h3 className="kpi-value">{stats?.totalOrders || 0}</h3>
            <span className="kpi-subtext">Across Tamil Nadu</span>
          </div>
        </div>

        <div className="kpi-card products">
          <div className="kpi-icon-box">
            <Package size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">ACTIVE PRODUCTS</span>
            <h3 className="kpi-value">{stats?.activeProducts || 0} / {stats?.totalProducts || 0}</h3>
            <span className="kpi-subtext">Nuts & Nutrient Seeds</span>
          </div>
        </div>

        <div className="kpi-card dispatch">
          <div className="kpi-icon-box">
            <Truck size={24} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">PENDING DISPATCH</span>
            <h3 className="kpi-value">{stats?.pendingDispatches || 0}</h3>
            <span className="kpi-subtext">Live Hub Deliveries</span>
          </div>
        </div>
      </div>

      {/* Live Phone OTP Quick Action Bar */}
      <div className="dash-otp-quickbar" onClick={() => setActiveTab('otps')}>
        <div className="dash-otp-left">
          <div className="dash-otp-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="dash-otp-text">
            <h4>Live Phone OTP & Temporary Code Tracker</h4>
            <p>
              {activeOtpsCount > 0
                ? `${activeOtpsCount} temporary verification code(s) currently active for customer testing`
                : 'Monitor mobile verification codes in real-time for customer sign-up, sign-in, and testing'}
            </p>
          </div>
        </div>
        <div className="dash-otp-right">
          {activeOtpsCount > 0 && (
            <span className="dash-otp-count-pill">{activeOtpsCount} ACTIVE</span>
          )}
          <button className="dash-otp-btn" type="button">
            Open OTP Tracker <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Grid: Orders & District Breakdown */}
      <div className="dashboard-grid">
        {/* Recent Orders Card */}
        <div className="dash-card recent-orders-card">
          <div className="dash-card-header">
            <div>
              <h3>Recent Customer Orders</h3>
              <p>Latest customer checkouts awaiting dispatch & delivery</p>
            </div>
            <button className="view-all-btn" onClick={() => setActiveTab('orders')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.length > 0 ? (
                  stats.recentOrders.map((order) => (
                    <tr key={order.orderId}>
                      <td className="bold-id">{order.orderId}</td>
                      <td>
                        <div className="customer-cell">
                          <strong>{order.customer?.name}</strong>
                          <span>{order.customer?.phone}</span>
                        </div>
                      </td>
                      <td>
                        <span className="district-pill">
                          <MapPin size={12} />
                          {order.shippingAddress?.district || order.shippingAddress?.city || 'Tamil Nadu'}
                        </span>
                      </td>
                      <td className="amount-cell">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                      <td>{getStatusBadge(order.currentStatus)}</td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => setActiveTab('orders')}
                          title="Inspect and update tracking"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">No recent orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tamil Nadu Hub Dispatch Distribution */}
        <div className="dash-card tn-dispatch-card">
          <div className="dash-card-header">
            <div>
              <h3>Tamil Nadu Dispatch Hub</h3>
              <p>Orders fulfillment by district from Kumbakonam</p>
            </div>
          </div>

          <div className="district-sales-list">
            {stats?.districtSales && Object.keys(stats.districtSales).length > 0 ? (
              Object.entries(stats.districtSales).map(([district, amount]) => {
                const max = Math.max(...Object.values(stats.districtSales), 1);
                const percent = Math.min(100, Math.round((amount / max) * 100));
                return (
                  <div key={district} className="district-stat-row">
                    <div className="district-stat-meta">
                      <span className="dist-name">
                        <MapPin size={14} className="dist-icon" />
                        {district}
                      </span>
                      <strong className="dist-amount">₹{amount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="no-data-hint">No district data yet.</p>
            )}
          </div>

          <div className="hub-info-box">
            <CheckCircle size={18} className="hub-check-icon" />
            <div className="hub-info-text">
              <strong>Kumbakonam Central Dispatch</strong>
              <p>Daily express pickup for Trichy, Coimbatore, Chennai, and Madurai hubs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

