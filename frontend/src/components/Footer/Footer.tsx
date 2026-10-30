import React from 'react';
import {
    ShieldCheck,
    Truck,
    RotateCcw,
    Headphones,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    MapPin,
    Mail,
    Phone,
    ArrowUp,
    CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import './Footer.css';

const Footer: React.FC = () => {
    const { isAuthenticated, user, openAuthModal } = useAuth();
    const { orders, openOrdersModal } = useOrders();
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="footer-section">
            {/* Features Bar */}
            <div className="features-bar container">
                <div className="feature-card">
                    <ShieldCheck size={32} strokeWidth={1.5} className="feature-icon" />
                    <div className="feature-text">
                        <h3>PREMIUM QUALITY</h3>
                        <p>100% Quality Guarantee</p>
                    </div>
                </div>
                <div className="feature-card">
                    <Truck size={32} strokeWidth={1.5} className="feature-icon" />
                    <div className="feature-text">
                        <h3>SWIFT SHIPPING</h3>
                        <p>Delivering across Tamil Nadu</p>
                    </div>
                </div>
                <div className="feature-card">
                    <RotateCcw size={32} strokeWidth={1.5} className="feature-icon" />
                    <div className="feature-text">
                        <h3>EASY RETURN</h3>
                        <p>Refer return policy</p>
                    </div>
                </div>
                <div className="feature-card">
                    <Headphones size={32} strokeWidth={1.5} className="feature-icon" />
                    <div className="feature-text">
                        <h3>24/7 SUPPORT</h3>
                        <p>Support every time</p>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="footer-main">
                <div className="container footer-grid">
                    {/* Column 1: Branding */}
                    <div className="footer-col brand-col">
                        <div
                            className="logo-svg-wrapper footer-logo"
                            onClick={(e) => scrollToSection(e, 'home')}
                            style={{ cursor: 'pointer' }}
                        >
                            <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="100" height="100" rx="20" fill="var(--primary-color)" />
                                <path d="M30 30 L40 70 L50 30" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M55 30 L55 70 M55 30 H75 C85 30 85 50 75 50 H55" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="logo-text-group">
                                <span className="logo-tagline">NUTS</span>
                            </div>
                        </div>
                        <p className="brand-desc">
                            VP Nuts brings you a collection of carefully selected premium dry fruits and nuts from Tamil Nadu and across the world.
                        </p>

                        <div className="social-icons">
                            <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="footer-col">
                        <h3 className="col-title">Quick Links</h3>
                        <ul>
                            <li><a href="#about" onClick={(e) => scrollToSection(e, 'about')}>About Us</a></li>
                            <li><a href="#contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact Us</a></li>
                            <li><a href="#products" onClick={(e) => scrollToSection(e, 'products')}>Bulk Ordering</a></li>
                            <li><a href="#products" onClick={(e) => scrollToSection(e, 'products')}>Shopping</a></li>
                        </ul>
                    </div>

                    {/* Column 3: Account Info */}
                    <div className="footer-col">
                        <h3 className="col-title">Account Info</h3>
                        <ul>
                            <li>
                                <a
                                    href="#account"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!isAuthenticated) {
                                            openAuthModal('signin');
                                        } else {
                                            alert(`Logged in as: ${user?.name} (${user?.email})\nLocation: Tamil Nadu`);
                                        }
                                    }}
                                >
                                    My Account {isAuthenticated && `(${user?.name.split(' ')[0]})`}
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#orders"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!isAuthenticated) {
                                            openAuthModal('signin');
                                        } else {
                                            openOrdersModal();
                                        }
                                    }}
                                >
                                    Track Orders & History {isAuthenticated && orders.length > 0 ? `(${orders.length})` : ''}
                                </a>
                            </li>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Return Policy</a></li>
                            <li><a href="#">Terms & Conditions</a></li>
                        </ul>
                    </div>

                    {/* Column 4: Contact Details */}
                    <div id="contact" className="footer-col contact-col">
                        <h3 className="col-title">Contact Details</h3>
                        <div className="contact-item">
                            <MapPin size={24} className="contact-icon" />
                            <p>NR TOWERS, 17th Cross, Sector 4, Kumbakonam - 612702</p>
                        </div>
                        <div className="contact-item">
                            <Mail size={20} className="contact-icon" />
                            <p>info@vpnuts.com</p>
                        </div>
                        <div className="contact-item">
                            <Phone size={20} className="contact-icon" />
                            <p>+91-8200737159</p>
                        </div>
                        <div className="contact-item">
                            <Phone size={20} className="contact-icon" />
                            <p>+91-8940473703</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom">
                <div className="container bottom-content">
                    <p>Copyright © 2026 <strong>VP Nuts</strong>. All Rights Reserved.</p>
                    <div className="payment-icons">
                        <CreditCard size={24} /> <span>VISA</span>
                        <CreditCard size={24} /> <span>MasterCard</span>
                        <CreditCard size={24} /> <span>Stripe</span>
                    </div>
                </div>
            </div>

            {/* Scroll To Top */}
            <button className="scroll-top-btn" onClick={scrollToTop} aria-label="Scroll to top">
                <ArrowUp size={34} strokeWidth={3.8} />
            </button>
        </footer>
    );
};

export default Footer;
