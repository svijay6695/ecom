import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed dataset
export const INITIAL_PRODUCTS = [
  {
    numericId: 1,
    title: "Almond",
    description: "Premium California almonds handpicked for crunch and nutrition",
    image: "/assets/1.jpg",
    category: "nuts",
    price: 1000,
    weights: "1 kg",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 280, available: true, stock: 50 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 520, available: true, stock: 50 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1000, available: true, stock: 50 }
    ],
    inStock: true,
    isFeatured: true
  },
  {
    numericId: 2,
    title: "Cashew",
    description: "Grade-A whole white cashews rich in natural buttery flavor",
    image: "/assets/2.jpg",
    category: "nuts",
    price: 1000,
    weights: "1 kg",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 280, available: true, stock: 45 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 520, available: true, stock: 45 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1000, available: true, stock: 45 }
    ],
    inStock: true,
    isFeatured: true
  },
  {
    numericId: 3,
    title: "Walnuts",
    description: "Premium omega-3 rich walnut kernels with natural crunch",
    image: "/assets/3.jpg",
    category: "nuts",
    price: 1500,
    weights: "1 kg",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 420, available: true, stock: 30 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 780, available: true, stock: 30 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1500, available: true, stock: 30 }
    ],
    inStock: true,
    isFeatured: false
  },
  {
    numericId: 4,
    title: "Pistachios",
    description: "Lightly salted roasted pistachios with authentic nutty aroma",
    image: "/assets/4.jpg",
    category: "nuts",
    price: 1500,
    weights: "1 kg",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 420, available: true, stock: 40 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 780, available: true, stock: 40 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1500, available: true, stock: 40 }
    ],
    inStock: true,
    isFeatured: false
  },
  {
    numericId: 5,
    title: "Dates",
    description: "Soft and luscious premium dark dates packed with fiber",
    image: "/assets/5.jpg",
    category: "nuts",
    price: 800,
    weights: "1 kg",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 224, available: true, stock: 60 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 416, available: true, stock: 60 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 800, available: true, stock: 60 }
    ],
    inStock: true,
    isFeatured: false
  },
  {
    numericId: 6,
    title: "Sunflower Seeds",
    description: "Peeled raw sunflower seeds loaded with vitamin E and minerals",
    image: "/assets/6.jpg",
    category: "seeds",
    price: 500,
    weights: "1 kg",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 140, available: true, stock: 50 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 260, available: true, stock: 50 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 500, available: true, stock: 50 }
    ],
    inStock: true,
    isFeatured: false
  },
  {
    numericId: 7,
    title: "Pumpkin Seeds",
    description: "Raw green pepitas (pumpkin seeds) high in zinc and protein",
    image: "/assets/7.jpg",
    category: "seeds",
    price: 800,
    weights: "1 kg",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 224, available: true, stock: 50 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 416, available: true, stock: 50 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 800, available: true, stock: 50 }
    ],
    inStock: true,
    isFeatured: false
  },
  {
    numericId: 8,
    title: "Watermelon Seeds",
    description: "Shelled nutritious watermelon magaz seeds for wholesome snacking",
    image: "/assets/8.jpg",
    category: "seeds",
    price: 700,
    weights: "1 kg",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 196, available: true, stock: 50 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 364, available: true, stock: 50 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 700, available: true, stock: 50 }
    ],
    inStock: true,
    isFeatured: false
  }
];

export const INITIAL_ORDERS = [];

export const INITIAL_USERS = [
  {
    id: "admin-1",
    name: "VP Nuts Administrator",
    email: "admin@vrnuts.com",
    password: "$2a$10$YourHashedPasswordPlaceholderWillBeOverridden",
    role: "admin",
    phone: "+91 82007 37159",
    city: "Kumbakonam",
    state: "Tamil Nadu"
  }
];

// In-Memory cache with JSON file persistence
class DataStore {
  constructor() {
    this.products = [...INITIAL_PRODUCTS];
    this.orders = [...INITIAL_ORDERS];
    this.users = [...INITIAL_USERS];
    this.loadFromFile();
  }

  async initMongoSeed() {
    if (!this.isMongoReady()) return;

    try {
      // 1. Seed Products if empty
      const prodCount = await Product.countDocuments();
      if (prodCount === 0) {
        console.log("🌱 Seeding MongoDB products collection...");
        const seedProds = this.products.length ? this.products : INITIAL_PRODUCTS;
        for (const p of seedProds) {
          await Product.create({
            numericId: p.numericId,
            title: p.title,
            description: p.description,
            image: p.image,
            category: p.category,
            price: p.price,
            weights: p.weights || '1 kg',
            weightOptions: p.weightOptions,
            inStock: p.inStock !== false,
            isFeatured: !!p.isFeatured
          });
        }
        console.log(`✅ Seeded ${seedProds.length} products to MongoDB.`);
      }

      // 2. Seed Users if empty
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log("🌱 Seeding MongoDB users collection...");
        const seedUsers = this.users.length ? this.users : INITIAL_USERS;
        for (const u of seedUsers) {
          await User.create({
            name: u.name,
            email: u.email.toLowerCase(),
            password: u.password,
            phone: u.phone || '',
            role: u.role || 'customer',
            city: u.city || '',
            state: u.state || 'Tamil Nadu',
            addresses: u.addresses || []
          });
        }
        console.log(`✅ Seeded ${seedUsers.length} users to MongoDB.`);
      }

      // Sync local users cache with MongoDB Atlas
      const atlasUsers = await User.find({});
      this.users = atlasUsers.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        password: u.password,
        phone: u.phone,
        isPhoneVerified: !!u.isPhoneVerified,
        role: u.role,
        city: u.city,
        state: u.state,
        addresses: u.addresses || [],
        createdAt: u.createdAt
      }));
      this.saveToFile();

      // 3. Seed Orders if empty
      const orderCount = await Order.countDocuments();
      if (orderCount === 0 && this.orders.length > 0) {
        console.log("🌱 Seeding MongoDB orders collection...");
        for (const o of this.orders) {
          await Order.create({
            orderId: o.orderId,
            customer: o.customer,
            shippingAddress: o.shippingAddress,
            items: o.items,
            trackingSteps: o.trackingSteps,
            currentStatus: o.currentStatus || 'confirmed',
            subtotal: o.subtotal,
            discount: o.discount || 0,
            deliveryFee: o.deliveryFee || 0,
            totalAmount: o.totalAmount,
            paymentMethod: o.paymentMethod || 'cod',
            paymentStatus: o.paymentStatus || 'pending',
            estimatedDelivery: o.estimatedDelivery || new Date(Date.now() + 48 * 3600 * 1000)
          });
        }
        console.log(`✅ Seeded ${this.orders.length} orders to MongoDB.`);
      }
    } catch (err) {
      console.error("⚠️ Error during MongoDB initialization/seeding:", err.message);
    }
  }

  isMongoReady() {
    return mongoose.connection.readyState === 1;
  }

  loadFromFile() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.products?.length) this.products = data.products;
        if (data.orders?.length) this.orders = data.orders;
        if (data.users?.length) this.users = data.users;
      } else {
        this.saveToFile();
      }
    } catch (e) {
      console.warn("Could not read local_db.json, using initial memory state.", e.message);
    }
  }

  saveToFile() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify({
        products: this.products,
        orders: this.orders,
        users: this.users
      }, null, 2));
    } catch (e) {
      console.warn("Could not write to local_db.json:", e.message);
    }
  }

  // PRODUCTS
  async getAllProducts(filter = {}) {
    if (this.isMongoReady()) {
      return Product.find(filter).sort({ numericId: 1 });
    }
    let res = [...this.products];
    if (filter.category) {
      res = res.filter(p => p.category === filter.category);
    }
    return res;
  }

  async getProductById(id) {
    const numId = Number(id);
    if (this.isMongoReady()) {
      return Product.findOne({ numericId: numId });
    }
    return this.products.find(p => p.numericId === numId);
  }

  async createProduct(data) {
    if (this.isMongoReady()) {
      const highest = await Product.findOne().sort({ numericId: -1 });
      const nextId = (highest?.numericId || 0) + 1;
      const product = new Product({ ...data, numericId: nextId });
      return await product.save();
    }
    const nextId = Math.max(0, ...this.products.map(p => p.numericId)) + 1;
    const newProduct = { ...data, numericId: nextId, inStock: true, createdAt: new Date() };
    this.products.push(newProduct);
    this.saveToFile();
    return newProduct;
  }

  async updateProduct(id, updateData) {
    const numId = Number(id);
    if (this.isMongoReady()) {
      return Product.findOneAndUpdate({ numericId: numId }, updateData, { new: true });
    }
    const idx = this.products.findIndex(p => p.numericId === numId);
    if (idx === -1) return null;
    this.products[idx] = { ...this.products[idx], ...updateData, updatedAt: new Date() };
    this.saveToFile();
    return this.products[idx];
  }

  async deleteProduct(id) {
    const numId = Number(id);
    if (this.isMongoReady()) {
      return Product.findOneAndDelete({ numericId: numId });
    }
    const idx = this.products.findIndex(p => p.numericId === numId);
    if (idx === -1) return null;
    const removed = this.products.splice(idx, 1);
    this.saveToFile();
    return removed[0];
  }

  // ORDERS
  async getAllOrders() {
    if (this.isMongoReady()) {
      return Order.find().sort({ createdAt: -1 });
    }
    return [...this.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getOrderById(orderId) {
    if (this.isMongoReady()) {
      return Order.findOne({ orderId });
    }
    return this.orders.find(o => o.orderId === orderId);
  }

  async createOrder(orderData) {
    if (this.isMongoReady()) {
      const order = new Order(orderData);
      return await order.save();
    }
    const newOrder = {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.unshift(newOrder);
    this.saveToFile();
    return newOrder;
  }

  async updateOrderStatus(orderId, newStatus, locationNote) {
    const validStatuses = ['confirmed', 'packed', 'in-transit', 'out-for-delivery', 'delivered', 'cancelled'];
    const statusTitles = {
      'confirmed': 'Order Confirmed',
      'packed': 'Vacuum Packed & Quality Checked',
      'in-transit': 'In Transit Across Tamil Nadu',
      'out-for-delivery': 'Out for Delivery',
      'delivered': 'Delivered Successfully',
      'cancelled': 'Order Cancelled'
    };

    if (this.isMongoReady()) {
      const order = await Order.findOne({ orderId });
      if (!order) return null;
      order.currentStatus = newStatus;
      if (newStatus === 'cancelled') {
        order.cancelledAt = new Date();
      }
      // Mark matching step or add step
      const stepIdx = order.trackingSteps.findIndex(s => s.status === newStatus);
      if (stepIdx !== -1) {
        order.trackingSteps[stepIdx].completed = true;
        order.trackingSteps[stepIdx].timestamp = new Date();
        if (locationNote) order.trackingSteps[stepIdx].location = locationNote;
      } else {
        order.trackingSteps.push({
          status: newStatus,
          title: statusTitles[newStatus] || newStatus,
          description: `Status updated to ${newStatus}`,
          location: locationNote || 'Tamil Nadu Logistics Hub',
          timestamp: new Date(),
          completed: true
        });
      }
      return await order.save();
    }

    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return null;
    order.currentStatus = newStatus;
    if (newStatus === 'cancelled') {
      order.cancelledAt = new Date();
    }
    const step = order.trackingSteps.find(s => s.status === newStatus);
    if (step) {
      step.completed = true;
      step.timestamp = new Date();
      if (locationNote) step.location = locationNote;
    } else {
      order.trackingSteps.push({
        status: newStatus,
        title: statusTitles[newStatus] || newStatus,
        description: `Status updated to ${newStatus}`,
        location: locationNote || 'Tamil Nadu Logistics Hub',
        timestamp: new Date(),
        completed: true
      });
    }
    this.saveToFile();
    return order;
  }

  async cancelOrder(orderId, reason = 'Cancelled by customer') {
    const cancelText = reason || 'Order was cancelled by customer';

    if (this.isMongoReady()) {
      const order = await Order.findOne({ orderId });
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      if (order.currentStatus === 'delivered') {
        return { success: false, error: 'Cannot cancel an order that has already been delivered.' };
      }
      if (order.currentStatus === 'cancelled') {
        return { success: false, error: 'This order has already been cancelled.' };
      }

      order.currentStatus = 'cancelled';
      order.cancelReason = cancelText;
      order.cancelledAt = new Date();

      order.trackingSteps.push({
        status: 'cancelled',
        title: 'Order Cancelled',
        description: cancelText,
        location: 'Kumbakonam Central Hub',
        timestamp: new Date(),
        completed: true
      });

      const saved = await order.save();
      return { success: true, order: saved };
    }

    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    if (order.currentStatus === 'delivered') {
      return { success: false, error: 'Cannot cancel an order that has already been delivered.' };
    }
    if (order.currentStatus === 'cancelled') {
      return { success: false, error: 'This order has already been cancelled.' };
    }

    order.currentStatus = 'cancelled';
    order.cancelReason = cancelText;
    order.cancelledAt = new Date();

    order.trackingSteps.push({
      status: 'cancelled',
      title: 'Order Cancelled',
      description: cancelText,
      location: 'Kumbakonam Central Hub',
      timestamp: new Date(),
      completed: true
    });

    this.saveToFile();
    return { success: true, order };
  }

  async clearAllOrders() {
    if (this.isMongoReady()) {
      await Order.deleteMany({});
    }
    this.orders = [];
    this.saveToFile();
    return true;
  }

  // USERS
  async findUserByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isMongoReady()) {
      return User.findOne({ email: cleanEmail });
    }
    return this.users.find(u => u.email.toLowerCase() === cleanEmail);
  }

  async findUserByPhone(phone) {
    if (!phone) return null;
    const cleanDigits = phone.toString().replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length !== 10) return null;

    if (this.isMongoReady()) {
      try {
        const found = await User.findOne({
          $or: [
            { phone: cleanDigits },
            { phone: `+91${cleanDigits}` },
            { phone: `+91 ${cleanDigits}` },
            { phone: `91${cleanDigits}` },
            { phone: { $regex: `${cleanDigits}$` } }
          ]
        });
        if (found) return found;
      } catch (e) {
        console.warn('Mongo findUserByPhone error:', e);
      }
    }

    return this.users.find(u => {
      if (!u.phone) return false;
      const userDigits = u.phone.toString().replace(/\D/g, '').slice(-10);
      return userDigits === cleanDigits;
    });
  }

  async createUser(userData) {
    if (this.isMongoReady()) {
      const user = new User(userData);
      const savedUser = await user.save();
      // Keep local cache & file backup in sync
      this.users.push({
        id: savedUser._id.toString(),
        name: savedUser.name,
        email: savedUser.email,
        password: savedUser.password,
        phone: savedUser.phone,
        isPhoneVerified: !!savedUser.isPhoneVerified,
        role: savedUser.role,
        city: savedUser.city,
        state: savedUser.state,
        createdAt: savedUser.createdAt
      });
      this.saveToFile();
      return savedUser;
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      isPhoneVerified: !!userData.isPhoneVerified,
      ...userData,
      createdAt: new Date()
    };
    this.users.push(newUser);
    this.saveToFile();
    return newUser;
  }

  async markPhoneVerified(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isMongoReady()) {
      return User.findOneAndUpdate(
        { email: cleanEmail },
        { $set: { isPhoneVerified: true } },
        { new: true }
      );
    }
    const idx = this.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      this.users[idx].isPhoneVerified = true;
      this.saveToFile();
      return this.users[idx];
    }
    return null;
  }

  async getAllUsers() {
    if (this.isMongoReady()) {
      return User.find().select('-password').sort({ createdAt: -1 });
    }
    return this.users.map(({ password, ...rest }) => rest);
  }

  async updateUserPassword(email, hashedPassword) {
    const cleanEmail = email.toLowerCase().trim();
    let updated = null;
    if (this.isMongoReady()) {
      try {
        updated = await User.findOneAndUpdate(
          { email: cleanEmail },
          { $set: { password: hashedPassword } },
          { new: true }
        );
      } catch (err) {
        console.warn('Mongo updateUserPassword error:', err);
      }
    }
    const idx = this.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      this.users[idx].password = hashedPassword;
      this.saveToFile();
      if (!updated) updated = this.users[idx];
    }
    return updated;
  }

  async updateUserProfile(email, profileData) {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isMongoReady()) {
      const updated = await User.findOneAndUpdate(
        { email: cleanEmail },
        { $set: profileData },
        { new: true }
      ).select('-password');
      return updated;
    }
    const idx = this.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...profileData };
      this.saveToFile();
      const { password, ...safeUser } = this.users[idx];
      return safeUser;
    }
    return null;
  }

  async addUserAddress(email, addressData) {
    const cleanEmail = email.toLowerCase().trim();
    const newAddr = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...addressData
    };

    if (this.isMongoReady()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) return null;
      if (newAddr.isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
      } else if (user.addresses.length === 0) {
        newAddr.isDefault = true;
      }
      user.addresses.push(newAddr);
      await user.save();
      return user.addresses;
    }

    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) return null;
    if (!user.addresses) user.addresses = [];
    if (newAddr.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    } else if (user.addresses.length === 0) {
      newAddr.isDefault = true;
    }
    user.addresses.push(newAddr);
    this.saveToFile();
    return user.addresses;
  }

  async deleteUserAddress(email, addressId) {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isMongoReady()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) return null;
      user.addresses = user.addresses.filter(a => a.id !== addressId);
      await user.save();
      return user.addresses;
    }

    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user || !user.addresses) return null;
    user.addresses = user.addresses.filter(a => a.id !== addressId);
    this.saveToFile();
    return user.addresses;
  }

  async setDefaultUserAddress(email, addressId) {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isMongoReady()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) return null;
      user.addresses.forEach(a => {
        a.isDefault = (a.id === addressId);
      });
      await user.save();
      return user.addresses;
    }

    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user || !user.addresses) return null;
    user.addresses.forEach(a => {
      a.isDefault = (a.id === addressId);
    });
    this.saveToFile();
    return user.addresses;
  }

  // STATS
  async getStats() {
    const orders = await this.getAllOrders();
    const products = await this.getAllProducts();

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const activeProducts = products.filter(p => p.inStock).length;
    const pendingDispatches = orders.filter(o => o.currentStatus !== 'delivered').length;

    // Breakdown by Tamil Nadu district
    const districtSales = {};
    orders.forEach(o => {
      const dist = o.shippingAddress?.district || o.shippingAddress?.city || 'Tamil Nadu';
      districtSales[dist] = (districtSales[dist] || 0) + (o.totalAmount || 0);
    });

    return {
      totalRevenue,
      totalOrders,
      activeProducts,
      totalProducts: products.length,
      pendingDispatches,
      districtSales,
      recentOrders: orders.slice(0, 5)
    };
  }
}

export const store = new DataStore();
export default store;

