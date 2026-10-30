export interface Address {
    id: string;
    label: 'Home' | 'Office' | 'Other' | string;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    district?: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isPhoneVerified?: boolean;
    city?: string;
    state?: string;
    role?: string;
    addresses?: Address[];
}

export type AuthMode = 'signin' | 'signup' | 'otp' | 'forgot' | 'reset';

export interface PendingOtpData {
    phone: string;
    email: string;
    expiresInSeconds?: number;
    isTrialBlocked?: boolean;
    devOtp?: string;
    isFirebase?: boolean;
    name?: string;
    password?: string;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAuthModalOpen: boolean;
    authMode: AuthMode;
    pendingOtpData: PendingOtpData | null;
    isProfileModalOpen: boolean;
    openAuthModal: (mode?: AuthMode) => void;
    closeAuthModal: () => void;
    setAuthMode: (mode: AuthMode) => void;
    openProfileModal: () => void;
    closeProfileModal: () => void;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; requireOtp?: boolean; error?: string }>;
    verifyPhoneOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
    resendPhoneOtp: () => Promise<{ success: boolean; error?: string }>;
    cancelOtpVerification: () => void;
    forgotPassword: (phone: string) => Promise<{ success: boolean; phone?: string; error?: string }>;
    resetPassword: (phone: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: { name: string; phone?: string; city?: string; state?: string }) => Promise<{ success: boolean; error?: string }>;
    addAddress: (address: Omit<Address, 'id'>) => Promise<{ success: boolean; addresses?: Address[]; error?: string }>;
    deleteAddress: (id: string) => Promise<{ success: boolean; addresses?: Address[]; error?: string }>;
    setDefaultAddress: (id: string) => Promise<{ success: boolean; addresses?: Address[]; error?: string }>;
    refreshProfile: () => Promise<void>;
}

