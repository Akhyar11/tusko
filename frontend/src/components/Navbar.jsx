import React from 'react';
import { 
  Search, 
  ShoppingCart, 
  Bell, 
  Mail, 
  Smartphone, 
  HelpCircle, 
  Store,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ 
  cartCount = 2, 
  searchQuery = '', 
  onSearchChange = () => {},
  selectedCategory = null,
  onSelectCategory = () => {}
}) {
  const trendingSearches = [
    'Mechanical Keyboard', 
    'Smartphone 5G', 
    'Kaos Polos', 
    'TWS Bluetooth', 
    'Monitor 27 Inch'
  ];

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
          <div className="flex items-center gap-2 cursor-pointer select-none">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
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

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari di TokoOnline (misal: keyboard, baju, hp)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
            </div>

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
            <div className="relative cursor-pointer p-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-emerald-600 transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none">
                  {cartCount}
                </span>
              )}
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
