import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Heart,
  Truck, 
  MapPin, 
  X, 
  TrendingUp, 
  User, 
  Package, 
  Boxes, 
  Wallet,
  Menu,
  RotateCcw,
  ShieldCheck,
  Award,
  ChevronRight,
  Sparkles,
  LogIn,
  UserPlus
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import UserMenuDropdown from './UserMenuDropdown';

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
  onOpenOrders = () => {},
  onOpenTransactions = () => {},
  onOpenProductsAdmin = () => {},
  onOpenStock = () => {},
  onOpenTemplates = () => {},
  onOpenExpeditions = () => {},
  currentUser = null,
  onOpenLogin = () => {},
  onOpenRegister = () => {},
  onOpenProfile = () => {},
  onLogout = () => {},
  onSwitchUser = () => {}
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState('Semua');
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const trendingSearches = [
    'Jersey Timnas AeroTech', 
    'Sepatu Ultimashow FX3632', 
    'Sepatu Pelat Karbon', 
    'Celana Kompresi 2-in-1', 
    'Tas Duffle 45L'
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
      const inDesktop = desktopSearchRef.current && desktopSearchRef.current.contains(event.target);
      const inMobile = mobileSearchRef.current && mobileSearchRef.current.contains(event.target);
      if (!inDesktop && !inMobile) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent background scroll when mobile menu drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleSelectSuggestion = (title) => {
    onSearchChange(title);
    setIsFocused(false);
    setIsMobileSearchOpen(false);
  };

  const handleProductClick = (product) => {
    onSelectProduct(product);
    setIsFocused(false);
    setIsMobileSearchOpen(false);
  };

  const handleNavCategoryClick = (categoryName) => {
    setActiveCategoryTab(categoryName);
    if (categoryName === 'Semua') {
      onSelectCategory(null);
      onSearchChange('');
    } else if (categoryName === 'Olahraga') {
      const el = document.getElementById('sport-categories');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (categoryName === 'Sale') {
      onSearchChange('');
      onSelectCategory(null);
      const el = document.getElementById('product-catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onSearchChange(categoryName);
      const el = document.getElementById('product-catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderSuggestionsDropdown = () => {
    if (!isFocused) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-none shadow-2xl border border-neutral-300 overflow-hidden z-50 text-xs">
        {!searchQuery.trim() ? (
          <div className="p-3.5 bg-white">
            <div className="flex items-center gap-1.5 text-neutral-500 font-bold mb-2.5 uppercase tracking-wider text-[10px]">
              <TrendingUp size={14} className="text-amber-500" />
              <span>Paling Dicari Atlet &amp; Komunitas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingSearches.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 text-[11px] font-bold uppercase transition-colors cursor-pointer border border-neutral-200"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {liveSuggestions.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                <div className="px-3.5 py-2 bg-neutral-50 text-neutral-500 font-bold flex items-center justify-between text-[11px] uppercase tracking-wider">
                  <span>Saran Produk Tusko</span>
                  <span className="text-[10px] text-neutral-400">Tekan untuk melihat detail</span>
                </div>
                {liveSuggestions.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="p-3 flex items-center gap-3 hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <img
                      src={product.image_url}
                      alt=""
                      className="w-10 h-10 object-cover border border-neutral-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-neutral-900 truncate font-sport uppercase">{product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-black text-black">{formatRupiah(product.price)}</span>
                        <span className="text-neutral-500 text-[10px]">• {product.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-neutral-500 text-xs">
                <span>Tekan enter untuk mencari "<strong>{searchQuery}</strong>" di katalog Tusko</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 1. Top Announcement Utility Bar */}
      <div className="bg-black text-white font-bold tracking-wider uppercase w-full max-w-full overflow-hidden">
        <div className="relative w-full px-4 sm:px-8 lg:px-12 h-9 flex items-center">
          {/* Center: Promo text — absolutely centered so it's always symmetrical */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2.5 text-[11px]">
              <Truck size={13} className="text-amber-400 shrink-0" />
              <span className="sm:hidden">GRATIS ONGKIR MIN. 500RB • GARANSI 14 HARI</span>
              <span className="hidden sm:inline">GRATIS ONGKIR SELURUH INDONESIA MIN. RP 500.000</span>
              <span className="hidden md:inline text-neutral-500">|</span>
              <span className="hidden md:inline text-amber-400">GARANSI TUKAR UKURAN 14 HARI</span>
            </div>
          </div>
          {/* Right: Utility links — pushed to the right */}
          <div className="hidden lg:flex items-center gap-5 text-[11px] text-neutral-400 ml-auto pointer-events-auto">
            <button 
              onClick={onOpenOrders}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <MapPin size={12} />
              <span>Lacak Pesanan</span>
            </button>
            <span className="hover:text-white cursor-pointer transition-colors">
              Bantuan &amp; FAQ
            </span>
            <button 
              onClick={currentUser ? onOpenProfile : onOpenRegister}
              className="text-amber-400 font-extrabold hover:underline cursor-pointer"
            >
              {currentUser ? `Halo, ${currentUser.name}` : 'Gabung Tusko Club'}
            </button>
            <span className="text-neutral-500 font-bold">ID | IDR</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 w-full max-w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-[68px] sm:h-[84px] flex items-center justify-between gap-2 sm:gap-6">
          
          {/* Left: Hamburger Button (Mobile & Tablet) + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button for Mobile/Tablet */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Buka Menu Navigasi"
              aria-label="Buka Menu"
            >
              <Menu size={22} />
            </button>

            {/* Brand Logo */}
            <div 
              onClick={onResetHome}
              className="flex items-center gap-2.5 group flex-shrink-0 cursor-pointer select-none"
            >
              <div className="w-9 sm:w-13 h-9 sm:h-12 bg-black text-white flex items-center justify-center font-sport font-black text-xl sm:text-3xl tracking-tighter -skew-x-6 group-hover:bg-neutral-800 transition-colors">
                T
              </div>
              <div className="leading-none">
                <span className="font-sport font-black text-xl sm:text-3xl tracking-tight uppercase">
                  TUSKO<span className="text-amber-500">.</span>
                </span>
                <span className="hidden sm:block text-[9px] sm:text-[10px] font-bold tracking-widest text-neutral-400 uppercase mt-0.5">
                  Performance
                </span>
              </div>
            </div>
          </div>

          {/* Center: Desktop Navigation Categories (Desktop Only) */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-9 font-sport font-black text-sm uppercase tracking-wider">
            <button
              type="button"
              onClick={() => handleNavCategoryClick('Pria')}
              className={`pb-1 transition-all cursor-pointer ${
                activeCategoryTab === 'Pria' 
                  ? 'text-black border-b-2 border-black' 
                  : 'text-neutral-700 hover:text-black border-b-2 border-transparent hover:border-black'
              }`}
            >
              Pria
            </button>
            <button
              type="button"
              onClick={() => handleNavCategoryClick('Wanita')}
              className={`pb-1 transition-all cursor-pointer ${
                activeCategoryTab === 'Wanita' 
                  ? 'text-black border-b-2 border-black' 
                  : 'text-neutral-700 hover:text-black border-b-2 border-transparent hover:border-black'
              }`}
            >
              Wanita
            </button>
            <button
              type="button"
              onClick={() => handleNavCategoryClick('Anak')}
              className={`pb-1 transition-all cursor-pointer ${
                activeCategoryTab === 'Anak' 
                  ? 'text-black border-b-2 border-black' 
                  : 'text-neutral-700 hover:text-black border-b-2 border-transparent hover:border-black'
              }`}
            >
              Anak
            </button>
            <button
              type="button"
              onClick={() => handleNavCategoryClick('Olahraga')}
              className={`pb-1 transition-all cursor-pointer ${
                activeCategoryTab === 'Olahraga' 
                  ? 'text-black border-b-2 border-black' 
                  : 'text-neutral-700 hover:text-black border-b-2 border-transparent hover:border-black'
              }`}
            >
              Olahraga
            </button>
            <button
              type="button"
              onClick={() => handleNavCategoryClick('Koleksi')}
              className={`pb-1 transition-all cursor-pointer ${
                activeCategoryTab === 'Koleksi' 
                  ? 'text-black border-b-2 border-black' 
                  : 'text-neutral-700 hover:text-black border-b-2 border-transparent hover:border-black'
              }`}
            >
              Koleksi
            </button>
            <button
              type="button"
              onClick={() => handleNavCategoryClick('Sale')}
              className="text-red-600 hover:text-red-700 border-b-2 border-transparent hover:border-red-600 pb-1 transition-all cursor-pointer"
            >
              Outlet / Sale
            </button>
          </nav>

          {/* Right: Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input (Desktop) */}
            <div ref={desktopSearchRef} className="relative hidden lg:block w-56 xl:w-72">
              <input 
                type="text" 
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari produk..." 
                className="w-full bg-neutral-100 border border-neutral-200 px-4 py-2 pl-10 pr-8 text-sm focus:outline-none focus:border-black font-medium"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
              {renderSuggestionsDropdown()}
            </div>

            {/* Search Icon (Mobile & Tablet) */}
            <button 
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="lg:hidden text-neutral-800 hover:text-black p-1.5 cursor-pointer" 
              title="Cari"
            >
              <Search size={22} />
            </button>

            {/* Desktop User Menu (Hidden on Mobile/Tablet because it's inside the Hamburger Drawer) */}
            <div className="hidden lg:block">
              <UserMenuDropdown
                currentUser={currentUser}
                onOpenLogin={onOpenLogin}
                onOpenRegister={onOpenRegister}
                onOpenProfile={onOpenProfile}
                onOpenOrders={onOpenOrders}
                onOpenTransactions={onOpenTransactions}
                onOpenProductsAdmin={onOpenProductsAdmin}
                onOpenStock={onOpenStock}
                onOpenTemplates={onOpenTemplates}
                onOpenExpeditions={onOpenExpeditions}
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              />
            </div>

            {/* Wishlist Button */}
            <button 
              type="button"
              onClick={() => {
                const el = document.getElementById('product-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-neutral-800 hover:text-black p-1.5 cursor-pointer" 
              title="Wishlist"
            >
              <Heart size={22} />
            </button>

            {/* Shopping Bag Counter */}
            <button 
              type="button"
              onClick={onOpenCart}
              className="text-black p-1.5 flex items-center relative cursor-pointer group" 
              title="Tas Belanja"
            >
              <ShoppingBag size={24} className="group-hover:scale-105 transition-transform" />
              {cartCount > 0 && (
                <span className="bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center -ml-2 -mt-3 shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Search Dropdown Bar */}
        {isMobileSearchOpen && (
          <div ref={mobileSearchRef} className="lg:hidden p-3 bg-white border-t border-neutral-200 relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari sepatu, jersey..."
                className="w-full bg-neutral-100 border border-neutral-300 py-2 pl-9 pr-8 text-xs focus:outline-none focus:border-black font-medium"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {renderSuggestionsDropdown()}
          </div>
        )}
      </header>

      {/* ================= 3. HAMBURGER MENU DRAWER (Mobile & Tablet) ================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Off-Canvas Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs sm:max-w-sm bg-white shadow-2xl z-50 flex flex-col h-full max-h-screen animate-in slide-in-from-left duration-200">
            
            {/* Drawer Top Header (Fixed at top) */}
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
              <div 
                onClick={() => {
                  onResetHome();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-sport font-black text-lg -skew-x-6">
                  T
                </div>
                <div className="leading-none">
                  <span className="font-sport font-black text-lg tracking-tight uppercase">
                    TUSKO<span className="text-amber-500">.</span>
                  </span>
                  <span className="block text-[8px] font-bold tracking-widest text-neutral-400 uppercase">
                    Performance
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-neutral-600 hover:text-black rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                title="Tutup Menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Container (Fully scrollable for categories, orders, transactions, admin) */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              
              {/* User Account / Authentication Card */}
              <div className="p-4 bg-neutral-900 text-white border-b border-neutral-800">
                {currentUser ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {currentUser.avatar ? (
                        <img 
                          src={currentUser.avatar} 
                          alt={currentUser.name} 
                          className="w-10 h-10 rounded-full object-cover border border-amber-500 shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-500 text-black font-black text-sm flex items-center justify-center shrink-0">
                          {currentUser.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate">{currentUser.name}</div>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                          {currentUser.role === 'admin' ? '🛡️ Super Admin' : 'Member Tusko'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-none text-center transition-colors cursor-pointer"
                      >
                        Profil Saya
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onLogout();
                        }}
                        className="py-1.5 px-3 bg-neutral-800 hover:bg-red-950 text-red-400 hover:text-red-300 font-bold rounded-none text-center transition-colors cursor-pointer"
                      >
                        Keluar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs">
                      <span className="font-extrabold text-amber-400 uppercase tracking-wide block text-[10px]">TUSKO CLUB MEMBER</span>
                      <span className="text-neutral-300 text-[11px] leading-tight block mt-0.5">
                        Masuk untuk cek status pesanan &amp; peroleh diskon member seumur hidup.
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenLogin();
                        }}
                        className="py-2 px-3 bg-white text-black font-sport font-black uppercase text-center rounded-none hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        Masuk
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenRegister();
                        }}
                        className="py-2 px-3 bg-amber-500 text-black font-sport font-black uppercase text-center rounded-none hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        Daftar
                      </button>
                    </div>

                    {/* Demo Switcher shortcut */}
                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Akun Demo Cepat:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchUser({ id: 1, name: 'Akhyar Admin', role: 'admin', email: 'admin@tusko.id' });
                            setIsMobileMenuOpen(false);
                          }}
                          className="px-2 py-0.5 bg-neutral-800 text-amber-300 rounded font-bold hover:bg-neutral-700 cursor-pointer text-[10px]"
                        >
                          Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchUser({ id: 2, name: 'Budi Pembeli', role: 'customer', email: 'budi@gmail.com' });
                            setIsMobileMenuOpen(false);
                          }}
                          className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded font-bold hover:bg-neutral-700 cursor-pointer text-[10px]"
                        >
                          Member
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Categories */}
              <div className="p-4 space-y-4">
                <div>
                  <span className="text-[10px] font-black text-neutral-400 tracking-wider uppercase block mb-2">
                    KATEGORI PRODUK
                  </span>
                  <div className="space-y-1">
                    {[
                      { name: 'Semua Produk', actionName: 'Semua', isSale: false },
                      { name: 'Pria', actionName: 'Pria', isSale: false },
                      { name: 'Wanita', actionName: 'Wanita', isSale: false },
                      { name: 'Anak', actionName: 'Anak', isSale: false },
                      { name: 'Sepatu Olahraga', actionName: 'Sepatu', isSale: false },
                      { name: 'Jersey & Apparel', actionName: 'Jersey', isSale: false },
                      { name: 'Peralatan & Gym', actionName: 'Gym', isSale: false },
                      { name: 'Outlet & Sale', actionName: 'Sale', isSale: true, badge: 'HEMAT 50%' }
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          handleNavCategoryClick(item.actionName);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-left font-sport font-black text-xs uppercase tracking-wide transition-colors cursor-pointer ${
                          item.isSale 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'hover:bg-neutral-100 text-neutral-900'
                        }`}
                      >
                        <span>{item.name}</span>
                        {item.badge ? (
                          <span className="text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight size={15} className="text-neutral-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders and Transactions (Highlighted and Clickable) */}
                <div className="pt-3 border-t border-neutral-200">
                  <span className="text-[10px] font-black text-neutral-900 tracking-wider uppercase block mb-2">
                    PESANAN &amp; TRANSAKSI
                  </span>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenOrders();
                      }}
                      className="w-full flex items-center justify-between py-2.5 px-3 rounded-none text-left text-xs font-bold text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package size={16} className="text-black shrink-0" />
                        <span>Lacak Pesanan Saya</span>
                      </div>
                      <ChevronRight size={15} className="text-neutral-400 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenTransactions();
                      }}
                      className="w-full flex items-center justify-between py-2.5 px-3 rounded-none text-left text-xs font-bold text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet size={16} className="text-black shrink-0" />
                        <span>Buku Kas &amp; Transaksi</span>
                      </div>
                      <ChevronRight size={15} className="text-neutral-400 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Admin Management Section (If admin) */}
                {currentUser?.role === 'admin' && (
                  <div className="pt-3 border-t border-neutral-200">
                    <span className="text-[10px] font-black text-amber-700 tracking-wider uppercase block mb-2">
                      PANEL ADMINISTRATOR
                    </span>
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenProductsAdmin();
                        }}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-none text-left text-xs font-bold text-neutral-900 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Boxes size={16} className="text-amber-600 shrink-0" />
                          <span>Katalog Produk Admin</span>
                        </div>
                        <ChevronRight size={15} className="text-neutral-400 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenStock();
                        }}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-none text-left text-xs font-bold text-neutral-900 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Boxes size={16} className="text-amber-600 shrink-0" />
                          <span>Manajemen Stok &amp; Varian</span>
                        </div>
                        <ChevronRight size={15} className="text-neutral-400 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenTemplates();
                        }}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-none text-left text-xs font-bold text-neutral-900 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Boxes size={16} className="text-amber-600 shrink-0" />
                          <span>Template Master Produk</span>
                        </div>
                        <ChevronRight size={15} className="text-neutral-400 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenExpeditions();
                        }}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-none text-left text-xs font-bold text-neutral-900 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Truck size={16} className="text-amber-600 shrink-0" />
                          <span>Partner Ekspedisi (KiriminAja)</span>
                        </div>
                        <ChevronRight size={15} className="text-neutral-400 shrink-0" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Drawer Bottom Guarantee Badges */}
                <div className="pt-4 pb-8 border-t border-neutral-200 text-neutral-600 text-[11px] space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Truck size={15} className="text-black shrink-0" />
                    <span>Gratis Ongkir min. Rp 500.000</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw size={15} className="text-black shrink-0" />
                    <span>Garansi Tukar Ukuran 14 Hari</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
