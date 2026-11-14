import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Address } from '../types/auth';
import { loginUserApi, registerUserApi, getProfileApi, updateProfileApi } from '../api/client';

const USER_STORAGE_KEY = '@vpnuts_user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserAddress: (address: Address) => Promise<boolean>;
  deleteUserAddress: (addressId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

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
      return { success: true };
    }
    return { success: false, error: res?.message || 'Invalid email or password' };
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    const res = await registerUserApi({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, '').slice(-10),
      password,
      city: 'Kumbakonam',
      state: 'Tamil Nadu'
    });
    if (res && res.success) {
      // Auto-login newly registered account
      const newUser: User = {
        id: res.user?.id || 'usr_' + Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, '').slice(-10),
        city: 'Kumbakonam',
        state: 'Tamil Nadu',
        addresses: []
      };
      setUser(newUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      return { success: true };
    }
    return { success: false, error: res?.message || 'Registration failed' };
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
    await updateProfileApi(user.email, { addresses: updated });
    return true;
  };

  const deleteUserAddress = async (addressId: string) => {
    if (!user) return false;
    const updated = (user.addresses || []).filter(a => a.id !== addressId);
    const updatedUser = { ...user, addresses: updated };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    await updateProfileApi(user.email, { addresses: updated });
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUserAddress,
        deleteUserAddress
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

