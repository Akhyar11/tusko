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
import Footer from './components/Footer';
import { categories, mockProducts } from './data/mockProducts';
import { mockOrders } from './data/mockOrders';
import { CheckCircle2, Filter } from 'lucide-react';

export default function App() {
  const [products] = useState(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentView, setCurrentView] = useState('catalog'); // 'catalog' | 'detail' | 'cart' | 'checkout' | 'order-success' | 'orders' | 'order-detail'
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [orders, setOrders] = useState(mockOrders);
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

  // Initial cart with realistic mock items from mockProducts
  const [cart, setCart] = useState(() => [
    {
      ...mockProducts[0], // Mechanical Keyboard
      quantity: 1
    },
    {
      ...mockProducts[2], // TWS Earphone
      quantity: 2
    }
  ]);
  
  const [toastMessage, setToastMessage] = useState(null);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProduct]);

  // Total items in cart
  const cartTotalCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

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

  // Price change handler
  const handlePriceChange = (type, val) => {
    if (type === 'min') setMinPrice(val);
    if (type === 'max') setMaxPrice(val);
  };

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

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

  // Cart operations
  const handleAddToCart = (product, quantity = 1, notes = '') => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const updatedQty = Math.min(itemStock(product), existing.quantity + quantity);
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: updatedQty, notes: notes || item.notes } : item
        );
      }
      return [...prev, { ...product, quantity, notes }];
    });

    setToastMessage(`"${product.name.slice(0, 24)}..." (${quantity}x) berhasil masuk keranjang!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const itemStock = (p) => Number(p.stock ?? 99);

  const handleBuyNow = (product, quantity = 1, notes = '') => {
    handleAddToCart(product, quantity, notes);
    setCurrentView('cart');
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    setToastMessage('Item berhasil dihapus dari keranjang.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleClearCart = () => {
    setCart([]);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f6f8]">
      {/* Toast Notification with Cart Shortcut */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/95 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs sm:text-sm animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => {
              setCurrentView('cart');
              setToastMessage(null);
            }}
            className="ml-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
          >
            Lihat Keranjang
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        cartCount={cartTotalCount}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedCategory={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
        products={products}
        onSelectProduct={handleSelectProduct}
        onResetHome={handleResetHome}
        onOpenCart={() => setCurrentView('cart')}
        onOpenOrders={() => setCurrentView('orders')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-2">
        {currentView === 'order-detail' ? (
          <OrderDetailPage
            order={selectedOrderForDetail}
            onBack={() => setCurrentView('orders')}
            onPayOrder={(order) => {
              setLastCompletedOrder(order);
              setCurrentView('order-success');
            }}
            onBuyAgain={(item) => {
              const foundProd = products.find(p => p.id === (item.product_id || item.id)) || item;
              handleAddToCart(foundProd, 1);
              setCurrentView('cart');
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
              handleAddToCart(foundProd, 1);
              setCurrentView('cart');
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
            onProceedToCheckout={({ selectedItems }) => {
              setCheckoutItems(selectedItems);
              setCurrentView('checkout');
            }}
          />
        ) : currentView === 'detail' && selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setCurrentView('catalog')}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        ) : (
          <>
            {/* Promotional Carousel */}
            <PromoBanner />

            {/* Quick Category Bar */}
            <CategoryBar
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
            />

            {/* Mobile Filter Button Bar */}
            <div className="lg:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 mb-4 shadow-2xs">
              <span className="text-xs font-semibold text-gray-700">
                {filteredProducts.length} Produk Ditemukan
              </span>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-600 hover:bg-emerald-100 cursor-pointer"
              >
                <Filter size={14} />
                <span>Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Two-Column Layout: Filter Sidebar + Product Grid */}
            <div className="flex gap-6 items-start">
              {/* Filter Sidebar */}
              <FilterSidebar
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={handleSelectCategory}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceChange={handlePriceChange}
                onlyOfficial={onlyOfficial}
                onToggleOfficial={() => setOnlyOfficial(!onlyOfficial)}
                onlyFreeShipping={onlyFreeShipping}
                onToggleFreeShipping={() => setOnlyFreeShipping(!onlyFreeShipping)}
                onlyDiscount={onlyDiscount}
                onToggleDiscount={() => setOnlyDiscount(!onlyDiscount)}
                minRating={minRating}
                onSelectMinRating={setMinRating}
                selectedLocation={selectedLocation}
                onSelectLocation={setSelectedLocation}
                locations={uniqueLocations}
                productCountsByCategory={productCountsByCategory}
                onResetFilters={handleResetFilters}
                isMobileOpen={isMobileFilterOpen}
                onCloseMobile={() => setIsMobileFilterOpen(false)}
              />

              {/* Main Catalog Content */}
              <div className="flex-1 min-w-0">
                <ProductGrid
                  products={filteredProducts}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onAddToCart={handleAddToCart}
                  onSelectProduct={handleSelectProduct}
                  categoryTitle={activeCategory ? activeCategory.name : null}
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery('')}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
