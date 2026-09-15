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
  SlidersHorizontal
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
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
  onNavigateToCreate = () => {}
}) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [poToCancel, setPoToCancel] = useState(null);
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

  // Modals
  const [selectedPODetail, setSelectedPODetail] = useState(null);
  const [selectedPOForReceive, setSelectedPOForReceive] = useState(null);
  const [receiveForm, setReceiveForm] = useState({
    delivery_order_number: '',
    received_by: '',
    accepted_quantities: {},
    notes: ''
  });

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

  // Open Receive Modal
  const handleOpenReceiveModal = (po) => {
    const initialAcc = {};
    po.items.forEach(it => {
      initialAcc[it.id] = it.ordered_quantity;
    });
    setReceiveForm({
      delivery_order_number: `DO-${Date.now().toString().slice(-6)}`,
      received_by: '',
      accepted_quantities: initialAcc,
      notes: ''
    });
    setSelectedPOForReceive(po);
    setActiveActionMenuId(null);
  };

  // Confirm Goods Receipt
  const handleConfirmReceive = (e) => {
    e.preventDefault();
    if (!selectedPOForReceive) return;

    try {
      const result = procurementService.receivePurchaseOrder(selectedPOForReceive.id, receiveForm);
      setSelectedPOForReceive(null);
      onShowToast(`Penerimaan ${result.grn.grn_number} berhasil. Dokumen GRN & Tagihan otomatis diterbitkan.`);
    } catch (err) {
      console.error(err);
      onShowToast('Gagal memproses penerimaan barang.');
    }
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
        return (
          <div className="font-mono font-bold text-neutral-950 text-xs">
            {typeof val === 'string' ? val : (r.po_number || '-')}
          </div>
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
                    setSelectedPODetail(r);
                    setActiveActionMenuId(null);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Eye size={14} className="text-neutral-500" />
                  <span>Lihat Detail Item PO</span>
                </button>

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

      {/* MODAL: DETAIL PURCHASE ORDER */}
      {selectedPODetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-neutral-400 w-full max-w-xl p-6 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <span className="font-mono font-bold text-base text-neutral-950">{selectedPODetail.po_number}</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase bg-neutral-100 border border-neutral-300 rounded-none">
                  Status: {selectedPODetail.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPODetail(null)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3 border border-neutral-200 rounded-none">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Vendor / Supplier:</span>
                  <strong className="text-neutral-900">{selectedPODetail.vendor_name}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Gudang Penerima:</span>
                  <span className="text-neutral-800">{selectedPODetail.warehouse_name}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Tgl Pemesanan:</span>
                  <span className="font-mono">{selectedPODetail.order_date}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Perkiraan Tiba:</span>
                  <span className="font-mono">{selectedPODetail.expected_delivery_date}</span>
                </div>
              </div>

              <div>
                <span className="font-sport font-black uppercase text-neutral-900 block mb-2">Item Barang:</span>
                <div className="border border-neutral-200 divide-y divide-neutral-200">
                  {selectedPODetail.items.map(it => (
                    <div key={it.id} className="p-2.5 flex items-center justify-between hover:bg-neutral-50">
                      <div>
                        <div className="font-bold text-neutral-900">{it.product_name}</div>
                        <div className="font-mono text-[11px] text-neutral-500">{it.sku} • {it.variant_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-neutral-950">
                          {it.ordered_quantity} Unit @ {formatRupiah(it.unit_price)}
                        </div>
                        <div className="text-[11px] text-neutral-600 font-sport font-bold">
                          Total: {formatRupiah(it.subtotal || (it.ordered_quantity * it.unit_price))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-neutral-950 text-white rounded-none flex items-center justify-between">
                <span className="font-sport font-bold uppercase text-neutral-400">Total Nilai Transaksi:</span>
                <span className="font-sport font-black text-lg text-amber-400">
                  {formatRupiah(selectedPODetail.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TERIMA BARANG (GRN CONFIRMATION) */}
      {selectedPOForReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-neutral-400 w-full max-w-lg p-6 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <PackageCheck size={18} className="text-emerald-600" />
                <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                  Penerimaan Fisik Barang Masuk Gudang (GRN)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPOForReceive(null)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReceive} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Nomor PO:</span>
                  <span className="font-mono font-bold text-neutral-950">{selectedPOForReceive.po_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Vendor Supplier:</span>
                  <span className="font-bold text-neutral-900">{selectedPOForReceive.vendor_name}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Nomor Surat Jalan (DO) Vendor</label>
                <TextInput
                  value={receiveForm.delivery_order_number}
                  onChange={(val) => setReceiveForm(p => ({ ...p, delivery_order_number: val }))}
                  placeholder="Contoh: SJ-VENDOR-88992"
                  required
                  weight="mono"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Petugas Penerima Gudang</label>
                <TextInput
                  value={receiveForm.received_by}
                  onChange={(val) => setReceiveForm(p => ({ ...p, received_by: val }))}
                  placeholder="Nama staf penerima..."
                  required
                />
              </div>

              <div>
                <span className="font-sport font-black uppercase text-neutral-900 block mb-2">Verifikasi Jumlah Fisik:</span>
                <div className="space-y-2">
                  {selectedPOForReceive.items.map(it => (
                    <div key={it.id} className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-none flex items-center justify-between">
                      <div>
                        <span className="font-bold text-neutral-900 block">{it.product_name}</span>
                        <span className="font-mono text-[11px] text-neutral-500">{it.sku} • Dipesan: {it.ordered_quantity} Unit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-600">Diterima:</span>
                        <TextInput
                          type="number"
                          required
                          min="0"
                          max={it.ordered_quantity}
                          value={receiveForm.accepted_quantities[it.id] ?? it.ordered_quantity}
                          onChange={(val) => {
                            setReceiveForm(p => ({
                              ...p,
                              accepted_quantities: {
                                ...p.accepted_quantities,
                                [it.id]: val
                              }
                            }));
                          }}
                          className="w-20"
                          weight="mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Catatan QC / Kondisi Kemasan</label>
                <TextArea
                  rows={2}
                  value={receiveForm.notes}
                  onChange={(val) => setReceiveForm(p => ({ ...p, notes: val }))}
                  placeholder="Catatan hasil inspeksi..."
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedPOForReceive(null)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-sport font-bold uppercase rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sport font-black uppercase tracking-wider rounded-none cursor-pointer flex items-center gap-1.5"
                >
                  <PackageCheck size={14} />
                  <span>Konfirmasi Penerimaan Fisik</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
