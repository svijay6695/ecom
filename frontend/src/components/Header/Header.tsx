import React, { useState, useRef, useEffect } from 'react';
import { Search, User, ShoppingBag, Menu, X, LogOut, ChevronDown, CheckCircle, Package, MapPin } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import './Header.css';

const Header: React.FC = () => {
    const { totalItems, setIsCartOpen } = useCart();
    const { user, isAuthenticated, openAuthModal, logout, openProfileModal } = useAuth();
    const { orders, openOrdersModal } = useOrders();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close user dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
        e.preventDefault();
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleUserIconClick = () => {
        if (isAuthenticated) {
            setUserDropdownOpen(!userDropdownOpen);
        } else {
            openAuthModal('signin');
        }
    };

    const handleSearchIconClick = () => {
        const productsEl = document.getElementById('products');
        if (productsEl) {
            productsEl.scrollIntoView({ behavior: 'smooth' });
        }
        setTimeout(() => {
            const searchInput = document.getElementById('catalog-search-input');
            if (searchInput) searchInput.focus();
        }, 400);
    };

    return (
        <header className="header">
            <div className="container">
                <div className="logo" onClick={(e) => scrollToSection(e, 'home')} style={{ cursor: 'pointer' }}>
                    <div className="logo-svg-wrapper">
                        <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100" height="100" rx="20" fill="var(--primary-color)" />
                            <path d="M30 30 L40 70 L50 30" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M55 30 L55 70 M55 30 H75 C85 30 85 50 75 50 H55" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="logo-text-group">
                            <span className="logo-tagline">NUTS</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="nav-desktop">
                    <a href="#home" onClick={(e) => scrollToSection(e, 'home')}>Home</a>
                    <a href="#about" onClick={(e) => scrollToSection(e, 'about')}>About</a>
                    <a href="#products" onClick={(e) => scrollToSection(e, 'products')}>Products</a>
                    <a
                        href="#track-orders"
                        onClick={(e) => {
                            e.preventDefault();
                            if (!isAuthenticated) {
                                openAuthModal('signin');
                            } else {
                                openOrdersModal();
                            }
                        }}
                    >
                        Track Orders {isAuthenticated && orders.length > 0 ? `(${orders.length})` : ''}
                    </a>
                    <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a>
                </nav>

                <div className="header-actions">
                    <div className="icon-group">
                        <span
                            className="icon-wrapper"
                            onClick={handleSearchIconClick}
                            title="Search dry fruits & nuts"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleSearchIconClick();
                                }
                            }}
                        >
                            <Search size={20} />
                        </span>

                        {/* Account Menu */}
                        <div className="user-menu-container" ref={userMenuRef}>
                            {isAuthenticated ? (
                                <button
                                    type="button"
                                    className="user-pill-btn"
                                    onClick={handleUserIconClick}
                                    title={`Account: ${user?.name}`}
                                >
                                    <span className="user-avatar-initial">
                                        {user?.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="user-pill-name">{user?.name.split(' ')[0]}</span>
                                    <ChevronDown size={14} className="user-chevron" />
                                </button>
                            ) : (
                                <div className="header-auth-group">
                                    <button
                                        type="button"
                                        className="header-signin-btn"
                                        onClick={() => openAuthModal('signin')}
                                        title="Sign In to your account"
                                    >
                                        <User size={15} />
                                        <span className="auth-btn-text">Sign In</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="header-signup-btn"
                                        onClick={() => openAuthModal('signup')}
                                        title="Create a new account"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            )}

                            {/* Dropdown Menu for Authenticated User */}
                            {userDropdownOpen && isAuthenticated && (
                                <div className="user-dropdown-card">
                                    <div className="user-dropdown-header">
                                        <div className="dropdown-user-name">{user?.name}</div>
                                        <div className="dropdown-user-email">{user?.email}</div>
                                        <div className="dropdown-badge">
                                            <CheckCircle size={12} /> Tamil Nadu Member
                                        </div>
                                    </div>
                                    <div className="user-dropdown-divider"></div>

                                    <button
                                        type="button"
                                        className="dropdown-item"
                                        onClick={() => {
                                            openProfileModal();
                                            setUserDropdownOpen(false);
                                        }}
                                    >
                                        <MapPin size={16} /> Saved Addresses & Profile
                                    </button>

                                    <button
                                        type="button"
                                        className="dropdown-item"
                                        onClick={() => {
                                            openOrdersModal();
                                            setUserDropdownOpen(false);
                                        }}
                                    >
                                        <Package size={16} /> My Orders{orders.length > 0 ? ` (${orders.length})` : ''}
                                    </button>

                                    <button
                                        type="button"
                                        className="dropdown-item logout"
                                        onClick={() => {
                                            logout();
                                            setUserDropdownOpen(false);
                                        }}
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cart Trigger */}
                        <span
                            className="icon-wrapper cart-icon"
                            onClick={() => setIsCartOpen(true)}
                            title="Open shopping cart"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    setIsCartOpen(true);
                                }
                            }}
                        >
                            <ShoppingBag size={20} />
                            {totalItems > 0 && <span className="badge">{totalItems}</span>}
                        </span>
                    </div>

                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {mobileMenuOpen && (
                <div className="mobile-nav-menu">
                    <a href="#home" onClick={(e) => scrollToSection(e, 'home')}>Home</a>
                    <a href="#about" onClick={(e) => scrollToSection(e, 'about')}>About</a>
                    <a href="#products" onClick={(e) => scrollToSection(e, 'products')}>Products</a>
                    <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a>

                    <button
                        type="button"
                        className="mobile-orders-menu-btn"
                        onClick={() => {
                            if (!isAuthenticated) {
                                openAuthModal('signin');
                            } else {
                                openOrdersModal();
                            }
                            setMobileMenuOpen(false);
                        }}
                    >
                        <Package size={16} /> Track Orders {isAuthenticated && orders.length > 0 ? `(${orders.length})` : ''}
                    </button>

                    {isAuthenticated && (
                        <button
                            type="button"
                            className="mobile-orders-menu-btn"
                            style={{ marginTop: '6px' }}
                            onClick={() => {
                                openProfileModal();
                                setMobileMenuOpen(false);
                            }}
                        >
                            <MapPin size={16} /> Saved Addresses & Profile
                        </button>
                    )}

                    <div className="mobile-auth-row">
                        {isAuthenticated ? (
                            <div className="mobile-logged-user">
                                <span>Hello, <strong>{user?.name}</strong></span>
                                <button
                                    type="button"
                                    className="mobile-logout-btn"
                                    onClick={() => {
                                        logout();
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div className="mobile-auth-actions">
                                <button
                                    type="button"
                                    className="mobile-signin-btn"
                                    onClick={() => {
                                        openAuthModal('signin');
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    className="mobile-signup-btn"
                                    onClick={() => {
                                        openAuthModal('signup');
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;

