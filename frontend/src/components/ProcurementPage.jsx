import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  ClipboardList, 
  PackageCheck, 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Truck, 
  DollarSign, 
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  X,
  Boxes,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { 
  initialVendors, 
  initialPurchaseOrders, 
  initialGoodsReceivingNotes, 
  initialVendorBills 
} from '../data/mockProcurementData';

export default function ProcurementPage({
  onBackToDashboard = () => {},
  onShowToast = () => {}
}) {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'vendors' | 'grn' | 'bills'
  const [vendors, setVendors] = useState(initialVendors);
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
  const [receivingNotes, setReceivingNotes] = useState(initialGoodsReceivingNotes);
  const [vendorBills, setVendorBills] = useState(initialVendorBills);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    code: `VND-${Date.now().toString().slice(-4)}`,
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    payment_terms_days: 30,
    bank_account_info: '',
    categories: ['Apparel']
  });

  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [newPO, setNewPO] = useState({
    vendor_id: vendors[0]?.id || 1,
    expected_delivery_date: '',
    notes: '',
    items: [
      { product_name: 'Tusko SpeedTech Running Jersey', variant_name: 'Hitam / L', sku: 'TSK-JRS-BLK-L', ordered_quantity: 50, unit_price: 110000 }
    ]
  });

  const [selectedPOForDetail, setSelectedPOForDetail] = useState(null);
  const [selectedPOForReceive, setSelectedPOForReceive] = useState(null);
  const [receiveForm, setReceiveForm] = useState({
    delivery_order_number: '',
    received_by: 'Bambang (Admin Gudang)',
    accepted_quantities: {},
    notes: ''
  });

  // KPI Calculations
  const kpis = useMemo(() => {
    const activeVendorCount = vendors.filter(v => v.is_active).length;
    const ongoingPOCount = purchaseOrders.filter(p => p.status === 'approved' || p.status === 'sent').length;
    const totalProcurementValue = purchaseOrders.reduce((acc, p) => acc + (Number(p.total_amount) || 0), 0);
    const unpaidBillsAmount = vendorBills
      .filter(b => b.status === 'unpaid' || b.status === 'partially_paid')
      .reduce((acc, b) => acc + (Number(b.amount) - Number(b.paid_amount || 0)), 0);

    return {
      activeVendorCount,
      ongoingPOCount,
      totalProcurementValue,
      unpaidBillsAmount
    };
  }, [vendors, purchaseOrders, vendorBills]);

  // Handler: Add Vendor
  const handleSaveVendor = (e) => {
    e.preventDefault();
    if (!newVendor.company_name || !newVendor.contact_person || !newVendor.phone) {
      alert('Lengkapi nama perusahaan, kontak, dan nomor telepon.');
      return;
    }

    const created = {
      ...newVendor,
      id: Date.now(),
      is_active: true,
      rating: 5.0
    };

    setVendors(prev => [created, ...prev]);
    setIsAddVendorOpen(false);
    onShowToast(`Vendor "${created.company_name}" berhasil ditambahkan.`);
    setNewVendor({
      code: `VND-${Date.now().toString().slice(-4)}`,
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      payment_terms_days: 30,
      bank_account_info: '',
      categories: ['Apparel']
    });
  };

  // Handler: Create PO
  const handleSavePO = (e) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.id === Number(newPO.vendor_id)) || vendors[0];
    const total = newPO.items.reduce((acc, it) => acc + (Number(it.ordered_quantity) * Number(it.unit_price)), 0);

    const poRecord = {
      id: Date.now(),
      po_number: `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      vendor_id: vendor.id,
      vendor_name: vendor.company_name,
      warehouse_id: 1,
      warehouse_name: 'Gudang Pusat Tusko Jakarta (GDG-JKT-PST)',
      status: 'approved',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: newPO.expected_delivery_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      total_amount: total,
      notes: newPO.notes || 'Pengadaan stok operasional toko.',
      items: newPO.items.map((it, idx) => ({
        id: idx + 1,
        ...it,
        received_quantity: 0,
        subtotal: Number(it.ordered_quantity) * Number(it.unit_price)
      }))
    };

    setPurchaseOrders(prev => [poRecord, ...prev]);
    setIsCreatePOOpen(false);
    onShowToast(`Purchase Order ${poRecord.po_number} berhasil diterbitkan.`);
  };

  // Handler: Receive Goods (GRN)
  const handleOpenReceiveModal = (po) => {
    const initialAcc = {};
    po.items.forEach(it => {
      initialAcc[it.id] = it.ordered_quantity - (it.received_quantity || 0);
    });

    setReceiveForm({
      delivery_order_number: `SJ-VND-${Date.now().toString().slice(-5)}`,
      received_by: 'Bambang (Admin Gudang)',
      accepted_quantities: initialAcc,
      notes: ''
    });
    setSelectedPOForReceive(po);
  };

  const handleConfirmReceive = (e) => {
    e.preventDefault();
    if (!selectedPOForReceive) return;

    const grnRecord = {
      id: Date.now(),
      grn_number: `GRN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(receivingNotes.length + 1).padStart(3, '0')}`,
      po_number: selectedPOForReceive.po_number,
      vendor_name: selectedPOForReceive.vendor_name,
      warehouse_name: selectedPOForReceive.warehouse_name,
      received_date: new Date().toISOString().split('T')[0],
      delivery_order_number: receiveForm.delivery_order_number,
      received_by: receiveForm.received_by,
      status: 'verified',
      items: selectedPOForReceive.items.map(it => ({
        id: it.id,
        sku: it.sku,
        product_name: `${it.product_name} (${it.variant_name})`,
        accepted_quantity: Number(receiveForm.accepted_quantities[it.id] || 0),
        rejected_quantity: 0,
        unit_cost: it.unit_price,
        notes: receiveForm.notes || 'Kondisi barang baik lolos QC'
      }))
    };

    setReceivingNotes(prev => [grnRecord, ...prev]);

    // Update PO status to received
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === selectedPOForReceive.id) {
        return {
          ...po,
          status: 'received',
          items: po.items.map(it => ({
            ...it,
            received_quantity: it.ordered_quantity
          }))
        };
      }
      return po;
    }));

    // Auto create vendor bill if not exists
    const billRecord = {
      id: Date.now(),
      bill_number: `BILL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(vendorBills.length + 1).padStart(3, '0')}`,
      po_number: selectedPOForReceive.po_number,
      grn_number: grnRecord.grn_number,
      vendor_name: selectedPOForReceive.vendor_name,
      amount: selectedPOForReceive.total_amount,
      paid_amount: 0,
      status: 'unpaid',
      bill_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    };
    setVendorBills(prev => [billRecord, ...prev]);

    setSelectedPOForReceive(null);
    onShowToast(`Penerimaan barang ${grnRecord.grn_number} berhasil dicatat & stok bertambah.`);
  };

  // Handler: Pay Vendor Bill
  const handlePayBill = (billId) => {
    setVendorBills(prev => prev.map(b => {
      if (b.id === billId) {
        return { ...b, paid_amount: b.amount, status: 'paid' };
      }
      return b;
    }));
    onShowToast('Pelunasan tagihan vendor berhasil dicatat ke buku kas.');
  };

  return (
    <div className="space-y-6">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-black text-white text-[10px] font-sport font-black uppercase tracking-wider rounded-none">
              ERP Backoffice
            </span>
            <span className="text-xs text-neutral-500 font-mono">/ Modul Pengadaan & Gudang</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-sport font-black uppercase tracking-tight text-neutral-950 mt-1">
            Pengadaan & Vendor (PO)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-sans mt-0.5">
            Kelola data supplier apparel, penerbitan Purchase Order (PO), bukti penerimaan fisik (GRN), dan tagihan modal.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsAddVendorOpen(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 hover:border-black text-xs font-sport font-black uppercase rounded-none transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Tambah Vendor</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreatePOOpen(true)}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-sport font-black uppercase tracking-wider rounded-none transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <ClipboardList size={14} className="text-amber-400" />
            <span>Buat PO Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500">Vendor Aktif</span>
            <div className="w-8 h-8 bg-neutral-100 text-neutral-900 border border-neutral-300 flex items-center justify-center rounded-none">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-neutral-950 mt-2">
            {kpis.activeVendorCount} <span className="text-xs font-sans font-normal text-neutral-500">Supplier</span>
          </div>
          <div className="text-[11px] text-neutral-600 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Terdaftar & terverifikasi</span>
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
            {kpis.ongoingPOCount} <span className="text-xs font-sans font-normal text-neutral-500">Antrean</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
            <Truck size={12} />
            <span>Menunggu kiriman supplier</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500">Nilai Pengadaan</span>
            <div className="w-8 h-8 bg-neutral-900 text-white border border-neutral-900 flex items-center justify-center rounded-none">
              <Boxes size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-neutral-950 mt-2">
            {formatRupiah(kpis.totalProcurementValue)}
          </div>
          <div className="text-[11px] text-neutral-600 mt-1">
            Total belanja modal persediaan
          </div>
        </div>

        <div className="bg-neutral-950 text-white border border-black p-5 rounded-none shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-400">Hutang Jatuh Tempo</span>
            <div className="w-8 h-8 bg-neutral-800 text-amber-400 border border-neutral-700 flex items-center justify-center rounded-none">
              <Receipt size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-amber-400 mt-2">
            {formatRupiah(kpis.unpaidBillsAmount)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <AlertCircle size={12} className="text-amber-400" />
            <span>Tagihan vendor belum lunas</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-300 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-3 text-xs font-sport font-black uppercase tracking-wider transition-colors border-b-2 rounded-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pos'
              ? 'border-black text-black bg-white'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          <ClipboardList size={15} />
          <span>Purchase Orders (PO) ({purchaseOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-3 text-xs font-sport font-black uppercase tracking-wider transition-colors border-b-2 rounded-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'vendors'
              ? 'border-black text-black bg-white'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          <Building2 size={15} />
          <span>Daftar Supplier ({vendors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grn')}
          className={`px-4 py-3 text-xs font-sport font-black uppercase tracking-wider transition-colors border-b-2 rounded-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'grn'
              ? 'border-black text-black bg-white'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          <PackageCheck size={15} />
          <span>Penerimaan Barang (GRN) ({receivingNotes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bills')}
          className={`px-4 py-3 text-xs font-sport font-black uppercase tracking-wider transition-colors border-b-2 rounded-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bills'
              ? 'border-black text-black bg-white'
              : 'border-transparent text-neutral-500 hover:text-black'
          }`}
        >
          <Receipt size={15} />
          <span>Tagihan & Hutang Vendor ({vendorBills.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: PURCHASE ORDERS ================= */}
      {activeTab === 'pos' && (
        <div className="bg-white border border-neutral-300 rounded-none shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50">
            <div className="flex items-center gap-2">
              <span className="font-sport font-black text-sm uppercase text-neutral-900">Daftar Purchase Order</span>
              <span className="px-2 py-0.5 bg-neutral-200 text-neutral-800 text-[10px] font-bold rounded-none">
                {purchaseOrders.length} Arsip
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nomor PO atau vendor..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-300 focus:border-black focus:outline-none rounded-none w-56 sm:w-64"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100 text-[11px] font-sport font-bold uppercase text-neutral-600 tracking-wider">
                  <th className="py-3 px-4">Nomor PO</th>
                  <th className="py-3 px-4">Nama Vendor</th>
                  <th className="py-3 px-4">Tgl Order</th>
                  <th className="py-3 px-4">Est. Kirim</th>
                  <th className="py-3 px-4 text-right">Nilai Tagihan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs text-neutral-800 font-sans">
                {purchaseOrders.map((po) => {
                  const statusColors = {
                    draft: 'bg-neutral-100 text-neutral-800 border-neutral-300',
                    approved: 'bg-blue-50 text-blue-800 border-blue-300',
                    sent: 'bg-purple-50 text-purple-800 border-purple-300',
                    received: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                    cancelled: 'bg-red-50 text-red-800 border-red-300'
                  };

                  return (
                    <tr key={po.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-950">
                        {po.po_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        {po.vendor_name}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 font-mono">
                        {po.order_date}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 font-mono">
                        {po.expected_delivery_date}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sport font-bold text-neutral-950">
                        {formatRupiah(po.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-none border ${statusColors[po.status] || 'bg-neutral-100'}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPOForDetail(po)}
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-none cursor-pointer transition-colors"
                            title="Lihat Detail Item PO"
                          >
                            <Eye size={14} />
                          </button>
                          {po.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleOpenReceiveModal(po)}
                              className="px-2 py-1 bg-black hover:bg-neutral-800 text-white text-[11px] font-sport font-bold uppercase rounded-none cursor-pointer transition-colors flex items-center gap-1"
                              title="Terima Barang Fisik di Gudang"
                            >
                              <PackageCheck size={13} className="text-amber-400" />
                              <span>Terima Barang</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: VENDORS ================= */}
      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs hover:border-black transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-3">
                  <span className="font-mono text-xs font-bold text-neutral-500">{vendor.code}</span>
                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase rounded-none">
                    Aktif
                  </span>
                </div>
                <h3 className="font-sport font-black text-lg uppercase text-neutral-950 mb-1">
                  {vendor.company_name}
                </h3>
                <div className="text-xs text-neutral-600 space-y-1.5 mt-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={13} className="text-neutral-400 shrink-0" />
                    <span>PIC: <strong className="text-neutral-900">{vendor.contact_person}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-neutral-400 shrink-0" />
                    <span className="font-mono">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-neutral-400 shrink-0" />
                    <span>{vendor.email}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <MapPin size={13} className="text-neutral-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{vendor.address}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-200 flex items-center justify-between text-[11px]">
                <span className="text-neutral-500 font-mono">Termin: <strong>{vendor.payment_terms_days} Hari</strong></span>
                <span className="font-mono text-neutral-600">{vendor.bank_account_info}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TAB 3: GOODS RECEIVING NOTES (GRN) ================= */}
      {activeTab === 'grn' && (
        <div className="bg-white border border-neutral-300 rounded-none shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50">
            <span className="font-sport font-black text-sm uppercase text-neutral-900">
              Riwayat Bukti Penerimaan Barang (GRN)
            </span>
          </div>

          <div className="divide-y divide-neutral-200">
            {receivingNotes.map((grn) => (
              <div key={grn.id} className="p-5 hover:bg-neutral-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-neutral-950">{grn.grn_number}</span>
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-mono border border-neutral-300 rounded-none">
                        Ref: {grn.po_number}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">
                      Supplier: <strong className="text-neutral-900">{grn.vendor_name}</strong> • Surat Jalan: <span className="font-mono">{grn.delivery_order_number}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-neutral-500">{grn.received_date}</div>
                    <div className="text-[11px] text-neutral-700">Diterima oleh: {grn.received_by}</div>
                  </div>
                </div>

                <div className="bg-neutral-100 border border-neutral-200 p-3 rounded-none">
                  <div className="text-[11px] font-sport font-bold uppercase text-neutral-600 mb-2">Item Fisik Diterima:</div>
                  <div className="space-y-1.5">
                    {grn.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between text-xs bg-white p-2 border border-neutral-200 rounded-none">
                        <div>
                          <span className="font-mono font-bold text-neutral-900 mr-2">{it.sku}</span>
                          <span>{it.product_name}</span>
                        </div>
                        <div className="font-mono font-bold text-neutral-950">
                          +{it.accepted_quantity} Unit • HPP {formatRupiah(it.unit_cost)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: VENDOR BILLS ================= */}
      {activeTab === 'bills' && (
        <div className="bg-white border border-neutral-300 rounded-none shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <span className="font-sport font-black text-sm uppercase text-neutral-900">
              Daftar Tagihan Hutang Supplier
            </span>
            <span className="text-xs font-mono text-neutral-500">Auto-generated dari GRN / PO</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100 text-[11px] font-sport font-bold uppercase text-neutral-600 tracking-wider">
                  <th className="py-3 px-4">No. Tagihan</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Ref PO</th>
                  <th className="py-3 px-4">Jatuh Tempo</th>
                  <th className="py-3 px-4 text-right">Jumlah Tagihan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs text-neutral-800 font-sans">
                {vendorBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-950">{bill.bill_number}</td>
                    <td className="py-3.5 px-4 font-bold text-neutral-900">{bill.vendor_name}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-600">{bill.po_number}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-600">{bill.due_date}</td>
                    <td className="py-3.5 px-4 text-right font-sport font-bold text-neutral-950">
                      {formatRupiah(bill.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                        bill.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {bill.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {bill.status !== 'paid' ? (
                        <button
                          type="button"
                          onClick={() => handlePayBill(bill.id)}
                          className="px-3 py-1 bg-black hover:bg-neutral-800 text-white text-[11px] font-sport font-bold uppercase rounded-none cursor-pointer transition-colors"
                        >
                          Bayar Tagihan
                        </button>
                      ) : (
                        <span className="text-emerald-600 text-xs flex items-center justify-center gap-1">
                          <Check size={14} /> Terbayar
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH VENDOR ================= */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-neutral-400 w-full max-w-lg p-6 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                Pendaftaran Vendor / Supplier Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddVendorOpen(false)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Nama Perusahaan / Supplier</label>
                <input
                  type="text"
                  required
                  value={newVendor.company_name}
                  onChange={(e) => setNewVendor(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="Contoh: PT Apparel Indonesia Prima"
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Nama PIC (Kontak)</label>
                  <input
                    type="text"
                    required
                    value={newVendor.contact_person}
                    onChange={(e) => setNewVendor(p => ({ ...p, contact_person: e.target.value }))}
                    placeholder="Budi Santoso"
                    className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Telepon / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor(p => ({ ...p, phone: e.target.value }))}
                    placeholder="08123456789"
                    className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor(p => ({ ...p, email: e.target.value }))}
                    placeholder="sales@supplier.com"
                    className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Termin Pembayaran (Hari)</label>
                  <input
                    type="number"
                    value={newVendor.payment_terms_days}
                    onChange={(e) => setNewVendor(p => ({ ...p, payment_terms_days: Number(e.target.value) }))}
                    className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Alamat Pabrik / Gudang Vendor</label>
                <textarea
                  rows={2}
                  value={newVendor.address}
                  onChange={(e) => setNewVendor(p => ({ ...p, address: e.target.value }))}
                  placeholder="Kawasan Industri Jababeka Blok C-12..."
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Info Rekening Bank</label>
                <input
                  type="text"
                  value={newVendor.bank_account_info}
                  onChange={(e) => setNewVendor(p => ({ ...p, bank_account_info: e.target.value }))}
                  placeholder="BCA 7788990011 a.n PT Apparel Indonesia"
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-sport font-bold uppercase rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-sport font-bold uppercase rounded-none cursor-pointer"
                >
                  Simpan Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BUAT PO BARU ================= */}
      {isCreatePOOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-neutral-400 w-full max-w-lg p-6 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                Penerbitan Purchase Order (PO)
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatePOOpen(false)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Pilih Supplier / Vendor</label>
                <select
                  value={newPO.vendor_id}
                  onChange={(e) => setNewPO(p => ({ ...p, vendor_id: e.target.value }))}
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none bg-white"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.company_name} ({v.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Estimasi Tanggal Kirim</label>
                <input
                  type="date"
                  value={newPO.expected_delivery_date}
                  onChange={(e) => setNewPO(p => ({ ...p, expected_delivery_date: e.target.value }))}
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                />
              </div>

              <div className="border border-neutral-200 p-3 bg-neutral-50 rounded-none space-y-2">
                <div className="font-sport font-bold text-[11px] uppercase text-neutral-700">Rincian Barang Dipesan:</div>
                <div className="space-y-2">
                  {newPO.items.map((it, idx) => (
                    <div key={idx} className="bg-white p-2.5 border border-neutral-200 rounded-none space-y-2">
                      <div className="font-bold text-neutral-900">{it.product_name} ({it.variant_name})</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-500 block">Kuantitas (Pcs)</label>
                          <input
                            type="number"
                            min="1"
                            value={it.ordered_quantity}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setNewPO(prev => ({
                                ...prev,
                                items: prev.items.map((item, i) => i === idx ? { ...item, ordered_quantity: val } : item)
                              }));
                            }}
                            className="w-full p-1.5 border border-neutral-300 rounded-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-500 block">Harga Beli Unit</label>
                          <input
                            type="number"
                            step="1000"
                            value={it.unit_price}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setNewPO(prev => ({
                                ...prev,
                                items: prev.items.map((item, i) => i === idx ? { ...item, unit_price: val } : item)
                              }));
                            }}
                            className="w-full p-1.5 border border-neutral-300 rounded-none"
                          />
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-bold text-neutral-900">
                        Subtotal: {formatRupiah(it.ordered_quantity * it.unit_price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={newPO.notes}
                  onChange={(e) => setNewPO(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Instruksi packing kardus double wall..."
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePOOpen(false)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-sport font-bold uppercase rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-sport font-bold uppercase rounded-none cursor-pointer"
                >
                  Terbitkan PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TERIMA BARANG (GRN) ================= */}
      {selectedPOForReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-neutral-400 w-full max-w-lg p-6 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                  Form Penerimaan Barang (GRN)
                </h3>
                <div className="text-[11px] font-mono text-neutral-500">
                  Ref: {selectedPOForReceive.po_number} • {selectedPOForReceive.vendor_name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPOForReceive(null)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReceive} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Nomor Surat Jalan Vendor</label>
                  <input
                    type="text"
                    required
                    value={receiveForm.delivery_order_number}
                    onChange={(e) => setReceiveForm(p => ({ ...p, delivery_order_number: e.target.value }))}
                    className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Penerima (Staf Gudang)</label>
                  <input
                    type="text"
                    required
                    value={receiveForm.received_by}
                    onChange={(e) => setReceiveForm(p => ({ ...p, received_by: e.target.value }))}
                    className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                  />
                </div>
              </div>

              <div className="border border-neutral-200 p-3 bg-neutral-50 rounded-none space-y-2">
                <div className="font-sport font-bold text-[11px] uppercase text-neutral-700">Verifikasi Fisik Kuantitas:</div>
                <div className="space-y-2">
                  {selectedPOForReceive.items.map((it) => (
                    <div key={it.id} className="bg-white p-2.5 border border-neutral-200 rounded-none flex items-center justify-between">
                      <div>
                        <div className="font-bold text-neutral-900">{it.product_name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">Dipesan: {it.ordered_quantity} unit</div>
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] text-neutral-500 block">Diterima</label>
                        <input
                          type="number"
                          min="0"
                          max={it.ordered_quantity}
                          value={receiveForm.accepted_quantities[it.id] || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setReceiveForm(p => ({
                              ...p,
                              accepted_quantities: { ...p.accepted_quantities, [it.id]: val }
                            }));
                          }}
                          className="w-full p-1.5 border border-neutral-300 font-mono font-bold text-right rounded-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Catatan Pemeriksaan QC Fisik</label>
                <input
                  type="text"
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Kondisi kemasan rapi, segel pabrik utuh..."
                  className="w-full p-2 border border-neutral-300 focus:border-black focus:outline-none rounded-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPOForReceive(null)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-sport font-bold uppercase rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-sport font-bold uppercase rounded-none cursor-pointer"
                >
                  Konfirmasi Penerimaan Fisik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DETAIL PO ================= */}
      {selectedPOForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-neutral-400 w-full max-w-lg p-6 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                  Rincian Purchase Order {selectedPOForDetail.po_number}
                </h3>
                <div className="text-[11px] text-neutral-500 font-mono">
                  Supplier: {selectedPOForDetail.vendor_name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPOForDetail(null)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-neutral-100 p-3 rounded-none space-y-1">
                <div>Gudang Tujuan: <strong>{selectedPOForDetail.warehouse_name}</strong></div>
                <div>Tanggal PO: <span className="font-mono">{selectedPOForDetail.order_date}</span></div>
                <div>Target Pengiriman: <span className="font-mono">{selectedPOForDetail.expected_delivery_date}</span></div>
                <div>Catatan: <em>{selectedPOForDetail.notes}</em></div>
              </div>

              <div className="border border-neutral-200 divide-y divide-neutral-200 rounded-none">
                {selectedPOForDetail.items.map((it) => (
                  <div key={it.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-neutral-900">{it.product_name}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{it.sku} • {it.variant_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-neutral-950 font-mono">{it.ordered_quantity} x {formatRupiah(it.unit_price)}</div>
                      <div className="text-[11px] text-neutral-600 font-sport font-bold">{formatRupiah(it.subtotal)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-sm font-sport font-black uppercase text-neutral-950">
                <span>Total Nilai PO:</span>
                <span>{formatRupiah(selectedPOForDetail.total_amount)}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPOForDetail(null)}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-sport font-bold uppercase rounded-none cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
