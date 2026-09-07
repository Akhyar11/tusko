import React from 'react';
import { ShieldCheck, Truck, Headphones, CreditCard, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-800 mt-16 pt-12 pb-8 text-neutral-400 text-xs">
      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 pb-12 border-b border-neutral-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h5 className="font-extrabold text-white text-sm uppercase tracking-wide">100% Original</h5>
              <p className="text-neutral-400 mt-0.5 text-[11px] leading-relaxed">Garansi keaslian produk dan garansi tukar ukuran 7 hari</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <h5 className="font-extrabold text-white text-sm uppercase tracking-wide">Pengiriman Cepat</h5>
              <p className="text-neutral-400 mt-0.5 text-[11px] leading-relaxed">Terintegrasi KiriminAja ke seluruh penjuru Indonesia</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 shrink-0">
              <CreditCard size={24} />
            </div>
            <div>
              <h5 className="font-extrabold text-white text-sm uppercase tracking-wide">Pembayaran Aman</h5>
              <p className="text-neutral-400 mt-0.5 text-[11px] leading-relaxed">Midtrans Snap (QRIS, VA Bank, E-Wallet) & Transfer Manual</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 shrink-0">
              <Headphones size={24} />
            </div>
            <div>
              <h5 className="font-extrabold text-white text-sm uppercase tracking-wide">Dukungan Komunitas</h5>
              <p className="text-neutral-400 mt-0.5 text-[11px] leading-relaxed">Layanan customer support responsif untuk atlet & pehobi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-950 font-black text-xs transform -skew-x-6">
              T
            </div>
            <span className="font-black text-white text-base tracking-tighter uppercase italic">
              TUSKO<span className="text-amber-400">.</span>
            </span>
          </div>
          <p className="text-neutral-400 text-[11px] leading-relaxed mb-3">
            Brand apparel olahraga dan perlengkapan performa tinggi. Dirancang untuk membantu setiap atlet dan pegiat kebugaran melampaui batas kemampuan.
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 rounded-lg text-[10px] font-bold text-amber-400 uppercase tracking-widest border border-neutral-800">
            <Zap size={12} className="fill-current" />
            Born To Perform
          </div>
        </div>
        <div>
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-3.5">Koleksi Tusko</h4>
          <ul className="space-y-2 text-neutral-400">
            <li><a href="#" className="hover:text-amber-400 transition-colors">Jersey Pro Matchday</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">HyperPace Carbon Shoes</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">Celana Training & Legging</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">Tas Gym & Duffle Bag</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">Kaos Kaki Grip Anti-Slip</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-3.5">Layanan & Garansi</h4>
          <ul className="space-y-2 text-neutral-400">
            <li><a href="#" className="hover:text-amber-400 transition-colors">Cek Status Pesanan</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">Garansi Tukar Ukuran</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">Panduan Ukuran (Size Chart)</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">Poin Loyalitas Atlet</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">Ketentuan Bebas Ongkir</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-3.5">Bantuan & Kontak</h4>
          <ul className="space-y-2 text-neutral-400">
            <li><a href="#" className="hover:text-amber-400 transition-colors">Pusat Bantuan CS</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">Syarat & Ketentuan</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">Kebijakan Privasi</a></li>
            <li><a href="#" className="hover:text-amber-400 transition-colors">Kemitraan Tim & Klub</a></li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-neutral-500 text-[11px]">
        <p>&copy; 2026 Tusko Sportswear & Performance. Hak Cipta Dilindungi.</p>
        <p>Tusko E-Commerce Olahraga & ERP System</p>
      </div>
    </footer>
  );
}
