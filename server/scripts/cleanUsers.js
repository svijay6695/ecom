import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function cleanAll() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ No MONGODB_URI found in server/.env');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB Cluster...');
  const conn = await mongoose.connect(uri);

  const targetPhones = ['8940473703', '9600686102'];
  let totalDeleted = 0;

  try {
    // 1. List all databases on this cluster (vr_nuts, test, etc.)
    const adminDb = conn.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    console.log('📂 Found databases on cluster:', databases.map(d => d.name).join(', '));

    for (const dbInfo of databases) {
      if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;

      const db = conn.connection.client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      const hasUsers = collections.some(c => c.name === 'users');

      if (hasUsers) {
        console.log(`\n🔍 Checking database "${dbInfo.name}" -> collection "users"...`);
        const usersCol = db.collection('users');

        for (const phone of targetPhones) {
          const query = {
            $or: [
              { phone: phone },
              { phone: `+91 ${phone}` },
              { phone: `+91${phone}` },
              { phone: `91${phone}` },
              { phone: { $regex: `${phone}$` } }
            ]
          };

          const found = await usersCol.find(query).toArray();
          if (found.length > 0) {
            console.log(`   ⚠️ Found ${found.length} user(s) matching phone "${phone}":`);
            found.forEach(u => console.log(`      👉 Email: "${u.email}", Name: "${u.name}", Phone: "${u.phone}", ID: ${u._id}`));

            const delRes = await usersCol.deleteMany(query);
            totalDeleted += delRes.deletedCount;
            console.log(`   🗑️ Deleted ${delRes.deletedCount} user(s) from "${dbInfo.name}".`);
          } else {
            console.log(`   ✓ No users found with phone "${phone}" in "${dbInfo.name}".`);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Cluster database inspection notice:', err.message);
    // Fallback directly to connected database
    const db = conn.connection.db;
    const usersCol = db.collection('users');
    for (const phone of targetPhones) {
      const del = await usersCol.deleteMany({ phone: { $regex: `${phone}$` } });
      totalDeleted += del.deletedCount;
      console.log(`Deleted ${del.deletedCount} from default DB users collection`);
    }
  }

  // 2. Also clean local_db.json file
  const localDbFile = path.resolve(__dirname, '../data/local_db.json');
  if (fs.existsSync(localDbFile)) {
    try {
      const content = fs.readFileSync(localDbFile, 'utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data.users)) {
        const initialLen = data.users.length;
        data.users = data.users.filter(u => {
          const uDigits = (u.phone || '').replace(/\D/g, '').slice(-10);
          return !targetPhones.includes(uDigits);
        });
        if (data.users.length !== initialLen) {
          fs.writeFileSync(localDbFile, JSON.stringify(data, null, 2));
          console.log(`📂 Cleaned local_db.json (${initialLen - data.users.length} user removed).`);
        }
      }
    } catch (e) {
      console.warn('local_db.json check note:', e.message);
    }
  }

  await mongoose.disconnect();
  console.log('\n======================================================');
  console.log(`🎉 Done! Total deleted from MongoDB: ${totalDeleted}`);
  console.log('⚠️ IMPORTANT: You MUST restart your backend/container:');
  console.log('   docker restart vpnuts-api');
  console.log('   (or restart your local node server)');
  console.log('======================================================');
}

cleanAll().catch((e) => {
  console.error('Fatal cleanup error:', e.message);
  process.exit(1);
});
