import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types/product';
import { CartItem, CartContextType } from '../types/cart';

const STORAGE_KEY = '@vpnuts_cart';
const PROMO_STORAGE_KEY = '@vpnuts_promo';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);

  // Load saved cart from AsyncStorage on launch
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setCartItems(JSON.parse(saved));
        const savedPromo = await AsyncStorage.getItem(PROMO_STORAGE_KEY);
        if (savedPromo) setPromoCode(savedPromo);
      } catch (e) {
        console.warn('Error reading cart from storage:', e);
      }
    })();
  }, []);

  // Save cart to AsyncStorage whenever updated
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems)).catch(() => {});
  }, [cartItems]);

  const addToCart = (product: Product, weight?: string, customPrice?: number) => {
    const selectedWeight = weight || product.weights || '1 kg';
    const unitPrice = customPrice !== undefined ? customPrice : product.price;
    const cartItemId = `${product.id}-${selectedWeight}`;

    setCartItems(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          cartItemId,
          selectedWeight,
          unitPrice,
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCartItems(prev => {
      return prev
        .map(item => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCartItems([]);
    setPromoCode(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    AsyncStorage.removeItem(PROMO_STORAGE_KEY).catch(() => {});
  };

  const applyPromoCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'VPNUTS10' || clean === 'KUMBAKONAM10' || clean === 'WELCOME10') {
      setPromoCode(clean);
      AsyncStorage.setItem(PROMO_STORAGE_KEY, clean).catch(() => {});
      return { success: true, message: '🎉 10% Festive Discount Applied!' };
    }
    return { success: false, message: 'Invalid promo code. Try "VPNUTS10"' };
  };

  const removePromoCode = () => {
    setPromoCode(null);
    AsyncStorage.removeItem(PROMO_STORAGE_KEY).catch(() => {});
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartDiscount = promoCode ? Math.round(cartSubtotal * 0.1) : 0;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        cartDiscount,
        cartTotal,
        promoCode,
        applyPromoCode,
        removePromoCode
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

