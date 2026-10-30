export interface OrderItem {
    id: number;
    cartItemId: string;
    title: string;
    price: number;
    weights: string;
    quantity: number;
    image?: string;
}

export interface TrackingStep {
    title: string;
    description: string;
    time: string;
    completed: boolean;
    current: boolean;
}

export type OrderStatus = 'Confirmed' | 'Packed' | 'In Transit' | 'Delivered' | 'Cancelled';

export interface Order {
    id: string;
    date: string;
    userId?: string;
    userEmail?: string;
    items: OrderItem[];
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
    paymentStatus?: 'pending' | 'paid' | 'failed';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status: OrderStatus;
    estimatedDelivery: string;
    trackingSteps: TrackingStep[];
    cancelReason?: string;
    cancelledAt?: string;
}

export interface CreateOrderInput {
    userId?: string;
    userEmail?: string;
    items: OrderItem[];
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
    paymentStatus?: 'pending' | 'paid' | 'failed';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
}

export interface OrderContextType {
    orders: Order[];
    createOrder: (input: CreateOrderInput) => Order;
    cancelOrder: (orderId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
    isOrdersModalOpen: boolean;
    openOrdersModal: (orderId?: string) => void;
    closeOrdersModal: () => void;
    selectedOrder: Order | null;
    setSelectedOrder: (order: Order | null) => void;
}

