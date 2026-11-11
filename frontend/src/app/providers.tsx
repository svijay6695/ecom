'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthProvider';
import { OrderProvider } from '../context/OrderProvider';
import { CartProvider } from '../context/CartProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OrderProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </OrderProvider>
    </AuthProvider>
  );
}

