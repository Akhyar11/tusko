import React, { useState, useEffect } from 'react';
import { X, Boxes, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import TextInput from '../molecules/TextInput';
import { productService } from '../../services/productService';

/**
 * Organism: ProductStockModal
 * Modal pop-up aksi untuk mengelola alokasi stok etalase (Available Stock for Sale)
 * pada produk dan variannya dengan aturan sudut siku tajam (rounded-none).
 */
export default function ProductStockModal({
  isOpen,
  onClose,
  product,
  onSuccess,
  onShowToast,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State alokasi stok per varian atau produk tunggal
  // Format: { [variantIdOrSingle]: number }
  const [allocations, setAllocations] = useState({});

  useEffect(() => {
    if (!product) return;

    setError(null);
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

    if (hasVariants) {
      const initial = {};
      product.variants.forEach((v) => {
        const physicalStock = Number(v.stock ?? 0);
        // Default: jika available_for_sale_stock belum diatur, gunakan physicalStock
        const existingAvailable = v.available_for_sale_stock !== null && v.available_for_sale_stock !== undefined
          ? Number(v.available_for_sale_stock)
          : physicalStock;

        initial[v.id] = Math.min(physicalStock, Math.max(0, existingAvailable));
      });
      setAllocations(initial);
    } else {
      const physicalStock = Number(product.stock ?? 0);
      const existingAvailable = product.available_for_sale_stock !== null && product.available_for_sale_stock !== undefined
        ? Number(product.available_for_sale_stock)
        : physicalStock;

      setAllocations({
        single: Math.min(physicalStock, Math.max(0, existingAvailable)),
      });
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  const handleAllocationChange = (key, value, maxLimit) => {
    const num = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setAllocations((prev) => ({
      ...prev,
      [key]: num === '' ? '' : Math.min(maxLimit, num),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let payload = {};

      if (hasVariants) {
        const variantPayload = product.variants.map((v) => {
          const val = allocations[v.id];
          return {
            id: v.id,
            available_for_sale_stock: val === '' ? 0 : Number(val),
          };
        });
        payload = { variants: variantPayload };
      } else {
        const val = allocations.single;
        payload = {
          available_for_sale_stock: val === '' ? 0 : Number(val),
        };
      }

      const res = await productService.updateAvailableStock(product.id, payload);

      if (onShowToast) {
        onShowToast({
          title: 'Alokasi Stok Berhasil',
          message: `Stok etalase untuk ${product.name} berhasil diperbarui.`,
          type: 'success',
        });
      }

      if (onSuccess) {
        onSuccess(res?.data || res);
      }

      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memperbarui alokasi stok produk.';
      setError(msg);
      if (onShowToast) {
        onShowToast({
          title: 'Gagal Memperbarui Stok',
          message: msg,
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-neutral-300 rounded-none shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-none bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
              <Boxes size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-sport font-black uppercase tracking-tight text-white truncate">
                Manajemen Stok Etalase
              </h2>
              <p className="text-xs text-neutral-400 font-mono truncate">
                {product.name} • SKU: {product.sku || 'N/A'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-none border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Guidance Banner */}
            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-none flex items-start gap-3">
              <Boxes size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-700 space-y-1">
                <p className="font-bold text-neutral-900 font-sport uppercase tracking-wider">
                  Alokasi Kuota Penjualan Storefront
                </p>
                <p className="text-neutral-600 leading-relaxed">
                  Kolom <span className="font-bold text-neutral-900">Stock</span> menunjukkan total fisik nyata di gudang.
                  Kolom <span className="font-bold text-neutral-900">Available Stock for Sale</span> adalah kuantitas yang diizinkan untuk dibeli customer di halaman depan.
                  Syarat: Produk/varian harus memiliki stok fisik terlebih dahulu.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span className="text-xs font-sport font-bold uppercase">{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Tabel List Varian / Produk */}
            <div className="border border-neutral-300 rounded-none overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-950 text-white font-sport font-black uppercase tracking-wider text-[11px] border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Variant Product</th>
                    <th className="py-3 px-4 text-center w-32">Stock (Fisik)</th>
                    <th className="py-3 px-4 text-center w-48">Available Stock for Sale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {hasVariants ? (
                    product.variants.map((v) => {
                      const physicalStock = Number(v.stock ?? 0);
                      const isOutOfStock = physicalStock <= 0;
                      const val = allocations[v.id] ?? '';

                      return (
                        <tr key={v.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-neutral-900">
                            <div className="font-bold font-sport uppercase tracking-tight text-neutral-950 text-xs sm:text-sm">
                              {v.variant_name || v.name || 'Varian Standar'}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                              SKU: {v.sku || '-'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-none border ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                              }`}
                            >
                              {physicalStock} unit
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {isOutOfStock ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-block px-2.5 py-1 text-[10px] font-sport font-black uppercase tracking-wider bg-neutral-200 text-neutral-600 rounded-none border border-neutral-300">
                                  Stok Kosong
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  (Wajib restock fisik)
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <TextInput
                                  type="number"
                                  min={0}
                                  max={physicalStock}
                                  value={val}
                                  onChange={(newVal) => handleAllocationChange(v.id, newVal, physicalStock)}
                                  placeholder="0"
                                  weight="mono"
                                  required
                                  disabled={loading}
                                />
                                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono px-0.5">
                                  <span>Maks: {physicalStock}</span>
                                  {Number(val) === physicalStock && (
                                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                      <CheckCircle2 size={10} /> 100%
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    // Single Product (tanpa varian)
                    (() => {
                      const physicalStock = Number(product.stock ?? 0);
                      const isOutOfStock = physicalStock <= 0;
                      const val = allocations.single ?? '';

                      return (
                        <tr className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-neutral-900">
                            <div className="font-bold font-sport uppercase tracking-tight text-neutral-950 text-xs sm:text-sm">
                              {product.name}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                              SKU: {product.sku || '-'} (Produk Tunggal)
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-none border ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                              }`}
                            >
                              {physicalStock} unit
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {isOutOfStock ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-block px-2.5 py-1 text-[10px] font-sport font-black uppercase tracking-wider bg-neutral-200 text-neutral-600 rounded-none border border-neutral-300">
                                  Stok Kosong
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  (Wajib restock fisik)
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <TextInput
                                  type="number"
                                  min={0}
                                  max={physicalStock}
                                  value={val}
                                  onChange={(newVal) => handleAllocationChange('single', newVal, physicalStock)}
                                  placeholder="0"
                                  weight="mono"
                                  required
                                  disabled={loading}
                                />
                                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono px-0.5">
                                  <span>Maks: {physicalStock}</span>
                                  {Number(val) === physicalStock && (
                                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                      <CheckCircle2 size={10} /> 100%
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })()
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50"
            >
              <Save size={15} />
              <span>{loading ? 'Menyimpan...' : 'Simpan Alokasi Stok'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
