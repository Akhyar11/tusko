import React from 'react';
import { ShieldCheck, Truck, Headphones, CreditCard } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12 pt-10 pb-8 text-gray-600 text-xs">
      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 pb-10 border-b border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h5 className="font-bold text-gray-900 text-sm">100% Aman & Terpercaya</h5>
              <p className="text-gray-500 mt-0.5 text-[11px]">Transaksi terenkripsi dan garansi produk asli</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Truck size={24} />
            </div>
            <div>
              <h5 className="font-bold text-gray-900 text-sm">Pengiriman Luas</h5>
              <p className="text-gray-500 mt-0.5 text-[11px]">Mendukung ekspedisi populer ke seluruh Indonesia</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard size={24} />
            </div>
            <div>
              <h5 className="font-bold text-gray-900 text-sm">Pembayaran Lengkap</h5>
              <p className="text-gray-500 mt-0.5 text-[11px]">Integrasi Midtrans (VA, QRIS, Kartu Kredit) & Transfer</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Headphones size={24} />
            </div>
            <div>
              <h5 className="font-bold text-gray-900 text-sm">Layanan Pelanggan</h5>
              <p className="text-gray-500 mt-0.5 text-[11px]">Siap membantu setiap pertanyaan dan kendala pesanan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-3">TokoOnline</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-emerald-600">Tentang Kami</a></li>
            <li><a href="#" className="hover:text-emerald-600">Karir</a></li>
            <li><a href="#" className="hover:text-emerald-600">Blog Toko</a></li>
            <li><a href="#" className="hover:text-emerald-600">Mitra TokoOnline</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-3">Beli</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-emerald-600">Tagihan & Top Up</a></li>
            <li><a href="#" className="hover:text-emerald-600">TokoOnline COD</a></li>
            <li><a href="#" className="hover:text-emerald-600">Bebas Ongkir</a></li>
            <li><a href="#" className="hover:text-emerald-600">Promo Hari Ini</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-3">Jual</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-emerald-600">Pusat Edukasi Seller</a></li>
            <li><a href="#" className="hover:text-emerald-600">Daftar Official Store</a></li>
            <li><a href="#" className="hover:text-emerald-600">Mitra Logistik</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-3">Bantuan & Panduan</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-emerald-600">TokoOnline Care</a></li>
            <li><a href="#" className="hover:text-emerald-600">Syarat dan Ketentuan</a></li>
            <li><a href="#" className="hover:text-emerald-600">Kebijakan Privasi</a></li>
            <li><a href="#" className="hover:text-emerald-600">Panduan Keamanan</a></li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-gray-400 text-[11px]">
        <p>&copy; 2026 TokoOnline Platform E-Commerce Mandiri. Hak Cipta Dilindungi.</p>
        <p>Ditenagai oleh React + Laravel Architecture</p>
      </div>
    </footer>
  );
}
