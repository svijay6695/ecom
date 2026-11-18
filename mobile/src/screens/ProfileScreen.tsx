import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Phone, Mail, MapPin, LogOut, LogIn, Plus, Heart, Shield, Lock, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Address } from '../types/auth';

export const ProfileScreen = () => {
  const { user, isAuthenticated, logout, updateUserAddress, deleteUserAddress, openAuthModal } = useAuth();

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0);

  // Add Address Modal
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('Kumbakonam');
  const [addrPincode, setAddrPincode] = useState('612001');
  const [addrLabel, setAddrLabel] = useState<'Home' | 'Office' | 'Other'>('Home');

  const handleSaveAddress = async () => {
    if (!addrName.trim() || !addrPhone.trim() || !addrStreet.trim() || !addrPincode.trim()) {
      Alert.alert('Required', 'Please fill all address fields.');
      return;
    }
    const cleanPhone = addrPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    const newAddr: Address = {
      id: `addr_${Date.now()}`,
      label: addrLabel,
      fullName: addrName.trim(),
      phone: cleanPhone,
      street: addrStreet.trim(),
      city: addrCity.trim(),
      state: 'Tamil Nadu',
      pincode: addrPincode.trim(),
      isDefault: false
    };
    await updateUserAddress(newAddr);
    setAddressModalVisible(false);
    setAddrName('');
    setAddrPhone('');
    setAddrStreet('');
  };

  return (
    <View style={[styles.safeArea, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Valued Customer'}</Text>
            <Text style={styles.userSub}>{user?.email || 'Sign in to sync your orders across devices'}</Text>
            {user?.phone ? (
              <View style={styles.userPhoneRow}>
                <Phone size={12} color="#8B4513" />
                <Text style={styles.userPhone}>+91 {user.phone}</Text>
              </View>
            ) : null}
          </View>

          {!isAuthenticated ? (
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => openAuthModal('signin')}
            >
              <LogIn size={16} color="#FFF" />
              <Text style={styles.signInBtnText}>Sign In</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <LogOut size={16} color="#C62828" />
            </TouchableOpacity>
          )}
        </View>

        {/* Saved Addresses Section */}
        {isAuthenticated && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <MapPin size={18} color="#8B4513" />
                <Text style={styles.sectionTitle}>Saved Addresses</Text>
              </View>

              <TouchableOpacity
                style={styles.addAddrBtn}
                onPress={() => setAddressModalVisible(true)}
              >
                <Plus size={14} color="#8B4513" />
                <Text style={styles.addAddrBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {(!user?.addresses || user.addresses.length === 0) ? (
              <Text style={styles.emptyAddrText}>No addresses saved yet. Tap "Add" to save a delivery address.</Text>
            ) : (
              user.addresses.map(addr => (
                <View key={addr.id} style={styles.addrCard}>
                  <View style={styles.addrCardTop}>
                    <Text style={styles.addrLabel}>{addr.label}</Text>
                    <TouchableOpacity onPress={() => deleteUserAddress(addr.id)}>
                      <Text style={styles.deleteAddrText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.addrName}>{addr.fullName} • {addr.phone}</Text>
                  <Text style={styles.addrStreet}>{addr.street}, {addr.city} - {addr.pincode}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* VP Nuts Heritage & Support Card */}
        <View style={styles.brandCard}>
          <Text style={styles.brandCardTitle}>🥜 VP Nuts Kumbakonam</Text>
          <Text style={styles.brandCardDesc}>
            Direct from Kumbakonam, Tamil Nadu. Handpicked premium California almonds, whole cashews, walnuts, and seeds packed fresh with vacuum seals.
          </Text>

          <View style={styles.featureRow}>
            <Shield size={16} color="#8B4513" />
            <Text style={styles.featureText}>100% Quality Assured Natural Dry Fruits</Text>
          </View>
          <View style={styles.featureRow}>
            <Heart size={16} color="#8B4513" />
            <Text style={styles.featureText}>Trusted by 5,000+ Families across Tamil Nadu</Text>
          </View>
        </View>

        {/* App Version Info */}
        <Text style={styles.versionText}>VP Nuts Mobile App • Version 1.0.0</Text>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={[styles.modalSafeArea, { paddingTop: topInset }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Delivery Address</Text>
            <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Contact Name</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Full Name"
                placeholderTextColor="#A09287"
                value={addrName}
                onChangeText={setAddrName}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="10-digit number"
                placeholderTextColor="#A09287"
                keyboardType="phone-pad"
                maxLength={10}
                value={addrPhone}
                onChangeText={setAddrPhone}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Street / Door No</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Door No, Street"
                placeholderTextColor="#A09287"
                value={addrStreet}
                onChangeText={setAddrStreet}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>City</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="City"
                placeholderTextColor="#A09287"
                value={addrCity}
                onChangeText={setAddrCity}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Pincode</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="6-digit pincode"
                placeholderTextColor="#A09287"
                keyboardType="numeric"
                maxLength={6}
                value={addrPincode}
                onChangeText={setAddrPincode}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Tag Address As</Text>
              <View style={styles.labelPillRow}>
                {(['Home', 'Office', 'Other'] as const).map(lbl => (
                  <TouchableOpacity
                    key={lbl}
                    style={[styles.labelPill, addrLabel === lbl && styles.labelPillActive]}
                    onPress={() => setAddrLabel(lbl)}
                  >
                    <Text style={[styles.labelPillText, addrLabel === lbl && styles.labelPillTextActive]}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.authSubmitBtn} onPress={handleSaveAddress}>
              <Text style={styles.authSubmitBtnText}>Save Address</Text>
            </TouchableOpacity>
          </ScrollView>
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
    paddingBottom: 30,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFE7DC',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
  },
  userSub: {
    fontSize: 11,
    color: '#8A7A70',
    marginTop: 2,
  },
  userPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  userPhone: {
    fontSize: 11,
    color: '#8B4513',
    fontWeight: '600',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B4513',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signInBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFE7DC',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
  },
  addAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5EBE1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addAddrBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B4513',
  },
  emptyAddrText: {
    fontSize: 12,
    color: '#8A7A70',
    fontStyle: 'italic',
  },
  addrCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAE0D5',
  },
  addrCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addrLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B4513',
    textTransform: 'uppercase',
  },
  deleteAddrText: {
    fontSize: 11,
    color: '#C62828',
    fontWeight: '600',
  },
  addrName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  addrStreet: {
    fontSize: 12,
    color: '#7A6B60',
    marginTop: 2,
  },
  brandCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFE7DC',
  },
  brandCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4A2E18',
    marginBottom: 6,
  },
  brandCardDesc: {
    fontSize: 12,
    color: '#7A6B60',
    lineHeight: 18,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A2E18',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#A09287',
    marginTop: 10,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D8',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2C1810',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F5ECE3',
  },
  authScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 32,
  },
  authCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#EFE7DC',
    shadowColor: '#4A2E18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  authBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE3',
  },
  authLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  authLogoText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  authCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
  },
  authCardSub: {
    fontSize: 12,
    color: '#7A6B60',
    marginTop: 2,
    lineHeight: 16,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalInputGroup: {
    marginBottom: 12,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A5649',
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2D4C3',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#2C1810',
  },
  labelPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  labelPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E8DED1',
  },
  labelPillActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  labelPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A5649',
  },
  labelPillTextActive: {
    color: '#FFF',
  },
  authSubmitBtn: {
    backgroundColor: '#8B4513',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  authSubmitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  switchAuthBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: 13,
    color: '#8A7A70',
    fontWeight: '500',
  },
  switchAuthBold: {
    color: '#8B4513',
    fontWeight: '800',
  },
});

