'use client';

import Header from '../components/Header/Header';
import Banner from '../components/Banner/Banner';
import ProductList from '../components/Products/ProductList';
import About from '../components/About/About';
import Footer from '../components/Footer/Footer';
import CartDrawer from '../components/Cart/CartDrawer';
import AuthModal from '../components/Auth/AuthModal';
import OrdersModal from '../components/Orders/OrdersModal';
import ProfileModal from '../components/Profile/ProfileModal';
import { Providers } from './providers';

export default function HomePage() {
  return (
    <Providers>
      <Header />
      <main>
        <Banner />
        <ProductList />
        <About />
      </main>
      <Footer />
      <CartDrawer />
      <AuthModal />
      <OrdersModal />
      <ProfileModal />
    </Providers>
  );
}

