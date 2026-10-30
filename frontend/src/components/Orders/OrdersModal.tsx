import React, { useEffect, useState } from 'react';
import {
    X,
    Package,
    Truck,
    MapPin,
    Calendar,
    ArrowRight,
    ShoppingBag,
    Phone,
    CheckCircle2,
    Clock,
    RefreshCw,
    Printer,
    FileText,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import { useOrders, type Order } from '../../context/OrderContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './OrdersModal.css';

const OrdersModal: React.FC = () => {
    const {
        orders,
        isOrdersModalOpen,
        closeOrdersModal,
        selectedOrder,
        setSelectedOrder,
        cancelOrder
    } = useOrders();

    const { isAuthenticated, openAuthModal } = useAuth();
    const { addToCart, setIsCartOpen } = useCart();

    // Cancel order dialog state
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReasonSelect, setCancelReasonSelect] = useState('Changed my mind / No longer needed');
    const [cancelCustomNote, setCancelCustomNote] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOrdersModalOpen) {
                closeOrdersModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOrdersModalOpen, closeOrdersModal]);

    // Prevent body scrolling when open
    useEffect(() => {
        if (isOrdersModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setShowCancelDialog(false);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOrdersModalOpen]);

    if (!isOrdersModalOpen) return null;

    const currentOrder: Order | null = selectedOrder || (orders.length > 0 ? orders[0] : null);

    const handleConfirmCancellation = async () => {
        if (!currentOrder) return;
        setIsCancelling(true);
        const finalReason = cancelReasonSelect === 'Other' && cancelCustomNote.trim()
            ? cancelCustomNote.trim()
            : cancelReasonSelect;
        const res = await cancelOrder(currentOrder.id, finalReason);
        setIsCancelling(false);
        if (res.success) {
            setShowCancelDialog(false);
            setCancelCustomNote('');
        } else {
            alert(res.error || 'Failed to cancel order.');
        }
    };

    const handleReorder = (order: Order) => {
        order.items.forEach(item => {
            addToCart({
                id: item.id,
                title: item.title,
                description: 'Reordered item',
                price: item.price,
                weights: item.weights,
                image: item.image
            }, item.quantity);
        });
        closeOrdersModal();
        setIsCartOpen(true);
    };

    const handlePrintInvoice = (order: Order) => {
        const printWindow = window.open('', '_blank', 'width=850,height=950');
        if (!printWindow) {
            alert('Please allow popups to generate and print your GST Tax Invoice.');
            return;
        }

        const subtotal = order.subtotal || order.total;
        const discount = order.discount || 0;
        const taxable = Math.max(0, subtotal - discount);
        const cgst = (taxable * 0.025).toFixed(2);
        const sgst = (taxable * 0.025).toFixed(2);
        const invoiceNum = `INV-VPN-${order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;

        const itemsRows = order.items.map((it, idx) => `
            <tr>
                <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${idx + 1}</td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: 700; color: #1e293b; font-size: 13px;">${it.title}</div>
                    <div style="font-size: 11px; color: #64748b;">Airtight Nitrogen Flush Vacuum Sealed</div>
                </td>
                <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569;">0802</td>
                <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${it.weights || '1 kg'}</td>
                <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600;">${it.quantity}</td>
                <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">₹${Number(it.price).toFixed(2)}</td>
                <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #0f172a;">₹${(it.price * it.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Tax Invoice - ${invoiceNum} | VP Nuts</title>
    <style>
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.5;
        }
        .invoice-card {
            max-width: 780px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            padding: 28px;
            border-radius: 8px;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #8b2500;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .brand-title {
            font-size: 24px;
            font-weight: 900;
            color: #8b2500;
            letter-spacing: 0.5px;
            margin: 0;
        }
        .brand-sub {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        .company-meta {
            font-size: 11.5px;
            color: #475569;
            line-height: 1.4;
            margin-top: 6px;
        }
        .invoice-badge-box {
            text-align: right;
        }
        .invoice-badge {
            display: inline-block;
            background: #8b2500;
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            padding: 5px 12px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .invoice-meta-table {
            width: 100%;
            margin-top: 10px;
            font-size: 12px;
        }
        .invoice-meta-table td {
            padding: 2px 0;
        }
        .addresses-grid {
            width: 100%;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
        }
        .addr-cell {
            width: 50%;
            padding: 12px 14px;
            vertical-align: top;
            background: #f8fafc;
        }
        .addr-cell:first-child {
            border-right: 1px solid #e2e8f0;
        }
        .addr-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #8b2500;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th {
            background: #f1f5f9;
            color: #334155;
            font-size: 11.5px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 8px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
        }
        .calc-table-wrap {
            width: 100%;
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
        }
        .summary-box {
            width: 320px;
            margin-left: auto;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 14px;
            background: #fdfaf7;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 12.5px;
            color: #475569;
        }
        .summary-row.total {
            border-top: 2px solid #8b2500;
            margin-top: 6px;
            padding-top: 8px;
            font-size: 15px;
            font-weight: 800;
            color: #8b2500;
        }
        .footer-declaration {
            border-top: 1px dashed #cbd5e1;
            padding-top: 16px;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .seal-box {
            text-align: right;
        }
        .seal-stamp {
            display: inline-block;
            border: 2px solid #8b2500;
            color: #8b2500;
            font-weight: 800;
            font-size: 10px;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
        }
        .print-btn-bar {
            text-align: center;
            margin-bottom: 16px;
        }
        .print-btn {
            background: #8b2500;
            color: white;
            border: none;
            padding: 8px 20px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer;
        }
        @media print {
            .print-btn-bar { display: none; }
            body { padding: 0; }
            .invoice-card { border: none; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="print-btn-bar">
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>

    <div class="invoice-card">
        <table class="header-table">
            <tr>
                <td style="vertical-align: top;">
                    <h1 class="brand-title">VP NUTS</h1>
                    <div class="brand-sub">Premium Dry Fruits & Nutrient Seeds</div>
                    <div class="company-meta">
                        Headquarters: 17th Cross, Near Big Bazaar, Kumbakonam - 612001, TN<br />
                        <strong>GSTIN:</strong> 33AAAAA0000A1Z5 | <strong>FSSAI Lic:</strong> 12423005000123<br />
                        Contact: support@vrnuts.com | +91 82007 37159
                    </div>
                </td>
                <td style="vertical-align: top; text-align: right;">
                    <div class="invoice-badge">TAX INVOICE</div>
                    <table class="invoice-meta-table">
                        <tr>
                            <td style="color: #64748b;">Invoice No:</td>
                            <td style="text-align: right; font-weight: 700;">${invoiceNum}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b;">Invoice Date:</td>
                            <td style="text-align: right;">${order.date}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b;">Order ID:</td>
                            <td style="text-align: right; font-weight: 600;">#${order.id}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b;">Payment Mode:</td>
                            <td style="text-align: right; text-transform: uppercase; font-weight: 700;">
                                ${order.paymentMethod === 'razorpay' ? 'RAZORPAY ONLINE (PAID)' : order.paymentMethod}
                            </td>
                        </tr>
                        ${order.razorpayPaymentId ? `
                        <tr>
                            <td style="color: #64748b;">Payment Ref:</td>
                            <td style="text-align: right; font-family: monospace; font-size: 11px; color: #166534; font-weight: 700;">${order.razorpayPaymentId}</td>
                        </tr>
                        ` : ''}
                    </table>
                </td>
            </tr>
        </table>

        <table class="addresses-grid" cellspacing="0" cellpadding="0">
            <tr>
                <td class="addr-cell">
                    <div class="addr-title">Billed To (Customer Details):</div>
                    <div style="font-weight: 700; color: #0f172a; font-size: 13.5px;">${order.recipientName}</div>
                    <div style="color: #475569; margin-top: 3px;">${order.deliveryAddress}</div>
                    <div style="color: #475569;">${order.deliveryCity}, Tamil Nadu - <strong>${order.deliveryPincode}</strong></div>
                    <div style="color: #0f172a; font-size: 12px; margin-top: 4px;">Phone: <strong>${order.recipientPhone}</strong></div>
                    ${order.userEmail ? `<div style="color: #64748b; font-size: 11px;">Email: ${order.userEmail}</div>` : ''}
                </td>
                <td class="addr-cell">
                    <div class="addr-title">Shipped & Delivered From:</div>
                    <div style="font-weight: 700; color: #0f172a; font-size: 13.5px;">VP Nuts Fulfillment Centre</div>
                    <div style="color: #475569; margin-top: 3px;">Kumbakonam Central Dispatch Hub</div>
                    <div style="color: #475569;">Thanjavur District, Tamil Nadu - 612001</div>
                    <div style="color: #15803d; font-size: 12px; margin-top: 4px; font-weight: 600;">✓ Express Tamil Nadu Surface Logistics</div>
                </td>
            </tr>
        </table>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 35px; text-align: center;">#</th>
                    <th style="text-align: left;">Item Description</th>
                    <th style="width: 60px; text-align: center;">HSN</th>
                    <th style="width: 70px; text-align: center;">Weight</th>
                    <th style="width: 45px; text-align: center;">Qty</th>
                    <th style="width: 80px; text-align: right;">Unit Rate</th>
                    <th style="width: 95px; text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>

        <div class="calc-table-wrap">
            <div class="summary-box">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₹${Number(subtotal).toFixed(2)}</span>
                </div>
                ${discount > 0 ? `
                <div class="summary-row" style="color: #16a34a; font-weight: 600;">
                    <span>Festive Promo Discount:</span>
                    <span>-₹${Number(discount).toFixed(2)}</span>
                </div>` : ''}
                <div class="summary-row">
                    <span>Taxable Value:</span>
                    <span>₹${taxable.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>CGST (2.5%):</span>
                    <span>₹${cgst}</span>
                </div>
                <div class="summary-row">
                    <span>SGST (2.5%):</span>
                    <span>₹${sgst}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping Charges:</span>
                    <span style="color: #16a34a; font-weight: 600;">FREE</span>
                </div>
                <div class="summary-row total">
                    <span>Invoice Total:</span>
                    <span>₹${Number(order.total).toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div class="footer-declaration">
            <div>
                <strong>Terms & Conditions:</strong><br />
                1. All products sealed in food-grade vacuum nitrogen atmosphere.<br />
                2. Goods once sold are covered under VP Nuts Freshness Guarantee.<br />
                3. This is a computer generated invoice valid without physical signature.<br />
                4. All disputes subject to Kumbakonam, Tamil Nadu jurisdiction.
            </div>
            <div class="seal-box">
                <div style="font-size: 11px; color: #475569;">For <strong>VP NUTS TRADERS</strong></div>
                <div class="seal-stamp">Verified & Authorized</div>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    return (
        <div className="orders-modal-overlay" onClick={closeOrdersModal}>
            <div className="orders-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="orders-header">
                    <div className="orders-header-title">
                        <Package size={22} className="orders-header-icon" />
                        <h2>My Orders & Live Tracking</h2>
                        {orders.length > 0 && <span className="orders-count-badge">{orders.length}</span>}
                    </div>
                    <button className="orders-close-btn" onClick={closeOrdersModal} aria-label="Close orders modal">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                {orders.length === 0 ? (
                    <div className="orders-empty-state">
                        <div className="empty-package-circle">
                            <Package size={48} />
                        </div>
                        <h3>{!isAuthenticated ? 'Sign In to View Orders' : 'No Orders Found'}</h3>
                        <p>
                            {!isAuthenticated
                                ? 'Please log in with your VP Nuts account to track your orders and view order history.'
                                : "You haven't placed any orders with VP Nuts yet."}
                        </p>
                        {!isAuthenticated ? (
                            <button
                                className="orders-shop-btn"
                                onClick={() => {
                                    closeOrdersModal();
                                    openAuthModal('signin');
                                }}
                            >
                                Sign In Now <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                className="orders-shop-btn"
                                onClick={() => {
                                    closeOrdersModal();
                                    const el = document.getElementById('products');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Browse Dry Fruits & Nuts <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="orders-layout">
                        {/* Left Column: Orders List */}
                        <div className="orders-sidebar">
                            <h3 className="sidebar-heading">Past Orders</h3>
                            <div className="orders-list">
                                {orders.map((order) => {
                                    const isSelected = currentOrder?.id === order.id;
                                    return (
                                        <div
                                            key={order.id}
                                            className={`order-card-summary ${isSelected ? 'selected' : ''}`}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <div className="order-summary-top">
                                                <span className="order-summary-id">#{order.id}</span>
                                                <span className={`order-status-pill ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="order-summary-date">
                                                <Calendar size={13} /> {order.date}
                                            </div>
                                            <div className="order-summary-items">
                                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • ₹{order.total.toFixed(2)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Column: Tracking & Order Details */}
                        {currentOrder && (
                            <div className="orders-detail-panel">
                                {/* Order Overview Banner */}
                                <div className="tracking-top-card">
                                    <div className="tracking-overview-row">
                                        <div>
                                            <span className="order-label">Tracking Order</span>
                                            <h3 className="tracking-order-id">#{currentOrder.id}</h3>
                                            <span className="order-date-text">Placed on {currentOrder.date}</span>
                                        </div>
                                        <div className="tracking-status-group">
                                            <span className={`tracking-big-status ${currentOrder.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                {currentOrder.status}
                                            </span>
                                            <span className="tracking-eta">
                                                <Clock size={14} /> Est. Delivery: {currentOrder.estimatedDelivery}
                                            </span>
                                            <button
                                                type="button"
                                                className="invoice-quick-btn"
                                                onClick={() => handlePrintInvoice(currentOrder)}
                                                title="Print or Save Tax Invoice PDF"
                                            >
                                                <Printer size={14} /> Print Tax Invoice
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Cancelled Notice Banner */}
                                {currentOrder.status === 'Cancelled' && (
                                    <div className="cancelled-order-banner">
                                        <div className="cancelled-banner-icon">
                                            <XCircle size={22} />
                                        </div>
                                        <div className="cancelled-banner-text">
                                            <h4>Order Cancelled</h4>
                                            <p>
                                                {currentOrder.cancelReason
                                                    ? `Cancellation Reason: ${currentOrder.cancelReason}`
                                                    : 'This order was cancelled.'}
                                            </p>
                                            <span className="cancelled-refund-hint">
                                                Payment Mode: <strong>{currentOrder.paymentMethod.toUpperCase()}</strong>.{' '}
                                                {currentOrder.paymentMethod === 'cod'
                                                    ? 'No amount was charged for this order.'
                                                    : 'Prepaid amount will be refunded to your source account within 2-4 working days.'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Step-by-Step Live Tracking Progress */}
                                <div className="tracking-stepper-box">
                                    <h4 className="section-subheading">
                                        <Truck size={16} /> Live Tamil Nadu Dispatch Journey
                                    </h4>
                                    <div className="stepper-timeline">
                                        {currentOrder.trackingSteps.map((step, idx) => (
                                            <div
                                                key={idx}
                                                className={`timeline-item ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}
                                            >
                                                <div className="timeline-marker">
                                                    {step.completed ? (
                                                        <CheckCircle2 size={18} className="marker-icon" />
                                                    ) : (
                                                        <div className="marker-dot" />
                                                    )}
                                                    {idx < currentOrder.trackingSteps.length - 1 && (
                                                        <div className="timeline-connector" />
                                                    )}
                                                </div>
                                                <div className="timeline-content">
                                                    <div className="timeline-header">
                                                        <strong className="timeline-title">{step.title}</strong>
                                                        <span className="timeline-time">{step.time}</span>
                                                    </div>
                                                    <p className="timeline-desc">{step.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivery & Recipient Details */}
                                <div className="order-info-grid">
                                    <div className="info-box">
                                        <div className="info-box-header">
                                            <MapPin size={16} /> Delivery Address
                                        </div>
                                        <div className="info-box-content">
                                            <strong>{currentOrder.recipientName}</strong>
                                            <p>{currentOrder.deliveryAddress}</p>
                                            <p>{currentOrder.deliveryCity}, Tamil Nadu - {currentOrder.deliveryPincode}</p>
                                            <p className="phone-line">
                                                <Phone size={13} /> {currentOrder.recipientPhone}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="info-box">
                                        <div className="info-box-header">
                                            <ShoppingBag size={16} /> Payment & Summary
                                        </div>
                                        <div className="info-box-content">
                                            <p>Mode: <strong style={{ textTransform: 'uppercase' }}>{currentOrder.paymentMethod}</strong></p>
                                            <p>Subtotal: ₹{currentOrder.subtotal.toFixed(2)}</p>
                                            {currentOrder.discount > 0 && (
                                                <p className="discount-text">
                                                    Discount ({currentOrder.promoCode}): -₹{currentOrder.discount.toFixed(2)}
                                                </p>
                                            )}
                                            <p>Shipping: <span className="free-tag">FREE (Tamil Nadu)</span></p>
                                            <p className="total-lead">
                                                Total Paid: <strong>₹{currentOrder.total.toFixed(2)}</strong>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Items in this Order */}
                                <div className="ordered-items-box">
                                    <h4 className="section-subheading">Items in this Package</h4>
                                    <div className="ordered-items-grid">
                                        {currentOrder.items.map((item, idx) => (
                                            <div key={idx} className="ordered-item-card">
                                                <div className="item-thumb-wrapper">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image.startsWith('/uploads') ? `http://localhost:5001${item.image}` : item.image}
                                                            alt={item.title}
                                                            className="item-thumb"
                                                        />
                                                    ) : (
                                                        <div className="item-thumb-placeholder">{item.title.charAt(0)}</div>
                                                    )}
                                                </div>
                                                <div className="item-thumb-info">
                                                    <span className="item-thumb-title">{item.title}</span>
                                                    <span className="item-thumb-weight">{item.weights} × {item.quantity}</span>
                                                    <span className="item-thumb-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Reorder & Invoice CTA */}
                                <div className="tracking-footer-actions">
                                    {currentOrder.status !== 'Delivered' && currentOrder.status !== 'Cancelled' && (
                                        <button
                                            type="button"
                                            className="cancel-order-trigger-btn"
                                            onClick={() => setShowCancelDialog(true)}
                                            title="Cancel this order before dispatch"
                                        >
                                            <XCircle size={16} /> Cancel Order
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="invoice-footer-btn"
                                        onClick={() => handlePrintInvoice(currentOrder)}
                                    >
                                        <FileText size={16} /> Download / Print Tax Invoice
                                    </button>
                                    <button
                                        type="button"
                                        className="reorder-btn"
                                        onClick={() => handleReorder(currentOrder)}
                                    >
                                        <RefreshCw size={16} /> Reorder These Items
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Cancel Order Confirmation Dialog */}
                {showCancelDialog && currentOrder && (
                    <div className="cancel-dialog-overlay" onClick={() => !isCancelling && setShowCancelDialog(false)}>
                        <div className="cancel-dialog-card" onClick={(e) => e.stopPropagation()}>
                            <div className="cancel-dialog-header">
                                <div className="cancel-icon-circle">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="cancel-dialog-title-col">
                                    <h3>Cancel Order #{currentOrder.id}?</h3>
                                    <span className="cancel-order-meta">
                                        Total: ₹{currentOrder.total.toFixed(2)} • {currentOrder.items.length} {currentOrder.items.length === 1 ? 'item' : 'items'}
                                    </span>
                                </div>
                                <button
                                    className="cancel-dialog-close-btn"
                                    onClick={() => !isCancelling && setShowCancelDialog(false)}
                                    aria-label="Close dialog"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="cancel-dialog-intro">
                                Are you sure you want to cancel this order? Once confirmed, processing and dispatch from Kumbakonam hub will be halted immediately.
                            </p>

                            <div className="cancel-reason-group">
                                <label htmlFor="cancel-reason-select">Please select a reason for cancellation:</label>
                                <select
                                    id="cancel-reason-select"
                                    value={cancelReasonSelect}
                                    onChange={(e) => setCancelReasonSelect(e.target.value)}
                                    className="cancel-reason-select"
                                    disabled={isCancelling}
                                >
                                    <option value="Changed my mind / No longer needed">Changed my mind / No longer needed</option>
                                    <option value="Incorrect delivery address or contact number">Incorrect delivery address or contact number</option>
                                    <option value="Duplicate order placed by mistake">Duplicate order placed by mistake</option>
                                    <option value="Delivery timeframe is too late">Delivery timeframe is too late</option>
                                    <option value="Wanted to add more items / change variant">Wanted to add more items / change variant</option>
                                    <option value="Other">Other Reason</option>
                                </select>

                                {cancelReasonSelect === 'Other' && (
                                    <textarea
                                        placeholder="Please tell us the reason for cancelling..."
                                        value={cancelCustomNote}
                                        onChange={(e) => setCancelCustomNote(e.target.value)}
                                        className="cancel-custom-textarea"
                                        rows={3}
                                        disabled={isCancelling}
                                    />
                                )}
                            </div>

                            <div className="cancel-dialog-actions">
                                <button
                                    type="button"
                                    className="btn-keep-order"
                                    onClick={() => setShowCancelDialog(false)}
                                    disabled={isCancelling}
                                >
                                    Don't Cancel (Keep Order)
                                </button>
                                <button
                                    type="button"
                                    className="btn-confirm-cancel"
                                    onClick={handleConfirmCancellation}
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? 'Cancelling Order...' : 'Yes, Cancel Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersModal;

