import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    pendingOtpData,
    login,
    signup,
    verifyPhoneOtp,
    resendPhoneOtp,
    forgotPassword,
    resetPassword,
    cancelOtp
  } = useAuth();

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP states
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(30);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  // Forgot & Reset Password states
  const [forgotPhone, setForgotPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSendingForgot, setIsSendingForgot] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Reset fields on open/close
  useEffect(() => {
    if (isAuthModalOpen) {
      if (authMode === 'signin' || authMode === 'signup') {
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setOtpCode('');
        setLoading(false);
      } else if (authMode === 'forgot') {
        setForgotPhone('');
        setOtpCode('');
      } else if (authMode === 'reset') {
        setNewPassword('');
        setConfirmPassword('');
      }
    }
  }, [isAuthModalOpen, authMode]);

  // Countdown timer for OTP (for both signup OTP and password reset OTP)
  useEffect(() => {
    let timer: any = null;
    if ((authMode === 'otp' || authMode === 'reset') && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [authMode, resendCountdown]);

  // Reset countdown & keep OTP input empty for manual entry
  useEffect(() => {
    if (authMode === 'otp' || authMode === 'reset') {
      setResendCountdown(30);
      setOtpCode('');
    }
  }, [authMode]);

  const handleSubmit = async () => {
    setLoading(true);
    if (authMode === 'signin') {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Required', 'Please enter your email and password.');
        setLoading(false);
        return;
      }
      const res = await login(email, password);
      setLoading(false);
      if (!res.success) {
        Alert.alert('Sign In Failed', res.error || 'Invalid credentials');
      }
    } else if (authMode === 'signup') {
      if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
        Alert.alert('Required', 'Please fill in all details.');
        setLoading(false);
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
        setLoading(false);
        return;
      }
      const res = await signup(name, email, phone, password);
      setLoading(false);
      if (!res.success) {
        if (res.error?.toLowerCase().includes('already registered')) {
          Alert.alert(
            'Already Registered',
            'This phone number or email is already registered. Would you like to sign in instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign In', onPress: () => setAuthMode('signin') }
            ]
          );
        } else {
          Alert.alert('Sign Up Failed', res.error || 'Registration failed');
        }
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit OTP code.');
      return;
    }
    setIsVerifyingOtp(true);
    const res = await verifyPhoneOtp(otpCode);
    setIsVerifyingOtp(false);
    if (!res.success) {
      Alert.alert('Verification Failed', res.error || 'Invalid OTP code. Please check and try again.');
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResendingOtp) return;
    setIsResendingOtp(true);
    const res = await resendPhoneOtp();
    setIsResendingOtp(false);
    if (res.success) {
      setResendCountdown(30);
      setOtpCode('');
      Alert.alert('OTP Resent', 'A fresh 6-digit OTP has been sent via SMS to your mobile number.');
    } else {
      Alert.alert('Resend Failed', res.error || 'Could not resend OTP. Please try again later.');
    }
  };

  const handleForgotPasswordSubmit = async () => {
    const cleanPhone = forgotPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit registered mobile number.');
      return;
    }
    setIsSendingForgot(true);
    const res = await forgotPassword(cleanPhone);
    setIsSendingForgot(false);
    if (res.success) {
      setResendCountdown(30);
      setOtpCode('');
      Alert.alert('Reset Code Sent', `A 6-digit OTP has been sent via SMS to +91 ${cleanPhone}.`);
    } else {
      Alert.alert('Request Failed', res.error || 'Failed to send password reset code.');
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit OTP code received via SMS.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The confirmation password does not match.');
      return;
    }
    const phoneToUse = pendingOtpData?.phone || forgotPhone.replace(/\D/g, '').slice(-10);
    setIsResettingPassword(true);
    const res = await resetPassword(phoneToUse, otpCode, newPassword);
    setIsResettingPassword(false);
    if (res.success) {
      Alert.alert('Success', 'Your password has been reset successfully! You are now signed in.');
    } else {
      Alert.alert('Reset Failed', res.error || 'Password reset failed. Please check the OTP code.');
    }
  };

  const handleResendResetOtp = async () => {
    if (resendCountdown > 0 || isSendingForgot) return;
    const phoneToUse = pendingOtpData?.phone || forgotPhone.replace(/\D/g, '').slice(-10);
    if (!phoneToUse) return;
    setIsSendingForgot(true);
    const res = await forgotPassword(phoneToUse);
    setIsSendingForgot(false);
    if (res.success) {
      setResendCountdown(30);
      setOtpCode('');
      Alert.alert('OTP Resent', `A fresh 6-digit OTP has been dispatched to +91 ${phoneToUse}.`);
    } else {
      Alert.alert('Resend Failed', res.error || 'Could not resend OTP. Please wait before retrying.');
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <Modal
      visible={isAuthModalOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeAuthModal}
    >
      <View style={[styles.modalSafeArea, { paddingTop: topInset }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {authMode === 'signin'
              ? 'Sign In to VP Nuts'
              : authMode === 'signup'
              ? 'Create New Account'
              : authMode === 'forgot'
              ? 'Forgot Password'
              : authMode === 'reset'
              ? 'Reset Password'
              : 'Phone Verification'}
          </Text>
          <TouchableOpacity
            onPress={closeAuthModal}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.modalCloseBtn}
          >
            <X size={20} color="#6A5649" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.authScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.authCard}>
              {/* 1. SIGNUP OTP VIEW */}
              {authMode === 'otp' ? (
                <View>
                  <View style={styles.otpHeaderRow}>
                    <View style={styles.otpShieldBadge}>
                      <ShieldCheck size={24} color="#8B4513" />
                    </View>
                    <Text style={styles.otpCardTitle}>Enter Verification Code</Text>
                    <Text style={styles.otpCardSub}>
                      Enter the 6-digit SMS verification code sent to{'\n'}
                      <Text style={styles.otpPhoneHighlight}>+91 {pendingOtpData?.phone}</Text>
                    </Text>
                  </View>

                  {/* SMS / Network Delivery Status */}
                  <View style={styles.firebaseNoticeBox}>
                    <Smartphone size={15} color="#8B4513" />
                    <Text style={styles.firebaseNoticeText}>
                      SMS verification dispatched to <Text style={{ fontWeight: '700' }}>+91 {pendingOtpData?.phone}</Text>.
                    </Text>
                  </View>

                  {/* 6-Digit OTP Input */}
                  <View style={styles.otpInputGroup}>
                    <Text style={styles.modalInputLabel}>6-Digit OTP</Text>
                    <TextInput
                      style={styles.otpTextInput}
                      placeholder="• • • • • •"
                      placeholderTextColor="#C4B5A5"
                      keyboardType="numeric"
                      maxLength={6}
                      autoFocus
                      value={otpCode}
                      onChangeText={(t) => setOtpCode(t.replace(/\D/g, '').slice(0, 6))}
                    />
                    <Text style={styles.otpHint}>Code is valid for 5 minutes.</Text>
                  </View>

                  {/* Verify Action Button */}
                  <TouchableOpacity
                    style={[
                      styles.authSubmitBtn,
                      (isVerifyingOtp || otpCode.length !== 6) && styles.authSubmitBtnDisabled
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.authSubmitBtnText}>
                      {isVerifyingOtp ? 'Verifying Code...' : 'Verify & Complete Sign Up'}
                    </Text>
                  </TouchableOpacity>

                  {/* Resend OTP Row */}
                  <View style={styles.resendRow}>
                    <Text style={styles.resendPrompt}>Didn't receive code? </Text>
                    {resendCountdown > 0 ? (
                      <Text style={styles.countdownText}>
                        Resend in <Text style={styles.countdownBold}>{resendCountdown}s</Text>
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        disabled={isResendingOtp}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <RefreshCw size={13} color="#8B4513" />
                        <Text style={styles.resendLinkText}>
                          {isResendingOtp ? 'Resending...' : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Back to Sign Up Button */}
                  <TouchableOpacity
                    style={styles.backToSignupBtn}
                    onPress={cancelOtp}
                    activeOpacity={0.7}
                  >
                    <ArrowLeft size={15} color="#6A5649" />
                    <Text style={styles.backToSignupText}>Back to Sign Up</Text>
                  </TouchableOpacity>
                </View>
              ) : authMode === 'forgot' ? (
                /* 2. FORGOT PASSWORD VIEW */
                <View>
                  <View style={styles.otpHeaderRow}>
                    <View style={styles.otpShieldBadge}>
                      <KeyRound size={24} color="#8B4513" />
                    </View>
                    <Text style={styles.otpCardTitle}>Forgot Password?</Text>
                    <Text style={styles.otpCardSub}>
                      Enter your registered 10-digit mobile number and we'll dispatch a 6-digit OTP code to reset your password.
                    </Text>
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>Registered Mobile Number *</Text>
                    <View style={styles.phoneInputRow}>
                      <Text style={styles.phonePrefix}>+91</Text>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="10-digit mobile number"
                        placeholderTextColor="#A09287"
                        keyboardType="phone-pad"
                        maxLength={10}
                        autoFocus
                        value={forgotPhone}
                        onChangeText={(t) => setForgotPhone(t.replace(/\D/g, '').slice(0, 10))}
                      />
                    </View>
                    <Text style={styles.fieldHint}>We will send a 6-digit verification code via SMS</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.authSubmitBtn,
                      (isSendingForgot || forgotPhone.length !== 10) && styles.authSubmitBtnDisabled
                    ]}
                    onPress={handleForgotPasswordSubmit}
                    disabled={isSendingForgot || forgotPhone.length !== 10}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.authSubmitBtnText}>
                      {isSendingForgot ? 'Sending OTP Code...' : 'Send Password Reset Code'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backToSignupBtn}
                    onPress={() => setAuthMode('signin')}
                    activeOpacity={0.7}
                  >
                    <ArrowLeft size={15} color="#6A5649" />
                    <Text style={styles.backToSignupText}>Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              ) : authMode === 'reset' ? (
                /* 3. RESET PASSWORD VIEW (OTP + New Password) */
                <View>
                  <View style={styles.otpHeaderRow}>
                    <View style={styles.otpShieldBadge}>
                      <Lock size={24} color="#8B4513" />
                    </View>
                    <Text style={styles.otpCardTitle}>Create New Password</Text>
                    <Text style={styles.otpCardSub}>
                      Enter the 6-digit OTP code sent to{'\n'}
                      <Text style={styles.otpPhoneHighlight}>+91 {pendingOtpData?.phone || forgotPhone}</Text>
                      {'\n'}and set your new password.
                    </Text>
                  </View>

                  {/* 6-Digit OTP Input */}
                  <View style={styles.otpInputGroup}>
                    <Text style={styles.modalInputLabel}>6-Digit OTP Received via SMS *</Text>
                    <TextInput
                      style={styles.otpTextInput}
                      placeholder="• • • • • •"
                      placeholderTextColor="#C4B5A5"
                      keyboardType="numeric"
                      maxLength={6}
                      autoFocus
                      value={otpCode}
                      onChangeText={(t) => setOtpCode(t.replace(/\D/g, '').slice(0, 6))}
                    />
                  </View>

                  {/* Resend OTP Row */}
                  <View style={[styles.resendRow, { marginBottom: 16 }]}>
                    <Text style={styles.resendPrompt}>Didn't receive code? </Text>
                    {resendCountdown > 0 ? (
                      <Text style={styles.countdownText}>
                        Resend in <Text style={styles.countdownBold}>{resendCountdown}s</Text>
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={handleResendResetOtp}
                        disabled={isSendingForgot}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <RefreshCw size={13} color="#8B4513" />
                        <Text style={styles.resendLinkText}>
                          {isSendingForgot ? 'Resending...' : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* New Password */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>New Password (min 6 characters) *</Text>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={styles.passwordTextInput}
                        placeholder="Create new password"
                        placeholderTextColor="#A09287"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={styles.eyeToggleBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {showNewPassword ? <EyeOff size={18} color="#8A7A70" /> : <Eye size={18} color="#8A7A70" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm New Password */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>Confirm New Password *</Text>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={styles.passwordTextInput}
                        placeholder="Re-enter new password"
                        placeholderTextColor="#A09287"
                        secureTextEntry={!showNewPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                  </View>

                  {/* Reset Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.authSubmitBtn,
                      (isResettingPassword || otpCode.length !== 6 || newPassword.length < 6) && styles.authSubmitBtnDisabled
                    ]}
                    onPress={handleResetPasswordSubmit}
                    disabled={isResettingPassword || otpCode.length !== 6 || newPassword.length < 6}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.authSubmitBtnText}>
                      {isResettingPassword ? 'Updating Password...' : 'Update Password & Sign In'}
                    </Text>
                  </TouchableOpacity>

                  {/* Back to Sign In */}
                  <TouchableOpacity
                    style={styles.backToSignupBtn}
                    onPress={() => setAuthMode('signin')}
                    activeOpacity={0.7}
                  >
                    <ArrowLeft size={15} color="#6A5649" />
                    <Text style={styles.backToSignupText}>Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* 4. SIGN IN & SIGN UP VIEWS */
                <View>
                  <View style={styles.authBadgeRow}>
                    <View style={styles.authLogoBadge}>
                      <Text style={styles.authLogoText}>VP</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.authCardTitle}>
                        {authMode === 'signin' ? 'Welcome Back!' : 'Create Your Account'}
                      </Text>
                      <Text style={styles.authCardSub}>
                        {authMode === 'signin'
                          ? 'Sign in to access your saved addresses & checkout'
                          : 'Pure Kumbakonam dry fruits direct to your doorstep'}
                      </Text>
                    </View>
                  </View>

                  {/* Tab switch between Sign In and Sign Up */}
                  <View style={styles.tabsRow}>
                    <TouchableOpacity
                      style={[styles.tabBtn, authMode === 'signin' && styles.tabBtnActive]}
                      onPress={() => setAuthMode('signin')}
                    >
                      <Text style={[styles.tabBtnText, authMode === 'signin' && styles.tabBtnTextActive]}>
                        Sign In
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tabBtn, authMode === 'signup' && styles.tabBtnActive]}
                      onPress={() => setAuthMode('signup')}
                    >
                      <Text style={[styles.tabBtnText, authMode === 'signup' && styles.tabBtnTextActive]}>
                        Sign Up
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {authMode === 'signup' && (
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Full Name *</Text>
                      <TextInput
                        style={styles.modalTextInput}
                        placeholder="Enter your full name"
                        placeholderTextColor="#A09287"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>
                  )}

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>Email Address *</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      placeholder="name@example.com"
                      placeholderTextColor="#A09287"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  {authMode === 'signup' && (
                    <View style={styles.modalInputGroup}>
                      <Text style={styles.modalInputLabel}>Phone Number *</Text>
                      <View style={styles.phoneInputRow}>
                        <Text style={styles.phonePrefix}>+91</Text>
                        <TextInput
                          style={styles.phoneInput}
                          placeholder="10-digit mobile number"
                          placeholderTextColor="#A09287"
                          keyboardType="phone-pad"
                          maxLength={10}
                          value={phone}
                          onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                        />
                      </View>
                      <Text style={styles.fieldHint}>6-digit OTP will be sent for mobile verification</Text>
                    </View>
                  )}

                  <View style={styles.modalInputGroup}>
                    <View style={styles.labelWithLinkRow}>
                      <Text style={styles.modalInputLabel}>Password *</Text>
                      {authMode === 'signin' && (
                        <TouchableOpacity
                          onPress={() => setAuthMode('forgot')}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={styles.passwordTextInput}
                        placeholder="Enter password (min 6 chars)"
                        placeholderTextColor="#A09287"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeToggleBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {showPassword ? <EyeOff size={18} color="#8A7A70" /> : <Eye size={18} color="#8A7A70" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.authSubmitBtn, loading && styles.authSubmitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.authSubmitBtnText}>
                      {loading
                        ? 'Please wait...'
                        : authMode === 'signin'
                        ? 'Sign In & Continue'
                        : 'Send OTP & Create Account'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.switchAuthBtn}
                    onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchAuthText}>
                      {authMode === 'signin'
                        ? "Don't have an account? "
                        : 'Already have an account? '}
                      <Text style={styles.switchAuthBold}>
                        {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 16,
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF5EE',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 7,
  },
  tabBtnActive: {
    backgroundColor: '#8B4513',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A6B60',
  },
  tabBtnTextActive: {
    color: '#FFF',
    fontWeight: '700',
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
  labelWithLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotPasswordLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B4513',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2D4C3',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  passwordTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
  },
  eyeToggleBtn: {
    padding: 4,
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
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2D4C3',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  phonePrefix: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B4513',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
  },
  fieldHint: {
    fontSize: 11,
    color: '#8A7A70',
    marginTop: 4,
  },
  authSubmitBtn: {
    backgroundColor: '#8B4513',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  authSubmitBtnDisabled: {
    backgroundColor: '#C5B5A7',
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
  otpHeaderRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  otpShieldBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5EBE1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  otpCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 6,
  },
  otpCardSub: {
    fontSize: 13,
    color: '#7A6B60',
    textAlign: 'center',
    lineHeight: 18,
  },
  otpPhoneHighlight: {
    fontWeight: '800',
    color: '#8B4513',
  },
  firebaseNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E8DED1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  firebaseNoticeText: {
    fontSize: 12,
    color: '#6A5649',
    flex: 1,
  },
  devOtpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  devOtpText: {
    fontSize: 12,
    color: '#1B5E20',
    fontWeight: '600',
  },
  devOtpCode: {
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 1.5,
  },
  otpInputGroup: {
    alignItems: 'center',
    marginBottom: 10,
  },
  otpTextInput: {
    width: '100%',
    backgroundColor: '#FAF5EE',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 12,
    height: 54,
    fontSize: 24,
    fontWeight: '800',
    color: '#2C1810',
    textAlign: 'center',
    letterSpacing: 10,
  },
  otpHint: {
    fontSize: 11,
    color: '#8A7A70',
    marginTop: 6,
    textAlign: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  resendPrompt: {
    fontSize: 12,
    color: '#7A6B60',
  },
  countdownText: {
    fontSize: 12,
    color: '#8A7A70',
  },
  countdownBold: {
    fontWeight: '700',
    color: '#8B4513',
  },
  resendLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B4513',
  },
  backToSignupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  backToSignupText: {
    fontSize: 13,
    color: '#6A5649',
    fontWeight: '600',
  },
});
