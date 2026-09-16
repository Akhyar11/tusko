import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Eye, 
  PackageCheck, 
  XCircle, 
  MoreVertical, 
  Clock, 
  Truck, 
  CheckCircle2, 
  Boxes, 
  X, 
  Check, 
  Calendar, 
  Building2,
  AlertCircle,
  SlidersHorizontal,
  ShieldCheck
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import PurchaseOrderFilterDrawer from './organisms/PurchaseOrderFilterDrawer';
import ServerSideTable from './ServerSideTable';
import ConfirmationModal from './ConfirmationModal';
import { formatRupiah } from '../utils/formatters';
import { procurementService } from '../services/procurementService';
import { usePOTableStore } from '../stores/useProcurementTableStores';

export default function PurchaseOrderListPage({
  onShowToast = () => {},
  onNavigateToGRN = () => {},
  onNavigateToBills = () => {},
  onNavigateToCreate = () => {},
  onViewDetail = () => {}
}) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [poToCancel, setPoToCancel] = useState(null);
  const [poToApprove, setPoToApprove] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Centralized Zustand Table Store (100% Server-Side Data Operations)
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: storePOs,
    total: totalPOsCount,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = usePOTableStore();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.vendorSearchQuery) count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.warehouseFilter && filters.warehouseFilter !== 'all') count++;
    if (filters.orderDateStart) count++;
    if (filters.orderDateEnd) count++;
    if (filters.deliveryDateStart) count++;
    if (filters.deliveryDateEnd) count++;
    if (filters.minAmount !== '' && filters.minAmount !== undefined) count++;
    if (filters.maxAmount !== '' && filters.maxAmount !== undefined) count++;
    return count;
  }, [filters]);

  const [selectedPOIds, setSelectedPOIds] = useState([]);
  const [poToReceive, setPoToReceive] = useState(null);
  const [isBulkCancelModalOpen, setIsBulkCancelModalOpen] = useState(false);

  const loadPOs = () => {
    const data = procurementService.getPurchaseOrders();
    setPurchaseOrders(data);
    fetchData();
  };

  useEffect(() => {
    loadPOs();
    const unsubscribe = procurementService.subscribe(() => {
      loadPOs();
    });

    return () => unsubscribe();
  }, []);

  // Paginated records directly from server-side store
  const paginatedPOs = storePOs.length > 0 || totalPOsCount === 0 ? storePOs : purchaseOrders;
  const totalFiltered = totalPOsCount > 0 || storePOs.length > 0 ? totalPOsCount : purchaseOrders.length;

  // KPIs
  const kpis = useMemo(() => {
    const list = purchaseOrders.length > 0 ? purchaseOrders : paginatedPOs;
    const totalCount = totalFiltered;
    const ongoingCount = list.filter(p => ['approved', 'sent', 'partially_received'].includes(p.status)).length;
    const completedCount = list.filter(p => p.status === 'received').length;
    const totalProcurementValue = list.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
    return { totalCount, ongoingCount, completedCount, totalProcurementValue };
  }, [purchaseOrders, paginatedPOs, totalFiltered]);

  // Open Receive Confirmation
  const handleOpenReceiveModal = (po) => {
    setActiveActionMenuId(null);
    setPoToReceive(po);
  };

  // Confirm Goods Receipt via ConfirmationModal
  const confirmReceivePO = () => {
    if (!poToReceive) return;

    try {
      const initialAcc = {};
      (poToReceive.items || []).forEach(it => {
        initialAcc[it.id] = it.ordered_quantity;
      });
      const result = procurementService.receivePurchaseOrder(poToReceive.id, {
        delivery_order_number: `DO-${Date.now().toString().slice(-6)}`,
        received_by: 'Admin Gudang',
        accepted_quantities: initialAcc,
        notes: 'Penerimaan fisik barang lengkap dikonfirmasi'
      });
      setPoToReceive(null);
      onShowToast(`Penerimaan ${result.grn.grn_number} berhasil. Dokumen GRN & Tagihan otomatis diterbitkan.`);
    } catch (err) {
      console.error(err);
      onShowToast('Gagal memproses penerimaan barang.');
    }
  };

  // Bulk Cancel
  const handleBulkCancel = () => {
    if (selectedPOIds.length === 0) return;
    setIsBulkCancelModalOpen(true);
  };

  const confirmBulkCancel = () => {
    selectedPOIds.forEach(id => {
      procurementService.cancelPurchaseOrder(id);
    });
    onShowToast(`${selectedPOIds.length} Purchase Order berhasil dibatalkan.`);
    setSelectedPOIds([]);
    setIsBulkCancelModalOpen(false);
    fetchData();
  };

  // Approve PO
  const handleApprovePO = (po) => {
    setActiveActionMenuId(null);
    setPoToApprove(po);
  };

  const confirmApprovePO = () => {
    if (!poToApprove) return;
    procurementService.approvePurchaseOrder(poToApprove.id);
    onShowToast(`Purchase Order ${poToApprove.po_number} berhasil diotorisasi.`);
    setPoToApprove(null);
    fetchData();
  };

  // Cancel PO
  const handleCancelPO = (po) => {
    setActiveActionMenuId(null);
    setPoToCancel(po);
  };

  const confirmCancelPO = () => {
    if (!poToCancel) return;
    procurementService.cancelPurchaseOrder(poToCancel.id);
    onShowToast(`Purchase Order ${poToCancel.po_number} berhasil dibatalkan.`);
    setPoToCancel(null);
    fetchData();
  };

  // Table Columns
  const columns = [
    {
      key: 'po_number',
      label: 'Nomor PO',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const poNum = typeof val === 'string' ? val : (r.po_number || '-');
        return (
          <button
            type="button"
            onClick={() => onViewDetail(r)}
            className="font-mono font-bold text-neutral-950 hover:text-amber-600 text-xs text-left cursor-pointer transition-colors"
          >
            {poNum}
          </button>
        );
      }
    },
    {
      key: 'vendor_name',
      label: 'Nama Vendor / Pabrik',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div>
            <div className="font-bold text-neutral-900 text-xs">{typeof val === 'string' ? val : (r.vendor_name || '-')}</div>
            <div className="text-[11px] text-neutral-500 font-sans">{r.warehouse_name || '-'}</div>
          </div>
        );
      }
    },
    {
      key: 'order_date',
      label: 'Tgl Terbit',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="font-mono text-neutral-700 text-xs">
            {typeof val === 'string' ? val : (r.order_date || '-')}
          </div>
        );
      }
    },
    {
      key: 'expected_delivery_date',
      label: 'Est. Tiba',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="font-mono text-neutral-600 text-xs">
            {typeof val === 'string' ? val : (r.expected_delivery_date || '-')}
          </div>
        );
      }
    },
    {
      key: 'total_amount',
      label: 'Nilai Pemesanan',
      sortable: true,
      align: 'right',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const amount = typeof val === 'number' ? val : (r.total_amount || 0);
        return (
          <div className="font-sport font-black text-neutral-950 text-xs text-right">
            {formatRupiah(amount)}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status Otorisasi',
      align: 'center',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const status = typeof val === 'string' ? val : (r.status || 'draft');
        const statusConfig = {
          draft: { bg: 'bg-neutral-100 text-neutral-800 border-neutral-300', text: 'DRAFT' },
          approved: { bg: 'bg-blue-50 text-blue-800 border-blue-300', text: 'APPROVED' },
          sent: { bg: 'bg-purple-50 text-purple-800 border-purple-300', text: 'DIKIRIM' },
          received: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', text: 'DITERIMA' },
          cancelled: { bg: 'bg-red-50 text-red-800 border-red-300', text: 'DIBATALKAN' }
        };
        const conf = statusConfig[status] || { bg: 'bg-neutral-100 text-neutral-800 border-neutral-300', text: status };
        return (
          <span className={`inline-block px-2 py-0.5 text-[10px] font-sport font-bold uppercase rounded-none border ${conf.bg}`}>
            {conf.text}
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
              title="Menu Aksi PO"
            >
              <MoreVertical size={15} />
            </button>

            {activeActionMenuId === r.id && (
              <div 
                className="absolute right-0 top-8 z-30 w-48 bg-white border border-neutral-400 shadow-xl rounded-none py-1 animate-in fade-in zoom-in-95 duration-100"
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
                  <span>Lihat Detail Item PO</span>
                </button>

                {r.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => handleApprovePO(r)}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ShieldCheck size={14} className="text-neutral-500" />
                    <span>Otorisasi / Setujui PO</span>
                  </button>
                )}

                {['approved', 'sent'].includes(r.status) && (
                  <button
                    type="button"
                    onClick={() => handleOpenReceiveModal(r)}
                    className="w-full px-3 py-2 text-left text-xs font-sport font-bold uppercase text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <PackageCheck size={14} className="text-neutral-500" />
                    <span>Terima Barang (GRN)</span>
                  </button>
                )}

                {['draft', 'approved'].includes(r.status) && (
                  <button
                    type="button"
                    onClick={() => handleCancelPO(r)}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2 cursor-pointer border-t border-neutral-100 transition-colors"
                  >
                    <XCircle size={14} className="text-rose-600" />
                    <span>Batalkan Pesanan</span>
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
      {/* Header Modul Bersih (Icon-only Controls, 0 Tabs) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <ClipboardList size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Purchase Order (PO)
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Penerbitan, otorisasi, dan pelacakan pesanan pengadaan stok barang ke pabrik &amp; mitra supplier.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={Plus}
            tooltip="Buat Purchase Order Baru"
            onClick={onNavigateToCreate}
            variant="primary"
          />
          <IconButton
            icon={SlidersHorizontal}
            tooltip="Buka Filter Purchase Order"
            onClick={() => setIsFilterDrawerOpen(true)}
            variant="secondary"
            badge={activeFilterCount > 0 ? activeFilterCount : undefined}
          />
        </div>
      </div>

      {/* KPI Cards Khusus PO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Purchase Order</span>
            <ClipboardList size={16} className="text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{kpis.totalCount}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Dokumen</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-500 border-t border-neutral-100 pt-1.5">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Arsip transaksi pengadaan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">PO Berjalan</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{kpis.ongoingCount}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Antrean</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-700 font-bold border-t border-neutral-100 pt-1.5">
            <Truck size={12} />
            <span>Menunggu kiriman supplier</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">PO Selesai Diterima</span>
            <Check size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{kpis.completedCount}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Selesai</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-bold border-t border-neutral-100 pt-1.5">
            <PackageCheck size={12} />
            <span>Telah tiba di gudang fisik</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Nilai Belanja Modal</span>
            <Boxes size={16} className="text-neutral-500" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-neutral-950 truncate">
            {formatRupiah(kpis.totalProcurementValue)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 border-t border-neutral-100 pt-1.5">
            Total modal komitmen PO
          </div>
        </div>
      </div>

      {/* Tabel Data Tunggal ServerSideTable */}
      <ServerSideTable
        columns={columns}
        data={paginatedPOs}
        selectable={true}
        selectedRows={selectedPOIds}
        onSelectRows={setSelectedPOIds}
        limitOptions={[10, 25, 50, 100]}
        bulkActions={
          selectedPOIds.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 font-medium">
                <strong className="font-mono text-neutral-900">{selectedPOIds.length}</strong> PO dipilih
              </span>
              <button
                type="button"
                onClick={handleBulkCancel}
                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-sport font-bold text-[11px] uppercase rounded-none cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <XCircle size={12} />
                <span>Batalkan Terpilih</span>
              </button>
            </div>
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
        emptyMessage="Belum ada Purchase Order yang terdaftar."
      />

      {/* Modal Konfirmasi Penerimaan Barang (GRN) */}
      <ConfirmationModal
        isOpen={!!poToReceive}
        onClose={() => setPoToReceive(null)}
        onConfirm={confirmReceivePO}
        title="Konfirmasi Penerimaan Barang (GRN)"
        subtitle="Penerimaan Fisik & Pembukuan Stok Gudang"
        message={`Apakah Anda yakin ingin memproses penerimaan fisik untuk Purchase Order ${poToReceive?.po_number}? Seluruh kuantitas pesanan akan dicatat sebagai diterima lengkap, dokumen GRN dan Tagihan Vendor (Bill) otomatis diterbitkan, serta stok gudang langsung diperbarui.`}
        confirmText="Konfirmasi Penerimaan"
        variant="info"
      >
        {poToReceive && (
          <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs font-sport space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Supplier:</span>
              <span className="font-bold text-neutral-900">{poToReceive.vendor?.company_name || poToReceive.vendor_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Nilai Pemesanan:</span>
              <span className="font-mono font-bold text-neutral-900">{formatRupiah(poToReceive.total_amount || 0)}</span>
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* Modal Konfirmasi Pembatalan Massal Purchase Order */}
      <ConfirmationModal
        isOpen={isBulkCancelModalOpen}
        onClose={() => setIsBulkCancelModalOpen(false)}
        onConfirm={confirmBulkCancel}
        title="Konfirmasi Pembatalan Massal PO"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin membatalkan ${selectedPOIds.length} Purchase Order yang dipilih? Status dokumen pengadaan terpilih akan diubah menjadi dibatalkan.`}
        confirmText="Batalkan PO Terpilih"
        variant="danger"
      />

      {/* Modal Konfirmasi Otorisasi Purchase Order */}
      <ConfirmationModal
        isOpen={!!poToApprove}
        onClose={() => setPoToApprove(null)}
        onConfirm={confirmApprovePO}
        title="Otorisasi Purchase Order"
        subtitle="Pengesahan Dokumen Pengadaan Resmi"
        message={`Apakah Anda yakin ingin menyetujui dan mengotorisasi Purchase Order ${poToApprove?.po_number}? Status dokumen pengadaan akan diubah menjadi APPROVED sehingga barang dapat dikirim supplier dan siap diterima di gudang.`}
        confirmText="Otorisasi PO"
        variant="info"
      >
        {poToApprove && (
          <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs font-sport space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Supplier:</span>
              <span className="font-bold text-neutral-900">{poToApprove.vendor?.company_name || poToApprove.vendor_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Komitmen Anggaran:</span>
              <span className="font-mono font-bold text-neutral-900">{formatRupiah(poToApprove.total_amount || 0)}</span>
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* Modal Konfirmasi Pembatalan Purchase Order */}
      <ConfirmationModal
        isOpen={!!poToCancel}
        onClose={() => setPoToCancel(null)}
        onConfirm={confirmCancelPO}
        title="Konfirmasi Pembatalan PO"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin membatalkan Purchase Order ${poToCancel?.po_number}? Status dokumen pengadaan akan diubah menjadi dibatalkan.`}
        confirmText="Batalkan PO"
        variant="danger"
      >
        {poToCancel && (
          <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs font-sport space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Supplier:</span>
              <span className="font-bold text-neutral-900">{poToCancel.vendor?.company_name || poToCancel.vendor_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Nilai:</span>
              <span className="font-mono font-bold text-neutral-900">{formatRupiah(poToCancel.total_amount || 0)}</span>
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* Drawer Filter Purchase Order */}
      <PurchaseOrderFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery || ''}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        vendorSearchQuery={filters.vendorSearchQuery || ''}
        onVendorSearchQueryChange={(val) => setFilter('vendorSearchQuery', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        warehouseFilter={filters.warehouseFilter || 'all'}
        onWarehouseFilterChange={(val) => setFilter('warehouseFilter', val)}
        orderDateStart={filters.orderDateStart || ''}
        onOrderDateStartChange={(val) => setFilter('orderDateStart', val)}
        orderDateEnd={filters.orderDateEnd || ''}
        onOrderDateEndChange={(val) => setFilter('orderDateEnd', val)}
        deliveryDateStart={filters.deliveryDateStart || ''}
        onDeliveryDateStartChange={(val) => setFilter('deliveryDateStart', val)}
        deliveryDateEnd={filters.deliveryDateEnd || ''}
        onDeliveryDateEndChange={(val) => setFilter('deliveryDateEnd', val)}
        minAmount={filters.minAmount || ''}
        onMinAmountChange={(val) => setFilter('minAmount', val)}
        maxAmount={filters.maxAmount || ''}
        onMaxAmountChange={(val) => setFilter('maxAmount', val)}
        onResetFilters={resetFilters}
      />
    </div>
  );
}
