import React from 'react';

export default function Footer({
  onSelectCategory = () => {},
  onOpenOrders = () => {}
}) {
  return (
    <footer className="bg-black text-white pt-12 sm:pt-16 pb-12 border-t border-neutral-800 w-full">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-neutral-800 text-xs">
          <div>
            <h4 className="font-sport font-black text-xs sm:text-sm uppercase tracking-wider mb-3 text-white">
              PRODUK
            </h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory('Sepatu')} 
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Sepatu Lari
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory('Jersey')} 
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Jersey Timnas
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory('Celana')} 
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Celana Kompresi
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory('Aksesoris')} 
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Aksesoris Olahraga
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-sport font-black text-xs sm:text-sm uppercase tracking-wider mb-3 text-white">
              OLAHRAGA
            </h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory('Running')} 
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Running
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory('Football')} 
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Football
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory('Training')} 
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Training &amp; Gym
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory('Basketball')} 
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Basketball
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-sport font-black text-xs sm:text-sm uppercase tracking-wider mb-3 text-white">
              BANTUAN
            </h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <button 
                  type="button" 
                  onClick={onOpenOrders} 
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Status Pesanan
                </button>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Tarif Pengiriman
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Kebijakan Retur 14 Hari
                </span>
              </li>
              <li>
                <a 
                  href="https://wa.me/628123456789" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-white transition-colors"
                >
                  WhatsApp CS
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-sport font-black text-xs sm:text-sm uppercase tracking-wider mb-3 text-white">
              TENTANG TUSKO
            </h4>
            <p className="text-neutral-400 leading-relaxed mb-3">
              Brand olahraga performa tinggi buatan Indonesia dengan standar kelas dunia.
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-4 text-center sm:text-left">
          <div>&copy; 2026 PT Tusko Performance Indonesia. Seluruh hak cipta dilindungi.</div>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">Privasi</span>
            <span className="hover:underline cursor-pointer">Syarat &amp; Ketentuan</span>
            <span className="hover:underline cursor-pointer">Panduan Ukuran</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
