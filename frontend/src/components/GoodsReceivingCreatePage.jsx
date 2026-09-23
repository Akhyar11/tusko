import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  X,
  Save,
  PackageCheck,
  Truck,
  Boxes,
  AlertCircle,
  FileText,
  PackageX,
  ClipboardCheck,
  Wallet
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import ServerSideSelect from './molecules/ServerSideSelect';
import FormTipsPanel from './organisms/FormTipsPanel';
import { procurementService } from '../services/procurementService';
import { formatRupiah } from '../utils/formatters';

const REJECTION_REASONS = [
  { value: 'damage', label: 'Barang Rusak / Pecah / Cacat Produksi' },
  { value: 'loss', label: 'Barang Hilang / Selisih Jumlah Kirim' },
  { value: 'expired', label: 'Kedaluwarsa / Masa Simpan Habis' },
  { value: 'wrong_item', label: 'Salah Kirim / Tidak Sesuai Pesanan' },
  { value: 'other', label: 'Alasan Lainnya' }
];

function buildRows(po) {
  return (po?.items || []).map((it) => {
    const ordered = Number(it.ordered_quantity) || 0;
    const alreadyReceived = Number(it.received_quantity) || 0;
    const remaining = Math.max(0, ordered - alreadyReceived);
    return {
      itemId: it.id,
      productName: it.product_name || 'Produk',
      variantName: it.variant_name || null,
      sku: it.sku || '-',
      ordered,
      alreadyReceived,
      remaining,
      accepted: remaining,
      rejected: 0,
      reason: REJECTION_REASONS[0].value,
      unitPrice: Number(it.unit_price) || 0
    };
  });
}

export default function GoodsReceivingCreatePage({
  po = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [rows, setRows] = useState(() => buildRows(po));
  const [deliveryOrderNumber, setDeliveryOrderNumber] = useState(
    `DO-${Date.now().toString().slice(-6)}`
  );
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = useMemo(() => {
    const totalRemaining = rows.reduce((s, r) => s + r.remaining, 0);
    const totalAccepted = rows.reduce((s, r) => s + (Number(r.accepted) || 0), 0);
    const totalRejected = rows.reduce((s, r) => s + (Number(r.rejected) || 0), 0);
    const billAmount = rows.reduce(
      (s, r) => s + (Number(r.accepted) || 0) * r.unitPrice,
      0
    );
    return { totalRemaining, totalAccepted, totalRejected, billAmount };
  }, [rows]);

  const updateRow = (index, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    for (const row of rows) {
      const accepted = Number(row.accepted) || 0;
      const rejected = Number(row.rejected) || 0;

      if (accepted < 0 || rejected < 0) {
        setErrorMessage('Kuantitas tidak boleh negatif.');
        return;
      }
      if (accepted + rejected > row.remaining) {
        setErrorMessage(
          `Total diterima + ditolak untuk ${row.productName} melebihi sisa pesanan (${row.remaining} unit).`
        );
        return;
      }
    }

    if (totals.totalAccepted + totals.totalRejected <= 0) {
      setErrorMessage('Minimal satu item harus memiliki kuantitas diterima atau ditolak.');
      return;
    }

    const acceptedQuantities = {};
    const rejectedQuantities = {};
    const rejectionReasons = {};

    rows.forEach((row) => {
      const accepted = Number(row.accepted) || 0;
      const rejected = Number(row.rejected) || 0;
      acceptedQuantities[row.itemId] = accepted;
      rejectedQuantities[row.itemId] = rejected;
      if (rejected > 0) {
        rejectionReasons[row.itemId] = row.reason;
      }
    });

    setIsSubmitting(true);
    try {
      const result = await procurementService.receivePurchaseOrder(po.id, {
        delivery_order_number: deliveryOrderNumber,
        notes,
        accepted_quantities: acceptedQuantities,
        rejected_quantities: rejectedQuantities,
        rejection_reasons: rejectionReasons
      });
      onShowToast(
        `Penerimaan ${result?.grn?.grn_number || ''} berhasil. ${totals.totalRejected > 0 ? `${totals.totalRejected} unit ditolak (rusak/hilang).` : 'Seluruh barang diterima baik.'}`
      );
      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memproses penerimaan barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!po) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <div className="bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-none flex items-center justify-center mx-auto border border-neutral-200">
            <PackageCheck size={32} />
          </div>
          <h2 className="text-xl font-sport font-black text-neutral-950 uppercase tracking-tight">
            Purchase Order Tidak Ditemukan
          </h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Dokumen PO yang akan diterima tidak tersedia. Silakan pilih PO dari antrean pengadaan.
          </p>
          <button
            type="button"
            onClick={onNavigateBack}
            className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-wider rounded-none cursor-pointer transition-colors"
          >
            Kembali ke Antrean PO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Kartu Header Form Kanonis (aturan 25) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton
            icon={ArrowLeft}
            onClick={onNavigateBack}
            tooltip="Kembali ke Antrean PO"
            variant="outline"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              Penerimaan Barang (GRN)
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            icon={X}
            onClick={onNavigateBack}
            tooltip="Batal"
            variant="secondary"
            disabled={isSubmitting}
          />
          <IconButton
            icon={Save}
            onClick={() => handleSubmit(null)}
            tooltip="Proses Penerimaan Barang"
            variant="primary"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Konten Form + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Kartu Form */}
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5 lg:col-span-3">
          <form id="grn-form" onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="cursor-pointer text-rose-600 hover:text-rose-800 shrink-0 ml-3"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Section 1: Referensi Dokumen */}
            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Truck size={16} className="text-amber-500" />
                <span>1. Referensi Dokumen Penerimaan</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nomor Purchase Order
                  </label>
                  <TextInput type="text" value={po.po_number || '-'} disabled weight="mono" />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Rekanan Vendor
                  </label>
                  <TextInput type="text" value={po.vendor_name || '-'} disabled />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nomor Surat Jalan (DO) <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    type="text"
                    value={deliveryOrderNumber}
                    onChange={setDeliveryOrderNumber}
                    placeholder="Masukkan nomor surat jalan vendor..."
                    weight="mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Rincian Kuantitas Diterima & Ditolak */}
            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Boxes size={16} className="text-amber-500" />
                <span>2. Rincian Kuantitas Diterima &amp; Ditolak</span>
              </h2>

              <div className="mt-4 overflow-x-auto border border-neutral-200 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-100 text-[11px] font-sport font-black uppercase tracking-wider text-neutral-700">
                      <th className="py-2.5 px-3 min-w-[200px]">Varian Produk &amp; SKU</th>
                      <th className="py-2.5 px-3 w-24 text-center">Sisa Pesan</th>
                      <th className="py-2.5 px-3 w-28">Diterima <span className="text-rose-500">*</span></th>
                      <th className="py-2.5 px-3 w-28">Ditolak</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Alasan Penolakan</th>
                      <th className="py-2.5 px-3 w-36 text-right">Nilai Diterima</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-xs">
                    {rows.map((row, idx) => {
                      const rejectedNum = Number(row.rejected) || 0;
                      const acceptedNum = Number(row.accepted) || 0;
                      const rowValue = acceptedNum * row.unitPrice;
                      const overLimit = acceptedNum + rejectedNum > row.remaining;

                      return (
                        <tr key={row.itemId || idx} className="hover:bg-neutral-50/80 transition-colors align-top">
                          <td className="py-2 px-3">
                            <div className="font-sport font-black text-xs text-neutral-950 uppercase leading-snug">
                              {row.productName}
                            </div>
                            <div className="font-mono text-[10px] text-neutral-500 mt-0.5">
                              {row.variantName ? `${row.variantName} • ` : ''}{row.sku}
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              Dipesan {row.ordered} • Sudah diterima {row.alreadyReceived}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="font-mono font-bold text-neutral-800">{row.remaining}</span>
                          </td>
                          <td className="py-2 px-3">
                            <TextInput
                              type="number"
                              min="0"
                              max={row.remaining}
                              weight="mono"
                              value={row.accepted}
                              onChange={(val) => updateRow(idx, 'accepted', val)}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <TextInput
                              type="number"
                              min="0"
                              max={row.remaining}
                              weight="mono"
                              value={row.rejected}
                              onChange={(val) => updateRow(idx, 'rejected', val)}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <ServerSideSelect
                              value={row.reason}
                              onChange={(val) => updateRow(idx, 'reason', val)}
                              options={REJECTION_REASONS}
                              disabled={rejectedNum <= 0}
                              placeholder="Pilih alasan penolakan..."
                            />
                            {overLimit && (
                              <span className="text-[10px] text-rose-600 font-bold mt-1 block">
                                Diterima + ditolak melebihi sisa pesanan.
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className="font-mono font-black text-xs text-neutral-900">
                              {formatRupiah(rowValue)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Catatan & Rekap */}
            <div className="pt-4 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Catatan Penerimaan &amp; Kondisi Fisik
                </label>
                <TextArea
                  rows={4}
                  value={notes}
                  onChange={setNotes}
                  placeholder="Catatan QC, kondisi kemasan, nomor kontak kurir vendor, dan keterangan barang rusak/hilang..."
                />
              </div>

              <div className="bg-neutral-950 text-white p-5 border border-black rounded-none shadow-sm space-y-2">
                <div className="flex justify-between items-center text-neutral-400 text-xs font-sport uppercase">
                  <span>Total Dipesan (sisa)</span>
                  <span className="font-mono font-bold text-white">{totals.totalRemaining} Unit</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400 text-xs font-sport uppercase">
                  <span>Diterima Masuk Stok</span>
                  <span className="font-mono font-bold text-emerald-400">+{totals.totalAccepted} Unit</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400 text-xs font-sport uppercase">
                  <span>Ditolak (Rusak/Hilang)</span>
                  <span className="font-mono font-bold text-rose-400">-{totals.totalRejected} Unit</span>
                </div>
                <div className="flex justify-between items-center border-t border-neutral-800 pt-2">
                  <span className="text-xs font-sport font-bold uppercase tracking-wider text-amber-400">
                    Nilai Tagihan Diterima
                  </span>
                  <span className="text-xl font-sport font-black text-white font-mono">
                    {formatRupiah(totals.billAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50"
              >
                <ClipboardCheck size={15} />
                <span>{isSubmitting ? 'Memproses...' : 'Proses Penerimaan Barang'}</span>
              </button>
              <button
                type="button"
                onClick={onNavigateBack}
                disabled={isSubmitting}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </form>
        </div>

        <FormTipsPanel
          className="lg:col-span-1"
          title="Panduan Penerimaan"
          tips={[
            { icon: FileText, heading: 'Cocokkan Surat Jalan', text: 'Pastikan nomor surat jalan vendor sesuai dengan fisik barang yang tiba di gudang.' },
            { icon: PackageCheck, heading: 'Hitung Fisik Diterima', text: 'Isi kolom Diterima hanya untuk unit yang benar-benar layak masuk stok.' },
            { icon: PackageX, heading: 'Catat Barang Rusak/Hilang', text: 'Unit rusak atau hilang diisi di kolom Ditolak beserta alasannya, sehingga tidak dihitung sebagai stok maupun tagihan.' },
            { icon: Wallet, heading: 'Tagihan Otomatis', text: 'Nilai tagihan vendor dihitung hanya dari unit diterima. Unit ditolak tidak akan ditagih.' },
            { icon: Boxes, heading: 'Stok Langsung Bertambah', text: 'Setelah diproses, stok gudang bertambah dan dokumen GRN + Tagihan Vendor otomatis terbit.' },
            { icon: AlertCircle, heading: 'Sisa Pesanan', text: 'Jika ada sisa yang belum tiba, PO tetap berstatus diterima sebagian dan dapat diterima kembali nanti.' },
          ]}
        />
      </div>
    </div>
  );
}
