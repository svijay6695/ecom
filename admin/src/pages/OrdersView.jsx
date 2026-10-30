import React, { useState, useEffect } from 'react';
import {
  Search,
  Truck,
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  X,
  Phone,
  Mail,
  Receipt,
  Navigation,
  CheckCircle2,
  Printer,
  Copy,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import api from '../services/api';
import './OrdersView.css';

const OrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [locationNote, setLocationNote] = useState('');
  const [quickTrackId, setQuickTrackId] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (e) {
      console.warn('API error, using fallback orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.currentStatus === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      order.orderId.toLowerCase().includes(q) ||
      order.customer?.name?.toLowerCase().includes(q) ||
      order.customer?.phone?.toLowerCase().includes(q) ||
      order.shippingAddress?.district?.toLowerCase().includes(q) ||
      order.shippingAddress?.city?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, newStatus, locationNote);
      if (res.success) {
        setOrders(prev => prev.map(o => o.orderId === orderId ? res.data : o));
        if (selectedOrder?.orderId === orderId) {
          setSelectedOrder(res.data);
        }
        setLocationNote('');
      }
    } catch (err) {
      alert('Failed to update order milestone: ' + err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Please enter cancellation reason for Order #' + orderId + ':', 'Cancelled by customer / admin request');
    if (reason === null) return;
    try {
      const res = await api.cancelOrder(orderId, reason);
      if (res.success) {
        setOrders(prev => prev.map(o => o.orderId === orderId ? res.data : o));
        if (selectedOrder?.orderId === orderId) {
          setSelectedOrder(res.data);
        }
      }
    } catch (err) {
      alert('Failed to cancel order: ' + err.message);
    }
  };

  const handleQuickTrack = (e) => {
    e.preventDefault();
    if (!quickTrackId.trim()) return;
    const query = quickTrackId.trim().toUpperCase();
    const found = orders.find(o => o.orderId.toUpperCase() === query);
    if (found) {
      setSelectedOrder(found);
      setQuickTrackId('');
    } else {
      alert(`No order found with ID: ${query}`);
    }
  };

  const handleCopyOrderId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrintPackingSlip = (order) => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      alert('Please allow popups to print the Warehouse Packing Slip.');
      return;
    }

    const items = order.items || [];
    const isCod = (order.paymentMethod || 'cod').toLowerCase() === 'cod';
    const totalAmount = order.totalAmount || order.total || 0;
    const shipping = order.shippingAddress || {};
    const customer = order.customer || {};

    const itemsRows = items.map((it, idx) => `
      <tr>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #cbd5e1; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #cbd5e1;">
          <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${it.title}</div>
          <div style="font-size: 11px; color: #64748b;">SKU: VPN-${(it.productId || it.id || 'N').toString().padStart(4, '0')} | Nitrogen Pouch</div>
        </td>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #cbd5e1;">
          <span style="display: inline-block; padding: 3px 8px; background: #e2e8f0; border-radius: 4px; font-weight: 700; font-size: 12px;">${it.weight || it.weights || '1 kg'}</span>
        </td>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #cbd5e1; font-size: 15px; font-weight: 800; color: #8b2500;">
          ${it.quantity}
        </td>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #cbd5e1; font-size: 12px; color: #475569;">
          Aisle ${((idx % 3) + 1)} - Bin ${String.fromCharCode(65 + idx)}
        </td>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #cbd5e1;">
          <div style="width: 20px; height: 20px; border: 2px solid #64748b; border-radius: 3px; margin: 0 auto;"></div>
        </td>
      </tr>
    `).join('');

    const slipHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Packing Slip - #${order.orderId} | VP Nuts Warehouse</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 20px;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.45;
    }
    .slip-container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #0f172a;
      padding: 24px;
      border-radius: 6px;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    .warehouse-title h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #8b2500;
    }
    .warehouse-title p {
      margin: 3px 0 0 0;
      font-size: 12px;
      color: #475569;
    }
    .slip-type-box {
      text-align: right;
    }
    .badge-slip {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .order-num {
      margin-top: 6px;
      font-size: 16px;
      font-weight: 800;
      color: #8b2500;
    }
    .shipping-box {
      border: 2px solid #8b2500;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 20px;
      background: #fffbf9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .shipping-to-col {
      flex: 1;
    }
    .shipping-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #8b2500;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .recipient-name {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
    }
    .recipient-phone {
      font-size: 15px;
      font-weight: 800;
      color: #8b2500;
      margin: 4px 0;
    }
    .recipient-address {
      font-size: 13px;
      color: #334155;
      line-height: 1.4;
      max-width: 480px;
    }
    .payment-callout {
      text-align: right;
      padding-left: 16px;
    }
    .pay-badge {
      display: inline-block;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 800;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .pay-cod {
      background: #fef2f2;
      border: 1.5px solid #dc2626;
      color: #b91c1c;
    }
    .pay-prepaid {
      background: #f0fdf4;
      border: 1.5px solid #16a34a;
      color: #15803d;
    }
    .collect-amt {
      font-size: 20px;
      font-weight: 900;
      margin-top: 6px;
      color: #0f172a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 8px;
      border-top: 1px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }
    .qc-checklist {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px 16px;
      background: #f8fafc;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    .qc-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .qc-box {
      width: 16px;
      height: 16px;
      border: 1.5px solid #475569;
      border-radius: 3px;
    }
    .signoff-row {
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed #94a3b8;
      padding-top: 14px;
      font-size: 11.5px;
      color: #475569;
    }
    .sign-box {
      width: 30%;
    }
    .sign-line {
      border-bottom: 1px solid #0f172a;
      margin-top: 24px;
    }
    .print-controls {
      text-align: center;
      margin-bottom: 14px;
    }
    .print-btn {
      background: #8b2500;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      .print-controls { display: none; }
      body { padding: 0; }
      .slip-container { border: 1.5px solid #000; }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="print-btn" onclick="window.print()">🖨️ Print Warehouse Dispatch Slip</button>
  </div>

  <div class="slip-container">
    <div class="header-bar">
      <div class="warehouse-title">
        <h1>VP NUTS — LOGISTICS & DISPATCH</h1>
        <p>Kumbakonam Central Packaging Station | Thanjavur District, Tamil Nadu</p>
        <p style="font-size: 11px; margin-top: 2px;">Nitrogen Flush Packaging Unit • FSSAI Lic #12423005000123</p>
      </div>
      <div class="slip-type-box">
        <span class="badge-slip">DISPATCH PACKING SLIP</span>
        <div class="order-num">#${order.orderId}</div>
        <div style="font-size: 11px; color: #64748b;">Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}</div>
      </div>
    </div>

    <!-- Customer Shipping Label Box -->
    <div class="shipping-box">
      <div class="shipping-to-col">
        <div class="shipping-title">Ship-To Destination (Tamil Nadu):</div>
        <div class="recipient-name">${customer.name || 'Valued Customer'}</div>
        <div class="recipient-phone">📞 ${customer.phone || 'N/A'}</div>
        <div class="recipient-address">
          ${shipping.street || ''}<br />
          <strong>${shipping.city || ''}</strong>, ${shipping.district || ''} - <strong>${shipping.pincode || ''}</strong>, Tamil Nadu
        </div>
      </div>

      <div class="payment-callout">
        <div class="shipping-title">Payment Terms:</div>
        <span class="pay-badge ${isCod ? 'pay-cod' : 'pay-prepaid'}">
          ${isCod ? 'Cash on Delivery (COD)' : 'Razorpay Prepaid (Online)'}
        </span>
        <div class="collect-amt">
          ${isCod ? `Collect: ₹${totalAmount}` : 'Paid: ₹0 (Online)'}
        </div>
      </div>
    </div>

    <!-- Picking Checklist -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">Line</th>
          <th style="text-align: left;">Item & SKU</th>
          <th style="width: 90px; text-align: center;">Pack Variant</th>
          <th style="width: 70px; text-align: center;">Pick Qty</th>
          <th style="width: 110px; text-align: center;">Warehouse Bin</th>
          <th style="width: 60px; text-align: center;">Picked [✓]</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- QC Checks -->
    <div class="qc-checklist">
      <div class="qc-item">
        <div class="qc-box"></div>
        <span>Hermetic Nitrogen Vacuum Seal Verified</span>
      </div>
      <div class="qc-item">
        <div class="qc-box"></div>
        <span>Scale Weight Calibration Checked</span>
      </div>
      <div class="qc-item">
        <div class="qc-box"></div>
        <span>Tamper Evident Tape Applied</span>
      </div>
    </div>

    <!-- Sign-off Block -->
    <div class="signoff-row">
      <div class="sign-box">
        <strong>Picked By (Staff):</strong>
        <div class="sign-line"></div>
      </div>
      <div class="sign-box">
        <strong>Packed & Sealed By:</strong>
        <div class="sign-line"></div>
      </div>
      <div class="sign-box">
        <strong>QC Supervisor Sign:</strong>
        <div class="sign-line"></div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    printWindow.document.write(slipHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  };

  const statusMilestones = [
    { key: 'confirmed', label: '1. Confirmed', desc: 'Order verified at Kumbakonam HQ' },
    { key: 'packed', label: '2. Vacuum Packed', desc: 'Airtight nitrogen seal' },
    { key: 'in-transit', label: '3. In Transit Across TN', desc: 'Moving through logistics hubs' },
    { key: 'out-for-delivery', label: '4. Out for Delivery', desc: 'Courier associate assigned' },
    { key: 'delivered', label: '5. Delivered', desc: 'Handed over at doorstep' }
  ];

  return (
    <div className="orders-page">
      {/* Quick Track Order Banner */}
      <div className="quick-track-card">
        <div className="track-card-text">
          <div className="track-icon-wrapper">
            <Truck size={22} />
          </div>
          <div>
            <h3>Live Order Tracking & Dispatch Hub</h3>
            <p>Track customer dispatches across Tamil Nadu districts in real-time</p>
          </div>
        </div>

        <form onSubmit={handleQuickTrack} className="quick-track-form">
          <input
            type="text"
            placeholder="Track Order ID (e.g. VPN-849201)"
            value={quickTrackId}
            onChange={(e) => setQuickTrackId(e.target.value)}
          />
          <button type="submit" className="btn-track-submit">
            <Navigation size={15} />
            <span>Track Order</span>
          </button>
        </form>
      </div>

      {/* Filters Toolbar */}
      <div className="orders-toolbar">
        <div className="status-tabs">
          {['all', 'confirmed', 'packed', 'in-transit', 'out-for-delivery', 'delivered', 'cancelled'].map((st) => {
            const count = st === 'all'
              ? orders.length
              : orders.filter(o => o.currentStatus === st).length;
            return (
              <button
                key={st}
                className={`status-tab ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.replace('-', ' ')} ({count})
              </button>
            );
          })}
        </div>

        <div className="table-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search Order ID, Customer, Phone, District..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="dash-card">
        <div className="table-responsive">
          <table className="dash-table orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Customer & Contact</th>
                <th>Destination</th>
                <th>Items (Weights)</th>
                <th>Total</th>
                <th>Milestone Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.orderId}>
                    <td className="bold-id">
                      <div className="order-id-wrapper">
                        <span>{order.orderId}</span>
                        <button
                          className="btn-copy-id"
                          onClick={() => handleCopyOrderId(order.orderId)}
                          title="Copy Order ID"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="date-cell">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <div className="customer-cell">
                        <strong>{order.customer?.name}</strong>
                        <a href={`tel:${order.customer?.phone}`} className="phone-link">
                          <Phone size={11} /> {order.customer?.phone}
                        </a>
                      </div>
                    </td>
                    <td>
                      <span className="district-pill">
                        <MapPin size={12} />
                        {order.shippingAddress?.district || order.shippingAddress?.city}, TN
                      </span>
                    </td>
                    <td>
                      <div className="items-preview-stack">
                        {order.items?.map((it, idx) => (
                          <span key={idx} className="item-pill">
                            {it.title} ({it.weight}) × {it.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="amount-cell">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`status-badge ${order.currentStatus.replace('-', '')}`}>
                        {order.currentStatus.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="table-actions-group">
                        <button
                          className="manage-order-btn"
                          onClick={() => setSelectedOrder(order)}
                          title="Open Live Dispatch Stepper & Tracking Details"
                        >
                          <Truck size={13} />
                          <span>Track & Update</span>
                        </button>
                        <button
                          className="quick-print-slip-btn"
                          onClick={() => handlePrintPackingSlip(order)}
                          title="Print Warehouse Packing Slip"
                        >
                          <Printer size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">No orders found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Dispatch & Milestone Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card order-modal">
            <div className="admin-modal-header">
              <div className="header-meta-group">
                <div className="order-header-badge">
                  <Truck size={14} />
                  <span>LIVE TRACKING MANAGER</span>
                </div>
                <h3>Order #{selectedOrder.orderId}</h3>
              </div>
              <div className="header-actions-right">
                {selectedOrder.currentStatus !== 'delivered' && selectedOrder.currentStatus !== 'cancelled' && (
                  <button
                    className="btn-admin-cancel-order"
                    onClick={() => handleCancelOrder(selectedOrder.orderId)}
                    title="Cancel this customer order"
                  >
                    <XCircle size={15} />
                    <span>Cancel Order</span>
                  </button>
                )}
                <button
                  className="btn-print-receipt"
                  onClick={() => handlePrintPackingSlip(selectedOrder)}
                  title="Print Warehouse Packing Slip & Shipping Label"
                >
                  <Printer size={16} />
                  <span>Print Warehouse Slip</span>
                </button>
                <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="order-modal-body">
              {/* Order Cancelled Alert Banner */}
              {selectedOrder.currentStatus === 'cancelled' && (
                <div className="admin-cancelled-alert">
                  <AlertTriangle size={20} className="cancelled-alert-icon" />
                  <div className="cancelled-alert-text">
                    <strong>Order Cancelled</strong>
                    <p>{selectedOrder.cancelReason ? `Reason: ${selectedOrder.cancelReason}` : 'This order has been cancelled.'}</p>
                    {selectedOrder.cancelledAt && (
                      <span className="cancelled-time-text">
                        Cancelled on: {new Date(selectedOrder.cancelledAt).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Live Tracking Visual Stepper */}
              <div className="dispatch-stepper-box">
                <div className="stepper-box-title">
                  <h4>Advance Live Tracking Milestone</h4>
                  <span className="current-status-tag">
                    Current: <strong>{selectedOrder.currentStatus.toUpperCase()}</strong>
                  </span>
                </div>
                <p>Click any milestone below to update the customer's live tracking screen across Tamil Nadu:</p>

                <div className="stepper-buttons-row">
                  {statusMilestones.map((st, i) => {
                    const isCurrent = selectedOrder.currentStatus === st.key;
                    return (
                      <button
                        key={st.key}
                        className={`stepper-btn ${isCurrent ? 'active-step' : ''}`}
                        onClick={() => handleUpdateStatus(selectedOrder.orderId, st.key)}
                      >
                        <div className="stepper-top-num">Step {i + 1}</div>
                        <span className="stepper-btn-label">{st.label}</span>
                        <span className="stepper-btn-desc">{st.desc}</span>
                        {isCurrent && <CheckCircle2 size={16} className="step-check" />}
                      </button>
                    );
                  })}
                </div>

                <div className="location-input-row">
                  <MapPin size={16} className="input-icon-loc" />
                  <input
                    type="text"
                    placeholder="Add Transit Location Note (e.g. Trichy Junction Corridors -> Coimbatore Hub)"
                    value={locationNote}
                    onChange={(e) => setLocationNote(e.target.value)}
                  />
                  {locationNote && (
                    <button
                      className="btn-apply-loc"
                      onClick={() => handleUpdateStatus(selectedOrder.orderId, selectedOrder.currentStatus)}
                    >
                      Apply Note
                    </button>
                  )}
                </div>
              </div>

              {/* Complete Step-by-Step Timeline Preview */}
              <div className="timeline-review-box">
                <h5>Active Timeline Steps Log</h5>
                <div className="active-steps-list">
                  {selectedOrder.trackingSteps?.map((step, idx) => (
                    <div key={idx} className={`admin-timeline-item ${step.completed ? 'completed' : 'pending'}`}>
                      <div className="timeline-dot-wrapper">
                        <div className={`timeline-dot ${step.completed ? 'done' : ''}`} />
                        {idx < selectedOrder.trackingSteps.length - 1 && <div className="timeline-line" />}
                      </div>
                      <div className="timeline-text">
                        <div className="timeline-header-row">
                          <strong>{step.title}</strong>
                          <span className="timeline-time">
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="timeline-desc">{step.description}</p>
                        <span className="timeline-loc"><MapPin size={11} /> {step.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Info & Address Grid */}
              <div className="order-details-grid">
                <div className="detail-box">
                  <h5>Customer & Tamil Nadu Delivery Address</h5>
                  <p><strong>Name:</strong> {selectedOrder.customer?.name}</p>
                  <p>
                    <strong>Phone:</strong>
                    <a href={`tel:${selectedOrder.customer?.phone}`} className="phone-contact">
                      <Phone size={13} /> {selectedOrder.customer?.phone}
                    </a>
                  </p>
                  {selectedOrder.customer?.email && <p><strong>Email:</strong> {selectedOrder.customer?.email}</p>}
                  <p className="address-paragraph">
                    <MapPin size={14} className="address-icon" />
                    <span>
                      {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.district} - {selectedOrder.shippingAddress?.pincode}, Tamil Nadu
                    </span>
                  </p>
                </div>

                <div className="detail-box">
                  <h5>Billing & Payment Details</h5>
                  <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod === 'razorpay' ? 'RAZORPAY (Prepaid Online)' : selectedOrder.paymentMethod === 'cod' ? 'CASH ON DELIVERY (COD)' : selectedOrder.paymentMethod?.toUpperCase()}</p>
                  <p><strong>Payment Status:</strong> <span className={selectedOrder.paymentStatus === 'paid' ? 'badge-paid' : 'badge-pending'}>{selectedOrder.paymentStatus?.toUpperCase() || (selectedOrder.paymentMethod === 'cod' ? 'PENDING' : 'PAID')}</span></p>
                  {selectedOrder.razorpayPaymentId && (
                    <p><strong>Razorpay Ref ID:</strong> <code>{selectedOrder.razorpayPaymentId}</code></p>
                  )}
                  <p><strong>Subtotal:</strong> ₹{selectedOrder.subtotal}</p>
                  {selectedOrder.discount > 0 && <p className="text-green"><strong>Discount Applied:</strong> -₹{selectedOrder.discount}</p>}
                  <p><strong>Delivery Fee:</strong> FREE across Tamil Nadu</p>
                  <p className="total-highlight"><strong>Grand Total:</strong> ₹{selectedOrder.totalAmount}</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="order-items-box">
                <h5>Package Breakdown ({selectedOrder.items?.length || 0} items)</h5>
                <div className="items-list-table">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="item-row">
                      <div className="item-title-meta">
                        <strong>{it.title}</strong>
                        <span className="pkg-weight-badge">Variant: {it.weight}</span>
                      </div>
                      <div className="item-qty-meta">
                        <span>₹{it.unitPrice} × {it.quantity}</span>
                        <strong className="item-total">₹{it.totalPrice}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
