import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Plus, 
  RotateCcw, 
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
  AlertCircle
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import { formatRupiah } from '../utils/formatters';
import { procurementService } from '../services/procurementService';
import { vendorService } from '../services/vendorService';
import { initialWarehouses } from '../data/mockStockData';

export default function PurchaseOrderListPage({
  onShowToast = () => {},
  onNavigateToGRN = () => {},
  onNavigateToBills = () => {}
}) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Pagination & selection states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedPOIds, setSelectedPOIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPODetail, setSelectedPODetail] = useState(null);
  const [selectedPOForReceive, setSelectedPOForReceive] = useState(null);
  const [receiveForm, setReceiveForm] = useState({
    delivery_order_number: '',
    received_by: '',
    accepted_quantities: {},
    notes: ''
  });

  // New PO form state
  const [newPO, setNewPO] = useState({
    vendor_id: '',
    expected_delivery_date: '',
    notes: '',
    warehouse_name: initialWarehouses[0] ? `${initialWarehouses[0].name} (${initialWarehouses[0].code})` : '',
    items: [
      { product_name: '', variant_name: '', sku: '', ordered_quantity: 1, unit_price: 0 }
    ]
  });

  const loadPOs = () => {
    const data = procurementService.getPurchaseOrders();
    setPurchaseOrders(data);
  };

  useEffect(() => {
    loadPOs();
    const unsubscribe = procurementService.subscribe(() => {
      loadPOs();
    });

    vendorService.fetchVendors().then(res => {
      if (res?.data && res.data.length > 0) {
        setVendors(res.data);
        setNewPO(prev => ({
          ...prev,
          vendor_id: prev.vendor_id || res.data[0].id
        }));
      }
    }).catch(() => {});

    return () => unsubscribe();
  }, []);

  // Filtered and paginated POs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchSearch = (po.po_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.vendor_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || po.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchaseOrders, searchQuery, statusFilter]);

  const paginatedPOs = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredPOs.slice(start, start + limit);
  }, [filteredPOs, page, limit]);

  // KPIs
  const kpis = useMemo(() => {
    const totalCount = purchaseOrders.length;
    const ongoingCount = purchaseOrders.filter(p => ['approved', 'sent', 'partially_received'].includes(p.status)).length;
    const completedCount = purchaseOrders.filter(p => p.status === 'received').length;
    const totalProcurementValue = purchaseOrders.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
    return { totalCount, ongoingCount, completedCount, totalProcurementValue };
  }, [purchaseOrders]);

  // Handle PO Creation
  const handleAddItemToPO = () => {
    setNewPO(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { product_name: '', variant_name: '', sku: '', ordered_quantity: 1, unit_price: 0 }
      ]
    }));
  };

  const handleRemoveItemFromPO = (idx) => {
    if (newPO.items.length <= 1) return;
    setNewPO(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemChange = (idx, field, val) => {
    setNewPO(prev => {
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, items: updated };
    });
  };

  const handleSavePO = (e) => {
    e.preventDefault();
    const vendor = vendors.find(v => String(v.id) === String(newPO.vendor_id)) || vendors[0];
    const totalAmount = newPO.items.reduce((sum, it) => sum + (Number(it.ordered_quantity || 0) * Number(it.unit_price || 0)), 0);

    const poRecord = {
      vendor_id: vendor ? vendor.id : 1,
      vendor_name: vendor ? (vendor.company_name || vendor.name) : 'Supplier Partner',
      warehouse_id: 1,
      warehouse_name: newPO.warehouse_name,
      status: 'approved',
      expected_delivery_date: newPO.expected_delivery_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      total_amount: totalAmount,
      notes: newPO.notes || 'Pengadaan batch baru perlengkapan atletik.',
      items: newPO.items.map((it, idx) => ({
        id: Date.now() + idx,
        product_name: it.product_name || 'Produk Tusko Performance',
        variant_name: it.variant_name || '-',
        sku: it.sku || `TSK-GEN-${Date.now().toString().slice(-4)}`,
        ordered_quantity: Number(it.ordered_quantity) || 1,
        received_quantity: 0,
        unit_price: Number(it.unit_price) || 0,
        subtotal: (Number(it.ordered_quantity) || 1) * (Number(it.unit_price) || 0)
      }))
    };

    const created = procurementService.createPurchaseOrder(poRecord);
    setIsCreateModalOpen(false);
    setNewPO({
      vendor_id: '',
      expected_delivery_date: '',
      notes: '',
      warehouse_name: initialWarehouses[0] ? `${initialWarehouses[0].name} (${initialWarehouses[0].code})` : '',
      items: [
        { product_name: '', variant_name: '', sku: '', ordered_quantity: 1, unit_price: 0 }
      ]
    });
    onShowToast(`Purchase Order ${created.po_number} berhasil diterbitkan.`);
  };

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
  const handleCancelPO = (poId) => {
    if (window.confirm('Yakin ingin membatalkan Purchase Order ini?')) {
      procurementService.cancelPurchaseOrder(poId);
      setActiveActionMenuId(null);
      onShowToast('Purchase Order berhasil dibatalkan.');
    }
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
                    onClick={() => handleCancelPO(r.id)}
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
    <div className="space-y-6">
      {/* Header Modul Bersih (Icon-only Controls, 0 Tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-950 text-white flex items-center justify-center rounded-none shrink-0 shadow-xs">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-sport font-black uppercase tracking-tight text-neutral-950">
              Purchase Order (PO)
            </h1>
            <p className="text-xs text-neutral-600 font-sans mt-0.5">
              Penerbitan, otorisasi, dan pelacakan pesanan pengadaan stok barang ke pabrik &amp; mitra supplier.
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={Plus}
            tooltip="Buat Purchase Order Baru"
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
          />
          <IconButton
            icon={RotateCcw}
            tooltip="Muat Ulang Data PO"
            onClick={loadPOs}
            variant="secondary"
          />
        </div>
      </div>

      {/* KPI Cards Khusus PO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500">Total Purchase Order</span>
            <div className="w-8 h-8 bg-neutral-100 text-neutral-900 border border-neutral-300 flex items-center justify-center rounded-none">
              <ClipboardList size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-neutral-950 mt-2">
            {kpis.totalCount} <span className="text-xs font-sans font-normal text-neutral-500">Dokumen</span>
          </div>
          <div className="text-[11px] text-neutral-600 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Arsip transaksi pengadaan</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500">PO Berjalan</span>
            <div className="w-8 h-8 bg-amber-50 text-amber-800 border border-amber-300 flex items-center justify-center rounded-none">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-neutral-950 mt-2">
            {kpis.ongoingCount} <span className="text-xs font-sans font-normal text-neutral-500">Antrean</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
            <Truck size={12} />
            <span>Menunggu kiriman supplier</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500">PO Selesai Diterima</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center justify-center rounded-none">
              <Check size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-neutral-950 mt-2">
            {kpis.completedCount} <span className="text-xs font-sans font-normal text-neutral-500">Selesai</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
            <PackageCheck size={12} />
            <span>Telah tiba di gudang fisik</span>
          </div>
        </div>

        <div className="bg-neutral-950 text-white border border-black p-5 rounded-none shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-400">Nilai Belanja Modal</span>
            <div className="w-8 h-8 bg-neutral-800 text-amber-400 border border-neutral-700 flex items-center justify-center rounded-none">
              <Boxes size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-white mt-2">
            {formatRupiah(kpis.totalProcurementValue)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span>Total modal komitmen PO</span>
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
        total={filteredPOs.length}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyMessage="Belum ada Purchase Order yang terdaftar."
      />

      {/* MODAL: BUAT PURCHASE ORDER BARU */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-neutral-400 w-full max-w-2xl p-6 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-neutral-950" />
                <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                  Penerbitan Purchase Order Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Pilih Vendor / Supplier</label>
                  <select
                    required
                    value={newPO.vendor_id}
                    onChange={(e) => setNewPO(p => ({ ...p, vendor_id: e.target.value }))}
                    className="w-full p-2 bg-white border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.company_name || v.name} ({v.code || 'VND'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Perkiraan Tgl Kirim Tiba</label>
                  <input
                    type="date"
                    required
                    value={newPO.expected_delivery_date}
                    onChange={(e) => setNewPO(p => ({ ...p, expected_delivery_date: e.target.value }))}
                    className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Gudang Tujuan Penerimaan</label>
                <select
                  required
                  value={newPO.warehouse_name}
                  onChange={(e) => setNewPO(p => ({ ...p, warehouse_name: e.target.value }))}
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs bg-white cursor-pointer"
                >
                  {initialWarehouses.map((w) => (
                    <option key={w.id} value={`${w.name} (${w.code})`}>
                      {w.name} ({w.code}) - {w.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sport font-black uppercase text-neutral-900">Daftar Item Pemesanan Stok</span>
                  <button
                    type="button"
                    onClick={handleAddItemToPO}
                    className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-[11px] font-bold uppercase rounded-none border border-neutral-300 cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {newPO.items.map((it, idx) => (
                    <div key={idx} className="p-3 bg-neutral-50 border border-neutral-300 rounded-none space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] text-neutral-500">Item #{idx + 1}</span>
                        {newPO.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromPO(idx)}
                            className="text-red-500 hover:text-red-700 text-[11px] cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Nama Produk (misal: Running Jersey)"
                            value={it.product_name}
                            onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                            className="w-full p-1.5 bg-white border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="Kode SKU"
                            value={it.sku}
                            onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                            className="w-full p-1.5 bg-white border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs font-mono uppercase"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Varian (misal: L / Merah)"
                            value={it.variant_name}
                            onChange={(e) => handleItemChange(idx, 'variant_name', e.target.value)}
                            className="w-full p-1.5 bg-white border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Qty Dipesan"
                            value={it.ordered_quantity}
                            onChange={(e) => handleItemChange(idx, 'ordered_quantity', e.target.value)}
                            className="w-full p-1.5 bg-white border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs font-mono"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Harga Satuan (Rp)"
                            value={it.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            className="w-full p-1.5 bg-white border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows="2"
                  value={newPO.notes}
                  onChange={(e) => setNewPO(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Instruksi pengiriman vendor..."
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-sport font-bold uppercase rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-sport font-black uppercase tracking-wider rounded-none cursor-pointer"
                >
                  Terbitkan Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <input
                  type="text"
                  required
                  value={receiveForm.delivery_order_number}
                  onChange={(e) => setReceiveForm(p => ({ ...p, delivery_order_number: e.target.value }))}
                  placeholder="Contoh: SJ-VENDOR-88992"
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Petugas Penerima Gudang</label>
                <input
                  type="text"
                  required
                  value={receiveForm.received_by}
                  onChange={(e) => setReceiveForm(p => ({ ...p, received_by: e.target.value }))}
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs"
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
                        <input
                          type="number"
                          required
                          min="0"
                          max={it.ordered_quantity}
                          value={receiveForm.accepted_quantities[it.id] ?? it.ordered_quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReceiveForm(p => ({
                              ...p,
                              accepted_quantities: {
                                ...p.accepted_quantities,
                                [it.id]: val
                              }
                            }));
                          }}
                          className="w-16 p-1 bg-white border border-neutral-300 text-center font-mono font-bold text-neutral-950 rounded-none focus:border-black focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Catatan QC / Kondisi Kemasan</label>
                <textarea
                  rows="2"
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none text-xs"
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
    </div>
  );
}
