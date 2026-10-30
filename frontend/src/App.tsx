import Header from './components/Header/Header';
import Banner from './components/Banner/Banner';
import ProductList from './components/Products/ProductList';
import About from './components/About/About';
import Footer from './components/Footer/Footer';
import CartDrawer from './components/Cart/CartDrawer';
import AuthModal from './components/Auth/AuthModal';
import OrdersModal from './components/Orders/OrdersModal';
import ProfileModal from './components/Profile/ProfileModal';
import { CartProvider } from './context/CartProvider';
import { AuthProvider } from './context/AuthProvider';
import { OrderProvider } from './context/OrderProvider';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <CartProvider>
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
        </CartProvider>
      </OrderProvider>
    </AuthProvider>
  );
}

export default App;

