import React from 'react';
import { Plus, SlidersHorizontal, FolderKanban } from 'lucide-react';
import IconButton from '../atoms/IconButton';

/**
 * Organism: ProductHeaderActions
 * Centralizes top header action buttons (icon-only with tooltips)
 */
export default function ProductHeaderActions({
  onAddNewProduct = () => {},
  onOpenFilter = () => {},
  onOpenCategoryMaster = () => {},
  activeFilterCount = 0
}) {
  return (
    <div className="flex items-center gap-2 shrink-0 flex-nowrap pt-2 xl:pt-0 border-t xl:border-t-0 border-neutral-100">
      {/* Master Kategori: Icon-only with tooltip */}
      <IconButton
        icon={FolderKanban}
        label="Master Kategori Produk"
        variant="secondary"
        onClick={onOpenCategoryMaster}
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
