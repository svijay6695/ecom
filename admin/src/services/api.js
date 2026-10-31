const BASE_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5001/api').replace(/\/+$/, '');
export const BACKEND_ROOT_URL = BASE_URL.replace(/\/api\/?$/, '');

/**
 * Resolves product image URLs dynamically across local dev & production deployments.
 * Replaces localhost:5001 with production backend origin when running live.
 */
export const resolveProductImageUrl = (image) => {
  if (!image) return '';
  if (image.includes('localhost:5001')) {
    return image.replace(/https?:\/\/localhost:5001/, BACKEND_ROOT_URL);
  }
  if (image.startsWith('/uploads')) {
    return `${BACKEND_ROOT_URL}${image}`;
  }
  return image;
};

// Helper for authorized fetch
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('vr_nuts_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`API request to ${endpoint} failed:`, err.message);
    throw err;
  }
};

export const api = {
  // Auth
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  // Stats
  getStats: async () => {
    return request('/admin/stats');
  },

  getCustomers: async () => {
    return request('/admin/customers');
  },

  // Live OTP Tracker
  getOtps: async () => {
    return request('/admin/otps');
  },

  clearOtps: async () => {
    return request('/admin/otps', {
      method: 'DELETE'
    });
  },

  deleteOtp: async (phone) => {
    return request(`/admin/otps/${phone}`, {
      method: 'DELETE'
    });
  },

  // Products
  getProducts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },

  createProduct: async (productData) => {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('vr_nuts_admin_token');
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const res = await fetch(`${BASE_URL}/products/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    return res.json();
  },

  updateProduct: async (id, updateData) => {
    return request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  deleteProduct: async (id) => {
    return request(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  toggleWeightStock: async (id, weightKey, available) => {
    return request(`/products/${id}/toggle-stock`, {
      method: 'PATCH',
      body: JSON.stringify({ weightKey, available })
    });
  },

  updatePriceAndQuantity: async (id, payload) => {
    return request(`/products/${id}/price-quantity`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  // Orders
  getOrders: async () => {
    return request('/orders');
  },

  getOrderById: async (id) => {
    return request(`/orders/${id}`);
  },

  updateOrderStatus: async (id, status, location) => {
    return request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, location })
    });
  },

  cancelOrder: async (id, reason) => {
    return request(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }
};

export default api;

