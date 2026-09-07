import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import PromoBanner from './components/PromoBanner';
import CategoryBar from './components/CategoryBar';
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';
import { categories, mockProducts } from './data/mockProducts';
import { CheckCircle2, ShoppingBag } from 'lucide-react';

export default function App() {
  const [products] = useState(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [sortBy, setSortBy] = useState('relevant');
  const [cart, setCart] = useState([
    { id: 1, quantity: 1 },
    { id: 3, quantity: 1 }
  ]);
  const [toastMessage, setToastMessage] = useState(null);

  // Total items in cart
  const cartTotalCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Selected category object
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId);
  }, [selectedCategoryId]);

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
          p.location.toLowerCase().includes(query)
      );
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
  }, [products, selectedCategoryId, searchQuery, sortBy]);

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
    console.log('Selected product:', product);
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
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-2">
        {/* Promotional Carousel */}
        <PromoBanner />

        {/* Quick Category Bar */}
        <CategoryBar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* Product Catalog Grid */}
        <ProductGrid
          products={filteredProducts}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onAddToCart={handleAddToCart}
          onSelectProduct={handleSelectProduct}
          categoryTitle={activeCategory ? activeCategory.name : null}
          searchQuery={searchQuery}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
