import mongoose from 'mongoose';

const weightOptionSchema = new mongoose.Schema({
  key: { type: String, required: true }, // '250g', '500g', '1kg'
  label: { type: String, required: true }, // '250 gram', '500 gram', '1 kg'
  multiplier: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  available: { type: Boolean, default: true },
  stock: { type: Number, default: 100 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  numericId: { type: Number, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['nuts', 'seeds'], default: 'nuts', required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true }, // 1kg reference price
  weights: { type: String, default: '1 kg' },
  weightOptions: {
    type: [weightOptionSchema],
    default: [
      { key: '250g', label: '250 gram', multiplier: 0.28, price: 280, available: true, stock: 50 },
      { key: '500g', label: '500 gram', multiplier: 0.52, price: 520, available: true, stock: 50 },
      { key: '1kg', label: '1 kg', multiplier: 1.0, price: 1000, available: true, stock: 50 }
    ]
  },
  inStock: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;

