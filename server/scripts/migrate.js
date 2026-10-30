import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, '../data/local_db.json');

async function migrate() {
  console.log('====================================================');
  console.log('🚀 VR NUTS: Local DB JSON -> MongoDB Migration Tool');
  console.log('====================================================\n');

  if (!fs.existsSync(DB_FILE)) {
    console.error(`❌ local_db.json not found at: ${DB_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('❌ Failed to parse local_db.json:', err.message);
    process.exit(1);
  }

  const localProducts = data.products || [];
  const localUsers = data.users || [];
  const localOrders = data.orders || [];

  console.log(`📂 Source File: ${DB_FILE}`);
  console.log(`📦 Found in local_db.json:`);
  console.log(`   - ${localProducts.length} Products`);
  console.log(`   - ${localUsers.length} Users`);
  console.log(`   - ${localOrders.length} Orders\n`);

  console.log('🔌 Connecting to MongoDB...');
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB. Please check your connection string in server/.env');
    process.exit(1);
  }

  console.log('\n--- 1. Migrating Products ---');
  let prodMigrated = 0;
  for (const p of localProducts) {
    await Product.findOneAndUpdate(
      { numericId: p.numericId },
      {
        numericId: p.numericId,
        title: p.title,
        description: p.description,
        category: p.category || 'nuts',
        image: p.image || '',
        price: p.price,
        weights: p.weights || '1 kg',
        weightOptions: p.weightOptions || [],
        inStock: p.inStock !== false,
        isFeatured: !!p.isFeatured
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    prodMigrated++;
    console.log(`  ✓ Product [ID ${p.numericId}]: ${p.title}`);
  }

  console.log('\n--- 2. Migrating Users & Saved Addresses ---');
  let usersMigrated = 0;
  for (const u of localUsers) {
    if (!u.email) continue;
    const cleanEmail = u.email.toLowerCase().trim();
    await User.findOneAndUpdate(
      { email: cleanEmail },
      {
        name: u.name,
        email: cleanEmail,
        password: u.password,
        phone: u.phone || '',
        role: u.role || 'customer',
        city: u.city || 'Kumbakonam',
        state: u.state || 'Tamil Nadu',
        addresses: u.addresses || []
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    usersMigrated++;
    console.log(`  ✓ User: ${u.name} (${cleanEmail}) [Role: ${u.role || 'customer'}]`);
  }

  console.log('\n--- 3. Migrating Customer Orders ---');
  let ordersMigrated = 0;
  for (const o of localOrders) {
    if (!o.orderId) continue;
    await Order.findOneAndUpdate(
      { orderId: o.orderId },
      {
        orderId: o.orderId,
        customer: o.customer,
        shippingAddress: o.shippingAddress,
        items: o.items || [],
        trackingSteps: o.trackingSteps || [],
        currentStatus: o.currentStatus || 'confirmed',
        subtotal: o.subtotal,
        discount: o.discount || 0,
        deliveryFee: o.deliveryFee || 0,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod || 'cod',
        paymentStatus: o.paymentStatus || 'pending',
        estimatedDelivery: o.estimatedDelivery ? new Date(o.estimatedDelivery) : new Date(Date.now() + 48 * 3600 * 1000)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    ordersMigrated++;
    console.log(`  ✓ Order [${o.orderId}]: ₹${o.totalAmount} (${o.currentStatus})`);
  }

  console.log('\n====================================================');
  console.log('🎉 MIGRATION SUCCESSFUL! All data is now in MongoDB:');
  console.log(`   ✅ Products: ${prodMigrated}/${localProducts.length}`);
  console.log(`   ✅ Users:    ${usersMigrated}/${localUsers.length}`);
  console.log(`   ✅ Orders:   ${ordersMigrated}/${localOrders.length}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

