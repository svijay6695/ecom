import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, X, SlidersHorizontal, PackageOpen } from 'lucide-react';
import ProductCard from './ProductCard';
import { getProductsApi } from '../../services/backendApi';
import './ProductList.css';

import almondImg from '../../assets/1.jpg';
import cashewImg from '../../assets/2.jpg';
import walnutImg from '../../assets/3.jpg';
import pistachioImg from '../../assets/4.jpg';
import datesImg from '../../assets/5.jpg';
import sunflowerSeedsImg from '../../assets/6.jpg';
import pumpkinSeedsImg from '../../assets/7.jpg';
import watermelonSeedsImg from '../../assets/8.jpg';

import type { Product } from '../../context/CartContext';

type CategoryFilter = 'all' | 'nuts' | 'seeds';
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

// Asset map linking numericIds to bundled high-res images
const LOCAL_IMAGES: Record<number, string> = {
    1: almondImg,
    2: cashewImg,
    3: walnutImg,
    4: pistachioImg,
    5: datesImg,
    6: sunflowerSeedsImg,
    7: pumpkinSeedsImg,
    8: watermelonSeedsImg,
};

// Initial local fallback products
const INITIAL_PRODUCTS: Product[] = [
    {
        id: 1,
        numericId: 1,
        title: "Almond",
        description: "Premium California almonds handpicked for crunch and nutrition",
        image: almondImg,
        price: 1000,
        weights: "1 kg",
        category: "nuts",
        weightOptions: [
            { key: "250g", label: "250 gram", multiplier: 0.28, price: 280, available: true, stock: 50 },
            { key: "500g", label: "500 gram", multiplier: 0.52, price: 520, available: true, stock: 50 },
            { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1000, available: true, stock: 50 }
        ]
    },
    {
        id: 2,
        numericId: 2,
        title: "Cashew",
        description: "Grade-A whole white cashews rich in natural buttery flavor",
        image: cashewImg,
        price: 1000,
        weights: "1 kg",
        category: "nuts",
        weightOptions: [
            { key: "250g", label: "250 gram", multiplier: 0.28, price: 280, available: true, stock: 45 },
            { key: "500g", label: "500 gram", multiplier: 0.52, price: 520, available: true, stock: 45 },
            { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1000, available: true, stock: 45 }
        ]
    },
    {
        id: 3,
        numericId: 3,
        title: "Walnuts",
        description: "Premium omega-3 rich walnut kernels with natural crunch",
        image: walnutImg,
        price: 1500,
        weights: "1 kg",
        category: "nuts",
        weightOptions: [
            { key: "250g", label: "250 gram", multiplier: 0.28, price: 420, available: true, stock: 30 },
            { key: "500g", label: "500 gram", multiplier: 0.52, price: 780, available: true, stock: 30 },
            { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1500, available: true, stock: 30 }
        ]
    },
    {
        id: 4,
        numericId: 4,
        title: "Pistachios",
        description: "Lightly salted roasted pistachios with authentic nutty aroma",
        image: pistachioImg,
        price: 1500,
        weights: "1 kg",
        category: "nuts",
        weightOptions: [
            { key: "250g", label: "250 gram", multiplier: 0.28, price: 420, available: true, stock: 40 },
            { key: "500g", label: "500 gram", multiplier: 0.52, price: 780, available: true, stock: 40 },
            { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1500, available: true, stock: 40 }
        ]
    },
    {
        id: 5,
        numericId: 5,
        title: "Dates",
        description: "Soft and luscious premium dark dates packed with fiber",
        image: datesImg,
        price: 800,
        weights: "1 kg",
        category: "nuts",
        weightOptions: [
            { key: "250g", label: "250 gram", multiplier: 0.28, price: 224, available: true, stock: 60 },
            { key: "500g", label: "500 gram", multiplier: 0.52, price: 416, available: true, stock: 60 },
            { key: "1kg", label: "1 kg", multiplier: 1.0, price: 800, available: true, stock: 60 }
        ]
    },
    {
        id: 6,
        numericId: 6,
        title: "Sunflower Seeds",
        description: "Peeled raw sunflower seeds loaded with vitamin E and minerals",
        image: sunflowerSeedsImg,
        price: 500,
        weights: "1 kg",
        category: "seeds",
        weightOptions: [
            { key: "250g", label: "250 gram", multiplier: 0.28, price: 140, available: true, stock: 50 },
            { key: "500g", label: "500 gram", multiplier: 0.52, price: 260, available: true, stock: 50 },
            { key: "1kg", label: "1 kg", multiplier: 1.0, price: 500, available: true, stock: 50 }
        ]
    },
    {
        id: 7,
        numericId: 7,
        title: "Pumpkin Seeds",
        description: "Raw green pepitas (pumpkin seeds) high in zinc and protein",
        image: pumpkinSeedsImg,
        price: 800,
        weights: "1 kg",
        category: "seeds",
        weightOptions: [
            { key: "250g", label: "250 gram", multiplier: 0.28, price: 224, available: true, stock: 50 },
            { key: "500g", label: "500 gram", multiplier: 0.52, price: 416, available: true, stock: 50 },
            { key: "1kg", label: "1 kg", multiplier: 1.0, price: 800, available: true, stock: 50 }
        ]
    },
    {
        id: 8,
        numericId: 8,
        title: "Watermelon Seeds",
        description: "Shelled nutritious watermelon magaz seeds for wholesome snacking",
        image: watermelonSeedsImg,
        price: 700,
        weights: "1 kg",
        category: "seeds",
        weightOptions: [
            { key: "250g", label: "250 gram", multiplier: 0.28, price: 196, available: true, stock: 50 },
            { key: "500g", label: "500 gram", multiplier: 0.52, price: 364, available: true, stock: 50 },
            { key: "1kg", label: "1 kg", multiplier: 1.0, price: 700, available: true, stock: 50 }
        ]
    },
];

interface BackendProduct {
    numericId?: number;
    id?: number;
    title: string;
    description?: string;
    category?: 'nuts' | 'seeds';
    price: number;
    weights?: string;
    image?: string;
    weightOptions?: Array<{
        key: string;
        label: string;
        multiplier?: number;
        price: number;
        stock?: number;
        available?: boolean;
    }>;
    inStock?: boolean;
}

const ProductList: React.FC = () => {
    const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('featured');

    // Live sync products from backend API reflecting Admin Portal price and quantity edits
    const fetchLiveProducts = useCallback(async () => {
        const liveData: BackendProduct[] | null = await getProductsApi();
        if (liveData && Array.isArray(liveData) && liveData.length > 0) {
            const mapped: Product[] = liveData.map((p) => {
                const numId = Number(p.numericId || p.id || 1);
                let resolvedImage = almondImg;
                if (p.image && (p.image.startsWith('http') || p.image.startsWith('/uploads') || p.image.startsWith('data:'))) {
                    resolvedImage = p.image.startsWith('/uploads') ? `http://localhost:5001${p.image}` : p.image;
                } else if (LOCAL_IMAGES[numId]) {
                    resolvedImage = LOCAL_IMAGES[numId];
                } else if (p.image) {
                    resolvedImage = p.image;
                }

                return {
                    id: numId,
                    numericId: numId,
                    title: p.title,
                    description: p.description || `Premium ${p.title} sourced for supreme crunch and freshness.`,
                    category: p.category || 'nuts',
                    price: Number(p.price),
                    weights: p.weights || '1 kg',
                    image: resolvedImage,
                    weightOptions: p.weightOptions || [],
                    inStock: p.inStock !== false
                };
            });
            setProducts(mapped);
        }
    }, []);

    useEffect(() => {
        fetchLiveProducts();

        // Auto-poll every 2.5 seconds so admin edits appear in real-time
        const intervalId = setInterval(fetchLiveProducts, 2500);

        // Immediate refresh when user switches window tabs from Admin to User store
        const handleFocus = () => {
            fetchLiveProducts();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchLiveProducts]);

    // Dynamic Counts for Category tabs
    const counts = useMemo(() => {
        return {
            all: products.length,
            nuts: products.filter(p => p.category === 'nuts').length,
            seeds: products.filter(p => p.category === 'seeds').length
        };
    }, [products]);

    // Filter and Sort Products
    const filteredProducts = useMemo(() => {
        let result = products;

        // Category filter
        if (selectedCategory !== 'all') {
            result = result.filter(p => p.category === selectedCategory);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter(
                p =>
                    p.title.toLowerCase().includes(query) ||
                    p.description.toLowerCase().includes(query)
            );
        }

        // Sorting
        const sorted = [...result];
        switch (sortBy) {
            case 'price-asc':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'featured':
            default:
                sorted.sort((a, b) => a.id - b.id);
                break;
        }

        return sorted;
    }, [products, searchQuery, selectedCategory, sortBy]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSortBy('featured');
    };

    return (
        <section className="product-section" id="products">
            <div className="container">
                {/* Section Header */}
                <div className="section-header">
                    <span className="section-subtitle">NATURAL & CRISP DRY FRUITS</span>
                    <h2 className="section-title">Our Premium Selection</h2>
                    <div className="section-divider"></div>
                </div>

                {/* Filter and Controls Toolbar */}
                <div className="catalog-toolbar">
                    {/* Category Tabs */}
                    <div className="category-pill-tabs" role="tablist" aria-label="Filter products by category">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={selectedCategory === 'all'}
                            className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            All Products
                            <span className="cat-count">({counts.all})</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={selectedCategory === 'nuts'}
                            className={`category-pill ${selectedCategory === 'nuts' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('nuts')}
                        >
                            Dry Fruits & Nuts
                            <span className="cat-count">({counts.nuts})</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={selectedCategory === 'seeds'}
                            className={`category-pill ${selectedCategory === 'seeds' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('seeds')}
                        >
                            Nutritious Seeds
                            <span className="cat-count">({counts.seeds})</span>
                        </button>
                    </div>

                    {/* Search & Sort Controls Row */}
                    <div className="search-sort-group">
                        {/* Search Input Box */}
                        <div className="catalog-search-wrapper">
                            <Search size={18} className="catalog-search-icon" aria-hidden="true" />
                            <input
                                id="catalog-search-input"
                                type="text"
                                className="catalog-search-input"
                                placeholder="Search almond, cashew, seeds..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search dry fruits and nuts"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="clear-search-btn"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search input"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="catalog-sort-wrapper">
                            <SlidersHorizontal size={16} className="sort-icon" aria-hidden="true" />
                            <label htmlFor="catalog-sort-select" className="sort-label">
                                Sort:
                            </label>
                            <select
                                id="catalog-sort-select"
                                className="catalog-sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                aria-label="Sort products by"
                            >
                                <option value="featured">Featured First</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="name-asc">Name: A to Z</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Active Filters Summary Bar */}
                {(selectedCategory !== 'all' || searchQuery.trim()) && (
                    <div className="active-filters-bar">
                        <span className="results-count-text">
                            Showing <strong>{filteredProducts.length}</strong> product{filteredProducts.length !== 1 ? 's' : ''}
                            {selectedCategory !== 'all' ? ` in ${selectedCategory === 'nuts' ? 'Dry Fruits & Nuts' : 'Nutritious Seeds'}` : ''}
                            {searchQuery ? ` matching "${searchQuery}"` : ''}
                        </span>
                        <button type="button" className="reset-filters-link" onClick={handleClearFilters}>
                            Reset Filters
                        </button>
                    </div>
                )}

                {/* Product Grid */}
                {filteredProducts.length > 0 ? (
                    <div className="product-grid">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                ) : (
                    <div className="catalog-empty-view">
                        <div className="empty-catalog-circle">
                            <PackageOpen size={48} />
                        </div>
                        <h3>No products found</h3>
                        <p>
                            We couldn't find any products matching{' '}
                            {searchQuery ? <strong>"{searchQuery}"</strong> : 'your selection'}.
                        </p>
                        <button
                            type="button"
                            className="clear-filters-btn"
                            onClick={handleClearFilters}
                        >
                            Reset All Filters
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProductList;
