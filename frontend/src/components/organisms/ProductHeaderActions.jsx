import React from 'react';
import { ExternalLink, Plus, SlidersHorizontal } from 'lucide-react';
import IconButton from '../atoms/IconButton';
import ViewModeToggle from '../molecules/ViewModeToggle';

/**
 * Organism: ProductHeaderActions
 * Centralizes top header action buttons (icon-only with tooltips)
 */
export default function ProductHeaderActions({
  viewMode = 'table',
  onViewModeChange = () => {},
  onBackToShopping = () => {},
  onAddNewProduct = () => {},
  onOpenFilter = () => {},
  activeFilterCount = 0
}) {
  return (
    <div className="flex items-center gap-2 shrink-0 flex-nowrap pt-2 xl:pt-0 border-t xl:border-t-0 border-neutral-100">
      {/* View Mode Toggle: List / Grid */}
      <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />

      {/* Lihat Etalase: Icon-only with tooltip */}
      <IconButton
        icon={ExternalLink}
        label="Lihat Etalase Storefront"
        variant="secondary"
        onClick={onBackToShopping}
      />

      {/* Tambah Produk: Icon-only with tooltip */}
      <IconButton
        icon={Plus}
        label="Tambah Produk Baru"
        variant="primary"
        onClick={onAddNewProduct}
      />

      {/* Filter Sidebar: Icon-only with tooltip & active badge */}
      <IconButton
        icon={SlidersHorizontal}
        label="Filter Katalog Produk"
        variant={activeFilterCount > 0 ? 'dark' : 'secondary'}
        badge={activeFilterCount}
        onClick={onOpenFilter}
      />
    </div>
  );
}
