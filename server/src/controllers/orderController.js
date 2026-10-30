import store from '../services/store.js';

export const getOrders = async (req, res) => {
  try {
    const { email } = req.query;
    let orders = await store.getAllOrders();
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      orders = orders.filter(o => o.customer?.email?.toLowerCase().trim() === cleanEmail);
    }
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await store.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving order' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const {
      customer,
      shippingAddress,
      items,
      subtotal,
      discount,
      deliveryFee,
      totalAmount,
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!customer || !shippingAddress || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Customer, shipping address, and items are required.' });
    }

    const orderNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = `VPN-${orderNum}`;
    const city = shippingAddress.city || 'Chennai';
    const district = shippingAddress.district || city;

    const trackingSteps = [
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Order received and verified at Kumbakonam Central Hub',
        location: 'Kumbakonam Central Hub, Tamil Nadu',
        timestamp: new Date(),
        completed: true
      },
      {
        status: 'packed',
        title: 'Vacuum Packed & Nitrogen Flushed',
        description: 'Quality tested & sealed in moisture-barrier freshness pouch',
        location: 'VP Nuts Facility, Kumbakonam',
        timestamp: new Date(Date.now() + 4 * 3600 * 1000),
        completed: false
      },
      {
        status: 'in-transit',
        title: 'In Transit Across Tamil Nadu',
        description: `En route via Express Corridor to ${district} Logistics Centre`,
        location: `Tamil Nadu Central Hub -> ${district}`,
        timestamp: new Date(Date.now() + 14 * 3600 * 1000),
        completed: false
      },
      {
        status: 'out-for-delivery',
        title: 'Out for Delivery',
        description: 'Assigned to local delivery associate for doorstep handover',
        location: `${district} Local Hub`,
        timestamp: new Date(Date.now() + 28 * 3600 * 1000),
        completed: false
      }
    ];

    const estimatedDelivery = new Date(Date.now() + 2 * 24 * 3600 * 1000);

    const newOrder = await store.createOrder({
      orderId,
      customer,
      shippingAddress: {
        ...shippingAddress,
        state: shippingAddress.state || 'Tamil Nadu',
        district
      },
      items,
      trackingSteps,
      currentStatus: 'confirmed',
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      totalAmount: Number(totalAmount) || 0,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentStatus || (paymentMethod === 'cod' ? 'pending' : 'paid'),
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      razorpaySignature: razorpaySignature || '',
      estimatedDelivery
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: newOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location } = req.body;

    const validStatuses = ['confirmed', 'packed', 'in-transit', 'out-for-delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updated = await store.updateOrderStatus(id, status, location);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      message: `Order ${id} milestone updated to: ${status}`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const result = await store.cancelOrder(id, reason);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to cancel order'
      });
    }

    res.json({
      success: true,
      message: `Order ${id} has been cancelled successfully.`,
      data: result.order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Server error while cancelling order' });
  }
};

export const clearAllOrders = async (req, res) => {
  try {
    await store.clearAllOrders();
    res.json({
      success: true,
      message: 'All orders have been removed from local cache and MongoDB successfully'
    });
  } catch (error) {
    console.error('Error clearing all orders:', error);
    res.status(500).json({ success: false, message: 'Failed to clear orders' });
  }
};

