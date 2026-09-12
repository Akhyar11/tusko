import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  SlidersHorizontal, 
  RotateCcw, 
  RefreshCw,
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
import { vendorService } from '../services/vendorService';

export default function SupplierListPage({
  onShowToast = () => {},
  onNavigateToPO = () => {}
}) {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Table pagination, sorting, and checkbox list selection states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('company_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Filter Drawer states
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form Modal state: null | 'create' | 'edit'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    bank_account_info: '',
    categories: 'Apparel',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal state
  const [detailVendor, setDetailVendor] = useState(null);

  // Delete Confirmation state
  const [deletingVendor, setDeletingVendor] = useState(null);

  // Load vendors from service
  const loadVendors = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await vendorService.fetchVendors();
      setVendors(res.data);
    } catch (err) {
      setErrorMessage('Gagal memuat data supplier: ' + err.message);
    } finally {
      setIsLoading(false);
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

  // Compute metrics
  const metrics = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter(v => v.is_active).length;
    const inactive = total - active;

    const allCategories = new Set();
    vendors.forEach(v => {
      if (Array.isArray(v.categories)) {
        v.categories.forEach(c => allCategories.add(c));
      }
    });

    return { total, active, inactive, totalCategories: allCategories.size };
  }, [vendors]);

  // Filter vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      // 1. Text Search (Name/PIC/Phone/Email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = (
          (v.company_name && v.company_name.toLowerCase().includes(q)) ||
          (v.contact_person && v.contact_person.toLowerCase().includes(q)) ||
          (v.email && v.email.toLowerCase().includes(q)) ||
          (v.phone && v.phone.includes(q))
        );
        if (!matches) return false;
      }

      // 2. Code Search
      if (codeSearchQuery.trim()) {
        const q = codeSearchQuery.toLowerCase();
        if (!v.code || !v.code.toLowerCase().includes(q)) return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        if (Boolean(v.is_active) !== isActive) return false;
      }

      // 4. Category Filter
      if (categoryFilter !== 'all') {
        if (!Array.isArray(v.categories) || !v.categories.includes(categoryFilter)) return false;
      }

      return true;
    });
  }, [vendors, searchQuery, codeSearchQuery, statusFilter, categoryFilter]);

  // Sorted and Paginated vendors
  const sortedVendors = useMemo(() => {
    return [...filteredVendors].sort((a, b) => {
      let aVal = a[sortBy] ?? '';
      let bVal = b[sortBy] ?? '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredVendors, sortBy, sortDirection]);

  const paginatedVendors = useMemo(() => {
    const start = (page - 1) * limit;
    return sortedVendors.slice(start, start + limit);
  }, [sortedVendors, page, limit]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (codeSearchQuery.trim()) count++;
    if (statusFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    return count;
  }, [searchQuery, codeSearchQuery, statusFilter, categoryFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCodeSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPage(1);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingVendor(null);
    setFormData({
      code: '',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      bank_account_info: '',
      categories: 'Apparel',
      is_active: true
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      code: vendor.code || '',
      company_name: vendor.company_name || '',
      contact_person: vendor.contact_person || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      bank_account_info: vendor.bank_account_info || '',
      categories: Array.isArray(vendor.categories) ? vendor.categories.join(', ') : (vendor.categories || 'Apparel'),
      is_active: vendor.is_active !== undefined ? vendor.is_active : true
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Submit Create / Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim() || !formData.contact_person.trim() || !formData.phone.trim()) {
      setErrorMessage('Harap lengkapi nama perusahaan, nama kontak PIC, dan nomor telepon.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const parsedCategories = formData.categories
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      const payload = {
        code: formData.code,
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        bank_account_info: formData.bank_account_info,
        categories: parsedCategories.length > 0 ? parsedCategories : ['Apparel'],
        is_active: formData.is_active
      };

      if (editingVendor) {
        await vendorService.updateVendor(editingVendor.id, payload);
        onShowToast(`Supplier "${payload.company_name}" berhasil diperbarui.`);
      } else {
        await vendorService.createVendor(payload);
        onShowToast(`Supplier "${payload.company_name}" berhasil ditambahkan.`);
      }

      setIsModalOpen(false);
      loadVendors();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan data supplier.');
    } finally {
      setIsSubmitting(false);
    }
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
    try {
      await vendorService.deleteVendor(deletingVendor.id);
      setDeletingVendor(null);
      loadVendors();
      onShowToast(`Supplier "${deletingVendor.company_name}" berhasil dihapus.`);
    } catch (err) {
      onShowToast('Gagal menghapus: ' + err.message);
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

  const handleBulkDelete = async () => {
    if (selectedVendorIds.length === 0) return;
    if (!window.confirm(`Hapus ${selectedVendorIds.length} supplier terpilih? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      for (const id of selectedVendorIds) {
        await vendorService.deleteVendor(id);
      }
      setSelectedVendorIds([]);
      loadVendors();
      onShowToast(`${selectedVendorIds.length} supplier berhasil dihapus.`);
    } catch (err) {
      onShowToast('Gagal menghapus supplier: ' + err.message);
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
                    handleOpenEditModal(r);
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
  ], [activeActionMenuId, onNavigateToPO]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Card (Icon-Only Controls with Tooltips) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
            Master Supplier &amp; Rekanan Vendor
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Direktori vendor terpusat untuk pengadaan bahan &amp; stok, kontak PIC, rekening bank, termin pembayaran, dan pemesanan PO.
          </p>
        </div>

        {/* Header Action Controls (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton
            icon={Plus}
            onClick={handleOpenCreateModal}
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

          <IconButton
            icon={RefreshCw}
            onClick={loadVendors}
            title="Muat Ulang Data"
            variant="outline"
          />
        </div>
      </div>

      {/* 2. Metric Cards (Row of 4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Supplier */}
        <div className="bg-white p-4 sm:p-5 border border-neutral-300 rounded-none shadow-2xs">
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
        <div className="bg-white p-4 sm:p-5 border border-neutral-300 rounded-none shadow-2xs">
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
        <div className="bg-white p-4 sm:p-5 border border-neutral-300 rounded-none shadow-2xs">
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
        <div className="bg-white p-4 sm:p-5 border border-neutral-300 rounded-none shadow-2xs">
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
        total={filteredVendors.length}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50]}
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
          setSortBy(newSortBy);
          setSortDirection(newDir);
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
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        codeSearchQuery={codeSearchQuery}
        onCodeSearchQueryChange={setCodeSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Create / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white border border-neutral-300 shadow-2xl rounded-none flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center rounded-none font-black">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black font-sport uppercase tracking-wider text-white">
                    {editingVendor ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {editingVendor ? `Memperbarui vendor ${editingVendor.code}` : 'Input data rekanan vendor pengadaan baru'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded-none transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 rounded-none">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Perusahaan / Vendor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="PT Tekstil Atletik Prima"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-bold rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Kode Vendor (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Otomatis: VND-004..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-mono font-bold rounded-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Kontak PIC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Budi Santoso"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    No. Telepon / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-3456-7890"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-mono rounded-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Email Kontak
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="budi@vendor.co.id"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Informasi Rekening Bank
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account_info}
                    onChange={(e) => setFormData({ ...formData, bank_account_info: e.target.value })}
                    placeholder="BCA 7788990011 a.n PT Tekstil"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 font-mono rounded-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Kategori Pasokan (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={formData.categories}
                  onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                  placeholder="Apparel, Jersey, Running Shorts"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Alamat Kantor / Pabrik / Gudang
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Kawasan Industri Jababeka Blok C-12, Cikarang..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-neutral-50 border border-neutral-200 rounded-none">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-amber-500 border-neutral-300 focus:ring-amber-500 rounded-none cursor-pointer"
                  />
                  <div>
                    <span className="font-sport font-bold uppercase text-xs text-neutral-900 block leading-tight">
                      Kemitraan Vendor Aktif
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Vendor dapat dipilih saat menerbitkan Purchase Order (PO) &amp; input produk
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 border border-amber-500 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none shadow-xs flex items-center gap-2"
                >
                  <Check size={15} />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Supplier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Detail Supplier Modal */}
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
                  handleOpenEditModal(v);
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

      {/* 7. Delete Confirmation Modal */}
      {deletingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-neutral-300 shadow-2xl p-6 rounded-none space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center rounded-none font-black">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                  Hapus Rekanan Vendor?
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed">
              Apakah Anda yakin ingin menghapus vendor <strong className="text-neutral-950">{deletingVendor.company_name}</strong> ({deletingVendor.code}) dari sistem?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingVendor(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 text-xs font-sport font-black uppercase tracking-wider rounded-none cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-sport font-black uppercase tracking-wider rounded-none cursor-pointer shadow-xs"
              >
                Ya, Hapus Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
