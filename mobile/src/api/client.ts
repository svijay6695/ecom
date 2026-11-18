/**
 * VP Nuts Mobile API Client
 * Connects directly to the live Express + MongoDB backend
 */

export const API_BASE_URL = 'https://ecom-xpht.onrender.com/api';
export const BACKEND_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Resolves product image URLs dynamically across local dev & production deployments.
 * Fixes relative paths and local paths to point to live server uploads.
 */
export const resolveProductImageUrl = (image?: string): string => {
  if (!image) return '';
  if (image.includes('localhost:5001')) {
    return image.replace(/https?:\/\/localhost:5001/, BACKEND_ROOT_URL);
  }
  if (image.startsWith('/uploads')) {
    return `${BACKEND_ROOT_URL}${image}`;
  }
  return image;
};

// ==========================================
// PRODUCTS API
// ==========================================

export const getProductsApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (e) {
    console.warn('API error fetching products, using local fallback:', e);
  }
  return null;
};

// ==========================================
// AUTHENTICATION & OTP APIS
// ==========================================

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Could not connect to server. Check network.' };
  }
};

export const loginUserApi = async (credentials: { email: string; password: string }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Could not connect to server. Check network.' };
  }
};

/**
 * Verify 6-digit phone OTP
 */
export const verifyPhoneOtpApi = async (data: {
  phone: string;
  otp?: string;
  email?: string;
  isFirebaseVerified?: boolean;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Could not connect to server to verify OTP.' };
  }
};

/**
 * Verify phone via Firebase verification (matching frontend)
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Backend server is offline during Firebase phone verification.' };
  }
};

export const resendPhoneOtpApi = async (data: { phone: string; email?: string }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Could not connect to server to resend OTP.' };
  }
};

/**
 * Admin live tracker OTP fallback (returns active code if SMS delivery is delayed)
 */
export const getActiveOtpApi = async (phone: string): Promise<string | null> => {
  try {
    const clean = phone.replace(/\D/g, '').slice(-10);
    const res = await fetch(`${API_BASE_URL}/admin/otps`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const found = json.data.find((item: any) => item.phone === clean && item.currentStatus === 'active');
        if (found && found.otp) return found.otp;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

export const forgotPasswordApi = async (payload: { phone: string }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to request password reset code.' };
  }
};

export const resetPasswordApi = async (payload: { phone: string; otp: string; newPassword: string; isFirebaseVerified?: boolean }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to reset password.' };
  }
};

// ==========================================
// PAYMENT GATEWAY (RAZORPAY) APIS
// ==========================================

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

export const createRazorpayOrderApi = async (data: {
  amount: number;
  receipt?: string;
  notes?: Record<string, string>;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/payment/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to create Razorpay order:', err);
    return { success: false, message: 'Could not connect to payment server' };
  }
};

export const verifyRazorpayPaymentApi = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  try {
    const res = await fetch(`${API_BASE_URL}/payment/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to verify Razorpay payment:', err);
    return { success: false, message: 'Could not verify payment with server' };
  }
};

// ==========================================
// ORDERS API
// ==========================================

export const getUserOrdersApi = async (email: string) => {
  try {
    const cleanEmail = encodeURIComponent(email.toLowerCase().trim());
    // Fixed: Correct route is /orders?email=...
    const res = await fetch(`${API_BASE_URL}/orders?email=${cleanEmail}`);
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (e) {
    console.warn('API error fetching user orders:', e);
  }
  return null;
};

export interface SyncOrderPayload {
  orderId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    district?: string;
    state?: string;
    pincode: string;
  };
  items: Array<{
    productId: number | string;
    title: string;
    weight: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    image?: string;
  }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export const syncOrderToBackend = async (payload: SyncOrderPayload) => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn('API error syncing order to backend:', e);
    return null;
  }
};

export const cancelOrderApi = async (orderId: string, reason?: string) => {
  try {
    // Fixed: route is POST /orders/:id/cancel
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'Cancelled by customer via mobile app' })
    });
    return await res.json();
  } catch (e) {
    console.warn('API error cancelling order:', e);
    return null;
  }
};

// ==========================================
// PROFILE & ADDRESS BOOK APIS
// ==========================================

export const getProfileApi = async (email: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile?email=${encodeURIComponent(email.toLowerCase().trim())}`);
    if (res.ok) {
      const data = await res.json();
      return data.user || null;
    }
  } catch (e) {
    console.warn('API error fetching profile:', e);
  }
  return null;
};

export const updateProfileApi = async (email: string, profileData: any) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), ...profileData })
    });
    return await res.json();
  } catch (e) {
    console.warn('API error updating profile:', e);
    return null;
  }
};

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), ...address })
    });
    return await res.json();
  } catch (e) {
    console.warn('API error adding address:', e);
    return null;
  }
};

export const deleteAddressApi = async (email: string, addressId: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/addresses/${addressId}?email=${encodeURIComponent(email.toLowerCase().trim())}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (e) {
    console.warn('API error deleting address:', e);
    return null;
  }
};

export const setDefaultAddressApi = async (email: string, addressId: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/addresses/${addressId}/default`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim() })
    });
    return await res.json();
  } catch (e) {
    console.warn('API error setting default address:', e);
    return null;
  }
};
