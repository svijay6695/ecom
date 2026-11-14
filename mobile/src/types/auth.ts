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
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  role?: string;
  addresses?: Address[];
}

