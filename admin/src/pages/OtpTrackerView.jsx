import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Search,
  Trash2,
  Clock,
  AlertTriangle,
  Mail,
  Zap,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import './OtpTrackerView.css';

const OtpTrackerView = () => {
  const [otps, setOtps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'verified' | 'expired'
  const [copiedId, setCopiedId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pollTimerRef = useRef(null);

  const fetchOtps = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await api.getOtps();
      if (res && res.success && Array.isArray(res.data)) {
        setOtps(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch active OTPs:', err.message);
    } finally {
      setLoading(false);
      if (showSpinner) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOtps(true);
  }, []);

  // Real-time polling every 3 seconds if autoRefresh is enabled
  useEffect(() => {
    if (autoRefresh) {
      pollTimerRef.current = setInterval(() => {
        fetchOtps(false);
      }, 3000);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [autoRefresh]);

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all active & expired OTP tracking history?')) {
      return;
    }
    try {
      await api.clearOtps();
      setOtps([]);
    } catch (err) {
      alert('Failed to clear OTPs: ' + err.message);
    }
  };

  const handleDeleteOtp = async (phone) => {
    try {
      await api.deleteOtp(phone);
      setOtps(prev => prev.filter(o => o.phone !== phone));
    } catch (err) {
      alert('Failed to remove OTP: ' + err.message);
    }
  };

  // Helper format remaining time
  const formatRemaining = (seconds) => {
    if (seconds <= 0) return 'Expired';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Filtered list
  const filteredOtps = otps.filter(item => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.phone.includes(q) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      item.otp.includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    return item.currentStatus === statusFilter;
  });

  const activeCount = otps.filter(o => o.currentStatus === 'active').length;
  const verifiedCount = otps.filter(o => o.currentStatus === 'verified').length;
  const trialBlockedCount = otps.filter(o => o.isTrialBlocked).length;

  return (
    <div className="otp-tracker-page">
      {/* Top Banner Notice */}
      <div className="otp-banner-card">
        <div className="otp-banner-icon-col">
          <div className="otp-banner-icon-box">
            <Zap size={22} />
          </div>
        </div>
        <div className="otp-banner-content">
          <div className="otp-banner-title-row">
            <h4>Live Phone OTP & Temporary Code Tracker</h4>
            <span className="otp-live-indicator">
              <span className="live-dot" /> Live Monitoring
            </span>
          </div>
          <p className="otp-banner-desc">
            Track temporary 6-digit verification codes generated for any mobile number during customer Sign-Up, Sign-In, or Password Reset.
            During Twilio trial mode, codes for unverified numbers appear here in real time so you can complete verification seamlessly.
          </p>
          <div className="otp-banner-footer">
            <span className="twilio-info-pill">
              Twilio Owner Phone: <strong>+91 8940473703</strong> (Receives live SMS)
            </span>
            <a
              href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified-caller-ids"
              target="_blank"
              rel="noopener noreferrer"
              className="twilio-console-link"
            >
              Add Tester in Twilio Console <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="otp-kpi-grid">
        <div className="otp-kpi-card active-kpi">
          <div className="otp-kpi-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="otp-kpi-data">
            <span className="otp-kpi-label">ACTIVE CODES</span>
            <h3 className="otp-kpi-num">{activeCount}</h3>
            <span className="otp-kpi-sub">Ready to verify</span>
          </div>
        </div>

        <div className="otp-kpi-card verified-kpi">
          <div className="otp-kpi-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="otp-kpi-data">
            <span className="otp-kpi-label">VERIFIED CODES</span>
            <h3 className="otp-kpi-num">{verifiedCount}</h3>
            <span className="otp-kpi-sub">Phone authenticated</span>
          </div>
        </div>

        <div className="otp-kpi-card trial-kpi">
          <div className="otp-kpi-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="otp-kpi-data">
            <span className="otp-kpi-label">TRIAL TEST NUMBERS</span>
            <h3 className="otp-kpi-num">{trialBlockedCount}</h3>
            <span className="otp-kpi-sub">Captured for instant test</span>
          </div>
        </div>

        <div className="otp-kpi-card total-kpi">
          <div className="otp-kpi-icon">
            <Smartphone size={20} />
          </div>
          <div className="otp-kpi-data">
            <span className="otp-kpi-label">TOTAL LOGGED</span>
            <h3 className="otp-kpi-num">{otps.length}</h3>
            <span className="otp-kpi-sub">Session history</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="otp-toolbar">
        <div className="otp-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search phone number, OTP, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="otp-status-tabs">
          <button
            className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({otps.length})
          </button>
          <button
            className={`tab-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            className={`tab-btn ${statusFilter === 'verified' ? 'active' : ''}`}
            onClick={() => setStatusFilter('verified')}
          >
            Verified ({verifiedCount})
          </button>
          <button
            className={`tab-btn ${statusFilter === 'expired' ? 'active' : ''}`}
            onClick={() => setStatusFilter('expired')}
          >
            Expired
          </button>
        </div>

        <div className="otp-action-buttons">
          <button
            className={`auto-refresh-toggle ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(prev => !prev)}
            title="Toggle 3-second auto refresh"
          >
            <span className="toggle-dot" />
            Auto-Sync {autoRefresh ? 'ON' : 'PAUSED'}
          </button>

          <button
            className="action-refresh-btn"
            onClick={() => fetchOtps(true)}
            disabled={isRefreshing}
            title="Refresh now"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
            Refresh
          </button>

          {otps.length > 0 && (
            <button
              className="action-clear-btn"
              onClick={handleClearAll}
              title="Clear OTP tracking records"
            >
              <Trash2 size={14} />
              Clear Log
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Grid */}
      <div className="otp-table-container">
        {loading ? (
          <div className="otp-loading-state">
            <RefreshCw size={26} className="spin-icon" />
            <p>Loading temporary OTP codes...</p>
          </div>
        ) : filteredOtps.length === 0 ? (
          <div className="otp-empty-state">
            <Smartphone size={44} className="empty-icon" />
            <h3>No Temporary OTP Records Found</h3>
            <p>
              {search || statusFilter !== 'all'
                ? 'No OTP matches your current search or filter criteria.'
                : 'When a customer or tester requests an OTP on the store frontend, the temporary code will appear here in real time.'}
            </p>
          </div>
        ) : (
          <table className="otp-data-table">
            <thead>
              <tr>
                <th>PHONE NUMBER</th>
                <th>TEMPORARY OTP CODE</th>
                <th>STATUS</th>
                <th>DELIVERY ROUTE</th>
                <th>RECIPIENT EMAIL</th>
                <th>GENERATED AT</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredOtps.map((record) => {
                const isCopied = copiedId === record.id;
                const formattedPhone = record.phone.replace(/(\d{5})(\d{5})/, '$1 $2');
                const timeString = new Date(record.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                });

                return (
                  <tr key={record.id} className={`otp-row status-${record.currentStatus}`}>
                    {/* Phone Number */}
                    <td>
                      <div className="cell-phone">
                        <Smartphone size={16} className="phone-icon" />
                        <span className="phone-prefix">+91</span>
                        <strong className="phone-digits">{formattedPhone}</strong>
                      </div>
                    </td>

                    {/* Temporary OTP Code */}
                    <td>
                      <div className="cell-otp">
                        <div className="otp-code-pill">
                          <span className="otp-digits">{record.otp}</span>
                        </div>
                        <button
                          className={`copy-otp-btn ${isCopied ? 'copied' : ''}`}
                          onClick={() => handleCopyCode(record.otp, record.id)}
                          title="Copy 6-digit code"
                        >
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </td>

                    {/* Status with remaining time */}
                    <td>
                      {record.currentStatus === 'active' ? (
                        <div className="status-badge-wrap">
                          <span className="status-badge-pill active">
                            <span className="pulsing-badge-dot" /> ACTIVE
                          </span>
                          <span className="time-remaining-text">
                            <Clock size={11} /> {formatRemaining(record.remainingSeconds)}
                          </span>
                        </div>
                      ) : record.currentStatus === 'verified' ? (
                        <div className="status-badge-wrap">
                          <span className="status-badge-pill verified">
                            <CheckCircle2 size={12} /> VERIFIED
                          </span>
                          <span className="time-remaining-text muted">Phone Confirmed</span>
                        </div>
                      ) : (
                        <div className="status-badge-wrap">
                          <span className="status-badge-pill expired">
                            <XCircle size={12} /> EXPIRED
                          </span>
                          <span className="time-remaining-text muted">&gt; 5 mins ago</span>
                        </div>
                      )}
                    </td>

                    {/* Delivery Route */}
                    <td>
                      {record.isTrialBlocked ? (
                        <span className="route-tag trial" title="Twilio free trial blocked live SMS; captured here for test">
                          <AlertTriangle size={12} /> Trial Notice (In Admin)
                        </span>
                      ) : record.provider === 'twilio-verify' ? (
                        <span className="route-tag twilio" title="Sent via Twilio Verify API">
                          <CheckCircle2 size={12} /> Twilio Verify (Live SMS)
                        </span>
                      ) : record.provider === 'twilio' ? (
                        <span className="route-tag twilio">
                          <CheckCircle2 size={12} /> Twilio SMS
                        </span>
                      ) : record.provider === 'fast2sms' ? (
                        <span className="route-tag fast2sms">
                          <CheckCircle2 size={12} /> Fast2SMS Live
                        </span>
                      ) : (
                        <span className="route-tag sim">
                          <Zap size={12} /> Dev Simulator
                        </span>
                      )}
                    </td>

                    {/* Recipient Email */}
                    <td>
                      {record.email ? (
                        <div className="cell-email">
                          <Mail size={13} className="email-icon" />
                          <span>{record.email}</span>
                        </div>
                      ) : (
                        <span className="cell-empty-dash">—</span>
                      )}
                    </td>

                    {/* Time */}
                    <td>
                      <div className="cell-time">
                        <span className="time-primary">{timeString}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td>
                      <div className="cell-actions">
                        <button
                          className="delete-single-btn"
                          onClick={() => handleDeleteOtp(record.phone)}
                          title="Remove from tracker"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OtpTrackerView;

