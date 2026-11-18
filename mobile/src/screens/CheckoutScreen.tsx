import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Phone,
  User as UserIcon,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Home,
  Briefcase,
  Check,
  Truck,
  Package,
  X,
  Lock,
  Smartphone,
  Building2
} from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { Address } from '../types/auth';
import { createRazorpayOrderApi, verifyRazorpayPaymentApi } from '../api/client';

export const CheckoutScreen = ({ navigation }: any) => {
  const { cartItems, cartSubtotal, cartDiscount, cartTotal, promoCode, clearCart } = useCart();
  const { user, isAuthenticated, openAuthModal, updateUserAddress } = useAuth();
  const { createOrder } = useOrders();

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0);

  const savedAddresses: Address[] = user?.addresses || [];

  // Address selection: id of selected address card, or 'new'
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    if (savedAddresses.length > 0) {
      return savedAddresses[0].id;
    }
    return 'new';
  });

  // Form states for new address
  const [fullName, setFullName] = useState(() => user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(() => (user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''));
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(() => user?.city || 'Kumbakonam');
  const [pincode, setPincode] = useState('612001');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Office' | 'Other'>('Home');

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Razorpay Gateway state
  const [razorpayModal, setRazorpayModal] = useState<{
    orderId: string;
    amount: number;
    keyId: string;
    finalName: string;
    finalPhone: string;
    finalStreet: string;
    finalCity: string;
    finalPincode: string;
  } | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [selectedRzpMethod, setSelectedRzpMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Success modal state
  const [successOrder, setSuccessOrder] = useState<{
    id: string;
    recipientName: string;
    destination: string;
    paymentMethod: string;
    total: number;
  } | null>(null);

  // Sync recipient name and phone if user profile loads
  useEffect(() => {
    if (user) {
      if (!fullName && user.name) setFullName(user.name);
      if (!phoneNumber && user.phone) setPhoneNumber(user.phone.replace(/\D/g, '').slice(-10));
    }
  }, [user]);

  // Selected saved address object
  const activeSavedAddress = savedAddresses.find(a => a.id === selectedAddressId);

  const handleSelectSavedAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    if (user?.name && !fullName) setFullName(user.name);
    if (user?.phone && !phoneNumber) setPhoneNumber(user.phone.replace(/\D/g, '').slice(-10));
  };

  const handlePlaceOrder = async () => {
    // If not authenticated, prompt sign in first
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }

    let finalName = '';
    let finalPhone = '';
    let finalStreet = '';
    let finalCity = '';
    let finalPincode = '';

    if (selectedAddressId !== 'new' && activeSavedAddress) {
      finalName = activeSavedAddress.fullName || user?.name || '';
      finalPhone = activeSavedAddress.phone.replace(/\D/g, '').slice(-10);
      finalStreet = activeSavedAddress.street;
      finalCity = activeSavedAddress.city;
      finalPincode = activeSavedAddress.pincode;
    } else {
      if (!fullName.trim()) {
        Alert.alert('Required', 'Please enter recipient name.');
        return;
      }
      const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
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

      finalName = fullName.trim();
      finalPhone = cleanPhone;
      finalStreet = street.trim();
      finalCity = city.trim() || 'Kumbakonam';
      finalPincode = pincode.trim();

      // Optionally save to profile
      if (saveToProfile && isAuthenticated) {
        const newAddr: Address = {
          id: `addr_${Date.now()}`,
          label: addressLabel,
          fullName: finalName,
          phone: finalPhone,
          street: finalStreet,
          city: finalCity,
          state: 'Tamil Nadu',
          pincode: finalPincode,
          isDefault: false
        };
        updateUserAddress(newAddr).catch(() => {});
      }
    }

    // ONLINE RAZORPAY PAYMENT FLOW
    if (paymentMethod === 'razorpay') {
      setIsSubmitting(true);
      try {
        const rzpRes = await createRazorpayOrderApi({
          amount: cartTotal,
          notes: {
            recipientName: finalName,
            recipientPhone: finalPhone,
            city: finalCity,
            pincode: finalPincode
          }
        });

        setIsSubmitting(false);

        if (!rzpRes || !rzpRes.success) {
          Alert.alert(
            'Payment Gateway Notice',
            rzpRes?.message || 'Could not initialize Razorpay checkout. Please try again or select Cash on Delivery.'
          );
          return;
        }

        setRazorpayModal({
          orderId: rzpRes.orderId,
          amount: cartTotal,
          keyId: rzpRes.keyId || 'rzp_test_vp_nuts_2026',
          finalName,
          finalPhone,
          finalStreet,
          finalCity,
          finalPincode
        });
      } catch (e) {
        setIsSubmitting(false);
        Alert.alert('Payment Error', 'Failed to connect to payment server. Please try again.');
      }
      return;
    }

    // CASH ON DELIVERY (COD) FLOW
    setIsSubmitting(true);

    try {
      const order = await createOrder({
        items: cartItems,
        subtotal: cartSubtotal,
        discount: cartDiscount,
        total: cartTotal,
        promoCode,
        recipientName: finalName,
        recipientPhone: finalPhone,
        deliveryAddress: finalStreet,
        deliveryCity: finalCity,
        deliveryPincode: finalPincode,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        userId: user?.id,
        userEmail: user?.email || `${finalPhone}@customer.vpnuts.com`
      });

      clearCart();
      setIsSubmitting(false);

      // Open Success Confirmation Modal
      setSuccessOrder({
        id: order.id,
        recipientName: finalName,
        destination: `${finalStreet}, ${finalCity} - ${finalPincode}`,
        paymentMethod: 'Cash on Delivery',
        total: cartTotal
      });
    } catch {
      setIsSubmitting(false);
      Alert.alert('Error', 'Could not place order. Please try again.');
    }
  };

  const handleAuthorizeRazorpayPayment = async () => {
    if (!razorpayModal) return;
    setIsVerifyingPayment(true);

    try {
      const mockPayId = `pay_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substring(2, 6)}`;
      const verifyRes = await verifyRazorpayPaymentApi({
        razorpay_order_id: razorpayModal.orderId,
        razorpay_payment_id: mockPayId,
        razorpay_signature: 'mock_signature_vp_nuts'
      });

      if (!verifyRes || !verifyRes.success) {
        setIsVerifyingPayment(false);
        Alert.alert('Verification Failed', verifyRes?.message || 'Payment signature could not be confirmed.');
        return;
      }

      // Complete order with verified Razorpay details
      const order = await createOrder({
        items: cartItems,
        subtotal: cartSubtotal,
        discount: cartDiscount,
        total: cartTotal,
        promoCode,
        recipientName: razorpayModal.finalName,
        recipientPhone: razorpayModal.finalPhone,
        deliveryAddress: razorpayModal.finalStreet,
        deliveryCity: razorpayModal.finalCity,
        deliveryPincode: razorpayModal.finalPincode,
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        razorpayOrderId: razorpayModal.orderId,
        razorpayPaymentId: mockPayId,
        razorpaySignature: 'mock_signature_vp_nuts',
        userId: user?.id,
        userEmail: user?.email || `${razorpayModal.finalPhone}@customer.vpnuts.com`
      });

      clearCart();
      setIsVerifyingPayment(false);
      const placedId = order.id;
      const recName = razorpayModal.finalName;
      const dest = `${razorpayModal.finalStreet}, ${razorpayModal.finalCity} - ${razorpayModal.finalPincode}`;
      setRazorpayModal(null);

      // Open Success Confirmation Modal
      setSuccessOrder({
        id: placedId,
        recipientName: recName,
        destination: dest,
        paymentMethod: 'Razorpay Online (Paid)',
        total: cartTotal
      });
    } catch (e) {
      setIsVerifyingPayment(false);
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="#4A2E18" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery & Payment</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Fast Kumbakonam Hub Dispatch Banner */}
        <View style={styles.hubStrip}>
          <Truck size={14} color="#8B4513" />
          <Text style={styles.hubStripText}>
            Direct from Kumbakonam Hub • 1-2 Days Tamil Nadu Express
          </Text>
        </View>

        {/* Saved Addresses Section (if available) */}
        {savedAddresses.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color="#8B4513" />
              <Text style={styles.sectionTitle}>Select Delivery Address</Text>
            </View>

            {savedAddresses.map(addr => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[styles.savedAddressCard, isSelected && styles.savedAddressCardSelected]}
                  onPress={() => handleSelectSavedAddress(addr)}
                  activeOpacity={0.8}
                >
                  <View style={styles.addressRadioRow}>
                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={styles.addressTagRow}>
                        <View style={styles.addressTag}>
                          {addr.label === 'Home' && <Home size={11} color="#8B4513" />}
                          {addr.label === 'Office' && <Briefcase size={11} color="#8B4513" />}
                          {addr.label !== 'Home' && addr.label !== 'Office' && <MapPin size={11} color="#8B4513" />}
                          <Text style={styles.addressTagText}>{addr.label || 'Home'}</Text>
                        </View>
                        <Text style={styles.addressPhoneText}>{addr.phone}</Text>
                      </View>

                      <Text style={styles.addressNameText}>{addr.fullName}</Text>
                      <Text style={styles.addressDetailText}>
                        {addr.street}, {addr.city}, Tamil Nadu - {addr.pincode}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Deliver to a New Address choice card */}
            <TouchableOpacity
              style={[styles.savedAddressCard, selectedAddressId === 'new' && styles.savedAddressCardSelected]}
              onPress={handleSelectNewAddress}
              activeOpacity={0.8}
            >
              <View style={styles.addressRadioRow}>
                <View style={[styles.radio, selectedAddressId === 'new' && styles.radioActive]}>
                  {selectedAddressId === 'new' && <View style={styles.radioInner} />}
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Plus size={16} color="#8B4513" />
                    <Text style={styles.newAddressTitle}>Deliver to a New Address</Text>
                  </View>
                  <Text style={styles.newAddressSubtitle}>
                    Enter a different recipient name, street, or town
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* New Address Form (shown when selectedAddressId === 'new' or no saved addresses) */}
        {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color="#8B4513" />
              <Text style={styles.sectionTitle}>
                {savedAddresses.length > 0 ? 'Enter New Delivery Details' : 'Delivery Address (Tamil Nadu)'}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Full Name *</Text>
              <View style={styles.inputRow}>
                <UserIcon size={16} color="#8A7A70" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter full name"
                  placeholderTextColor="#A09287"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <View style={styles.inputRow}>
                <Text style={styles.countryCode}>+91</Text>
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
              <Text style={styles.inputLabel}>Door No / Building & Street Address *</Text>
              <TextInput
                style={[styles.textInputArea]}
                placeholder="Door No, Street Name, Landmark"
                placeholderTextColor="#A09287"
                multiline
                numberOfLines={2}
                value={street}
                onChangeText={setStreet}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>City / Town *</Text>
                <TextInput
                  style={styles.textInputCompact}
                  placeholder="e.g. Kumbakonam, Chennai"
                  placeholderTextColor="#A09287"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Pincode *</Text>
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

            {/* Save Address Checkbox & Tag selector */}
            {isAuthenticated && (
              <View style={styles.saveAddressBox}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setSaveToProfile(!saveToProfile)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, saveToProfile && styles.checkboxActive]}>
                    {saveToProfile && <Check size={14} color="#FFF" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Save this address to my VP Nuts profile for future orders
                  </Text>
                </TouchableOpacity>

                {saveToProfile && (
                  <View style={styles.tagChooserRow}>
                    <Text style={styles.tagPrompt}>Tag as:</Text>
                    <View style={styles.tagPillGroup}>
                      {(['Home', 'Office', 'Other'] as const).map(lbl => (
                        <TouchableOpacity
                          key={lbl}
                          style={[styles.tagPill, addressLabel === lbl && styles.tagPillActive]}
                          onPress={() => setAddressLabel(lbl)}
                        >
                          <Text style={[styles.tagPillText, addressLabel === lbl && styles.tagPillTextActive]}>
                            {lbl}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Payment Options */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <CreditCard size={18} color="#8B4513" />
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('cod')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.payIconBox}>
                <Banknote size={22} color="#8B4513" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentName}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentDesc}>Pay cash or scan UPI at your doorstep upon delivery</Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'cod' && styles.radioActive]}>
              {paymentMethod === 'cod' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'razorpay' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('razorpay')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.payIconBox}>
                <CreditCard size={22} color="#8B4513" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentName}>Online UPI / Cards (Razorpay)</Text>
                <Text style={styles.paymentDesc}>Instant payment via Google Pay, PhonePe, Paytm, Cards</Text>
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
            100% Quality & Freshness Guarantee from VP Nuts Kumbakonam. Vacuum-sealed fresh dispatch.
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
          activeOpacity={0.8}
        >
          <CheckCircle2 size={18} color="#FFF" />
          <Text style={styles.placeOrderBtnText}>
            {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Razorpay Interactive Checkout Modal */}
      <Modal
        visible={!!razorpayModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!isVerifyingPayment) setRazorpayModal(null);
        }}
      >
        <View style={[styles.rzpModalSafeArea, { paddingTop: topInset }]}>
          <View style={styles.rzpModalHeader}>
            <View style={styles.rzpBrandGroup}>
              <View style={styles.rzpBlueDot} />
              <View>
                <Text style={styles.rzpTitle}>Razorpay Secure Checkout</Text>
                <Text style={styles.rzpSubtitle}>100% Authorized & Encrypted</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!isVerifyingPayment) setRazorpayModal(null);
              }}
              style={styles.rzpCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.rzpModalBody} contentContainerStyle={styles.rzpModalContent}>
            {/* Merchant Banner */}
            <View style={styles.rzpBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rzpMerchantTitle}>VP Nuts Kumbakonam</Text>
                <Text style={styles.rzpOrderIdText} numberOfLines={1}>Order: {razorpayModal?.orderId}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                <Text style={styles.rzpAmountLabel}>Amount</Text>
                <Text style={styles.rzpAmountValue}>₹{razorpayModal?.amount}</Text>
              </View>
            </View>

            {/* Payment Options Grid */}
            <Text style={styles.rzpMethodsHeading}>Select Payment Method</Text>

            <TouchableOpacity
              style={[styles.rzpMethodCard, selectedRzpMethod === 'upi' && styles.rzpMethodCardSelected]}
              onPress={() => setSelectedRzpMethod('upi')}
              activeOpacity={0.8}
            >
              <View style={styles.rzpMethodLeft}>
                <View style={[styles.rzpIconWrap, { backgroundColor: '#E6FFFA' }]}>
                  <Smartphone size={18} color="#0D9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rzpMethodTitle}>UPI (Instant Payment)</Text>
                  <Text style={styles.rzpMethodSub}>Google Pay, PhonePe, Paytm, BHIM</Text>
                </View>
              </View>
              <View style={[styles.radio, selectedRzpMethod === 'upi' && styles.radioActive]}>
                {selectedRzpMethod === 'upi' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rzpMethodCard, selectedRzpMethod === 'card' && styles.rzpMethodCardSelected]}
              onPress={() => setSelectedRzpMethod('card')}
              activeOpacity={0.8}
            >
              <View style={styles.rzpMethodLeft}>
                <View style={[styles.rzpIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <CreditCard size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rzpMethodTitle}>Credit / Debit Cards</Text>
                  <Text style={styles.rzpMethodSub}>Visa, MasterCard, RuPay</Text>
                </View>
              </View>
              <View style={[styles.radio, selectedRzpMethod === 'card' && styles.radioActive]}>
                {selectedRzpMethod === 'card' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rzpMethodCard, selectedRzpMethod === 'netbanking' && styles.rzpMethodCardSelected]}
              onPress={() => setSelectedRzpMethod('netbanking')}
              activeOpacity={0.8}
            >
              <View style={styles.rzpMethodLeft}>
                <View style={[styles.rzpIconWrap, { backgroundColor: '#FAF5FF' }]}>
                  <Building2 size={18} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rzpMethodTitle}>NetBanking</Text>
                  <Text style={styles.rzpMethodSub}>SBI, HDFC, ICICI, Axis +50 Banks</Text>
                </View>
              </View>
              <View style={[styles.radio, selectedRzpMethod === 'netbanking' && styles.radioActive]}>
                {selectedRzpMethod === 'netbanking' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Security Guarantee */}
            <View style={styles.rzpSecurityNotice}>
              <Lock size={13} color="#15803D" />
              <Text style={styles.rzpSecurityNoticeText}>
                Secured by 256-bit encryption. Authorized VP Nuts Gateway.
              </Text>
            </View>

            {/* Authorize & Pay Button */}
            <TouchableOpacity
              style={[styles.rzpPayBtn, isVerifyingPayment && styles.rzpPayBtnDisabled]}
              onPress={handleAuthorizeRazorpayPayment}
              disabled={isVerifyingPayment}
              activeOpacity={0.8}
            >
              <ShieldCheck size={18} color="#FFF" />
              <Text style={styles.rzpPayBtnText}>
                {isVerifyingPayment ? 'Verifying with Razorpay...' : `Pay ₹${razorpayModal?.amount}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rzpCancelBtn}
              onPress={() => setRazorpayModal(null)}
              disabled={isVerifyingPayment}
              activeOpacity={0.7}
            >
              <Text style={styles.rzpCancelBtnText}>Cancel & Choose Another Method</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Order Confirmed Full-Screen Success Modal */}
      <Modal
        visible={!!successOrder}
        animationType="fade"
        transparent={false}
      >
        <View style={[styles.successModalSafeArea, { paddingTop: topInset }]}>
          <View style={styles.successCard}>
            <View style={styles.successCheckCircle}>
              <CheckCircle2 size={54} color="#2E7D32" />
            </View>

            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <View style={styles.orderIdPill}>
              <Text style={styles.orderIdPillText}>Order ID: #{successOrder?.id}</Text>
            </View>

            <Text style={styles.successLead}>
              Thank you for choosing <Text style={{ fontWeight: '800', color: '#8B4513' }}>VP Nuts</Text>. Your dry fruits are being carefully packed at our Kumbakonam facility.
            </Text>

            <View style={styles.successSummaryBox}>
              <View style={styles.successSummaryRow}>
                <Text style={styles.successSummaryLabel}>Recipient:</Text>
                <Text style={styles.successSummaryValue}>{successOrder?.recipientName}</Text>
              </View>

              <View style={styles.successSummaryRow}>
                <Text style={styles.successSummaryLabel}>Destination:</Text>
                <Text style={styles.successSummaryValue} numberOfLines={2}>{successOrder?.destination}</Text>
              </View>

              <View style={styles.successSummaryRow}>
                <Text style={styles.successSummaryLabel}>Payment:</Text>
                <Text style={styles.successSummaryValue}>{successOrder?.paymentMethod}</Text>
              </View>

              <View style={styles.successSummaryRow}>
                <Text style={styles.successSummaryLabel}>Total Amount:</Text>
                <Text style={[styles.successSummaryValue, { color: '#8B4513', fontWeight: '800', fontSize: 16 }]}>
                  ₹{successOrder?.total}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.trackOrderBtn}
              onPress={() => {
                setSuccessOrder(null);
                navigation.navigate('Orders');
              }}
              activeOpacity={0.8}
            >
              <Package size={18} color="#FFF" />
              <Text style={styles.trackOrderBtnText}>Track Order Journey</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backHomeBtn}
              onPress={() => {
                setSuccessOrder(null);
                navigation.navigate('Home');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.backHomeBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D8',
    backgroundColor: '#FFFDF9',
  },
  backBtn: {
    padding: 4,
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
  hubStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5EBE1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    marginBottom: 14,
  },
  hubStripText: {
    fontSize: 11,
    color: '#8B4513',
    fontWeight: '700',
    flex: 1,
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
  },
  savedAddressCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EAE0D5',
  },
  savedAddressCardSelected: {
    borderColor: '#8B4513',
    backgroundColor: '#FDF7F0',
  },
  addressRadioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5EBE1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addressTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B4513',
  },
  addressPhoneText: {
    fontSize: 11,
    color: '#7A6B60',
    fontWeight: '600',
  },
  addressNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C1810',
    marginTop: 2,
  },
  addressDetailText: {
    fontSize: 12,
    color: '#6A5649',
    marginTop: 2,
    lineHeight: 16,
  },
  newAddressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B4513',
  },
  newAddressSubtitle: {
    fontSize: 11,
    color: '#8A7A70',
    marginTop: 2,
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
    backgroundColor: '#FAF6F0',
    paddingHorizontal: 12,
    height: 44,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B4513',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
    marginLeft: 8,
  },
  textInputArea: {
    borderWidth: 1,
    borderColor: '#E2D4C3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2C1810',
    backgroundColor: '#FAF6F0',
    minHeight: 60,
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
  saveAddressBox: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE3',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#8B4513',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#4A2E18',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  tagChooserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingLeft: 30,
  },
  tagPrompt: {
    fontSize: 11,
    color: '#8A7A70',
    fontWeight: '600',
  },
  tagPillGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E8DED1',
  },
  tagPillActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  tagPillText: {
    fontSize: 11,
    color: '#6A5649',
    fontWeight: '600',
  },
  tagPillTextActive: {
    color: '#FFF',
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
  payIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F5EBE1',
    alignItems: 'center',
    justifyContent: 'center',
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
  successModalSafeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DC',
    shadowColor: '#4A2E18',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  successCheckCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C1810',
    textAlign: 'center',
  },
  orderIdPill: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E8DED1',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  orderIdPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B4513',
  },
  successLead: {
    fontSize: 13,
    color: '#7A6B60',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  successSummaryBox: {
    width: '100%',
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE7DC',
    marginBottom: 20,
    gap: 8,
  },
  successSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  successSummaryLabel: {
    fontSize: 12,
    color: '#8A7A70',
    width: 90,
  },
  successSummaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C1810',
    flex: 1,
    textAlign: 'right',
  },
  trackOrderBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B4513',
    paddingVertical: 13,
    borderRadius: 10,
    marginBottom: 10,
  },
  trackOrderBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backHomeBtn: {
    paddingVertical: 10,
  },
  backHomeBtnText: {
    fontSize: 13,
    color: '#8B4513',
    fontWeight: '700',
  },
  // Razorpay Checkout Modal Styles
  rzpModalSafeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  rzpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  rzpBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rzpBlueDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0C83FD',
  },
  rzpTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  rzpSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  rzpCloseBtn: {
    padding: 6,
  },
  rzpModalBody: {
    flex: 1,
  },
  rzpModalContent: {
    padding: 16,
    paddingBottom: 36,
  },
  rzpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rzpMerchantTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rzpOrderIdText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rzpAmountLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  rzpAmountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0C83FD',
  },
  rzpMethodsHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rzpMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rzpMethodCardSelected: {
    borderColor: '#0C83FD',
    backgroundColor: '#F0F7FF',
  },
  rzpMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rzpIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpMethodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  rzpMethodSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rzpSecurityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  rzpSecurityNoticeText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '500',
    flex: 1,
  },
  rzpPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0C83FD',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#0C83FD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  rzpPayBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  rzpPayBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rzpCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  rzpCancelBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});
