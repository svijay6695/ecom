import React, { useState, useEffect } from 'react';
import {
    X,
    Mail,
    Lock,
    User as UserIcon,
    Phone,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    ArrowLeft,
    RefreshCw,
    Smartphone,
    KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { AuthMode } from '../../context/AuthTypes';
import { resetRecaptchaVerifier } from '../../config/firebase';
import './AuthModal.css';

const AuthModal: React.FC = () => {
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
        cancelOtpVerification,
        forgotPassword,
        resetPassword
    } = useAuth();

    // Sign in form state
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');
    const [showSignInPassword, setShowSignInPassword] = useState(false);

    // Sign up form state
    const [signUpName, setSignUpName] = useState('');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPhone, setSignUpPhone] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [showSignUpPassword, setShowSignUpPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(true);

    // OTP verification state
    const [otpCode, setOtpCode] = useState('');
    const [resendCountdown, setResendCountdown] = useState(30);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isResendingOtp, setIsResendingOtp] = useState(false);
    const [resendSuccessMsg, setResendSuccessMsg] = useState('');

    // Forgot / Reset Password state
    const [forgotPhone, setForgotPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset all fields
    const resetAllFields = () => {
        setSignInEmail('');
        setSignInPassword('');
        setShowSignInPassword(false);
        setSignUpName('');
        setSignUpEmail('');
        setSignUpPhone('');
        setSignUpPassword('');
        setShowSignUpPassword(false);
        setOtpCode('');
        setForgotPhone('');
        setNewPassword('');
        setConfirmPassword('');
        setShowNewPassword(false);
        setErrorMessage('');
        setSuccessMessage('');
        setResendSuccessMsg('');
    };

    const handleTabSwitch = (mode: AuthMode) => {
        resetAllFields();
        resetRecaptchaVerifier('recaptcha-container');
        setAuthMode(mode);
    };

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isAuthModalOpen) {
                closeAuthModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAuthModalOpen, closeAuthModal]);

    // Reset form fields when modal opens or closes
    useEffect(() => {
        if (!isAuthModalOpen) {
            resetAllFields();
            resetRecaptchaVerifier('recaptcha-container');
        }
    }, [isAuthModalOpen]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isAuthModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isAuthModalOpen]);

    // Resend OTP countdown timer
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if ((authMode === 'otp' || authMode === 'reset') && resendCountdown > 0) {
            timer = setTimeout(() => {
                setResendCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [authMode, resendCountdown]);

    // Reset fields on mode switch
    useEffect(() => {
        if (authMode === 'otp' || authMode === 'reset') {
            setOtpCode('');
            setResendCountdown(30);
            setErrorMessage('');
            setSuccessMessage('');
        }
    }, [authMode]);

    if (!isAuthModalOpen) return null;

    const handleSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setIsSubmitting(true);

        const result = await login(signInEmail, signInPassword);
        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.error || 'Failed to sign in');
        } else {
            setSuccessMessage('Welcome back to VP Nuts!');
        }
    };

    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        const phoneDigits = signUpPhone.replace(/\D/g, '').slice(-10);
        if (phoneDigits.length !== 10) {
            setErrorMessage('Phone Number must be exactly 10 digits.');
            return;
        }

        if (!agreeTerms) {
            setErrorMessage('Please accept the Terms & Conditions.');
            return;
        }

        setIsSubmitting(true);
        const result = await signup(signUpName, signUpEmail, phoneDigits, signUpPassword);
        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.error || 'Failed to create account');
        } else if (result.requireOtp) {
            setSuccessMessage('6-digit OTP sent via SMS to your mobile phone.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } else {
            setSuccessMessage('Account created successfully! Welcome to VP Nuts.');
        }
    };

    const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        const cleanOtp = otpCode.trim();
        if (cleanOtp.length !== 6) {
            setErrorMessage('Please enter the complete 6-digit OTP code.');
            return;
        }

        setIsVerifyingOtp(true);
        const result = await verifyPhoneOtp(cleanOtp);
        setIsVerifyingOtp(false);

        if (!result.success) {
            setErrorMessage(result.error || 'Verification failed. Please check your SMS and try again.');
        } else {
            setSuccessMessage('Phone verified! Welcome to VP Nuts.');
        }
    };

    const handleResendOtpClick = async () => {
        if (resendCountdown > 0 || isResendingOtp) return;
        setErrorMessage('');
        setIsResendingOtp(true);
        const result = await resendPhoneOtp();
        setIsResendingOtp(false);

        if (!result.success) {
            setErrorMessage(result.error || 'Failed to resend OTP.');
        } else {
            setResendCountdown(30);
            setResendSuccessMsg('Fresh 6-digit OTP sent via SMS to your mobile phone.');
            setTimeout(() => setResendSuccessMsg(''), 4000);
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        const phoneDigits = forgotPhone.replace(/\D/g, '').slice(-10);
        if (phoneDigits.length !== 10) {
            setErrorMessage('Please enter a valid 10-digit mobile number.');
            return;
        }

        setIsSubmitting(true);
        const result = await forgotPassword(phoneDigits);
        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.error || 'Failed to send reset code.');
        } else {
            setResendCountdown(30);
            setSuccessMessage(`6-digit code sent via SMS to +91 ${result.phone || phoneDigits}.`);
            setTimeout(() => setSuccessMessage(''), 4000);
        }
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        const cleanOtp = otpCode.trim();
        if (cleanOtp.length !== 6) {
            setErrorMessage('Please enter the complete 6-digit OTP code.');
            return;
        }

        if (newPassword.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match. Please re-enter.');
            return;
        }

        const phoneToUse = pendingOtpData?.phone || forgotPhone.replace(/\D/g, '').slice(-10);
        setIsSubmitting(true);
        const result = await resetPassword(phoneToUse, cleanOtp, newPassword);
        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.error || 'Password reset failed. Please check the OTP code.');
        } else {
            setSuccessMessage('Password reset successfully! Welcome back to VP Nuts.');
        }
    };

    const handleResendResetOtpClick = async () => {
        if (resendCountdown > 0 || isResendingOtp) return;
        setErrorMessage('');
        setIsResendingOtp(true);
        const phoneToUse = pendingOtpData?.phone || forgotPhone.replace(/\D/g, '').slice(-10);
        const result = await forgotPassword(phoneToUse);
        setIsResendingOtp(false);

        if (!result.success) {
            setErrorMessage(result.error || 'Failed to resend OTP.');
        } else {
            setResendCountdown(30);
            setResendSuccessMsg('Fresh 6-digit code sent via SMS to your mobile phone.');
            setTimeout(() => setResendSuccessMsg(''), 4000);
        }
    };

    const activePhoneDisplay =
        pendingOtpData?.phone ||
        forgotPhone.replace(/\D/g, '').slice(-10) ||
        signUpPhone.replace(/\D/g, '').slice(-10);

    return (
        <div className="auth-modal-overlay" onClick={closeAuthModal}>
            <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="auth-close-btn" onClick={closeAuthModal} aria-label="Close auth dialog">
                    <X size={20} />
                </button>

                {/* Modal Header */}
                <div className="auth-header">
                    {authMode === 'otp' ? (
                        <>
                            <div className="auth-brand-badge otp-badge">
                                <ShieldCheck size={16} className="otp-shield-icon" />
                                <span>PHONE VERIFICATION</span>
                            </div>
                            <h2 className="auth-title">Verify Phone Number</h2>
                            <p className="auth-subtitle">
                                We sent a 6-digit verification code to{' '}
                                <strong className="otp-highlight-phone">+91 {activePhoneDisplay}</strong>
                            </p>
                            <button
                                type="button"
                                className="otp-edit-phone-btn"
                                onClick={() => {
                                    cancelOtpVerification();
                                    setErrorMessage('');
                                }}
                            >
                                Edit Phone Number
                            </button>
                        </>
                    ) : authMode === 'forgot' ? (
                        <>
                            <div className="auth-brand-badge otp-badge">
                                <KeyRound size={16} className="otp-shield-icon" />
                                <span>PASSWORD RECOVERY</span>
                            </div>
                            <h2 className="auth-title">Forgot Password?</h2>
                            <p className="auth-subtitle">
                                Enter your registered 10-digit mobile number to receive an SMS verification code.
                            </p>
                        </>
                    ) : authMode === 'reset' ? (
                        <>
                            <div className="auth-brand-badge otp-badge">
                                <ShieldCheck size={16} className="otp-shield-icon" />
                                <span>PASSWORD RESET</span>
                            </div>
                            <h2 className="auth-title">Create New Password</h2>
                            <p className="auth-subtitle">
                                Enter the 6-digit SMS code sent to{' '}
                                <strong className="otp-highlight-phone">+91 {activePhoneDisplay}</strong> and your new password.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="auth-brand-badge">
                                <span className="auth-brand-vr">VP</span>
                                <span className="auth-brand-nuts">NUTS</span>
                            </div>
                            <h2 className="auth-title">
                                {authMode === 'signin' ? 'Welcome Back' : 'Create an Account'}
                            </h2>
                            <p className="auth-subtitle">
                                {authMode === 'signin'
                                    ? 'Sign in to access your cart, orders & Tamil Nadu delivery.'
                                    : 'Join VP Nuts for fresh, handpicked premium dry fruits.'}
                            </p>
                        </>
                    )}
                </div>

                {/* Tab Switcher - only on signin and signup */}
                {(authMode === 'signin' || authMode === 'signup') && (
                    <div className="auth-tabs">
                        <button
                            type="button"
                            className={`auth-tab-btn ${authMode === 'signin' ? 'active' : ''}`}
                            onClick={() => handleTabSwitch('signin')}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`auth-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
                            onClick={() => handleTabSwitch('signup')}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                {/* Notification Alerts */}
                {errorMessage && (
                    <div className="auth-alert error">
                        <AlertCircle size={16} />
                        <span>{errorMessage}</span>
                    </div>
                )}
                {(successMessage || resendSuccessMsg) && (
                    <div className="auth-alert success">
                        <CheckCircle2 size={16} />
                        <span>{successMessage || resendSuccessMsg}</span>
                    </div>
                )}

                {/* 1. Sign In Form */}
                {authMode === 'signin' && (
                    <form className="auth-form" onSubmit={handleSignInSubmit} autoComplete="off">
                        {/* Hidden decoy fields to catch browser autofill heuristics */}
                        <input
                            type="text"
                            name="prevent_autofill_email"
                            tabIndex={-1}
                            autoComplete="off"
                            style={{ display: 'none' }}
                            aria-hidden="true"
                        />
                        <input
                            type="password"
                            name="prevent_autofill_password"
                            tabIndex={-1}
                            autoComplete="new-password"
                            style={{ display: 'none' }}
                            aria-hidden="true"
                        />

                        <div className="form-group">
                            <label htmlFor="signin-email">Email Address or Phone Number</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="input-icon" />
                                <input
                                    id="signin-email"
                                    name="vr_user_email"
                                    type="text"
                                    autoComplete="new-password"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    placeholder="Email or Phone"
                                    value={signInEmail}
                                    onChange={(e) => setSignInEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="label-with-link">
                                <label htmlFor="signin-password">Password</label>
                                <button
                                    type="button"
                                    className="forgot-link"
                                    onClick={() => handleTabSwitch('forgot')}
                                >
                                    Forgot?
                                </button>
                            </div>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="signin-password"
                                    name="vr_user_password"
                                    type={showSignInPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    placeholder="Enter password"
                                    value={signInPassword}
                                    onChange={(e) => setSignInPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing In...' : 'Sign In'}
                        </button>

                        <div className="auth-switch-prompt">
                            <span>Don't have an account?</span>{' '}
                            <button
                                type="button"
                                className="auth-switch-link"
                                onClick={() => handleTabSwitch('signup')}
                            >
                                Create Account
                            </button>
                        </div>
                    </form>
                )}

                {/* 2. Sign Up Form */}
                {authMode === 'signup' && (
                    <form className="auth-form" onSubmit={handleSignUpSubmit} autoComplete="off">
                        {/* Hidden decoy fields to catch browser autofill heuristics */}
                        <input
                            type="text"
                            name="prevent_autofill_email"
                            tabIndex={-1}
                            autoComplete="off"
                            style={{ display: 'none' }}
                            aria-hidden="true"
                        />
                        <input
                            type="password"
                            name="prevent_autofill_password"
                            tabIndex={-1}
                            autoComplete="new-password"
                            style={{ display: 'none' }}
                            aria-hidden="true"
                        />

                        <div className="form-group">
                            <label htmlFor="signup-name">Full Name *</label>
                            <div className="input-with-icon">
                                <UserIcon size={18} className="input-icon" />
                                <input
                                    id="signup-name"
                                    name="vr_signup_fullname"
                                    type="text"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="words"
                                    spellCheck={false}
                                    placeholder="Enter Full Name"
                                    value={signUpName}
                                    onChange={(e) => setSignUpName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="signup-email">Email Address *</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="input-icon" />
                                <input
                                    id="signup-email"
                                    name="vr_signup_email"
                                    type="email"
                                    autoComplete="new-password"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    placeholder="Enter Email Address"
                                    value={signUpEmail}
                                    onChange={(e) => setSignUpEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="signup-phone">Phone Number *</label>
                            <div className="input-with-icon phone-input-box">
                                <Phone size={18} className="input-icon" />
                                <span className="auth-country-prefix">+91</span>
                                <input
                                    id="signup-phone"
                                    name="vr_signup_phone"
                                    type="tel"
                                    maxLength={10}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    placeholder="Enter Phone Number"
                                    value={signUpPhone}
                                    onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    required
                                />
                            </div>
                            <span className="field-hint-text">10-digit mobile number for order OTP verification</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="signup-password">Create Password (min. 6 characters) *</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="signup-password"
                                    name="vr_signup_password"
                                    type={showSignUpPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    placeholder="Enter Password"
                                    value={signUpPassword}
                                    onChange={(e) => setSignUpPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                            />
                            <span>I agree to VP Nuts Terms & Privacy Policy</span>
                        </label>

                        {/* reCAPTCHA container for Phone Auth */}
                        <div id="recaptcha-container" className="recaptcha-wrapper"></div>

                        <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending OTP Code...' : 'Create Account & Verify Phone'}
                        </button>

                        <div className="auth-switch-prompt">
                            <span>Already registered?</span>{' '}
                            <button
                                type="button"
                                className="auth-switch-link"
                                onClick={() => handleTabSwitch('signin')}
                            >
                                Sign In
                            </button>
                        </div>
                    </form>
                )}

                {/* 3. Phone OTP Verification Form */}
                {authMode === 'otp' && (
                    <form className="auth-form otp-form" onSubmit={handleVerifyOtpSubmit}>
                        <div className="form-group otp-group">
                            <label htmlFor="otp-input" className="otp-input-label">
                                <Smartphone size={16} /> Enter 6-Digit OTP Received via SMS
                            </label>
                            <div className="otp-input-wrapper">
                                <input
                                    id="otp-input"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    autoFocus
                                    placeholder="• • • • • •"
                                    className="otp-main-input"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                            </div>
                            <span className="field-hint-text">Check your mobile SMS inbox. Code is valid for 5 minutes.</span>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn otp-verify-submit-btn"
                            disabled={isVerifyingOtp || otpCode.length !== 6}
                        >
                            {isVerifyingOtp ? 'Verifying Code...' : 'Verify & Complete Sign Up'}
                        </button>

                        <div className="otp-resend-row">
                            <span className="otp-resend-label">Didn't receive code?</span>
                            {resendCountdown > 0 ? (
                                <span className="otp-countdown-text">
                                    Resend in <strong>{resendCountdown}s</strong>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    className="otp-resend-btn"
                                    onClick={handleResendOtpClick}
                                    disabled={isResendingOtp}
                                >
                                    <RefreshCw size={13} className={isResendingOtp ? 'spin-icon' : ''} />
                                    {isResendingOtp ? 'Resending...' : 'Resend OTP'}
                                </button>
                            )}
                        </div>

                        <div className="otp-back-row">
                            <button
                                type="button"
                                className="otp-back-btn"
                                onClick={() => {
                                    cancelOtpVerification();
                                    setErrorMessage('');
                                }}
                            >
                                <ArrowLeft size={15} /> Back to Sign Up
                            </button>
                        </div>
                    </form>
                )}

                {/* 4. Forgot Password Request Form */}
                {authMode === 'forgot' && (
                    <form className="auth-form" onSubmit={handleForgotPasswordSubmit} autoComplete="off">
                        <div className="form-group">
                            <label htmlFor="forgot-phone">Registered Mobile Number (Tamil Nadu) *</label>
                            <div className="input-with-icon phone-input-box">
                                <Phone size={18} className="input-icon" />
                                <span className="auth-country-prefix">+91</span>
                                <input
                                    id="forgot-phone"
                                    name="vr_forgot_phone"
                                    type="tel"
                                    maxLength={10}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    placeholder="Enter 10-digit Phone Number"
                                    value={forgotPhone}
                                    onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    required
                                    autoFocus
                                />
                            </div>
                            <span className="field-hint-text">We will dispatch a 6-digit OTP code to this mobile via SMS.</span>
                        </div>

                        {/* reCAPTCHA container for Phone Auth */}
                        <div id="recaptcha-container" className="recaptcha-wrapper"></div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isSubmitting || forgotPhone.length !== 10}
                        >
                            {isSubmitting ? 'Sending Code...' : 'Send Password Reset Code'}
                        </button>

                        <div className="otp-back-row">
                            <button
                                type="button"
                                className="otp-back-btn"
                                onClick={() => handleTabSwitch('signin')}
                            >
                                <ArrowLeft size={15} /> Back to Sign In
                            </button>
                        </div>
                    </form>
                )}

                {/* 5. Reset Password Form (OTP + New Password) */}
                {authMode === 'reset' && (
                    <form className="auth-form otp-form" onSubmit={handleResetPasswordSubmit} autoComplete="off">
                        <div className="form-group otp-group">
                            <label htmlFor="reset-otp-input" className="otp-input-label">
                                <Smartphone size={16} /> Enter 6-Digit OTP Received via SMS
                            </label>
                            <div className="otp-input-wrapper">
                                <input
                                    id="reset-otp-input"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    autoFocus
                                    placeholder="• • • • • •"
                                    className="otp-main-input"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                            </div>
                            <span className="field-hint-text">Check your mobile SMS inbox on +91 {activePhoneDisplay}</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reset-new-password">Create New Password (min. 6 characters) *</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="reset-new-password"
                                    name="vr_reset_new_password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reset-confirm-password">Confirm New Password *</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="reset-confirm-password"
                                    name="vr_reset_confirm_password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn otp-verify-submit-btn"
                            disabled={isSubmitting || otpCode.length !== 6 || newPassword.length < 6 || !confirmPassword}
                        >
                            {isSubmitting ? 'Updating Password...' : 'Reset Password & Sign In'}
                        </button>

                        <div className="otp-resend-row">
                            <span className="otp-resend-label">Didn't receive code?</span>
                            {resendCountdown > 0 ? (
                                <span className="otp-countdown-text">
                                    Resend in <strong>{resendCountdown}s</strong>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    className="otp-resend-btn"
                                    onClick={handleResendResetOtpClick}
                                    disabled={isResendingOtp}
                                >
                                    <RefreshCw size={13} className={isResendingOtp ? 'spin-icon' : ''} />
                                    {isResendingOtp ? 'Resending...' : 'Resend OTP'}
                                </button>
                            )}
                        </div>

                        <div className="otp-back-row">
                            <button
                                type="button"
                                className="otp-back-btn"
                                onClick={() => handleTabSwitch('signin')}
                            >
                                <ArrowLeft size={15} /> Back to Sign In
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
