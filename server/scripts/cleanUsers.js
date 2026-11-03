import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function cleanUsers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ No MONGODB_URI found in server/.env');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);

  const phonesToRemove = ['8940473703', '9600686102'];
  for (const phone of phonesToRemove) {
    const res = await User.deleteMany({
      $or: [
        { phone: phone },
        { phone: `+91 ${phone}` },
        { phone: `+91${phone}` },
        { phone: { $regex: phone } }
      ]
    });
    console.log(`✅ Removed ${res.deletedCount} user record(s) matching phone: ${phone}`);
  }

  await mongoose.disconnect();
  console.log('🎉 Cleanup complete! Both numbers can now be registered freshly.');
}

cleanUsers().catch((err) => {
  console.error('❌ Error during cleanup:', err.message);
  process.exit(1);
});

