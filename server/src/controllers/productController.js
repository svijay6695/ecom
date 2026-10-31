import store from '../services/store.js';
import { upload } from '../middleware/uploadMiddleware.js';

const getBaseUrl = (req) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:5001';
  return `${proto}://${host}`;
};

const sanitizeProductImage = (product, baseUrl) => {
  if (!product) return product;
  const p = product.toObject ? product.toObject() : { ...product };
  if (p.image) {
    if (p.image.includes('localhost:5001')) {
      p.image = p.image.replace(/https?:\/\/localhost:5001/, baseUrl);
    } else if (p.image.startsWith('/uploads')) {
      p.image = `${baseUrl}${p.image}`;
    }
  }
  return p;
};

export const getProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    let products = await store.getAllProducts(filter);

    // In-memory search if specified
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      products = products.filter(
        p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sort) {
      if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
      else if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
      else if (sort === 'name-asc') products.sort((a, b) => a.title.localeCompare(b.title));
    }

    const baseUrl = getBaseUrl(req);
    const sanitizedProducts = products.map(p => sanitizeProductImage(p, baseUrl));

    res.json({
      success: true,
      count: sanitizedProducts.length,
      data: sanitizedProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await store.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const baseUrl = getBaseUrl(req);
    res.json({ success: true, data: sanitizeProductImage(product, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { title, description, category, price, image, weightOptions } = req.body;

    if (!title || !price) {
      return res.status(400).json({ success: false, message: 'Title and base price are required.' });
    }

    const basePrice = Number(price);

    // Calculate weight options if not provided
    const options = weightOptions && weightOptions.length > 0 ? weightOptions : [
      { key: '250g', label: '250 gram', multiplier: 0.28, price: Math.round(basePrice * 0.28), available: true, stock: 50 },
      { key: '500g', label: '500 gram', multiplier: 0.52, price: Math.round(basePrice * 0.52), available: true, stock: 50 },
      { key: '1kg', label: '1 kg', multiplier: 1.0, price: basePrice, available: true, stock: 50 }
    ];

    const newProduct = await store.createProduct({
      title,
      description: description || `Premium ${title} sourced directly for optimum freshness and quality.`,
      category: category || 'nuts',
      price: basePrice,
      image: image || '/assets/1.jpg',
      weights: '1 kg',
      weightOptions: options,
      inStock: true
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: newProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const updated = await store.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const removed = await store.deleteProduct(req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: removed
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

export const toggleWeightStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { weightKey, available } = req.body;

    const product = await store.getProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updatedOptions = (product.weightOptions || []).map(opt => {
      if (opt.key === weightKey) {
        return { ...opt, available: available !== undefined ? available : !opt.available };
      }
      return opt;
    });

    const updated = await store.updateProduct(id, { weightOptions: updatedOptions });

    res.json({
      success: true,
      message: `Weight ${weightKey} stock updated`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle weight stock' });
  }
};

export const updatePriceAndQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { basePrice, weightOptions, inStock } = req.body;

    const product = await store.getProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updateData = {};
    if (basePrice !== undefined) updateData.price = Number(basePrice);
    if (inStock !== undefined) updateData.inStock = Boolean(inStock);
    if (weightOptions && Array.isArray(weightOptions)) {
      updateData.weightOptions = weightOptions.map(opt => ({
        key: opt.key,
        label: opt.label || (opt.key === '250g' ? '250 gram' : opt.key === '500g' ? '500 gram' : '1 kg'),
        multiplier: opt.multiplier || (opt.key === '250g' ? 0.28 : opt.key === '500g' ? 0.52 : 1.0),
        price: Number(opt.price),
        stock: Number(opt.stock !== undefined ? opt.stock : 50),
        available: opt.available !== undefined ? Boolean(opt.available) : (Number(opt.stock) > 0)
      }));
    }

    const updated = await store.updateProduct(id, updateData);
    res.json({
      success: true,
      message: 'Product price and quantity updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update price and quantity' });
  }
};

export const uploadProductImage = (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed'
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const baseUrl = getBaseUrl(req);
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    return res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`
    });
  });
};

