import { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { ThankYou } from './pages/ThankYou';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Register } from './pages/Register';
import { UserProfile } from './pages/UserProfile';
import { SearchResults } from './pages/SearchResults';
import { FAQs, PrivacyPolicy, TermsOfService, Disclaimer } from './pages/Legal';
import { SearchOverlay } from './components/common/SearchOverlay';
import { CartOverlay } from './components/common/CartOverlay';
import { Popup } from './components/common/Popup';
import { useCart } from './hooks/useCart';
import { useWishlist } from './hooks/useWishlist';
import { useAuth } from './hooks/useAuth';
import { Product } from './types';
import { PRODUCTS as MOCK_PRODUCTS } from './data/products';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const { cart, isCartOpen, setIsCartOpen, addToCart, updateQuantity, removeFromCart, clearCart, cartCount } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user, setUser, orders, addOrder } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
          } else {
            setProducts(MOCK_PRODUCTS);
          }
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts(MOCK_PRODUCTS);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActivePage('product-detail');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasSeenPopup) {
        setIsPopupVisible(true);
        setHasSeenPopup(true);
      }
    }, 20000);

    return () => clearTimeout(timer);
  }, [hasSeenPopup]);

  const renderPage = () => {
    if (isLoadingProducts) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }

    switch (activePage) {
      case 'home': 
        return <Home setActivePage={setActivePage} onSelectProduct={handleSelectProduct} products={products} />;
      case 'catalog': 
        return <Catalog onSelectProduct={handleSelectProduct} products={products} />;
      case 'product-detail': 
        return selectedProduct ? (
          <ProductDetail 
            product={selectedProduct} 
            onBack={() => setActivePage('catalog')} 
            onAddToCart={addToCart} 
            onAddToWishlist={addToWishlist} 
          />
        ) : <Home setActivePage={setActivePage} onSelectProduct={handleSelectProduct} products={products} />;
      case 'checkout': 
        return <Checkout 
          cart={cart} 
          user={user} 
          onComplete={(order) => {
            addOrder(order);
            clearCart();
            setActivePage('thank-you');
          }} 
        />;
      case 'thank-you': 
        return <ThankYou setActivePage={setActivePage} />;
      case 'about': 
        return <About />;
      case 'contact': 
        return <Contact />;
      case 'account': 
        return user 
          ? <UserProfile 
              user={user} 
              setUser={setUser} 
              orders={orders} 
              wishlist={wishlist} 
              removeFromWishlist={removeFromWishlist}
              setActivePage={setActivePage}
            /> 
          : <Register onLogin={(u: any) => {
              setUser(u);
              setActivePage('account');
            }} />;
      case 'search-results': 
        return <SearchResults results={searchResults} onSelectProduct={handleSelectProduct} />;
      case 'faqs': 
        return <FAQs />;
      case 'privacy': 
        return <PrivacyPolicy />;
      case 'terms': 
        return <TermsOfService />;
      case 'disclaimer': 
        return <Disclaimer />;
      default: 
        return <Home setActivePage={setActivePage} onSelectProduct={handleSelectProduct} products={products} />;
    }
  };

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      onSearchOpen={() => setIsSearchOpen(true)}
      onAccountOpen={() => setActivePage('account')}
      onCartOpen={() => setIsCartOpen(true)}
      cartCount={cartCount}
    >
      {renderPage()}

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        setActivePage={setActivePage}
        setSearchResults={setSearchResults}
        products={products}
      />

      <CartOverlay
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setActivePage('checkout');
        }}
      />

      <Popup
        isVisible={isPopupVisible}
        onClose={() => setIsPopupVisible(false)}
      />
    </Layout>
  );
}
