import React, { useEffect, useState, useCallback } from 'react';
import {
    X,
    Trash2,
    ShoppingBag,
    ArrowRight,
    CheckCircle2,
    Tag,
    ArrowLeft,
    Truck,
    CreditCard,
    Smartphone,
    Banknote,
    ChevronDown,
    MapPin,
    Plus,
    Home,
    Briefcase,
    Phone,
    AlertCircle,
    ShieldCheck,
    Lock,
    RefreshCw
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import type { Address } from '../../context/AuthTypes';
import { loadRazorpayScript, type RazorpayOptions, type RazorpayPaymentSuccess } from '../../services/razorpay';
import { createRazorpayOrderApi, verifyRazorpayPaymentApi } from '../../services/backendApi';
import './CartDrawer.css';

type DrawerStep = 'cart' | 'checkout' | 'success';

const CartDrawer: React.FC = () => {
    const {
        cartItems,
        isCartOpen,
        setIsCartOpen,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotalPrice,
        discountPrice,
        totalPrice,
        promoCode,
        applyPromoCode,
        removePromoCode
    } = useCart();

    const { user, isAuthenticated, isAuthModalOpen, openAuthModal, openProfileModal, addAddress } = useAuth();
    const { createOrder, openOrdersModal } = useOrders();

    const [step, setStep] = useState<DrawerStep>('cart');
    const [couponInput, setCouponInput] = useState('');
    const [couponFeedback, setCouponFeedback] = useState<{ text: string; isError: boolean } | null>(null);
    const [pendingCheckout, setPendingCheckout] = useState(false);

    // Saved addresses from user profile
    const savedAddresses: Address[] = user?.addresses || [];

    // selectedAddressId: id of selected address card, or 'new' when entering a new address, or '' when user must select
    const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
        if (user?.addresses && user.addresses.length > 0) {
            // Do not take default address automatically; require customer to select
            return '';
        }
        return 'new';
    });

    // Checkout form state
    const [recipientName, setRecipientName] = useState(() => user?.name || '');
    const [recipientPhone, setRecipientPhone] = useState(() => (user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''));
    const [phoneError, setPhoneError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryCity, setDeliveryCity] = useState('');
    const [deliveryPincode, setDeliveryPincode] = useState('');
    const [saveNewAddress, setSaveNewAddress] = useState(true);
    const [newAddressLabel, setNewAddressLabel] = useState<'Home' | 'Office' | 'Other'>('Home');

    const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [devRazorpayModal, setDevRazorpayModal] = useState<{
        orderId: string;
        amount: number;
        keyId: string;
        onSuccess: (data: RazorpayPaymentSuccess) => void;
        onCancel: () => void;
    } | null>(null);

    const [orderId, setOrderId] = useState('');
    const [confirmedOrderSummary, setConfirmedOrderSummary] = useState<{
        recipientName: string;
        deliveryAddress: string;
        deliveryCity: string;
        deliveryPincode: string;
        paymentMethod?: string;
        paymentStatus?: string;
        razorpayPaymentId?: string;
    } | null>(null);

    const applyAddress = (addr: Address) => {
        setSelectedAddressId(addr.id);
        setRecipientName(addr.fullName || user?.name || '');
        setRecipientPhone(addr.phone ? addr.phone.replace(/\D/g, '').slice(-10) : '');
        setPhoneError('');
        setAddressError('');
        setDeliveryAddress(addr.street || '');
        setDeliveryCity(addr.city || '');
        setDeliveryPincode(addr.pincode || '');
    };

    // Keep selectedAddressId in sync when user profile loads or changes
    useEffect(() => {
        if (savedAddresses.length > 0) {
            // Do NOT auto-select default address; user must select
            if (selectedAddressId && selectedAddressId !== 'new') {
                const found = savedAddresses.find(a => a.id === selectedAddressId);
                if (!found) {
                    setSelectedAddressId('');
                }
            }
        } else {
            // For new users without any saved addresses, open the full new address form
            setSelectedAddressId('new');
        }
    }, [savedAddresses.length]);

    // Keep recipient name & phone in sync when user profile loads
    useEffect(() => {
        if (user && savedAddresses.length === 0) {
            if (!recipientName && user.name) setRecipientName(user.name);
            if (!recipientPhone && user.phone) setRecipientPhone(user.phone.replace(/\D/g, '').slice(-10));
        }
    }, [user, savedAddresses.length]);

    const handleSelectSavedAddress = (addr: Address) => {
        applyAddress(addr);
        setAddressError('');
    };

    const handleSelectNewAddress = () => {
        setSelectedAddressId('new');
        setAddressError('');
        setDeliveryAddress('');
        setDeliveryCity('');
        setDeliveryPincode('');
        if (user?.name) setRecipientName(user.name);
        if (user?.phone) setRecipientPhone(user.phone.replace(/\D/g, '').slice(-10));
    };

    const handleProceedToCheckout = () => {
        // If not signed in, prompt customer to sign in first
        if (!isAuthenticated) {
            setPendingCheckout(true);
            openAuthModal('signin');
            return;
        }

        setAddressError('');

        if (savedAddresses.length > 0) {
            // User has saved addresses: ALWAYS ask them to pick which address to use!
            // Do NOT take default address automatically.
            setSelectedAddressId('');
            setDeliveryAddress('');
            setDeliveryCity('');
            setDeliveryPincode('');
            if (user?.name) setRecipientName(user.name);
            if (user?.phone) setRecipientPhone(user.phone.replace(/\D/g, '').slice(-10));
        } else {
            // First time user: open the full empty address form directly
            setSelectedAddressId('new');
            if (user?.name) setRecipientName(user.name);
            if (user?.phone) {
                setRecipientPhone(user.phone.replace(/\D/g, '').slice(-10));
            }
            setDeliveryAddress('');
            setDeliveryCity('');
            setDeliveryPincode('');
        }
        setStep('checkout');
    };

    // Auto-advance to checkout when sign-in completes after clicking proceed to checkout
    useEffect(() => {
        if (isAuthenticated && user && pendingCheckout) {
            setPendingCheckout(false);
            setAddressError('');
            const addrs = user.addresses || [];
            if (addrs.length > 0) {
                // User has saved addresses: require user to select Home/Office/etc.
                setSelectedAddressId('');
                setDeliveryAddress('');
                setDeliveryCity('');
                setDeliveryPincode('');
                if (user.name) setRecipientName(user.name);
                if (user.phone) setRecipientPhone(user.phone.replace(/\D/g, '').slice(-10));
            } else {
                // First time user: show empty new address form
                setSelectedAddressId('new');
                if (user.name) setRecipientName(user.name);
                if (user.phone) {
                    setRecipientPhone(user.phone.replace(/\D/g, '').slice(-10));
                }
                setDeliveryAddress('');
                setDeliveryCity('');
                setDeliveryPincode('');
            }
            setStep('checkout');
        }
    }, [isAuthenticated, user, pendingCheckout]);

    // Reset pendingCheckout if customer closes auth modal without signing in
    useEffect(() => {
        if (!isAuthModalOpen && !isAuthenticated && pendingCheckout) {
            setPendingCheckout(false);
        }
    }, [isAuthModalOpen, isAuthenticated, pendingCheckout]);

    // Ensure customer is redirected back to cart if signed out while on checkout
    useEffect(() => {
        if (!isAuthenticated && step === 'checkout') {
            setStep('cart');
        }
    }, [isAuthenticated, step]);

    const closeCart = useCallback(() => {
        setIsCartOpen(false);
        setTimeout(() => {
            if (step === 'success') {
                setStep('cart');
            }
        }, 300);
    }, [setIsCartOpen, step]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isCartOpen) {
                closeCart();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCartOpen, closeCart]);

    // Prevent body scrolling when drawer is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isCartOpen]);

    const handleApplyCoupon = (e: React.FormEvent) => {
        e.preventDefault();
        if (!couponInput.trim()) return;
        const res = applyPromoCode(couponInput);
        setCouponFeedback({ text: res.message, isError: !res.success });
        if (res.success) {
            setCouponInput('');
        }
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setPhoneError('');
        setAddressError('');

        // If user has saved addresses, they MUST select one (Home, Office, etc.) or choose Deliver to a New Address
        if (savedAddresses.length > 0 && !selectedAddressId) {
            setAddressError('Please select a delivery address (e.g. Home, Office, or Deliver to a New Address) to continue.');
            const el = document.getElementById('checkout-delivery-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        let finalName = recipientName.trim();
        let finalPhone = recipientPhone.replace(/\D/g, '');
        let finalStreet = deliveryAddress.trim();
        let finalCity = deliveryCity.trim();
        let finalPincode = deliveryPincode.replace(/\D/g, '');

        if (selectedAddressId && selectedAddressId !== 'new') {
            const addrs = user?.addresses || [];
            const chosen = addrs.find(a => a.id === selectedAddressId);
            if (!chosen) {
                setAddressError('Please select a valid delivery address.');
                return;
            }
            finalName = chosen.fullName;
            finalPhone = chosen.phone ? chosen.phone.replace(/\D/g, '') : finalPhone;
            finalStreet = chosen.street;
            finalCity = chosen.city;
            finalPincode = chosen.pincode;
        }

        if (!finalName) {
            alert('Please enter recipient full name');
            return;
        }

        if (finalPhone.length !== 10) {
            setPhoneError('Phone Number must be exactly 10 digits.');
            return;
        }

        if (!finalStreet) {
            alert('Please enter Door No. & Street address');
            return;
        }

        if (!finalCity) {
            alert('Please enter City or Town');
            return;
        }

        if (!finalPincode || finalPincode.length < 6) {
            alert('Please enter a valid 6-digit Pincode');
            return;
        }

        // Auto-save new address to profile if checked
        if (selectedAddressId === 'new' && saveNewAddress && user && addAddress) {
            try {
                await addAddress({
                    label: newAddressLabel,
                    fullName: finalName,
                    phone: finalPhone,
                    street: finalStreet,
                    city: finalCity,
                    state: 'Tamil Nadu',
                    pincode: finalPincode,
                    isDefault: (user.addresses || []).length === 0
                });
            } catch (err) {
                console.warn('Could not auto-save new address:', err);
            }
        }

        const completeOrder = (payDetails: {
            method: string;
            status: 'pending' | 'paid';
            razorpayOrderId?: string;
            razorpayPaymentId?: string;
            razorpaySignature?: string;
        }) => {
            const created = createOrder({
                userId: user?.id,
                userEmail: user?.email,
                items: cartItems.map(item => ({
                    id: item.id,
                    cartItemId: item.cartItemId,
                    title: item.title,
                    price: item.price,
                    weights: item.weights,
                    quantity: item.quantity,
                    image: item.image
                })),
                subtotal: subtotalPrice,
                discount: discountPrice,
                total: totalPrice,
                promoCode,
                recipientName: finalName,
                recipientPhone: finalPhone,
                deliveryAddress: finalStreet,
                deliveryCity: finalCity,
                deliveryPincode: finalPincode,
                paymentMethod: payDetails.method,
                paymentStatus: payDetails.status,
                razorpayOrderId: payDetails.razorpayOrderId,
                razorpayPaymentId: payDetails.razorpayPaymentId,
                razorpaySignature: payDetails.razorpaySignature
            });

            setConfirmedOrderSummary({
                recipientName: finalName,
                deliveryAddress: finalStreet,
                deliveryCity: finalCity,
                deliveryPincode: finalPincode,
                paymentMethod: payDetails.method,
                paymentStatus: payDetails.status,
                razorpayPaymentId: payDetails.razorpayPaymentId
            });

            setOrderId(created.id);
            setStep('success');
            clearCart();
            setIsProcessingPayment(false);
        };

        if (paymentMethod === 'cod') {
            completeOrder({ method: 'cod', status: 'pending' });
            return;
        }

        // RAZORPAY PAYMENT FLOW
        setIsProcessingPayment(true);
        setPaymentError('');

        try {
            const orderRes = await createRazorpayOrderApi({
                amount: totalPrice,
                notes: {
                    recipientName: finalName,
                    recipientPhone: finalPhone,
                    city: finalCity,
                    pincode: finalPincode
                }
            });

            if (!orderRes || !orderRes.success) {
                setIsProcessingPayment(false);
                setPaymentError(orderRes?.message || 'Failed to initiate Razorpay payment. Please try again or select Cash on Delivery.');
                return;
            }

            const scriptLoaded = await loadRazorpayScript();

            if (scriptLoaded && window.Razorpay && !orderRes.isMock) {
                const options: RazorpayOptions = {
                    key: orderRes.keyId,
                    amount: orderRes.amount,
                    currency: orderRes.currency || 'INR',
                    name: 'VP Nuts',
                    description: 'Premium Dry Fruits & Nutrient Seeds Order',
                    order_id: orderRes.orderId,
                    prefill: {
                        name: finalName,
                        email: user?.email || '',
                        contact: finalPhone
                    },
                    notes: {
                        city: finalCity,
                        pincode: finalPincode,
                        store: 'VP Nuts'
                    },
                    theme: {
                        color: '#8b2500'
                    },
                    modal: {
                        ondismiss: () => {
                            setIsProcessingPayment(false);
                            setPaymentError('Razorpay payment window closed. You can retry or switch to COD.');
                        }
                    },
                    handler: async (response: RazorpayPaymentSuccess) => {
                        try {
                            const verifyRes = await verifyRazorpayPaymentApi({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            if (verifyRes && verifyRes.success) {
                                completeOrder({
                                    method: 'razorpay',
                                    status: 'paid',
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpaySignature: response.razorpay_signature
                                });
                            } else {
                                setIsProcessingPayment(false);
                                setPaymentError('Payment verification could not be confirmed. Reference: ' + response.razorpay_payment_id);
                            }
                        } catch (err: any) {
                            setIsProcessingPayment(false);
                            setPaymentError('Error verifying payment: ' + (err.message || 'Unknown error'));
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                // Interactive Simulated Test Modal for local / mock mode
                setDevRazorpayModal({
                    orderId: orderRes.orderId,
                    amount: totalPrice,
                    keyId: orderRes.keyId,
                    onSuccess: async (data) => {
                        const verifyRes = await verifyRazorpayPaymentApi(data);
                        if (verifyRes && verifyRes.success) {
                            setDevRazorpayModal(null);
                            completeOrder({
                                method: 'razorpay',
                                status: 'paid',
                                razorpayOrderId: data.razorpay_order_id,
                                razorpayPaymentId: data.razorpay_payment_id,
                                razorpaySignature: data.razorpay_signature
                            });
                        } else {
                            setIsProcessingPayment(false);
                            setDevRazorpayModal(null);
                            setPaymentError('Verification failed in test mode');
                        }
                    },
                    onCancel: () => {
                        setDevRazorpayModal(null);
                        setIsProcessingPayment(false);
                        setPaymentError('Payment was cancelled');
                    }
                });
            }
        } catch (err: any) {
            setIsProcessingPayment(false);
            setPaymentError('Payment error: ' + (err.message || 'Something went wrong'));
        }
        setStep('success');
        clearCart();
    };

    const scrollToProducts = () => {
        closeCart();
        const element = document.getElementById('products');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!isCartOpen) return null;

    return (
        <div className="cart-drawer-overlay" onClick={closeCart}>
            <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="cart-header">
                    <div className="cart-header-title">
                        {step === 'checkout' && (
                            <button
                                className="cart-back-btn"
                                onClick={() => setStep('cart')}
                                aria-label="Back to Cart items"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <ShoppingBag size={22} className="cart-header-icon" />
                        <h2>
                            {step === 'cart' && 'Shopping Cart'}
                            {step === 'checkout' && 'Checkout & Delivery'}
                            {step === 'success' && 'Order Confirmed'}
                        </h2>
                        {step === 'cart' && <span className="cart-count-pill">{totalItems}</span>}
                    </div>
                    <button className="cart-close-btn" onClick={closeCart} aria-label="Close cart">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="cart-body">
                    {/* 1. ORDER SUCCESS VIEW */}
                    {step === 'success' ? (
                        <div className="cart-success-view">
                            <CheckCircle2 size={64} className="success-icon" />
                            <h3>Order Placed Successfully!</h3>
                            <div className="order-id-badge">Order ID: #{orderId}</div>
                            <p className="success-lead">
                                Thank you for shopping with <strong>VP Nuts</strong>.
                            </p>

                            <div className="order-summary-box">
                                <div className="order-summary-row">
                                    <span>Recipient:</span>
                                    <strong>{confirmedOrderSummary?.recipientName || recipientName || 'Valued Customer'}</strong>
                                </div>
                                <div className="order-summary-row">
                                    <span>Delivery to:</span>
                                    <span>
                                        {confirmedOrderSummary?.deliveryAddress ? `${confirmedOrderSummary.deliveryAddress}, ` : (deliveryAddress ? `${deliveryAddress}, ` : '')}
                                        {confirmedOrderSummary?.deliveryCity || deliveryCity}, Tamil Nadu ({confirmedOrderSummary?.deliveryPincode || deliveryPincode})
                                    </span>
                                </div>
                                <div className="order-summary-row">
                                    <span>Payment Method:</span>
                                    <strong style={{ textTransform: 'uppercase' }}>
                                        {confirmedOrderSummary?.paymentMethod === 'razorpay'
                                            ? 'Razorpay (Paid Online)'
                                            : confirmedOrderSummary?.paymentMethod === 'cod'
                                            ? 'Cash on Delivery (COD)'
                                            : (confirmedOrderSummary?.paymentMethod || paymentMethod).toUpperCase()}
                                    </strong>
                                </div>
                                {confirmedOrderSummary?.razorpayPaymentId && (
                                    <div className="order-summary-row razorpay-ref-row">
                                        <span>Payment ID:</span>
                                        <code className="razorpay-id-badge">
                                            <CheckCircle2 size={12} /> {confirmedOrderSummary.razorpayPaymentId}
                                        </code>
                                    </div>
                                )}
                                <div className="order-summary-row">
                                    <span>Est. Delivery:</span>
                                    <span className="fast-shipping-badge">1 - 2 Business Days (Swift)</span>
                                </div>
                            </div>

                            <div className="success-action-buttons">
                                <button
                                    type="button"
                                    className="track-order-cta-btn"
                                    onClick={() => {
                                        closeCart();
                                        openOrdersModal(orderId);
                                    }}
                                >
                                    <Truck size={16} /> Track Order Live
                                </button>
                                <button
                                    type="button"
                                    className="browse-btn secondary"
                                    onClick={scrollToProducts}
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    ) : step === 'checkout' ? (
                        /* 2. CHECKOUT VIEW */
                        <form id="checkout-form" className="checkout-form" onSubmit={handlePlaceOrder}>
                            {!user && (
                                <div className="checkout-auth-hint">
                                    <span>Have a VP Nuts account?</span>
                                    <button
                                        type="button"
                                        className="auth-link-btn"
                                        onClick={() => openAuthModal('signin')}
                                    >
                                        Sign In for faster checkout
                                    </button>
                                </div>
                            )}

                            <div id="checkout-delivery-section" className="checkout-delivery-section">
                                <div className="checkout-section-header-row">
                                    <h4 className="checkout-section-heading">
                                        <Truck size={17} /> Delivery Address (Tamil Nadu)
                                    </h4>
                                    {savedAddresses.length > 0 && (
                                        <button
                                            type="button"
                                            className="btn-link-manage-addr"
                                            onClick={() => openProfileModal()}
                                        >
                                            Manage Addresses
                                        </button>
                                    )}
                                </div>

                                {/* CASE 1: USER HAS SAVED ADDRESSES (1, 2, or more) */}
                                {savedAddresses.length > 0 && (
                                    <div className="checkout-saved-picker-wrap">
                                        <div className="picker-subheading">
                                            <MapPin size={14} />
                                            <span>
                                                {selectedAddressId && selectedAddressId !== 'new'
                                                    ? 'Delivering to Selected Address:'
                                                    : `Select Delivery Address (${savedAddresses.length} saved):`}
                                            </span>
                                        </div>

                                        {addressError && (
                                            <div className="checkout-addr-error-banner">
                                                <AlertCircle size={15} />
                                                <span>{addressError}</span>
                                            </div>
                                        )}

                                        {!selectedAddressId && !addressError && (
                                            <div className="checkout-addr-prompt-banner">
                                                <MapPin size={14} />
                                                <span>Please tap on an address below (Home, Office, etc.) to select where to deliver:</span>
                                            </div>
                                        )}

                                        <div className="checkout-addr-cards-list">
                                            {/* Render each saved address card as a selectable radio option */}
                                            {savedAddresses.map((addr) => {
                                                const isSelected = selectedAddressId === addr.id;
                                                return (
                                                    <div
                                                        key={addr.id}
                                                        className={`checkout-addr-card ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => handleSelectSavedAddress(addr)}
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        <div className="addr-card-radio">
                                                            <div className={`radio-outer ${isSelected ? 'checked' : ''}`}>
                                                                {isSelected && <div className="radio-inner" />}
                                                            </div>
                                                        </div>

                                                        <div className="addr-card-info">
                                                            <div className="addr-card-badges-line">
                                                                <span className="addr-type-tag">
                                                                    {addr.label === 'Home' && <Home size={11} />}
                                                                    {addr.label === 'Office' && <Briefcase size={11} />}
                                                                    {addr.label !== 'Home' && addr.label !== 'Office' && <MapPin size={11} />}
                                                                    <span>{addr.label || 'Home'}</span>
                                                                </span>
                                                                {addr.isDefault && (
                                                                    <span className="addr-default-tag">
                                                                        <CheckCircle2 size={11} /> Default
                                                                    </span>
                                                                )}
                                                                <span className="addr-phone-tag">
                                                                    <Phone size={11} /> {addr.phone}
                                                                </span>
                                                            </div>

                                                            <div className="addr-recipient-name">
                                                                {addr.fullName}
                                                            </div>

                                                            <div className="addr-details-text">
                                                                {addr.street}, {addr.city}{addr.district ? `, ${addr.district}` : ''}, {addr.state} - <strong>{addr.pincode}</strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* OPTION: Deliver to a New Address */}
                                            <div
                                                className={`checkout-addr-card new-addr-choice-card ${selectedAddressId === 'new' ? 'selected' : ''}`}
                                                onClick={handleSelectNewAddress}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <div className="addr-card-radio">
                                                    <div className={`radio-outer ${selectedAddressId === 'new' ? 'checked' : ''}`}>
                                                        {selectedAddressId === 'new' && <div className="radio-inner" />}
                                                    </div>
                                                </div>

                                                <div className="addr-card-info">
                                                    <div className="new-addr-title-line">
                                                        <Plus size={15} />
                                                        <strong>Deliver to a New Address</strong>
                                                    </div>
                                                    <span className="new-addr-hint-text">
                                                        Enter a different delivery name, door no., street or town
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* THAT FORM SHOWS: (when selectedAddressId === 'new', OR when savedAddresses.length === 0) */}
                                {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
                                    <div className="checkout-new-address-form">
                                        {savedAddresses.length > 0 && (
                                            <div className="form-subheading-divider">
                                                <span>Enter New Delivery Details:</span>
                                            </div>
                                        )}

                                        <div className="checkout-grid">
                                            <div className="checkout-field">
                                                <label>Full Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Enter recipient's full name"
                                                    value={recipientName}
                                                    onChange={(e) => setRecipientName(e.target.value)}
                                                />
                                            </div>

                                            <div className="checkout-field">
                                                <label>Phone Number *</label>
                                                <div className="cart-phone-input-wrap">
                                                    <span className="cart-phone-prefix">+91</span>
                                                    <input
                                                        type="tel"
                                                        required
                                                        maxLength={10}
                                                        placeholder="10-digit mobile number"
                                                        value={recipientPhone}
                                                        onChange={(e) => {
                                                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                            setRecipientPhone(digits);
                                                            if (digits.length === 10) setPhoneError('');
                                                        }}
                                                    />
                                                </div>
                                                {phoneError && <span className="cart-phone-error">{phoneError}</span>}
                                            </div>
                                        </div>

                                        <div className="checkout-field">
                                            <label>Door No., Building & Street Address *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Door No., Building, Street (e.g. 17th Cross, Gandhi Nagar)"
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                            />
                                        </div>

                                        <div className="checkout-grid">
                                            <div className="checkout-field">
                                                <label>City / Town (Tamil Nadu) *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Enter City / Town (e.g. Kumbakonam, Chennai, Madurai, Coimbatore)"
                                                    value={deliveryCity}
                                                    onChange={(e) => setDeliveryCity(e.target.value)}
                                                />
                                            </div>
                                            <div className="checkout-field">
                                                <label>Pincode *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength={6}
                                                    placeholder="Enter 6-digit Pincode (e.g. 612001)"
                                                    value={deliveryPincode}
                                                    onChange={(e) => setDeliveryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                />
                                            </div>
                                        </div>

                                        {isAuthenticated && (
                                            <div className="save-addr-row">
                                                <label className="save-addr-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={saveNewAddress}
                                                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                                                    />
                                                    <span>Save this address to my VP Nuts account for future orders</span>
                                                </label>

                                                {saveNewAddress && (
                                                    <div className="save-addr-type-chooser">
                                                        <span className="save-tag-prompt">Tag as:</span>
                                                        <div className="save-tag-pills">
                                                            {(['Home', 'Office', 'Other'] as const).map((lbl) => (
                                                                <button
                                                                    key={lbl}
                                                                    type="button"
                                                                    className={`save-tag-pill ${newAddressLabel === lbl ? 'active' : ''}`}
                                                                    onClick={() => setNewAddressLabel(lbl)}
                                                                >
                                                                    {lbl}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <h4 className="checkout-section-heading" style={{ marginTop: '1.25rem' }}>
                                <CreditCard size={16} /> Select Payment Method
                            </h4>

                            {paymentError && (
                                <div className="checkout-payment-error-banner">
                                    <AlertCircle size={15} />
                                    <span>{paymentError}</span>
                                </div>
                            )}

                            <div className="payment-options">
                                {/* Option 1: Razorpay (UPI, GPay, PhonePe, Cards, NetBanking) */}
                                <label className={`payment-card ${paymentMethod === 'razorpay' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'razorpay'}
                                        onChange={() => {
                                            setPaymentMethod('razorpay');
                                            setPaymentError('');
                                        }}
                                    />
                                    <div className="pay-card-icon-wrap razorpay-icon-wrap">
                                        <ShieldCheck size={22} className="pay-icon" />
                                    </div>
                                    <div className="pay-card-info">
                                        <div className="pay-title-badge-row">
                                            <strong>Razorpay Secure (UPI, Cards, NetBanking)</strong>
                                            <span className="pay-recommended-badge">Instant & Safe</span>
                                        </div>
                                        <p>Pay with Google Pay, PhonePe, Paytm, Debit/Credit Cards or Net Banking</p>
                                        <div className="razorpay-sub-icons">
                                            <span className="rzp-pill">Google Pay</span>
                                            <span className="rzp-pill">PhonePe</span>
                                            <span className="rzp-pill">Paytm</span>
                                            <span className="rzp-pill">UPI</span>
                                            <span className="rzp-pill">Cards</span>
                                            <span className="rzp-pill">NetBanking</span>
                                        </div>
                                    </div>
                                </label>

                                {/* Option 2: Cash on Delivery */}
                                <label className={`payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => {
                                            setPaymentMethod('cod');
                                            setPaymentError('');
                                        }}
                                    />
                                    <div className="pay-card-icon-wrap">
                                        <Banknote size={22} className="pay-icon" />
                                    </div>
                                    <div className="pay-card-info">
                                        <div className="pay-title-badge-row">
                                            <strong>Cash on Delivery (COD)</strong>
                                        </div>
                                        <p>Pay cash upon doorstep delivery across Tamil Nadu</p>
                                    </div>
                                </label>
                            </div>
                        </form>
                    ) : cartItems.length === 0 ? (
                        /* 3. EMPTY CART VIEW */
                        <div className="cart-empty-view">
                            <div className="empty-cart-circle">
                                <ShoppingBag size={48} />
                            </div>
                            <h3>Your Cart is Empty</h3>
                            <p>Discover our selection of premium handpicked nuts and dry fruits.</p>
                            <button className="browse-btn" onClick={scrollToProducts}>
                                Explore Products <ArrowRight size={16} />
                            </button>
                        </div>
                    ) : (
                        /* 4. CART ITEMS VIEW */
                        <div className="cart-content-wrapper">
                            <div className="cart-items-list">
                                {cartItems.map((item) => (
                                    <div key={item.cartItemId} className="cart-item">
                                        <div className="cart-item-image-wrapper">
                                            {item.image ? (
                                                <img
                                                    src={item.image.startsWith('/uploads') ? `http://localhost:5001${item.image}` : item.image}
                                                    alt={item.title}
                                                    className="cart-item-img"
                                                />
                                            ) : (
                                                <div className="cart-item-img-placeholder">
                                                    {item.title.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="cart-item-details">
                                            <div className="cart-item-header">
                                                <h4 className="cart-item-title">{item.title}</h4>
                                                <button
                                                    className="cart-item-remove-btn"
                                                    onClick={() => removeFromCart(item.cartItemId)}
                                                    title="Remove item"
                                                    aria-label={`Remove ${item.title} from cart`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="cart-item-weight-badge">{item.weights}</div>

                                            <div className="cart-item-pricing-row">
                                                <div className="cart-qty-dropdown-wrapper">
                                                    <label htmlFor={`cart-qty-${item.cartItemId}`} className="cart-qty-label">
                                                        Qty:
                                                    </label>
                                                    <select
                                                        id={`cart-qty-${item.cartItemId}`}
                                                        className="cart-qty-dropdown"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.cartItemId, Number(e.target.value))}
                                                        aria-label={`Select quantity for ${item.title}`}
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                            <option key={num} value={num}>
                                                                {num}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={13} className="cart-qty-chevron" />
                                                </div>

                                                <div className="cart-item-price">
                                                    ₹{(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Section */}
                            <div className="cart-coupon-section">
                                <form className="coupon-form" onSubmit={handleApplyCoupon}>
                                    <div className="coupon-input-group">
                                        <Tag size={16} className="coupon-icon" />
                                        <input
                                            type="text"
                                            placeholder="Promo Code (e.g. VPNUTS10)"
                                            value={couponInput}
                                            onChange={(e) => setCouponInput(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="coupon-apply-btn">
                                        Apply
                                    </button>
                                </form>

                                {promoCode && (
                                    <div className="active-coupon-tag">
                                        <span>Coupon <strong>{promoCode}</strong> applied (-₹{discountPrice})</span>
                                        <button type="button" onClick={removePromoCode} className="remove-coupon-btn">
                                            Remove
                                        </button>
                                    </div>
                                )}

                                {couponFeedback && (
                                    <p className={`coupon-feedback ${couponFeedback.isError ? 'error' : 'success'}`}>
                                        {couponFeedback.text}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {step !== 'success' && cartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-summary-line">
                            <span>Subtotal</span>
                            <span>₹{subtotalPrice.toFixed(2)}</span>
                        </div>

                        {discountPrice > 0 && (
                            <div className="cart-summary-line discount-line">
                                <span>Discount ({promoCode})</span>
                                <span className="discount-amount">-₹{discountPrice.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="cart-summary-line delivery-line">
                            <span>Shipping</span>
                            <span className="free-badge">FREE (Tamil Nadu)</span>
                        </div>

                        <div className="cart-total-line">
                            <span>Total</span>
                            <span className="total-amount">₹{totalPrice.toFixed(2)}</span>
                        </div>

                        {step === 'cart' ? (
                            <button className="checkout-btn" onClick={handleProceedToCheckout}>
                                Proceed to Checkout
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                form="checkout-form"
                                className={`checkout-btn ${isProcessingPayment ? 'loading' : ''}`}
                                disabled={isProcessingPayment}
                            >
                                {isProcessingPayment ? (
                                    <>
                                        <RefreshCw size={17} className="cart-spin-icon" />
                                        <span>Opening Razorpay Gateway...</span>
                                    </>
                                ) : paymentMethod === 'razorpay' ? (
                                    <>
                                        <span>Pay ₹{totalPrice.toFixed(2)} with Razorpay</span>
                                        <ShieldCheck size={18} />
                                    </>
                                ) : (
                                    <>
                                        <span>Place Order (COD - ₹{totalPrice.toFixed(2)})</span>
                                        <CheckCircle2 size={18} />
                                    </>
                                )}
                            </button>
                        )}

                        {step === 'cart' && (
                            <button className="clear-cart-link" onClick={clearCart}>
                                Clear Cart
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Interactive Razorpay Dev / Test Mode Modal */}
            {devRazorpayModal && (
                <div className="razorpay-dev-overlay" onClick={devRazorpayModal.onCancel}>
                    <div className="razorpay-dev-modal" onClick={e => e.stopPropagation()}>
                        <div className="rzp-modal-header">
                            <div className="rzp-brand-group">
                                <div className="rzp-blue-dot" />
                                <div>
                                    <strong className="rzp-title">Razorpay Secure Checkout</strong>
                                    <span className="rzp-subtitle">100% Authorized & Verified Gateway</span>
                                </div>
                            </div>
                            <button className="rzp-modal-close" onClick={devRazorpayModal.onCancel} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="rzp-modal-body">
                            <div className="rzp-order-banner">
                                <div className="rzp-merchant-col">
                                    <span className="rzp-merchant-title">VP Nuts Kumbakonam</span>
                                    <span className="rzp-order-id">ID: {devRazorpayModal.orderId}</span>
                                </div>
                                <div className="rzp-amount-col">
                                    <span className="rzp-amount-label">Amount Payable:</span>
                                    <strong className="rzp-amount-val">₹{devRazorpayModal.amount.toFixed(2)}</strong>
                                </div>
                            </div>

                            <div className="rzp-methods-box">
                                <span className="rzp-methods-header">Available Payment Options:</span>
                                <div className="rzp-methods-grid">
                                    <div className="rzp-method-item">
                                        <Smartphone size={16} />
                                        <span>Google Pay / PhonePe / Paytm</span>
                                    </div>
                                    <div className="rzp-method-item">
                                        <CreditCard size={16} />
                                        <span>Credit / Debit Cards (Visa, RuPay)</span>
                                    </div>
                                    <div className="rzp-method-item">
                                        <Lock size={16} />
                                        <span>NetBanking (50+ Banks)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rzp-test-note">
                                <span>⚡ Development Simulation Mode is Active. Click below to verify and complete the order.</span>
                            </div>

                            <div className="rzp-actions-row">
                                <button
                                    type="button"
                                    className="rzp-btn-pay-success"
                                    onClick={() => {
                                        const mockPayId = `pay_test_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substring(2, 6)}`;
                                        devRazorpayModal.onSuccess({
                                            razorpay_order_id: devRazorpayModal.orderId,
                                            razorpay_payment_id: mockPayId,
                                            razorpay_signature: 'mock_signature_vp_nuts'
                                        });
                                    }}
                                >
                                    <ShieldCheck size={18} />
                                    <span>Complete Razorpay Test Payment</span>
                                </button>
                                <button
                                    type="button"
                                    className="rzp-btn-cancel"
                                    onClick={devRazorpayModal.onCancel}
                                >
                                    Cancel & Return
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartDrawer;
