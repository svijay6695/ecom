import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import store from '../services/store.js';
import otpService from '../services/otpService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vr_nuts_super_secret_jwt_key_2026_kumbakonam';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role || 'customer', name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, city, state } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const phoneDigits = (phone || '').replace(/\D/g, '').slice(-10);
    if (!phoneDigits || phoneDigits.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone Number must be exactly 10 digits.' });
    }

    const existingUser = await store.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const existingPhoneUser = await store.findUserByPhone(phoneDigits);
    if (existingPhoneUser) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already registered. Please sign in instead.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await store.createUser({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: phoneDigits,
      isPhoneVerified: false,
      city: city || '',
      state: state || 'Tamil Nadu',
      role: 'customer'
    });

    // Generate 6-digit OTP for phone verification
    const otpResult = await otpService.generateOtp(phoneDigits, cleanEmail);

    res.status(200).json({
      success: true,
      requireOtp: true,
      message: 'Account created! Please enter the 6-digit OTP sent to your phone to verify your account.',
      phone: phoneDigits,
      email: cleanEmail,
      expiresInSeconds: otpResult.expiresInSeconds || 300,
      isTrialBlocked: !!otpResult.isTrialBlocked,
      devOtp: otpResult.isTrialBlocked ? otpResult.otp : undefined,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        isPhoneVerified: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, email, isFirebaseVerified } = req.body;

    let userEmail = (email || '').toLowerCase().trim();
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);

    if (!isFirebaseVerified) {
      if (!otp) {
        return res.status(400).json({ success: false, message: 'Verification code (OTP) is required' });
      }

      const verification = await otpService.verifyOtp(phone, otp, email);
      if (!verification.success) {
        return res.status(400).json({ success: false, message: verification.error });
      }
      if (verification.email) {
        userEmail = verification.email.toLowerCase().trim();
      }
    }

    // Lookup user by verified email or phone
    let user = null;
    if (userEmail) {
      user = await store.findUserByEmail(userEmail);
    }
    if (!user && cleanPhone) {
      const allUsers = await store.getAllUsers();
      user = allUsers.find(u => (u.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Mark phone verified in database
    await store.markPhoneVerified(user.email);

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Phone number verified successfully! Welcome to VP Nuts.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isPhoneVerified: true,
        role: user.role || 'customer',
        city: user.city || '',
        state: user.state || 'Tamil Nadu',
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying OTP' });
  }
};

export const verifyFirebasePhone = async (req, res) => {
  try {
    const { phone, email, idToken, name, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);

    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({ success: false, message: 'Phone number or email is required' });
    }

    // Find existing user by email or phone
    let user = null;
    if (cleanEmail) {
      user = await store.findUserByEmail(cleanEmail);
    }
    if (!user && cleanPhone) {
      const allUsers = await store.getAllUsers();
      user = allUsers.find(u => (u.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone);
    }

    // If user does not exist yet, create them with phone verified
    if (!user) {
      const defaultEmail = cleanEmail || `${cleanPhone}@customer.vpnuts.com`;
      const defaultName = name ? name.trim() : 'Valued Customer';
      const hashedPassword = await bcrypt.hash(password || 'VpNuts@' + cleanPhone.slice(-4), 10);
      user = await store.createUser({
        name: defaultName,
        email: defaultEmail,
        password: hashedPassword,
        phone: cleanPhone,
        isPhoneVerified: true,
        city: 'Kumbakonam',
        state: 'Tamil Nadu',
        role: 'customer'
      });
    } else {
      // Mark existing user phone as verified
      await store.markPhoneVerified(user.email);
      user.isPhoneVerified = true;
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Phone number verified successfully via Firebase! Welcome to VP Nuts.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isPhoneVerified: true,
        role: user.role || 'customer',
        city: user.city || '',
        state: user.state || 'Tamil Nadu',
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    console.error('Verify Firebase phone error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying Firebase phone' });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone && !email) {
      return res.status(400).json({ success: false, message: 'Phone number or email is required' });
    }

    let phoneToUse = phone;
    if (!phoneToUse && email) {
      const user = await store.findUserByEmail(email);
      if (user?.phone) phoneToUse = user.phone;
    }

    const otpResult = await otpService.generateOtp(phoneToUse, email);
    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.error,
        waitSeconds: otpResult.waitSeconds
      });
    }

    res.json({
      success: true,
      useFirebase: true,
      message: 'A fresh 6-digit OTP is being sent to your phone number via Firebase.',
      phone: otpResult.phone,
      expiresInSeconds: otpResult.expiresInSeconds || 300
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error resending OTP' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Default admin shortcut
    if (email.toLowerCase() === 'admin@vrnuts.com' && password === 'admin123') {
      const adminUser = {
        id: 'admin-primary',
        name: 'VP Nuts Administrator',
        email: 'admin@vrnuts.com',
        role: 'admin',
        city: 'Kumbakonam',
        state: 'Tamil Nadu'
      };
      const token = generateToken(adminUser);
      return res.json({
        success: true,
        message: 'Admin login successful',
        token,
        user: adminUser
      });
    }

    let user = await store.findUserByEmail(email);
    if (!user) {
      // Allow signing in with 10-digit registered phone number as well
      const cleanPhone = (email || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        user = await store.findUserByPhone(cleanPhone);
      }
    }
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (password === user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isPhoneVerified: !!user.isPhoneVerified,
        city: user.city || '',
        state: user.state || 'Tamil Nadu',
        role: user.role || 'customer',
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    const phoneDigits = (phone || '').replace(/\D/g, '').slice(-10);

    if (!phoneDigits || phoneDigits.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.'
      });
    }

    let user = await store.findUserByPhone(phoneDigits);
    if (!user) {
      const allUsers = await store.getAllUsers();
      user = allUsers.find(u => (u.phone || '').replace(/\D/g, '').slice(-10) === phoneDigits);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number. Please check the number or sign up.'
      });
    }

    // Attempt optional local OTP tracking without blocking client-side Firebase Phone Auth
    try {
      await otpService.generateOtp(phoneDigits, user.email);
    } catch (e) {
      console.warn('Optional local OTP generation skipped:', e.message);
    }

    res.json({
      success: true,
      useFirebase: true,
      message: `A 6-digit password reset code will be sent via SMS to +91 ${phoneDigits}.`,
      phone: phoneDigits,
      expiresInSeconds: 300
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error requesting password reset' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword, isFirebaseVerified } = req.body;
    const phoneDigits = (phone || '').replace(/\D/g, '').slice(-10);

    if (!phoneDigits || phoneDigits.length !== 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    let user = await store.findUserByPhone(phoneDigits);
    if (!user) {
      const allUsers = await store.getAllUsers();
      user = allUsers.find(u => (u.phone || '').replace(/\D/g, '').slice(-10) === phoneDigits);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (!isFirebaseVerified) {
      if (!otp || otp.toString().trim().length !== 6) {
        return res.status(400).json({ success: false, message: 'Please enter the complete 6-digit OTP code.' });
      }

      // Verify OTP code via SMS service
      const verification = await otpService.verifyOtp(phoneDigits, otp, user.email);
      if (!verification.success) {
        return res.status(400).json({ success: false, message: verification.error });
      }
    }

    // Hash new password and update in database
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await store.updateUserPassword(user.email, hashedPassword);

    // Also ensure phone is marked verified
    await store.markPhoneVerified(user.email);

    const token = generateToken(updatedUser || user);

    res.json({
      success: true,
      message: 'Password reset successfully! Welcome back to VP Nuts.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isPhoneVerified: true,
        role: user.role || 'customer',
        city: user.city || '',
        state: user.state || 'Tamil Nadu',
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await store.findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isPhoneVerified: !!user.isPhoneVerified,
        city: user.city || '',
        state: user.state || 'Tamil Nadu',
        role: user.role || 'customer',
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const email = req.user?.email || req.query.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }
    const user = await store.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || 'Tamil Nadu',
        role: user.role || 'customer',
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const email = req.user?.email || req.body.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }
    const { name, phone, city, state } = req.body;
    let cleanPhone = undefined;
    if (phone !== undefined) {
      cleanPhone = (phone || '').replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Phone Number must be exactly 10 digits.' });
      }
    }

    const updated = await store.updateUserProfile(email, { 
      name, 
      phone: cleanPhone !== undefined ? cleanPhone : undefined, 
      city, 
      state 
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

export const addAddress = async (req, res) => {
  try {
    const email = req.user?.email || req.body.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }
    const { label, fullName, phone, street, city, district, state, pincode, isDefault } = req.body;
    if (!fullName || !phone || !street || !city || !pincode) {
      return res.status(400).json({ success: false, message: 'Full name, phone, street, city, and pincode are required' });
    }

    const phoneDigits = (phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone Number must be exactly 10 digits.' });
    }

    const addresses = await store.addUserAddress(email, {
      label: label || 'Home',
      fullName,
      phone: phoneDigits,
      street,
      city,
      district: district || city,
      state: state || 'Tamil Nadu',
      pincode,
      isDefault: Boolean(isDefault)
    });
    if (!addresses) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      message: 'Address saved successfully',
      addresses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error adding address' });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const email = req.user?.email || req.query.email || req.body.email;
    const { id } = req.params;
    if (!email || !id) {
      return res.status(400).json({ success: false, message: 'User email and address ID are required' });
    }
    const addresses = await store.deleteUserAddress(email, id);
    res.json({
      success: true,
      message: 'Address removed successfully',
      addresses: addresses || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting address' });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const email = req.user?.email || req.body.email;
    const { id } = req.params;
    if (!email || !id) {
      return res.status(400).json({ success: false, message: 'User email and address ID are required' });
    }
    const addresses = await store.setDefaultUserAddress(email, id);
    res.json({
      success: true,
      message: 'Default address updated',
      addresses: addresses || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating default address' });
  }
};

