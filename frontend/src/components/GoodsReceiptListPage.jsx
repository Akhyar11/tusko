import React, { useState, useEffect, useMemo } from 'react';
import { 
  PackageCheck, 
  RotateCcw, 
  Eye, 
  MoreVertical, 
  CheckCircle2, 
  Boxes, 
  Calendar, 
  Building2, 
  UserCheck, 
  FileText,
  X 
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import { formatRupiah } from '../utils/formatters';
import { procurementService } from '../services/procurementService';

export default function GoodsReceiptListPage({
  onShowToast = () => {}
}) {
  const [receivingNotes, setReceivingNotes] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Pagination & selection states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedGRNIds, setSelectedGRNIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [selectedGRNDetail, setSelectedGRNDetail] = useState(null);

  const loadGRNs = () => {
    const data = procurementService.getGoodsReceivingNotes();
    setReceivingNotes(data);
  };

  useEffect(() => {
    loadGRNs();
    const unsubscribe = procurementService.subscribe(() => {
      loadGRNs();
    });
    return () => unsubscribe();
  }, []);

  // Filtered & Paginated data
  const filteredGRNs = useMemo(() => {
    return receivingNotes.filter(grn => {
      const matchSearch = (grn.grn_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (grn.po_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (grn.vendor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (grn.delivery_order_number || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [receivingNotes, searchQuery]);

  const paginatedGRNs = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredGRNs.slice(start, start + limit);
  }, [filteredGRNs, page, limit]);

  // KPIs
  const kpis = useMemo(() => {
    const totalDocs = receivingNotes.length;
    const verifiedCount = receivingNotes.filter(g => g.status === 'verified').length;
    const totalUnits = receivingNotes.reduce((sum, g) => {
      const docSum = (g.items || []).reduce((s, it) => s + (Number(it.accepted_quantity) || 0), 0);
      return sum + docSum;
    }, 0);
    return { totalDocs, verifiedCount, totalUnits };
  }, [receivingNotes]);

  // Table Columns
  const columns = [
    {
      key: 'grn_number',
      label: 'Nomor GRN',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div>
            <div className="font-mono font-bold text-neutral-950 text-xs">{typeof val === 'string' ? val : (r.grn_number || '-')}</div>
            <div className="font-mono text-[10px] text-neutral-500">Ref PO: {r.po_number || '-'}</div>
          </div>
        );
      }
    },
    {
      key: 'vendor_name',
      label: 'Vendor Mitra',
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
      key: 'delivery_order_number',
      label: 'Surat Jalan (DO)',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="font-mono text-neutral-800 text-xs">
            {typeof val === 'string' ? val : (r.delivery_order_number || '-')}
          </div>
        );
      }
    },
    {
      key: 'received_date',
      label: 'Tgl Terima Fisik',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="font-mono text-neutral-700 text-xs">
            {typeof val === 'string' ? val : (r.received_date || '-')}
          </div>
        );
      }
    },
    {
      key: 'received_by',
      label: 'Penerima Gudang',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="text-neutral-800 text-xs flex items-center gap-1.5">
            <UserCheck size={13} className="text-neutral-400" />
            <span>{typeof val === 'string' ? val : (r.received_by || '-')}</span>
          </div>
        );
      }
    },
    {
      key: 'total_units',
      label: 'Unit Masuk',
      align: 'right',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const units = (r.items || []).reduce((s, it) => s + (Number(it.accepted_quantity) || 0), 0);
        return (
          <div className="font-mono font-bold text-neutral-950 text-xs text-right">
            +{units} Pcs
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status QC',
      align: 'center',
      render: (val, row) => (
        <span className="inline-block px-2 py-0.5 text-[10px] font-sport font-bold uppercase rounded-none border bg-emerald-50 text-emerald-800 border-emerald-300">
          TERVERIFIKASI
        </span>
      )
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
              title="Menu Aksi GRN"
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
                    setSelectedGRNDetail(r);
                    setActiveActionMenuId(null);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-blue-700 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Eye size={14} className="text-blue-600" />
                  <span>Lihat Detail Fisik</span>
                </button>
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
            <PackageCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-sport font-black uppercase tracking-tight text-neutral-950">
              Penerimaan Barang (GRN)
            </h1>
            <p className="text-xs text-neutral-600 font-sans mt-0.5">
              Pencatatan fisik barang masuk, verifikasi nomor surat jalan vendor, dan mutasi stok otomatis ke gudang pusat.
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={RotateCcw}
            tooltip="Muat Ulang Riwayat GRN"
            onClick={loadGRNs}
            variant="secondary"
          />
        </div>
      </div>

      {/* KPI Cards Khusus GRN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500">Total Dokumen GRN</span>
            <div className="w-8 h-8 bg-neutral-100 text-neutral-900 border border-neutral-300 flex items-center justify-center rounded-none">
              <FileText size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-neutral-950 mt-2">
            {kpis.totalDocs} <span className="text-xs font-sans font-normal text-neutral-500">Surat Jalan</span>
          </div>
          <div className="text-[11px] text-neutral-600 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Bukti fisik barang masuk</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500">Penerimaan Lolos QC</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center justify-center rounded-none">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-neutral-950 mt-2">
            {kpis.verifiedCount} <span className="text-xs font-sans font-normal text-neutral-500">Terverifikasi</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
            <span>Kondisi fisik sesuai PO</span>
          </div>
        </div>

        <div className="bg-neutral-950 text-white border border-black p-5 rounded-none shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-400">Total Unit Masuk Gudang</span>
            <div className="w-8 h-8 bg-neutral-800 text-amber-400 border border-neutral-700 flex items-center justify-center rounded-none">
              <Boxes size={16} />
            </div>
          </div>
          <div className="text-2xl font-sport font-black text-white mt-2">
            +{kpis.totalUnits} <span className="text-xs font-sans font-normal text-neutral-400">Pcs</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Persediaan fisik bertambah
          </div>
        </div>
      </div>

      {/* Tabel Data Tunggal ServerSideTable */}
      <ServerSideTable
        columns={columns}
        data={paginatedGRNs}
        selectable={true}
        selectedRows={selectedGRNIds}
        onSelectRows={setSelectedGRNIds}
        total={filteredGRNs.length}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyMessage="Belum ada riwayat Penerimaan Barang (GRN)."
      />

      {/* MODAL: DETAIL FISIK GRN */}
      {selectedGRNDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-neutral-400 w-full max-w-xl p-6 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <span className="font-mono font-bold text-base text-neutral-950">{selectedGRNDetail.grn_number}</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-none">
                  {selectedGRNDetail.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGRNDetail(null)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3 border border-neutral-200 rounded-none">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Vendor / Supplier:</span>
                  <strong className="text-neutral-900">{selectedGRNDetail.vendor_name}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Nomor Surat Jalan (DO):</span>
                  <span className="font-mono font-bold text-neutral-950">{selectedGRNDetail.delivery_order_number}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Referensi No. PO:</span>
                  <span className="font-mono text-neutral-800">{selectedGRNDetail.po_number}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Petugas Penerima:</span>
                  <span className="text-neutral-800">{selectedGRNDetail.received_by}</span>
                </div>
              </div>

              <div>
                <span className="font-sport font-black uppercase text-neutral-900 block mb-2">Item Fisik Diterima:</span>
                <div className="border border-neutral-200 divide-y divide-neutral-200">
                  {(selectedGRNDetail.items || []).map(it => (
                    <div key={it.id || it.sku} className="p-3 flex items-center justify-between hover:bg-neutral-50">
                      <div>
                        <div className="font-bold text-neutral-900">{it.product_name}</div>
                        <div className="font-mono text-[11px] text-neutral-500">{it.sku}</div>
                        {it.notes && (
                          <div className="text-[11px] text-emerald-700 mt-0.5 italic">Catatan QC: {it.notes}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-neutral-950">
                          +{it.accepted_quantity} Pcs Diterima
                        </div>
                        {it.unit_cost && (
                          <div className="text-[11px] text-neutral-500">
                            HPP: {formatRupiah(it.unit_cost)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
