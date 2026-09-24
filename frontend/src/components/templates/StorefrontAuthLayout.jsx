import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * Template: StorefrontAuthLayout
 * Kerangka halaman autentikasi storefront (announcement bar, header, konten, footer).
 * Dipakai halaman Login/Register/Lupa & Reset kata sandi agar konsisten dan bebas duplikasi.
 */
export default function StorefrontAuthLayout({
  badgeText = 'AKUN RESMI MEMBER TUSKO CLUB',
  headerAction = null,
  onBackToHome = () => {},
  children
}) {
  return (
    <div className="bg-neutral-50 text-neutral-950 antialiased selection:bg-black selection:text-white min-h-screen flex flex-col justify-between">
      <div className="bg-black text-white text-[11px] font-bold py-2 px-4 text-center tracking-wider uppercase">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <ShieldCheck className="text-amber-400 shrink-0" size={15} />
          <span>{badgeText}</span>
        </div>
      </div>

      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 group shrink-0 cursor-pointer text-left"
          >
            <div className="w-9 sm:w-11 h-9 sm:h-10 bg-black text-white flex items-center justify-center font-sport font-black text-xl sm:text-2xl tracking-tighter -skew-x-6 group-hover:bg-neutral-800 transition-colors">
              T
            </div>
            <div className="leading-none">
              <span className="font-sport font-black text-xl sm:text-2xl tracking-tight uppercase text-black">
                TUSKO<span className="text-amber-500">.</span>
              </span>
              <span className="block text-[8px] sm:text-[9px] font-bold tracking-widest text-neutral-400 uppercase">
                Performance
              </span>
            </div>
          </button>

          {headerAction}
        </div>
      </header>

      <main className="max-w-lg w-full mx-auto px-4 py-8 sm:py-12 flex-1">
        {children}
      </main>

      <footer className="bg-white border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 text-[11px]">
          &copy; 2026 PT Tusko Performance Indonesia. Seluruh hak cipta dilindungi.
        </div>
      </footer>
    </div>
  );
}
