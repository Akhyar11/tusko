import React from 'react';
import { Search, Heart, ShoppingCart, User } from 'lucide-react';

function parseList(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Organism: StorefrontPreview — pratinjau langsung (WYSIWYG) konten halaman depan
 * dari nilai Settings Hub (grup `storefront`). Read-only, mengikuti draft terkini.
 */
export default function StorefrontPreview({ values = {} }) {
  const v = values;
  const chips = parseList(v['storefront.popular_chips']);
  const sports = parseList(v['storefront.sports_cards']);
  const promos = parseList(v['storefront.promo_banners']);

  const brand = v['storefront.brand_name'] || v['store.brand_name'] || 'TUSKO';
  const tagline = v['storefront.brand_tagline'] || 'Performance';

  return (
    <div className="border border-neutral-300 rounded-none bg-neutral-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-950 text-neutral-400 text-[10px] font-mono">
        <span className="w-2 h-2 bg-rose-500 rounded-none" />
        <span className="w-2 h-2 bg-amber-400 rounded-none" />
        <span className="w-2 h-2 bg-emerald-500 rounded-none" />
        <span className="ml-2">pratinjau storefront (live)</span>
      </div>

      <div className="bg-white">
        {/* Announcement */}
        {v['storefront.announcement_enabled'] !== false && v['storefront.announcement_text'] && (
          <div className="bg-black text-white text-[10px] font-bold py-1.5 px-3 text-center uppercase tracking-wider">
            {v['storefront.announcement_text']}
          </div>
        )}

        {/* Navbar mini */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-black text-white flex items-center justify-center font-black text-sm -skew-x-6">T</div>
            <div className="leading-none">
              <span className="font-black text-sm tracking-tight uppercase text-neutral-950">{brand}</span>
              {tagline && <span className="block text-[8px] font-bold tracking-widest text-neutral-400 uppercase">{tagline}</span>}
            </div>
          </div>
          <div className="flex-1 hidden sm:flex items-center gap-2 h-8 px-3 bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-400">
            <Search size={12} />
            <span className="truncate">{v['storefront.search_placeholder'] || 'Cari produk...'}</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600 shrink-0">
            <Heart size={15} />
            <ShoppingCart size={15} />
            <User size={15} />
          </div>
        </div>

        {/* Hero */}
        {v['storefront.hero_enabled'] !== false && (
          <div className="bg-neutral-950 text-white px-5 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              {v['storefront.hero_badge'] && (
                <span className="inline-block bg-white text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 mb-2">{v['storefront.hero_badge']}</span>
              )}
              <h2 className="font-black text-lg uppercase leading-tight">{v['storefront.hero_title'] || 'Judul Hero'}</h2>
              {v['storefront.hero_subtitle'] && <p className="text-[11px] text-neutral-300 mt-1 max-w-md">{v['storefront.hero_subtitle']}</p>}
              <div className="flex items-center gap-2 mt-3">
                {v['storefront.hero_cta_primary'] && <span className="bg-white text-black text-[10px] font-black uppercase px-3 py-1.5">{v['storefront.hero_cta_primary']}</span>}
                {v['storefront.hero_cta_secondary'] && <span className="border border-white text-white text-[10px] font-black uppercase px-3 py-1.5">{v['storefront.hero_cta_secondary']}</span>}
              </div>
            </div>
            <div className="relative w-full sm:w-48 h-28 bg-neutral-800 shrink-0 overflow-hidden">
              {v['storefront.hero_image_url'] ? (
                <img src={v['storefront.hero_image_url']} alt="Hero" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 text-[10px]">Gambar Hero</div>
              )}
              {v['storefront.hero_price_badge'] && (
                <span className="absolute bottom-0 right-0 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5">{v['storefront.hero_price_badge']}</span>
              )}
            </div>
          </div>
        )}

        {/* Popular chips */}
        {v['storefront.popular_enabled'] !== false && chips.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-200 overflow-x-auto">
            {v['storefront.popular_heading'] && <span className="text-[9px] font-black uppercase text-neutral-400 shrink-0">{v['storefront.popular_heading']}</span>}
            {chips.map((c, i) => (
              <span key={i} className="text-[10px] font-bold border border-neutral-300 px-2 py-0.5 shrink-0 whitespace-nowrap">{c.label || c.query}</span>
            ))}
          </div>
        )}

        {/* Sports cards */}
        {v['storefront.sports_enabled'] !== false && sports.length > 0 && (
          <div className="px-4 py-4">
            {v['storefront.sports_heading'] && <h3 className="font-black uppercase text-sm mb-0.5">{v['storefront.sports_heading']}</h3>}
            {v['storefront.sports_subheading'] && <p className="text-[10px] text-neutral-500 mb-3">{v['storefront.sports_subheading']}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sports.slice(0, 4).map((s, i) => (
                <div key={i} className="relative bg-neutral-900 text-white overflow-hidden">
                  <div className="h-20 bg-neutral-800">
                    {s.image_url && <img src={s.image_url} alt={s.title} className="w-full h-full object-cover opacity-80" />}
                  </div>
                  <div className="p-2">
                    {s.tag && <span className="text-[8px] font-black uppercase text-amber-400 block">{s.tag}</span>}
                    <span className="text-[11px] font-black uppercase block truncate">{s.title}</span>
                    {s.action && <span className="text-[9px] text-neutral-400 block">{s.action} →</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promo carousel */}
        {v['storefront.promo_enabled'] && promos.length > 0 && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {promos.slice(0, 2).map((b, i) => (
                <div key={i} className="relative bg-neutral-950 text-white p-3 overflow-hidden min-h-[64px]">
                  {b.image_url && <img src={b.image_url} alt={b.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                  <div className="relative">
                    {b.tag && <span className="text-[8px] font-black uppercase text-amber-400 block">{b.tag}</span>}
                    <span className="text-sm font-black uppercase block">{b.title || 'Promo'}</span>
                    {b.subtitle && <span className="text-[10px] text-neutral-300 block">{b.subtitle}</span>}
                    {b.action && <span className="text-[9px] font-bold text-amber-400 block mt-1">{b.action} →</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Club banner */}
        {v['storefront.club_enabled'] !== false && (
          <div className="mx-4 mb-4 bg-neutral-950 text-white p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              {v['storefront.club_badge'] && <span className="text-[9px] font-black uppercase text-amber-400 block">{v['storefront.club_badge']}</span>}
              <span className="text-sm font-black uppercase block">{v['storefront.club_title'] || 'Tusko Club'}</span>
              {v['storefront.club_subtitle'] && <span className="text-[10px] text-neutral-400 block">{v['storefront.club_subtitle']}</span>}
            </div>
            {v['storefront.club_cta'] && <span className="bg-white text-black text-[10px] font-black uppercase px-3 py-1.5 shrink-0">{v['storefront.club_cta']}</span>}
          </div>
        )}

        {/* Catalog heading */}
        {v['storefront.catalog_heading'] && (
          <div className="px-4 pb-4">
            <h3 className="font-black uppercase text-sm">{v['storefront.catalog_heading']}</h3>
          </div>
        )}
      </div>
    </div>
  );
}
