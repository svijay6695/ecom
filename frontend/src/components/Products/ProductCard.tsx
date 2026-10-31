import React, { useState, useMemo } from 'react';
import { ShoppingBag, Check, ChevronDown, AlertCircle } from 'lucide-react';
import { useCart, type Product } from '../../context/CartContext';
import { resolveProductImageUrl } from '../../services/backendApi';
import './ProductCard.css';

const DEFAULT_WEIGHT_OPTIONS = [
    { key: '250g', label: '250 gram', multiplier: 0.28 },
    { key: '500g', label: '500 gram', multiplier: 0.52 },
    { key: '1kg', label: '1 kg', multiplier: 1.0 }
];

const matchesWeight = (target: string, query: string): boolean => {
    const cleanTarget = target.toLowerCase().replace(/\s+/g, '');
    const cleanQuery = query.toLowerCase().replace(/\s+/g, '');
    if (cleanTarget === cleanQuery) return true;
    if (cleanTarget.includes('250') && cleanQuery.includes('250')) return true;
    if (cleanTarget.includes('500') && cleanQuery.includes('500')) return true;
    if ((cleanTarget.includes('1kg') || cleanTarget === '1kg' || cleanTarget.includes('1kilo')) &&
        (cleanQuery.includes('1kg') || cleanQuery === '1kg' || cleanQuery.includes('1kilo') || cleanQuery === '1')) {
        return true;
    }
    return false;
};

const ProductCard: React.FC<Product> = ({
    id,
    title,
    description,
    price,
    weights: defaultWeight,
    image,
    weightOptions,
    inStock,
    disabledWeights,
    availableWeights
}) => {
    const { addToCart, updateQuantity, getItemQuantity, setIsCartOpen } = useCart();

    const isWeightDisabled = (weightLabel: string): boolean => {
        if (inStock === false) return true;

        if (weightOptions && weightOptions.length > 0) {
            const opt = weightOptions.find(o => matchesWeight(o.label, weightLabel) || matchesWeight(o.key, weightLabel));
            if (opt) {
                if (opt.available === false) return true;
                if (opt.stock !== undefined && opt.stock <= 0) return true;
                return false;
            }
        }

        if (disabledWeights && disabledWeights.some(w => matchesWeight(weightLabel, w))) {
            return true;
        }
        if (availableWeights && !availableWeights.some(w => matchesWeight(weightLabel, w))) {
            return true;
        }
        return false;
    };

    // Calculate effective weight options reflecting live admin price & stock
    const effectiveOptions = useMemo(() => {
        if (weightOptions && weightOptions.length > 0) {
            return weightOptions.map(opt => ({
                key: opt.key,
                label: opt.label,
                price: Number(opt.price),
                stock: opt.stock !== undefined ? Number(opt.stock) : 50,
                available: opt.available !== false && (opt.stock === undefined || Number(opt.stock) > 0)
            }));
        }
        return DEFAULT_WEIGHT_OPTIONS.map(opt => ({
            key: opt.key,
            label: opt.label,
            price: Math.round(price * opt.multiplier),
            stock: 50,
            available: !isWeightDisabled(opt.label)
        }));
    }, [weightOptions, price]);

    // Initial weight selection (defaults to first available or 1 kg)
    const initialWeight = useMemo(() => {
        const preferred = defaultWeight || '1 kg';
        if (!isWeightDisabled(preferred)) return preferred;
        const firstAvailable = effectiveOptions.find(opt => opt.available);
        return firstAvailable ? firstAvailable.label : preferred;
    }, [effectiveOptions, defaultWeight]);

    const [selectedWeight, setSelectedWeight] = useState(initialWeight);
    const [selectedQty, setSelectedQty] = useState(1);
    const [justAdded, setJustAdded] = useState(false);

    // Current option, price, and stock
    const currentOption = useMemo(() => {
        return effectiveOptions.find(opt => matchesWeight(opt.label, selectedWeight) || matchesWeight(opt.key, selectedWeight)) || effectiveOptions[0];
    }, [effectiveOptions, selectedWeight]);

    const currentPrice = currentOption.price;
    const currentStock = currentOption.stock;
    const isCurrentWeightDisabled = isWeightDisabled(selectedWeight);

    const currentCartItemId = `${id}-${selectedWeight}`;
    const quantityInCart = getItemQuantity(id, selectedWeight);

    // Dynamic quantity options capped at available stock (max 10)
    const maxQtyAllowed = isCurrentWeightDisabled ? 0 : Math.max(1, Math.min(10, currentStock));
    const availableQtyOptions = Array.from({ length: maxQtyAllowed }, (_, i) => i + 1);

    const handleAddToCart = () => {
        if (isCurrentWeightDisabled || maxQtyAllowed === 0) return;

        addToCart({
            id,
            title,
            description,
            price: currentPrice,
            weights: selectedWeight,
            image,
            weightOptions,
            inStock
        }, selectedQty);

        setJustAdded(true);
        setTimeout(() => {
            setJustAdded(false);
        }, 1200);
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newQty = Number(e.target.value);
        if (quantityInCart > 0) {
            updateQuantity(currentCartItemId, newQty);
        } else {
            setSelectedQty(newQty);
        }
    };

    return (
        <div className={`product-card ${isCurrentWeightDisabled ? 'card-disabled' : ''}`}>
            <div className="product-image-container">
                <div className="bg-pattern"></div>
                {image ? (
                    <img
                        src={resolveProductImageUrl(image)}
                        alt={title}
                        className="product-image-real"
                    />
                ) : (
                    <div className="product-image-placeholder">
                        <span className="p-img-text">{title.split(' ')[0]}</span>
                    </div>
                )}
            </div>

            <div className="product-info">
                <h3 className="product-title">{title}</h3>
                <p className="product-desc">{description}</p>

                {/* Weight Package Dropdown with live prices & stock */}
                <div className="weight-dropdown-row">
                    <div className="weight-dropdown-wrapper">
                        <label htmlFor={`weight-${id}`} className="weight-dropdown-label">
                            Weight:
                        </label>
                        <select
                            id={`weight-${id}`}
                            className="weight-dropdown-select"
                            value={selectedWeight}
                            onChange={(e) => {
                                setSelectedWeight(e.target.value);
                                setSelectedQty(1);
                            }}
                            aria-label={`Select weight package for ${title}`}
                        >
                            {effectiveOptions.map((opt) => {
                                const disabled = isWeightDisabled(opt.label);
                                let suffix = ` - ₹${opt.price}`;
                                if (disabled) {
                                    suffix = ' (Out of stock)';
                                } else if (opt.stock <= 5) {
                                    suffix = ` - ₹${opt.price} (Only ${opt.stock} left)`;
                                }

                                return (
                                    <option key={opt.key || opt.label} value={opt.label} disabled={disabled}>
                                        {opt.label}{suffix}
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown size={14} className="weight-chevron" />
                    </div>
                </div>

                {/* Pricing & Stock Status */}
                <div className="price-tag-row">
                    <div className="price-tag">₹{currentPrice.toLocaleString('en-IN')}</div>
                    {isCurrentWeightDisabled ? (
                        <span className="weight-disabled-tag">
                            <AlertCircle size={12} /> Out of Stock
                        </span>
                    ) : currentStock <= 5 ? (
                        <span className="weight-disabled-tag" style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
                            Only {currentStock} left!
                        </span>
                    ) : null}
                </div>

                {/* Quantity Dropdown & Add Button Row */}
                <div className="card-actions-row">
                    <div className={`qty-dropdown-wrapper ${isCurrentWeightDisabled ? 'disabled' : ''}`}>
                        <label htmlFor={`qty-${id}`} className="qty-dropdown-label">
                            Qty:
                        </label>
                        <select
                            id={`qty-${id}`}
                            className="qty-dropdown-select"
                            value={quantityInCart > 0 ? quantityInCart : selectedQty}
                            onChange={handleQuantityChange}
                            disabled={isCurrentWeightDisabled || maxQtyAllowed === 0}
                            aria-label={`Select quantity for ${title}`}
                        >
                            {availableQtyOptions.map((qty) => (
                                <option key={qty} value={qty}>
                                    {qty}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="qty-chevron" />
                    </div>

                    {isCurrentWeightDisabled ? (
                        <button
                            type="button"
                            className="add-to-cart-btn disabled"
                            disabled
                        >
                            Unavailable
                        </button>
                    ) : quantityInCart > 0 ? (
                        <button
                            type="button"
                            className="card-in-cart-btn"
                            onClick={() => setIsCartOpen(true)}
                            title="View in shopping cart"
                        >
                            In Cart ({quantityInCart})
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={`add-to-cart-btn ${justAdded ? 'added' : ''}`}
                            onClick={handleAddToCart}
                        >
                            {justAdded ? (
                                <>
                                    <Check size={18} style={{ marginRight: '4px' }} />
                                    Added!
                                </>
                            ) : (
                                <>
                                    <ShoppingBag size={16} style={{ marginRight: '6px' }} />
                                    Add to Cart
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
