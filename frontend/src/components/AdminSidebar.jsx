import React, { useState } from 'react';
import { 
  LayoutDashboard,
  Package, 
  Boxes, 
  ShoppingBag, 
  Wallet, 
  Truck, 
  Mail, 
  Store, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X, 
  ChevronRight,
  Sparkles,
  ClipboardList
} from 'lucide-react';

export default function AdminSidebar({
  currentView = 'admin-dashboard',
  onNavigate = () => {},
  currentUser = null,
  onLogout = () => {},
  onBackToStore = () => {},
  orderCount = 0,
  lowStockCount = 0
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    {
      id: 'admin-dashboard',
      label: 'Ringkasan Dashboard',
      sublabel: 'KPI revenue & performa toko',
      icon: LayoutDashboard,
      activeViews: ['admin-dashboard']
    },
    {
      id: 'products-admin',
      label: 'Produk & Katalog',
      sublabel: 'Kelola SKU, varian, dan harga',
      icon: Package,
      activeViews: ['products-admin', 'product-create', 'product-edit']
    },
    {
      id: 'stock',
      label: 'Manajemen Stok',
      sublabel: 'Stok fisik gudang & restock',
      icon: Boxes,
      activeViews: ['stock'],
      badge: lowStockCount > 0 ? `${lowStockCount} Perlu Restok` : null,
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300'
    },
    {
      id: 'orders',
      label: 'Daftar Pesanan',
      sublabel: 'Antrean order & cetak resi',
      icon: ShoppingBag,
      activeViews: ['orders', 'order-detail'],
      badge: orderCount > 0 ? `${orderCount}` : null,
      badgeColor: 'bg-neutral-200 text-neutral-900'
    },
    {
      id: 'procurement',
      label: 'Pengadaan & Vendor (PO)',
      sublabel: 'PO supplier, GRN & tagihan',
      icon: ClipboardList,
      activeViews: ['procurement']
    },
    {
      id: 'transactions',
      label: 'Buku Kas & Transaksi',
      sublabel: 'Arus kas masuk & pengeluaran',
      icon: Wallet,
      activeViews: ['transactions']
    },
    {
      id: 'expeditions',
      label: 'Pengaturan Ekspedisi',
      sublabel: 'Kurir aktif & tarif ongkir',
      icon: Truck,
      activeViews: ['expeditions']
    },
    {
      id: 'templates',
      label: 'Template Email & Resi',
      sublabel: 'Format surat jalan & invoice',
      icon: Mail,
      activeViews: ['templates']
    }
  ];

  const handleItemClick = (viewId) => {
    setIsMobileOpen(false);
    onNavigate(viewId);
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white text-neutral-900">
      {/* 1. Top Section: Branding & Admin Profile */}
      <div className="border-b border-neutral-200 p-5 bg-neutral-50 rounded-none">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-sport font-black text-base rounded-none">
              T
            </div>
            <div>
              <div className="font-sport font-black text-base tracking-tight uppercase leading-none text-neutral-950">
                TUSKO<span className="text-amber-500">.</span>
              </div>
              <div className="text-[9px] font-black tracking-widest text-neutral-500 uppercase font-mono mt-0.5">
                ADMIN PANEL
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-none uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse"></span>
            <span>Online</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-neutral-300 p-3 rounded-none flex items-center gap-3">
          {currentUser?.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-10 h-10 object-cover border border-neutral-300 rounded-none shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 bg-black text-white font-black text-sm flex items-center justify-center rounded-none shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-sport font-black text-xs uppercase text-neutral-950 truncate">
              {currentUser?.name || 'Admin Tusko'}
            </div>
            <div className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
              <ShieldCheck size={11} className="shrink-0" />
              <span>Administrator</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Navigation Menu Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
          Menu Operasional
        </div>

        {menuItems.map((item) => {
          const isActive = item.activeViews.includes(currentView);
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between p-3 transition-all rounded-none text-left cursor-pointer border ${
                isActive
                  ? 'bg-black border-black text-white shadow-xs'
                  : 'bg-white hover:bg-neutral-100 border-transparent hover:border-neutral-300 text-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 flex items-center justify-center rounded-none shrink-0 border ${
                  isActive 
                    ? 'bg-neutral-900 border-neutral-700 text-amber-400' 
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}>
                  <IconComponent size={16} />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-black uppercase font-sport tracking-wide truncate ${
                    isActive ? 'text-white' : 'text-neutral-950'
                  }`}>
                    {item.label}
                  </div>
                  <div className={`text-[10px] truncate ${
                    isActive ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    {item.sublabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-none tracking-wider ${
                    isActive ? 'bg-amber-400 text-black' : item.badgeColor
                  }`}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight 
                  size={14} 
                  className={isActive ? 'text-amber-400' : 'text-neutral-400'} 
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Bottom Section: Quick Actions (Storefront & Logout) */}
      <div className="border-t border-neutral-200 p-3 bg-neutral-50 space-y-2 rounded-none">
        <button
          type="button"
          onClick={() => {
            setIsMobileOpen(false);
            onBackToStore();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-neutral-100 text-neutral-900 font-sport font-black uppercase text-xs border border-neutral-300 hover:border-black rounded-none transition-colors cursor-pointer"
        >
          <Store size={15} className="text-amber-600" />
          <span>Lihat Etalase Toko</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsMobileOpen(false);
            onLogout();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-900 hover:bg-red-700 text-white font-sport font-black uppercase text-xs rounded-none transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          <span>Keluar Sesi Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Spacer to preserve layout width in flex container on desktop */}
      <div className="hidden lg:block w-72 xl:w-80 shrink-0" aria-hidden="true" />

      {/* ================= DESKTOP FIXED LEFT SIDEBAR ================= */}
      <aside 
        className="hidden lg:flex flex-col w-72 xl:w-80 h-screen fixed top-0 left-0 border-r border-neutral-300 z-30 shadow-xs bg-white"
        aria-label="Navigasi Panel Admin"
      >
        {sidebarContent}
      </aside>

      {/* ================= MOBILE / TABLET LEFT DRAWER TOGGLE & DRAWER ================= */}
      {/* Mobile Top Floating Bar */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-black text-white font-sport font-black uppercase text-xs rounded-none shadow-xl border border-neutral-800 cursor-pointer hover:bg-neutral-900 transition-colors"
          title="Buka Navigasi Admin"
        >
          <Menu size={16} className="text-amber-400" />
          <span>Menu Admin</span>
        </button>
      </div>

      {/* Mobile Left Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-start animate-in fade-in duration-150">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Content on the LEFT */}
          <div className="relative w-72 sm:w-80 h-full bg-white z-10 shadow-2xl flex flex-col border-r border-neutral-300 animate-in slide-in-from-left duration-200 rounded-none">
            {/* Close Button Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black text-white border-b border-neutral-800 rounded-none">
              <span className="font-sport font-black text-xs uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                Navigasi Admin
              </span>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-none cursor-pointer"
                title="Tutup Menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
