import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import PromoBanner from './components/PromoBanner';
import CategoryBar from './components/CategoryBar';
import FilterSidebar from './components/FilterSidebar';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';
import Footer from './components/Footer';
import { categories, mockProducts } from './data/mockProducts';
import { CheckCircle2, Filter } from 'lucide-react';

export default function App() {
  const [products] = useState(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState(null);
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

  const [cart, setCart] = useState([
    { id: 1, quantity: 1 },
    { id: 3, quantity: 1 }
  ]);
  const [toastMessage, setToastMessage] = useState(null);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedProduct]);

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

  // Add to cart handler
  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, quantity: 1 }];
    });

    setToastMessage(`"${product.name.slice(0, 30)}..." berhasil masuk ke keranjang!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategoryId(catId);
    if (selectedProduct) {
      setSelectedProduct(null);
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (selectedProduct && query.trim() !== '') {
      setSelectedProduct(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f6f8]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/95 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
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
        onResetHome={() => {
          setSelectedProduct(null);
          handleResetFilters();
          setSearchQuery('');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-2">
        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
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
