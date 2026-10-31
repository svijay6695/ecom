/**
 * VP Nuts Backend API Client
 * Seamlessly syncs orders with the Node/Express backend at port 5001
 */

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_BACKEND_API_URL) {
    return import.meta.env.VITE_BACKEND_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:5001/api`;
  }
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Fetch live products catalogue with updated prices, weights, and stock from MongoDB
 */
export const getProductsApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch {
    // Backend server offline fallback
  }
  return null;
};

/**
 * Register a new user in MongoDB via the backend API
 */
export const registerUserApi = async (userData: {
  name: string;
  email: string;
  phone: string;
  password: string;
  city?: string;
  state?: string;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await res.json();
    return data;
  } catch {
    console.warn('Backend server is offline. Falling back to local authentication.');
    return null;
  }
};

/**
 * Verify 6-digit phone OTP for customer registration
 */
export const verifyPhoneOtpApi = async (payload: {
  phone: string;
  otp?: string;
  email?: string;
  isFirebaseVerified?: boolean;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data;
  } catch {
    console.warn('Backend server is offline during OTP verification.');
    return null;
  }
};

/**
 * Complete phone verification and login via Google Firebase Phone Auth
 */
export const verifyFirebasePhoneApi = async (payload: {
  phone: string;
  email?: string;
  idToken?: string;
  name?: string;
  password?: string;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/firebase-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data;
  } catch {
    console.warn('Backend server is offline during Firebase phone verification.');
    return null;
  }
};

/**
 * Resend 6-digit phone OTP for customer registration
 */
export const resendPhoneOtpApi = async (payload: {
  phone: string;
  email?: string;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data;
  } catch {
    console.warn('Backend server is offline during resending OTP.');
    return null;
  }
};

/**
 * Request password reset OTP via registered phone
 */
export const forgotPasswordApi = async (payload: { phone: string }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data;
  } catch {
    console.warn('Backend server is offline during forgot password.');
    return null;
  }
};

/**
 * Verify OTP and reset password
 */
export const resetPasswordApi = async (payload: {
  phone: string;
  otp?: string;
  newPassword: string;
  isFirebaseVerified?: boolean;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data;
  } catch {
    console.warn('Backend server is offline during password reset.');
    return null;
  }
};

/**
 * Authenticate customer / admin in MongoDB via the backend API
 */
export const loginUserApi = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await res.json();
    return data;
  } catch {
    console.warn('Backend server is offline. Falling back to local authentication.');
    return null;
  }
};

/**
 * Fetch orders for a specific user by email from the backend
 */
export const getUserOrdersApi = async (email: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders?email=${encodeURIComponent(email.toLowerCase().trim())}`);
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch {
    // Backend server offline
  }
  return [];
};

export const syncOrderToBackend = async (order: {
  id: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPincode: string;
  items: Array<{
    id: number;
    title: string;
    weights: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}) => {
  try {
    const payload = {
      orderId: order.id,
      customer: {
        name: order.recipientName,
        phone: order.recipientPhone,
        email: order.recipientEmail || ''
      },
      shippingAddress: {
        street: order.deliveryAddress,
        city: order.deliveryCity,
        district: order.deliveryCity,
        state: 'Tamil Nadu',
        pincode: order.deliveryPincode
      },
      items: order.items.map(it => ({
        productId: it.id,
        title: it.title,
        weight: it.weights,
        unitPrice: it.price,
        quantity: it.quantity,
        totalPrice: it.price * it.quantity,
        image: it.image || ''
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      deliveryFee: 0,
      totalAmount: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || (order.paymentMethod === 'cod' ? 'pending' : 'paid'),
      razorpayOrderId: order.razorpayOrderId || '',
      razorpayPaymentId: order.razorpayPaymentId || '',
      razorpaySignature: order.razorpaySignature || ''
    };

    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log('✅ Order synced successfully with VP Nuts Backend (Port 5001)');
      return await res.json();
    }
  } catch {
    // Graceful fallback when backend server is offline
    console.info('Backend server is offline. Order saved locally in browser.');
  }
  return null;
};

/**
 * Cancel an order on the backend
 */
export const cancelOrderApi = async (orderId: string, reason?: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: reason || 'Cancelled by customer' })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Failed to cancel order on backend:', err);
    return null;
  }
};

/**
 * Fetch Razorpay Public Config (Key ID, currency)
 */
export const getRazorpayConfigApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/payment/config`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch Razorpay config:', err);
  }
  return null;
};

/**
 * Create a new Razorpay Order on the backend
 */
export const createRazorpayOrderApi = async (data: {
  amount: number;
  receipt?: string;
  notes?: Record<string, string>;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/payment/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to create Razorpay order:', err);
    return { success: false, message: 'Could not connect to payment server' };
  }
};

/**
 * Verify Razorpay payment signature on the backend
 */
export const verifyRazorpayPaymentApi = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/payment/razorpay/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to verify Razorpay payment:', err);
    return { success: false, message: 'Could not verify payment with server' };
  }
};

/**
 * Helper to build auth headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('vr_nuts_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Fetch profile with addresses
 */
export const getProfileApi = async (email: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile?email=${encodeURIComponent(email)}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.user || null;
    }
  } catch {
    // Offline fallback
  }
  return null;
};

/**
 * Update user basic profile
 */
export const updateProfileApi = async (data: { email: string; name: string; phone?: string; city?: string; state?: string }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Add address to address book
 */
export const addAddressApi = async (email: string, address: {
  label?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  district?: string;
  state?: string;
  pincode: string;
  isDefault?: boolean;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/addresses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, ...address })
    });
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Delete address
 */
export const deleteAddressApi = async (email: string, addressId: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/addresses/${addressId}?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Set default address
 */
export const setDefaultAddressApi = async (email: string, addressId: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/addresses/${addressId}/default`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email })
    });
    return await res.json();
  } catch {
    return null;
  }
};
