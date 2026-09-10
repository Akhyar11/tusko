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
        /* Logged In Trigger - Sharp Angular Tusko Style (rounded-none) */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-3 py-2 border transition-all cursor-pointer text-left focus:outline-none rounded-none ${
            isOpen
              ? 'bg-neutral-100 border-black text-black'
              : 'bg-white hover:bg-neutral-50 border-neutral-300 hover:border-black text-neutral-800'
          }`}
          title="Menu Akun Saya"
          aria-expanded={isOpen}
        >
          {currentUser.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-7 h-7 object-cover border border-neutral-300 rounded-none shrink-0" 
            />
          ) : (
            <div className="w-7 h-7 bg-black text-white font-black text-xs flex items-center justify-center rounded-none shrink-0">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-black uppercase text-neutral-900 max-w-[120px] truncate font-sport">
              {currentUser.name}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
              {currentUser.role === 'admin' ? (
                <>
                  <ShieldCheck size={11} className="text-amber-600 inline" />
                  <span className="text-amber-700 font-bold">Admin</span>
                </>
              ) : (
                <span>Member</span>
              )}
            </span>
          </div>
          <ChevronDown 
            size={14} 
            className={`text-neutral-500 transition-transform duration-150 ${isOpen ? 'rotate-180 text-black' : ''}`} 
          />
        </button>
      ) : (
        /* Guest Trigger (Not Logged In) - Sharp Angular Tusko Style (rounded-none) */
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button 
            type="button"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wider text-neutral-800 border border-neutral-300 hover:border-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer"
          >
            <LogIn size={13} className="text-neutral-600" />
            <span>Masuk</span>
          </button>
          <button 
            type="button"
            onClick={onOpenRegister}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-none shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus size={13} />
            <span>Daftar</span>
          </button>
          
          {/* Quick Demo Login Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer border border-transparent hover:border-neutral-300"
            title="Coba Akun Demo Cepat"
          >
            <Sparkles size={16} />
          </button>
        </div>
      )}

      {/* DROPDOWN MENU - Sharp Angular Tusko Style (rounded-none) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-72 sm:w-80 bg-white border border-neutral-300 shadow-2xl z-50 text-xs rounded-none animate-in fade-in slide-in-from-top-1 duration-150">
          {currentUser ? (
            /* Logged In Content */
            <div>
              {/* User Header Summary Card */}
              <div className="p-4 bg-neutral-50 border-b border-neutral-200 rounded-none">
                <div className="flex items-center gap-3">
                  {currentUser.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-11 h-11 object-cover border border-neutral-300 rounded-none shadow-xs shrink-0" 
                    />
                  ) : (
                    <div className="w-11 h-11 bg-black text-white font-black text-base flex items-center justify-center rounded-none shadow-xs shrink-0">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black uppercase text-neutral-900 truncate font-sport">{currentUser.name}</h4>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">{currentUser.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-none uppercase tracking-wider border ${
                        currentUser.role === 'admin' 
                          ? 'bg-amber-50 text-amber-800 border-amber-300' 
                          : 'bg-white text-neutral-800 border-neutral-300'
                      }`}>
                        {currentUser.role === 'admin' ? '🛡️ Admin' : 'Member'}
                      </span>
                      {currentUser.points !== undefined && (
                        <span className="text-[10px] text-neutral-600 font-bold bg-neutral-200/70 px-2 py-0.5 rounded-none">
                          💎 {currentUser.points.toLocaleString('id-ID')} Poin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleAction(onOpenProfile)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer text-left font-bold text-xs uppercase group"
                >
                  <User size={15} className="text-neutral-500 group-hover:text-black transition-colors shrink-0" />
                  <span>Profil &amp; Informasi Akun</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onOpenOrders)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer text-left font-bold text-xs uppercase group"
                >
                  <ShoppingBag size={15} className="text-neutral-500 group-hover:text-black transition-colors shrink-0" />
                  <span>Daftar Pesanan Toko</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onOpenTransactions)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer text-left font-bold text-xs uppercase group"
                >
                  <Wallet size={15} className="text-neutral-500 group-hover:text-black transition-colors shrink-0" />
                  <span>Catatan Transaksi &amp; Kas</span>
                </button>
              </div>

              {/* Admin Shortcuts (If admin) */}
              {currentUser.role === 'admin' && (
                <div className="p-1 border-t border-neutral-200 bg-neutral-50 rounded-none">
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    Akses Khusus Administrator
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenProductsAdmin)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer text-left font-bold text-xs uppercase group"
                    >
                      <Package size={14} className="text-neutral-500 group-hover:text-black shrink-0" />
                      <span>Manajemen Produk &amp; Katalog</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenStock)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer text-left font-bold text-xs uppercase group"
                    >
                      <Boxes size={14} className="text-neutral-500 group-hover:text-black shrink-0" />
                      <span>Manajemen Stok Gudang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenTemplates)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer text-left font-bold text-xs uppercase group"
                    >
                      <Mail size={14} className="text-neutral-500 group-hover:text-black shrink-0" />
                      <span>Template Email &amp; Resi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(onOpenExpeditions)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer text-left font-bold text-xs uppercase group"
                    >
                      <Truck size={14} className="text-neutral-500 group-hover:text-black shrink-0" />
                      <span>Pengaturan Ekspedisi &amp; Ongkir</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Switch Demo Account */}
              <div className="p-1 border-t border-neutral-200 bg-white rounded-none">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                  <span>Ganti Akun Demo</span>
                  <Users size={12} className="text-neutral-400" />
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {mockDemoUsers.map((demo) => {
                    const isCurrent = currentUser.id === demo.id;
                    return (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => handleQuickLogin(demo)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-none transition-colors cursor-pointer text-left ${
                          isCurrent 
                            ? 'bg-neutral-100 border border-neutral-400 text-black font-bold' 
                            : 'hover:bg-neutral-50 text-neutral-700 border border-transparent font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={demo.avatar} 
                            alt={demo.name} 
                            className="w-5 h-5 object-cover shrink-0 border border-neutral-300 rounded-none" 
                          />
                          <span className="truncate text-xs font-semibold">{demo.name}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-none font-bold uppercase ${
                          demo.role === 'admin' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-neutral-200 text-neutral-700'
                        }`}>
                          {demo.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-2 border-t border-neutral-200 bg-neutral-50 rounded-none">
                <button
                  type="button"
                  onClick={() => handleAction(onLogout)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-none transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Keluar dari Akun (Logout)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Guest / Demo Quick Picker Content */
            <div>
              <div className="p-4 bg-neutral-50 border-b border-neutral-200 rounded-none">
                <div className="flex items-center gap-2 text-neutral-900 font-black text-xs uppercase tracking-wider mb-1 font-sport">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Akun Demo Cepat</span>
                </div>
                <p className="text-xs text-neutral-500">
                  Pilih salah satu profil demo di bawah untuk langsung mencoba aplikasi:
                </p>
              </div>

              <div className="p-1 space-y-0.5">
                {mockDemoUsers.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleQuickLogin(demo)}
                    className="w-full flex items-center justify-between p-2.5 rounded-none hover:bg-neutral-50 transition-colors cursor-pointer text-left group border border-transparent hover:border-neutral-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={demo.avatar} 
                        alt={demo.name} 
                        className="w-8 h-8 object-cover shrink-0 border border-neutral-300 rounded-none" 
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-neutral-900 truncate text-xs">{demo.name}</div>
                        <div className="text-[10px] text-neutral-500 truncate">{demo.email}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-none font-bold uppercase tracking-wider shrink-0 ${
                      demo.role === 'admin' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                    }`}>
                      {demo.role === 'admin' ? '🛡️ Admin' : 'Member'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-neutral-200 bg-neutral-50 flex gap-2 rounded-none">
                <button
                  type="button"
                  onClick={() => handleAction(onOpenLogin)}
                  className="flex-1 py-2 text-center text-xs font-black uppercase tracking-wider text-neutral-800 hover:text-black bg-white hover:bg-neutral-100 border border-neutral-300 rounded-none transition-colors cursor-pointer"
                >
                  Form Masuk
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(onOpenRegister)}
                  className="flex-1 py-2 text-center text-xs font-black uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-none transition-colors cursor-pointer"
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
