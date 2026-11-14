import { CartItem } from './cart';

export type OrderStatus = 'Confirmed' | 'Packed' | 'In Transit' | 'Delivered' | 'Cancelled';

export interface TrackingStep {
  title: string;
  description: string;
  time: string;
  completed: boolean;
  current: boolean;
}

export interface Order {
  id: string;
  date: string;
  userId?: string;
  userEmail?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string | null;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPincode: string;
  paymentMethod: string;
  paymentStatus?: 'pending' | 'paid';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: OrderStatus;
  cancelReason?: string;
  cancelledAt?: string;
  estimatedDelivery?: string;
  trackingSteps: TrackingStep[];
}

export interface CreateOrderInput {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string | null;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPincode: string;
  paymentMethod: string;
  paymentStatus?: 'pending' | 'paid';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  userId?: string;
  userEmail?: string;
}

