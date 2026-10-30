import React from 'react';
import { Award, Leaf, HeartHandshake, Sparkles } from 'lucide-react';
import './About.css';

const About: React.FC = () => {
    return (
        <section id="about" className="about-section">
            <div className="container">
                <div className="about-grid">
                    <div className="about-content">
                        <span className="about-subtitle">OUR STORY & HERITAGE</span>
                        <h2 className="about-title">Pure Quality, Directly From Nature to Your Table</h2>
                        <p className="about-description">
                            At <strong>VP Nuts</strong>, we believe snacking should be wholesome, energizing, and pure. Based in Kumbakonam, Tamil Nadu, we bring together carefully selected premium dry fruits and nuts sourced from the finest groves and estates.
                        </p>
                        <p className="about-description">
                            Every batch of our almonds, cashews, walnuts, and pistachios undergoes meticulous sorting and hygienic vacuum packing to seal in natural crunch, essential oils, and nutritional goodness.
                        </p>

                        <div className="about-highlights">
                            <div className="highlight-item">
                                <div className="highlight-icon-wrapper">
                                    <Leaf size={22} />
                                </div>
                                <div>
                                    <h4>100% Natural</h4>
                                    <p>Zero additives or artificial preservatives</p>
                                </div>
                            </div>

                            <div className="highlight-item">
                                <div className="highlight-icon-wrapper">
                                    <Award size={22} />
                                </div>
                                <div>
                                    <h4>Grade-A Quality</h4>
                                    <p>Hand-sorted premium jumbo size nuts</p>
                                </div>
                            </div>

                            <div className="highlight-item">
                                <div className="highlight-icon-wrapper">
                                    <HeartHandshake size={22} />
                                </div>
                                <div>
                                    <h4>Tamil Nadu Shipping</h4>
                                    <p>Express doorstep delivery across the state</p>
                                </div>
                            </div>

                            <div className="highlight-item">
                                <div className="highlight-icon-wrapper">
                                    <Sparkles size={22} />
                                </div>
                                <div>
                                    <h4>Aroma & Freshness</h4>
                                    <p>Packaged fresh to preserve richness</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="about-visual">
                        <div className="about-badge-card">
                            <span className="badge-years">100%</span>
                            <span className="badge-text">Authentic & Pure</span>
                        </div>
                        <div className="about-card-box">
                            <h3 className="about-card-title">Why VP Nuts?</h3>
                            <ul className="about-card-list">
                                <li>✓ Daily essential nutrient source</li>
                                <li>✓ Carefully hygienically packed</li>
                                <li>✓ Swift and reliable delivery in Tamil Nadu</li>
                                <li>✓ Friendly customer support</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;

