import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  ShoppingBag, 
  Wallet, 
  Boxes, 
  Mail, 
  Truck, 
  ChevronDown, 
  Sparkles, 
  Award, 
  Users,
  Package
} from 'lucide-react';
import { mockDemoUsers } from '../data/mockAuthData';

export default function UserMenuDropdown({
  currentUser = null,
  onOpenLogin = () => {},
  onOpenRegister = () => {},
  onOpenProfile = () => {},
  onOpenOrders = () => {},
  onOpenTransactions = () => {},
  onOpenProductsAdmin = () => {},
  onOpenStock = () => {},
  onOpenTemplates = () => {},
  onOpenExpeditions = () => {},
  onLogout = () => {},
  onSwitchUser = () => {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (callback) => {
    setIsOpen(false);
    callback();
  };

  const handleQuickLogin = (demoUser) => {
    onSwitchUser(demoUser);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {currentUser ? (
        /* Logged In Trigger */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          title="Menu Akun Saya"
          aria-expanded={isOpen}
        >
          {currentUser.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-7 h-7 rounded-full object-cover border border-amber-500/50 shadow-xs" 
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-white max-w-[110px] truncate">
              {currentUser.name}
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-0.5">
              {currentUser.role === 'admin' ? (
                <>
                  <ShieldCheck size={10} className="text-amber-400 inline" />
                  <span>Admin</span>
                </>
              ) : (
                <>
                  <Award size={10} className="text-amber-400 inline" />
                  <span>Member</span>
                </>
              )}
            </span>
          </div>
          <ChevronDown 
            size={14} 
            className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} 
          />
        </button>
      ) : (
        /* Guest Trigger (Not Logged In) */
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button 
            type="button"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-200 border border-neutral-700 rounded-xl hover:bg-neutral-800 hover:border-neutral-600 transition-colors cursor-pointer"
          >
            <LogIn size={13} className="text-neutral-400" />
            <span>Masuk</span>
          </button>
          <button 
            type="button"
            onClick={onOpenRegister}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus size={13} />
            <span>Daftar</span>
          </button>
          
          {/* Quick Demo Login Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Coba Akun Demo Cepat"
          >
            <Sparkles size={16} />
          </button>
        </div>
      )}

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {currentUser ? (
            /* Logged In Content */
            <div>
              {/* User Header Summary Card */}
              <div className="p-4 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  {currentUser.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-500/60 shadow-md shrink-0" 
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-amber-500 text-neutral-950 font-black text-lg flex items-center justify-center shadow-md shrink-0">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{currentUser.name}</h4>
                    <p className="text-[11px] text-neutral-400 truncate">{currentUser.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${
                        currentUser.role === 'admin' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {currentUser.role === 'admin' ? '🛡️ Super Admin' : '⭐ Member VIP'}
                      </span>
                      {currentUser.points !== undefined && (
                        <span className="text-[10px] text-neutral-400 font-medium">
                          💎 {currentUser.points.toLocaleString('id-ID')} Poin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-2 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleAction(onOpenProfile)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                >
                  <User size={16} className="text-amber-400 shrink-0" />
                  <span>Profil & Informasi Akun</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onOpenOrders)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                >
                  <ShoppingBag size={16} className="text-sky-400 shrink-0" />
                  <span>Daftar Pesanan Toko</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onOpenTransactions)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                >
                  <Wallet size={16} className="text-emerald-400 shrink-0" />
                  <span>Catatan Transaksi & Kas</span>
                </button>
              </div>

              {/* Admin Shortcuts (If admin) */}
              {currentUser.role === 'admin' && (
                <div className="p-2 border-t border-neutral-900 bg-neutral-900/40">
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Akses Khusus Administrator
                  </div>
                  <div className="space-y-0.5 mt-1">
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenProductsAdmin)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                    >
                      <Package size={14} className="text-amber-400 shrink-0" />
                      <span>Manajemen Produk & Katalog</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenStock)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                    >
                      <Boxes size={14} className="text-amber-400 shrink-0" />
                      <span>Manajemen Stok Gudang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenTemplates)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                    >
                      <Mail size={14} className="text-amber-400 shrink-0" />
                      <span>Template Email & Resi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenExpeditions)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                    >
                      <Truck size={14} className="text-amber-400 shrink-0" />
                      <span>Pengaturan Ekspedisi & Ongkir</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Switch Demo Account */}
              <div className="p-2 border-t border-neutral-900">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                  <span>Ganti Akun Demo</span>
                  <Users size={12} className="text-neutral-500" />
                </div>
                <div className="space-y-1 mt-1">
                  {mockDemoUsers.map((demo) => {
                    const isCurrent = currentUser.id === demo.id;
                    return (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => handleQuickLogin(demo)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer text-left ${
                          isCurrent 
                            ? 'bg-amber-500/15 border border-amber-500/30 text-white font-bold' 
                            : 'hover:bg-neutral-800 text-neutral-300 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={demo.avatar} 
                            alt={demo.name} 
                            className="w-5 h-5 rounded-full object-cover shrink-0" 
                          />
                          <span className="truncate">{demo.name}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                          demo.role === 'admin' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
                        }`}>
                          {demo.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-2 border-t border-neutral-800 bg-neutral-950">
                <button
                  type="button"
                  onClick={() => handleAction(onLogout)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Keluar dari Akun (Logout)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Guest / Demo Quick Picker Content */
            <div>
              <div className="p-4 bg-gradient-to-br from-neutral-900 to-neutral-950 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
                  <Sparkles size={14} />
                  <span>Akun Demo Cepat</span>
                </div>
                <p className="text-xs text-neutral-300">
                  Pilih salah satu profil demo di bawah untuk langsung mencoba aplikasi:
                </p>
              </div>

              <div className="p-2 space-y-1">
                {mockDemoUsers.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleQuickLogin(demo)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={demo.avatar} 
                        alt={demo.name} 
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-700 group-hover:border-amber-500 transition-colors" 
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate text-xs">{demo.name}</div>
                        <div className="text-[10px] text-neutral-400 truncate">{demo.email}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
                      demo.role === 'admin' 
                        ? 'bg-amber-500 text-neutral-950' 
                        : 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                    }`}>
                      {demo.role === 'admin' ? '🛡️ Admin' : '⭐ Member'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-neutral-800 bg-neutral-900/50 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAction(onOpenLogin)}
                  className="flex-1 py-2 text-center text-xs font-bold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
                >
                  Form Masuk
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(onOpenRegister)}
                  className="flex-1 py-2 text-center text-xs font-black text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Daftar Akun
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
