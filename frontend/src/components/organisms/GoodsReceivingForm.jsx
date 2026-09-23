import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Boxes,
  ClipboardCheck,
  FileText,
  PackageCheck,
  PackageX,
  Truck,
  Upload
} from 'lucide-react';
import TextInput from '../molecules/TextInput';
import TextArea from '../molecules/TextArea';
import ServerSideSelect from '../molecules/ServerSideSelect';
import FileInput from '../molecules/FileInput';
import { procurementService } from '../../services/procurementService';
import { formatRupiah } from '../../utils/formatters';

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

/**
 * Organism: GoodsReceivingForm
 * Form penerimaan barang (Diterima/Ditolak + alasan) yang dapat dirender inline
 * pada halaman Detail PO (tanpa pindah halaman / tanpa modal overlay).
 */
export default function GoodsReceivingForm({
  po = null,
  onCancel = () => {},
  onReceived = () => {},
  onShowToast = () => {}
}) {
  const [rows, setRows] = useState(() => buildRows(po));
  const [deliveryOrderNumber, setDeliveryOrderNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [billAmountInput, setBillAmountInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    procurementService
      .getNextDeliveryOrderNumber()
      .then((code) => {
        if (active && code) setDeliveryOrderNumber((prev) => prev || code);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [po?.id]);

  const totals = useMemo(() => {
    const totalRemaining = rows.reduce((s, r) => s + r.remaining, 0);
    const totalAccepted = rows.reduce((s, r) => s + (Number(r.accepted) || 0), 0);
    const totalRejected = rows.reduce((s, r) => s + (Number(r.rejected) || 0), 0);
    const billAmount = rows.reduce((s, r) => s + (Number(r.accepted) || 0) * r.unitPrice, 0);
    const poTotal = rows.reduce((s, r) => s + r.ordered * r.unitPrice, 0);
    return { totalRemaining, totalAccepted, totalRejected, billAmount, poTotal };
  }, [rows]);

  const effectiveBillAmount = billAmountInput === '' ? totals.billAmount : (Number(billAmountInput) || 0);

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

    if (!invoiceFile) {
      setErrorMessage('Bukti invoice vendor (foto/PDF) wajib diunggah.');
      return;
    }

    if (Number(billAmountInput) < 0) {
      setErrorMessage('Nominal tagihan tidak boleh negatif.');
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
      if (rejected > 0) rejectionReasons[row.itemId] = row.reason;
    });

    setIsSubmitting(true);
    try {
      const result = await procurementService.receivePurchaseOrder(po.id, {
        delivery_order_number: deliveryOrderNumber,
        notes,
        bill_amount: effectiveBillAmount,
        invoice_file: invoiceFile,
        accepted_quantities: acceptedQuantities,
        rejected_quantities: rejectedQuantities,
        rejection_reasons: rejectionReasons
      });
      onShowToast(
        `Penerimaan ${result?.grn?.grn_number || ''} berhasil. ${totals.totalRejected > 0 ? `${totals.totalRejected} unit ditolak (rusak/hilang).` : 'Seluruh barang diterima baik.'}`
      );
      onReceived(result);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memproses penerimaan barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
          <PackageCheck size={16} className="text-amber-500" />
          <span>Penerimaan Barang (GRN) — Diterima / Ditolak</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-sport font-black uppercase tracking-wider rounded-none">
            Mode Aktif
          </span>
        </h2>
        <span className="text-[11px] font-mono font-bold text-neutral-500 uppercase">
          {po?.po_number}
        </span>
      </div>

      <form id="po-receive-form" onSubmit={handleSubmit} className="space-y-6">
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

        {/* Info Dokumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Rekanan Vendor
            </label>
            <TextInput type="text" value={po?.vendor_name || '-'} disabled />
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
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Nomor otomatis format baku <span className="font-mono font-bold">DO/ddmmyyyy/001</span> — dapat diubah manual bila vendor memiliki nomor sendiri.
            </span>
          </div>
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Gudang Penerima
            </label>
            <TextInput type="text" value={po?.warehouse_name || '-'} disabled />
          </div>
        </div>

        {/* Rincian Item */}
        <div className="overflow-x-auto border border-neutral-200 bg-white">
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

        {/* Bukti Invoice Vendor & Nominal Tagihan */}
        <div>
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <FileText size={16} className="text-amber-500" />
            <span>Bukti Invoice Vendor &amp; Nominal Tagihan</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Bukti Invoice Vendor (Foto/PDF) <span className="text-rose-500">*</span>
              </label>
              <FileInput accept="image/*,application/pdf" onChange={setInvoiceFile}>
                <div className="w-full min-h-[42px] px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-dashed border-neutral-300 hover:border-amber-500 rounded-none flex items-center gap-2 cursor-pointer transition-colors">
                  <Upload size={15} className="text-neutral-500 shrink-0" />
                  <span className="text-xs font-medium text-neutral-700 truncate">
                    {invoiceFile ? invoiceFile.name : 'Pilih berkas invoice (JPG/PNG/PDF, maks 5MB)...'}
                  </span>
                </div>
              </FileInput>
              {invoiceFile && (
                <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
                  Terlampir: {invoiceFile.name}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Nominal Tagihan Vendor (Rp) <span className="text-rose-500">*</span>
              </label>
              <TextInput
                type="number"
                min="0"
                weight="mono"
                value={billAmountInput === '' ? totals.billAmount : billAmountInput}
                onChange={setBillAmountInput}
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Nilai barang diterima: <span className="font-mono font-bold">{formatRupiah(totals.billAmount)}</span> • Total PO: <span className="font-mono font-bold">{formatRupiah(totals.poTotal)}</span>. Ubah bila vendor tetap menagih penuh walau ada barang hilang.
              </span>
            </div>
          </div>
        </div>

        {/* Catatan & Rekap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
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

          <div className="bg-neutral-50 border border-neutral-300 rounded-none p-4 space-y-2">
            <div className="flex justify-between items-center text-[11px] font-sport uppercase tracking-wider text-neutral-500">
              <span>Total Dipesan (sisa)</span>
              <span className="font-mono font-bold text-neutral-900">{totals.totalRemaining} Unit</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-sport uppercase tracking-wider text-neutral-500">
              <span>Diterima Masuk Stok</span>
              <span className="font-mono font-bold text-emerald-700">+{totals.totalAccepted} Unit</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-sport uppercase tracking-wider text-neutral-500">
              <span>Ditolak (Rusak/Hilang)</span>
              <span className="font-mono font-bold text-rose-600">-{totals.totalRejected} Unit</span>
            </div>
            <div className="flex justify-between items-center border-t border-neutral-200 pt-2">
              <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Nominal Tagihan Vendor
              </span>
              <span className="text-lg font-mono font-black text-amber-700">
                {formatRupiah(effectiveBillAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Aksi */}
        <div className="pt-3 border-t border-neutral-200 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50"
          >
            <ClipboardCheck size={15} />
            <span>{isSubmitting ? 'Memproses...' : 'Proses Penerimaan Barang'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
