import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';
import TextInput from '../molecules/TextInput';
import IconButton from '../atoms/IconButton';
import { menuService } from '../../services/menuService';

/**
 * Organism: MenuFilterDrawer
 * Sidebar filter kanan-ke-kiri untuk Master Menu & Akses Role (T37.6).
 * Mencakup 100% kolom tabel tanpa elemen form HTML bawaan.
 */
export default function MenuFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  searchQuery = '',
  onSearchQueryChange = () => {},
  pathSearchQuery = '',
  onPathSearchQueryChange = () => {},
  viewSearchQuery = '',
  onViewSearchQueryChange = () => {},
  sectionSearchQuery = '',
  onSectionSearchQueryChange = () => {},
  environmentFilter = 'all',
  onEnvironmentFilterChange = () => {},
  roleFilter = 'all',
  onRoleFilterChange = () => {},
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  featureFlagFilter = 'all',
  onFeatureFlagFilterChange = () => {},
  sortOrderMin = '',
  onSortOrderMinChange = () => {},
  sortOrderMax = '',
  onSortOrderMaxChange = () => {},
  onResetFilters = () => {}
}) {
  const [roleOptions, setRoleOptions] = useState([{ value: 'all', label: 'Semua Role' }]);

  useEffect(() => {
    let active = true;
    menuService.fetchRoleOptions()
      .then((roles) => {
        if (!active) return;
        setRoleOptions([
          { value: 'all', label: 'Semua Role' },
          ...roles.map((role) => ({ value: role.id, label: role.display_name || role.name }))
        ]);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const environmentOptions = [
    { value: 'all', label: 'Semua Environment' },
    { value: 'admin', label: 'Admin ERP' },
    { value: 'storefront', label: 'Storefront Publik' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' }
  ];

  const featureFlagOptions = [
    { value: 'all', label: 'Semua Feature Flag' },
    { value: 'with', label: 'Punya Feature Flag' },
    { value: 'without', label: 'Tanpa Feature Flag' }
  ];

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-md bg-white border-l border-neutral-300 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out rounded-none ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-5 sm:p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center rounded-none font-black">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black font-sport uppercase tracking-wider text-white">
                    Filter Master Menu
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Saring navigasi DB berdasarkan label, path, environment, role, dan status
                </p>
              </div>
            </div>

            <IconButton
              icon={X}
              onClick={onClose}
              title="Tutup Filter"
              variant="dark"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Nama Label Menu
              </label>
              <SearchBar
                value={searchQuery}
                onChange={onSearchQueryChange}
                placeholder="Ketik label menu atau sublabel..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Path Prefix
              </label>
              <SearchBar
                value={pathSearchQuery}
                onChange={onPathSearchQueryChange}
                placeholder="Contoh: /admin/product..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                View Key
              </label>
              <SearchBar
                value={viewSearchQuery}
                onChange={onViewSearchQueryChange}
                placeholder="Contoh: products-admin..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Section / Grup
              </label>
              <SearchBar
                value={sectionSearchQuery}
                onChange={onSectionSearchQueryChange}
                placeholder="Contoh: Katalog & Inventaris..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Environment
              </label>
              <ServerSideSelect
                options={environmentOptions}
                value={environmentFilter}
                onChange={onEnvironmentFilterChange}
                placeholder="Pilih environment menu..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Role Pemilik Akses
              </label>
              <ServerSideSelect
                options={roleOptions}
                value={roleFilter}
                onChange={onRoleFilterChange}
                placeholder="Pilih role pemilik menu..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Status Aktif
              </label>
              <ServerSideSelect
                options={statusOptions}
                value={statusFilter}
                onChange={onStatusFilterChange}
                placeholder="Pilih status menu..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Feature Flag
              </label>
              <ServerSideSelect
                options={featureFlagOptions}
                value={featureFlagFilter}
                onChange={onFeatureFlagFilterChange}
                placeholder="Pilih kondisi feature flag..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Urutan Tampil (Sort Order)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  type="number"
                  value={sortOrderMin}
                  onChange={onSortOrderMinChange}
                  placeholder="Min"
                  min={0}
                  weight="mono"
                />
                <TextInput
                  type="number"
                  value={sortOrderMax}
                  onChange={onSortOrderMaxChange}
                  placeholder="Maks"
                  min={0}
                  weight="mono"
                />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 rounded-none"
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 border border-amber-500 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-none shadow-xs"
            >
              <Check size={15} />
              <span>Terapkan Filter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
