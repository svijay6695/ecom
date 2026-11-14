/**
 * VP Nuts Mobile API Client
 * Connects directly to the live Express + MongoDB backend
 */

export const API_BASE_URL = 'https://ecom-xpht.onrender.com/api';

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

export const getUserOrdersApi = async (email: string) => {
  try {
    const cleanEmail = encodeURIComponent(email.toLowerCase().trim());
    const res = await fetch(`${API_BASE_URL}/orders/user?email=${cleanEmail}`);
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (e) {
    console.warn('API error fetching user orders:', e);
  }
  return null;
};

export const syncOrderToBackend = async (orderData: any) => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  } catch (e) {
    console.warn('API error syncing order to backend:', e);
    return null;
  }
};

export const cancelOrderApi = async (orderId: string, reason?: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'Cancelled by customer via mobile app' })
    });
    return await res.json();
  } catch (e) {
    console.warn('API error cancelling order:', e);
    return null;
  }
};

export const getProfileApi = async (email: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile?email=${encodeURIComponent(email)}`);
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
      body: JSON.stringify({ email, ...profileData })
    });
    return await res.json();
  } catch (e) {
    console.warn('API error updating profile:', e);
    return null;
  }
};

