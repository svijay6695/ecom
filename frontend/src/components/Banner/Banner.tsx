'use client';

import React from 'react';
import './Banner.css';
import banner from '../../assets/banner.png';

const Banner: React.FC = () => {
    const bannerSrc = typeof banner === 'string' ? banner : (banner as any)?.src || '/assets/banner.png';
    return (
        <section id="home" className="banner-section">
            <div className="banner-content">
                <div className="banner-text-center">
                    <img src={bannerSrc} alt="VP Nuts Banner" />
                </div>
            </div>
        </section>
    );
};

export default Banner;
