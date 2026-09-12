import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  RotateCcw, 
  Eye, 
  CreditCard, 
  MoreVertical, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  Building2, 
  Check, 
  X 
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import { formatRupiah } from '../utils/formatters';
import { procurementService } from '../services/procurementService';

export default function VendorBillListPage({
  onShowToast = () => {}
}) {
  const [vendorBills, setVendorBills] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Pagination & selection states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedBillDetail, setSelectedBillDetail] = useState(null);
  const [payingBill, setPayingBill] = useState(null);

  const loadBills = () => {
    const data = procurementService.getVendorBills();
    setVendorBills(data);
  };

  useEffect(() => {
    loadBills();
    const unsubscribe = procurementService.subscribe(() => {
      loadBills();
    });
    return () => unsubscribe();
  }, []);

  // Filtered & Paginated
  const filteredBills = useMemo(() => {
    return vendorBills.filter(bill => {
      const matchSearch = (bill.bill_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bill.vendor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bill.po_number || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || bill.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vendorBills, searchQuery, statusFilter]);

  const paginatedBills = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredBills.slice(start, start + limit);
  }, [filteredBills, page, limit]);

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
  const handleConfirmPay = () => {
    if (!payingBill) return;
    procurementService.payVendorBill(payingBill.id);
    onShowToast(`Pelunasan tagihan ${payingBill.bill_number} berhasil dicatat.`);
    setPayingBill(null);
    setActiveActionMenuId(null);
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
                    setSelectedBillDetail(r);
                    setActiveActionMenuId(null);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-blue-700 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Eye size={14} className="text-blue-600" />
                  <span>Lihat Detail Tagihan</span>
                </button>

                {r.status !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayingBill(r);
                      setActiveActionMenuId(null);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-sport font-bold uppercase text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 cursor-pointer border-t border-neutral-100 transition-colors"
                  >
                    <CreditCard size={14} className="text-emerald-600" />
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
    <div className="space-y-6">
      {/* Header Modul Bersih (0 Tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-950 text-white flex items-center justify-center rounded-none shrink-0 shadow-xs">
            <Receipt size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-sport font-black uppercase tracking-tight text-neutral-950">
              Tagihan Vendor (Bills)
            </h1>
            <p className="text-xs text-neutral-600 font-sans mt-0.5">
              Manajemen faktur hutang dagang supplier dari dokumen PO/GRN dan pencatatan riwayat pelunasan kas toko.
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={RotateCcw}
            tooltip="Muat Ulang Tagihan"
            onClick={loadBills}
            variant="secondary"
          />
        </div>
      </div>

      {/* KPI Cards Khusus Bills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500">Total Tagihan Masuk</span>
            <div className="w-8 h-8 bg-neutral-100 text-neutral-900 border border-neutral-300 flex items-center justify-center rounded-none">
              <Receipt size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-neutral-950 mt-2">
            {kpis.totalCount} <span className="text-xs font-sans font-normal text-neutral-500">Faktur</span>
          </div>
          <div className="text-[11px] text-neutral-600 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Faktur hutang supplier</span>
          </div>
        </div>

        <div className="bg-neutral-950 text-white border border-black p-5 rounded-none shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-400">Hutang Belum Lunas</span>
            <div className="w-8 h-8 bg-neutral-800 text-amber-400 border border-neutral-700 flex items-center justify-center rounded-none">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-amber-400 mt-2">
            {formatRupiah(kpis.unpaidAmount)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {kpis.unpaidCount} faktur belum dibayar
          </div>
        </div>

        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500">Tagihan Telah Lunas</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center justify-center rounded-none">
              <Check size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-neutral-950 mt-2">
            {kpis.paidCount} <span className="text-xs font-sans font-normal text-neutral-500">Lunas</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            Kewajiban terselesaikan
          </div>
        </div>

        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500">Total Kas Terbayar</span>
            <div className="w-8 h-8 bg-neutral-100 text-neutral-900 border border-neutral-300 flex items-center justify-center rounded-none">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-neutral-950 mt-2">
            {formatRupiah(kpis.totalPaidAmount)}
          </div>
          <div className="text-[11px] text-neutral-600 mt-1">
            Realisasi pembayaran vendor
          </div>
        </div>
      </div>

      {/* Tabel Data Tunggal ServerSideTable */}
      <ServerSideTable
        columns={columns}
        data={paginatedBills}
        selectable={true}
        selectedRows={selectedBillIds}
        onSelectRows={setSelectedBillIds}
        total={filteredBills.length}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyMessage="Belum ada data tagihan vendor."
      />

      {/* MODAL: DETAIL TAGIHAN */}
      {selectedBillDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-neutral-400 w-full max-w-lg p-6 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <span className="font-mono font-bold text-base text-neutral-950">{selectedBillDetail.bill_number}</span>
                <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                  selectedBillDetail.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {selectedBillDetail.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBillDetail(null)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Nama Vendor:</span>
                  <strong className="text-neutral-900">{selectedBillDetail.vendor_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Referensi Dokumen PO:</span>
                  <span className="font-mono text-neutral-800">{selectedBillDetail.po_number}</span>
                </div>
                {selectedBillDetail.grn_number && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Referensi Dokumen GRN:</span>
                    <span className="font-mono text-neutral-800">{selectedBillDetail.grn_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tanggal Faktur:</span>
                  <span className="font-mono">{selectedBillDetail.bill_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Jatuh Tempo Pembayaran:</span>
                  <span className="font-mono font-bold text-neutral-950">{selectedBillDetail.due_date}</span>
                </div>
              </div>

              <div className="p-4 bg-neutral-950 text-white rounded-none flex items-center justify-between">
                <span className="font-sport font-bold uppercase text-neutral-400">Total Nominal Tagihan:</span>
                <span className="font-sport font-black text-xl text-amber-400">
                  {formatRupiah(selectedBillDetail.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI PELUNASAN TAGIHAN */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-neutral-400 w-full max-w-md p-6 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-neutral-950" />
                <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                  Konfirmasi Pelunasan Hutang
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-neutral-600">
                Anda akan mencatat pelunasan faktur tagihan berikut ke kas pengeluaran toko:
              </p>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Faktur:</span>
                  <span className="font-bold text-neutral-950">{payingBill.bill_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Vendor:</span>
                  <span className="font-bold text-neutral-900">{payingBill.vendor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Nominal:</span>
                  <span className="font-bold text-neutral-950">{formatRupiah(payingBill.amount)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingBill(null)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-sport font-bold uppercase rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPay}
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-sport font-black uppercase tracking-wider rounded-none cursor-pointer"
                >
                  Konfirmasi Bayar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
