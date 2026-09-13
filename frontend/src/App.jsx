import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import PromoBanner from './components/PromoBanner';
import CategoryBar from './components/CategoryBar';
import FilterSidebar from './components/FilterSidebar';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import OrderSuccessPage from './components/OrderSuccessPage';
import OrderListPage from './components/OrderListPage';
import OrderDetailPage from './components/OrderDetailPage';
import FinancialTransactionsPage from './components/FinancialTransactionsPage';
import StockManagementPage from './components/StockManagementPage';
import TemplateManagementPage from './components/TemplateManagementPage';
import ExpeditionSettingsPage from './components/ExpeditionSettingsPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/ProfilePage';
import ProductListPage from './components/ProductListPage';
import ProductCreateForm from './components/ProductCreateForm';
import ProductEditForm from './components/ProductEditForm';
import CategoryListPage from './components/CategoryListPage';
import HeroCampaignBanner from './components/HeroCampaignBanner';
import PopularChipsBar from './components/PopularChipsBar';
import SportCategoriesSection from './components/SportCategoriesSection';
import TuskoClubBanner from './components/TuskoClubBanner';
import Footer from './components/Footer';
import AdminSidebar from './components/AdminSidebar';
import AdminDashboardPage from './components/AdminDashboardPage';
import PurchaseOrderListPage from './components/PurchaseOrderListPage';
import GoodsReceiptListPage from './components/GoodsReceiptListPage';
import VendorBillListPage from './components/VendorBillListPage';
import SupplierListPage from './components/SupplierListPage';
import { mockOrders } from './data/mockOrders';
import { mockTransactions } from './data/mockTransactions';
import { initialInventory, initialStockLogs } from './data/mockStockData';
import { initialExpeditions } from './data/mockExpeditionSettings';
import { mockDemoUsers } from './data/mockAuthData';
import { authService } from './services/authService';
import { cartService } from './services/cartService';
import { categoryService } from './services/categoryService';
import { CheckCircle2, AlertCircle, X, Filter } from 'lucide-react';

const VALID_VIEWS = [
  'admin-dashboard',
  'catalog',
  'detail',
  'cart',
  'checkout',
  'order-success',
  'orders',
  'order-detail',
  'procurement',
  'procurement-pos',
  'procurement-grn',
  'procurement-bills',
  'suppliers-admin',
  'transactions',
  'stock',
  'templates',
  'expeditions',
  'products-admin',
  'categories-admin',
  'product-create',
  'product-edit',
  'login',
  'register',
  'profile',
];

const getViewFromPathOrHash = () => {
  try {
    const rawPath = window.location.pathname.replace(/\/+$/, '');
    if (rawPath === '/admin/dashboard' || rawPath === '/admin') {
      return 'admin-dashboard';
    }
    if (rawPath === '/admin/products') return 'products-admin';
    if (rawPath === '/admin/categories') return 'categories-admin';
    if (rawPath === '/admin/suppliers') return 'suppliers-admin';
    if (rawPath === '/admin/stock') return 'stock';
    if (rawPath === '/admin/orders') return 'orders';
    if (rawPath === '/admin/procurement') return 'procurement-pos';
    if (rawPath === '/admin/procurement/pos') return 'procurement-pos';
    if (rawPath === '/admin/procurement/grn') return 'procurement-grn';
    if (rawPath === '/admin/procurement/bills') return 'procurement-bills';
    if (rawPath === '/admin/procurement/vendors') return 'suppliers-admin';
    if (rawPath === '/admin/transactions') return 'transactions';
    if (rawPath === '/admin/expeditions') return 'expeditions';
    if (rawPath === '/admin/templates') return 'templates';
    if (rawPath === '/admin/products/create') return 'product-create';
    if (rawPath === '/login') return 'login';
    if (rawPath === '/register') return 'register';
    if (rawPath === '/profile') return 'profile';
    if (rawPath === '/cart') return 'cart';
    if (rawPath === '/checkout') return 'checkout';

    const rawHash = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim();
    if (rawHash === 'admin/dashboard' || rawHash === 'admin') {
      return 'admin-dashboard';
    }
    if (rawHash && VALID_VIEWS.includes(rawHash)) {
      return rawHash;
    }
  } catch {
    // ignore
  }
  return null;
};

const getInitialView = () => {
  const fromPathOrHash = getViewFromPathOrHash();
  const rawView = fromPathOrHash || (() => {
    try {
      return localStorage.getItem('tusko_current_view');
    } catch {
      return null;
    }
  })();

  if (rawView && VALID_VIEWS.includes(rawView)) {
    if (rawView === 'detail') {
      try {
        const savedProdId = localStorage.getItem('tusko_selected_product_id');
        if (!savedProdId) return 'catalog';
      } catch {
        return 'catalog';
      }
    }
    if (rawView === 'product-edit') {
      return 'products-admin';
    }
    if (rawView === 'order-success') {
      return 'orders';
    }
    return rawView;
  }

  return 'catalog';
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tusko_current_user') || localStorage.getItem('tusko_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleUpdateUser = (user) => {
    setCurrentUser(user);
    if (user) {
      try {
        localStorage.setItem('tusko_current_user', JSON.stringify(user));
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem('tusko_current_user');
      } catch {
        // ignore
      }
    }
  };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Fetch categories from server on mount
  useEffect(() => {
    categoryService.fetchCategories({ all: true })
      .then(res => {
        if (res && res.data) {
          setCategories(res.data);
        }
      })
      .catch(err => console.warn('categoryService initial load:', err));
  }, []);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentView, setCurrentView] = useState(getInitialView); // 'catalog' | 'detail' | 'cart' | 'checkout' | 'order-success' | 'orders' | 'order-detail' | 'transactions' | 'stock' | 'login' | 'profile'
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [appliedCheckoutVoucher, setAppliedCheckoutVoucher] = useState(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [orders, setOrders] = useState(mockOrders);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [inventory, setInventory] = useState(initialInventory);
  const [stockLogs, setStockLogs] = useState(initialStockLogs);
  const [expeditions, setExpeditions] = useState(initialExpeditions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [sortBy, setSortBy] = useState('relevant');
  
  // Advanced filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [onlyFreeShipping, setOnlyFreeShipping] = useState(false);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [pendingCartAction, setPendingCartAction] = useState(null);

  // Real cart state synced with backend database / guest session
  const [cart, setCart] = useState([]);
  
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, options = {}) => {
    if (!msg) {
      setToastMessage(null);
      return;
    }
    const toastData = typeof msg === 'string'
      ? { message: msg, showCart: !!options?.showCart, type: options?.type || 'success' }
      : { message: msg?.message || '', showCart: !!msg?.showCart, type: msg?.type || 'success' };
    setToastMessage(toastData);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSwitchUser = (demoUser) => {
    handleUpdateUser(demoUser);
    showToast(`Beralih ke akun demo: ${demoUser.name} (${demoUser.role === 'admin' ? '🛡️ Super Admin' : 'Member'})`);
    if (demoUser?.role === 'admin') {
      setCurrentView('admin-dashboard');
      window.history.pushState(null, '', '/admin/dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    handleUpdateUser(null);
    showToast('Anda telah keluar dari akun (Logout).');
    const adminViews = ['admin-dashboard', 'products-admin', 'categories-admin', 'product-create', 'product-edit', 'stock', 'templates', 'expeditions', 'transactions'];
    if (currentView === 'profile' || currentView === 'cart' || adminViews.includes(currentView)) {
      setCurrentView('catalog');
      window.history.pushState(null, '', '/');
    }
  };

  // Sync / validate user profile from live backend on mount
  useEffect(() => {
    authService.getProfile()
      .then((liveUser) => {
        if (liveUser) {
          handleUpdateUser(liveUser);
        }
      })
      .catch(() => {
        // backend offline or session expired
      });
  }, []);

  // Sync cart from backend database / session
  const refreshCartFromBackend = async () => {
    try {
      const cartData = await cartService.getCart();
      if (cartData && Array.isArray(cartData.items)) {
        const formattedItems = cartData.items.map((item) => ({
          id: item.id,
          cart_item_id: item.id,
          product_id: item.product_id,
          name: item.product?.name || 'Produk',
          price: Number(item.product?.price || 0),
          original_price: item.product?.original_price ? Number(item.product.original_price) : null,
          discount_percentage: item.product?.discount_percentage || 0,
          quantity: item.quantity,
          stock: item.product?.stock ?? 99,
          stock_minimum: item.product?.stock_minimum ?? 5,
          image_url: item.product?.image_url || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
          free_shipping: Boolean(item.product?.free_shipping),
          is_official: Boolean(item.product?.is_official ?? true),
          notes: item.notes || '',
        }));
        setCart(formattedItems);
      }
    } catch {
      // Backend offline or empty cart
    }
  };

  useEffect(() => {
    refreshCartFromBackend();
  }, [currentUser]);

  // Sinkronisasi selectedProduct ke localStorage
  useEffect(() => {
    try {
      if (selectedProduct?.id) {
        localStorage.setItem('tusko_selected_product_id', String(selectedProduct.id));
      } else {
        localStorage.removeItem('tusko_selected_product_id');
      }
    } catch {
      // ignore
    }
  }, [selectedProduct]);

  // Sinkronisasi status tampilan (currentView) ke URL path / hash & localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tusko_current_view', currentView);
    } catch {
      // ignore
    }

    if (currentView === 'admin-dashboard') {
      if (window.location.pathname !== '/admin/dashboard') {
        window.history.pushState(null, '', '/admin/dashboard');
      }
    } else if (currentView === 'products-admin') {
      if (window.location.pathname !== '/admin/products') {
        window.history.pushState(null, '', '/admin/products');
      }
    } else if (currentView === 'categories-admin') {
      if (window.location.pathname !== '/admin/categories') {
        window.history.pushState(null, '', '/admin/categories');
      }
    } else if (currentView === 'suppliers-admin') {
      if (window.location.pathname !== '/admin/suppliers') {
        window.history.pushState(null, '', '/admin/suppliers');
      }
    } else if (currentView === 'stock') {
      if (window.location.pathname !== '/admin/stock') {
        window.history.pushState(null, '', '/admin/stock');
      }
    } else if (currentView === 'procurement-pos' || currentView === 'procurement') {
      if (window.location.pathname !== '/admin/procurement/pos' && window.location.pathname !== '/admin/procurement') {
        window.history.pushState(null, '', '/admin/procurement/pos');
      }
    } else if (currentView === 'procurement-grn') {
      if (window.location.pathname !== '/admin/procurement/grn') {
        window.history.pushState(null, '', '/admin/procurement/grn');
      }
    } else if (currentView === 'procurement-bills') {
      if (window.location.pathname !== '/admin/procurement/bills') {
        window.history.pushState(null, '', '/admin/procurement/bills');
      }
    } else if (currentView === 'orders' && currentUser?.role === 'admin') {
      if (window.location.pathname !== '/admin/orders') {
        window.history.pushState(null, '', '/admin/orders');
      }
    } else if (currentView === 'transactions' && currentUser?.role === 'admin') {
      if (window.location.pathname !== '/admin/transactions') {
        window.history.pushState(null, '', '/admin/transactions');
      }
    } else if (currentView === 'expeditions') {
      if (window.location.pathname !== '/admin/expeditions') {
        window.history.pushState(null, '', '/admin/expeditions');
      }
    } else if (currentView === 'templates') {
      if (window.location.pathname !== '/admin/templates') {
        window.history.pushState(null, '', '/admin/templates');
      }
    } else if (currentView === 'product-create') {
      if (window.location.pathname !== '/admin/products/create') {
        window.history.pushState(null, '', '/admin/products/create');
      }
    } else if (currentView === 'catalog') {
      if (window.location.pathname !== '/' || window.location.hash) {
        window.history.pushState(null, '', '/' + window.location.search);
      }
    } else {
      const targetHash = `#/${currentView}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    }
  }, [currentView, currentUser]);

  // Listener navigasi riwayat browser (Back/Forward) via popstate dan hashchange
  useEffect(() => {
    const handleLocationChange = () => {
      const detectedView = getViewFromPathOrHash();
      if (detectedView && VALID_VIEWS.includes(detectedView)) {
        setCurrentView(detectedView);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProduct]);

  // Auth guard: Jika belum login dan mencoba membuka keranjang, alihkan ke login
  useEffect(() => {
    if (currentView === 'cart' && !currentUser) {
      setPendingCartAction(prev => prev || { type: 'open_cart', returnView: 'cart' });
      showToast('Silakan masuk ke akun (Login) terlebih dahulu untuk mengakses keranjang belanja.');
      setCurrentView('login');
    }
  }, [currentView, currentUser]);

  // Total quantity in cart
  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Cek apakah halaman saat ini adalah bagian dari Admin Panel
  const isAdminView = useMemo(() => {
    const adminCoreViews = [
      'admin-dashboard', 
      'products-admin', 
      'categories-admin', 
      'suppliers-admin',
      'product-create', 
      'product-edit', 
      'stock', 
      'procurement', 
      'procurement-pos',
      'procurement-grn',
      'procurement-bills',
      'templates', 
      'expeditions', 
      'transactions'
    ];
    if (adminCoreViews.includes(currentView)) return true;
    if (currentUser?.role === 'admin' && (currentView === 'orders' || currentView === 'order-detail')) return true;
    return false;
  }, [currentView, currentUser]);

  // Unique locations from product catalog
  const uniqueLocations = useMemo(() => {
    const locs = Array.from(new Set(products.map((p) => p.location))).filter(Boolean);
    return locs.sort();
  }, [products]);

  // Product counts per category
  const productCountsByCategory = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategoryId !== null) count++;
    if (minPrice !== '') count++;
    if (maxPrice !== '') count++;
    if (onlyOfficial) count++;
    if (onlyFreeShipping) count++;
    if (onlyDiscount) count++;
    if (minRating > 0) count++;
    if (selectedLocation !== '') count++;
    return count;
  }, [
    selectedCategoryId,
    minPrice,
    maxPrice,
    onlyOfficial,
    onlyFreeShipping,
    onlyDiscount,
    minRating,
    selectedLocation
  ]);

  // Selected category object
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId);
  }, [selectedCategoryId]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategoryId(null);
    setMinPrice('');
    setMaxPrice('');
    setOnlyOfficial(false);
    setOnlyFreeShipping(false);
    setOnlyDiscount(false);
    setMinRating(0);
    setSelectedLocation('');
  };

  // Clear single active filter
  const handleClearSingleFilter = (filterKey) => {
    switch (filterKey) {
      case 'category':
        setSelectedCategoryId(null);
        break;
      case 'onlyOfficial':
        setOnlyOfficial(false);
        break;
      case 'onlyFreeShipping':
        setOnlyFreeShipping(false);
        break;
      case 'onlyDiscount':
        setOnlyDiscount(false);
        break;
      case 'price':
        setMinPrice('');
        setMaxPrice('');
        break;
      case 'minRating':
        setMinRating(0);
        break;
      case 'location':
        setSelectedLocation('');
        break;
      default:
        break;
    }
  };

  // Price change handler
  const handlePriceChange = (type, val) => {
    if (type === 'min') setMinPrice(val);
    if (type === 'max') setMaxPrice(val);
  };

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    // Hanya produk yang aktif yang tampil di etalase publik pembeli
    let result = products.filter((p) => p.status === 'active' || (p.status !== 'inactive' && p.active !== false));

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter((p) => p.category_id === selectedCategoryId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query) ||
          (p.seller_name && p.seller_name.toLowerCase().includes(query))
      );
    }

    // Filter by min price
    if (minPrice !== '' && !isNaN(Number(minPrice))) {
      result = result.filter((p) => p.price >= Number(minPrice));
    }

    // Filter by max price
    if (maxPrice !== '' && !isNaN(Number(maxPrice))) {
      result = result.filter((p) => p.price <= Number(maxPrice));
    }

    // Filter by Official Store
    if (onlyOfficial) {
      result = result.filter((p) => p.is_official);
    }

    // Filter by Free Shipping
    if (onlyFreeShipping) {
      result = result.filter((p) => p.free_shipping);
    }

    // Filter by Discount
    if (onlyDiscount) {
      result = result.filter((p) => p.discount_percentage > 0);
    }

    // Filter by Rating
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    // Filter by Location
    if (selectedLocation) {
      result = result.filter((p) => p.location === selectedLocation);
    }

    // Sort
    if (sortBy === 'price_low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [
    products, 
    selectedCategoryId, 
    searchQuery, 
    minPrice, 
    maxPrice, 
    onlyOfficial, 
    onlyFreeShipping, 
    onlyDiscount, 
    minRating, 
    selectedLocation, 
    sortBy
  ]);

  // Auth requirement handler for cart actions
  const handleRequireLogin = (action = null, message = 'Silakan masuk ke akun (Login) terlebih dahulu.') => {
    if (action) {
      setPendingCartAction(action);
    }
    showToast(message);
    setCurrentView('login');
  };

  // Safe cart opener with auth check
  const handleOpenCart = () => {
    if (!currentUser) {
      handleRequireLogin(
        { type: 'open_cart', returnView: 'cart' },
        'Silakan masuk ke akun (Login) terlebih dahulu untuk membuka keranjang belanja.'
      );
      return;
    }
    setCurrentView('cart');
  };

  // Cart operations with backend database and session sync
  const handleAddToCart = async (product, quantity = 1, notes = '') => {
    // Jika belum login, simpan aksi pending dan arahkan login terlebih dahulu
    if (!currentUser) {
      handleRequireLogin(
        { 
          type: 'add_to_cart', 
          product, 
          quantity, 
          notes, 
          returnView: currentView === 'detail' ? 'detail' : 'catalog' 
        },
        'Silakan masuk ke akun (Login) terlebih dahulu untuk menambahkan produk ke keranjang.'
      );
      return;
    }

    try {
      await cartService.addItem(product.id, quantity, notes);
      await refreshCartFromBackend();
    } catch {
      // Fallback update state lokal jika backend lambat
      const itemKey = product.id;
      setCart((prev) => {
        const existing = prev.find((item) => item.product_id === itemKey || item.id === itemKey);
        const maxStock = Number(product.stock ?? 99);
        if (existing) {
          const updatedQty = Math.min(maxStock, existing.quantity + quantity);
          return prev.map((item) =>
            (item.product_id === itemKey || item.id === itemKey)
              ? { ...item, quantity: updatedQty, notes: notes || item.notes } 
              : item
          );
        }
        return [...prev, { ...product, id: itemKey, product_id: product.id, quantity, notes }];
      });
    }

    const variantLabel = product.variant_name ? ` [${product.variant_name}]` : '';
    setToastMessage(`"${product.name.slice(0, 18)}..."${variantLabel} (${quantity}x) masuk keranjang!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleBuyNow = async (product, quantity = 1, notes = '') => {
    if (!currentUser) {
      handleRequireLogin(
        { 
          type: 'buy_now', 
          product, 
          quantity, 
          notes, 
          returnView: 'cart' 
        },
        'Silakan masuk ke akun (Login) terlebih dahulu untuk melakukan pembelian produk.'
      );
      return;
    }
    await handleAddToCart(product, quantity, notes);
    setCurrentView('cart');
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(itemId);
      return;
    }
    // Optimistic UI update
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
    try {
      await cartService.updateItem(itemId, newQuantity);
    } catch {
      await refreshCartFromBackend();
    }
  };

  const handleRemoveCartItem = async (itemId) => {
    // Optimistic UI update
    setCart((prev) => prev.filter((item) => item.id !== itemId));
    setToastMessage('Item berhasil dihapus dari keranjang.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    try {
      await cartService.removeItem(itemId);
    } catch {
      await refreshCartFromBackend();
    }
  };

  const handleClearCart = async () => {
    setCart([]);
    try {
      await cartService.clearCart();
    } catch {
      // ignore
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setCurrentView('detail');
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategoryId(catId);
    if (currentView !== 'catalog') {
      setCurrentView('catalog');
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (currentView !== 'catalog' && query.trim() !== '') {
      setCurrentView('catalog');
    }
  };

  const handleResetHome = () => {
    setSelectedProduct(null);
    setCurrentView('catalog');
    handleResetFilters();
    setSearchQuery('');
  };

  const handleUpdateOrderStatus = (orderId, newStatus, additionalData = {}) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId || (o.order_number && o.order_number === orderId)) {
          const updated = {
            ...o,
            status: newStatus,
            payment_status: ['completed', 'processing', 'shipped'].includes(newStatus)
              ? 'paid'
              : (newStatus === 'cancelled' ? 'cancelled' : o.payment_status),
            notes: additionalData.notes || o.notes,
          };
          if (additionalData.tracking_number) {
            updated.expedition = {
              ...(updated.expedition || {}),
              tracking_number: additionalData.tracking_number,
            };
            updated.tracking_number = additionalData.tracking_number;
          }
          if (additionalData.cancel_reason) {
            updated.cancel_reason = additionalData.cancel_reason;
            updated.notes = (updated.notes ? updated.notes + ' | ' : '') + 'Alasan: ' + additionalData.cancel_reason;
          }
          return updated;
        }
        return o;
      })
    );

    if (selectedOrderForDetail && (selectedOrderForDetail.id === orderId || selectedOrderForDetail.order_number === orderId)) {
      setSelectedOrderForDetail((prev) => ({
        ...prev,
        status: newStatus,
        payment_status: ['completed', 'processing', 'shipped'].includes(newStatus)
          ? 'paid'
          : (newStatus === 'cancelled' ? 'cancelled' : prev.payment_status),
        ...(additionalData.tracking_number ? { tracking_number: additionalData.tracking_number } : {}),
      }));
    }

    setToastMessage(`Status pesanan berhasil diubah menjadi: ${newStatus.toUpperCase()}`);
  };

  const handleAuthSuccess = (user, successPrefix = 'Berhasil masuk') => {
    handleUpdateUser(user);
    showToast(`${successPrefix} sebagai ${user.name} (${user.role === 'admin' ? '🛡️ Super Admin' : 'Member'})`);

    if (pendingCartAction) {
      const action = pendingCartAction;
      setPendingCartAction(null);

      if (action.type === 'add_to_cart') {
        const prod = action.product;
        const qty = action.quantity || 1;
        const nts = action.notes || '';
        const itemKey = prod.selected_variant?.id ? `${prod.id}-${prod.selected_variant.id}` : prod.id;

        setCart((prev) => {
          const existing = prev.find((item) => item.id === itemKey);
          const maxStock = Number(prod.stock ?? 99);
          if (existing) {
            const updatedQty = Math.min(maxStock, existing.quantity + qty);
            return prev.map((item) =>
              item.id === itemKey ? { ...item, quantity: updatedQty, notes: nts || item.notes } : item
            );
          }
          return [...prev, { ...prod, id: itemKey, product_id: prod.id, quantity: qty, notes: nts }];
        });

        const variantLabel = prod.variant_name ? ` [${prod.variant_name}]` : '';
        setTimeout(() => {
          showToast(`"${prod.name.slice(0, 18)}..."${variantLabel} (${qty}x) berhasil masuk keranjang!`, { showCart: true });
        }, 400);

        if (action.returnView === 'detail' && selectedProduct) {
          setCurrentView('detail');
        } else {
          setCurrentView('cart');
        }
        return;
      }

      if (action.type === 'buy_now') {
        const prod = action.product;
        const qty = action.quantity || 1;
        const nts = action.notes || '';
        const itemKey = prod.selected_variant?.id ? `${prod.id}-${prod.selected_variant.id}` : prod.id;

        setCart((prev) => {
          const existing = prev.find((item) => item.id === itemKey);
          const maxStock = Number(prod.stock ?? 99);
          if (existing) {
            const updatedQty = Math.min(maxStock, existing.quantity + qty);
            return prev.map((item) =>
              item.id === itemKey ? { ...item, quantity: updatedQty, notes: nts || item.notes } : item
            );
          }
          return [...prev, { ...prod, id: itemKey, product_id: prod.id, quantity: qty, notes: nts }];
        });

        setCurrentView('cart');
        return;
      }

      if (action.type === 'open_cart') {
        setCurrentView('cart');
        return;
      }
    }

    // Jika akun adalah admin, alihkan langsung ke /admin/dashboard
    if (user?.role === 'admin') {
      setPendingCartAction(null);
      setCurrentView('products-admin');
      window.history.pushState(null, '', '/admin/dashboard');
      return;
    }

    setCurrentView('catalog');
  };

  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(user) => handleAuthSuccess(user, 'Berhasil masuk')}
        onNavigateRegister={() => setCurrentView('register')}
        onBackToHome={() => {
          const returnView = pendingCartAction?.returnView || 'catalog';
          setPendingCartAction(null);
          setCurrentView(returnView);
        }}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <RegisterPage
        onRegisterSuccess={(user) => handleAuthSuccess(user, 'Selamat datang')}
        onNavigateLogin={() => setCurrentView('login')}
        onBackToHome={() => {
          const returnView = pendingCartAction?.returnView || 'catalog';
          setPendingCartAction(null);
          setCurrentView(returnView);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${currentView === 'catalog' || currentView === 'detail' ? 'bg-white' : 'bg-[#f5f6f8]'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 text-white border px-4 py-3 rounded-none shadow-2xl flex items-center gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-4 duration-150 ${
          toastMessage.type === 'error'
            ? 'bg-red-950/95 border-red-700 text-red-100'
            : 'bg-neutral-900/95 border-neutral-700 text-white'
        }`}>
          {toastMessage.type === 'error' ? (
            <AlertCircle size={18} className="text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-amber-400 shrink-0" />
          )}
          <span className="font-semibold">{toastMessage.message || toastMessage}</span>
          {toastMessage.showCart && (
            <button
              type="button"
              onClick={() => {
                handleOpenCart();
                setToastMessage(null);
              }}
              className="ml-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase text-xs rounded-none transition-colors cursor-pointer shrink-0 tracking-wider"
            >
              Lihat Keranjang
            </button>
          )}
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-1 p-0.5 text-neutral-400 hover:text-white rounded-none cursor-pointer shrink-0 transition-colors"
            title="Tutup Notifikasi"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navigation Header: Hanya ditampilkan di storefront, disembunyikan di Panel Admin */}
      {!isAdminView && (
        <Navbar
          cartCount={cartTotalCount}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategory={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
          products={products}
          onSelectProduct={handleSelectProduct}
          onResetHome={handleResetHome}
          onOpenCart={handleOpenCart}
          onOpenOrders={() => setCurrentView('orders')}
          onOpenTransactions={() => setCurrentView('transactions')}
          onOpenProductsAdmin={() => setCurrentView('products-admin')}
          onOpenStock={() => setCurrentView('stock')}
          onOpenTemplates={() => setCurrentView('templates')}
          onOpenExpeditions={() => setCurrentView('expeditions')}
          currentUser={currentUser}
          onOpenLogin={() => setCurrentView('login')}
          onOpenRegister={() => setCurrentView('register')}
          onOpenProfile={() => setCurrentView('profile')}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
        />
      )}

      {/* Main Layout Area: Di Admin Panel, tata letak flex-row dengan navigasi di sebelah KIRI */}
      <div className={`flex-1 flex ${isAdminView ? 'flex-col lg:flex-row' : 'flex-col'} w-full min-w-0`}>
        {/* Navigasi Panel Admin di Sebelah KIRI */}
        {isAdminView && (
          <AdminSidebar
            currentView={currentView}
            onNavigate={(view) => setCurrentView(view)}
            currentUser={currentUser}
            onLogout={handleLogout}
            onBackToStore={() => setCurrentView('catalog')}
            orderCount={orders.length}
            lowStockCount={products.filter(p => p.stock <= (p.stock_minimum || 5)).length}
          />
        )}

        {/* Main View Area */}
        <main className={`flex-1 min-w-0 w-full ${
          isAdminView 
            ? 'px-4 sm:px-8 lg:px-10 py-6' 
            : (currentView === 'catalog' || currentView === 'detail' ? '' : 'w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-6')
        }`}>
        {currentView === 'admin-dashboard' ? (
          <AdminDashboardPage
            products={products}
            orders={orders}
            transactions={transactions}
            onNavigate={(view) => setCurrentView(view)}
          />
        ) : currentView === 'product-edit' && editingProduct ? (
          <ProductEditForm
            product={editingProduct}
            categories={categories}
            products={products}
            onUpdateProduct={(updatedProduct) => {
              setProducts(prev => prev.map(item => item.id === updatedProduct.id ? updatedProduct : item));
              if (selectedProduct && selectedProduct.id === updatedProduct.id) {
                setSelectedProduct(updatedProduct);
              }
              showToast(`Produk "${updatedProduct.name}" berhasil diperbarui!`);
              setCurrentView('products-admin');
            }}
            onCancel={() => setCurrentView('products-admin')}
            onNavigateToCategories={() => setCurrentView('categories-admin')}
            onNavigateToSuppliers={() => setCurrentView('suppliers-admin')}
          />
        ) : currentView === 'product-create' ? (
          <ProductCreateForm
            categories={categories}
            products={products}
            onSaveProduct={(newProduct) => {
              setProducts(prev => [newProduct, ...prev]);
              showToast(`Produk "${newProduct.name}" berhasil ditambahkan!`);
              setCurrentView('products-admin');
            }}
            onCancel={() => setCurrentView('products-admin')}
            onNavigateToCategories={() => setCurrentView('categories-admin')}
            onNavigateToSuppliers={() => setCurrentView('suppliers-admin')}
          />
        ) : currentView === 'categories-admin' ? (
          <CategoryListPage
            categories={categories}
            products={products}
            onCategoriesChange={setCategories}
            onShowToast={showToast}
            onBackToShopping={() => setCurrentView('catalog')}
            onNavigateToProducts={() => setCurrentView('products-admin')}
          />
        ) : currentView === 'products-admin' ? (
          <ProductListPage
            products={products}
            categories={categories}
            onAddNewProduct={() => {
              setCurrentView('product-create');
            }}
            onEditProduct={(p) => {
              setEditingProduct(p);
              setCurrentView('product-edit');
            }}
            onDeleteProduct={(p) => {
              setProducts(prev => prev.filter(item => item.id !== p.id));
              showToast(`Produk "${p.name}" berhasil dihapus.`);
            }}
            onToggleStatus={(p) => {
              const currentActive = p.status === 'active' || p.active;
              const nextStatus = currentActive ? 'inactive' : 'active';
              setProducts(prev => prev.map(item => item.id === p.id ? { ...item, status: nextStatus, active: !currentActive } : item));
              showToast(`Status "${p.name}" diubah menjadi ${!currentActive ? 'Aktif' : 'Nonaktif'}.`);
            }}
            onViewProductDetail={(p) => {
              setSelectedProduct(p);
              setCurrentView('detail');
            }}
            onBackToShopping={() => setCurrentView('catalog')}
            onCategoriesChange={setCategories}
            onNavigateToCategories={() => setCurrentView('categories-admin')}
            onOpenCategoryMaster={() => setCurrentView('categories-admin')}
          />
        ) : currentView === 'profile' ? (
          <ProfilePage
            currentUser={currentUser || mockDemoUsers[0]}
            onUpdateProfile={(updatedUser) => {
              handleUpdateUser(updatedUser);
              showToast('Profil akun berhasil diperbarui!');
            }}
            onBack={() => setCurrentView('catalog')}
          />
        ) : currentView === 'order-detail' ? (
          <OrderDetailPage
            order={selectedOrderForDetail}
            onBack={() => setCurrentView('orders')}
            onPayOrder={(order) => {
              setLastCompletedOrder(order);
              setCurrentView('order-success');
            }}
            onBuyAgain={(item) => {
              const foundProd = products.find(p => p.id === (item.product_id || item.id)) || item;
              handleBuyNow(foundProd, 1);
            }}
            onCancelOrder={(order) => {
              setOrders(prev => prev.map(o => 
                (o.id === order.id || (o.order_number && o.order_number === order.order_number))
                  ? { ...o, status: 'cancelled', payment_status: 'cancelled' } 
                  : o
              ));
              setSelectedOrderForDetail(prev => ({ ...prev, status: 'cancelled', payment_status: 'cancelled' }));
              setToastMessage(`Pesanan ${order.order_number || order.invoice_number} berhasil dibatalkan.`);
            }}
            onCompleteOrder={(order) => {
              setOrders(prev => prev.map(o => 
                (o.id === order.id || (o.order_number && o.order_number === order.order_number))
                  ? { ...o, status: 'completed' } 
                  : o
              ));
              setSelectedOrderForDetail(prev => ({ ...prev, status: 'completed' }));
              setToastMessage(`Pesanan ${order.order_number || order.invoice_number} telah diselesaikan.`);
            }}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        ) : currentView === 'orders' ? (
          <OrderListPage
            orders={orders}
            onBackToShopping={() => setCurrentView('catalog')}
            onViewOrderDetail={(order) => {
              setSelectedOrderForDetail(order);
              setCurrentView('order-detail');
            }}
            onPayOrder={(order) => {
              setLastCompletedOrder(order);
              setCurrentView('order-success');
            }}
            onBuyAgain={(item) => {
              const foundProd = products.find(p => p.id === (item.product_id || item.id)) || item;
              handleBuyNow(foundProd, 1);
            }}
            onCancelOrder={(order) => {
              setOrders(prev => prev.map(o => 
                (o.id === order.id || (o.order_number && o.order_number === order.order_number))
                  ? { ...o, status: 'cancelled', payment_status: 'cancelled' } 
                  : o
              ));
              setToastMessage(`Pesanan ${order.order_number || order.invoice_number} berhasil dibatalkan.`);
            }}
            onCompleteOrder={(order) => {
              setOrders(prev => prev.map(o => 
                (o.id === order.id || (o.order_number && o.order_number === order.order_number))
                  ? { ...o, status: 'completed' } 
                  : o
              ));
              setToastMessage(`Pesanan ${order.order_number || order.invoice_number} telah diselesaikan.`);
            }}
            onUpdateStatus={handleUpdateOrderStatus}
            onOpenFinancialTransactions={() => setCurrentView('transactions')}
            onOpenStock={() => setCurrentView('stock')}
            onOpenTemplates={() => setCurrentView('templates')}
            onOpenExpeditions={() => setCurrentView('expeditions')}
          />
        ) : currentView === 'transactions' ? (
          <FinancialTransactionsPage
            transactions={transactions}
            onBackToShopping={() => setCurrentView('catalog')}
            onViewOrders={() => setCurrentView('orders')}
            onOpenStock={() => setCurrentView('stock')}
            onViewOrderDetail={(orderRef) => {
              const matchedOrder = orders.find(o => 
                o.id === orderRef.id || 
                (orderRef.order_number && (o.order_number === orderRef.order_number || o.invoice_number === orderRef.order_number))
              );
              if (matchedOrder) {
                setSelectedOrderForDetail(matchedOrder);
                setCurrentView('order-detail');
              } else {
                setCurrentView('orders');
              }
            }}
          />
        ) : currentView === 'stock' ? (
          <StockManagementPage
            inventory={inventory}
            stockLogs={stockLogs}
            onBackToShopping={() => setCurrentView('catalog')}
            onViewOrders={() => setCurrentView('orders')}
            onViewTransactions={() => setCurrentView('transactions')}
            onAddExpenseTransaction={(tx) => {
              const newFinancialTx = {
                id: Date.now(),
                transaction_number: `TRX/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}/EX-${Math.floor(1000 + Math.random() * 9000)}`,
                order_id: null,
                order_number: null,
                type: 'expense',
                category: tx.category || 'restock',
                category_label: tx.category_label || 'Pengadaan Stok Produk',
                amount: tx.amount,
                description: tx.description,
                payment_method: tx.payment_method || 'Kas Toko / Transfer',
                status: 'settled',
                created_at: new Date().toISOString(),
                customer_name: 'Gudang & Inventaris'
              };
              setTransactions(prev => [newFinancialTx, ...prev]);
              setToastMessage(`Pengadaan stok dicatat ke laporan keuangan (-${tx.amount.toLocaleString('id-ID')})!`);
            }}
          />
        ) : currentView === 'suppliers-admin' ? (
          <SupplierListPage
            onShowToast={(msg) => {
              setToastMessage(msg);
              setTimeout(() => setToastMessage(null), 3000);
            }}
            onNavigateToPO={() => {
              setCurrentView('procurement-pos');
            }}
          />
        ) : (currentView === 'procurement-pos' || currentView === 'procurement') ? (
          <PurchaseOrderListPage
            onShowToast={(msg) => {
              setToastMessage(msg);
              setTimeout(() => setToastMessage(null), 3000);
            }}
            onNavigateToGRN={() => setCurrentView('procurement-grn')}
            onNavigateToBills={() => setCurrentView('procurement-bills')}
          />
        ) : currentView === 'procurement-grn' ? (
          <GoodsReceiptListPage
            onShowToast={(msg) => {
              setToastMessage(msg);
              setTimeout(() => setToastMessage(null), 3000);
            }}
          />
        ) : currentView === 'procurement-bills' ? (
          <VendorBillListPage
            onShowToast={(msg) => {
              setToastMessage(msg);
              setTimeout(() => setToastMessage(null), 3000);
            }}
          />
        ) : currentView === 'templates' ? (
          <TemplateManagementPage
            onBack={() => setCurrentView('orders')}
            onShowToast={(msg) => {
              setToastMessage(msg);
              setTimeout(() => setToastMessage(null), 3000);
            }}
          />
        ) : currentView === 'expeditions' ? (
          <ExpeditionSettingsPage
            expeditions={expeditions}
            onBack={() => setCurrentView('orders')}
            onAddExpedition={(newExp) => {
              setExpeditions(prev => [newExp, ...prev]);
            }}
            onDeleteExpedition={(targetExp) => {
              setExpeditions(prev => prev.filter(e => e.id !== targetExp.id));
            }}
            onEditRate={(updatedData) => {
              setExpeditions(prev => prev.map(e => 
                e.id === updatedData.id
                  ? { ...e, rateType: updatedData.rateType, baseRate: updatedData.baseRate }
                  : e
              ));
            }}
            onSetDefault={(exp) => {
              setExpeditions(prev => prev.map(e => ({
                ...e,
                isDefault: e.id === exp.id
              })));
              setToastMessage(`${exp.name} (${exp.service}) dijadikan ekspedisi utama toko!`);
            }}
            onToggleActive={(exp) => {
              setExpeditions(prev => prev.map(e => 
                e.id === exp.id ? { ...e, isActive: !e.isActive } : e
              ));
              setToastMessage(`Status ${exp.name} (${exp.service}) diubah menjadi ${!exp.isActive ? 'Aktif' : 'Nonaktif'}.`);
            }}
            onShowToast={(msg) => {
              setToastMessage(msg);
              setTimeout(() => setToastMessage(null), 3000);
            }}
          />
        ) : currentView === 'order-success' ? (
          <OrderSuccessPage
            orderData={lastCompletedOrder}
            onContinueShopping={() => {
              setCurrentView('catalog');
              handleResetHome();
            }}
            onViewOrdersList={() => setCurrentView('orders')}
          />
        ) : currentView === 'checkout' ? (
          <CheckoutPage
            checkoutItems={checkoutItems}
            availableExpeditions={expeditions}
            initialVoucher={appliedCheckoutVoucher}
            onBackToCart={() => setCurrentView('cart')}
            onFinishOrder={(order) => {
              // Remove checked out items from cart
              setCart(prev => prev.filter(item => !checkoutItems.some(ci => ci.id === item.id)));
              setLastCompletedOrder(order);

              // Add to orders list
              const newFormattedOrder = {
                id: Date.now(),
                order_number: order.invoiceNumber,
                invoice_number: order.invoiceNumber,
                created_at: new Date().toISOString(),
                status: 'pending',
                payment_status: 'pending',
                payment_method: order.paymentMethod?.id || 'midtrans',
                payment_channel: order.paymentMethod?.name || 'Virtual Account',
                va_number: order.vaNumber,
                address: order.address,
                expedition: order.expedition,
                items: (order.items || []).map(item => ({
                  id: item.id,
                  product_id: item.id,
                  product_name: item.name,
                  product_image: item.image_url,
                  product_price: item.price,
                  quantity: item.quantity,
                  subtotal: item.price * item.quantity,
                  notes: item.notes
                })),
                totals: {
                  subtotal: (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0),
                  shipping_cost: order.expedition?.cost || 0,
                  insurance_cost: 1000,
                  service_fee: 1000,
                  discount_amount: order.totalSavings || 0,
                  grand_total: order.totalAmount
                }
              };
              setOrders(prev => [newFormattedOrder, ...prev]);

              // Catat transaksi keuangan baru ke buku kas (status: pending)
              const newFinancialTx = {
                id: Date.now(),
                transaction_number: `TRX/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}/IN-${Math.floor(1000 + Math.random() * 9000)}`,
                order_id: newFormattedOrder.id,
                order_number: newFormattedOrder.order_number,
                type: 'income',
                category: 'order_payment',
                category_label: 'Pembayaran Pesanan',
                amount: newFormattedOrder.totals.grand_total,
                description: `Pembayaran pesanan ${newFormattedOrder.order_number} (${order.paymentMethod?.name || 'Virtual Account'})`,
                payment_method: order.paymentMethod?.name || 'Midtrans Payment',
                status: 'pending',
                created_at: new Date().toISOString(),
                customer_name: order.address?.recipient_name || 'Pembeli'
              };
              setTransactions(prev => [newFinancialTx, ...prev]);

              setCurrentView('order-success');
              setToastMessage(`Pesanan ${order.invoiceNumber} berhasil dibuat!`);
            }}
          />
        ) : currentView === 'cart' ? (
          <CartPage
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onBackToShopping={() => setCurrentView('catalog')}
            onProceedToCheckout={({ selectedItems, appliedVoucher }) => {
              setCheckoutItems(selectedItems);
              setAppliedCheckoutVoucher(appliedVoucher || null);
              setCurrentView('checkout');
            }}
          />
        ) : currentView === 'detail' && selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setCurrentView('catalog')}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onSelectCategory={handleSelectCategory}
            onOpenRegister={() => setCurrentView('register')}
            onOpenCart={handleOpenCart}
          />
        ) : (
          <>
            {/* 3. Hero Campaign Banner (Benchmark: adidas Editorial Campaign) */}
            <HeroCampaignBanner
              onBuyNowClick={() => {
                const el = document.getElementById('product-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreClick={() => {
                const el = document.getElementById('sport-categories');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 4. Populer Sekarang (Horizontal Chips Slider) */}
            <PopularChipsBar
              onSelectChip={(query) => {
                setSearchQuery(query);
                setSelectedCategoryId(null);
                const el = document.getElementById('product-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 5. Kategori Pilihan Olahraga (Swipeable di Mobile, 4-Kolom di Desktop) */}
            <SportCategoriesSection
              onSelectSport={(sport) => {
                if (sport.categoryId) {
                  setSelectedCategoryId(sport.categoryId);
                } else if (sport.query) {
                  setSearchQuery(sport.query);
                }
                const el = document.getElementById('product-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onViewAll={() => {
                setSelectedCategoryId(null);
                setSearchQuery('');
                const el = document.getElementById('product-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 6. Produk Unggulan & Etalase Varian (Benchmark: adidas.co.id Grid) */}
            <ProductGrid
              products={filteredProducts}
              currentUser={currentUser}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onAddToCart={handleAddToCart}
              onSelectProduct={handleSelectProduct}
              categoryTitle={activeCategory ? activeCategory.name : null}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              activeFilters={{
                minPrice,
                maxPrice,
                onlyOfficial,
                onlyFreeShipping,
                onlyDiscount,
                minRating,
                selectedLocation
              }}
              onClearFilter={handleClearSingleFilter}
              onResetFilters={handleResetFilters}
            />

            {/* 7. Tusko Club Loyalty Banner */}
            <TuskoClubBanner
              onJoinClick={() => setCurrentView('register')}
            />
          </>
        )}
      </main>
      </div>

      {/* 8. Footer Standar E-Commerce Adidas (Hanya di Toko Publik) */}
      {!isAdminView && (
        <Footer
          onSelectCategory={(term) => {
            setSearchQuery(term);
            setSelectedCategoryId(null);
            setCurrentView('catalog');
            const el = document.getElementById('product-catalog');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenOrders={() => setCurrentView('orders')}
        />
      )}
    </div>
  );
}
