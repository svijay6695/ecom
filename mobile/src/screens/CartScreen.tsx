import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView
} from 'react-native';
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, CheckCircle, Sparkles } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { resolveProductImage } from '../types/product';

export const CartScreen = ({ navigation }: any) => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    cartDiscount,
    cartTotal,
    promoCode,
    applyPromoCode,
    removePromoCode
  } = useCart();

  const [inputCode, setInputCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleApplyPromo = () => {
    if (!inputCode.trim()) return;
    const res = applyPromoCode(inputCode);
    setPromoMessage({ text: res.message, success: res.success });
    if (res.success) setInputCode('');
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={48} color="#8B4513" />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Add premium almonds, cashews, and healthy seeds to your cart.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Browse Dry Fruits</Text>
            <ArrowRight size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart ({cartItems.length})</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Cart Items List */}
        {cartItems.map(item => (
          <View key={item.cartItemId} style={styles.itemCard}>
            <Image source={resolveProductImage(item)} style={styles.itemImage} resizeMode="cover" />

            <View style={styles.itemDetails}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.cartItemId)}>
                  <Trash2 size={16} color="#C62828" />
                </TouchableOpacity>
              </View>

              <Text style={styles.itemWeight}>Pack: {item.selectedWeight}</Text>
              <Text style={styles.itemPrice}>₹{item.unitPrice}</Text>

              {/* Quantity Controls */}
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.cartItemId, -1)}
                >
                  <Minus size={14} color="#4A2E18" />
                </TouchableOpacity>

                <Text style={styles.qtyText}>{item.quantity}</Text>

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.cartItemId, 1)}
                >
                  <Plus size={14} color="#4A2E18" />
                </TouchableOpacity>

                <Text style={styles.itemSubtotal}>
                  Total: ₹{item.unitPrice * item.quantity}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Coupon Code Section */}
        <View style={styles.promoSection}>
          <View style={styles.promoInputRow}>
            <Tag size={16} color="#8B4513" />
            <TextInput
              style={styles.promoInput}
              placeholder="Enter coupon code (e.g. VPNUTS10)"
              placeholderTextColor="#9A8B80"
              value={inputCode}
              onChangeText={setInputCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyPromo}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {!promoCode && (
            <TouchableOpacity
              style={styles.quickCouponChip}
              onPress={() => {
                applyPromoCode('VPNUTS10');
                setPromoMessage({ text: '🎉 10% Festive Discount Applied!', success: true });
              }}
            >
              <Sparkles size={13} color="#8B4513" />
              <Text style={styles.quickCouponText}>
                Tap to apply <Text style={styles.quickCouponBold}>VPNUTS10</Text> for 10% OFF
              </Text>
            </TouchableOpacity>
          )}

          {promoCode && (
            <View style={styles.appliedRow}>
              <CheckCircle size={14} color="#2E7D32" />
              <Text style={styles.appliedText}>Coupon "{promoCode}" applied (-10%)</Text>
              <TouchableOpacity onPress={removePromoCode}>
                <Text style={styles.removePromoText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {promoMessage && !promoCode && (
            <Text style={[styles.promoMsg, promoMessage.success ? styles.promoSuccess : styles.promoError]}>
              {promoMessage.text}
            </Text>
          )}
        </View>

        {/* Bill Summary */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Order Summary</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{cartSubtotal}</Text>
          </View>

          {cartDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#2E7D32' }]}>Festive Discount</Text>
              <Text style={[styles.billValue, { color: '#2E7D32' }]}>-₹{cartDiscount}</Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tamil Nadu Express Delivery</Text>
            <Text style={[styles.billValue, { color: '#2E7D32' }]}>FREE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Grand Total</Text>
            <Text style={styles.billTotalValue}>₹{cartTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout Action */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.barLabel}>Total Amount</Text>
          <Text style={styles.barTotal}>₹{cartTotal}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <ArrowRight size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF9',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D8',
    backgroundColor: '#FFFDF9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFE7DC',
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5EBE1',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C1810',
    flex: 1,
  },
  itemWeight: {
    fontSize: 12,
    color: '#8A7A70',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B4513',
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F5EBE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
    minWidth: 16,
    textAlign: 'center',
  },
  itemSubtotal: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '700',
    color: '#4A2E18',
  },
  promoSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFE7DC',
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    fontSize: 13,
    color: '#2C1810',
    paddingVertical: 6,
  },
  applyBtn: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quickCouponChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EFE2D3',
  },
  quickCouponText: {
    fontSize: 12,
    color: '#6A5649',
    fontWeight: '500',
  },
  quickCouponBold: {
    fontWeight: '800',
    color: '#8B4513',
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE3',
  },
  appliedText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    flex: 1,
  },
  removePromoText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '600',
  },
  promoMsg: {
    fontSize: 12,
    marginTop: 6,
  },
  promoSuccess: {
    color: '#2E7D32',
  },
  promoError: {
    color: '#C62828',
  },
  billCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE7DC',
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: '#7A6B60',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C1810',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E6D8',
    marginVertical: 10,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
  },
  billTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B4513',
  },
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0E6D8',
  },
  barLabel: {
    fontSize: 11,
    color: '#8A7A70',
  },
  barTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8B4513',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5EBE1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7A6B60',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

