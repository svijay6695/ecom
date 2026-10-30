import React, { useState, useEffect } from 'react';
import { CartContext } from './CartContext';
import type { Product, CartItem } from './CartTypes';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem('vr_nuts_cart');
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            // Ensure backwards compatibility with old cart structure without cartItemId
            return parsed.map((item: Product & { cartItemId?: string }) => ({
                ...item,
                cartItemId: item.cartItemId || `${item.id}-${item.weights || '1 kg'}`
            }));
        } catch {
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [promoCode, setPromoCode] = useState<string | null>(() => {
        try {
            return localStorage.getItem('vr_nuts_promo') || null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('vr_nuts_cart', JSON.stringify(cartItems));
        } catch (e) {
            console.error('Failed to save cart to localStorage', e);
        }
    }, [cartItems]);

    useEffect(() => {
        try {
            if (promoCode) {
                localStorage.setItem('vr_nuts_promo', promoCode);
            } else {
                localStorage.removeItem('vr_nuts_promo');
            }
        } catch (e) {
            console.error('Failed to save promo code to localStorage', e);
        }
    }, [promoCode]);

    const addToCart = (product: Product, quantity = 1) => {
        const itemKey = `${product.id}-${product.weights}`;
        setCartItems(prev => {
            const existingIndex = prev.findIndex(item => item.cartItemId === itemKey);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + quantity
                };
                return updated;
            } else {
                return [...prev, { ...product, quantity, cartItemId: itemKey }];
            }
        });
    };

    const removeFromCart = (cartItemId: string) => {
        setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(cartItemId);
            return;
        }
        setCartItems(prev =>
            prev.map(item =>
                item.cartItemId === cartItemId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setPromoCode(null);
    };

    const getItemQuantity = (productId: number, weights?: string): number => {
        if (weights) {
            const match = cartItems.find(i => i.cartItemId === `${productId}-${weights}`);
            return match ? match.quantity : 0;
        }
        // If weights omitted, sum all variants for this product
        return cartItems
            .filter(i => i.id === productId)
            .reduce((sum, i) => sum + i.quantity, 0);
    };

    const applyPromoCode = (code: string): { success: boolean; message: string } => {
        const normalized = code.trim().toUpperCase();
        if (normalized === 'VPNUTS10' || normalized === 'VRNUTS10') {
            setPromoCode('VPNUTS10');
            return { success: true, message: 'Coupon applied! 10% discount on your order.' };
        } else if (normalized === 'TAMILNADU') {
            setPromoCode('TAMILNADU');
            return { success: true, message: 'Special Tamil Nadu coupon applied! Flat ₹100 off.' };
        } else {
            return { success: false, message: 'Invalid coupon code. Try VPNUTS10 or TAMILNADU.' };
        }
    };

    const removePromoCode = () => {
        setPromoCode(null);
    };

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discountPrice = 0;
    if (promoCode === 'VPNUTS10' || promoCode === 'VRNUTS10') {
        discountPrice = Math.round(subtotalPrice * 0.10);
    } else if (promoCode === 'TAMILNADU') {
        discountPrice = Math.min(100, subtotalPrice);
    }

    const totalPrice = Math.max(0, subtotalPrice - discountPrice);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalItems,
                subtotalPrice,
                discountPrice,
                totalPrice,
                promoCode,
                applyPromoCode,
                removePromoCode,
                isCartOpen,
                setIsCartOpen,
                getItemQuantity
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
