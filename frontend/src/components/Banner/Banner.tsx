import React from 'react';
import './Banner.css';
import banner from '../../assets/banner.png';

const Banner: React.FC = () => {
    return (
        <section id="home" className="banner-section">
            <div className="banner-content">
                <div className="banner-text-center">
                    <img src={banner} alt="VP Nuts Banner" />
                </div>
            </div>
        </section>
    );
};

export default Banner;
