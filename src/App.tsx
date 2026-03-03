import { useState, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { ThankYou } from './pages/ThankYou';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { UserProfile } from './pages/UserProfile';
import { WishlistPage } from './pages/Wishlist';
import { SearchResults } from './pages/SearchResults';
import { FAQs, PrivacyPolicy, TermsOfService, Disclaimer } from './pages/Legal';
import { SearchOverlay } from './components/common/SearchOverlay';
import { CartOverlay } from './components/common/CartOverlay';
import { Popup } from './components/common/Popup';
import { useCart } from './hooks/useCart';
import { useWishlist } from './hooks/useWishlist';
import { useAuth } from './hooks/useAuth';
import { Product, User } from './types';
import { PRODUCTS as MOCK_PRODUCTS } from './data/products';
import { clearSession, getSession, setSession } from './services/authStorage';
import { fetchCustomerProfile } from './services/customer';
import { ApiError } from './services/http';

function getPathForPage(page: string, selectedProduct?: Product | null): string {
  switch (page) {
    case 'home':
      return '/';
    case 'catalog':
      return '/catalog';
    case 'product-detail':
      return selectedProduct ? `/product/${selectedProduct.id}` : '/catalog';
    case 'checkout':
      return '/checkout';
    case 'thank-you':
      return '/thank-you';
    case 'about':
      return '/about';
    case 'contact':
      return '/contact';
    case 'account':
      return '/account';
    case 'search-results':
      return '/search-results';
    case 'faqs':
      return '/faqs';
    case 'privacy':
      return '/privacy';
    case 'terms':
      return '/terms';
    case 'disclaimer':
      return '/disclaimer';
    default:
      return '/';
  }
}

function getActivePageFromPath(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/catalog')) return 'catalog';
  if (pathname.startsWith('/product/')) return 'product-detail';
  if (pathname.startsWith('/checkout')) return 'checkout';
  if (pathname.startsWith('/thank-you')) return 'thank-you';
  if (pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/contact')) return 'contact';
  if (pathname.startsWith('/account')) return 'account';
  if (pathname.startsWith('/reset-password')) return 'account';
  if (pathname.startsWith('/search-results')) return 'search-results';
  if (pathname.startsWith('/faqs')) return 'faqs';
  if (pathname.startsWith('/privacy')) return 'privacy';
  if (pathname.startsWith('/terms')) return 'terms';
  if (pathname.startsWith('/disclaimer')) return 'disclaimer';
  return 'home';
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [authToken, setAuthToken] = useState('');

  const { cart, isCartOpen, setIsCartOpen, addToCart, updateQuantity, removeFromCart, clearCart, cartCount } = useCart();
  const { user, setUser, orders, addOrder } = useAuth();
  const { wishlist, isWishlisted, removeFromWishlist, toggleWishlist } = useWishlist(products, authToken);

  useEffect(() => {
    setActivePage(getActivePageFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;
    const hydrateSession = async () => {
      const session = getSession();
      if (!session) {
        setAuthToken('');
        setUser(null);
        return;
      }

      const cachedUser = {
        ...session.user,
        token: session.token,
      };
      setAuthToken(session.token);
      setUser(cachedUser);

      try {
        const freshProfile = await fetchCustomerProfile();
        if (!mounted) return;
        const nextUser = { ...cachedUser, ...freshProfile, token: session.token };
        setUser(nextUser);
        setSession({ token: session.token, user: nextUser });
      } catch (error) {
        if (!mounted) return;
        if (error instanceof ApiError && error.status === 401) {
          setAuthToken('');
          setUser(null);
          clearSession();
        }
      }
    };

    hydrateSession();
    return () => {
      mounted = false;
    };
  }, [setUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAuthExpired = () => {
      setAuthToken('');
      setUser(null);
      clearSession();
      navigate('/account');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [navigate, setUser]);

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
        console.error('Failed to fetch products:', error);
        setProducts(MOCK_PRODUCTS);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSetActivePage = (page: string) => {
    setActivePage(page);
    const targetPath = getPathForPage(page, selectedProduct);
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActivePage('product-detail');
    navigate(`/product/${product.id}`);
  };

  const handleSetAuthUser = (nextUser: User | null) => {
    setUser(nextUser);

    if (!nextUser) {
      setAuthToken('');
      clearSession();
      return;
    }

    const token = String(nextUser.token || authToken || '');
    const userWithToken = { ...nextUser, token };
    setAuthToken(token);
    setSession({ token, user: userWithToken });

    if (token) {
      void fetchCustomerProfile()
        .then((freshProfile) => {
          const merged = { ...userWithToken, ...freshProfile, token };
          setUser(merged);
          setSession({ token, user: merged });
        })
        .catch((error) => {
          if (error instanceof ApiError && error.status === 401) {
            setAuthToken('');
            setUser(null);
            clearSession();
          }
        });
    }
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

  const renderRoutes = () => {
    if (isLoadingProducts) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <Routes>
        <Route
          path="/"
          element={
            <Home
              setActivePage={handleSetActivePage}
              onSelectProduct={handleSelectProduct}
              onToggleWishlist={(product) => {
                toggleWishlist(product).catch(() => undefined);
              }}
              isWishlisted={isWishlisted}
              products={products}
            />
          }
        />
        <Route
          path="/catalog"
          element={
            <Catalog
              onSelectProduct={handleSelectProduct}
              onToggleWishlist={(product) => {
                toggleWishlist(product).catch(() => undefined);
              }}
              isWishlisted={isWishlisted}
            />
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProductDetail
              product={selectedProduct || undefined}
              onBack={() => handleSetActivePage('catalog')}
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              isWishlisted={isWishlisted}
            />
          }
        />
        <Route
          path="/checkout"
          element={
            <Checkout
              cart={cart}
              user={user}
              onComplete={(order) => {
                addOrder(order);
                clearCart();
              }}
            />
          }
        />
        <Route path="/thank-you" element={<ThankYou setActivePage={handleSetActivePage} />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/account"
          element={
            user ? (
              <UserProfile
                user={user}
                setUser={handleSetAuthUser}
                orders={orders}
                wishlist={wishlist}
                removeFromWishlist={(productId) => {
                  removeFromWishlist(productId).catch(() => undefined);
                }}
                setActivePage={handleSetActivePage}
              />
            ) : (
              <Register
                onLogin={(u: User) => {
                  handleSetAuthUser(u);
                  handleSetActivePage('account');
                }}
              />
            )
          }
        />
        <Route
          path="/account/wishlist"
          element={
            user ? (
              <WishlistPage
                wishlist={wishlist}
                onSelectProduct={handleSelectProduct}
                onToggleWishlist={(product) => {
                  toggleWishlist(product).catch(() => undefined);
                }}
                isWishlisted={isWishlisted}
              />
            ) : (
              <Register
                onLogin={(u: User) => {
                  handleSetAuthUser(u);
                  navigate('/account/wishlist');
                }}
              />
            )
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/search-results"
          element={
            <SearchResults
              results={searchResults}
              onSelectProduct={handleSelectProduct}
              onToggleWishlist={(product) => {
                toggleWishlist(product).catch(() => undefined);
              }}
              isWishlisted={isWishlisted}
            />
          }
        />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  return (
    <Layout
      activePage={activePage}
      setActivePage={handleSetActivePage}
      onSearchOpen={() => setIsSearchOpen(true)}
      onAccountOpen={() => handleSetActivePage('account')}
      onCartOpen={() => setIsCartOpen(true)}
      cartCount={cartCount}
    >
      {renderRoutes()}

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        setActivePage={handleSetActivePage}
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
          handleSetActivePage('checkout');
        }}
      />

      <Popup isVisible={isPopupVisible} onClose={() => setIsPopupVisible(false)} />
    </Layout>
  );
}
