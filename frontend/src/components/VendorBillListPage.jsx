import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Eye, 
  CreditCard, 
  MoreVertical, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  Building2, 
  Check, 
  SlidersHorizontal
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import VendorBillFilterDrawer from './organisms/VendorBillFilterDrawer';
import ServerSideTable from './ServerSideTable';
import ConfirmationModal from './ConfirmationModal';
import { formatRupiah } from '../utils/formatters';
import { procurementService } from '../services/procurementService';
import { useBillTableStore } from '../stores/useProcurementTableStores';

export default function VendorBillListPage({
  onShowToast = () => {},
  onViewDetail = () => {}
}) {
  const [vendorBills, setVendorBills] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Centralized Zustand Table Store (100% Server-Side Data Operations)
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: storeBills,
    total: totalBillsCount,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useBillTableStore();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.poSearchQuery) count++;
    if (filters.vendorSearchQuery) count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.billDateStart) count++;
    if (filters.billDateEnd) count++;
    if (filters.dueDateStart) count++;
    if (filters.dueDateEnd) count++;
    if (filters.minAmount !== '' && filters.minAmount !== undefined) count++;
    if (filters.maxAmount !== '' && filters.maxAmount !== undefined) count++;
    return count;
  }, [filters]);

  const [selectedBillIds, setSelectedBillIds] = useState([]);

  const handleSelectRow = (id) => {
    setSelectedBillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Modals
  const [payingBill, setPayingBill] = useState(null);

  const loadBills = async () => {
    try {
      const res = await procurementService.fetchVendorBills({ page: 1, per_page: 100 });
      setVendorBills(res.data || []);
    } catch (err) {
      setVendorBills(procurementService.getVendorBills());
    }
    fetchData();
  };

  useEffect(() => {
    loadBills();
    const unsubscribe = procurementService.subscribe(() => {
      loadBills();
    });
    return () => unsubscribe();
  }, []);

  // Paginated records directly from server-side store
  const paginatedBills = storeBills.length > 0 || totalBillsCount === 0 ? storeBills : vendorBills;
  const totalFiltered = totalBillsCount > 0 || storeBills.length > 0 ? totalBillsCount : vendorBills.length;

  const handleSelectAll = () => {
    const currentPageIds = paginatedBills.map((b) => b.id);
    const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedBillIds.includes(id));
    if (allSelected) {
      setSelectedBillIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedBillIds(Array.from(new Set([...selectedBillIds, ...currentPageIds])));
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalCount = vendorBills.length;
    const unpaidBills = vendorBills.filter(b => b.status === 'unpaid');
    const unpaidCount = unpaidBills.length;
    const unpaidAmount = unpaidBills.reduce((sum, b) => sum + (Number(b.amount) - Number(b.paid_amount || 0)), 0);
    const paidCount = vendorBills.filter(b => b.status === 'paid').length;
    const totalPaidAmount = vendorBills.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0);
    return { totalCount, unpaidCount, unpaidAmount, paidCount, totalPaidAmount };
  }, [vendorBills]);

  // Handler: Pay Bill
  const handleConfirmPay = async () => {
    if (!payingBill) return;
    try {
      await procurementService.payVendorBill(payingBill.id);
      onShowToast(`Pelunasan tagihan ${payingBill.bill_number} berhasil dicatat.`);
      setPayingBill(null);
      setActiveActionMenuId(null);
      loadBills();
    } catch (err) {
      onShowToast(err.message || 'Gagal mencatat pelunasan tagihan.', { type: 'error' });
    }
  };

  // Table Columns
  const columns = [
    {
      key: 'bill_number',
      label: 'Nomor Tagihan',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div>
            <div className="font-mono font-bold text-neutral-950 text-xs">{typeof val === 'string' ? val : (r.bill_number || '-')}</div>
            <div className="font-mono text-[10px] text-neutral-500">Ref PO: {r.po_number || '-'}</div>
          </div>
        );
      }
    },
    {
      key: 'vendor_name',
      label: 'Vendor / Rekanan',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="font-bold text-neutral-900 text-xs">
            {typeof val === 'string' ? val : (r.vendor_name || '-')}
          </div>
        );
      }
    },
    {
      key: 'bill_date',
      label: 'Tgl Faktur',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="font-mono text-neutral-700 text-xs">
            {typeof val === 'string' ? val : (r.bill_date || '-')}
          </div>
        );
      }
    },
    {
      key: 'due_date',
      label: 'Jatuh Tempo',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="font-mono text-neutral-700 text-xs flex items-center gap-1">
            <Calendar size={12} className="text-neutral-400" />
            <span>{typeof val === 'string' ? val : (r.due_date || '-')}</span>
          </div>
        );
      }
    },
    {
      key: 'amount',
      label: 'Nominal Tagihan',
      sortable: true,
      align: 'right',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const amount = typeof val === 'number' ? val : (r.amount || 0);
        return (
          <div className="font-sport font-black text-neutral-950 text-xs text-right">
            {formatRupiah(amount)}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status Pembayaran',
      align: 'center',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const status = typeof val === 'string' ? val : (r.status || 'unpaid');
        const isPaid = status === 'paid';
        return (
          <span className={`inline-block px-2 py-0.5 text-[10px] font-sport font-bold uppercase rounded-none border ${
            isPaid ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            {isPaid ? 'LUNAS' : 'BELUM BAYAR'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'center',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="relative flex justify-center">
            <button
              type="button"
              onClick={() => setActiveActionMenuId(activeActionMenuId === r.id ? null : r.id)}
              className="p-1.5 hover:bg-neutral-200 text-neutral-700 hover:text-black rounded-none cursor-pointer transition-colors"
              title="Menu Aksi Tagihan"
            >
              <MoreVertical size={15} />
            </button>

            {activeActionMenuId === r.id && (
              <div 
                className="absolute right-0 top-8 z-30 w-44 bg-white border border-neutral-400 shadow-xl rounded-none py-1 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setActiveActionMenuId(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    onViewDetail(r);
                    setActiveActionMenuId(null);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Eye size={14} className="text-neutral-500" />
                  <span>Lihat Detail Tagihan</span>
                </button>

                {r.status !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayingBill(r);
                      setActiveActionMenuId(null);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-sport font-bold uppercase text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 cursor-pointer border-t border-neutral-100 transition-colors"
                  >
                    <CreditCard size={14} className="text-neutral-500" />
                    <span>Bayar Tagihan</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Modul Bersih (0 Tabs) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Receipt size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Tagihan Vendor (Bills)
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Manajemen faktur hutang dagang supplier dari dokumen PO/GRN dan pencatatan riwayat pelunasan kas toko.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={SlidersHorizontal}
            tooltip="Buka Filter Tagihan"
            onClick={() => setIsFilterDrawerOpen(true)}
            variant="secondary"
            badge={activeFilterCount > 0 ? activeFilterCount : undefined}
          />
        </div>
      </div>

      {/* KPI Cards Khusus Bills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Tagihan Masuk</span>
            <Receipt size={16} className="text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{kpis.totalCount}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Faktur</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-600 font-bold border-t border-neutral-100 pt-1.5">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Faktur hutang supplier</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Hutang Belum Lunas</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 font-sport">{formatRupiah(kpis.unpaidAmount)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-600 font-bold border-t border-neutral-100 pt-1.5">
            <span>{kpis.unpaidCount} faktur belum dibayar</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Tagihan Telah Lunas</span>
            <Check size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{kpis.paidCount}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Lunas</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-bold border-t border-neutral-100 pt-1.5">
            <span>Kewajiban terselesaikan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Kas Terbayar</span>
            <DollarSign size={16} className="text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{formatRupiah(kpis.totalPaidAmount)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-600 font-bold border-t border-neutral-100 pt-1.5">
            <span>Realisasi pembayaran vendor</span>
          </div>
        </div>
      </div>

      {/* Tabel Data Tunggal ServerSideTable */}
      <ServerSideTable
        columns={columns}
        data={paginatedBills}
        selectable={true}
        selectedIds={selectedBillIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        limitOptions={[10, 25, 50, 100]}
        bulkActions={
          selectedBillIds.length > 0 ? (
            <span className="text-xs text-neutral-600 font-medium">
              <strong className="font-mono text-neutral-900">{selectedBillIds.length}</strong> tagihan dipilih
            </span>
          ) : null
        }
        total={totalFiltered}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => setSort(newSortBy, newDir)}
        isLoading={isLoading}
        emptyMessage="Belum ada data tagihan vendor."
      />

      {/* Modal Konfirmasi Pelunasan Tagihan */}
      <ConfirmationModal
        isOpen={Boolean(payingBill)}
        onClose={() => setPayingBill(null)}
        onConfirm={handleConfirmPay}
        title="Konfirmasi Pelunasan Hutang"
        subtitle="Pencatatan pembayaran kas ke vendor."
        message={`Apakah Anda yakin ingin mencatat pelunasan penuh tagihan ${payingBill?.bill_number || ''} sebesar ${formatRupiah(payingBill?.amount || 0)}?`}
        confirmText="Konfirmasi Bayar"
        variant="info"
      >
        {payingBill && (
          <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs font-sport space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Vendor:</span>
              <span className="font-bold text-neutral-900">{payingBill.vendor_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Nominal Tagihan:</span>
              <span className="font-mono font-bold text-neutral-950">{formatRupiah(payingBill.amount)}</span>
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* Drawer Filter Tagihan Vendor (Bills) */}
      <VendorBillFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery || ''}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        poSearchQuery={filters.poSearchQuery || ''}
        onPoSearchQueryChange={(val) => setFilter('poSearchQuery', val)}
        vendorSearchQuery={filters.vendorSearchQuery || ''}
        onVendorSearchQueryChange={(val) => setFilter('vendorSearchQuery', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        billDateStart={filters.billDateStart || ''}
        onBillDateStartChange={(val) => setFilter('billDateStart', val)}
        billDateEnd={filters.billDateEnd || ''}
        onBillDateEndChange={(val) => setFilter('billDateEnd', val)}
        dueDateStart={filters.dueDateStart || ''}
        onDueDateStartChange={(val) => setFilter('dueDateStart', val)}
        dueDateEnd={filters.dueDateEnd || ''}
        onDueDateEndChange={(val) => setFilter('dueDateEnd', val)}
        minAmount={filters.minAmount || ''}
        onMinAmountChange={(val) => setFilter('minAmount', val)}
        maxAmount={filters.maxAmount || ''}
        onMaxAmountChange={(val) => setFilter('maxAmount', val)}
        onResetFilters={resetFilters}
      />
    </div>
  );
}
