import React from 'react';

export default function Footer({
  onSelectCategory = () => {},
  onOpenOrders = () => {},
  onNavigateLegal = () => {},
  storeProfile = {},
  navCategories = [],
  onNavigateCategory = null
}) {
  const brandName = storeProfile?.legal_name || storeProfile?.name || 'Toko';
  const whatsapp = String(storeProfile?.whatsapp || '').replace(/\D/g, '');
  const aboutExcerpt = String(storeProfile?.about_text || '').trim().split(/\n{2,}/)[0] || '';
  const returnDays = storeProfile?.return_window_days;

  const FALLBACK_PRIMARY = ['Sepatu Lari', 'Jersey Timnas', 'Celana Kompresi', 'Aksesoris Olahraga'];
  const FALLBACK_SECONDARY = ['Running', 'Football', 'Training & Gym', 'Basketball'];
  const categories = Array.isArray(navCategories) ? navCategories.filter((c) => c?.name) : [];
  const half = Math.ceil(categories.length / 2);
  const primaryCats = categories.length > 0 ? categories.slice(0, half) : null;
  const secondaryCats = categories.length > 0 ? categories.slice(half) : null;

  const goCategory = (cat) => {
    if (onNavigateCategory) onNavigateCategory(cat);
    else onSelectCategory(cat.name);
  };

  return (
    <footer className="bg-black text-white pt-12 sm:pt-16 pb-12 border-t border-neutral-800 w-full">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-neutral-800 text-xs">
          <div>
            <h4 className="font-sport font-black text-xs sm:text-sm uppercase tracking-wider mb-3 text-white">
              PRODUK
            </h4>
            <ul className="space-y-2 text-neutral-400">
              {(primaryCats || FALLBACK_PRIMARY).map((item, idx) => (
                <li key={primaryCats ? (item.id ?? idx) : idx}>
                  <button
                    type="button"
                    onClick={() => (primaryCats ? goCategory(item) : onSelectCategory(item))}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {primaryCats ? item.name : item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sport font-black text-xs sm:text-sm uppercase tracking-wider mb-3 text-white">
              OLAHRAGA
            </h4>
            <ul className="space-y-2 text-neutral-400">
              {(secondaryCats || FALLBACK_SECONDARY).map((item, idx) => (
                <li key={secondaryCats ? (item.id ?? idx) : idx}>
                  <button
                    type="button"
                    onClick={() => (secondaryCats ? goCategory(item) : onSelectCategory(item))}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {secondaryCats ? item.name : item}
                  </button>
                </li>
              ))}
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
                <button
                  type="button"
                  onClick={() => onNavigateLegal('shipping')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Kebijakan Pengiriman
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateLegal('refund')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Kebijakan Retur{returnDays ? ` ${returnDays} Hari` : ''}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateLegal('faq')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateLegal('contact')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Hubungi Kami
                </button>
              </li>
              {whatsapp && (
                <li>
                  <a 
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank" 
                    rel="noreferrer" 
                    className="hover:text-white transition-colors"
                  >
                    WhatsApp CS
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-sport font-black text-xs sm:text-sm uppercase tracking-wider mb-3 text-white">
              TENTANG {String(brandName).toUpperCase()}
            </h4>
            {aboutExcerpt ? (
              <p className="text-neutral-400 leading-relaxed mb-3">{aboutExcerpt}</p>
            ) : (
              <p className="text-neutral-400 leading-relaxed mb-3">Profil toko belum diatur.</p>
            )}
            <button
              type="button"
              onClick={() => onNavigateLegal('about')}
              className="text-amber-400 hover:text-amber-300 font-sport font-black uppercase tracking-wider text-[11px] cursor-pointer"
            >
              Selengkapnya
            </button>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-4 text-center sm:text-left">
          <div>&copy; {new Date().getFullYear()} {brandName}. Seluruh hak cipta dilindungi.</div>
          <div className="flex gap-4">
            <button type="button" onClick={() => onNavigateLegal('privacy')} className="hover:underline cursor-pointer">Privasi</button>
            <button type="button" onClick={() => onNavigateLegal('terms')} className="hover:underline cursor-pointer">Syarat &amp; Ketentuan</button>
            <button type="button" onClick={() => onNavigateLegal('shipping')} className="hover:underline cursor-pointer">Pengiriman</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
