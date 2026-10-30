import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    type ConfirmationResult,
    type UserCredential
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD7AGMS3uFLDFNgOmT95hcmCdOQVlxpWIc',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'vpnutsapp.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vpnutsapp',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'vpnutsapp.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '175070274436',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:175070274436:web:4440d9e75004dac608f3d1'
};

// Initialize Firebase App singleton
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(firebaseApp);

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        recaptchaWidgetId?: number;
        confirmationResult?: ConfirmationResult;
    }
}

/**
 * Safely resets and cleans up the reCAPTCHA verifier and DOM element
 */
export function resetRecaptchaVerifier(containerId: string = 'recaptcha-container') {
    if (window.recaptchaVerifier) {
        try {
            window.recaptchaVerifier.clear();
        } catch (e) {
            console.warn('Could not clear recaptchaVerifier:', e);
        }
        window.recaptchaVerifier = undefined;
    }

    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Gets or creates the official Firebase RecaptchaVerifier
 */
export function getOrCreateRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
    if (window.recaptchaVerifier) {
        return window.recaptchaVerifier;
    }

    // Ensure DOM container exists
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
    }

    const verifier = new RecaptchaVerifier(firebaseAuth, containerId, {
        size: 'invisible',
        callback: () => {
            console.log('reCAPTCHA verified successfully');
        },
        'expired-callback': () => {
            console.warn('Firebase reCAPTCHA expired. Resetting verifier.');
            resetRecaptchaVerifier(containerId);
        }
    });

    window.recaptchaVerifier = verifier;
    return verifier;
}

/**
 * Sends a 6-digit SMS OTP to any Indian mobile number via Firebase Phone Authentication
 * @param rawPhone 10-digit phone number or string with phone digits
 * @param containerId DOM element id for reCAPTCHA container (default: 'recaptcha-container')
 */
export async function sendFirebasePhoneOtp(
    rawPhone: string,
    containerId: string = 'recaptcha-container'
): Promise<ConfirmationResult> {
    const digits = rawPhone.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const fullPhoneNumber = `+91${digits}`;

    const verifier = getOrCreateRecaptchaVerifier(containerId);

    try {
        const confirmationResult = await signInWithPhoneNumber(firebaseAuth, fullPhoneNumber, verifier);
        window.confirmationResult = confirmationResult;
        return confirmationResult;
    } catch (err: any) {
        console.error('Firebase signInWithPhoneNumber error:', err);
        resetRecaptchaVerifier(containerId);
        throw err;
    }
}

/**
 * Verifies the 6-digit OTP code against Firebase Phone Auth
 * @param confirmationResult Confirmation result returned from sendFirebasePhoneOtp
 * @param code 6-digit OTP code received by user via SMS
 */
export async function confirmFirebasePhoneOtp(
    confirmationResult: ConfirmationResult,
    code: string
): Promise<{ userCredential: UserCredential; idToken?: string }> {
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
        throw new Error('Please enter the full 6-digit OTP code.');
    }

    const userCredential = await confirmationResult.confirm(cleanCode);
    const idToken = await userCredential.user.getIdToken();
    return { userCredential, idToken };
}

