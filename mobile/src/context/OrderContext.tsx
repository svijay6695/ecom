import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, CreateOrderInput } from '../types/order';
import { syncOrderToBackend, getUserOrdersApi, cancelOrderApi } from '../api/client';
import { useAuth } from './AuthContext';

const ORDERS_STORAGE_KEY = '@vpnuts_orders';

interface OrderContextType {
  orders: Order[];
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  cancelOrder: (orderId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
        if (saved) setOrders(JSON.parse(saved));
      } catch (e) {
        console.warn('Error reading orders from storage:', e);
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders)).catch(() => {});
  }, [orders]);

  useEffect(() => {
    if (user?.email) {
      refreshOrders();
    }
  }, [user?.email]);

  const refreshOrders = async () => {
    const query = user?.email || user?.phone;
    if (!query) return;
    const remote = await getUserOrdersApi(query);
    if (Array.isArray(remote) && remote.length > 0) {
      // Map remote MongoDB orders
      const mapped: Order[] = remote.map((b: any) => {
        const isCancelled = b.currentStatus === 'cancelled';
        const displayStatus = isCancelled
          ? 'Cancelled'
          : b.currentStatus === 'delivered'
          ? 'Delivered'
          : b.currentStatus === 'in-transit' || b.currentStatus === 'out-for-delivery'
          ? 'In Transit'
          : b.currentStatus === 'packed'
          ? 'Packed'
          : 'Confirmed';

        return {
          id: b.orderId,
          date: new Date(b.createdAt || Date.now()).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          userId: b.customer?.id,
          userEmail: b.customer?.email,
          items: (b.items || []).map((it: any) => ({
            id: it.productId,
            title: it.title,
            price: it.unitPrice,
            weights: it.weight || '1 kg',
            selectedWeight: it.weight || '1 kg',
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            image: it.image || '',
            cartItemId: `${it.productId}-${it.weight}`
          })),
          subtotal: b.subtotal || 0,
          discount: b.discount || 0,
          total: b.totalAmount || 0,
          recipientName: b.customer?.name || 'Customer',
          recipientPhone: b.customer?.phone || '',
          deliveryAddress: b.shippingAddress?.street || '',
          deliveryCity: b.shippingAddress?.city || 'Kumbakonam',
          deliveryPincode: b.shippingAddress?.pincode || '',
          paymentMethod: b.paymentMethod || 'cod',
          status: displayStatus as any,
          cancelReason: b.cancelReason,
          estimatedDelivery: isCancelled
            ? 'Order Cancelled'
            : b.currentStatus === 'delivered'
            ? 'Delivered'
            : '1 - 2 Business Days',
          trackingSteps: (b.trackingSteps || []).map((s: any) => ({
            title: s.title,
            description: s.description,
            time: s.timestamp ? new Date(s.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Pending',
            completed: !!s.completed,
            current: s.status === b.currentStatus
          }))
        };
      });
      setOrders(mapped);
    }
  };

  const createOrder = async (input: CreateOrderInput): Promise<Order> => {
    const orderId = `VPN-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const newOrder: Order = {
      id: orderId,
      date: dateStr,
      userId: user?.id || input.userId,
      userEmail: (user?.email || input.userEmail || '').toLowerCase().trim(),
      items: input.items,
      subtotal: input.subtotal,
      discount: input.discount,
      total: input.total,
      promoCode: input.promoCode,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      deliveryAddress: input.deliveryAddress,
      deliveryCity: input.deliveryCity,
      deliveryPincode: input.deliveryPincode,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus || (input.paymentMethod === 'cod' ? 'pending' : 'paid'),
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
      status: 'Confirmed',
      estimatedDelivery: '1 - 2 Business Days',
      trackingSteps: [
        {
          title: 'Order Confirmed',
          description: `Order received at VP Nuts Kumbakonam for ${input.deliveryCity}, Tamil Nadu`,
          time: 'Just now',
          completed: true,
          current: true
        },
        {
          title: 'Packaging & Quality Check',
          description: 'Handpicked dry fruits vacuum-sealed for maximum crunch and aroma',
          time: 'Processing',
          completed: false,
          current: false
        },
        {
          title: 'Dispatched (Tamil Nadu Express)',
          description: `En route to destination hub in ${input.deliveryCity}`,
          time: 'Upcoming',
          completed: false,
          current: false
        },
        {
          title: 'Out for Doorstep Delivery',
          description: 'Delivery executive will deliver to your doorstep',
          time: 'Upcoming',
          completed: false,
          current: false
        }
      ]
    };

    setOrders(prev => [newOrder, ...prev]);
    setSelectedOrder(newOrder);

    // Sync to backend with full MongoDB schema
    try {
      const syncRes = await syncOrderToBackend({
        orderId: newOrder.id,
        customer: {
          name: newOrder.recipientName,
          phone: newOrder.recipientPhone.replace(/\D/g, '').slice(-10) || newOrder.recipientPhone,
          email: newOrder.userEmail || ''
        },
        shippingAddress: {
          street: newOrder.deliveryAddress,
          city: newOrder.deliveryCity,
          district: newOrder.deliveryCity,
          state: 'Tamil Nadu',
          pincode: newOrder.deliveryPincode
        },
        items: newOrder.items.map((it, idx) => {
          const numId = Number(it.numericId || (typeof it.id === 'number' ? it.id : parseInt(String(it.id), 10))) || (idx + 1);
          const price = Number(it.unitPrice || it.price) || 0;
          const qty = Number(it.quantity) || 1;
          return {
            productId: numId,
            title: it.title,
            weight: it.selectedWeight || it.weights || '1 kg',
            unitPrice: price,
            quantity: qty,
            totalPrice: price * qty,
            image: typeof it.image === 'string' ? it.image : ''
          };
        }),
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        deliveryFee: 0,
        totalAmount: newOrder.total,
        paymentMethod: newOrder.paymentMethod,
        paymentStatus: newOrder.paymentStatus || (newOrder.paymentMethod === 'cod' ? 'pending' : 'paid'),
        razorpayOrderId: newOrder.razorpayOrderId || '',
        razorpayPaymentId: newOrder.razorpayPaymentId || '',
        razorpaySignature: newOrder.razorpaySignature || ''
      });

      if (syncRes && syncRes.success) {
        console.log('✅ Mobile order confirmed and saved to MongoDB:', syncRes.data?.orderId || newOrder.id);
      } else {
        console.warn('⚠️ Backend order sync response:', syncRes?.message || syncRes);
      }
    } catch (syncErr) {
      console.warn('⚠️ Order sync to backend failed:', syncErr);
    }

    return newOrder;
  };

  const cancelOrder = async (orderId: string, reason: string = 'Cancelled by customer via mobile app') => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return { success: false, error: 'Order not found' };
    if (target.status === 'Delivered') return { success: false, error: 'Delivered orders cannot be cancelled.' };
    if (target.status === 'Cancelled') return { success: false, error: 'Order is already cancelled.' };

    const updated: Order = {
      ...target,
      status: 'Cancelled',
      cancelReason: reason,
      cancelledAt: new Date().toISOString(),
      estimatedDelivery: 'Order Cancelled',
      trackingSteps: [
        ...target.trackingSteps.map(s => ({ ...s, current: false })),
        {
          title: 'Order Cancelled',
          description: reason,
          time: 'Cancelled',
          completed: true,
          current: true
        }
      ]
    };

    setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    if (selectedOrder?.id === orderId) setSelectedOrder(updated);

    cancelOrderApi(orderId, reason).catch(() => {});
    return { success: true };
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        cancelOrder,
        selectedOrder,
        setSelectedOrder,
        refreshOrders
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};

