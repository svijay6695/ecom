import React, { createContext, useContext, useState, useEffect } from 'react';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Address } from '../types/auth';

// Safely resolve native Firebase Auth so Expo Go does not throw "RNFBAppModule not found"
function getNativeAuth() {
  try {
    // In Expo Go, RNFBAppModule does not exist in NativeModules.
    // Checking this first completely prevents "Native module RNFBAppModule not found" errors in Expo Go!
    if (!NativeModules || !NativeModules.RNFBAppModule) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fbAuthModule = require('@react-native-firebase/auth');
    const fbAuth = fbAuthModule?.default || fbAuthModule;
    if (typeof fbAuth === 'function') {
      const instance = fbAuth();
      if (instance && instance.settings) {
        // Disables browser reCAPTCHA app verification / Chrome popup for testing & development
        instance.settings.appVerificationDisabledForTesting = true;
      }
      return instance;
    }
  } catch (_e) {
    // Expo Go does not have native Firebase binaries
  }
  return null;
}
import {
  loginUserApi,
  registerUserApi,
  verifyPhoneOtpApi,
  verifyFirebasePhoneApi,
  resendPhoneOtpApi,
  getActiveOtpApi,
  forgotPasswordApi,
  resetPasswordApi,
  getProfileApi,
  updateProfileApi,
  addAddressApi,
  deleteAddressApi
} from '../api/client';

const USER_STORAGE_KEY = '@vpnuts_user';

export type AuthMode = 'signin' | 'signup' | 'otp' | 'forgot' | 'reset';

export interface PendingOtpData {
  phone: string;
  email: string;
  name?: string;
  devOtp?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; requireOtp?: boolean; devOtp?: string; error?: string }>;
  verifyPhoneOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  resendPhoneOtp: () => Promise<{ success: boolean; error?: string; devOtp?: string }>;
  forgotPassword: (phone: string) => Promise<{ success: boolean; phone?: string; devOtp?: string; error?: string }>;
  resetPassword: (phone: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  cancelOtp: () => void;
  logout: () => void;
  updateUserAddress: (address: Address) => Promise<boolean>;
  deleteUserAddress: (addressId: string) => Promise<boolean>;
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  pendingOtpData: PendingOtpData | null;
  openAuthModal: (mode?: AuthMode, onAuthSuccess?: () => void) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [pendingOtpData, setPendingOtpData] = useState<PendingOtpData | null>(null);
  const [pendingSuccessCallback, setPendingSuccessCallback] = useState<(() => void) | null>(null);
  const [nativeConfirmation, setNativeConfirmation] = useState<any>(null);

  const openAuthModal = (mode: AuthMode = 'signin', onAuthSuccess?: () => void) => {
    setAuthMode(mode);
    setPendingSuccessCallback(() => onAuthSuccess || null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingSuccessCallback(null);
  };

  const cancelOtp = () => {
    setPendingOtpData(null);
    setNativeConfirmation(null);
    setAuthMode('signup');
  };

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          // Refresh from backend in background
          if (parsed.email) {
            const remote = await getProfileApi(parsed.email);
            if (remote) {
              setUser(prev => ({ ...prev, ...remote }));
              AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(remote)).catch(() => {});
            }
          }
        }
      } catch (e) {
        console.warn('Error reading user auth from storage:', e);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginUserApi({ email: email.trim().toLowerCase(), password });
    if (res && res.success && res.user) {
      const logged: User = {
        id: res.user.id || res.user._id,
        name: res.user.name,
        email: res.user.email,
        phone: res.user.phone || '',
        city: res.user.city || 'Kumbakonam',
        state: res.user.state || 'Tamil Nadu',
        addresses: res.user.addresses || []
      };
      setUser(logged);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(logged));
      setIsAuthModalOpen(false);
      if (pendingSuccessCallback) {
        const cb = pendingSuccessCallback;
        setPendingSuccessCallback(null);
        setTimeout(() => cb(), 150);
      }
      return { success: true };
    }
    return { success: false, error: res?.message || 'Invalid email or password' };
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanEmail = email.trim().toLowerCase();

    const res = await registerUserApi({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password,
      city: 'Kumbakonam',
      state: 'Tamil Nadu'
    });

    if (res && res.success) {
      // 1. Dispatch real carrier SMS via Native Android Firebase Phone Auth
      try {
        const nativeAuth = getNativeAuth();
        if (nativeAuth) {
          const fullPhoneNumber = `+91${cleanPhone}`;
          const confirmation = await nativeAuth.signInWithPhoneNumber(fullPhoneNumber);
          setNativeConfirmation(confirmation);
        }
      } catch (fbErr: any) {
        console.warn('Native Firebase SMS dispatch notice:', fbErr?.message || fbErr);
      }

      // 2. Fetch server active OTP for development / testing fallback
      let testOtp = res.devOtp;
      if (!testOtp) {
        testOtp = await getActiveOtpApi(cleanPhone) || undefined;
      }
      if (!testOtp) {
        await new Promise(r => setTimeout(r, 600));
        testOtp = await getActiveOtpApi(cleanPhone) || undefined;
      }

      setPendingOtpData({
        phone: cleanPhone,
        email: cleanEmail,
        name: name.trim(),
        devOtp: testOtp
      });
      setAuthMode('otp');
      return { success: true, requireOtp: true, devOtp: testOtp };
    }
    return { success: false, error: res?.message || 'Registration failed' };
  };

  const verifyPhoneOtp = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingOtpData) {
      return { success: false, error: 'No active OTP verification session. Please sign up again.' };
    }
    const cleanOtp = (otp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      return { success: false, error: 'Please enter the 6-digit OTP code.' };
    }

    // 1. If Native Firebase confirmation session is active, verify via Firebase
    if (nativeConfirmation) {
      try {
        const userCredential = await nativeConfirmation.confirm(cleanOtp);
        const idToken = await userCredential.user.getIdToken();
        const fbRes = await verifyFirebasePhoneApi({
          phone: pendingOtpData.phone,
          email: pendingOtpData.email,
          idToken,
          name: pendingOtpData.name
        });
        if (fbRes && fbRes.success && fbRes.user) {
          const verifiedUser: User = {
            id: fbRes.user.id || fbRes.user._id,
            name: fbRes.user.name || pendingOtpData.name || 'Valued Customer',
            email: fbRes.user.email || pendingOtpData.email,
            phone: fbRes.user.phone || pendingOtpData.phone,
            city: fbRes.user.city || 'Kumbakonam',
            state: fbRes.user.state || 'Tamil Nadu',
            addresses: fbRes.user.addresses || []
          };

          setUser(verifiedUser);
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(verifiedUser));
          setPendingOtpData(null);
          setNativeConfirmation(null);
          setIsAuthModalOpen(false);

          if (pendingSuccessCallback) {
            const cb = pendingSuccessCallback;
            setPendingSuccessCallback(null);
            setTimeout(() => cb(), 150);
          }
          return { success: true };
        }
      } catch (fbErr: any) {
        console.warn('Native Firebase verification notice:', fbErr?.message || fbErr);
        if (fbErr?.code === 'auth/invalid-verification-code') {
          return { success: false, error: 'Invalid 6-digit OTP code. Please check your latest SMS and try again.' };
        }
        if (fbErr?.code === 'auth/session-expired' || fbErr?.code === 'auth/code-expired') {
          return { success: false, error: 'The OTP code has expired. Please tap "Resend OTP" to get a fresh code.' };
        }
      }
    }

    // 2. Try standard backend OTP verification
    let res = await verifyPhoneOtpApi({
      phone: pendingOtpData.phone,
      otp: cleanOtp,
      email: pendingOtpData.email
    });

    // 3. Fallback to Firebase verify endpoint
    if (!res || !res.success) {
      const fbRes = await verifyFirebasePhoneApi({
        phone: pendingOtpData.phone,
        email: pendingOtpData.email,
        name: pendingOtpData.name
      });
      if (fbRes && fbRes.success) {
        res = fbRes;
      }
    }

    if (res && res.success && res.user) {
      const verifiedUser: User = {
        id: res.user.id || res.user._id,
        name: res.user.name || pendingOtpData.name || 'Valued Customer',
        email: res.user.email || pendingOtpData.email,
        phone: res.user.phone || pendingOtpData.phone,
        city: res.user.city || 'Kumbakonam',
        state: res.user.state || 'Tamil Nadu',
        addresses: res.user.addresses || []
      };

      setUser(verifiedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(verifiedUser));
      setPendingOtpData(null);
      setNativeConfirmation(null);
      setIsAuthModalOpen(false);

      if (pendingSuccessCallback) {
        const cb = pendingSuccessCallback;
        setPendingSuccessCallback(null);
        setTimeout(() => cb(), 150);
      }
      return { success: true };
    }

    return { success: false, error: res?.message || 'Invalid or expired OTP. Please try again.' };
  };

  const resendPhoneOtp = async (): Promise<{ success: boolean; error?: string; devOtp?: string }> => {
    if (!pendingOtpData) {
      return { success: false, error: 'No active session.' };
    }

    // Resend via Native Firebase if available
    let fbWarning = '';
    try {
      const nativeAuth = getNativeAuth();
      if (nativeAuth) {
        const fullPhoneNumber = `+91${pendingOtpData.phone}`;
        const confirmation = await nativeAuth.signInWithPhoneNumber(fullPhoneNumber, true);
        setNativeConfirmation(confirmation);
      }
    } catch (fbErr: any) {
      console.warn('Native Firebase resend notice:', fbErr?.message || fbErr);
      if (fbErr?.code === 'auth/too-many-requests' || fbErr?.message?.includes('too-many-requests')) {
        fbWarning = 'Firebase rate limit: Too many requests for this phone. Please wait a few minutes.';
      }
    }

    const res = await resendPhoneOtpApi({
      phone: pendingOtpData.phone,
      email: pendingOtpData.email
    });

    if (res && res.success) {
      let freshOtp = res.devOtp;
      if (!freshOtp) {
        freshOtp = await getActiveOtpApi(pendingOtpData.phone) || undefined;
      }
      if (!freshOtp) {
        await new Promise(r => setTimeout(r, 600));
        freshOtp = await getActiveOtpApi(pendingOtpData.phone) || undefined;
      }
      if (freshOtp) {
        setPendingOtpData(prev => prev ? ({ ...prev, devOtp: freshOtp }) : null);
      }
      return { success: true, devOtp: freshOtp };
    }
    return { success: false, error: fbWarning || res?.message || 'Failed to resend OTP. Please wait before retrying.' };
  };

  const forgotPassword = async (phone: string): Promise<{ success: boolean; phone?: string; devOtp?: string; error?: string }> => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    const backendRes = await forgotPasswordApi({ phone: cleanPhone });
    if (backendRes && !backendRes.success) {
      return { success: false, error: backendRes.message || 'No account found with this phone number.' };
    }

    // 1. Dispatch real carrier SMS via Native Android Firebase Phone Auth
    try {
      const nativeAuth = getNativeAuth();
      if (nativeAuth) {
        const fullPhoneNumber = `+91${cleanPhone}`;
        const confirmation = await nativeAuth.signInWithPhoneNumber(fullPhoneNumber);
        setNativeConfirmation(confirmation);
      }
    } catch (fbErr: any) {
      console.warn('Native Firebase reset OTP notice:', fbErr?.message || fbErr);
    }

    // 2. Fetch server active OTP for development testing fallback
    let testOtp = await getActiveOtpApi(cleanPhone) || undefined;
    if (!testOtp) {
      await new Promise(r => setTimeout(r, 600));
      testOtp = await getActiveOtpApi(cleanPhone) || undefined;
    }

    setPendingOtpData({
      phone: cleanPhone,
      email: '',
      devOtp: testOtp
    });
    setAuthMode('reset');
    return { success: true, phone: cleanPhone, devOtp: testOtp };
  };

  const resetPassword = async (phone: string, otp: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Valid 10-digit phone number is required.' };
    }
    const cleanOtp = (otp || '').trim();
    if (cleanOtp.length !== 6) {
      return { success: false, error: 'Please enter the 6-digit OTP code.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    let isFirebaseVerified = false;
    if (nativeConfirmation) {
      try {
        await nativeConfirmation.confirm(cleanOtp);
        isFirebaseVerified = true;
        setNativeConfirmation(null);
      } catch (fbErr: any) {
        console.warn('Native Firebase reset verify notice:', fbErr?.message || fbErr);
        if (fbErr?.code === 'auth/invalid-verification-code') {
          return { success: false, error: 'Invalid 6-digit OTP code. Please check your latest SMS and try again.' };
        }
        if (fbErr?.code === 'auth/session-expired' || fbErr?.code === 'auth/code-expired') {
          return { success: false, error: 'The OTP code has expired. Please tap "Resend OTP" to get a fresh code.' };
        }
      }
    }

    const backendRes = await resetPasswordApi({
      phone: cleanPhone,
      otp: cleanOtp,
      newPassword,
      isFirebaseVerified
    });

    if (backendRes && backendRes.success && backendRes.user) {
      const loggedUser: User = {
        id: backendRes.user.id || backendRes.user._id,
        name: backendRes.user.name || 'Valued Customer',
        email: backendRes.user.email || '',
        phone: backendRes.user.phone || cleanPhone,
        city: backendRes.user.city || 'Kumbakonam',
        state: backendRes.user.state || 'Tamil Nadu',
        addresses: backendRes.user.addresses || []
      };
      setUser(loggedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedUser));
      setPendingOtpData(null);
      setNativeConfirmation(null);
      setIsAuthModalOpen(false);

      if (pendingSuccessCallback) {
        const cb = pendingSuccessCallback;
        setPendingSuccessCallback(null);
        setTimeout(() => cb(), 150);
      }
      return { success: true };
    }

    return { success: false, error: backendRes?.message || 'Failed to reset password. Please check the OTP code.' };
  };

  const logout = () => {
    setUser(null);
    AsyncStorage.removeItem(USER_STORAGE_KEY).catch(() => {});
  };

  const updateUserAddress = async (newAddr: Address) => {
    if (!user) return false;
    const currentAddresses = user.addresses || [];
    const exists = currentAddresses.some(a => a.id === newAddr.id);
    const updated = exists
      ? currentAddresses.map(a => a.id === newAddr.id ? newAddr : a)
      : [...currentAddresses, newAddr];

    const updatedUser = { ...user, addresses: updated };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

    // Sync to backend MongoDB address book
    const addRes = await addAddressApi(user.email, {
      label: newAddr.label || 'Home',
      fullName: newAddr.fullName,
      phone: newAddr.phone,
      street: newAddr.street,
      city: newAddr.city,
      district: newAddr.city,
      state: newAddr.state || 'Tamil Nadu',
      pincode: newAddr.pincode,
      isDefault: newAddr.isDefault
    });

    if (addRes && addRes.success && Array.isArray(addRes.addresses)) {
      const syncedUser = { ...updatedUser, addresses: addRes.addresses };
      setUser(syncedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(syncedUser));
    }
    return true;
  };

  const deleteUserAddress = async (addressId: string) => {
    if (!user) return false;
    const updated = (user.addresses || []).filter(a => a.id !== addressId);
    const updatedUser = { ...user, addresses: updated };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

    // Delete from backend MongoDB
    await deleteAddressApi(user.email, addressId);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        verifyPhoneOtp,
        resendPhoneOtp,
        forgotPassword,
        resetPassword,
        cancelOtp,
        logout,
        updateUserAddress,
        deleteUserAddress,
        isAuthModalOpen,
        authMode,
        setAuthMode,
        pendingOtpData,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

