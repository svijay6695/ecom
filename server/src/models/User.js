import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  id: { type: String, default: () => `addr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` },
  label: { type: String, default: 'Home' }, // 'Home', 'Office', 'Other'
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, default: 'Thanjavur' },
  state: { type: String, default: 'Tamil Nadu' },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, default: '' },
  isPhoneVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  city: { type: String, default: '' },
  state: { type: String, default: 'Tamil Nadu' },
  addresses: { type: [addressSchema], default: [] }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Don't re-hash if already hashed
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
