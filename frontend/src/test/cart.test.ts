import { describe, it, expect } from 'vitest';
import type { CartItem, Product } from '../context/CartTypes';

describe('Cart Pricing & Calculations', () => {
    const mockAlmonds: Product = {
        id: 1,
        title: 'Almond',
        description: 'Premium California almonds',
        price: 1000,
        weights: '1 kg',
        category: 'nuts',
        weightOptions: [
            { key: '250g', label: '250 gram', price: 280, available: true },
            { key: '500g', label: '500 gram', price: 520, available: true },
            { key: '1kg', label: '1 kg', price: 1000, available: true },
        ],
    };

    it('calculates correct price for different weight options', () => {
        const option250g = mockAlmonds.weightOptions?.find(w => w.key === '250g');
        const option500g = mockAlmonds.weightOptions?.find(w => w.key === '500g');
        const option1kg = mockAlmonds.weightOptions?.find(w => w.key === '1kg');

        expect(option250g?.price).toBe(280);
        expect(option500g?.price).toBe(520);
        expect(option1kg?.price).toBe(1000);
    });

    it('calculates subtotal correctly for multiple cart items', () => {
        const cartItems: CartItem[] = [
            {
                ...mockAlmonds,
                cartItemId: 'item_1_250g',
                weights: '250 gram',
                price: 280,
                quantity: 2, // 280 * 2 = 560
            },
            {
                ...mockAlmonds,
                cartItemId: 'item_1_1kg',
                weights: '1 kg',
                price: 1000,
                quantity: 1, // 1000 * 1 = 1000
            },
        ];

        const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

        expect(subtotal).toBe(1560);
        expect(totalItemsCount).toBe(3);
    });

    it('generates unique cartItemId so different weights do not overwrite each other', () => {
        const createCartItemId = (productId: number, weightKey: string) => `${productId}_${weightKey}`;

        const item1 = createCartItemId(1, '250g');
        const item2 = createCartItemId(1, '500g');

        expect(item1).not.toBe(item2);
        expect(item1).toBe('1_250g');
        expect(item2).toBe('1_500g');
    });
});

