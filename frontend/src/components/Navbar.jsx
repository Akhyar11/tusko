import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  ShoppingBag,
  Bell, 
  Mail, 
  Smartphone, 
  HelpCircle, 
  Store,
  ChevronDown,
  X,
  Clock,
  TrendingUp,
  Tag
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function Navbar({ 
  cartCount = 0, 
  searchQuery = '', 
  onSearchChange = () => {},
  selectedCategory = null,
  onSelectCategory = () => {},
  products = [],
  onSelectProduct = () => {},
  onResetHome = () => {},
  onOpenCart = () => {},
  onOpenOrders = () => {}
}) {
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef(null);

  const trendingSearches = [
    'Mechanical Keyboard', 
    'Smartphone 5G', 
    'Kaos Polos', 
    'TWS Bluetooth', 
    'Monitor 27 Inch'
  ];

  // Live matching products for dropdown preview
  const liveSuggestions = searchQuery.trim()
    ? products
        .filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (title) => {
    onSearchChange(title);
    setIsFocused(false);
  };

  const handleProductClick = (product) => {
    onSelectProduct(product);
    setIsFocused(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-xs">
      {/* Top Bar */}
      <div className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 hover:text-emerald-600 cursor-pointer">
              <Smartphone size={13} />
              Download TokoOnline App
            </span>
            <span className="hover:text-emerald-600 cursor-pointer">Mitra TokoOnline</span>
            <span className="flex items-center gap-1 hover:text-emerald-600 cursor-pointer">
              <Store size={13} />
              Mulai Berjualan
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 hover:text-emerald-600 cursor-pointer">
              <HelpCircle size={13} />
              Bantuan
            </span>
            <span className="hover:text-emerald-600 cursor-pointer">Tentang TokoOnline</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 md:gap-6">
          {/* Logo */}
          <div 
            onClick={onResetHome}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:bg-emerald-700 transition-colors">
              T
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-emerald-600 leading-none">
                Toko<span className="text-gray-900">Online</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Beli Cepat & Nyaman</span>
            </div>
          </div>

          {/* Category Dropdown Button */}
          <button 
            onClick={() => onSelectCategory(null)}
            className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span>Kategori</span>
            <ChevronDown size={16} />
          </button>

          {/* Search Bar Container */}
          <div ref={searchContainerRef} className="flex-1 max-w-2xl relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari di TokoOnline (misal: keyboard, baju, hp)..."
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />

              {/* Clear search button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Dropdown Modal/Suggestions */}
            {isFocused && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 text-xs">
                {/* When query is empty: Trending and Recent */}
                {!searchQuery.trim() ? (
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 text-gray-400 font-semibold mb-2">
                      <TrendingUp size={14} className="text-emerald-600" />
                      <span>Pencarian Populer Hari Ini</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {trendingSearches.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-lg transition-colors cursor-pointer"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Live suggestions matching products */}
                    {liveSuggestions.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        <div className="px-3 py-2 bg-gray-50 text-gray-500 font-semibold flex items-center justify-between">
                          <span>Saran Produk</span>
                          <span className="text-[11px] text-gray-400">Tekan enter untuk melihat semua</span>
                        </div>
                        {liveSuggestions.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="p-2.5 flex items-center gap-3 hover:bg-emerald-50/60 cursor-pointer transition-colors"
                          >
                            <img
                              src={product.image_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{product.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-bold text-emerald-600">{formatRupiah(product.price)}</span>
                                <span className="text-gray-400 text-[10px]">• {product.location}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <span>Tekan enter untuk mencari "<strong>{searchQuery}</strong>" di seluruh katalog</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Popular Searches below search bar */}
            <div className="hidden md:flex items-center gap-2 mt-1.5 overflow-x-auto text-[11px] text-gray-500">
              <span className="text-gray-400">Paling dicari:</span>
              {trendingSearches.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSearchChange(item)}
                  className="hover:text-emerald-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Actions & Icons */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Cart Icon with badge */}
            <div 
              onClick={onOpenCart}
              className="relative cursor-pointer p-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-emerald-600 transition-colors"
              title="Keranjang Belanja"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none">
                  {cartCount}
                </span>
              )}
            </div>

            {/* Orders / Transactions shortcut */}
            <div 
              onClick={onOpenOrders}
              className="relative cursor-pointer p-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
              title="Daftar Transaksi"
            >
              <ShoppingBag size={21} />
              <span className="hidden md:inline text-xs font-semibold">Transaksi</span>
            </div>

            {/* Notifications & Messages */}
            <div className="hidden sm:flex items-center gap-1 text-gray-600">
              <button className="p-2 rounded-lg hover:bg-gray-100 hover:text-emerald-600 transition-colors cursor-pointer">
                <Bell size={20} />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 hover:text-emerald-600 transition-colors cursor-pointer">
                <Mail size={20} />
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            {/* Auth buttons */}
            <div className="flex items-center gap-2">
              <button className="px-3.5 py-1.5 text-xs font-semibold text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer">
                Masuk
              </button>
              <button className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer">
                Daftar
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
