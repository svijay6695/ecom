export interface WeightOption {
    key: string;
    label: string;
    multiplier?: number;
    price: number;
    stock?: number;
    available?: boolean;
}

export interface Product {
    id: number;
    numericId?: number;
    title: string;
    description: string;
    image?: string;
    price: number;
    weights: string;
    category?: 'nuts' | 'seeds';
    weightOptions?: WeightOption[];
    inStock?: boolean;
    disabledWeights?: string[];
    availableWeights?: string[];
}

export interface CartItem extends Product {
    quantity: number;
    cartItemId: string;
}

export interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    subtotalPrice: number;
    discountPrice: number;
    totalPrice: number;
    promoCode: string | null;
    applyPromoCode: (code: string) => { success: boolean; message: string };
    removePromoCode: () => void;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    getItemQuantity: (productId: number, weights?: string) => number;
}
