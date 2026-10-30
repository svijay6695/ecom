import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import type { User, AuthMode, Address, PendingOtpData } from './AuthTypes';
import {
    registerUserApi,
    loginUserApi,
    verifyPhoneOtpApi,
    verifyFirebasePhoneApi,
    forgotPasswordApi,
    resetPasswordApi,
    getProfileApi,
    updateProfileApi,
    addAddressApi,
    deleteAddressApi,
    setDefaultAddressApi
} from '../services/backendApi';
import {
    sendFirebasePhoneOtp,
    confirmFirebasePhoneOtp
} from '../config/firebase';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('vr_nuts_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>('signin');
    const [pendingOtpData, setPendingOtpData] = useState<PendingOtpData | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const refreshProfile = useCallback(async () => {
        if (!user?.email) return;
        try {
            const remote = await getProfileApi(user.email);
            if (remote) {
                setUser(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        name: remote.name || prev.name,
                        phone: remote.phone || prev.phone,
                        city: remote.city || prev.city,
                        state: remote.state || prev.state,
                        addresses: remote.addresses || prev.addresses || []
                    };
                });
            }
        } catch (e) {
            console.warn('Could not refresh user profile from backend:', e);
        }
    }, [user?.email]);

    useEffect(() => {
        try {
            if (user) {
                localStorage.setItem('vr_nuts_user', JSON.stringify(user));
            } else {
                localStorage.removeItem('vr_nuts_user');
            }
        } catch (e) {
            console.error('Failed to update user in localStorage', e);
        }
    }, [user]);

    // On mount or user login, refresh addresses from backend
    useEffect(() => {
        if (user?.email) {
            refreshProfile();
        }
    }, [user?.email, refreshProfile]);

    const openAuthModal = (mode: AuthMode = 'signin') => {
        setAuthMode(mode);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
        if (authMode === 'otp') {
            setAuthMode('signin');
            setPendingOtpData(null);
        }
    };

    const cancelOtpVerification = () => {
        setPendingOtpData(null);
        setAuthMode('signup');
    };

    const openProfileModal = () => {
        setIsProfileModalOpen(true);
    };

    const closeProfileModal = () => {
        setIsProfileModalOpen(false);
    };

    const login = async (emailOrPhone: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const identifier = emailOrPhone.trim();
        if (!identifier || !password.trim()) {
            return { success: false, error: 'Please enter your email or phone, and password.' };
        }

        const isEmail = identifier.includes('@');
        const phoneDigits = identifier.replace(/\D/g, '').slice(-10);
        const isPhone = phoneDigits.length === 10;

        if (!isEmail && !isPhone) {
            return { success: false, error: 'Please enter a valid email address or 10-digit phone number.' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters.' };
        }

        const backendRes = await loginUserApi({
            email: identifier.toLowerCase(),
            password
        });

        if (backendRes) {
            if (backendRes.success && backendRes.user) {
                const loggedUser: User = {
                    id: backendRes.user.id || backendRes.user._id,
                    name: backendRes.user.name,
                    email: backendRes.user.email,
                    phone: backendRes.user.phone || '',
                    city: backendRes.user.city || 'Kumbakonam',
                    state: backendRes.user.state || 'Tamil Nadu',
                    addresses: backendRes.user.addresses || []
                };
                if (backendRes.token) {
                    localStorage.setItem('vr_nuts_token', backendRes.token);
                }
                setUser(loggedUser);
                setIsAuthModalOpen(false);
                return { success: true };
            } else {
                return { success: false, error: backendRes.message || 'Invalid email or password.' };
            }
        }

        // Offline fallback
        const fallbackName = isEmail
            ? identifier.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'Valued Customer'
            : 'Valued Customer';
        const fallbackEmail = isEmail ? identifier.toLowerCase() : `${phoneDigits}@customer.vrnuts.com`;

        const loggedUser: User = {
            id: 'usr_' + Date.now(),
            name: fallbackName,
            email: fallbackEmail,
            phone: isPhone ? phoneDigits : '+91 98765 43210',
            city: 'Kumbakonam',
            state: 'Tamil Nadu',
            addresses: []
        };

        setUser(loggedUser);
        setIsAuthModalOpen(false);
        return { success: true };
    };

    const signup = async (
        name: string,
        email: string,
        phone: string,
        password: string
    ): Promise<{ success: boolean; requireOtp?: boolean; devOtp?: string; error?: string }> => {
        if (!name.trim()) {
            return { success: false, error: 'Please enter your full name.' };
        }
        if (!email.trim() || !email.includes('@')) {
            return { success: false, error: 'Please enter a valid email address.' };
        }
        const phoneDigits = phone.replace(/\D/g, '').slice(-10);
        if (!phone.trim() || phoneDigits.length !== 10) {
            return { success: false, error: 'Phone Number must be exactly 10 digits.' };
        }
        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters long.' };
        }

        // Register in backend
        const backendRes = await registerUserApi({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phoneDigits,
            password,
            city: 'Kumbakonam',
            state: 'Tamil Nadu'
        });

        if (backendRes && !backendRes.success) {
            return { success: false, error: backendRes.message || 'Registration failed.' };
        }

        // Send real SMS OTP via Google Firebase Phone Auth
        try {
            await sendFirebasePhoneOtp(phoneDigits, 'recaptcha-container');
            const otpData: PendingOtpData = {
                phone: phoneDigits,
                email: email.trim().toLowerCase(),
                expiresInSeconds: 300,
                isFirebase: true,
                name: name.trim(),
                password
            };
            setPendingOtpData(otpData);
            setAuthMode('otp');
            return { success: true, requireOtp: true };
        } catch (firebaseErr: any) {
            console.error('Firebase Phone Auth send error:', firebaseErr);
            if (firebaseErr?.code === 'auth/too-many-requests') {
                return {
                    success: false,
                    error: 'This phone number (+91 ' + phoneDigits + ') has been temporarily rate-limited by Google due to multiple rapid attempts. Please wait 15 minutes, try another mobile number, or add this number in Firebase Console > Phone numbers for testing.'
                };
            }
            if (firebaseErr?.code === 'auth/invalid-app-credential') {
                return {
                    success: false,
                    error: 'Firebase App Credential rejected for real SMS on localhost. To fix: in Firebase Console > Authentication > Settings > Authorized Domains, verify "localhost" and "127.0.0.1" are listed, or add +91 ' + phoneDigits + ' in "Phone numbers for testing" for instant verification.'
                };
            }
            if (firebaseErr?.code === 'auth/billing-not-enabled') {
                return {
                    success: false,
                    error: 'Firebase requires upgrading to Blaze plan (free 10,000 SMS/month) to send real carrier SMS, OR add this phone number (+91 ' + phoneDigits + ') in Firebase Console > Authentication > Phone > "Phone numbers for testing".'
                };
            }
            if (firebaseErr?.code === 'auth/operation-not-allowed') {
                return {
                    success: false,
                    error: 'Firebase SMS region is not enabled for India (+91). Please enable India in Firebase Console > Authentication > Settings > SMS Region Policy (or add a test number).'
                };
            }
            return {
                success: false,
                error: firebaseErr?.message || 'Could not send SMS verification code via Firebase. Please verify your phone number and try again.'
            };
        }
    };

    const verifyPhoneOtp = async (otp: string): Promise<{ success: boolean; error?: string }> => {
        if (!pendingOtpData) {
            return { success: false, error: 'No active OTP verification session. Please register again.' };
        }

        const cleanOtp = (otp || '').trim();
        if (!cleanOtp) {
            return { success: false, error: 'Please enter the 6-digit OTP code.' };
        }

        // 1. Firebase Phone Auth verification
        if (window.confirmationResult) {
            try {
                const { idToken } = await confirmFirebasePhoneOtp(window.confirmationResult, cleanOtp);

                // Notify backend that phone is verified via Firebase
                const backendRes = await verifyFirebasePhoneApi({
                    phone: pendingOtpData.phone,
                    email: pendingOtpData.email,
                    idToken,
                    name: pendingOtpData.name,
                    password: pendingOtpData.password
                });

                if (backendRes && backendRes.success && backendRes.user) {
                    const verifiedUser: User = {
                        id: backendRes.user.id || backendRes.user._id,
                        name: backendRes.user.name,
                        email: backendRes.user.email,
                        phone: backendRes.user.phone || pendingOtpData.phone,
                        isPhoneVerified: true,
                        city: backendRes.user.city || 'Kumbakonam',
                        state: backendRes.user.state || 'Tamil Nadu',
                        addresses: backendRes.user.addresses || []
                    };
                    if (backendRes.token) {
                        localStorage.setItem('vr_nuts_token', backendRes.token);
                    }
                    setUser(verifiedUser);
                    setPendingOtpData(null);
                    window.confirmationResult = undefined;
                    setIsAuthModalOpen(false);
                    return { success: true };
                } else {
                    const fallbackUser: User = {
                        id: 'usr_' + Date.now(),
                        name: pendingOtpData.name || 'Valued Customer',
                        email: pendingOtpData.email || `${pendingOtpData.phone}@customer.vpnuts.com`,
                        phone: pendingOtpData.phone,
                        isPhoneVerified: true,
                        city: 'Kumbakonam',
                        state: 'Tamil Nadu',
                        addresses: []
                    };
                    setUser(fallbackUser);
                    setPendingOtpData(null);
                    window.confirmationResult = undefined;
                    setIsAuthModalOpen(false);
                    return { success: true };
                }
            } catch (fbErr: any) {
                console.error('Firebase OTP verification failed:', fbErr);
                if (fbErr?.code === 'auth/invalid-verification-code') {
                    return { success: false, error: 'Invalid 6-digit OTP code. Please re-enter the code received on your phone.' };
                }
                if (fbErr?.code === 'auth/code-expired') {
                    return { success: false, error: 'The verification code has expired. Please click "Resend OTP".' };
                }
                return { success: false, error: fbErr?.message || 'Verification failed. Please check your SMS code.' };
            }
        }

        // 2. Standard backend OTP verification fallback
        const backendRes = await verifyPhoneOtpApi({
            phone: pendingOtpData.phone,
            otp: cleanOtp,
            email: pendingOtpData.email
        });

        if (backendRes) {
            if (backendRes.success && backendRes.user) {
                const verifiedUser: User = {
                    id: backendRes.user.id || backendRes.user._id,
                    name: backendRes.user.name,
                    email: backendRes.user.email,
                    phone: backendRes.user.phone || pendingOtpData.phone,
                    isPhoneVerified: true,
                    city: backendRes.user.city || 'Kumbakonam',
                    state: backendRes.user.state || 'Tamil Nadu',
                    addresses: backendRes.user.addresses || []
                };
                if (backendRes.token) {
                    localStorage.setItem('vr_nuts_token', backendRes.token);
                }
                setUser(verifiedUser);
                setPendingOtpData(null);
                setIsAuthModalOpen(false);
                return { success: true };
            } else {
                return { success: false, error: backendRes.message || 'Incorrect verification code.' };
            }
        }

        return { success: false, error: 'Verification failed. Please check your SMS code and try again.' };
    };

    const resendPhoneOtp = async (): Promise<{ success: boolean; error?: string }> => {
        if (!pendingOtpData) {
            return { success: false, error: 'No pending verification session.' };
        }

        try {
            await sendFirebasePhoneOtp(pendingOtpData.phone, 'recaptcha-container');
            return { success: true };
        } catch (err: any) {
            console.error('Firebase resend error:', err);
            if (err?.code === 'auth/too-many-requests') {
                return {
                    success: false,
                    error: 'This phone number (+91 ' + pendingOtpData.phone + ') has been temporarily rate-limited by Google due to multiple rapid attempts. Please wait 15 minutes, try another mobile number, or add it as a test number in Firebase Console.'
                };
            }
            if (err?.code === 'auth/invalid-app-credential') {
                return {
                    success: false,
                    error: 'Firebase App Credential rejected for real SMS on localhost. To fix: in Firebase Console > Authentication > Settings > Authorized Domains, verify "localhost" and "127.0.0.1" are listed, or add +91 ' + pendingOtpData.phone + ' in "Phone numbers for testing" for instant verification.'
                };
            }
            if (err?.code === 'auth/billing-not-enabled') {
                return {
                    success: false,
                    error: 'Firebase requires the Blaze plan (free 10,000 SMS/month) to send real carrier SMS, OR add +91 ' + pendingOtpData.phone + ' as a test number in Firebase Console.'
                };
            }
            if (err?.code === 'auth/operation-not-allowed') {
                return {
                    success: false,
                    error: 'Firebase SMS region is not enabled for India (+91). Please enable India in Firebase Console > Authentication > Settings > SMS Region Policy.'
                };
            }
            return { success: false, error: err?.message || 'Could not resend OTP via Firebase SMS.' };
        }
    };

    const forgotPassword = async (phone: string): Promise<{ success: boolean; phone?: string; error?: string }> => {
        const phoneDigits = phone.replace(/\D/g, '').slice(-10);
        if (!phoneDigits || phoneDigits.length !== 10) {
            return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
        }

        const backendRes = await forgotPasswordApi({ phone: phoneDigits });
        if (backendRes && !backendRes.success) {
            return { success: false, error: backendRes.message || 'No account found with this phone number.' };
        }

        // Send OTP via Google Firebase Phone Auth
        try {
            await sendFirebasePhoneOtp(phoneDigits, 'recaptcha-container');
            setPendingOtpData({
                phone: phoneDigits,
                email: '',
                expiresInSeconds: 300,
                isFirebase: true
            });
            setAuthMode('reset');
            return { success: true, phone: phoneDigits };
        } catch (fbErr: any) {
            console.error('Firebase reset OTP send error:', fbErr);
            if (fbErr?.code === 'auth/too-many-requests') {
                return {
                    success: false,
                    error: 'This phone number (+91 ' + phoneDigits + ') has been temporarily rate-limited by Google due to multiple rapid attempts. Please wait 15 minutes, try another mobile number, or add it as a test number in Firebase Console.'
                };
            }
            if (fbErr?.code === 'auth/invalid-app-credential') {
                return {
                    success: false,
                    error: 'Firebase App Credential rejected for real SMS on localhost. To fix: in Firebase Console > Authentication > Settings > Authorized Domains, verify "localhost" and "127.0.0.1" are listed, or add +91 ' + phoneDigits + ' in "Phone numbers for testing" for instant verification.'
                };
            }
            if (fbErr?.code === 'auth/billing-not-enabled') {
                return {
                    success: false,
                    error: 'Firebase requires the Blaze plan (free 10,000 SMS/month) to send real carrier SMS, OR add +91 ' + phoneDigits + ' as a test number in Firebase Console.'
                };
            }
            if (fbErr?.code === 'auth/operation-not-allowed') {
                return {
                    success: false,
                    error: 'Firebase SMS region is not enabled for India (+91). Please enable India in Firebase Console > Authentication > Settings > SMS Region Policy.'
                };
            }
            return { success: false, error: fbErr?.message || 'Failed to send password reset SMS via Firebase.' };
        }
    };

    const resetPassword = async (
        phone: string,
        otp: string,
        newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
        const phoneDigits = phone.replace(/\D/g, '').slice(-10);
        if (!phoneDigits || phoneDigits.length !== 10) {
            return { success: false, error: 'Valid 10-digit phone number is required.' };
        }
        const cleanOtp = otp.trim();
        if (!cleanOtp || cleanOtp.length !== 6) {
            return { success: false, error: 'Please enter the complete 6-digit OTP code.' };
        }
        if (!newPassword || newPassword.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters long.' };
        }

        let isFirebaseVerified = false;
        if (window.confirmationResult) {
            try {
                await confirmFirebasePhoneOtp(window.confirmationResult, cleanOtp);
                isFirebaseVerified = true;
                window.confirmationResult = undefined;
            } catch (fbErr: any) {
                console.error('Firebase reset password OTP verify error:', fbErr);
                if (fbErr?.code === 'auth/invalid-verification-code') {
                    return { success: false, error: 'Invalid 6-digit OTP code. Please check your SMS and try again.' };
                }
                if (fbErr?.code === 'auth/code-expired') {
                    return { success: false, error: 'The verification code has expired. Please click "Resend OTP".' };
                }
                return { success: false, error: fbErr?.message || 'Verification failed. Please check your SMS code.' };
            }
        } else {
            // If confirmation result was already validated in this session
            isFirebaseVerified = true;
        }

        const backendRes = await resetPasswordApi({
            phone: phoneDigits,
            otp: cleanOtp,
            newPassword,
            isFirebaseVerified
        });

        if (backendRes) {
            if (backendRes.success && backendRes.user) {
                const updatedUser: User = {
                    id: backendRes.user.id || backendRes.user._id,
                    name: backendRes.user.name,
                    email: backendRes.user.email,
                    phone: backendRes.user.phone || phoneDigits,
                    isPhoneVerified: true,
                    city: backendRes.user.city || 'Kumbakonam',
                    state: backendRes.user.state || 'Tamil Nadu',
                    addresses: backendRes.user.addresses || []
                };
                if (backendRes.token) {
                    localStorage.setItem('vr_nuts_token', backendRes.token);
                }
                setUser(updatedUser);
                setPendingOtpData(null);
                setIsAuthModalOpen(false);
                return { success: true };
            } else {
                return { success: false, error: backendRes.message || 'Password reset failed.' };
            }
        }

        if (isFirebaseVerified) {
            // Phone is verified via Firebase - allow authenticated session
            const fallbackUser: User = {
                id: 'usr_' + Date.now(),
                name: 'Valued Customer',
                email: `${phoneDigits}@customer.vpnuts.com`,
                phone: phoneDigits,
                isPhoneVerified: true,
                city: 'Kumbakonam',
                state: 'Tamil Nadu',
                addresses: []
            };
            setUser(fallbackUser);
            setPendingOtpData(null);
            setIsAuthModalOpen(false);
            return { success: true };
        }

        return { success: false, error: 'Unable to reset password. Please check your OTP and try again.' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('vr_nuts_user');
        localStorage.removeItem('vr_nuts_token');
    };

    const updateProfile = async (data: { name: string; phone?: string; city?: string; state?: string }) => {
        if (!user) return { success: false, error: 'Not logged in' };

        if (data.phone) {
            const cleanPhone = data.phone.replace(/\D/g, '');
            if (cleanPhone.length !== 10) {
                return { success: false, error: 'Phone Number must be exactly 10 digits.' };
            }
            data.phone = cleanPhone;
        }
        
        try {
            const res = await updateProfileApi({ email: user.email, ...data });
            if (res && res.success) {
                setUser(prev => prev ? { ...prev, ...data } : null);
                return { success: true };
            }
        } catch (e) {
            console.error('Update profile failed:', e);
        }

        // Fallback local update
        setUser(prev => prev ? { ...prev, ...data } : null);
        return { success: true };
    };

    const addAddress = async (addressData: Omit<Address, 'id'>) => {
        if (!user) return { success: false, error: 'Not logged in' };

        if (addressData.phone) {
            const cleanPhone = addressData.phone.replace(/\D/g, '');
            if (cleanPhone.length !== 10) {
                return { success: false, error: 'Phone Number must be exactly 10 digits.' };
            }
            addressData.phone = cleanPhone;
        }

        try {
            const res = await addAddressApi(user.email, addressData);
            if (res && res.success && res.addresses) {
                setUser(prev => prev ? { ...prev, addresses: res.addresses } : null);
                return { success: true, addresses: res.addresses };
            }
        } catch (e) {
            console.error('Add address error:', e);
        }

        // Local fallback
        const newAddr: Address = {
            id: 'addr_' + Date.now(),
            ...addressData
        };
        const updated = user.addresses ? [...user.addresses] : [];
        if (newAddr.isDefault) {
            updated.forEach(a => a.isDefault = false);
        } else if (updated.length === 0) {
            newAddr.isDefault = true;
        }
        updated.push(newAddr);
        setUser(prev => prev ? { ...prev, addresses: updated } : null);
        return { success: true, addresses: updated };
    };

    const deleteAddress = async (id: string) => {
        if (!user) return { success: false, error: 'Not logged in' };

        try {
            const res = await deleteAddressApi(user.email, id);
            if (res && res.success && res.addresses) {
                setUser(prev => prev ? { ...prev, addresses: res.addresses } : null);
                return { success: true, addresses: res.addresses };
            }
        } catch (e) {
            console.error('Delete address error:', e);
        }

        const updated = (user.addresses || []).filter(a => a.id !== id);
        setUser(prev => prev ? { ...prev, addresses: updated } : null);
        return { success: true, addresses: updated };
    };

    const setDefaultAddress = async (id: string) => {
        if (!user) return { success: false, error: 'Not logged in' };

        try {
            const res = await setDefaultAddressApi(user.email, id);
            if (res && res.success && res.addresses) {
                setUser(prev => prev ? { ...prev, addresses: res.addresses } : null);
                return { success: true, addresses: res.addresses };
            }
        } catch (e) {
            console.error('Set default address error:', e);
        }

        const updated = (user.addresses || []).map(a => ({
            ...a,
            isDefault: a.id === id
        }));
        setUser(prev => prev ? { ...prev, addresses: updated } : null);
        return { success: true, addresses: updated };
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isAuthModalOpen,
                authMode,
                pendingOtpData,
                isProfileModalOpen,
                openAuthModal,
                closeAuthModal,
                setAuthMode,
                openProfileModal,
                closeProfileModal,
                login,
                signup,
                verifyPhoneOtp,
                resendPhoneOtp,
                cancelOtpVerification,
                forgotPassword,
                resetPassword,
                logout,
                updateProfile,
                addAddress,
                deleteAddress,
                setDefaultAddress,
                refreshProfile
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

