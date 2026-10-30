import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  title: { type: String, required: true },
  weight: { type: String, required: true }, // '250g', '500g', '1kg'
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true },
  image: { type: String, default: '' }
}, { _id: false });

const trackingStepSchema = new mongoose.Schema({
  status: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, default: 'Tamil Nadu Hub' },
  timestamp: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, required: true }
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, default: 'Thanjavur' },
    state: { type: String, default: 'Tamil Nadu' },
    pincode: { type: String, required: true }
  },
  items: [orderItemSchema],
  trackingSteps: [trackingStepSchema],
  currentStatus: {
    type: String,
    enum: ['confirmed', 'packed', 'in-transit', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  cancelReason: { type: String, default: '' },
  cancelledAt: { type: Date },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cod', 'upi', 'card', 'razorpay'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  estimatedDelivery: { type: Date }
}, {
  timestamps: true
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;

