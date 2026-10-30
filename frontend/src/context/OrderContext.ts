import { createContext, useContext } from 'react';
import type { OrderContextType } from './OrderTypes';

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = (): OrderContextType => {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrders must be used within an OrderProvider');
    }
    return context;
};

export type {
    Order,
    OrderItem,
    TrackingStep,
    OrderStatus,
    CreateOrderInput,
    OrderContextType
} from './OrderTypes';

