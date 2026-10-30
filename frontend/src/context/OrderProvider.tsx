import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { OrderContext } from './OrderContext';
import type { Order, CreateOrderInput, OrderStatus } from './OrderTypes';
import { syncOrderToBackend, getUserOrdersApi, cancelOrderApi } from '../services/backendApi';
import { useAuth } from './AuthContext';

// Helper to transform MongoDB orders into frontend Order model
interface BackendOrder {
    orderId: string;
    createdAt?: string;
    customer?: { id?: string; email?: string; name?: string; phone?: string };
    shippingAddress?: { street?: string; city?: string; pincode?: string };
    items?: Array<{ productId: number; title: string; unitPrice: number; weight: string; quantity: number; image?: string }>;
    subtotal?: number;
    discount?: number;
    totalAmount?: number;
    paymentMethod?: string;
    currentStatus?: string;
    cancelReason?: string;
    cancelledAt?: string;
    trackingSteps?: Array<{ title: string; description: string; timestamp?: string; completed?: boolean; status?: string }>;
}

const mapBackendToFrontendOrder = (bOrder: BackendOrder): Order => {
    const isCancelled = bOrder.currentStatus === 'cancelled';
    return {
        id: bOrder.orderId,
        date: new Date(bOrder.createdAt || Date.now()).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }),
        userId: bOrder.customer?.id,
        userEmail: bOrder.customer?.email?.toLowerCase().trim(),
        recipientName: bOrder.customer?.name || 'Customer',
        recipientPhone: bOrder.customer?.phone || '',
        deliveryAddress: bOrder.shippingAddress?.street || 'Tamil Nadu',
        deliveryCity: bOrder.shippingAddress?.city || 'Kumbakonam',
        deliveryPincode: bOrder.shippingAddress?.pincode || '612702',
        paymentMethod: bOrder.paymentMethod || 'upi',
        items: (bOrder.items || []).map(it => ({
            id: it.productId,
            cartItemId: `${it.productId}-${it.weight}`,
            title: it.title,
            price: it.unitPrice,
            weights: it.weight,
            quantity: it.quantity,
            image: it.image
        })),
        subtotal: bOrder.subtotal || 0,
        discount: bOrder.discount || 0,
        total: bOrder.totalAmount || 0,
        status: (isCancelled ? 'Cancelled' :
            bOrder.currentStatus === 'delivered' ? 'Delivered' :
            bOrder.currentStatus === 'in-transit' ? 'In Transit' :
            bOrder.currentStatus === 'packed' ? 'Packed' : 'Confirmed') as OrderStatus,
        cancelReason: bOrder.cancelReason,
        cancelledAt: bOrder.cancelledAt,
        estimatedDelivery: isCancelled ? 'Order Cancelled' : '1 - 2 Business Days',
        trackingSteps: (bOrder.trackingSteps || []).map(s => ({
            title: s.title,
            description: s.description,
            time: s.timestamp ? new Date(s.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Pending',
            completed: Boolean(s.completed),
            current: s.status === bOrder.currentStatus
        }))
    };
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();

    // Persistent storage of all local orders
    const [allOrders, setAllOrders] = useState<Order[]>(() => {
        try {
            const saved = localStorage.getItem('vr_nuts_orders');
            if (saved) return JSON.parse(saved);
            return [];
        } catch {
            return [];
        }
    });

    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Save all orders to localStorage whenever updated
    useEffect(() => {
        try {
            localStorage.setItem('vr_nuts_orders', JSON.stringify(allOrders));
        } catch (e) {
            console.error('Failed to save orders to localStorage', e);
        }
    }, [allOrders]);

    // Fetch user-specific orders from MongoDB / backend whenever authenticated user changes
    const fetchBackendOrders = useCallback(async (email: string) => {
        try {
            const backendData = await getUserOrdersApi(email);
            if (Array.isArray(backendData)) {
                const mapped = backendData.map(mapBackendToFrontendOrder);
                setAllOrders(mapped);
            }
        } catch (err) {
            console.warn('Could not sync user orders from backend:', err);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user?.email) {
            fetchBackendOrders(user.email);
        }
    }, [isAuthenticated, user?.email, fetchBackendOrders]);

    // Computed orders filtered strictly for the active authenticated user
    const userOrders = useMemo(() => {
        if (!isAuthenticated || !user) {
            return [];
        }
        const cleanEmail = user.email.toLowerCase().trim();
        return allOrders.filter(o => {
            const orderEmail = o.userEmail?.toLowerCase().trim();
            if (orderEmail && orderEmail === cleanEmail) return true;
            if (o.userId && o.userId === user.id) return true;
            return false;
        });
    }, [allOrders, isAuthenticated, user]);

    const openOrdersModal = (orderId?: string) => {
        if (orderId) {
            const match = userOrders.find(o => o.id === orderId);
            setSelectedOrder(match || (userOrders.length > 0 ? userOrders[0] : null));
        } else {
            setSelectedOrder(userOrders.length > 0 ? userOrders[0] : null);
        }
        setIsOrdersModalOpen(true);
    };

    const closeOrdersModal = () => {
        setIsOrdersModalOpen(false);
    };

    const createOrder = (input: CreateOrderInput): Order => {
        const orderNum = Math.floor(100000 + Math.random() * 900000);
        const orderId = `VPN-${orderNum}`;
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const newOrder: Order = {
            id: orderId,
            date: dateFormatted,
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

        setAllOrders(prev => [newOrder, ...prev]);
        setSelectedOrder(newOrder);

        // Async sync with VP Nuts Backend API (Port 5001)
        syncOrderToBackend({
            id: newOrder.id,
            recipientName: newOrder.recipientName,
            recipientPhone: newOrder.recipientPhone,
            recipientEmail: newOrder.userEmail,
            deliveryAddress: newOrder.deliveryAddress,
            deliveryCity: newOrder.deliveryCity,
            deliveryPincode: newOrder.deliveryPincode,
            items: newOrder.items,
            subtotal: newOrder.subtotal,
            discount: newOrder.discount,
            total: newOrder.total,
            paymentMethod: newOrder.paymentMethod,
            paymentStatus: newOrder.paymentStatus,
            razorpayOrderId: newOrder.razorpayOrderId,
            razorpayPaymentId: newOrder.razorpayPaymentId,
            razorpaySignature: newOrder.razorpaySignature
        });

        return newOrder;
    };

    const cancelOrder = async (orderId: string, reason = 'Cancelled by customer'): Promise<{ success: boolean; error?: string }> => {
        const orderToCancel = allOrders.find(o => o.id === orderId);
        if (!orderToCancel) {
            return { success: false, error: 'Order not found.' };
        }
        if (orderToCancel.status === 'Delivered') {
            return { success: false, error: 'Cannot cancel an order that has already been delivered.' };
        }
        if (orderToCancel.status === 'Cancelled') {
            return { success: false, error: 'This order is already cancelled.' };
        }

        const nowFormatted = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const updatedSteps = [
            ...orderToCancel.trackingSteps.map(s => ({ ...s, current: false })),
            {
                title: 'Order Cancelled',
                description: reason || 'Order was cancelled by customer',
                time: nowFormatted,
                completed: true,
                current: true
            }
        ];

        const updatedOrder: Order = {
            ...orderToCancel,
            status: 'Cancelled',
            cancelReason: reason,
            cancelledAt: new Date().toISOString(),
            estimatedDelivery: 'Order Cancelled',
            trackingSteps: updatedSteps
        };

        setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        setSelectedOrder(prev => (prev?.id === orderId ? updatedOrder : prev));

        // Sync with backend API (Port 5001)
        try {
            await cancelOrderApi(orderId, reason);
        } catch (err) {
            console.warn('Backend cancel sync failed:', err);
        }

        return { success: true };
    };

    return (
        <OrderContext.Provider
            value={{
                orders: userOrders,
                createOrder,
                cancelOrder,
                isOrdersModalOpen,
                openOrdersModal,
                closeOrdersModal,
                selectedOrder,
                setSelectedOrder
            }}
        >
            {children}
        </OrderContext.Provider>
    );
};
