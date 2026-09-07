import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  ShoppingBag, 
  Bell, 
  Mail, 
  HelpCircle, 
  ChevronDown, 
  X, 
  TrendingUp, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function Navbar({ 
  cartCount = 0, 
  searchQuery = '', 
  onSearchChange = () => {},
  _selectedCategory = null,
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
    'Jersey Matchday 2026', 
    'Sepatu Marathon Carbon', 
    'Celana Training Tapered', 
    'Gym Duffle Bag', 
    'Kaos Kaki Anti-Slip'
  ];

  // Live matching products for dropdown preview
  const liveSuggestions = searchQuery.trim()
    ? products
        .filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()))
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
    <header className="sticky top-0 z-50 bg-neutral-950 border-b border-neutral-800 text-white shadow-md">
      {/* Top Bar */}
      <div className="bg-neutral-900 border-b border-neutral-800 text-[11px] text-neutral-400 py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-5">
            <span className="flex items-center gap-1 text-amber-400 font-bold uppercase tracking-wider">
              <Zap size={13} className="fill-current" />
              TUSKO OFFICIAL STORE
            </span>
            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
              <ShieldCheck size={13} className="text-emerald-400" />
              Garansi Tukar Ukuran 7 Hari
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Bebas Ongkir Seluruh Indonesia
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
              <HelpCircle size={13} />
              Bantuan & CS
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Tentang Tusko Performance
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 md:gap-6">
          {/* Logo */}
          <div 
            onClick={onResetHome}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-neutral-950 font-black text-2xl shadow-md group-hover:bg-amber-400 transition-colors transform -skew-x-6">
              T
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter uppercase italic leading-none text-white">
                TUSKO<span className="text-amber-400">.</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-0.5">
                Sport & Performance
              </span>
            </div>
          </div>

          {/* Category Dropdown Button */}
          <button 
            onClick={() => onSelectCategory(null)}
            className="hidden lg:flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-amber-400 px-3 py-2 rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <span>Kategori</span>
            <ChevronDown size={15} />
          </button>

          {/* Search Bar Container */}
          <div ref={searchContainerRef} className="flex-1 max-w-2xl relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari perlengkapan olahraga (jersey, running shoes, gym gear)..."
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-neutral-900 border border-neutral-750 text-white rounded-xl placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:bg-neutral-900/90 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              <Search className="absolute left-3.5 top-3 text-neutral-400" size={17} />

              {/* Clear search button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Dropdown Modal/Suggestions */}
            {isFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800 overflow-hidden z-50 text-xs">
                {/* When query is empty: Trending and Recent */}
                {!searchQuery.trim() ? (
                  <div className="p-3.5">
                    <div className="flex items-center gap-1.5 text-neutral-400 font-bold mb-2.5 uppercase tracking-wider text-[10px]">
                      <TrendingUp size={14} className="text-amber-400" />
                      <span>Paling Dicari Atlet & Komunitas</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {trendingSearches.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 rounded-lg font-medium transition-colors cursor-pointer"
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
                      <div className="divide-y divide-neutral-800">
                        <div className="px-3.5 py-2 bg-neutral-950 text-neutral-400 font-bold flex items-center justify-between text-[11px]">
                          <span>Saran Produk Tusko</span>
                          <span className="text-[10px] text-neutral-500">Tekan enter untuk melihat semua</span>
                        </div>
                        {liveSuggestions.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="p-3 flex items-center gap-3 hover:bg-neutral-800/80 cursor-pointer transition-colors"
                          >
                            <img
                              src={product.image_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-neutral-700 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-neutral-100 truncate">{product.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-black text-amber-400">{formatRupiah(product.price)}</span>
                                <span className="text-neutral-400 text-[10px]">• {product.location}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-neutral-400">
                        <span>Tekan enter untuk mencari "<strong>{searchQuery}</strong>" di seluruh etalase Tusko</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Popular Searches below search bar */}
            <div className="hidden md:flex items-center gap-2 mt-1.5 overflow-x-auto text-[11px] text-neutral-400">
              <span className="text-neutral-500 font-medium">Tren:</span>
              {trendingSearches.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSearchChange(item)}
                  className="hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer font-medium"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Actions & Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Icon with badge */}
            <div 
              onClick={onOpenCart}
              className="relative cursor-pointer p-2 rounded-xl hover:bg-neutral-800 text-neutral-200 hover:text-amber-400 transition-colors"
              title="Keranjang Belanja"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-amber-500 text-neutral-950 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none shadow-sm">
                  {cartCount}
                </span>
              )}
            </div>

            {/* Orders / Transactions shortcut */}
            <div 
              onClick={onOpenOrders}
              className="relative cursor-pointer p-2 rounded-xl hover:bg-neutral-800 text-neutral-200 hover:text-amber-400 transition-colors flex items-center gap-1.5"
              title="Daftar Transaksi"
            >
              <ShoppingBag size={21} />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Pesanan</span>
            </div>

            {/* Notifications */}
            <div className="hidden sm:flex items-center gap-1 text-neutral-300">
              <button className="p-2 rounded-xl hover:bg-neutral-800 hover:text-amber-400 transition-colors cursor-pointer">
                <Bell size={20} />
              </button>
              <button className="p-2 rounded-xl hover:bg-neutral-800 hover:text-amber-400 transition-colors cursor-pointer">
                <Mail size={20} />
              </button>
            </div>

            <div className="h-6 w-px bg-neutral-800 hidden sm:block"></div>

            {/* Auth buttons */}
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-200 border border-neutral-700 rounded-xl hover:bg-neutral-800 hover:border-neutral-600 transition-colors cursor-pointer">
                Masuk
              </button>
              <button className="px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs transition-colors cursor-pointer">
                Daftar
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
