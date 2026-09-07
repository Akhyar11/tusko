import React, { useState } from 'react';
import {
  MinusCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  CheckCircle2,
  UserCheck,
  X,
  Trash2,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

const reductionReasons = [
  { id: 'damage', label: 'Barang Rusak / Afkir / Cacat Produksi', icon: AlertTriangle, defaultDesc: 'Ditemukan cacat jahitan/material saat QC packing' },
  { id: 'sample', label: 'Sampel Display & Endorsement Promosi', icon: FileText, defaultDesc: 'Pengambilan unit untuk display offline store / influencer endorsement' },
  { id: 'expired', label: 'Kedaluwarsa / Masa Simpan Habis', icon: XCircle, defaultDesc: 'Kemasan rusak dan melewati batas retensi gudang' },
  { id: 'loss', label: 'Selisih Fisik / Kehilangan Opname', icon: ShieldAlert, defaultDesc: 'Selisih hitung fisik saat audit berkala gudang' },
  { id: 'manual_sale', label: 'Penjualan Offline / Luar Sistem Online', icon: CheckCircle2, defaultDesc: 'Terjual pada event pameran olahraga / kasir direct' }
];

export default function ReduceStockModal({
  isOpen = false,
  onClose = () => {},
  inventory = [],
  preselectedProductId = null,
  onSaveReduction = () => {}
}) {
  const defaultProduct = inventory.find((p) => p.id === preselectedProductId) || inventory[0];

  const [selectedProductId, setSelectedProductId] = useState(defaultProduct ? defaultProduct.id : '');
  const [quantity, setQuantity] = useState('');
  const [reasonId, setReasonId] = useState(reductionReasons[0].id);
  const [reference, setReference] = useState(
    `BA-DED/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [operator, setOperator] = useState('Siska Nurhaliza (QC & Pengawas Stok)');
  const [deductionDate, setDeductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(reductionReasons[0].defaultDesc);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const currentSelectedProduct = inventory.find((p) => p.id === Number(selectedProductId)) || inventory[0];
  const maxAvailable = currentSelectedProduct ? currentSelectedProduct.stock : 0;

  const handleProductChange = (productId) => {
    setSelectedProductId(productId);
    setErrorMessage('');
  };

  const handleReasonChange = (newReasonId) => {
    setReasonId(newReasonId);
    const found = reductionReasons.find((r) => r.id === newReasonId);
    if (found) {
      setNotes(found.defaultDesc);
    }
  };

  const qtyNumber = Number(quantity) || 0;
  const estimatedLoss = currentSelectedProduct ? qtyNumber * (currentSelectedProduct.cost_price || 0) : 0;
  const remainingAfter = Math.max(0, maxAvailable - qtyNumber);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentSelectedProduct) return;
    if (qtyNumber <= 0) {
      setErrorMessage('Jumlah unit yang dikurangi minimal 1 unit.');
      return;
    }
    if (qtyNumber > maxAvailable) {
      setErrorMessage(`Jumlah tidak boleh melebihi stok yang tersedia (${maxAvailable} unit).`);
      return;
    }

    const selectedReason = reductionReasons.find((r) => r.id === reasonId) || reductionReasons[0];

    const reductionData = {
      product: currentSelectedProduct,
      quantity: qtyNumber,
      reason: reasonId,
      reasonLabel: selectedReason.label,
      reference: reference.trim() || `BA-${Date.now()}`,
      operator: operator.trim() || 'Admin Gudang',
      deductionDate,
      notes: notes.trim() || selectedReason.label,
      estimatedLoss
    };

    onSaveReduction(reductionData);
    setSuccessMessage(`Berhasil mengurangi -${qtyNumber} unit dari stok ${currentSelectedProduct.sku}!`);

    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <MinusCircle className="text-rose-400" size={20} />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Kurangi / Penarikan Stok Fisik</h3>
              <p className="text-[11px] text-neutral-400">Pencatatan barang rusak, sampel promosi, dan selisih fisik</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">Pilih Produk</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-rose-500 font-medium text-gray-900 text-xs sm:text-sm"
              required
            >
              {inventory.map((item) => (
                <option key={item.id} value={item.id} disabled={item.stock <= 0}>
                  [{item.sku}] {item.name} — Stok Tersedia: {item.stock} unit {item.stock <= 0 ? '(HABIS)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Product Preview Card */}
          {currentSelectedProduct && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
              <img
                src={currentSelectedProduct.image_url}
                alt={currentSelectedProduct.name}
                className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0 bg-white"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 line-clamp-1">{currentSelectedProduct.name}</div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono mt-0.5">
                  <span>SKU: {currentSelectedProduct.sku}</span>
                  <span>•</span>
                  <span className={`font-bold ${maxAvailable === 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                    Tersedia: {maxAvailable} unit
                  </span>
                  <span>•</span>
                  <span>Min Safety: {currentSelectedProduct.stock_minimum}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reason for Reduction */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">Alasan Pengurangan Stok</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {reductionReasons.map((reason) => {
                const isSelected = reasonId === reason.id;
                const IconComponent = reason.icon;

                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => handleReasonChange(reason.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 text-rose-900'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <IconComponent
                      size={15}
                      className={`mt-0.5 shrink-0 ${isSelected ? 'text-rose-600' : 'text-gray-400'}`}
                    />
                    <div className="text-xs font-bold leading-tight">{reason.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Impact Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">
                Jumlah Yang Dikurangi (Unit) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={maxAvailable}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={`Maks ${maxAvailable} unit`}
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-rose-500 font-bold text-gray-900"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">unit</span>
              </div>
            </div>

            {/* Impact Calculation Preview */}
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-center">
              <div className="text-[11px] text-gray-500 flex justify-between">
                <span>Stok Sebelum:</span>
                <span className="font-bold text-gray-800">{maxAvailable} unit</span>
              </div>
              <div className="text-[11px] text-gray-500 flex justify-between mt-0.5">
                <span>Stok Sesudah:</span>
                <span
                  className={`font-black ${
                    remainingAfter === 0
                      ? 'text-rose-600'
                      : remainingAfter <= (currentSelectedProduct?.stock_minimum || 0)
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {remainingAfter} unit
                </span>
              </div>
              {estimatedLoss > 0 && (
                <div className="text-[11px] text-rose-700 font-semibold flex justify-between mt-0.5 pt-1 border-t border-gray-200">
                  <span>Estimasi Biaya Beban:</span>
                  <span>{formatRupiah(estimatedLoss)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reference & Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">No. Berita Acara / Referensi</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="BA-DED/..."
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-rose-500 text-gray-900 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Petugas Penanggung Jawab</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nama pemeriksa"
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-rose-500 text-gray-900 text-xs"
              />
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Tanggal Penarikan</label>
              <input
                type="date"
                value={deductionDate}
                onChange={(e) => setDeductionDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-rose-500 text-gray-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Keterangan / Detail Kondisi</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jelaskan alasan dan kondisi fisik..."
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-rose-500 text-gray-900 text-xs"
              />
            </div>
          </div>

          {/* Alert if remaining stock reaches low or zero */}
          {remainingAfter <= (currentSelectedProduct?.stock_minimum || 0) && qtyNumber > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Peringatan Safety Stock:</span> Pengurangan ini akan membuat sisa stok produk ({remainingAfter} unit) berada di bawah batas stok minimum ({currentSelectedProduct.stock_minimum} unit).
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={maxAvailable <= 0}
              className="px-5 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <MinusCircle size={15} />
              <span>Konfirmasi Pengurangan Stok</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
