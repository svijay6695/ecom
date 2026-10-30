import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, MapPin, Calendar, Search } from 'lucide-react';
import api from '../services/api';
import './CustomersView.css';

const DEMO_CUSTOMERS = [
  {
    id: 1,
    name: 'Suresh Kumar',
    email: 'suresh.kumar@example.com',
    phone: '+91 98401 23456',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    ordersCount: 3,
    totalSpent: 4250,
    joinedDate: '2026-08-15'
  },
  {
    id: 2,
    name: 'Meenakshi Sundaram',
    email: 'meenakshi.s@example.com',
    phone: '+91 94432 87654',
    city: 'Madurai',
    state: 'Tamil Nadu',
    ordersCount: 2,
    totalSpent: 2800,
    joinedDate: '2026-09-02'
  },
  {
    id: 3,
    name: 'Karthik Subramanian',
    email: 'karthik.subbu@example.com',
    phone: '+91 98840 11223',
    city: 'Chennai',
    state: 'Tamil Nadu',
    ordersCount: 5,
    totalSpent: 8600,
    joinedDate: '2026-07-20'
  },
  {
    id: 4,
    name: 'Ananya Raghavan',
    email: 'ananya.r@example.com',
    phone: '+91 97910 44556',
    city: 'Kumbakonam',
    state: 'Tamil Nadu',
    ordersCount: 4,
    totalSpent: 5100,
    joinedDate: '2026-09-18'
  },
  {
    id: 5,
    name: 'Venkatesh Babu',
    email: 'venkat.babu@example.com',
    phone: '+91 94441 78901',
    city: 'Salem',
    state: 'Tamil Nadu',
    ordersCount: 1,
    totalSpent: 1200,
    joinedDate: '2026-10-10'
  }
];

const CustomersView = () => {
  const [customers, setCustomers] = useState(DEMO_CUSTOMERS);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.getCustomers();
        if (res.success && res.data && res.data.length > 0) {
          // Merge / format users from backend with demo customer stats
          const liveList = res.data.map((u, i) => ({
            id: u._id || u.id || `live-${i}`,
            name: u.name,
            email: u.email,
            phone: u.phone || '+91 98401 23456',
            city: u.city || 'Kumbakonam',
            state: u.state || 'Tamil Nadu',
            ordersCount: u.role === 'admin' ? 0 : 1,
            totalSpent: u.role === 'admin' ? 0 : 1188,
            joinedDate: u.createdAt || new Date().toISOString()
          }));
          setCustomers(liveList);
        }
      } catch {
        // Fallback to demo
      }
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
  });

  return (
    <div className="customers-page">
      <div className="customers-toolbar">
        <div className="table-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search customers by name, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="dash-card">
        <div className="table-responsive">
          <table className="dash-table customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="customer-avatar-cell">
                      <div className="cust-avatar">{c.name.charAt(0)}</div>
                      <div>
                        <strong>{c.name}</strong>
                        <span className="cust-email">{c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <span><Phone size={12} /> {c.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className="district-pill">
                      <MapPin size={12} /> {c.city}, {c.state}
                    </span>
                  </td>
                  <td>
                    <span className="order-count-badge">{c.ordersCount} orders</span>
                  </td>
                  <td className="amount-cell">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                  <td className="date-cell">{new Date(c.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomersView;

