import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Package,
  Layers,
  IndianRupee,
  Sliders,
  AlertCircle,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  UploadCloud,
  Upload,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import './ProductsView.css';

const PRESET_IMAGES = [
  { label: 'Almonds', path: '/assets/1.jpg' },
  { label: 'Cashews', path: '/assets/2.jpg' },
  { label: 'Walnuts', path: '/assets/3.jpg' },
  { label: 'Pistachios', path: '/assets/4.jpg' },
  { label: 'Dates', path: '/assets/5.jpg' },
  { label: 'Sunflower Seeds', path: '/assets/6.jpg' },
  { label: 'Pumpkin Seeds', path: '/assets/7.jpg' },
  { label: 'Watermelon Seeds', path: '/assets/8.jpg' }
];

const ProductsView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Dedicated Price & Quantity Modal State
  const [priceQtyModalOpen, setPriceQtyModalOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState(null);
  const [priceQtyData, setPriceQtyData] = useState({
    basePrice: '',
    p250Price: '',
    p250Stock: 50,
    p250Available: true,
    p500Price: '',
    p500Stock: 50,
    p500Available: true,
    p1kgPrice: '',
    p1kgStock: 50,
    p1kgAvailable: true
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // General Add/Edit Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'nuts',
    price: '',
    image: '',
    p250Price: '',
    p250Stock: true,
    p250Qty: 50,
    p500Price: '',
    p500Stock: true,
    p500Qty: 50,
    p1kgPrice: '',
    p1kgStock: true,
    p1kgQty: 50
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({ category, search });
      if (res.success) {
        setProducts(res.data);
      }
    } catch (e) {
      console.warn('API error, using initial mock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, search]);

  // Image Upload state
  const fileInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

  // File upload processing
  const handleUploadFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, etc.).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit.');
      return;
    }

    setIsUploadingImage(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const res = await api.uploadProductImage(file);
      if (res && res.success && res.imageUrl) {
        setFormData(prev => ({ ...prev, image: res.imageUrl }));
        setUploadSuccess('Image uploaded successfully!');
        setTimeout(() => setUploadSuccess(''), 3000);
      } else {
        setUploadError(res.message || 'Image upload failed. Please try again.');
      }
    } catch (err) {
      setUploadError('Network error uploading image: ' + err.message);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Open Full Add Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setUploadError('');
    setUploadSuccess('');
    setShowManualUrl(false);
    setFormData({
      title: '',
      description: '',
      category: 'nuts',
      price: '',
      image: '',
      p250Price: '',
      p250Stock: true,
      p250Qty: 50,
      p500Price: '',
      p500Stock: true,
      p500Qty: 50,
      p1kgPrice: '',
      p1kgStock: true,
      p1kgQty: 50
    });
    setModalOpen(true);
  };

  // Open Full Edit Modal
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setUploadError('');
    setUploadSuccess('');
    setShowManualUrl(false);
    const opt250 = product.weightOptions?.find(o => o.key === '250g') || {};
    const opt500 = product.weightOptions?.find(o => o.key === '500g') || {};
    const opt1kg = product.weightOptions?.find(o => o.key === '1kg') || {};

    setFormData({
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      image: product.image || '',
      p250Price: opt250.price || Math.round(product.price * 0.28),
      p250Stock: opt250.available !== false,
      p250Qty: opt250.stock !== undefined ? opt250.stock : 50,
      p500Price: opt500.price || Math.round(product.price * 0.52),
      p500Stock: opt500.available !== false,
      p500Qty: opt500.stock !== undefined ? opt500.stock : 50,
      p1kgPrice: opt1kg.price || product.price,
      p1kgStock: opt1kg.available !== false,
      p1kgQty: opt1kg.stock !== undefined ? opt1kg.stock : 50
    });
    setModalOpen(true);
  };

  // Open Dedicated Price & Quantity Modal
  const handleOpenPriceQtyModal = (product) => {
    setTargetProduct(product);
    setSaveSuccessMsg('');
    const opt250 = product.weightOptions?.find(o => o.key === '250g') || {};
    const opt500 = product.weightOptions?.find(o => o.key === '500g') || {};
    const opt1kg = product.weightOptions?.find(o => o.key === '1kg') || {};

    setPriceQtyData({
      basePrice: product.price,
      p250Price: opt250.price || Math.round(product.price * 0.28),
      p250Stock: opt250.stock !== undefined ? opt250.stock : 50,
      p250Available: opt250.available !== false,
      p500Price: opt500.price || Math.round(product.price * 0.52),
      p500Stock: opt500.stock !== undefined ? opt500.stock : 50,
      p500Available: opt500.available !== false,
      p1kgPrice: opt1kg.price || product.price,
      p1kgStock: opt1kg.stock !== undefined ? opt1kg.stock : 50,
      p1kgAvailable: opt1kg.available !== false
    });
    setPriceQtyModalOpen(true);
  };

  const handleBasePriceChange = (val) => {
    const num = Number(val) || 0;
    setFormData(prev => ({
      ...prev,
      price: val,
      p250Price: Math.round(num * 0.28),
      p500Price: Math.round(num * 0.52),
      p1kgPrice: num
    }));
  };

  const handlePriceQtyBasePriceChange = (val) => {
    const num = Number(val) || 0;
    setPriceQtyData(prev => ({
      ...prev,
      basePrice: val,
      p250Price: Math.round(num * 0.28),
      p500Price: Math.round(num * 0.52),
      p1kgPrice: num
    }));
  };

  // Save from Dedicated Price & Quantity Modal
  const handleSavePriceQty = async (e) => {
    e.preventDefault();
    if (!targetProduct) return;

    const payload = {
      basePrice: Number(priceQtyData.p1kgPrice || priceQtyData.basePrice),
      weightOptions: [
        {
          key: '250g',
          label: '250 gram',
          multiplier: 0.28,
          price: Number(priceQtyData.p250Price),
          stock: Number(priceQtyData.p250Stock),
          available: Boolean(priceQtyData.p250Available && Number(priceQtyData.p250Stock) > 0)
        },
        {
          key: '500g',
          label: '500 gram',
          multiplier: 0.52,
          price: Number(priceQtyData.p500Price),
          stock: Number(priceQtyData.p500Stock),
          available: Boolean(priceQtyData.p500Available && Number(priceQtyData.p500Stock) > 0)
        },
        {
          key: '1kg',
          label: '1 kg',
          multiplier: 1.0,
          price: Number(priceQtyData.p1kgPrice),
          stock: Number(priceQtyData.p1kgStock),
          available: Boolean(priceQtyData.p1kgAvailable && Number(priceQtyData.p1kgStock) > 0)
        }
      ]
    };

    try {
      const res = await api.updatePriceAndQuantity(targetProduct.numericId, payload);
      if (res.success) {
        setSaveSuccessMsg(`Price & Quantity updated for ${targetProduct.title}!`);
        // Optimistic state update
        setProducts(prev => prev.map(p => p.numericId === targetProduct.numericId ? res.data : p));
        setTimeout(() => {
          setPriceQtyModalOpen(false);
          setSaveSuccessMsg('');
        }, 1200);
      }
    } catch (err) {
      alert('Failed to update price and quantity: ' + err.message);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      alert('Please provide product title and price');
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      price: Number(formData.price),
      image: formData.image || '/assets/1.jpg',
      weightOptions: [
        { key: '250g', label: '250 gram', multiplier: 0.28, price: Number(formData.p250Price), stock: Number(formData.p250Qty), available: formData.p250Stock },
        { key: '500g', label: '500 gram', multiplier: 0.52, price: Number(formData.p500Price), stock: Number(formData.p500Qty), available: formData.p500Stock },
        { key: '1kg', label: '1 kg', multiplier: 1.0, price: Number(formData.p1kgPrice), stock: Number(formData.p1kgQty), available: formData.p1kgStock }
      ]
    };

    try {
      if (editingProduct) {
        const res = await api.updateProduct(editingProduct.numericId, payload);
        if (res && res.success && res.data) {
          setProducts(prev => prev.map(p => p.numericId === editingProduct.numericId ? res.data : p));
        }
      } else {
        const res = await api.createProduct(payload);
        if (res && res.success && res.data) {
          setProducts(prev => [res.data, ...prev]);
        }
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert('Failed to save product: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from VP Nuts catalog?`)) {
      try {
        await api.deleteProduct(id);
        fetchProducts();
      } catch (err) {
        alert('Failed to delete product: ' + err.message);
      }
    }
  };

  const handleToggleWeight = async (productId, weightKey, currentAvailable) => {
    try {
      await api.toggleWeightStock(productId, weightKey, !currentAvailable);
      // Optimistic update
      setProducts(prev => prev.map(p => {
        if (p.numericId === productId) {
          const updatedOptions = (p.weightOptions || []).map(opt => {
            if (opt.key === weightKey) {
              return { ...opt, available: !currentAvailable };
            }
            return opt;
          });
          return { ...p, weightOptions: updatedOptions };
        }
        return p;
      }));
    } catch (err) {
      alert('Failed to toggle weight stock');
    }
  };

  return (
    <div className="products-page">
      {/* Action Toolbar */}
      <div className="products-toolbar">
        <div className="toolbar-left">
          {/* Category Tabs */}
          <div className="cat-filter-tabs">
            <button
              className={`cat-tab ${category === 'all' ? 'active' : ''}`}
              onClick={() => setCategory('all')}
            >
              All Items ({products.length})
            </button>
            <button
              className={`cat-tab ${category === 'nuts' ? 'active' : ''}`}
              onClick={() => setCategory('nuts')}
            >
              Nuts & Dry Fruits
            </button>
            <button
              className={`cat-tab ${category === 'seeds' ? 'active' : ''}`}
              onClick={() => setCategory('seeds')}
            >
              Nutrient Seeds
            </button>
          </div>

          {/* Search */}
          <div className="table-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, nuts or seeds..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <button className="add-product-btn" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="price-qty-info-bar">
        <Sliders size={16} className="info-icon" />
        <span>
          Click <strong>"Edit Price & Qty"</strong> to update variant prices and warehouse stock counts (250g, 500g, 1kg) in real-time.
        </span>
      </div>

      {/* Products Table Card */}
      <div className="dash-card">
        <div className="table-responsive">
          <table className="dash-table products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>250g (Price & Qty)</th>
                <th>500g (Price & Qty)</th>
                <th>1kg (Price & Qty)</th>
                <th>Total Stock</th>
                <th>Price & Qty Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((p) => {
                  const opt250 = p.weightOptions?.find(o => o.key === '250g');
                  const opt500 = p.weightOptions?.find(o => o.key === '500g');
                  const opt1kg = p.weightOptions?.find(o => o.key === '1kg');

                  const totalPacks = (opt250?.stock || 0) + (opt500?.stock || 0) + (opt1kg?.stock || 0);

                  return (
                    <tr key={p.numericId}>
                      <td>
                        <div className="product-item-cell">
                          <div className="product-thumb-box">
                            {p.image ? (
                              <img
                                src={p.image.startsWith('/uploads') ? `http://localhost:5001${p.image}` : p.image}
                                alt={p.title}
                                className="product-thumb-img"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.product-thumb-fallback');
                                  if (fallback) fallback.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <Package size={20} className="product-thumb-fallback" style={{ display: p.image ? 'none' : 'block' }} />
                          </div>
                          <div>
                            <strong className="product-name">{p.title}</strong>
                            <span className="product-meta-desc">{p.description}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`cat-badge ${p.category}`}>
                          {p.category === 'nuts' ? 'Nuts & Dry Fruits' : 'Nutrient Seeds'}
                        </span>
                      </td>

                      {/* 250g Variant */}
                      <td>
                        <div className="variant-cell">
                          <button
                            className={`variant-stock-btn ${opt250?.available !== false ? 'in-stock' : 'out-stock'}`}
                            onClick={() => handleToggleWeight(p.numericId, '250g', opt250?.available !== false)}
                            title="Click to toggle In-Stock / Out-of-Stock"
                          >
                            <span className="var-price">₹{opt250?.price || Math.round(p.price * 0.28)}</span>
                            <span className="var-qty">({opt250?.stock !== undefined ? opt250.stock : 50} pcs)</span>
                          </button>
                        </div>
                      </td>

                      {/* 500g Variant */}
                      <td>
                        <div className="variant-cell">
                          <button
                            className={`variant-stock-btn ${opt500?.available !== false ? 'in-stock' : 'out-stock'}`}
                            onClick={() => handleToggleWeight(p.numericId, '500g', opt500?.available !== false)}
                            title="Click to toggle In-Stock / Out-of-Stock"
                          >
                            <span className="var-price">₹{opt500?.price || Math.round(p.price * 0.52)}</span>
                            <span className="var-qty">({opt500?.stock !== undefined ? opt500.stock : 50} pcs)</span>
                          </button>
                        </div>
                      </td>

                      {/* 1kg Variant */}
                      <td>
                        <div className="variant-cell">
                          <button
                            className={`variant-stock-btn ${opt1kg?.available !== false ? 'in-stock' : 'out-stock'}`}
                            onClick={() => handleToggleWeight(p.numericId, '1kg', opt1kg?.available !== false)}
                            title="Click to toggle In-Stock / Out-of-Stock"
                          >
                            <span className="var-price">₹{opt1kg?.price || p.price}</span>
                            <span className="var-qty">({opt1kg?.stock !== undefined ? opt1kg.stock : 50} pcs)</span>
                          </button>
                        </div>
                      </td>

                      {/* Total Stock */}
                      <td>
                        <span className={`total-stock-badge ${totalPacks > 30 ? 'high' : totalPacks > 0 ? 'low' : 'zero'}`}>
                          {totalPacks} units
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn-edit-price-qty"
                            onClick={() => handleOpenPriceQtyModal(p)}
                            title="Maintain Variant Prices & Available Quantities"
                          >
                            <Sliders size={14} />
                            <span>Edit Price & Qty</span>
                          </button>

                          <button
                            className="icon-action-btn edit"
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Product Details"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            className="icon-action-btn delete"
                            onClick={() => handleDeleteProduct(p.numericId, p.title)}
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">No products found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEDICATED PRICE & QUANTITY MAINTENANCE MODAL */}
      {priceQtyModalOpen && targetProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card price-qty-modal">
            <div className="admin-modal-header">
              <div className="header-text-group">
                <span className="modal-pretitle">INVENTORY & PRICING MANAGER</span>
                <h3>Maintain Price & Quantity: {targetProduct.title}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setPriceQtyModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="modal-toast-success">
                <CheckCircle2 size={18} />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePriceQty} className="modal-form">
              <div className="product-summary-strip">
                <div className="summary-col">
                  <span className="sub-label">CATEGORY</span>
                  <strong>{targetProduct.category === 'nuts' ? 'Nuts & Dry Fruits' : 'Nutrient Seeds'}</strong>
                </div>
                <div className="summary-col">
                  <span className="sub-label">BASE 1KG BENCHMARK</span>
                  <div className="base-price-input-wrapper">
                    <span>₹</span>
                    <input
                      type="number"
                      value={priceQtyData.p1kgPrice}
                      onChange={(e) => handlePriceQtyBasePriceChange(e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              {/* 3 Columns for 250g, 500g, 1kg */}
              <div className="maintain-weights-grid">
                {/* 250g Box */}
                <div className="maintain-weight-box">
                  <div className="weight-box-top">
                    <h4>250 gram Package</h4>
                    <span className="weight-box-badge">250g</span>
                  </div>

                  <div className="maintain-field">
                    <label>Price (₹)</label>
                    <div className="input-currency">
                      <span>₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={priceQtyData.p250Price}
                        onChange={(e) => setPriceQtyData({ ...priceQtyData, p250Price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="maintain-field">
                    <label>Quantity in Stock (Packs)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={priceQtyData.p250Stock}
                      onChange={(e) => setPriceQtyData({ ...priceQtyData, p250Stock: e.target.value })}
                    />
                  </div>

                  <label className="toggle-switch-label">
                    <input
                      type="checkbox"
                      checked={priceQtyData.p250Available && Number(priceQtyData.p250Stock) > 0}
                      onChange={(e) => setPriceQtyData({ ...priceQtyData, p250Available: e.target.checked })}
                    />
                    <span>{priceQtyData.p250Available && Number(priceQtyData.p250Stock) > 0 ? '✓ Available for Sale' : '✕ Out of Stock'}</span>
                  </label>
                </div>

                {/* 500g Box */}
                <div className="maintain-weight-box">
                  <div className="weight-box-top">
                    <h4>500 gram Package</h4>
                    <span className="weight-box-badge">500g</span>
                  </div>

                  <div className="maintain-field">
                    <label>Price (₹)</label>
                    <div className="input-currency">
                      <span>₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={priceQtyData.p500Price}
                        onChange={(e) => setPriceQtyData({ ...priceQtyData, p500Price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="maintain-field">
                    <label>Quantity in Stock (Packs)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={priceQtyData.p500Stock}
                      onChange={(e) => setPriceQtyData({ ...priceQtyData, p500Stock: e.target.value })}
                    />
                  </div>

                  <label className="toggle-switch-label">
                    <input
                      type="checkbox"
                      checked={priceQtyData.p500Available && Number(priceQtyData.p500Stock) > 0}
                      onChange={(e) => setPriceQtyData({ ...priceQtyData, p500Available: e.target.checked })}
                    />
                    <span>{priceQtyData.p500Available && Number(priceQtyData.p500Stock) > 0 ? '✓ Available for Sale' : '✕ Out of Stock'}</span>
                  </label>
                </div>

                {/* 1kg Box */}
                <div className="maintain-weight-box">
                  <div className="weight-box-top">
                    <h4>1 Kilogram Package</h4>
                    <span className="weight-box-badge">1kg</span>
                  </div>

                  <div className="maintain-field">
                    <label>Price (₹)</label>
                    <div className="input-currency">
                      <span>₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={priceQtyData.p1kgPrice}
                        onChange={(e) => setPriceQtyData({ ...priceQtyData, p1kgPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="maintain-field">
                    <label>Quantity in Stock (Packs)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={priceQtyData.p1kgStock}
                      onChange={(e) => setPriceQtyData({ ...priceQtyData, p1kgStock: e.target.value })}
                    />
                  </div>

                  <label className="toggle-switch-label">
                    <input
                      type="checkbox"
                      checked={priceQtyData.p1kgAvailable && Number(priceQtyData.p1kgStock) > 0}
                      onChange={(e) => setPriceQtyData({ ...priceQtyData, p1kgAvailable: e.target.checked })}
                    />
                    <span>{priceQtyData.p1kgAvailable && Number(priceQtyData.p1kgStock) > 0 ? '✓ Available for Sale' : '✕ Out of Stock'}</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setPriceQtyModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <Save size={16} />
                  <span>Update Price & Quantities</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Add / Edit Product Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>{editingProduct ? 'Edit Product Details' : 'Add New Product to VP Nuts'}</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="modal-form">
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pine Nuts"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="nuts">Nuts & Dry Fruits</option>
                    <option value="seeds">Nutrient Seeds</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  placeholder="Premium quality handpicked from Tamil Nadu & global farms..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Product Image Upload Section */}
              <div className="form-group image-upload-section">
                <div className="image-upload-header">
                  <label className="image-upload-title">
                    <ImageIcon size={16} />
                    <span>Product Image</span>
                  </label>
                  <button
                    type="button"
                    className="btn-toggle-manual-url"
                    onClick={() => setShowManualUrl(!showManualUrl)}
                  >
                    {showManualUrl ? 'Hide URL field' : 'Enter URL instead'}
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/avif,image/gif"
                  onChange={handleFileInputChange}
                />

                {/* Upload Status / Error feedback */}
                {uploadError && (
                  <div className="image-upload-alert error">
                    <AlertCircle size={16} />
                    <span>{uploadError}</span>
                  </div>
                )}
                {uploadSuccess && (
                  <div className="image-upload-alert success">
                    <CheckCircle2 size={16} />
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                {/* Upload Area / Preview Box */}
                {formData.image ? (
                  <div className="uploaded-image-card">
                    <div className="uploaded-img-preview">
                      <img
                        src={formData.image.startsWith('/uploads') ? `http://localhost:5001${formData.image}` : formData.image}
                        alt="Product Preview"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <div className="uploaded-img-details">
                      <div className="uploaded-badge-row">
                        <span className="uploaded-badge">✓ Image attached</span>
                      </div>
                      <p className="uploaded-path" title={formData.image}>
                        {formData.image.length > 50 ? `${formData.image.substring(0, 48)}...` : formData.image}
                      </p>
                      <div className="uploaded-actions">
                        <button
                          type="button"
                          className="btn-change-image"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          disabled={isUploadingImage}
                        >
                          <UploadCloud size={14} />
                          <span>Change Image</span>
                        </button>
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          disabled={isUploadingImage}
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`image-dropzone ${isDragging ? 'dragging' : ''} ${isUploadingImage ? 'uploading' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isUploadingImage && fileInputRef.current && fileInputRef.current.click()}
                  >
                    {isUploadingImage ? (
                      <div className="dropzone-uploading">
                        <Loader2 size={30} className="spin-loader" />
                        <span className="dropzone-main-text">Uploading image to server...</span>
                        <span className="dropzone-sub-text">Please wait a moment</span>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <div className="dropzone-icon-box">
                          <UploadCloud size={26} />
                        </div>
                        <div className="dropzone-text-group">
                          <span className="dropzone-main-text">
                            <strong>Click to upload</strong> or drag and drop image here
                          </span>
                          <span className="dropzone-sub-text">
                            JPG, PNG, WebP, AVIF or GIF (up to 10MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-choose-file"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current && fileInputRef.current.click();
                          }}
                        >
                          <Upload size={14} />
                          <span>Choose Image File</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Presets Strip */}
                <div className="preset-images-strip">
                  <span className="preset-label">Quick Presets:</span>
                  <div className="preset-badges">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.path}
                        type="button"
                        className={`preset-pill ${formData.image === preset.path ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, image: preset.path })}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fallback Manual URL Input (collapsible) */}
                {showManualUrl && (
                  <div className="manual-url-container">
                    <label className="manual-url-label">Direct Image URL / Path:</label>
                    <input
                      type="text"
                      placeholder="e.g. http://... or /assets/1.jpg"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Base Reference Price (1 kg) in ₹ *</label>
                <div className="input-with-symbol">
                  <span className="symbol">₹</span>
                  <input
                    type="number"
                    required
                    min="100"
                    step="10"
                    placeholder="1000"
                    value={formData.price}
                    onChange={(e) => handleBasePriceChange(e.target.value)}
                  />
                </div>
                <span className="field-hint">Auto-calculates 250g and 500g variant prices</span>
              </div>

              {/* Weight Pricing & Quantities Section */}
              <div className="weights-pricing-card">
                <h4 className="weights-heading">Package Variants, Pricing & Quantities</h4>
                <div className="weights-grid">
                  <div className="weight-col">
                    <label>250g Price (₹)</label>
                    <input
                      type="number"
                      value={formData.p250Price}
                      onChange={(e) => setFormData({ ...formData, p250Price: e.target.value })}
                    />
                    <label>Stock Qty (Packs)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.p250Qty}
                      onChange={(e) => setFormData({ ...formData, p250Qty: e.target.value })}
                    />
                    <label className="checkbox-stock">
                      <input
                        type="checkbox"
                        checked={formData.p250Stock}
                        onChange={(e) => setFormData({ ...formData, p250Stock: e.target.checked })}
                      />
                      <span>In Stock</span>
                    </label>
                  </div>

                  <div className="weight-col">
                    <label>500g Price (₹)</label>
                    <input
                      type="number"
                      value={formData.p500Price}
                      onChange={(e) => setFormData({ ...formData, p500Price: e.target.value })}
                    />
                    <label>Stock Qty (Packs)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.p500Qty}
                      onChange={(e) => setFormData({ ...formData, p500Qty: e.target.value })}
                    />
                    <label className="checkbox-stock">
                      <input
                        type="checkbox"
                        checked={formData.p500Stock}
                        onChange={(e) => setFormData({ ...formData, p500Stock: e.target.checked })}
                      />
                      <span>In Stock</span>
                    </label>
                  </div>

                  <div className="weight-col">
                    <label>1 kg Price (₹)</label>
                    <input
                      type="number"
                      value={formData.p1kgPrice}
                      onChange={(e) => setFormData({ ...formData, p1kgPrice: e.target.value })}
                    />
                    <label>Stock Qty (Packs)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.p1kgQty}
                      onChange={(e) => setFormData({ ...formData, p1kgQty: e.target.value })}
                    />
                    <label className="checkbox-stock">
                      <input
                        type="checkbox"
                        checked={formData.p1kgStock}
                        onChange={(e) => setFormData({ ...formData, p1kgStock: e.target.checked })}
                      />
                      <span>In Stock</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsView;
