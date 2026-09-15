import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  SlidersHorizontal,
  MoreVertical, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X,
  XCircle,
  Edit3,
  ClipboardList
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import SupplierFilterDrawer from './organisms/SupplierFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import { vendorService } from '../services/vendorService';
import { useSupplierTableStore } from '../stores/useSupplierTableStore';

export default function SupplierListPage({
  onShowToast = () => {},
  onNavigateToPO = () => {},
  onNavigateToCreate = () => {},
  onNavigateToEdit = () => {}
}) {
  const [vendors, setVendors] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Centralized Zustand Table Store (100% Server-Side Data Operations)
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: tableVendors,
    total: totalVendorsCount,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useSupplierTableStore();

  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal state
  const [detailVendor, setDetailVendor] = useState(null);

  // Delete Confirmation state
  const [deletingVendor, setDeletingVendor] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Load vendors from store
  const loadVendors = async () => {
    try {
      const res = await fetchData();
      if (res?.data) setVendors(res.data);
    } catch (err) {
      setErrorMessage('Gagal memuat data supplier: ' + err.message);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  // Close action popup when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Paginated records directly from server-side store
  const paginatedVendors = tableVendors.length > 0 || totalVendorsCount === 0 ? tableVendors : vendors;
  const totalFiltered = totalVendorsCount > 0 || tableVendors.length > 0 ? totalVendorsCount : vendors.length;

  // Compute metrics
  const metrics = useMemo(() => {
    const list = paginatedVendors;
    const total = totalFiltered;
    const active = list.filter(v => v.is_active).length;
    const inactive = total - active;

    const allCategories = new Set();
    list.forEach(v => {
      if (Array.isArray(v.categories)) {
        v.categories.forEach(c => allCategories.add(c));
      }
    });

    return { total, active, inactive, totalCategories: allCategories.size };
  }, [paginatedVendors, totalFiltered]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery && filters.searchQuery.trim()) count++;
    if (filters.codeSearchQuery && filters.codeSearchQuery.trim()) count++;
    if (filters.contactSearchQuery && filters.contactSearchQuery.trim()) count++;
    if (filters.bankSearchQuery && filters.bankSearchQuery.trim()) count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.categoryFilter && filters.categoryFilter !== 'all') count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
  };

  // Toggle Active Status
  const handleToggleStatus = async (vendor) => {
    try {
      await vendorService.toggleStatus(vendor.id);
      loadVendors();
      onShowToast(`Status supplier "${vendor.company_name}" berhasil diubah.`);
    } catch (err) {
      onShowToast('Gagal mengubah status: ' + err.message);
    }
  };

  // Delete Vendor
  const handleConfirmDelete = async () => {
    if (!deletingVendor) return;
    setIsSubmitting(true);
    try {
      await vendorService.deleteVendor(deletingVendor.id);
      setDeletingVendor(null);
      loadVendors();
      onShowToast(`Supplier "${deletingVendor.company_name}" berhasil dihapus.`);
    } catch (err) {
      onShowToast('Gagal menghapus: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Checkbox list selection handlers
  const handleSelectRow = (id) => {
    setSelectedVendorIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedVendorIds.length === paginatedVendors.length && paginatedVendors.length > 0) {
      setSelectedVendorIds([]);
    } else {
      setSelectedVendorIds(paginatedVendors.map(v => v.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedVendorIds.length === 0) return;
    setIsBulkDeleteOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      for (const id of selectedVendorIds) {
        await vendorService.deleteVendor(id);
      }
      setSelectedVendorIds([]);
      setIsBulkDeleteOpen(false);
      loadVendors();
      onShowToast(`${selectedVendorIds.length} supplier berhasil dihapus.`);
    } catch (err) {
      onShowToast('Gagal menghapus supplier: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table Columns Definition
  const columns = useMemo(() => [
    {
      key: 'code',
      label: 'KODE VENDOR',
      sortable: true,
      width: 'w-36 min-w-[140px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const code = (typeof val === 'string' ? val : null) || r.code || '-';
        return (
          <span className="font-mono font-bold text-xs text-neutral-950 bg-neutral-100 px-2 py-0.5 border border-neutral-300 rounded-none whitespace-nowrap inline-block">
            {code}
          </span>
        );
      }
    },
    {
      key: 'company_name',
      label: 'PERUSAHAAN & PIC',
      sortable: true,
      width: 'min-w-[240px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const name = (typeof val === 'string' ? val : null) || r.company_name || '-';
        return (
          <div className="space-y-0.5">
            <div className="font-sport font-black text-sm text-neutral-950 uppercase tracking-tight leading-snug">
              {name}
            </div>
            <div className="text-xs text-neutral-600 flex items-center gap-1.5 whitespace-nowrap">
              <Building2 size={12} className="text-neutral-400 shrink-0" />
              <span>PIC: <strong className="text-neutral-800">{r.contact_person || '-'}</strong></span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'categories',
      label: 'KATEGORI PASOKAN',
      width: 'min-w-[180px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' && !Array.isArray(val) ? val : {}) || {};
        const rawCats = Array.isArray(val) 
          ? val 
          : (Array.isArray(r.categories) ? r.categories : [val || r.categories || 'Apparel']);
        return (
          <div className="flex flex-wrap gap-1 items-center max-w-[240px]">
            {rawCats.map((cat, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 text-[10px] font-sport font-bold uppercase tracking-wider bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-none whitespace-nowrap"
              >
                {cat}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      key: 'contact',
      label: 'KONTAK & EMAIL',
      width: 'min-w-[190px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="text-xs space-y-0.5 whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-neutral-900 font-mono">
              <Phone size={11} className="text-neutral-400 shrink-0" />
              <span>{r.phone || '-'}</span>
            </div>
            {r.email && (
              <div className="flex items-center gap-1.5 text-neutral-600">
                <Mail size={11} className="text-neutral-400 shrink-0" />
                <span className="truncate max-w-[160px]" title={r.email}>{r.email}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'bank_account_info',
      label: 'REKENING PEMBAYARAN',
      width: 'min-w-[190px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const info = (typeof val === 'string' ? val : null) || r.bank_account_info || '-';
        return (
          <div className="text-xs font-mono text-neutral-700 max-w-[200px] truncate whitespace-nowrap" title={info}>
            {info}
          </div>
        );
      }
    },
    {
      key: 'is_active',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      width: 'w-28 min-w-[110px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const isActive = val !== undefined && typeof val === 'boolean' ? val : Boolean(r.is_active);
        return (
          <span 
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider border rounded-none whitespace-nowrap ${
              isActive 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-neutral-100 text-neutral-600 border-neutral-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
            <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'center',
      width: 'w-16 min-w-[64px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const isMenuOpen = activeActionMenuId === r.id;

        return (
          <div className="relative inline-flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveActionMenuId(isMenuOpen ? null : r.id)}
              className="p-1.5 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 hover:border-neutral-400 rounded-none transition-colors cursor-pointer"
              title="Menu Aksi"
            >
              <MoreVertical size={14} />
            </button>

            {isMenuOpen && (
              <div 
                className="absolute right-0 top-8 z-30 w-48 bg-white border border-neutral-300 shadow-xl py-1 text-left rounded-none animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setDetailVendor(r);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Eye size={13} className="text-neutral-500" />
                  <span>Lihat Detail</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    onNavigateToEdit(r);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Edit3 size={13} className="text-neutral-500" />
                  <span>Edit Data Vendor</span>
                </button>

                {onNavigateToPO && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveActionMenuId(null);
                      onNavigateToPO(r);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ClipboardList size={13} className="text-neutral-500" />
                    <span>Terbitkan PO Baru</span>
                  </button>
                )}

                <div className="border-t border-neutral-200 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    handleToggleStatus(r);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {r.is_active ? (
                    <>
                      <XCircle size={13} className="text-neutral-500" />
                      <span>Nonaktifkan</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} className="text-neutral-500" />
                      <span>Aktifkan</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setDeletingVendor(r);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} className="text-rose-600" />
                  <span>Hapus Vendor</span>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ], [activeActionMenuId, onNavigateToPO, onNavigateToEdit]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Card (Icon-Only Controls with Tooltips) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Master Supplier &amp; Rekanan Vendor
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Direktori vendor terpusat untuk pengadaan bahan &amp; stok, kontak PIC, rekening bank, termin pembayaran, dan pemesanan PO.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Controls (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2 self-start xl:self-auto">
          <IconButton
            icon={Plus}
            onClick={onNavigateToCreate}
            title="Tambah Supplier Baru"
            variant="primary"
          />

          <div className="relative">
            <IconButton
              icon={SlidersHorizontal}
              onClick={() => setIsFilterDrawerOpen(true)}
              title="Buka Filter &amp; Pencarian"
              variant={activeFilterCount > 0 ? 'primary' : 'outline'}
            />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white font-mono font-black text-[9px] flex items-center justify-center rounded-none shadow-xs pointer-events-none">
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Metric Cards (Row of 4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Supplier */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Total Supplier</span>
            <Building2 size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-950 mt-1.5">
            {metrics.total}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Terdaftar di direktori ERP
          </div>
        </div>

        {/* Card 2: Supplier Aktif */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Supplier Aktif</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1.5">
            {metrics.active}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Kemitraan sedang berjalan
          </div>
        </div>

        {/* Card 3: Supplier Nonaktif */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Supplier Nonaktif</span>
            <AlertCircle size={16} className="text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-700 mt-1.5">
            {metrics.inactive}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Kemitraan ditangguhkan
          </div>
        </div>

        {/* Card 4: Kategori Pasokan */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Kategori Pasokan</span>
            <CreditCard size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-950 mt-1.5">
            {metrics.totalCategories}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Lini produk suplai aktif
          </div>
        </div>
      </div>

      {/* 3. ServerSideTable (Single Table View Only) */}
      <ServerSideTable
        columns={columns}
        data={paginatedVendors}
        total={totalFiltered}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={(p) => {
          setPage(p);
          setActiveActionMenuId(null);
        }}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
          setActiveActionMenuId(null);
        }}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => {
          setSort(newSortBy, newDir);
          setActiveActionMenuId(null);
        }}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedVendorIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        bulkActions={
          selectedVendorIds.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 font-medium">
                <strong className="font-mono text-neutral-900">{selectedVendorIds.length}</strong> supplier dipilih
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-sport font-bold uppercase tracking-wider rounded-none cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={12} />
                <span>Hapus Terpilih</span>
              </button>
            </div>
          ) : null
        }
        emptyMessage="Belum Ada Data Supplier Ditemukan"
        emptyDescription="Sesuaikan kata kunci pencarian atau buat supplier / rekanan vendor baru."
      />

      {/* 4. Filter Drawer */}
      <SupplierFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery || ''}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        codeSearchQuery={filters.codeSearchQuery || ''}
        onCodeSearchQueryChange={(val) => setFilter('codeSearchQuery', val)}
        contactSearchQuery={filters.contactSearchQuery || ''}
        onContactSearchQueryChange={(val) => setFilter('contactSearchQuery', val)}
        bankSearchQuery={filters.bankSearchQuery || ''}
        onBankSearchQueryChange={(val) => setFilter('bankSearchQuery', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        categoryFilter={filters.categoryFilter || 'all'}
        onCategoryFilterChange={(val) => setFilter('categoryFilter', val)}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Detail Supplier Modal */}
      {detailVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-neutral-300 shadow-2xl rounded-none flex flex-col">
            <div className="p-5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center rounded-none font-black">
                  <Building2 size={20} />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-amber-400 block">{detailVendor.code}</span>
                  <h3 className="font-sport font-black text-base uppercase text-white">
                    {detailVendor.company_name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailVendor(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 border border-neutral-200">
                <div>
                  <span className="text-neutral-500 font-sport font-bold uppercase text-[10px] block">Kontak PIC</span>
                  <span className="font-bold text-neutral-900 text-sm mt-0.5 block">{detailVendor.contact_person}</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-sport font-bold uppercase text-[10px] block">Status Kemitraan</span>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-sport font-black uppercase mt-1 border rounded-none ${
                    detailVendor.is_active ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                  }`}>
                    {detailVendor.is_active ? '🟢 Aktif' : '⚪ Nonaktif'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-neutral-700">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-neutral-400 shrink-0" />
                  <span className="font-mono font-bold text-neutral-950">{detailVendor.phone}</span>
                </div>
                {detailVendor.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-neutral-400 shrink-0" />
                    <span>{detailVendor.email}</span>
                  </div>
                )}
                {detailVendor.address && (
                  <div className="flex items-start gap-2 pt-1">
                    <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{detailVendor.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <CreditCard size={14} className="text-neutral-400 shrink-0" />
                  <span className="font-mono">{detailVendor.bank_account_info || 'Belum diisi'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200">
                <span className="text-neutral-500 font-sport font-bold uppercase text-[10px] block mb-1.5">
                  Kategori Pasokan Produk:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(detailVendor.categories) ? detailVendor.categories : [detailVendor.categories || 'Apparel']).map((cat, idx) => (
                    <span key={idx} className="px-2 py-0.5 text-[10px] font-sport font-bold uppercase bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-none">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const v = detailVendor;
                  setDetailVendor(null);
                  onNavigateToEdit(v);
                }}
                className="px-4 py-2 bg-neutral-950 text-white hover:bg-neutral-800 text-xs font-sport font-bold uppercase tracking-wider rounded-none cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 size={13} className="text-amber-400" />
                <span>Edit Data</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailVendor(null)}
                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-sport font-bold uppercase tracking-wider rounded-none cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal (Single Vendor) */}
      <ConfirmationModal
        isOpen={!!deletingVendor}
        onClose={() => setDeletingVendor(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Rekanan Vendor"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin menghapus vendor "${deletingVendor?.company_name}" (${deletingVendor?.code}) dari sistem? Seluruh riwayat relasi pengadaan terkait akan diputus.`}
        confirmText="Hapus Vendor"
        variant="danger"
        isLoading={isSubmitting}
      >
        {deletingVendor && (
          <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs font-sport space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Kode Vendor:</span>
              <span className="font-mono font-bold text-neutral-900">{deletingVendor.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">PIC:</span>
              <span className="font-bold text-neutral-900">{deletingVendor.contact_person || '-'}</span>
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* 8. Delete Confirmation Modal (Bulk Vendors) */}
      <ConfirmationModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Konfirmasi Hapus Massal Supplier"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin menghapus ${selectedVendorIds.length} supplier terpilih? Seluruh data profil rekanan yang dipilih akan dihapus.`}
        confirmText={`Hapus ${selectedVendorIds.length} Supplier`}
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
