import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { MapPin, Phone, User as UserIcon, CreditCard, Banknote, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';

export const CheckoutScreen = ({ navigation }: any) => {
  const { cartItems, cartSubtotal, cartDiscount, cartTotal, promoCode, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();

  const defaultAddr = user?.addresses?.[0];

  const [fullName, setFullName] = useState(defaultAddr?.fullName || user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(defaultAddr?.phone || user?.phone || '');
  const [street, setStreet] = useState(defaultAddr?.street || '');
  const [city, setCity] = useState(defaultAddr?.city || user?.city || 'Kumbakonam');
  const [pincode, setPincode] = useState(defaultAddr?.pincode || '612001');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter recipient name.');
      return;
    }
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }
    if (!street.trim()) {
      Alert.alert('Required', 'Please enter delivery street address.');
      return;
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      Alert.alert('Invalid Pincode', 'Please enter a 6-digit postal pincode.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await createOrder({
        items: cartItems,
        subtotal: cartSubtotal,
        discount: cartDiscount,
        total: cartTotal,
        promoCode,
        recipientName: fullName.trim(),
        recipientPhone: cleanPhone,
        deliveryAddress: street.trim(),
        deliveryCity: city.trim(),
        deliveryPincode: pincode.trim(),
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        userId: user?.id,
        userEmail: user?.email || `${cleanPhone}@customer.vpnuts.com`
      });

      clearCart();
      setIsSubmitting(false);

      Alert.alert(
        '🎉 Order Confirmed!',
        `Your order #${order.id} has been placed successfully. Fresh dry fruits from Kumbakonam are on the way!`,
        [
          {
            text: 'Track Order',
            onPress: () => navigation.navigate('Orders')
          }
        ]
      );
    } catch {
      setIsSubmitting(false);
      Alert.alert('Error', 'Could not place order. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery & Payment</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Delivery Address Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color="#8B4513" />
            <Text style={styles.sectionTitle}>Delivery Address (Tamil Nadu)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputRow}>
              <UserIcon size={16} color="#8A7A70" />
              <TextInput
                style={styles.textInput}
                placeholder="Receiver's Name"
                placeholderTextColor="#A09287"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputRow}>
              <Phone size={16} color="#8A7A70" />
              <TextInput
                style={styles.textInput}
                placeholder="10-digit mobile number"
                placeholderTextColor="#A09287"
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Door No / Street / Landmark</Text>
            <TextInput
              style={[styles.textInputArea]}
              placeholder="House/Flat No, Street Name, Landmark"
              placeholderTextColor="#A09287"
              multiline
              numberOfLines={2}
              value={street}
              onChangeText={setStreet}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.textInputCompact}
                placeholder="City"
                placeholderTextColor="#A09287"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Pincode</Text>
              <TextInput
                style={styles.textInputCompact}
                placeholder="6-digit pincode"
                placeholderTextColor="#A09287"
                keyboardType="numeric"
                maxLength={6}
                value={pincode}
                onChangeText={setPincode}
              />
            </View>
          </View>
        </View>

        {/* Payment Options */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.paymentLeft}>
              <Banknote size={22} color={paymentMethod === 'cod' ? '#8B4513' : '#6A5649'} />
              <View>
                <Text style={styles.paymentName}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentDesc}>Pay cash or UPI to delivery executive at doorstep</Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'cod' && styles.radioActive]}>
              {paymentMethod === 'cod' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'razorpay' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('razorpay')}
          >
            <View style={styles.paymentLeft}>
              <CreditCard size={22} color={paymentMethod === 'razorpay' ? '#8B4513' : '#6A5649'} />
              <View>
                <Text style={styles.paymentName}>Online UPI / Cards / Netbanking</Text>
                <Text style={styles.paymentDesc}>Instant UPI via Google Pay, PhonePe, Paytm</Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'razorpay' && styles.radioActive]}>
              {paymentMethod === 'razorpay' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Security Guarantee Badge */}
        <View style={styles.trustCard}>
          <ShieldCheck size={20} color="#2E7D32" />
          <Text style={styles.trustText}>
            100% Quality Guarantee from VP Nuts Kumbakonam. Vacuum-sealed fresh dispatch.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Place Order Bar */}
      <View style={styles.placeOrderBar}>
        <View>
          <Text style={styles.barLabel}>Amount Payable</Text>
          <Text style={styles.barAmount}>₹{cartTotal}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, isSubmitting && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
        >
          <CheckCircle2 size={18} color="#FFF" />
          <Text style={styles.placeOrderBtnText}>
            {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
          </Text>
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
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFE7DC',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A5649',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2D4C3',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#FAF6F0',
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
  },
  textInputArea: {
    borderWidth: 1,
    borderColor: '#E2D4C3',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#2C1810',
    backgroundColor: '#FAF6F0',
    minHeight: 56,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  textInputCompact: {
    borderWidth: 1,
    borderColor: '#E2D4C3',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#2C1810',
    backgroundColor: '#FAF6F0',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAE0D5',
    marginBottom: 10,
    backgroundColor: '#FAF7F2',
  },
  paymentOptionSelected: {
    borderColor: '#8B4513',
    backgroundColor: '#FDF6EE',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C1810',
  },
  paymentDesc: {
    fontSize: 11,
    color: '#7A6B60',
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B0A296',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#8B4513',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B4513',
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  trustText: {
    fontSize: 12,
    color: '#1B5E20',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  placeOrderBar: {
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
  barAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B4513',
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B4513',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  placeOrderBtnDisabled: {
    backgroundColor: '#BCAAA4',
  },
  placeOrderBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

